import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertWorkerPreviewConfig } from '../../../scripts/worker-preview-config-safety.mjs';
import {
  RESEARCH_LIMITS, RESEARCH_MODEL, buildPrompt, generateResearch, normalizeFocus, parseResearchOutput,
  researchListPage, researchNotePage, sourceForDraft, verifyEvidence,
} from '../../../src/modules/CB-M08/research.mjs';

const UUID = '11111111-1111-4111-8111-111111111111';
const DRAFT = Object.freeze({
  id: UUID,
  revision: 2,
  title: 'Bitcoin miners add reserves',
  summary: 'Miners are holding more coins than they mine, according to the draft.',
  body: 'The draft notes that miners added 4,000 BTC to reserves in the last quarter while hash rate stayed flat. '
    + 'Analysts quoted in the draft expect the trend to continue.',
});
const QUOTE = 'miners added 4,000 BTC to reserves in the last quarter';
const ANSWER = Object.freeze({
  summary: 'Miners built reserves while hash rate stayed flat.',
  impact: 'Supply on exchanges may tighten if the pattern continues.',
  questions: ['What is the source for the 4,000 BTC figure?', 'Does the hash-rate claim have a date?', 'Who are the quoted analysts?'],
  evidence: [{ quote: QUOTE, why: 'Quantifies the reserve build described in the draft.' }],
});

function fakeDb({ used = 0, changes = 1 } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return {
            first: async () => (sql.includes('COUNT(*)') ? { used } : null),
            run: async () => ({ meta: { changes } }),
          };
        },
      };
    },
  };
}

function fakeAi(response = ANSWER) {
  const seen = [];
  return {
    seen,
    run: async (model, input) => {
      seen.push({ model, input });
      return { response: typeof response === 'string' ? response : JSON.stringify(response) };
    },
  };
}

test('the prompt is bounded and allows only the selected draft as a source', () => {
  const prompt = buildPrompt({ draft: DRAFT, focus: 'Stress the supply impact', language: 'pt-br' });
  assert.match(prompt.system, /Use only the draft text/u);
  assert.match(prompt.system, /Brazilian Portuguese/u);
  assert.match(prompt.user, new RegExp(QUOTE, 'u'));
  assert.match(prompt.user, /Editor focus: Stress the supply impact/u);
  assert.match(buildPrompt({ draft: DRAFT, focus: '', language: 'en' }).user, /General editorial review/u);
  assert.equal(sourceForDraft({ ...DRAFT, body: 'x'.repeat(RESEARCH_LIMITS.sourceMax * 2) }).length,
    RESEARCH_LIMITS.sourceMax);
  assert.throws(() => normalizeFocus('x'.repeat(RESEARCH_LIMITS.focusMax + 1)), /focus/u);
});

test('the parser accepts fenced JSON and rejects a malformed shape', () => {
  const fenced = '```json\n' + JSON.stringify(ANSWER) + '\n```';
  assert.deepEqual(parseResearchOutput(fenced), {
    summary: ANSWER.summary,
    impact: ANSWER.impact,
    questions: ANSWER.questions,
    evidence: [{ quote: QUOTE, why: ANSWER.evidence[0].why }],
  });
  assert.equal(parseResearchOutput('not json'), null);
  assert.equal(parseResearchOutput(''), null);
  assert.equal(parseResearchOutput(JSON.stringify({ ...ANSWER, summary: '' })), null);
  assert.equal(parseResearchOutput(JSON.stringify({ ...ANSWER, questions: [] })), null);
  assert.equal(parseResearchOutput(JSON.stringify({ ...ANSWER, evidence: [] })), null);
  assert.equal(parseResearchOutput(JSON.stringify({
    ...ANSWER, evidence: [{ quote: 'too short', why: 'x' }],
  })), null);
});

test('evidence survives only when it appears verbatim in the draft', () => {
  const parsed = parseResearchOutput(JSON.stringify({
    ...ANSWER,
    evidence: [
      { quote: QUOTE, why: 'real' },
      { quote: 'miners added 40,000 BTC to reserves in the last quarter', why: 'hallucinated' },
      { quote: 'The   draft notes that miners added 4,000 BTC to reserves', why: 'spacing' },
      { quote: QUOTE, why: 'duplicate' },
    ],
  }));
  const verified = verifyEvidence({ output: parsed, source: sourceForDraft(DRAFT) });
  assert.equal(verified.kept, 2);
  assert.equal(verified.dropped, 2);
  assert.deepEqual(verified.output.evidence.map((entry) => entry.why), ['real', 'spacing']);
  const none = verifyEvidence({ output: parsed, source: 'a different text entirely, with no overlap at all' });
  assert.equal(none.output, null);
});

