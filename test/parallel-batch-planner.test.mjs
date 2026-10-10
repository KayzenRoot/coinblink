import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isGlobalApprovalStatus, isIssue6Closed, isParallelAdrApproved, localAuthoringSlots, parseGateEvidence, planParallelModules } from '../scripts/plan-parallel-modules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const matrix = JSON.parse(readFileSync(path.join(ROOT, '.engineering/proposals/CB-GOV-PARALLEL-001-MODULE-MATRIX.json'), 'utf8'));
const checkpoint = JSON.parse(readFileSync(path.join(ROOT, '.engineering/CHECKPOINT.json'), 'utf8'));
const approvedGlobalGates = {
  scopeApproved: true,
  architectureApproved: true,
  dodApproved: true,
  issue6Closed: true,
  parallelADRAdopted: true,
};

test('M00 completion is read from canonical checkpoint, not historical proposal snapshot', () => {
  const plan = planParallelModules({ matrix, checkpoint, resourceSlots: 4 });
  assert.equal(plan.moduleCount, 19);
  assert.equal(plan.canonicalM00Complete, true);
  assert.equal(plan.checkpointPercent, 5);
  assert.equal(plan.unfinishedModuleCount, 18);
  assert.equal(plan.globalGatesSatisfied, false);
  assert.deepEqual(plan.dependencyReadyModuleCandidates, ['CB-M01', 'CB-M05']);
  assert.deepEqual(plan.plannerEligibleAgentModulesWithinResourceSlots, []);
  assert.equal(plan.moduleApplicationCodeAuthorizedByPlanner, false);
  assert.match(plan.disclaimer, /never grants application-code authority/u);
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
  assert.deepEqual(plan.plannerEligibleAgentModulesWithinResourceSlots, []);
});

test('valid admitted independent modules schedule concurrently without exceeding host slots', () => {
  const altered = structuredClone(checkpoint);
  altered.checkpointFacts.moduleAdmission['CB-M01'] = 'ADMITTED';
  altered.checkpointFacts.moduleAdmission['CB-M05'] = 'ADMITTED';
  const approved = {
    'CB-M01': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
    'CB-M05': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
  };
  const p1 = planParallelModules({ matrix, checkpoint: altered, globalGates: approvedGlobalGates, resourceSlots: 1, gates: approved });
  assert.deepEqual(p1.plannerEligibleAgentModulesWithinResourceSlots, ['CB-M01']);
  assert.deepEqual(p1.plannerEligibleAgentModulesWaitingForResourceSlots, ['CB-M05']);
  const p2 = planParallelModules({ matrix, checkpoint: altered, globalGates: approvedGlobalGates, resourceSlots: 8, gates: approved });
  assert.deepEqual(p2.plannerEligibleAgentModulesWithinResourceSlots, ['CB-M01', 'CB-M05']);
  assert.equal(p2.candidates.find(candidate => candidate.id === 'CB-M01').plannerEligibleBasedOnEvaluatedInputs, true);
  assert.equal(p2.moduleApplicationCodeAuthorizedByPlanner, false);
  assert.ok(p2.candidates.find(c => c.id === 'CB-M03').blockers.some(x => x.includes('CB-M05')));
});

test('never treat active module admission alone as dependency completion', () => {
  const altered = structuredClone(checkpoint);
  for (const id of ['CB-M01', 'CB-M02', 'CB-M03', 'CB-M04', 'CB-M05']) {
    altered.checkpointFacts.moduleAdmission[id] = 'ADMITTED';
  }
  const plan = planParallelModules({ matrix, checkpoint: altered, globalGates: approvedGlobalGates, resourceSlots: 16 });
  assert.ok(!plan.plannerEligibleAgentModulesWithinResourceSlots.includes('CB-M02'));
  assert.ok(plan.candidates.find(x => x.id === 'CB-M02').unmetDependencies.includes('CB-M01'));
});

test('invalid module count, M18 admission and unsafe limits fail closed', () => {
  assert.throws(() => planParallelModules({
    matrix: { ...matrix, moduleCount: 18 }, checkpoint, resourceSlots: 8,
  }), /19-module/u);
  const altered = structuredClone(checkpoint);
  altered.checkpointFacts.moduleAdmission['CB-M18'] = 'ADMITTED';
  assert.throws(() => planParallelModules({ matrix, checkpoint: altered }), /M18/u);
  assert.throws(() => planParallelModules({ matrix, checkpoint, resourceSlots: -1 }), /non-negative integer/u);
});

