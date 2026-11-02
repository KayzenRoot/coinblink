import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sameToken } from '../../../src/modules/CB-M08/token-compare.mjs';

test('the token compare is exact and length-safe', () => {
  const token = 'a'.repeat(64);
  assert.equal(sameToken(token, token), true);
  assert.equal(sameToken(token, 'a'.repeat(63)), false);
  assert.equal(sameToken('', token), false);
  assert.equal(sameToken(token, ''), false);
  assert.equal(sameToken('b'.repeat(64), token), false);
});

test('the endpoint only exposes the tick and requires a long token', () => {
  const route = readFileSync('src/pages/api/auto-publish.ts', 'utf8');
  assert.match(route, /expected\.length < 32/u);
  assert.match(route, /reply\(401, \{ status: "unauthorized" \}\)/u);
  assert.match(route, /autoPublishTick\(\{/u);
  assert.doesNotMatch(route, /settingsPage|setSetting|authorizeForm/u, 'the token cannot reach the admin');
  assert.match(route, /export const ALL: APIRoute = \(\) => reply\(405/u);
});

test('the scheduled workflow is read-only and carries the owner marker', () => {
  const workflow = readFileSync('.github/workflows/auto-publish.yml', 'utf8');
  assert.match(workflow, /# owner-authorized-schedule/u);
  assert.match(workflow, /permissions:\n {2}contents: read/u);
  assert.match(workflow, /secrets\.AUTO_PUBLISH_TOKEN/u);
  assert.match(workflow, /\/api\/auto-publish/u);
  const guard = readFileSync('scripts/pr-assurance.mjs', 'utf8');
  assert.match(guard, /'\.github\/workflows\/auto-publish\.yml'/u);
});
