import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPersistedDraftMarkdown,
  parseLocalDraftMarkdown,
} from '../../../src/modules/CB-M05/local-draft-markdown.mjs';
import {
  MAX_LOCAL_ARTICLE_BYTES,
  parseLocalArticlePreview,
} from '../../../src/modules/CB-M02/local-article-preview.client.mjs';

const persisted = Object.freeze({
  title: 'A persisted Unicode draft — exact bytes',
  status: 'draft',
  author_label: 'Owner synthetic',
  summary: 'A saved summary that remains explicitly unverified and local only.',
  body: 'Saved prose with <script> and Markdown-looking text stays inert during preview.',
  source_url: 'https://example.test/original-story',
});

test('M05 persisted draft exports and parses the exact canonical fields without private session metadata', () => {
  const result = createPersistedDraftMarkdown(persisted);
  const parsed = parseLocalDraftMarkdown(result.markdown);

  assert.equal(parsed.title, persisted.title);
  assert.equal(parsed.author, persisted.author_label);
  assert.equal(parsed.summary, persisted.summary);
  assert.equal(parsed.body, persisted.body);
  assert.equal(parsed.source, persisted.source_url);
  assert.ok(result.byteLength <= MAX_LOCAL_ARTICLE_BYTES);
  assert.equal(Buffer.byteLength(result.markdown, 'utf8'), result.byteLength);
  assert.match(result.filename, /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u);
  assert.match(result.markdown, /WORKING DRAFT ONLY\. Not checked, approved, or published\./u);
  assert.match(result.markdown, /Check reuse rights and attribution/u);
  assert.doesNotMatch(result.markdown, /session|csrf|credential|token|privateKey/iu);
});

test('M05 canonical export rejects CMS content that would be trimmed or truncated instead of changing it', () => {
  assert.throws(() => createPersistedDraftMarkdown({ ...persisted, body: ' ' + persisted.body }), /canonical Markdown/u);
  assert.throws(() => createPersistedDraftMarkdown({ ...persisted, body: 'A'.repeat(12_001) }), /canonical Markdown/u);
  assert.throws(() => createPersistedDraftMarkdown({ ...persisted, source_url: 'http://example.test/story' }), /canonical Markdown/u);
});

test('M02 parser enforces 64,000 UTF-8 bytes, not JavaScript code units', () => {
  const multibyteText = '界'.repeat(21_334);
  assert.ok(multibyteText.length < MAX_LOCAL_ARTICLE_BYTES);
  assert.ok(Buffer.byteLength(multibyteText, 'utf8') > MAX_LOCAL_ARTICLE_BYTES);
  assert.throws(() => parseLocalDraftMarkdown(multibyteText), /oversized/u);
  assert.throws(() => parseLocalArticlePreview('draft.md', 10, multibyteText), /Invalid local/u);
});
