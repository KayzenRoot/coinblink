// Read-only PR assurance lanes. No bot approval, mutation, merge or deployment.
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function lastPart(name) { return name.split('/').at(-1).toLowerCase(); }
function isSecretPath(path) {
  const name = lastPart(path);
  return name === '.env' || name.startsWith('.env.') ||
    name === '.dev.vars' || name.startsWith('.dev.vars.') ||
    name === 'id_rsa' || name === 'id_ed25519' ||
    name === 'secret.yml' || name === 'secret.yaml' ||
    name === 'secrets.yml' || name === 'secrets.yaml' ||
    ['.pem', '.p12', '.pfx', '.key'].some(suffix => name.endsWith(suffix));
}
function isGefPath(path) {
  return path.toLowerCase().split('/').some(p => p === 'gef' || p.startsWith('gef-'));
}
function isWorkflow(path) {
  return path.startsWith('.github/workflows/') &&
    (path.endsWith('.yml') || path.endsWith('.yaml')) &&
    path.slice('.github/workflows/'.length).includes('/') === false;
}
function isTest(path) {
  return ['test/', 'tests/', 'e2e/'].some(prefix =>
    path.startsWith(prefix) || path.includes('/' + prefix));
}

/** Analyze paths without blocking ordinary product development. */
export function classifyPaths(paths) {
  const names = paths.map(row => typeof row === 'string' ? row : row.filename);
  return {
    count: names.length,
    forbidden: names.filter(name => isSecretPath(name) || isGefPath(name)),
    workflows: names.filter(isWorkflow),
    testFiles: names.filter(isTest),
    productFiles: names.filter(name => name.startsWith('src/') || name.startsWith('public/')),
  };
}

/** Avoid backtracking regex; check whole workflow line-by-line. */
export function unsafeWorkflowLines(content) {
  const reasons = new Set();
  const triggers = new Set(['pull_request_target', 'workflow_run']);
  const scheduled = new Set(['schedule', 'deployment_status']);
  const writeScopes = new Set([
    'contents', 'actions', 'checks', 'deployments', 'id-token',
    'issues', 'pull-requests', 'workflows', 'packages', 'security-events',
  ]);
  for (const originalLine of content.split('\n')) {
    const line = originalLine.split('#', 1)[0].trim();
    // YAML event lists (on: followed by - pull_request_target) contain no colon.
    const listEvent = line.startsWith('- ') ? line.slice(2).split(':', 1)[0].trim() : '';
    if (triggers.has(listEvent)) reasons.add('pull_request_target/workflow_run requires separate risk authorization');
    if (scheduled.has(listEvent)) reasons.add('scheduled/deployment workflow trigger requires separate authorization');
    const divider = line.indexOf(':');
    if (divider < 0) continue;
    const key = line.slice(0, divider).trim();
    const value = line.slice(divider + 1).trim();
    if (triggers.has(key)) reasons.add('pull_request_target/workflow_run requires separate risk authorization');
    if (scheduled.has(key)) reasons.add('scheduled/deployment workflow trigger requires separate authorization');
    if ((key === 'permissions' && (value === 'write-all' || value.includes('write'))) ||
        (writeScopes.has(key) && value === 'write')) {
      reasons.add('write-capable GitHub token permission');
    }
    if (key === 'on' && (value.includes('pull_request_target') ||
        value.includes('workflow_run') || value.includes('schedule'))) {
      reasons.add('elevated inline workflow trigger requires separate authorization');
    }
  }
  return [...reasons];
}

/** A candidate APPROVED is not proof of a distinct independent human. */
export function analyzeReviews({ reviews, head, author }) {
  const latest = new Map();
  for (const review of reviews) {
    const login = review.user?.login || '';
    if (!login || review.state === 'COMMENTED' || review.state === 'PENDING') continue;
    // COMMENTED does not dismiss an earlier APPROVED; DISMISSED/CHANGES_REQUESTED do.
    const submitted = review.submitted_at || '';
    if (!latest.has(login) || submitted >= (latest.get(login).submitted_at || '')) {
      latest.set(login, review);
    }
  }
  const candidates = [];
  for (const [login, review] of latest) {
    if (login.toLowerCase() === author.toLowerCase() || login.toLowerCase().endsWith('[bot]') ||
        review.user?.type === 'Bot' || review.state !== 'APPROVED' ||
        review.commit_id !== head) continue;
    candidates.push(login);
  }
  return { formalHeadApprovalCandidates: candidates, totalReviews: reviews.length,
    note: 'Candidates are not proof of a distinct human owner or sufficient repository permission.' };
}

