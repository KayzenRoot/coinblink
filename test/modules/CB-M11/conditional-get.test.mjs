import test from 'node:test';
import assert from 'node:assert/strict';
import { conditionalResponse, matchesIfNoneMatch, strongEtag } from '../../../src/modules/CB-M11/conditional-get.mjs';

test('the etag is quoted, deterministic and changes with the body', () => {
  const first = strongEtag('{"status":"ok"}');
  assert.equal(first, strongEtag('{"status":"ok"}'));
  assert.match(first, /^"[0-9a-f]{8}-[0-9a-f]+"$/u);
  assert.notEqual(first, strongEtag('{"status":"disabled"}'));
  assert.notEqual(strongEtag('ab'), strongEtag('ba'));
  assert.throws(() => strongEtag(null), TypeError);
});

test('If-None-Match accepts exact, list, weak and wildcard validators', () => {
  const etag = strongEtag('body');
  assert.equal(matchesIfNoneMatch(etag, etag), true);
  assert.equal(matchesIfNoneMatch('"other", ' + etag, etag), true);
  assert.equal(matchesIfNoneMatch('W/' + etag, etag), true);
  assert.equal(matchesIfNoneMatch('*', etag), true);
  assert.equal(matchesIfNoneMatch('"other"', etag), false);
  assert.equal(matchesIfNoneMatch('', etag), false);
  assert.equal(matchesIfNoneMatch(undefined, etag), false);
  assert.equal(matchesIfNoneMatch(etag, ''), false);
  assert.equal(matchesIfNoneMatch(etag, undefined), false);
});

test('the shared response helper returns 200, 304 and a wrong-validator 200', () => {
  const headers = { "content-type": "application/json" };
  const first = conditionalResponse('{"a":1}', { headers: new Headers() }, headers);
  assert.equal(first.status, 200);
  const etag = first.headers.get("etag");
  assert.ok(etag);
  const second = conditionalResponse('{"a":1}', { headers: new Headers({ "if-none-match": etag }) }, headers);
  assert.equal(second.status, 304);
  assert.equal(second.headers.get("etag"), etag);
  assert.equal(second.body, null);
  const third = conditionalResponse('{"a":1}', { headers: new Headers({ "if-none-match": '"nope"' }) }, headers);
  assert.equal(third.status, 200);
  assert.throws(() => conditionalResponse(null, { headers: new Headers() }, headers), TypeError);
});
