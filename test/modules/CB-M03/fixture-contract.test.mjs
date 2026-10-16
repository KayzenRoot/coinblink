import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/p0-contract.json', import.meta.url), 'utf8'));
test('M03 planned fixture: permission fail-closed and never fetch third parties', () => {
  assert.equal(fixture.module, 'CB-M03');
  assert.equal(fixture.mode, 'MOCK');
  assert.equal(fixture.admission, 'NOT_ADMITTED');
  assert.equal(fixture.kind, 'NON_EXECUTABLE_CONTRACT_FIXTURE');
  assert.equal(fixture.networkCalls, 0);
  assert.ok(fixture.sources.length > 0);
  for (const source of fixture.sources) {
    assert.equal(source.licensing, 'NOT_CLEARED');
    assert.equal(source.captureMode, 'DISABLED');
    assert.equal(source.redistributable, false);
    assert.equal(source.fetchedAt, null);
    assert.equal(new URL(source.originUrl).hostname.endsWith('.example.test'), true);
  }
});
test('M03 planned fixture: models rights block, dedup, failure and quota', () => {
  for (const name of ['fixture-only','rights-unknown','duplicate-on-replay','provider-unavailable','invalid-url','quota-denied']) {
    assert.ok(fixture.cases.some(c => c.name === name));
  }
  assert.equal(fixture.cases.find(c => c.name === 'rights-unknown').state, 'DENIED');
  assert.equal(fixture.cases.find(c => c.name === 'duplicate-on-replay').state, 'DEDUPLICATED');
});
