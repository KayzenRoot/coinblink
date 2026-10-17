import assert from "node:assert/strict";
import test from "node:test";
import {
  CLOUDFLARE_ACCOUNT_ID,
  COINBLINK_OWNER_LOGIN,
  COINBLINK_REPOSITORY,
  MAIN_COMMIT_CHECKS,
  PRODUCTION_WORKER_NAME,
  PRODUCTION_WORKER_URL,
  REQUIRED_CHECKS,
  validateMainSha,
  validateMergedPullRequest,
  validateProductionTarget,
  validateRuleset,
  validateWorkflowRun,
  verifyRequiredChecks,
} from "../scripts/cloudflare-production-policy.mjs";

const sha = "a".repeat(40);
const tree = "b".repeat(40);

function workflowRun(overrides = {}) {
  return {
    id: 123,
    name: "GEF validation",
    event: "push",
    head_branch: "main",
    head_sha: sha,
    conclusion: "success",
    repository: { full_name: COINBLINK_REPOSITORY },
    head_repository: { full_name: COINBLINK_REPOSITORY },
    pull_requests: [],
    ...overrides,
  };
}

function passedCheck(name, at = "2026-10-17T10:00:00Z") {
  return { name, status: "completed", conclusion: "success", started_at: at, completed_at: at };
}

function ruleset() {
  return {
    id: 24888106,
    name: "coinblink-main-governance",
    source_type: "Repository",
    target: "branch",
    source: COINBLINK_REPOSITORY,
    enforcement: "active",
    bypass_actors: [],
    conditions: { ref_name: { include: ["refs/heads/main"], exclude: [] } },
    rules: [
      {
        type: "pull_request",
        parameters: {
          required_approving_review_count: 0,
          dismiss_stale_reviews_on_push: true,
          required_reviewers: [],
          require_code_owner_review: false,
          require_last_push_approval: false,
          require_extra_approval_for_unattributed_changes: true,
          required_review_thread_resolution: true,
          allowed_merge_methods: ["squash"],
        },
      },
      {
        type: "required_status_checks",
        parameters: {
          strict_required_status_checks_policy: true,
          do_not_enforce_on_create: false,
          required_status_checks: REQUIRED_CHECKS.map((context) => ({ context })),
        },
      },
      { type: "deletion" },
      { type: "non_fast_forward" },
    ],
  };
}

test("accepts only successful trusted push runs on main without pull request context", () => {
  assert.deepEqual(validateWorkflowRun(workflowRun()), []);
  assert.ok(validateWorkflowRun(workflowRun({ event: "pull_request" })).some((error) => error.includes("not a push")));
  assert.ok(validateWorkflowRun(workflowRun({ head_branch: "feature/preview" })).some((error) => error.includes("not main")));
  assert.ok(validateWorkflowRun(workflowRun({ conclusion: "failure" })).some((error) => error.includes("did not succeed")));
  assert.ok(validateWorkflowRun(workflowRun({ repository: { full_name: "attacker/coinblink" } })).some((error) => error.includes("not trusted")));
  assert.ok(validateWorkflowRun(workflowRun({ head_repository: { full_name: "fork/coinblink" } })).some((error) => error.includes("head repository")));
  assert.ok(validateWorkflowRun(workflowRun({ pull_requests: [{ number: 9 }] })).some((error) => error.includes("pull request context")));
  assert.ok(validateWorkflowRun(workflowRun({ head_sha: "not-a-sha" })).some((error) => error.includes("SHA is invalid")));
});

test("blocks stale, malformed, or missing main identities", () => {
  assert.deepEqual(validateMainSha(sha, sha), []);
  assert.ok(validateMainSha(sha, "c".repeat(40)).some((error) => error.includes("advanced")));
  assert.ok(validateMainSha("short", sha).some((error) => error.includes("invalid")));
});

test("accepts only one merged same-repository main PR whose full tree is unchanged", () => {
  const pr = {
    number: 16,
    state: "closed",
    merged_at: "2026-10-17T10:00:00Z",
    merge_commit_sha: sha,
    merged_by: { login: COINBLINK_OWNER_LOGIN },
    base: { ref: "main", repo: { full_name: COINBLINK_REPOSITORY } },
    head: { sha, repo: { full_name: COINBLINK_REPOSITORY } },
  };
  assert.deepEqual(validateMergedPullRequest(pr, sha, tree, tree), []);
  assert.ok(validateMergedPullRequest(pr, sha, tree, "c".repeat(40)).some((error) => error.includes("tree differs")));
  assert.ok(validateMergedPullRequest({ ...pr, merged_at: null }, sha, tree, tree).some((error) => error.includes("not merged")));
  assert.ok(validateMergedPullRequest({ ...pr, merge_commit_sha: "c".repeat(40) }, sha, tree, tree).some((error) => error.includes("merge SHA")));
  assert.ok(validateMergedPullRequest({ ...pr, base: { ...pr.base, ref: "develop" } }, sha, tree, tree).some((error) => error.includes("base is not main")));
  assert.ok(validateMergedPullRequest({ ...pr, head: { ...pr.head, repo: { full_name: "attacker/coinblink" } } }, sha, tree, tree).some((error) => error.includes("fork PRs")));
  assert.ok(validateMergedPullRequest({ ...pr, merged_by: { login: "someone-else" } }, sha, tree, tree).some((error) => error.includes("authorized Owner")));
});

