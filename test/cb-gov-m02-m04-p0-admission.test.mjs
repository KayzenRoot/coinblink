import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const readJson = (name) => JSON.parse(readFileSync(resolve(process.cwd(), name), 'utf8'));
const proposal = readJson('.engineering/proposals/CB-GOV-M02-M04-P0-ADMISSION-001.json');
const checkpoint = readJson('.engineering/CHECKPOINT.json');
const moduleIds = ['CB-M02', 'CB-M03', 'CB-M04'];

function verifyAdmission(candidate, verifyFiles = true) {
  const admissions = candidate.checkpointFacts.moduleAdmission;
  assert.deepEqual(proposal.requiredPriorMerges.map((entry) => entry.module), moduleIds);
  assert.equal(proposal.targetScope, 'P0_OFFLINE_MOCK_ONLY');
  assert.equal(proposal.state, 'STAGED_PROPOSAL_NOT_EFFECTIVE');
  assert.equal(proposal.ownerAuthorization, 'PREPARATION_ONLY_NO_MERGE');
  assert.equal(candidate.status, 'M00_COMPLETE');
  assert.equal(candidate.completedThroughModule, 'CB-M00');
  assert.equal(candidate.overallCompletionPercent, 5);
  assert.equal(candidate.progressBasis.overallCompletionPercent, 5);
  for (const id of ['CB-M00', 'CB-M01', 'CB-M05']) assert.equal(admissions[id], 'ADMITTED');
  assert.equal(admissions['CB-M18'], 'FUTURE_NOT_ADMITTED');
  assert.equal(Object.keys(admissions).length, 19);
  const states = moduleIds.map((id) => admissions[id]);
  const allPending = states.every((value) => value === 'NOT_ADMITTED');
  const allAdmitted = states.every((value) => value === 'ADMITTED');
  assert.ok(allPending || allAdmitted, 'the three modules must be wholly pending or wholly admitted by one reviewed delta');
  for (let i = 6; i <= 17; i += 1) {
    assert.equal(admissions['CB-M' + String(i).padStart(2, '0')], 'NOT_ADMITTED');
  }

  for (const predecessor of proposal.requiredPriorMerges) {
    assert.match(predecessor.headSha, /^[0-9a-f]{40}$/u);
    assert.equal(predecessor.files.length, 5);
    const proof = candidate.checkpointFacts.moduleAdmissionEvidence?.[predecessor.module];
    if (allPending) {
      assert.equal(proof, undefined, 'no effective admission evidence may be issued for an unadmitted module');
      continue;
    }
    assert.equal(proof?.scope, 'P0_OFFLINE_MOCK_ONLY');
    assert.equal(proof?.workOrder, predecessor.module + '-WO-001');
    assert.equal(proof?.contract, 'docs/architecture/contracts/' + predecessor.module + '.md');
    assert.equal(proof?.contextLock, '.engineering/context-locks/' + predecessor.module + '-WO-001.md');
    assert.equal(proof?.preparationPullRequest, predecessor.pullRequest);
    assert.equal(proof?.preparationHeadSha, predecessor.headSha);
    assert.equal(proof?.predecessorMergeRequired, true);
    assert.equal(proof?.runtimeAndSharedIntegration, 'NOT_AUTHORIZED_BY_ADMISSION');
    assert.equal(proof?.status, 'EFFECTIVE_ONLY_AFTER_OWNER_APPROVED_REVIEWED_MERGE');

    if (verifyFiles) {
      for (const file of predecessor.files) {
        assert.equal(existsSync(resolve(process.cwd(), file.path)), true, 'missing predecessor canonical file: ' + file.path);
        const gitBlob = execFileSync('git', ['rev-parse', 'HEAD:' + file.path], {
          cwd: process.cwd(), encoding: 'utf8',
        }).trim();
        assert.equal(gitBlob, file.gitBlobSha1, 'predecessor contract fingerprint drift: ' + file.path);
      }
      const fixture = readJson('test/modules/' + predecessor.module + '/fixtures/p0-contract.json');
      assert.equal(fixture.kind, 'NON_EXECUTABLE_CONTRACT_FIXTURE');
      assert.equal(fixture.mode, 'MOCK');
      assert.equal(fixture.admission, 'NOT_ADMITTED', 'historical fixture is not effective checkpoint authority');
      assert.equal(fixture.networkCalls, 0);
    }
  }
  return allAdmitted ? 'ADMISSION_CANDIDATE_AWAITING_OWNER_GO_AND_MERGE' : 'PREPARED_NOT_ADMITTED';
}

test('P0 Steward proposal is non-effective until all three exact predecessor contracts are canonical', () => {
  assert.equal(proposal.sourceMainSha, '28e20b3bafef940e465d6d2a7ba938ae8e393e74');
  assert.deepEqual(proposal.requiredPriorMerges.map((entry) => entry.pullRequest), [92, 93, 94]);
  assert.equal(proposal.requiredPriorMerges.every((entry) =>
    entry.files.every((file) => /^[0-9a-f]{40}$/u.test(file.gitBlobSha1))), true);
  assert.ok(['PREPARED_NOT_ADMITTED', 'ADMISSION_CANDIDATE_AWAITING_OWNER_GO_AND_MERGE'].includes(verifyAdmission(checkpoint)));
});

test('P0 Steward gate rejects any partial, unsupported, or unevidenced early admission', () => {
  const partial = structuredClone(checkpoint);
  partial.checkpointFacts.moduleAdmission['CB-M02'] = 'ADMITTED';
  partial.checkpointFacts.moduleAdmission['CB-M03'] = 'NOT_ADMITTED';
  partial.checkpointFacts.moduleAdmission['CB-M04'] = 'NOT_ADMITTED';
  assert.throws(() => verifyAdmission(partial, false), /wholly pending or wholly admitted/);

  const fullWithoutEvidence = structuredClone(checkpoint);
  for (const id of moduleIds) fullWithoutEvidence.checkpointFacts.moduleAdmission[id] = 'ADMITTED';
  fullWithoutEvidence.checkpointFacts.moduleAdmissionEvidence ??= {};
  delete fullWithoutEvidence.checkpointFacts.moduleAdmissionEvidence['CB-M02'];
  assert.throws(() => verifyAdmission(fullWithoutEvidence, false));

  const wrongProgress = structuredClone(checkpoint);
  wrongProgress.overallCompletionPercent = 20;
  assert.throws(() => verifyAdmission(wrongProgress, false));

  const improperFuture = structuredClone(checkpoint);
  improperFuture.checkpointFacts.moduleAdmission['CB-M18'] = 'ADMITTED';
  assert.throws(() => verifyAdmission(improperFuture, false));
});