test('checkpoint admission registry matches the exact canonical module ID set', () => {
  const reordered = structuredClone(checkpoint);
  reordered.checkpointFacts.moduleAdmission = Object.fromEntries(
    Object.entries(reordered.checkpointFacts.moduleAdmission).reverse(),
  );
  assert.equal(planParallelModules({ matrix, checkpoint: reordered }).moduleCount, 19);

  const missing = structuredClone(checkpoint);
  delete missing.checkpointFacts.moduleAdmission['CB-M07'];
  assert.throws(() => planParallelModules({ matrix, checkpoint: missing }), /registry/u);

  const unexpected = structuredClone(checkpoint);
  unexpected.checkpointFacts.moduleAdmission['CB-M19'] = 'NOT_ADMITTED';
  assert.throws(() => planParallelModules({ matrix, checkpoint: unexpected }), /registry/u);
});

test('resource-aware authoring is not hard-capped to two agents', () => {
  assert.equal(localAuthoringSlots({ cpus: 24, ramBytes: 64 * 1024 ** 3 }), 12);
  assert.equal(localAuthoringSlots({ cpus: 4, ramBytes: 8 * 1024 ** 3 }), 2);
  assert.equal(localAuthoringSlots({ cpus: 1, ramBytes: 2 * 1024 ** 3 }), 0);
  assert.equal(localAuthoringSlots({ cpus: 4, ramBytes: 2 * 1024 ** 3 }), 0);
});

test('M00 completion requires all canonical completion facts to agree', () => {
  const contradictions = [
    value => { value.checkpointFacts.applicationImplementation = 'M00_P0_LOCAL_IMPLEMENTED_P1_PENDING'; },
    value => { value.checkpointFacts.moduleAdmission['CB-M00'] = 'NOT_ADMITTED'; },
    value => { value.overallCompletionPercent = 0; },
  ];
  for (const contradict of contradictions) {
    const altered = structuredClone(checkpoint);
    contradict(altered);
    const plan = planParallelModules({ matrix, checkpoint: altered, resourceSlots: 8 });
    assert.equal(plan.canonicalM00Complete, false);
    assert.deepEqual(plan.plannerEligibleAgentModulesWithinResourceSlots, []);
  }
});

test('every global source and adoption gate is independently required', () => {
  const altered = structuredClone(checkpoint);
  altered.checkpointFacts.moduleAdmission['CB-M01'] = 'ADMITTED';
  altered.checkpointFacts.moduleAdmission['CB-M05'] = 'ADMITTED';
  const approved = {
    'CB-M01': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
    'CB-M05': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
  };
  for (const key of Object.keys(approvedGlobalGates)) {
    const gates = { ...approvedGlobalGates, [key]: false };
    const plan = planParallelModules({ matrix, checkpoint: altered, globalGates: gates, resourceSlots: 8, gates: approved });
    assert.deepEqual(plan.plannerEligibleAgentModulesWithinResourceSlots, [], `missing ${key} must fail closed`);
    assert.ok(plan.candidates.find(candidate => candidate.id === 'CB-M01')
      .blockers.some(blocker => blocker.includes(key)));
  }
});

test('resource floor can yield zero active agents without claiming a slot', () => {
  const altered = structuredClone(checkpoint);
  altered.checkpointFacts.moduleAdmission['CB-M01'] = 'ADMITTED';
  altered.checkpointFacts.moduleAdmission['CB-M05'] = 'ADMITTED';
  const approved = {
    'CB-M01': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
    'CB-M05': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
  };
  const plan = planParallelModules({
    matrix, checkpoint: altered, globalGates: approvedGlobalGates, resourceSlots: 0, gates: approved,
  });
  assert.equal(plan.resourceSlots, 0);
  assert.deepEqual(plan.plannerEligibleAgentModulesWithinResourceSlots, []);
  assert.deepEqual(plan.plannerEligibleAgentModulesWaitingForResourceSlots, ['CB-M01', 'CB-M05']);
});

test('integration contracts are reported separately from authoring blockers', () => {
  const plan = planParallelModules({ matrix, checkpoint, resourceSlots: 4 });
  const m17 = plan.candidates.find(candidate => candidate.id === 'CB-M17');
  assert.equal(m17.integrationBlockers.length, 2);
  assert.match(m17.integrationBlockers[0], /CB-M08/u);
  assert.match(m17.integrationBlockers[1], /CB-M07/u);
  assert.equal(m17.blockers.some(blocker => blocker.includes('Integration contract')), false);
});