/** Rate limits are pending external dependencies, never successful reviews. */
export function codeRabbitState(comments, head) {
  const botComments = comments.filter(c => ['coderabbitai', 'coderabbitai[bot]'].includes(
    (c.user?.login || '').toLowerCase()));
  botComments.sort((a, b) =>
    String(a.updated_at || a.created_at || '').localeCompare(String(b.updated_at || b.created_at || '')));
  const last = botComments.at(-1);
  if (!last) return 'NOT_CONFIGURED_OR_NO_COMMENT';
  const body = last.body || '';
  if (body.includes('Review rate limited') || body.includes('Review limit reached')) return 'RATE_LIMITED';
  if (body.includes('Review skipped')) return 'AUTO_REVIEW_DISABLED';
  if (body.includes('Review in progress') || body.includes('Currently processing') ||
      body.includes('Review triggered')) return 'PENDING';
  if (body.includes('coveredCommitId":"' + head + '"') && body.includes('"kind":"reviewed"')) {
    return 'COVERED_BY_REVIEW';
  }
  return 'NOT_CONFIRMED_FOR_HEAD';
}

const safe = value => String(value).replaceAll('|', '/').replaceAll('\n', ' ').slice(0, 200);
function writeSummary(body) {
  process.stdout.write(body + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, body + '\n');
}
async function api(path) {
  if (!process.env.GITHUB_TOKEN) throw new Error('Read-only GITHUB_TOKEN is required');
  const response = await fetch('https://api.github.com' + path, {
    headers: { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
      Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'coinblink-pr-assurance/1' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('GitHub read failed: HTTP ' + response.status + ' for ' + path);
  return response.json();
}
async function paged(path, maxPages = 10, page = 1, collected = []) {
  if (page > maxPages) throw new Error('Pagination bound exceeded; refusing incomplete assurance');
  const sep = path.includes('?') ? '&' : '?';
  const data = await api(path + sep + 'per_page=100&page=' + page);
  if (!Array.isArray(data)) throw new Error('Expected GitHub list for ' + path);
  const next = [...collected, ...data];
  return data.length < 100 ? next : paged(path, maxPages, page + 1, next);
}
function context() {
  const repository = process.env.GITHUB_REPOSITORY || '';
  const number = Number(process.env.PR_NUMBER);
  const head = process.env.EXPECTED_HEAD || '';
  const base = process.env.EXPECTED_BASE || '';
  const parts = repository.split('/');
  const validName = name => name.length > 0 && name.length <= 100 &&
    [...name].every(ch => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-'.includes(ch));
  const shaValid = sha => sha.length === 40 && [...sha].every(ch => 'abcdef0123456789'.includes(ch));
  if (parts.length !== 2 || !parts.every(validName) || !Number.isSafeInteger(number) ||
      number < 1 || !shaValid(head) || !shaValid(base)) throw new Error('Invalid PR identity/HEAD/base');
  return { repository, number, head, base, root: '/repos/' + repository };
}
async function runScope(ctx, label) {
  const files = await paged(ctx.root + '/pulls/' + ctx.number + '/files');
  const result = classifyPaths(files);
  writeSummary('### 🔒 Scope & privilege audit · ' + label + '\n' +
    '- Changed: **' + result.count + '** files; product ' + result.productFiles.length +
    ', tests ' + result.testFiles.length + ', workflows ' + result.workflows.length + '\n' +
    '- Secret/GEF forbidden paths: **' + result.forbidden.length + '**');
  if (result.forbidden.length) throw new Error('Forbidden paths: ' + result.forbidden.join(', '));
  if (result.workflows.length > 15) throw new Error('Too many changed workflows for bounded review');
  const violations = await Promise.all(result.workflows.map(async filename => {
    const path = filename.split('/').map(encodeURIComponent).join('/');
    const data = await api(ctx.root + '/contents/' + path + '?ref=' + ctx.head);
    if (data.encoding !== 'base64' || typeof data.content !== 'string') {
      throw new Error('Cannot inspect entire workflow: ' + filename);
    }
    const full = Buffer.from(data.content.replaceAll('\n', ''), 'base64').toString('utf8');
    return unsafeWorkflowLines(full).map(reason => filename + ': ' + reason);
  }));
  const findings = violations.flat();
  if (findings.length) throw new Error('Elevated workflow blocked: ' + findings.join('; '));
  writeSummary('- Workflow triggers/permissions: **no prohibited elevation**.\n' +
    '- No automated approval, merge or deployment.');
}
async function runReview(ctx, pr, label) {
  const [reviews, requested, comments] = await Promise.all([
    paged(ctx.root + '/pulls/' + ctx.number + '/reviews'),
    api(ctx.root + '/pulls/' + ctx.number + '/requested_reviewers'),
    paged(ctx.root + '/issues/' + ctx.number + '/comments'),
  ]);
  const review = analyzeReviews({ reviews, head: ctx.head, author: pr.user?.login || '' });
  const requestedLogins = (requested.users || []).map(user => user.login);
  writeSummary('### 🧭 Independent-review advisory · ' + label + '\n' +
    '- State: **' + (pr.draft ? 'DRAFT' : 'READY') + '**; requested: ' +
    (requestedLogins.length ? requestedLogins.map(safe).join(', ') : 'none') + '\n' +
    '- Formal exact-HEAD APPROVED candidates: **' + review.formalHeadApprovalCandidates.length +
    '** (NOT human independence proof).\n' +
    '- CodeRabbit: **' + safe(codeRabbitState(comments, ctx.head)) +
    '** (rate limits never equal approval).\n' +
    '- No review impersonation, status promotion, merge or publication.');
}
async function findSonar(ctx, attemptsRemaining) {
  const checks = await api(ctx.root + '/commits/' + ctx.head + '/check-runs?per_page=100');
  const sonar = checks.check_runs?.find(run => run.name === 'SonarCloud Code Analysis');
  if (sonar?.status === 'completed' || attemptsRemaining <= 0) return sonar;
  await new Promise(resolve => setTimeout(resolve, 5000));
  return findSonar(ctx, attemptsRemaining - 1);
}
async function runQuality(ctx, label) {
  const sonar = await findSonar(ctx, 5);
  if (sonar?.status !== 'completed') {
    writeSummary('### 🔎 Quality evidence · ' + label +
      '\n- SonarCloud pending/not visible. No verdict inferred; protected check remains mandatory.');
    return;
  }
  const summary = sonar.conclusion === 'success' ? 'PASS' : 'NOT PASSING (' + safe(sonar.conclusion) + ')';
  const lines = ['### 🔎 Quality evidence · ' + label,
    '- SonarCloud: **' + summary + '**. This advisory never overrides the actual protected check.'];
  if ((sonar.output?.annotations_count || 0) > 0) {
    const notes = await paged(ctx.root + '/check-runs/' + sonar.id + '/annotations', 2);
    lines.push('- GitHub check annotations: **' + notes.length + '** (first 15).');
    for (const issue of notes.slice(0, 15)) {
      lines.push('  - ' + safe(issue.path) + ':' + safe(issue.start_line) +
        ' · ' + safe(issue.title || issue.annotation_level) + ' · ' + safe(issue.message));
    }
  }
  writeSummary(lines.join('\n'));
}
async function run() {
  const lane = process.argv[2];
  if (!['scope', 'review', 'quality'].includes(lane)) throw new Error('Invalid assurance lane');
  const ctx = context();
  const pr = await api(ctx.root + '/pulls/' + ctx.number);
  if (pr.head?.sha !== ctx.head || pr.base?.sha !== ctx.base ||
      pr.base?.ref !== 'main' || pr.state !== 'open') {
    throw new Error('PR identity changed. Re-run on the new exact SHA.');
  }
  const label = 'PR #' + ctx.number + ' · ' + ctx.head.slice(0, 12);
  if (lane === 'scope') return runScope(ctx, label);
  if (lane === 'review') return runReview(ctx, pr, label);
  return runQuality(ctx, label);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await run(); }
  catch (error) {
    console.error('PR assurance FAILED CLOSED:', error.message);
    process.exitCode = 1;
  }
}
