import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = file => readFileSync(resolve(process.cwd(), file), 'utf8');
const plan = JSON.parse(read('.engineering/proposals/CB-M01-M05-PREADMISSION-001.json'));
const source = JSON.parse(read('.engineering/CHECKPOINT.json'));
const manifest = JSON.parse(read('assets/reference/reference-manifest.json'));

test('pre-admission contracts cannot activate M01 or M05 application code', () => {
  assert.equal(plan.kind, 'NON_AUTHORIZING_PRE_ADMISSION_CONTRACT_PLAN');
  assert.equal(plan.notAuthoritativeForAdmission, true);
  assert.equal(plan.initialApplicationAgentsStarted, 0);
  assert.equal(plan.allowedAgentCount, 0);
  assert.deepEqual(plan.modules.map(m => m.id), ['CB-M01', 'CB-M05']);
  assert.ok(plan.modules.every(m => !m.applicationCodeAuthorized && m.contractStatus === 'PROPOSED_NOT_ADOPTED'));
  for (const m of plan.modules) {
    assert.equal(source.checkpointFacts.moduleAdmission[m.id], 'NOT_ADMITTED');
    assert.match(read(m.contractPath), /Status:\*\* PROPOSED \/ NOT_APPROVED \/ NOT_ADMITTED \/ NON_EXECUTABLE/u);
  }
});

test('original Golden byte identities and single-Owner security are binding contract inputs', () => {
  const golden = read('docs/architecture/contracts/CB-M01.md');
  const cms = read('docs/architecture/contracts/CB-M05.md');
  for (const asset of manifest.assets) {
    assert.ok(golden.includes(asset.path));
    assert.ok(golden.includes(asset.sha256));
  }
  assert.match(cms, /Exactly \*\*one permanent human Owner\*\*/u);
  assert.match(cms, /No public signup/u);
  assert.match(cms, /MOCK.*SECURITY DISABLED/u);
  assert.match(cms, /Atomic concurrent first-Owner claim/u);
  assert.match(cms, /root key outside the same persistence/u);
  assert.match(cms, /Unauthorized real API actions|unauthorized real API actions/u);
});

test('pre-admission plan keeps canonical 19-module checkpoint and integration stewardship', () => {
  assert.equal(source.status, 'M00_COMPLETE');
  assert.equal(source.overallCompletionPercent, 5);
  assert.equal(Object.keys(source.checkpointFacts.moduleAdmission).length, 19);
  assert.equal(source.checkpointFacts.moduleAdmission['CB-M18'], 'FUTURE_NOT_ADMITTED');
  assert.ok(plan.integrationStewardOwnedPaths.includes('src/pages/**'));
  assert.ok(!plan.modules.some(m=>m.applicationCodeAuthorized));
});