test('CLI gate evidence parser accepts explicit module gates and rejects malformed input', () => {
  const gates = parseGateEvidence(JSON.stringify({
    'CB-M01': { externalGateApprovals: [true], workOrderFrozen: true, contextLockFrozen: true, contractApproved: true },
  }));
  assert.equal(gates['CB-M01'].workOrderFrozen, true);
  assert.throws(() => parseGateEvidence('{'), /JSON/u);
  assert.throws(() => parseGateEvidence('[]'), /object/u);
  assert.throws(() => parseGateEvidence('{"CB-M19":{}}'), /module ID/u);
  assert.throws(() => parseGateEvidence('{"CB-M01":{"workOrderFrozen":"yes"}}'), TypeError);
  assert.throws(() => parseGateEvidence('{"CB-M01":{"unreviewedApproval":true}}'), TypeError);
});

test('malformed gate evidence errors do not expose input or parser details', () => {
  const marker = 'SYNTHETIC_SECRET_SENTINEL';
  const malformedInput = marker + ' { malformed';
  assert.throws(() => parseGateEvidence(malformedInput), error => {
    assert.equal(error.name, 'SyntaxError');
    assert.equal(error.message, 'Gate evidence must be valid JSON');
    assert.equal(error.cause, undefined);
    assert.equal(error.message.includes('SYNTHETIC_'), false);
    return true;
  });
});

test('global source gate recognizes only explicit global approval and freeze status', () => {
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_GLOBAL / FROZEN.**'), true);
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_GLOBAL / FROZEN.** Approved by the Owner.'), true);
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_M00_ONLY / FROZEN.**'), false);
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_M00_ONLY / FROZEN.** Historical note: this was limited.'), false);
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_GLOBAL / PROPOSED.**'), false);
  assert.equal(isGlobalApprovalStatus('**Status: NOT_OWNER_APPROVED_GLOBAL / FROZEN.**'), false);
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_GLOBAL / NOT_FROZEN.**'), false);
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_GLOBAL / FROZEN / NOT_FROZEN.**'), false);
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_GLOBAL / FROZEN / PENDING.**'), false);
  assert.equal(isGlobalApprovalStatus('**Status: FROZEN / OWNER_APPROVED_GLOBAL.**'), false);
  assert.equal(isGlobalApprovalStatus('**Status: OWNER_APPROVED_M00_ONLY.**\nHistorical: OWNER_APPROVED_GLOBAL / FROZEN'), false);
});

test('parallel ADR gate accepts only the exact Owner-approved adoption status', () => {
  assert.equal(isParallelAdrApproved('**Status:** `ADOPTED / OWNER_APPROVED`'), true);
  assert.equal(isParallelAdrApproved('**Status:** `PROPOSED / NOT_OWNER_APPROVED / NOT_ADOPTED`'), false);
  assert.equal(isParallelAdrApproved('**Status:** `ADOPTED / OWNER_APPROVED / PROPOSED`'), false);
  assert.equal(isParallelAdrApproved('**Status:** `ADOPTED / OWNER_APPROVED / NOT_ADOPTED`'), false);
  assert.equal(isParallelAdrApproved('**Status:** `ADOPTED / OWNER_APPROVED` Owner note: draft'), false);
  assert.equal(isParallelAdrApproved('Historical: ADOPTED / OWNER_APPROVED\n**Status:** `PROPOSED / NOT_ADOPTED`'), false);
});

test('Issue #6 lookup uses a fixed unauthenticated read and fails closed', async () => {
  let request;
  const closedIssue = await isIssue6Closed(async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ number: 6, state: 'closed' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  assert.equal(closedIssue, true);
  assert.equal(request.url, 'https://api.github.com/repos/KayzenRoot/coinblink/issues/6');
  assert.equal(request.options.method, undefined);
  assert.equal(request.options.redirect, 'error');
  assert.equal(request.options.headers.Authorization, undefined);
  assert.ok(request.options.signal instanceof AbortSignal);

  assert.equal(await isIssue6Closed(async () => new Response(JSON.stringify({ number: 6, state: 'open' }), { status: 200 })), false);
  assert.equal(await isIssue6Closed(async () => new Response(JSON.stringify({ number: 7, state: 'closed' }), { status: 200 })), false);
  assert.equal(await isIssue6Closed(async () => new Response(JSON.stringify({ number: 6, state: 'closed', pull_request: {} }), { status: 200 })), false);
  assert.equal(await isIssue6Closed(async () => new Response('unavailable', { status: 503 })), false);
  assert.equal(await isIssue6Closed(async () => { throw new Error('network failure'); }), false);
});
