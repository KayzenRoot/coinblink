import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildArticlePrompt, generateArticleDraft, parseArticleDraft } from '../../../src/modules/CB-M08/article-draft.mjs';

const ITEMS = [
  { title: 'Bitcoin ETF inflows hit a record in October', sourceName: 'CoinDesk', link: 'https://a.example/1', publishedAt: '2026-11-01T10:00:00Z' },
  { title: 'Regulators publish exchange guidance', sourceName: 'Cointelegraph', link: 'https://b.example/2', publishedAt: null },
];
const SOURCES = ITEMS.map((item, index) => ({ n: index + 1, title: item.title, source: item.sourceName, url: item.link }));
const GOOD = {
  title: 'Bitcoin ETF inflows reach a record in October',
  summary: 'Inflows into spot bitcoin funds reached a record in October, according to the collected reporting.',
  body: 'First paragraph with a citation [1].\n\nSecond paragraph about guidance [2].',
  citations: [{ n: 1, source: 'CoinDesk', url: 'https://a.example/1' }],
};

test('the prompt carries the topic, the sources and the JSON contract', () => {
  const prompt = buildArticlePrompt({ topic: 'bitcoin etf', items: ITEMS, language: 'pt-br' });
  assert.match(prompt, /Topic: bitcoin etf/u);
  assert.match(prompt, /\[1\] CoinDesk/u);
  assert.match(prompt, /\[2\] Cointelegraph/u);
  assert.match(prompt, /Language: pt-br/u);
  assert.match(prompt, /Never copy sentences/u);
  assert.match(prompt, /single JSON object/u);
});

test('a valid answer becomes a draft with citations and a primary url', () => {
  const result = parseArticleDraft(JSON.stringify(GOOD), { sources: SOURCES });
  assert.equal(result.status, 'drafted');
  assert.equal(result.draft.primaryUrl, 'https://a.example/1');
  assert.match(result.draft.body, /Sources: \[1\] CoinDesk — https:\/\/a\.example\/1/u);
  assert.equal(result.draft.citations.length, 1);
});

test('a citation that does not exist or is not https is refused', () => {
  const unknown = parseArticleDraft(JSON.stringify({ ...GOOD, citations: [{ n: 9 }] }), { sources: SOURCES });
  assert.equal(unknown.status, 'unverified_output');
  const insecure = parseArticleDraft(JSON.stringify(GOOD), {
    sources: [{ n: 1, title: 't', source: 'x', url: 'http://plain.example' }],
  });
  assert.equal(insecure.status, 'unverified_output');
});

test('malformed or thin answers never become drafts', () => {
  assert.equal(parseArticleDraft('', { sources: SOURCES }).status, 'invalid_output');
  assert.equal(parseArticleDraft('not json at all', { sources: SOURCES }).status, 'invalid_output');
  assert.equal(parseArticleDraft(JSON.stringify({ ...GOOD, body: 'short' }), { sources: SOURCES }).status, 'invalid_output');
  assert.equal(parseArticleDraft(JSON.stringify({ ...GOOD, title: 'tiny' }), { sources: SOURCES }).status, 'invalid_output');
});

test('generation fails closed without an AI binding or without sources', async () => {
  assert.equal((await generateArticleDraft({ ai: null, topic: 'bitcoin', items: ITEMS })).status, 'unavailable');
  const ai = { run: async () => ({ response: JSON.stringify(GOOD) }) };
  assert.equal((await generateArticleDraft({ ai, topic: 'bitcoin', items: [] })).status, 'no_sources');
  assert.equal((await generateArticleDraft({ ai, topic: 'bt', items: ITEMS })).status, 'invalid');
  const ok = await generateArticleDraft({ ai, topic: 'bitcoin etf', items: ITEMS });
  assert.equal(ok.status, 'drafted');
});

test('the admin screen offers the topic form and never publishes on its own', () => {
  const page = readFileSync('src/modules/CB-M05/p1-production/articles.mjs', 'utf8');
  assert.ok(page.includes('action="/admin/articles/generate"'));
  assert.ok(page.includes('the result is a draft you review, never a published article'));
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ["path === '/admin/articles/generate'", 'generateArticleDraft', 'createDraft(']) {
    assert.ok(route.includes(marker), marker);
  }
});

test('a fenced answer and raw line breaks inside the body still become a draft', async () => {
  const { extractJsonObject, repairJsonText } = await import('../../../src/modules/CB-M08/article-draft.mjs');
  const fenced = 'Here is the draft:\n```json\n' + JSON.stringify(GOOD) + '\n```\nDone.';
  assert.equal(parseArticleDraft(fenced, { sources: SOURCES }).status, 'drafted');
  // A real newline inside a JSON string is invalid JSON; the repair escapes it.
  const rawNewline = '{"title":"' + GOOD.title + '","summary":"' + GOOD.summary + '","body":"' + GOOD.body + '","citations":[{"n":1,"source":"CoinDesk","url":"https://a.example/1"}]}';
  assert.equal(JSON.parse.bind(JSON, rawNewline) instanceof Function, true);
  assert.equal(repairJsonText('{"a":"x' + '\n' + 'y"}').includes('x\\ny'), true);
  assert.equal(parseArticleDraft(rawNewline, { sources: SOURCES }).status, 'drafted');
  assert.equal(extractJsonObject('no object here'), '');
  assert.equal(extractJsonObject('{"a":{"b":1}} trailing'), '{"a":{"b":1}}');
});

test('a malformed first answer is retried once and the second is used', async () => {
  let calls = 0;
  const ai = {
    async run() {
      calls += 1;
      if (calls === 1) return { response: 'I am sorry, I cannot answer in JSON.' };
      return { response: JSON.stringify(GOOD) };
    },
  };
  const result = await generateArticleDraft({ ai, topic: 'bitcoin etf', items: ITEMS });
  assert.equal(result.status, 'drafted');
  assert.equal(calls, 2);
  const alwaysBad = { async run() { calls += 1; return { response: 'still prose' }; } };
  calls = 0;
  assert.equal((await generateArticleDraft({ ai: alwaysBad, topic: 'bitcoin etf', items: ITEMS })).status, 'invalid_output');
  assert.equal(calls, 2, 'the retry happens exactly once');
});

test('an unparseable answer carries a short detail for the owner screen', async () => {
  const result = parseArticleDraft('I cannot help with that request.', { sources: SOURCES });
  assert.equal(result.status, 'invalid_output');
  assert.match(result.detail, /cannot help/u);
  assert.match(result.detail, /chars\]/u);
  const empty = parseArticleDraft('', { sources: SOURCES });
  assert.equal(empty.detail, 'empty answer');
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  assert.match(route, /Model said: /u);
});

test('the call reserves a token budget large enough for the body', async () => {
  const calls = [];
  const ai = { async run(model, options) { calls.push({ model, options }); return { response: JSON.stringify(GOOD) }; } };
  const result = await generateArticleDraft({ ai, topic: 'bitcoin etf', items: ITEMS });
  assert.equal(result.status, 'drafted');
  assert.equal(calls[0].options.max_tokens, 2048);
  assert.equal(typeof calls[0].options.temperature, 'number');
  assert.ok(Array.isArray(calls[0].options.messages));
});
