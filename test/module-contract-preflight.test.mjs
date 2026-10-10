import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoPath = file => resolve(process.cwd(), file);
const read = file => readFileSync(repoPath(file), 'utf8');
const plan = JSON.parse(read('.engineering/proposals/CB-M01-M05-PREADMISSION-001.json'));
const source = JSON.parse(read('.engineering/CHECKPOINT.json'));
const manifest = JSON.parse(read('assets/reference/reference-manifest.json'));

test('pre-admission contract draft never grants application-code authorization', () => {
  assert.equal(plan.kind, 'NON_AUTHORIZING_PRE_ADMISSION_CONTRACT_PLAN');
  assert.equal(plan.notAuthoritativeForAdmission, true);
  assert.equal(plan.initialApplicationAgentsStarted, 0);
  assert.equal(plan.allowedAgentCount, 0);
  assert.deepEqual(plan.modules.map(m => m.id), ['CB-M01', 'CB-M05']);
  assert.ok(plan.modules.every(m => !m.applicationCodeAuthorized && m.contractStatus === 'PROPOSED_NOT_ADOPTED'));
  for (const m of plan.modules) {
    const state = source.checkpointFacts.moduleAdmission[m.id];
    assert.ok(['ADMITTED', 'NOT_ADMITTED'].includes(state), m.id);
    const contract = read(m.contractPath);
    if (state === 'ADMITTED') {
      const evidence = source.checkpointFacts.moduleAdmissionEvidence?.[m.id];
      assert.equal(evidence?.workOrder, m.id + '-WO-001', m.id + ' needs its own admitted Work Order');
      assert.ok(contract.includes(m.id), m.id + ' must own the matching contract');
      if (m.id === 'CB-M05') {
        assert.match(contract, /P0 fixture-based non-privileged CMS UI is authorized/u);
        assert.match(contract, /P1 remain BLOCKED/u);
      } else if (m.id === 'CB-M01') {
        assert.match(contract, /Golden Home/u);
        assert.match(contract, /original files|original Golden JPEGs|original JPEGs|Golden assets/u);
      }
    } else {
      assert.match(contract, /Status:\*\* PROPOSED \/ NOT_APPROVED \/ NOT_ADMITTED \/ NON_EXECUTABLE/u);
    }
  }
});

test('Golden contract references agree with the actual imported original JPEG bytes', () => {
  const golden = read('docs/architecture/contracts/CB-M01.md');
  for (const asset of manifest.assets) {
    assert.equal(asset.presentInGit, true, asset.path);
    assert.ok(golden.includes(asset.path));
    assert.ok(golden.includes(asset.sha256));
    const actual = createHash('sha256').update(readFileSync(repoPath(asset.path))).digest('hex');
    assert.equal(actual, asset.sha256, 'Golden source bytes changed: ' + asset.path);
  }
});

test('M05 retains sole-Owner security and nonfunctional P0 boundaries', () => {
  const cms = read('docs/architecture/contracts/CB-M05.md');
  assert.match(cms, /Exactly \*\*one permanent human Owner\*\*/u);
  assert.match(cms, /No public signup/u);
  assert.match(cms, /MOCK.*SECURITY DISABLED/u);
  assert.match(cms, /Atomic concurrent first-Owner claim/u);
  assert.match(cms, /root key outside the same persistence/u);
  assert.match(cms, /Unauthorized real API actions|unauthorized real API actions/u);
});

test('historical proposal remains safe after future module admissions', () => {
  assert.equal(Object.keys(source.checkpointFacts.moduleAdmission).length, 19);
  assert.equal(source.checkpointFacts.moduleAdmission['CB-M00'], 'ADMITTED');
  assert.equal(source.checkpointFacts.moduleAdmission['CB-M18'], 'FUTURE_NOT_ADMITTED');
  assert.ok(source.overallCompletionPercent >= 5);
  assert.ok(plan.integrationStewardOwnedPaths.includes('src/pages/**'));
  assert.ok(!plan.modules.some(m => m.applicationCodeAuthorized));
});
