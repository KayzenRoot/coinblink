// CB-M08-P1-ARTICLE-DRAFT-001: an original article drafted from a topic and the
// collected headlines, with explicit citations.
//
// The model writes new text; it must not reproduce source paragraphs. Every
// claim that rests on a source has to point at one of the supplied items, and
// the owner still reviews the draft before anything is published.

export const ARTICLE_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';
export const DRAFT_LIMITS = Object.freeze({ title: 140, summary: 400, body: 12000, citations: 6 });

const SYSTEM = [
  'You are a careful crypto news editor writing for CoinBlink.',
  'Write ORIGINAL prose in your own words. Never copy sentences from the sources.',
  'Do not invent numbers, dates, names or quotes. If the sources do not support a claim, omit it.',
  'Reply with a single JSON object and nothing else.',
].join(' ');

/** Builds the prompt from a topic and the collected headlines. */
export function buildArticlePrompt({ topic, items, language = 'en' }) {
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

export function parseArticleDraft(raw, { sources }) {
  if (typeof raw !== 'string' || raw.trim() === '') return Object.freeze({ status: 'invalid_output' });
  const parsed = parseJsonLoose(raw);
  if (parsed === null) return Object.freeze({ status: 'invalid_output' });
  const title = text(parsed.title, DRAFT_LIMITS.title);
  const summary = text(parsed.summary, DRAFT_LIMITS.summary);
  const body = text(parsed.body, DRAFT_LIMITS.body);
  if (title.length < 8 || summary.length < 20 || body.length < 60) {
    return Object.freeze({ status: 'invalid_output' });
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
export async function generateArticleDraft({ ai, topic, items, language = 'en', model = ARTICLE_MODEL }) {
  if (ai === undefined || ai === null || typeof ai.run !== 'function') return Object.freeze({ status: 'unavailable' });
  const clean = String(topic ?? '').trim();
  if (clean.length < 3) return Object.freeze({ status: 'invalid' });
  const sources = (Array.isArray(items) ? items : []).slice(0, 5).map((item, index) => ({
    n: index + 1, title: String(item.title ?? '').slice(0, 200),
    source: String(item.sourceName ?? ''), url: String(item.link ?? ''),
  }));
  if (sources.length === 0) return Object.freeze({ status: 'no_sources' });
  const ask = async (prompt) => {
    const answer = await ai.run(model, { prompt });
    return typeof answer === 'string' ? answer : answer?.response;
  };
  try {
    const prompt = buildArticlePrompt({ topic: clean, items, language });
    const first = parseArticleDraft(await ask(prompt), { sources });
    if (first.status !== 'invalid_output') return first;
    // One retry with the same sources and an explicit reminder: a malformed
    // answer costs one call, and the owner still reviews whatever comes back.
    const second = parseArticleDraft(await ask(prompt + "\nReturn only the JSON object, with escaped line breaks."), { sources });
    return second;
  } catch {
    return Object.freeze({ status: 'unavailable' });
  }
}
