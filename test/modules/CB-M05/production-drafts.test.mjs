import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createDraft, draftMarkdown, draftsPage, updateDraft, validateDraft,
} from '../../../src/modules/CB-M05/p1-production/drafts.mjs';

const VALID = Object.freeze({
  title: 'A valid headline for the draft',
  summary: 'A summary that is long enough to pass the contract.',
  body: 'The body of a private draft.',
  sourceUrl: 'https://example.test/story',
  authorLabel: 'Owner',
});
const SECRET = 'a'.repeat(64);
const UUID = '11111111-1111-4111-8111-111111111111';

test('draft validation bounds every field and requires HTTPS', () => {
  assert.deepEqual(validateDraft(VALID), VALID);
  assert.throws(() => validateDraft({ ...VALID, title: 'short' }), /title/u);
  assert.throws(() => validateDraft({ ...VALID, summary: 'short' }), /summary/u);
  assert.throws(() => validateDraft({ ...VALID, body: '   ' }), /body/u);
  assert.throws(() => validateDraft({ ...VALID, sourceUrl: 'http://example.test/story' }), /HTTPS/u);
  assert.throws(() => validateDraft({ ...VALID, sourceUrl: 'not a url' }), /HTTPS/u);
  assert.throws(() => validateDraft({ ...VALID, authorLabel: 'x'.repeat(121) }), /author/u);
});

test('the Markdown export marks the draft as unpublished', () => {
  const markdown = draftMarkdown({ ...VALID, revision: 2 });
  assert.match(markdown, /^# A valid headline/mu);
  assert.match(markdown, /Revision: 2/u);
  assert.match(markdown, /Status: DRAFT — NOT PUBLISHED/u);
  assert.match(markdown, /Source: https:\/\/example\.test\/story/u);
});

test('create and update use the batch contract and enforce the revision CAS', async () => {
  const batches = [];
  const createDb = {
    prepare: () => ({ bind: () => ({}) }),
    batch: async (statements) => { batches.push(statements); return statements.map(() => ({ meta: { changes: 1 } })); },
  };
  const id = await createDraft({ db: createDb, secret: SECRET, input: VALID, now: 1000 });
  assert.match(id, /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u);
  assert.equal(batches[0].length, 2);

  const current = { ...VALID, id: UUID, status: 'draft', revision: 1, createdAt: 1, updatedAt: 1 };
  const updateDb = {
    prepare: () => ({ bind: () => ({ first: async () => current }) }),
    batch: async (statements) => statements.map(() => ({ meta: { changes: 1 } })),
  };
  const saved = await updateDraft({ db: updateDb, input: { ...VALID, id: UUID, revision: 1 }, now: 2 });
  assert.equal(saved.status, 'saved');
  assert.equal(saved.draft.revision, 2);
  const conflict = await updateDraft({ db: updateDb, input: { ...VALID, id: UUID, revision: 9 }, now: 3 });
  assert.equal(conflict.status, 'conflict');
});

test('the drafts page lists private drafts and keeps the sign-out form', async () => {
  const response = draftsPage({ drafts: [{ id: UUID, title: 'Draft title', revision: 1, status: 'draft' }], csrf: 'b'.repeat(64) });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /Draft title/u);
  assert.match(body, /revision 1/u);
  assert.match(body, /\/admin\/logout/u);
  assert.match(body, /name="csrf"/u);
});

test('the admin route exposes drafts and never a publish action', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ['/admin/drafts', 'createDraft', 'updateDraft', 'draftFormPage',
    'draftRevisionsPage', 'draftMarkdown']) {
    assert.ok(route.includes(marker), marker);
  }
  assert.doesNotMatch(route, /publish|schedule/iu);
});
