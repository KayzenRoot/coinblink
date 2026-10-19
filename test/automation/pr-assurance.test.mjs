import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPaths, unsafeWorkflowLines, analyzeReviews, codeRabbitState } from '../../scripts/pr-assurance.mjs';

const HEAD = 'a'.repeat(40);
const OTHER = 'b'.repeat(40);

test('scope reports ordinary module, tests, and workflow without restrictive admission', () => {
  assert.deepEqual(classifyPaths([
    'src/modules/CB-M07/board.mjs',
    'test/modules/CB-M07/board.test.mjs',
    '.github/workflows/ci.yml',
  ]), { count:3, forbidden:[], workflows:['.github/workflows/ci.yml'],
    testFiles:['test/modules/CB-M07/board.test.mjs'],
    productFiles:['src/modules/CB-M07/board.mjs'] });
});
test('secret and GEF file paths fail closed', () => {
  const classified = classifyPaths(['.env.production','config/secrets.yml','private/auth.p12',
    'gef/policy.yml', 'src/modules/CB-M05/ui.mjs']);
  assert.deepEqual(classified.forbidden, [
    '.env.production','config/secrets.yml','private/auth.p12','gef/policy.yml',
  ]);
});
test('workflow guard permits read-only PR workflow', () => {
  assert.deepEqual(unsafeWorkflowLines(
    'on:\n  pull_request:\n    branches: [main]\npermissions:\n  contents: read\n  pull-requests: read\n'), []);
});
test('workflow guard blocks elevated triggers and write tokens', () => {
  const reasons = unsafeWorkflowLines(
    'on:\n  pull_request_target:\n  schedule:\npermissions:\n  contents: write\n');
  assert.equal(reasons.length, 3);
  assert.match(reasons.join(' '), /pull_request_target/);
  assert.match(reasons.join(' '), /write-capable/);
  assert.match(reasons.join(' '), /scheduled/);
});
test('all documented privileged GITHUB_TOKEN scopes, including statuses, fail closed', () => {
  const writeScopes = [
    'actions', 'artifact-metadata', 'attestations', 'checks', 'code-quality',
    'contents', 'copilot-requests', 'deployments', 'id-token', 'issues',
    'discussions', 'packages', 'pages', 'pull-requests', 'security-events',
    'statuses',
  ];
  for (const permission of writeScopes) {
    const workflow = 'on:\n  pull_request:\npermissions:\n  ' + permission + ': write\n';
    assert.ok(unsafeWorkflowLines(workflow).includes('write-capable GitHub token permission'),
      permission + ': write must not evade security review');
  }
  assert.deepEqual(unsafeWorkflowLines('permissions:\n  statuses: read\n  pages: none\n'), []);
});

test('YAML sequence event syntax cannot bypass privileged trigger scan', () => {
  const lines = unsafeWorkflowLines('on:\n  - push\n  - pull_request_target\n  - workflow_run:\npermissions:\n  contents: read\n');
  assert.ok(lines.some(reason => reason.includes('pull_request_target')));
  const scheduling = unsafeWorkflowLines('on:\n  - push\n  - schedule\n');
  assert.ok(scheduling.some(reason => reason.includes('scheduled/deployment')));
});

test('a subsequent COMMENTED review does not revoke exact-HEAD approval', () => {
  const reviews = [
    {user:{login:'Independent'},state:'APPROVED',commit_id:HEAD,submitted_at:'2026-10-19T10:00:00Z'},
    {user:{login:'Independent'},state:'COMMENTED',commit_id:HEAD,submitted_at:'2026-10-19T11:00:00Z'},
  ];
  assert.deepEqual(analyzeReviews({reviews,head:HEAD,author:'Owner'}).formalHeadApprovalCandidates,
    ['Independent']);
  reviews.push({user:{login:'Independent'},state:'DISMISSED',commit_id:HEAD,submitted_at:'2026-10-19T12:00:00Z'});
  assert.deepEqual(analyzeReviews({reviews,head:HEAD,author:'Owner'}).formalHeadApprovalCandidates, []);
});

test('review candidates exclude author, bots, outdated approval, and dismissed latest', () => {
  const reviews = [
    {user:{login:'Owner'},state:'APPROVED',commit_id:HEAD,submitted_at:'2026-10-19T10:00:00Z'},
    {user:{login:'CodeRabbitAI[bot]',type:'Bot'},state:'APPROVED',commit_id:HEAD,submitted_at:'2026-10-19T10:01:00Z'},
    {user:{login:'External'},state:'APPROVED',commit_id:OTHER,submitted_at:'2026-10-19T10:02:00Z'},
    {user:{login:'External'},state:'COMMENTED',commit_id:HEAD,submitted_at:'2026-10-19T10:03:00Z'},
    {user:{login:'Reviewer'},state:'APPROVED',commit_id:HEAD,submitted_at:'2026-10-19T10:04:00Z'},
  ];
  const r=analyzeReviews({reviews,head:HEAD,author:'Owner'});
  assert.deepEqual(r.formalHeadApprovalCandidates,['Reviewer']);
  assert.match(r.note,/not proof/);
});
test('rate limit is never treated as reviewed or approved', () => {
  const c = [{user:{login:'coderabbitai[bot]'},updated_at:'2026-10-19T22:51:41Z',
    body:'Review limit reached · Review rate limited'}];
  assert.equal(codeRabbitState(c,HEAD),'RATE_LIMITED');
});
test('only explicit CodeRabbit coverage marker qualifies as covered', () => {
  const incomplete=[{user:{login:'coderabbitai[bot]'},body:
    'Review finished and reviewing commits from '+OTHER+' to '+HEAD}];
  assert.equal(codeRabbitState(incomplete,HEAD),'NOT_CONFIRMED_FOR_HEAD');
  const covered=[{user:{login:'coderabbitai[bot]'},
    body:'<!-- final_review_risk_coverage:{"coveredCommitId":"'+HEAD+'","kind":"reviewed"} -->'}];
  assert.equal(codeRabbitState(covered,HEAD),'COVERED_BY_REVIEW');
});
