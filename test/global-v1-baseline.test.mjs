import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isGlobalApprovalStatus, isParallelAdrApproved } from '../scripts/plan-parallel-modules.mjs';

const read = name => readFileSync(resolve(process.cwd(), name), 'utf8');

test('global staged baseline preserves canonical CB-M01 admission and proposes only scoped CB-M05 admission', () => {
  for (const name of ['SCOPE', 'ARCHITECTURE', 'REQUIREMENTS', 'DEFINITION-OF-DONE']) {
    assert.equal(isGlobalApprovalStatus(read('.engineering/' + name + '.md')), true);
  }
  assert.equal(isParallelAdrApproved(read('docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md')), true);
  const cp = JSON.parse(read('.engineering/CHECKPOINT.json'));
  const moduleIds = Array.from({ length: 19 }, (_, index) => 'CB-M' + String(index).padStart(2, '0'));
  assert.deepEqual(Object.keys(cp.checkpointFacts.moduleAdmission).sort(), [...moduleIds].sort());
  assert.equal(cp.checkpointFacts.moduleAdmission['CB-M00'], 'ADMITTED');
  assert.equal(cp.checkpointFacts.applicationImplementation, 'M00_COMPLETE');
  assert.ok(Number.isInteger(cp.overallCompletionPercent) && cp.overallCompletionPercent >= 5, 'completed M00 progress cannot regress');
  assert.equal(Object.hasOwn(cp.checkpointFacts.moduleAdmission, cp.completedThroughModule), true, 'the completed-through module is registered');
  assert.equal(cp.checkpointFacts.moduleAdmission[cp.completedThroughModule], 'ADMITTED', 'only an admitted module can be completed');
  const completedModuleIndex = moduleIds.indexOf(cp.completedThroughModule);
  const expectedCompletionPercent = Math.floor(((completedModuleIndex + 1) / moduleIds.length) * 100);
  assert.equal(cp.overallCompletionPercent, expectedCompletionPercent, 'completion percentage must match completed module count');
  if (cp.completedThroughModule === 'CB-M00') {
    assert.equal(cp.overallCompletionPercent, 5, 'admission alone never counts as completing a module');
  }
  for (let i=1; i<=17; i++) {
    const id = 'CB-M' + String(i).padStart(2, '0');
    const expected = ['CB-M01', 'CB-M05'].includes(id) ? 'ADMITTED' : 'NOT_ADMITTED';
    assert.equal(cp.checkpointFacts.moduleAdmission[id], expected, id + ' is outside the M05 admission delta; M01 is inherited from canonical main');
    if (expected === 'ADMITTED') {
      const proof = cp.checkpointFacts.moduleAdmissionEvidence?.[id];
      assert.equal(proof?.workOrder, id + '-WO-001', id + ' needs a module-specific reviewed Work Order');
      assert.equal(proof?.contract, 'docs/architecture/contracts/' + id + '.md', id + ' needs the matching producer contract');
      assert.equal(proof?.contextLock, '.engineering/context-locks/' + id + '-WO-001.md', id + ' needs the matching Context Lock');
      assert.match(proof?.status ?? '', /EFFECTIVE_ONLY_AFTER_OWNER_APPROVED_REVIEWED_MERGE/u);
      if (id === 'CB-M05') {
        assert.equal(proof?.governanceMainSha, 'e40d36b2a589596869eb296696e917f724d5be65', 'preserve the original M05 proposal base');
        assert.equal(proof?.synchronizedFromMainSha, 'c4ba069f1dfaddc8273001950805e8a18125db66', 'record the actual M01-first main sync');
      }
    }
  }
  assert.equal(cp.checkpointFacts.moduleAdmission['CB-M18'], 'FUTURE_NOT_ADMITTED');
});

test('Golden bytes, single Owner and source-backed article still have hard module gates', () => {
  const requirements = read('.engineering/REQUIREMENTS.md');
  assert.match(requirements, /^V1-G02:.*hash-verified original JPEG bytes.*no regenerated substitute.*screenshot-as-functional-HTML\.$/m);
  assert.match(requirements, /^V1-G03:.*one human Owner.*no public privileged enrollment.*login.*atomic bootstrap.*MFA.*recovery.*session revocation.*owner isolation.*$/m);
  assert.match(requirements, /^V1-G05:.*licensed and source-backed.*reviewed and Owner-approved.*draft\/mock is never counted as published LIVE\.$/m);
  assert.match(read('docs/DECISIONS_LEDGER.md'), /CB-DEC-046/);
  assert.match(read('docs/DECISIONS_LEDGER.md'), /CB-DEC-047/);
});
