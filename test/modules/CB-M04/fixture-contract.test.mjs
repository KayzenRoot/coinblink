import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/p0-contract.json', import.meta.url), 'utf8'));
test('M04 planned fixture: synthetic market observations must never be presented as live', () => {
  assert.equal(fixture.module, 'CB-M04');
  assert.equal(fixture.mode, 'MOCK');
  assert.equal(fixture.admission, 'NOT_ADMITTED');
  assert.equal(fixture.kind, 'NON_EXECUTABLE_CONTRACT_FIXTURE');
  assert.equal(fixture.networkCalls, 0);
  assert.ok(fixture.observations.length > 0);
  for (const item of fixture.observations) {
    assert.equal(item.displayMode, 'MOCK');
    assert.equal(item.freshness, 'STALE');
    assert.equal(item.isTradable, false);
    assert.equal(item.licenseStatus, 'NOT_CLEARED');
    assert.equal(item.currency, 'USD');
    assert.ok(Number.isFinite(Date.parse(item.asOf)));
    assert.equal(item.provider.endsWith('.example.test'), true);
    assert.match(item.attribution, /NOT actual market data/);
  }
});
test('M04 planned fixture: stale, missing, rights and provider failure states explicit', () => {
  for (const name of ['mock-never-live','stale-data','missing-price','rights-denied','timeout','provider-budget']) {
    assert.ok(fixture.cases.some(c => c.name === name));
  }
  assert.equal(fixture.cases.find(c => c.name === 'mock-never-live').display, 'DEMO_ONLY');
  assert.equal(fixture.cases.find(c => c.name === 'rights-denied').display, 'BLOCKED');
});
