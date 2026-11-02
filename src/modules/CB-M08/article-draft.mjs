// CB-M08-P1-ARTICLE-DRAFT-001: an original article drafted from a topic and the
// collected headlines, with explicit citations.
//
// The model writes new text; it must not reproduce source paragraphs. Every
// claim that rests on a source has to point at one of the supplied items, and
// the owner still reviews the draft before anything is published.

import { chatCompletion } from './provider.mjs';
import { fetchSourceText } from './source-text.mjs';

export const ARTICLE_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const DRAFT_LIMITS = Object.freeze({ title: 140, summary: 400, body: 12000, citations: 6 });

const SYSTEM = [
  'You are a careful crypto news editor writing for CoinBlink.',
  'Write ORIGINAL prose in your own words. Never copy sentences from the sources.',
  'Do not invent numbers, dates, names or quotes. If the sources do not support a claim, omit it.',
  'Reply with a single JSON object and nothing else.',
].join(' ');

/** The system/user pair, so instruct models apply their chat template. */
export function buildArticleMessages({ topic, items, language = 'en', excerpt = '' }) {
  const prompt = buildArticlePrompt({ topic, items, language, excerpt });
  return [
    Object.freeze({ role: 'system', content: SYSTEM }),
    Object.freeze({ role: 'user', content: prompt.slice(SYSTEM.length).trim() }),
  ];
}

/** Builds the prompt from a topic and the collected headlines. */
export function buildArticlePrompt({ topic, items, language = 'en', excerpt = '' }) {
  const clean = String(topic ?? '').trim().slice(0, 200);
  const sources = (Array.isArray(items) ? items : []).slice(0, 5).map((item, index) => ({
    n: index + 1,
    title: String(item.title ?? '').slice(0, 200),
    source: String(item.sourceName ?? ''),
    url: String(item.link ?? ''),
    publishedAt: item.publishedAt ?? null,
  }));
  return [
    SYSTEM,
    'Language: ' + language + '.',
    'Topic: ' + clean,
    'Sources (use their numbers when you cite):',
    ...sources.map((source) => '[' + source.n + '] ' + source.source + ' — ' + source.title + ' (' + source.url + ')'),
    'Return JSON with exactly:',
    '{"title": string (40-120 chars), "summary": string (120-300 chars), "body": string (3-6 paragraphs separated by blank lines, each citation written as [n]), "citations": [{"n": number, "source": string, "url": string}]}',
    'Cite only numbers that exist above. At least one citation is required.',
    ...(String(excerpt ?? '').trim() === '' ? [] : [
      'Publisher page excerpt, for facts only. Paraphrase every sentence in your own structure;',
      'never reproduce more than six consecutive words from it, and never copy a phrase verbatim:',
      String(excerpt).slice(0, 3500),
    ]),
    'Write the JSON object as one line or use \n escapes inside the body string; never put raw line breaks inside a JSON string and never wrap the object in markdown fences.',
  ].join('\n');
}