test('a generated note is stored only after the evidence check', async () => {
  const db = fakeDb();
  const ai = fakeAi();
  const result = await generateResearch({
    db, ai, draft: DRAFT, focus: '', language: 'en', nowMs: 1_800_000_000_000,
  });
  assert.equal(result.status, 'created');
  assert.equal(result.note.draftRevision, 2);
  assert.equal(result.note.evidence.length, 1);
  assert.equal(ai.seen.length, 1);
  assert.equal(ai.seen[0].model, RESEARCH_MODEL);
  assert.equal(ai.seen[0].input.messages[0].role, 'system');
  assert.match(ai.seen[0].input.messages[1].content, /Bitcoin miners add reserves/u);
  assert.equal(db.calls.filter((call) => call.sql.includes('INSERT INTO')).length, 1);
});

test('the daily cap stops the call before the model runs', async () => {
  const db = fakeDb({ used: RESEARCH_LIMITS.dailyCap });
  const ai = { run: async () => { throw new Error('must not run'); } };
  const result = await generateResearch({ db, ai, draft: DRAFT, focus: '', language: 'en', nowMs: 1_800_000_000_000 });
  assert.equal(result.status, 'capped');
  assert.equal(db.calls.filter((call) => call.sql.includes('INSERT INTO')).length, 0);
});

test('missing AI, invalid output and unverified output never write a note', async () => {
  const nowMs = 1_800_000_000_000;
  assert.equal((await generateResearch({ db: fakeDb(), ai: null, draft: DRAFT, focus: '', language: 'en', nowMs })).status,
    'unavailable');
  assert.equal((await generateResearch({ db: fakeDb(), ai: fakeAi('not json'), draft: DRAFT, focus: '', language: 'en', nowMs })).status,
    'invalid_output');
  const db = fakeDb();
  const invented = { ...ANSWER, evidence: [{ quote: 'a sentence that is not in the draft at all', why: 'x' }] };
  assert.equal((await generateResearch({ db, ai: fakeAi(invented), draft: DRAFT, focus: '', language: 'en', nowMs })).status,
    'unverified_output');
  assert.equal(db.calls.filter((call) => call.sql.includes('INSERT INTO')).length, 0);
});

test('the pages render the note and keep publishing out of reach', async () => {
  const list = researchListPage({
    drafts: [DRAFT], notes: [], csrf: 'a'.repeat(64), used: 0,
  });
  assert.equal(list.status, 200);
  const listBody = await list.text();
  assert.match(listBody, /Generate research note/u);
  assert.match(listBody, /Notes today/u);
  assert.match(listBody, /Nothing is published or scheduled/u);
  assert.doesNotMatch(listBody, /publish now|schedule post/iu);

  const note = researchNotePage({
    note: { ...ANSWER, id: UUID, draftId: UUID, draftRevision: 2, model: RESEARCH_MODEL, language: 'en', focus: '', createdAt: 1 },
    csrf: 'b'.repeat(64),
  });
  assert.equal(note.status, 200);
  const noteBody = await note.text();
  assert.match(noteBody, /Evidence from the draft/u);
  assert.match(noteBody, /miners added 4,000 BTC/u);
  assert.match(noteBody, /Not published, not scheduled/u);
});

test('the admin route exposes the research desk and the reviewed AI binding', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ['/admin/research', 'generateResearch', 'researchListPage', 'researchNotePage',
    "runtimeBinding('AI')"]) {
    assert.ok(route.includes(marker), marker);
  }
  assert.doesNotMatch(route, /publish|schedule/iu);
});

test('the Worker config allows exactly the reviewed AI binding', () => {
  const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
  assert.equal(config.ai.binding, 'AI');
  assert.deepEqual(Object.keys(config.ai), ['binding']);
  assert.equal(assertWorkerPreviewConfig(config, 'wrangler.jsonc'), undefined);
  for (const changed of [
    { ...config, ai: { binding: 'AI', remote: true } },
    { ...config, ai: { binding: 'OTHER' } },
    { ...config, ai: [] },
    { ...config, analytics_engine_datasets: [{ binding: 'AE' }] },
  ]) {
    assert.throws(() => assertWorkerPreviewConfig(changed, 'wrangler.jsonc'));
  }
});
