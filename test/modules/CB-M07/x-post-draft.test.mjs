import test from 'node:test';
import assert from 'node:assert/strict';
import { createSyntheticXPostDraft } from '../../../src/modules/CB-M07/x-post-draft.mjs';

const article = Object.freeze({
  id: '00000000-0000-0000-0000-000000000001', revision: 2,
  title: 'Fictional protocol briefing for local testing',
  summary: 'This invented editorial example is not a report about any actual market event.',
  articleUrl: 'https://coinblink.example.test/news/fictional-briefing',
  sourceUrl: 'https://publisher.example.test/articles/fictional-briefing',
  mode: 'LOCAL_SYNTHETIC', status: 'draft', rights: 'NOT_CLEARED',
});
const compose = (row = article) => createSyntheticXPostDraft(row);

test('creates a text-only, frozen X preview with immutable private reference and no publishing capability', () => {
  const post = compose();
  assert.equal(post.channel, 'x');
  assert.equal(post.mode, 'LOCAL_SYNTHETIC');
  assert.equal(post.status, 'DRAFT_ONLY');
  assert.equal(post.rights, 'NOT_CLEARED');
  assert.equal(post.approval, 'NOT_GRANTED');
  assert.equal(post.publishingStatus, 'DISABLED');
  assert.equal(post.canPublish, false);
  assert.equal(post.canPostToX, false);
  assert.equal(post.publiclyUsable, false);
  assert.deepEqual(post.reference, {
    articleId: article.id, articleRevision: 2, articleUrl: article.articleUrl,
    originalSourceUrl: article.sourceUrl,
  });
  assert.ok(Object.isFrozen(post));
  assert.ok(Object.isFrozen(post.reference));
  assert.equal(post.text, article.title + '\n\n' + article.summary + '\n\n' + article.articleUrl);
  assert.ok([...post.text].length <= 240);
});

test('stable SHA-256 identity for equivalent content, distinct for revisions, copy or source', () => {
  const original = compose();
  assert.match(original.identityKey, /^cb-m07-x-v1:[0-9a-f]{64}$/u);
  assert.equal(original.identityKey, compose({ ...article }).identityKey);
  assert.notEqual(original.identityKey, compose({ ...article, revision: 3 }).identityKey);
  assert.notEqual(original.identityKey, compose({ ...article, summary: article.summary + ' Synthetic.' }).identityKey);
  assert.notEqual(original.identityKey, compose({ ...article, sourceUrl: 'https://publisher.example.test/articles/another-story' }).identityKey);
  assert.notEqual(original.identityKey, compose({ ...article, id: '00000000-0000-0000-0000-000000000002' }).identityKey);
});

test('rejects publication or rights grants injected into the supposedly synthetic article', () => {
  for (const added of [
    { approved: true }, { publishable: true }, { canPublish: true },
    { canPostToX: true }, { ownerApproved: true }, { rightsRef: 'APPROVED' },
    { credential: 'should-never-leak' }, { token: 'secret' }, { channel: 'x' },
    { publication: 'ENABLED' }, { mode: 'LIVE' }, { status: 'published' },
    { rights: 'CLEARED' },
  ]) assert.throws(() => compose({ ...article, ...added }), TypeError, JSON.stringify(added));
});

test('rejects incomplete or forged article identity, revision and presentation fields', () => {
  for (const row of [null, undefined, [], 'x', 1, {}, Object.create(null),
    { ...article, id: '' }, { ...article, id: '../unsafe' },
    { ...article, id: article.id.toUpperCase() },
    { ...article, revision: 0 }, { ...article, revision: -1 },
    { ...article, revision: 1.5 }, { ...article, revision: Number.MAX_SAFE_INTEGER + 1 },
    { ...article, title: null }, { ...article, summary: null },
    { ...article, summary: '' }, { ...article, title: 'short' },
    { ...article, title: ' ' + article.title },
    { ...article, summary: article.summary + ' ' },
  ]) assert.throws(() => compose(row), TypeError);
});

test('rejects HTML and unsafe text controls including bidirectional override', () => {
  for (const text of ['hello\nworld', 'secret\rtitle', '<script>alert(1)</script>',
    'Unicode \u202Eoverride', 'Null \u0000inject', 'Zero \u200bwidth']) {
    assert.throws(() => compose({ ...article, title: article.title + text }), TypeError);
    assert.throws(() => compose({ ...article, summary: article.summary + text }), TypeError);
  }
});

test('rejects overly long individual text and total 240-codepoint budget, without silent factual truncation', () => {
  assert.throws(() => compose({ ...article, title: 'A'.repeat(101) }), TypeError);
  assert.throws(() => compose({ ...article, summary: 'B'.repeat(131) }), TypeError);
  const longerArticleUrl = 'https://coinblink.example.test/news/' + 'a'.repeat(78);
  assert.throws(() => compose({ ...article, articleUrl: longerArticleUrl }), RangeError);
});

test('rejects noncanonical or non-demo article URLs and source references', () => {
  for (const articleUrl of [
    'http://coinblink.example.test/news/fictional-briefing',
    'https://coinblink.example.test.evil.com/news/fictional-briefing',
    'https://realcoinblink.com/news/fictional-briefing',
    'https://user:password@coinblink.example.test/news/fictional-briefing',
    'https://coinblink.example.test:8443/news/fictional-briefing',
    'https://coinblink.example.test/news/%2e%2e/private',
    'https://coinblink.example.test/admin/fictional-briefing',
    'https://coinblink.example.test/news/fictional-briefing#fragment',
    'https://coinblink.example.test/news/fictional-briefing?approved=1',
    'https://coinblink.example.test/news/../private',
  ]) assert.throws(() => compose({ ...article, articleUrl }), TypeError, articleUrl);
  for (const sourceUrl of [
    'http://publisher.example.test/articles/fictional-briefing',
    'https://localhost/articles/fictional-briefing',
    'https://publisher.example.test.evil.org/articles/fictional-briefing',
    'https://publisher.example.test/other/fictional-briefing',
    'https://publisher.example.test/articles/fictional-briefing#hash',
    'https://publisher.example.test/articles/fictional-briefing?token=abc',
  ]) assert.throws(() => compose({ ...article, sourceUrl }), TypeError, sourceUrl);
});

test('respects Unicode codepoint counting, without creating a real posting contract', () => {
  const withEmoji = compose({ ...article, title: 'Fictional briefing ' + '📰'.repeat(15) });
  assert.ok([...withEmoji.text].length <= 240);
  assert.equal(withEmoji.approval, 'NOT_GRANTED');
  assert.equal(withEmoji.canPostToX, false);
});

test('cannot call accessor getters or accept exotic prototypes', () => {
  const evil = { ...article };
  Object.defineProperty(evil, 'title', { enumerable: true, get() { throw new Error('getter ran'); } });
  assert.throws(() => compose(evil), TypeError);
  const proto = Object.assign(Object.create(null), article);
  assert.throws(() => compose(proto), TypeError);
  class ForgedArticle { constructor() { Object.assign(this, article); } }
  assert.throws(() => compose(new ForgedArticle()), TypeError);
});

test('does not mutate caller data or disclose unrelated private fields', () => {
  const snapshot = structuredClone(article);
  const result = compose();
  assert.deepEqual(article, snapshot);
  assert.ok(!('session' in result) && !('token' in result) && !('secret' in result));
  assert.doesNotMatch(JSON.stringify(result), /privateKey|credential|oauth|Bearer/iu);
});