function text(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Strict parse: a malformed answer becomes `invalid_output` instead of a draft.
 * A citation must point at a supplied source and carry its https URL.
 */
/**
 * Escapes the control characters that make a model answer invalid JSON: raw
 * newlines and tabs inside a string literal. Everything outside strings is
 * left untouched, so this repairs formatting without inventing content.
 */
export function repairJsonText(text) {
  let out = '';
  let inString = false;
  let escaped = false;
  for (const character of String(text ?? '')) {
    if (!inString) {
      if (character === '"') inString = true;
      out += character;
      continue;
    }
    if (escaped) {
      escaped = false;
      out += character;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      out += character;
      continue;
    }
    if (character === '"') {
      inString = false;
      out += character;
      continue;
    }
    if (character === "\n") { out += "\\n"; continue; }
    if (character === "\r") { out += "\\r"; continue; }
    if (character === "\t") { out += "\\t"; continue; }
    out += character;
  }
  return out;
}

/** The first balanced JSON object in the answer, fences and prose ignored. */
export function extractJsonObject(raw) {
  const text = String(raw ?? '').replace(/```[a-z]*\s*/giu, '');
  const start = text.indexOf('{');
  if (start === -1) return '';
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return '';
}

function parseJsonLoose(raw) {
  const slice = extractJsonObject(raw);
  if (slice === '') return null;
  for (const candidate of [slice, repairJsonText(slice), repairJsonText(slice).replace(/,\s*([}\]])/gu, '$1')]) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next repair
    }
  }
  return null;
}

function words(value) {
  return String(value ?? '').toLowerCase().split(/[^a-z0-9]+/u).filter((word) => word !== '');
}

/**
 * The longest run of consecutive words the draft shares with a source title.
 * The model never needs eight words in a row from a headline, so a match means
 * it copied instead of writing.
 */
export function longestSharedSpan(bodyText, sourceTexts) {
  const body = words(bodyText);
  let longest = 0;
  for (const source of Array.isArray(sourceTexts) ? sourceTexts : []) {
    const origin = words(source);
    for (let start = 0; start < origin.length; start += 1) {
      for (let at = 0; at < body.length; at += 1) {
        let run = 0;
        while (start + run < origin.length && at + run < body.length
          && origin[start + run] === body[at + run]) run += 1;
        if (run > longest) longest = run;
      }
    }
  }
  return longest;
}

/**
 * Digits the draft uses that the collected headlines never contained. Citation
 * markers such as [1] are not numbers, and a number is accepted when it appears
 * in any supplied title.
 */
export function unsourcedNumbers(bodyText, sourceTexts) {
  const allowed = new Set();
  const collect = (value) => {
    for (const token of String(value ?? '').match(/\d[\d.,]*/gu) ?? []) {
      allowed.add(token.replace(/[.,]+$/u, '').replaceAll(',', ''));
    }
  };
  for (const source of Array.isArray(sourceTexts) ? sourceTexts : []) collect(source);
  const withoutCitations = String(bodyText ?? '').replace(/\[\d+\]/gu, ' ');
  const missing = new Set();
  for (const token of withoutCitations.match(/\d[\d.,]*/gu) ?? []) {
    const clean = token.replace(/[.,]+$/u, '').replaceAll(',', '');
    if (clean !== '' && !allowed.has(clean)) missing.add(clean);
  }
  return Object.freeze([...missing]);
}

export function parseArticleDraft(raw, { sources, excerpt = '' }) {
  if (typeof raw !== 'string' || raw.trim() === '') return Object.freeze({ status: 'invalid_output', detail: 'empty answer' });
  const parsed = parseJsonLoose(raw);
  if (parsed === null) {
    const answer = String(raw);
    return Object.freeze({
      status: 'invalid_output',
      detail: answer.slice(0, 160) + ' … [' + answer.length + ' chars] … ' + answer.slice(-120),
    });
  }
  const title = text(parsed.title, DRAFT_LIMITS.title);
  const summary = text(parsed.summary, DRAFT_LIMITS.summary);
  const body = text(parsed.body, DRAFT_LIMITS.body);
  if (title.length < 8 || summary.length < 20 || body.length < 60) {
    return Object.freeze({ status: 'invalid_output' });
  }
  // Copying is a hard stop: the article must be written, not reproduced.
  const copied = longestSharedSpan(title + "\n" + summary + "\n" + body,
    (Array.isArray(sources) ? sources : []).map((source) => source.title));
  if (copied >= 8) return Object.freeze({ status: 'copied_text', detail: copied + ' shared words' });
  // Against the publisher page the bar is higher: a dozen words in a row is
  // copying even if no headline was reused.
  const copiedFromPage = String(excerpt ?? '').trim() === '' ? 0 : longestSharedSpan(title + "\n" + summary + "\n" + body, [excerpt]);
  if (copiedFromPage >= 12) return Object.freeze({ status: 'copied_text', detail: copiedFromPage + ' words from the source page' });
  // Numbers are claims too: a figure the headlines never carried is invented.
  const unsourced = unsourcedNumbers(title + "\n" + summary + "\n" + body,
    (Array.isArray(sources) ? sources : []).map((source) => source.title));
  if (unsourced.length > 0) {
    return Object.freeze({ status: 'unsourced_number', detail: unsourced.slice(0, 3).join(', ') });
  }
  const allowed = new Map((Array.isArray(sources) ? sources : []).map((source) => [Number(source.n), source]));
  const citations = [];
  for (const entry of Array.isArray(parsed.citations) ? parsed.citations.slice(0, DRAFT_LIMITS.citations) : []) {
    const source = allowed.get(Number(entry?.n));
    if (source === undefined) continue;
    if (!/^https:\/\//u.test(String(source.url ?? ''))) continue;
    citations.push(Object.freeze({ n: Number(source.n), source: source.source, url: source.url, title: source.title }));
  }
  if (citations.length === 0) return Object.freeze({ status: 'unverified_output' });
  return Object.freeze({
    status: 'drafted',
    draft: Object.freeze({
      title,
      summary,
      body: body + '\n\nSources: ' + citations.map((citation) => '[' + citation.n + '] ' + citation.source + ' — ' + citation.url).join(' '),
      citations: Object.freeze(citations),
      primaryUrl: citations[0].url,
    }),
  });
}

/** Calls Workers AI and parses the answer. Never throws. */
/**
 * @param {{ai?: any, topic?: string, items?: unknown[], language?: string, model?: string,
 *   provider?: {name?: string, baseUrl?: string, apiKey?: string, model?: string} | null}} options
 */
export async function generateArticleDraft({
  ai, topic, items, language = 'en', model = ARTICLE_MODEL, provider = null,
  research = false, researchExcerpt = '', fetchImpl = null,
}) {
  // The external provider can stand alone; Workers AI is only required when no
  // external provider is configured.
  const configured = provider !== null && typeof provider === 'object'
    && provider.name === 'deepseek' && typeof provider.apiKey === 'string' && provider.apiKey !== '';
  if (!configured && (ai === undefined || ai === null || typeof ai.run !== 'function')) {
    return Object.freeze({ status: 'unavailable' });
  }
  const clean = String(topic ?? '').trim();
  if (clean.length < 3) return Object.freeze({ status: 'invalid' });
  const sources = (Array.isArray(items) ? items : []).slice(0, 5).map((item, index) => ({
    n: index + 1, title: String(item.title ?? '').slice(0, 200),
    source: String(item.sourceName ?? ''), url: String(item.link ?? ''),
  }));
  if (sources.length === 0) return Object.freeze({ status: 'no_sources' });
  // An external provider is tried first; any failure falls back to Workers AI
  // and the reason is reported with the draft.
  const external = configured ? provider : null;
  let fallbackReason = null;
  const ask = async (messages) => {
    if (external !== null) {
      const answer = await chatCompletion({
        baseUrl: external.baseUrl, apiKey: external.apiKey, model: external.model,
        messages, maxTokens: 2048, temperature: 0.3,
        fetchImpl: external.fetchImpl, timeoutMs: external.timeoutMs,
      });
      if (answer.status === 'ok') return answer.text;
      fallbackReason = answer.reason;
    }
    // Chat mode applies the instruct template; a plain prompt is the fallback
    // for a model that only exposes text generation.
    // A 3-6 paragraph body does not fit the default token budget, and a
    // truncated answer is not valid JSON, so the budget is explicit.
    const options = { max_tokens: 2048, temperature: 0.3 };
    const textOf = (answer) => {
      const raw = typeof answer === 'string' ? answer : answer?.response;
      return typeof raw === 'string' && raw.trim() !== '' ? raw : null;
    };
    const attempt = async (payload) => {
      try {
        return textOf(await ai.run(model, payload));
      } catch {
        return null;
      }
    };
    // JSON mode first, then plain chat, then a raw prompt: a model that accepts
    // a field but answers nothing must not end the request with an empty draft.
    return (await attempt({ messages, ...options, response_format: { type: 'json_object' } }))
      ?? (await attempt({ messages, ...options }))
      ?? (await attempt({ prompt: messages.map((message) => message.content).join('\n'), ...options }));
  };
  // Research reads the publisher page of the first source and hands the model
  // an excerpt as evidence. A failed fetch never blocks the draft.
  let excerpt = String(researchExcerpt ?? '').trim();
  let researchStatus = excerpt === '' ? 'off' : 'source';
  if (excerpt === '' && research === true && sources.length > 0) {
    const fetched = await fetchSourceText({ url: sources[0].url, fetchImpl: fetchImpl ?? undefined });
    if (fetched.status === 'ok') { excerpt = fetched.text; researchStatus = 'source'; }
    else researchStatus = fetched.reason;
  }
  try {
    const messages = buildArticleMessages({ topic: clean, items, language, excerpt });
    const firstRaw = await ask(messages);
    if (firstRaw === null) return Object.freeze({ status: 'unavailable' });
    const first = parseArticleDraft(firstRaw, { sources, excerpt });
    if (first.status !== 'invalid_output' && first.status !== 'copied_text' && first.status !== 'unsourced_number') return withMeta(first);
    // One retry with the same sources and an explicit reminder, for the two
    // answers a retry can actually fix: malformed JSON and copied headlines.
    const second = parseArticleDraft(await ask([
      ...messages,
      Object.freeze({ role: 'assistant', content: String(first.detail ?? '') }),
      Object.freeze({
        role: 'user',
        content: first.status === 'copied_text'
          ? 'Do not reuse words from the headlines. Rewrite the story in your own words, keep the citations, and reply with only the JSON object.'
          : first.status === 'unsourced_number'
            ? 'Remove every number that does not appear in the headlines. Keep the citations and reply with only the JSON object.'
            : 'That was not valid JSON. Reply with only the JSON object, with escaped line breaks.',
      }),
    ]), { sources, excerpt });
    return withMeta(second);
  } catch {
    return Object.freeze({ status: 'unavailable', fallback: fallbackReason });
  }

  function withMeta(result) {
    return Object.freeze({
      ...result,
      provider: external === null ? 'workers-ai' : 'deepseek',
      fallback: external === null ? null : fallbackReason,
      research: researchStatus,
    });
  }
}
