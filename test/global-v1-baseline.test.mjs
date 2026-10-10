import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isGlobalApprovalStatus, isParallelAdrApproved } from '../scripts/plan-parallel-modules.mjs';

const read = name => readFileSync(resolve(process.cwd(), name), 'utf8');

test('global staged baseline accepts only the separately reviewed CB-M05 admission candidate', () => {
  for (const name of ['SCOPE', 'ARCHITECTURE', 'REQUIREMENTS', 'DEFINITION-OF-DONE']) {
    assert.equal(isGlobalApprovalStatus(read('.engineering/' + name + '.md')), true);
  }
  assert.equal(isParallelAdrApproved(read('docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md')), true);
  const cp = JSON.parse(read('.engineering/CHECKPOINT.json'));
  assert.equal(Object.keys(cp.checkpointFacts.moduleAdmission).length, 19);
  assert.equal(cp.checkpointFacts.moduleAdmission['CB-M00'], 'ADMITTED');
  assert.ok(Number.isInteger(cp.overallCompletionPercent) && cp.overallCompletionPercent >= 5);
  if (cp.completedThroughModule === 'CB-M00') {
    assert.equal(cp.overallCompletionPercent, 5, 'admission alone never counts as completing a module');
  }
  for (let i=1; i<=17; i++) {
    const id = 'CB-M' + String(i).padStart(2, '0');
    const expected = id === 'CB-M05' ? 'ADMITTED' : 'NOT_ADMITTED';
    assert.equal(cp.checkpointFacts.moduleAdmission[id], expected, id + ' is outside this single-module admission');
    if (expected === 'ADMITTED') {
      const proof = cp.checkpointFacts.moduleAdmissionEvidence?.[id];
      assert.equal(proof?.workOrder, id + '-WO-001', id + ' needs a module-specific reviewed Work Order');
      assert.equal(proof?.contract, 'docs/architecture/contracts/' + id + '.md', id + ' needs the matching producer contract');
      assert.equal(proof?.contextLock, '.engineering/context-locks/' + id + '-WO-001.md', id + ' needs the matching Context Lock');
      assert.match(proof?.status ?? '', /EFFECTIVE_ONLY_AFTER_OWNER_APPROVED_REVIEWED_MERGE/u);
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
