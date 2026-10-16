import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/p0-contract.json', import.meta.url), 'utf8'));
test('M02 planned fixture: no draft or unlicensed article leaks as published', () => {
  assert.equal(fixture.module, 'CB-M02');
  assert.equal(fixture.mode, 'MOCK');
  assert.equal(fixture.admission, 'NOT_ADMITTED');
  assert.equal(fixture.kind, 'NON_EXECUTABLE_CONTRACT_FIXTURE');
  assert.equal(fixture.networkCalls, 0);
  assert.deepEqual(fixture.publicItems, []);
  assert.ok(fixture.privateCandidates.length > 0);
  for (const item of fixture.privateCandidates) {
    assert.equal(item.publicVisible, false);
    assert.equal(item.status, 'draft');
    assert.equal(item.source.licenseStatus, 'NOT_CLEARED');
    assert.equal(new URL(item.source.originalUrl).hostname.endsWith('.example.test'), true);
  }
});
test('M02 planned fixture: explicit denied, empty, invalid and unavailable cases', () => {
  const required = ['mock-draft-hidden','empty-feed','invalid-slug','unavailable','unlicensed-source'];
  assert.deepEqual(fixture.cases.map(c => c.name).sort(), required.sort());
  for (const item of fixture.cases) assert.equal(item.publicCount, 0);
});