test("requires all seven contexts on the merged PR and the five contexts emitted on exact main", () => {
  assert.equal(MAIN_COMMIT_CHECKS.length, 5);
  assert.equal(REQUIRED_CHECKS.length, 7);
  assert.deepEqual(
    verifyRequiredChecks({ checkRuns: REQUIRED_CHECKS.map((name) => passedCheck(name)), requiredChecks: REQUIRED_CHECKS }),
    [],
  );
  const statuses = REQUIRED_CHECKS.map((context, index) => ({
    context,
    state: "success",
    created_at: new Date(Date.UTC(2026, 9, 17, 10, index)).toISOString(),
  }));
  assert.deepEqual(verifyRequiredChecks({ statuses, requiredChecks: REQUIRED_CHECKS }), []);
});

test("fails closed for missing, pending, failed, and newer failed check attempts", () => {
  const successfulRuns = REQUIRED_CHECKS.map((name) => passedCheck(name));
  assert.ok(verifyRequiredChecks({ checkRuns: successfulRuns.slice(1), requiredChecks: REQUIRED_CHECKS }).some((error) => error.includes("missing")));
  assert.ok(verifyRequiredChecks({ checkRuns: [...successfulRuns.slice(1), { ...passedCheck(REQUIRED_CHECKS[0]), status: "in_progress", conclusion: null }], requiredChecks: REQUIRED_CHECKS }).some((error) => error.includes("did not succeed")));
  assert.ok(verifyRequiredChecks({ checkRuns: [...successfulRuns.slice(1), { ...passedCheck(REQUIRED_CHECKS[0]), conclusion: "failure" }], requiredChecks: REQUIRED_CHECKS }).some((error) => error.includes("did not succeed")));
  assert.ok(verifyRequiredChecks({
    checkRuns: [passedCheck(REQUIRED_CHECKS[0]), { ...passedCheck(REQUIRED_CHECKS[0], "2026-10-17T11:00:00Z"), conclusion: "failure" }, ...successfulRuns.slice(1)],
    requiredChecks: REQUIRED_CHECKS,
  }).some((error) => error.includes("did not succeed")));
});

test("validates the current active main ruleset without allowing bypass or check drift", () => {
  assert.deepEqual(validateRuleset(ruleset()), []);
  assert.ok(validateRuleset({ ...ruleset(), enforcement: "disabled" }).some((error) => error.includes("not active")));
  assert.ok(validateRuleset({ ...ruleset(), bypass_actors: [{ actor_id: 1 }] }).some((error) => error.includes("bypass")));
  assert.ok(validateRuleset({ ...ruleset(), conditions: { ref_name: { include: ["refs/heads/*"], exclude: [] } } }).some((error) => error.includes("scope")));
  const changedChecks = ruleset();
  changedChecks.rules[1].parameters.required_status_checks.pop();
  assert.ok(validateRuleset(changedChecks).some((error) => error.includes("seven approved contexts")));
});

test("pins the target to the selected workers.dev Worker and authenticated account", () => {
  assert.deepEqual(validateProductionTarget({
    repository: COINBLINK_REPOSITORY,
    workerName: PRODUCTION_WORKER_NAME,
    workerUrl: PRODUCTION_WORKER_URL,
    accountId: CLOUDFLARE_ACCOUNT_ID,
  }), []);
  assert.ok(validateProductionTarget({
    repository: COINBLINK_REPOSITORY,
    workerName: "coinblink-m00-local",
    workerUrl: PRODUCTION_WORKER_URL,
    accountId: CLOUDFLARE_ACCOUNT_ID,
  }).some((error) => error.includes("fixed target")));
  assert.ok(validateProductionTarget({
    repository: COINBLINK_REPOSITORY,
    workerName: PRODUCTION_WORKER_NAME,
    workerUrl: "https://other.example.com",
    accountId: CLOUDFLARE_ACCOUNT_ID,
  }).some((error) => error.includes("fixed workers.dev")));
});
