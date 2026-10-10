import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localAuthoringSlots, planParallelModules } from '../scripts/plan-parallel-modules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const matrix = JSON.parse(readFileSync(path.join(ROOT, '.engineering/proposals/CB-GOV-PARALLEL-001-MODULE-MATRIX.json'), 'utf8'));
const checkpoint = JSON.parse(readFileSync(path.join(ROOT, '.engineering/CHECKPOINT.json'), 'utf8'));

test('M00 completion is read from canonical checkpoint, not historical proposal snapshot', () => {
  const plan = planParallelModules({ matrix, checkpoint, resourceSlots: 4 });
  assert.equal(plan.moduleCount, 19);
  assert.equal(plan.canonicalM00Complete, true);
  assert.equal(plan.checkpointPercent, 5);
  assert.equal(plan.unfinishedModuleCount, 18);
  assert.equal(plan.globalParallelADREffective, false);
  assert.deepEqual(plan.nextModuleCandidates, ['CB-M01', 'CB-M05']);
  assert.deepEqual(plan.eligibleCodeAgentsNow, []);
  assert.equal(plan.candidates.length, 17);
  assert.ok(plan.candidates.find(c => c.id === 'CB-M01').blockers.some(x => x.includes('External evidence')));
  assert.ok(plan.candidates.find(c => c.id === 'CB-M05').blockers.some(x => x.includes('Module not admitted')));
  assert.equal(plan.candidates.some(c => c.id === 'CB-M18'), false);
});

test('stale proposal cannot authorize app code after M00 is complete', () => {
  const altered = structuredClone(checkpoint);
  altered.checkpointFacts.moduleAdmission['CB-M01'] = 'ADMITTED';
  altered.checkpointFacts.moduleAdmission['CB-M05'] = 'ADMITTED';
  const plan = planParallelModules({ matrix, checkpoint: altered, resourceSlots: 16 });
  assert.deepEqual(plan.eligibleCodeAgentsNow, []);
});

test('valid admitted independent modules schedule concurrently without exceeding host slots', () => {
  const altered = structuredClone(checkpoint);
  altered.checkpointFacts.moduleAdmission['CB-M01'] = 'ADMITTED';
  altered.checkpointFacts.moduleAdmission['CB-M05'] = 'ADMITTED';
  const approved = {
    'CB-M01': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
    'CB-M05': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
  };
  const p1 = planParallelModules({ matrix, checkpoint: altered, adoptedADR: true, resourceSlots: 1, gates: approved });
  assert.deepEqual(p1.eligibleCodeAgentsNow, ['CB-M01']);
  assert.deepEqual(p1.eligibleCodeAgentsWaitingForResourceSlot, ['CB-M05']);
  const p2 = planParallelModules({ matrix, checkpoint: altered, adoptedADR: true, resourceSlots: 8, gates: approved });
  assert.deepEqual(p2.eligibleCodeAgentsNow, ['CB-M01', 'CB-M05']);
  assert.ok(p2.candidates.find(c => c.id === 'CB-M03').blockers.some(x => x.includes('CB-M05')));
});

test('never treat active module admission alone as dependency completion', () => {
  const altered = structuredClone(checkpoint);
  for (const id of ['CB-M01', 'CB-M02', 'CB-M03', 'CB-M04', 'CB-M05']) {
    altered.checkpointFacts.moduleAdmission[id] = 'ADMITTED';
  }
  const plan = planParallelModules({ matrix, checkpoint: altered, adoptedADR: true, resourceSlots: 16 });
  assert.ok(!plan.eligibleCodeAgentsNow.includes('CB-M02'));
  assert.ok(plan.candidates.find(x => x.id === 'CB-M02').unmetDependencies.includes('CB-M01'));
});

test('invalid module count, M18 admission and unsafe limits fail closed', () => {
  assert.throws(() => planParallelModules({
    matrix: { ...matrix, moduleCount: 18 }, checkpoint, resourceSlots: 8,
  }), /19-module/u);
  const altered = structuredClone(checkpoint);
  altered.checkpointFacts.moduleAdmission['CB-M18'] = 'ADMITTED';
  assert.throws(() => planParallelModules({ matrix, checkpoint: altered }), /M18/u);
  assert.throws(() => planParallelModules({ matrix, checkpoint, resourceSlots: 0 }), /positive integer/u);
});

test('resource-aware authoring is not hard-capped to two agents', () => {
  assert.equal(localAuthoringSlots({ cpus: 24, ramBytes: 64 * 1024 ** 3 }), 12);
  assert.equal(localAuthoringSlots({ cpus: 4, ramBytes: 8 * 1024 ** 3 }), 2);
  assert.equal(localAuthoringSlots({ cpus: 1, ramBytes: 2 * 1024 ** 3 }), 1);
});
