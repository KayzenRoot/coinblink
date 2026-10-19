// Read-only PR assurance lanes. No bot approval, mutation, merge or deployment.
import { appendFileSync, readFileSync } from 'node:fs';

const SECRET_PATH = /(^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|id_rsa|id_ed25519|secrets?\.ya?ml|[^/]+\.(?:pem|p12|pfx|key))$/i;
const WRITE_PERMISSION = /^\s*(?:contents|actions|checks|deployments|id-token|issues|pull-requests|workflows|packages|security-events):\s*write\s*(?:#.*)?$/m;
const DANGEROUS_TRIGGER = /^\s*(?:pull_request_target|workflow_run):\s*(?:#.*)?$/m;

/** Analyze paths without blocking ordinary product development. */
export function classifyPaths(paths) {
  const names = paths.map(row => typeof row === 'string' ? row : row.filename);
  return {
    count: names.length,
    forbidden: names.filter(name => SECRET_PATH.test(name) || /(^|\/)gef(?:-|\/|$)/i.test(name)),
    workflows: names.filter(name => /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(name)),
    testFiles: names.filter(name => /(^|\/)(?:test|tests|e2e)\/|\.test\.[cm]?[jt]s$/i.test(name)),
    productFiles: names.filter(name => /^(?:src|public)\//.test(name)),
  };
}

/** Detect elevated workflow privileges/trigger types in the entire changed workflow. */
export function unsafeWorkflowLines(content) {
  const reasons = [];
  if (DANGEROUS_TRIGGER.test(content)) reasons.push('pull_request_target/workflow_run requires separate risk authorization');
  if (/^\s*permissions:\s*write-all\s*$/m.test(content) || WRITE_PERMISSION.test(content)) {
    reasons.push('write-capable GitHub token permission');
  }
  if (/^\s*(?:schedule|deployment_status):\s*(?:#.*)?$/m.test(content)) {
    reasons.push('scheduled/deployment workflow trigger requires separate authorization');
  }
  return reasons;
}

/** This is eligibility *candidate* detection only, not human independence. */
export function analyzeReviews({ reviews, head, author }) {
  const latest = new Map();
  for (const review of reviews) {
    const login = review.user?.login || '';
    if (!login) continue;
    const submitted = review.submitted_at || '';
    if (!latest.has(login) || submitted >= (latest.get(login).submitted_at || '')) latest.set(login, review);
  }
  const candidates = [];
  for (const [login, review] of latest) {
    if (login.toLowerCase() === author.toLowerCase() || /\[bot\]$/i.test(login) ||
        review.user?.type === 'Bot' || review.state !== 'APPROVED') continue;
    if (review.commit_id !== head) continue;
    candidates.push(login);
  }
  return { formalHeadApprovalCandidates: candidates, totalReviews: reviews.length,
    note: 'Candidates are not proof of a distinct human owner or sufficient repository permission.' };
}

/** A rate limit is a pending external dependency, never a successful review. */
export function codeRabbitState(comments, head) {
  const botComments = comments.filter(c => /^(?:coderabbitai|coderabbitai\[bot\])$/i.test(c.user?.login || ''));
  botComments.sort((a, b) => String(a.updated_at || a.created_at || '').localeCompare(String(b.updated_at || b.created_at || '')));
  const last = botComments.at(-1);
  if (!last) return 'NOT_CONFIGURED_OR_NO_COMMENT';
  if (/review rate limited|review limit reached/i.test(last.body || '')) return 'RATE_LIMITED';
  if (/review skipped/i.test(last.body || '')) return 'AUTO_REVIEW_DISABLED';
  if (/review in progress|currently processing|review triggered/i.test(last.body || '')) return 'PENDING';
  // A summary mentioning head may only list queued files. The review submission determines completion.
  if (last.body?.includes('coveredCommitId":"' + head + '"') &&
      /"kind":"reviewed"/.test(last.body)) return 'COVERED_BY_REVIEW';
  return 'NOT_CONFIRMED_FOR_HEAD';
}

const safe = text => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ').slice(0, 200);
const writeSummary = text => {
  process.stdout.write(text + '\n');
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
};
async function api(path) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('Read-only GITHUB_TOKEN is required');
  const response = await fetch('https://api.github.com' + path, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'coinblink-pr-assurance/1' },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('GitHub read failed: HTTP ' + response.status + ' for ' + path);
  return response.json();
}
async function paged(path, maxPages = 10) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const separator = path.includes('?') ? '&' : '?';
    const result = await api(path + separator + 'per_page=100&page=' + page);
    if (!Array.isArray(result)) throw new Error('GitHub array expected for ' + path);
    all.push(...result);
    if (result.length < 100) return all;
  }
  throw new Error('Pagination bound exceeded; refusing incomplete assurance');
}
async function run() {
  const lane = process.argv[2];
  if (!['scope', 'review', 'quality'].includes(lane)) throw new Error('Use lane scope, review or quality');
  const repository = process.env.GITHUB_REPOSITORY || '';
  const number = Number(process.env.PR_NUMBER);
  const expectedHead = process.env.EXPECTED_HEAD || '';
  const expectedBase = process.env.EXPECTED_BASE || '';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !Number.isSafeInteger(number) ||
      number < 1 || !/^[a-f0-9]{40}$/.test(expectedHead) ||
      !/^[a-f0-9]{40}$/.test(expectedBase)) throw new Error('Invalid PR identity/HEAD/base inputs');
  const root = '/repos/' + repository;
  const pr = await api(root + '/pulls/' + number);
  if (pr.head?.sha !== expectedHead || pr.base?.sha !== expectedBase ||
      pr.base?.ref !== 'main' || pr.state !== 'open') {
    throw new Error('PR identity changed. Re-run on the new exact SHA; no stale assurance.');
  }
  const label = 'PR #' + number + ' · ' + expectedHead.slice(0, 12);
  if (lane === 'scope') {
    const files = await paged(root + '/pulls/' + number + '/files');
    const result = classifyPaths(files);
    writeSummary('### 🔒 Scope & privilege audit · ' + label + '\n' +
      '- Changed: **' + result.count + '** files; product ' + result.productFiles.length +
      ', tests ' + result.testFiles.length + ', workflows ' + result.workflows.length + '\n' +
      '- Secret/GEF forbidden paths: **' + result.forbidden.length + '**');
    if (result.forbidden.length) throw new Error('Forbidden file paths: ' + result.forbidden.join(', '));
    const violations = [];
    for (const filename of result.workflows) {
      const path = filename.split('/').map(encodeURIComponent).join('/');
      const data = await api(root + '/contents/' + path + '?ref=' + expectedHead);
      if (data.encoding !== 'base64' || typeof data.content !== 'string') {
        throw new Error('Cannot inspect workflow fully: ' + filename);
      }
      const full = Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf8');
      for (const reason of unsafeWorkflowLines(full)) violations.push(filename + ': ' + reason);
    }
    if (violations.length) throw new Error('Workflow elevation blocked: ' + violations.join('; '));
    writeSummary('- Changed workflows: **no prohibited token writes or elevated triggers**.\n' +
      '- This lane NEVER authorizes merging, review approval or deployment.');
  } else if (lane === 'review') {
    const [reviews, requested, comments] = await Promise.all([
      paged(root + '/pulls/' + number + '/reviews'),
      api(root + '/pulls/' + number + '/requested_reviewers'),
      paged(root + '/issues/' + number + '/comments'),
    ]);
    const review = analyzeReviews({ reviews, head: expectedHead, author: pr.user?.login || '' });
    const pending = (requested.users || []).map(u => u.login);
    const rabbit = codeRabbitState(comments, expectedHead);
    writeSummary('### 🧭 Independent-review advisory · ' + label + '\n' +
      '- State: **' + (pr.draft ? 'DRAFT' : 'READY') + '**; requested humans: ' +
      (pending.length ? pending.map(safe).join(', ') : 'none') + '\n' +
      '- Exact-HEAD GitHub APPROVED candidates: **' +
      review.formalHeadApprovalCandidates.length + '** (NOT proof of human independence)\n' +
      '- CodeRabbit: **' + safe(rabbit) + '**; rate-limit never counts as approval.\n' +
      '- No reviewer simulation, automatic approve, status promotion, or merge performed.');
    // Pending reviews are an advisory result; branch protection remains authoritative.
  } else {
    // Read Sonar/CI evidence without making parallel check-runs a blocking race.
    // GitHub's own protected-branch SonarCloud check remains authoritative.
    let sonar;
    for (let attempt = 0; attempt < 6; attempt++) {
      const checks = await api(root + '/commits/' + expectedHead + '/check-runs?per_page=100');
      sonar = checks.check_runs?.find(run => run.name === 'SonarCloud Code Analysis');
      if (sonar?.status === 'completed') break;
      if (attempt !== 5) await new Promise(resolve => setTimeout(resolve, 5000));
    }
    if (!sonar || sonar.status !== 'completed') {
      writeSummary('### 🔎 Quality evidence · ' + label +
        '\n- SonarCloud still pending/not visible; no verdict inferred. Existing protected gate remains mandatory.');
      return;
    }
    const summary = sonar.conclusion === 'success' ? 'PASS' : 'NOT PASSING (' + safe(sonar.conclusion) + ')';
    const lines = ['### 🔎 Quality evidence · ' + label,
      '- SonarCloud check: **' + summary + '**. This advisory never overrides the protected check.'];
    if (sonar.output?.annotations_count > 0) {
      const notes = await paged(root + '/check-runs/' + sonar.id + '/annotations', 2);
      lines.push('- GitHub check annotations: **' + notes.length + '** (first 12 below).');
      for (const issue of notes.slice(0, 12)) {
        lines.push('  - ' + safe(issue.path) + ':' + safe(issue.start_line) +
          ' · ' + safe(issue.title || issue.annotation_level) + ' · ' + safe(issue.message));
      }
    }
    writeSummary(lines.join('\n'));
  }
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  run().catch(error => { console.error('PR assurance FAILED CLOSED:', error.message); process.exitCode = 1; });
}
