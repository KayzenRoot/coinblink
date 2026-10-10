import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isGlobalApprovalStatus, isParallelAdrApproved } from '../scripts/plan-parallel-modules.mjs';

const read = name => readFileSync(resolve(process.cwd(), name), 'utf8');

test('approved staged baseline does not admit a new module', () => {
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
    assert.ok(['NOT_ADMITTED','ADMITTED'].includes(cp.checkpointFacts.moduleAdmission[id]), id);
    if (cp.checkpointFacts.moduleAdmission[id] === 'ADMITTED') {
      assert.equal(typeof cp.checkpointFacts.moduleAdmissionEvidence?.[id]?.workOrder, 'string', id + ' requires specific documented authorization');
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
