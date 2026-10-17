import assert from "node:assert/strict";
import test from "node:test";
import { safePreflightLogMessage, verifyProductionDeployEligibility } from "../scripts/assert-production-deploy-eligibility.mjs";
import { COINBLINK_REPOSITORY, MAIN_COMMIT_CHECKS, REQUIRED_CHECKS } from "../scripts/cloudflare-production-policy.mjs";

const mainSha = "a".repeat(40);
const mainTreeSha = "b".repeat(40);
const prHeadSha = "c".repeat(40);
const prHeadTreeSha = mainTreeSha;
const latestRightsCommentPath = `/repos/${COINBLINK_REPOSITORY}/issues/72/comments?per_page=100&page=1`;

function authorizedRightsIssue() {
  return { number: 72, state: "closed", title: "CoinBlink commercial rights gate" };
}

function authorizedRightsComment(overrides = {}) {
  return {
    id: 7201,
    user: { login: "KayzenRoot" },
    created_at: "2026-10-17T10:00:00Z",
    updated_at: "2026-10-17T10:00:00Z",
    body: [
      "COINBLINK_COMMERCIAL_PUBLICATION_GATE=AUTHORIZED",
      "rightsReview=CLEARED",
      "commercialPublicationAllowed=true",
      "rightsEvidence=https://github.com/KayzenRoot/coinblink/issues/72#issuecomment-7201",
    ].join("\n"),
    ...overrides,
  };
}

function event(workflowOverrides = {}) {
  return {
    workflow_run: {
      id: 123,
      name: "GEF validation",
      event: "push",
      head_branch: "main",
      head_sha: mainSha,
      conclusion: "success",
      repository: { full_name: COINBLINK_REPOSITORY },
      head_repository: { full_name: COINBLINK_REPOSITORY },
      pull_requests: [],
      ...workflowOverrides,
    },
  };
}

function checkRun(name) {
  return {
    name,
    status: "completed",
    conclusion: "success",
    started_at: "2026-10-17T10:00:00Z",
    completed_at: "2026-10-17T10:00:01Z",
  };
}

function fakeApi({ currentMain = mainSha, prTree = prHeadTreeSha, missingMainCheck, missingPrCheck, rightsIssue = authorizedRightsIssue(), latestRightsComment = authorizedRightsComment() } = {}) {
  const apiCalls = [];
  let mainLookups = 0;
  const githubApi = async (path) => {
    apiCalls.push(path);
    if (path === `/repos/${COINBLINK_REPOSITORY}/actions/workflows/gef-validation.yml`) {
      return { id: 77, path: ".github/workflows/gef-validation.yml", state: "active" };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/actions/runs/123`) {
      return {
        id: 123,
        workflow_id: 77,
        name: "GEF validation",
        event: "push",
        head_branch: "main",
        head_sha: mainSha,
        conclusion: "success",
        repository: { full_name: COINBLINK_REPOSITORY },
        pull_requests: [],
      };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/commits/main`) {
      mainLookups += 1;
      return { sha: typeof currentMain === "function" ? currentMain(mainLookups) : currentMain };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/commits/${mainSha}/pulls?per_page=100`) {
      return [{ number: 42, merge_commit_sha: mainSha, head: { sha: prHeadSha } }];
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/pulls/42`) {
      return {
        number: 42,
        state: "closed",
        merged_at: "2026-10-17T09:00:00Z",
        merge_commit_sha: mainSha,
        merged_by: { login: "KayzenRoot" },
        head: { sha: prHeadSha, repo: { full_name: COINBLINK_REPOSITORY } },
        base: { ref: "main", repo: { full_name: COINBLINK_REPOSITORY } },
      };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/commits/${mainSha}`) {
      return { commit: { tree: { sha: mainTreeSha } } };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/commits/${prHeadSha}`) {
      return { commit: { tree: { sha: prTree } } };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/commits/${mainSha}/check-runs?per_page=100`) {
      const names = MAIN_COMMIT_CHECKS.filter((name) => name !== missingMainCheck);
      return { total_count: names.length, check_runs: names.map(checkRun) };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/commits/${mainSha}/status`) {
      return { statuses: [] };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/commits/${prHeadSha}/check-runs?per_page=100`) {
      const names = REQUIRED_CHECKS.filter((name) => name !== missingPrCheck && name !== "CodeRabbit");
      return { total_count: names.length, check_runs: names.map(checkRun) };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/commits/${prHeadSha}/status`) {
      const contexts = REQUIRED_CHECKS.filter((name) => name === "CodeRabbit" || name === "Socket Security: Pull Request Alerts")
        .filter((name) => name !== missingPrCheck);
      return { statuses: contexts.map((context) => ({ context, state: "success", created_at: "2026-10-17T10:00:02Z" })) };
    }
    if (path === `/repos/${COINBLINK_REPOSITORY}/issues/72`) return rightsIssue;
    if (path === latestRightsCommentPath) return latestRightsComment ? [latestRightsComment] : [];
    throw new Error(`Unexpected fake API path ${path}`);
  };
  return { githubApi, apiCalls };
}

test("preflight proves successful GEF, exact current main, source-tree equality, and all required checks", async () => {
  const { githubApi, apiCalls } = fakeApi();
  const result = await verifyProductionDeployEligibility({
    event: event(),
    repository: COINBLINK_REPOSITORY,
    githubApi,
    sleep: async () => {},
  });
  assert.deepEqual(result, {
    mainSha,
    mainTreeSha,
    pullRequestNumber: 42,
    pullRequestHeadSha: prHeadSha,
    rightsIssueCommentId: 7201,
  });
  assert.equal(apiCalls.filter((path) => path.endsWith("/commits/main")).length, 2);
  assert.ok(apiCalls.includes(`/repos/${COINBLINK_REPOSITORY}/commits/${mainSha}/check-runs?per_page=100`));
  assert.ok(apiCalls.includes(`/repos/${COINBLINK_REPOSITORY}/commits/${prHeadSha}/check-runs?per_page=100`));
  assert.ok(apiCalls.includes(`/repos/${COINBLINK_REPOSITORY}/issues/72`));
  assert.ok(apiCalls.includes(latestRightsCommentPath));
});

test("preflight blocks publication while Issue 72 is pending, missing, or not Owner-cleared", async () => {
  for (const invalidRights of [
    fakeApi({ latestRightsComment: authorizedRightsComment({ body: "commercialPublicationAllowed=false" }) }),
    fakeApi({ rightsIssue: { ...authorizedRightsIssue(), state: "open" } }),
    fakeApi({ latestRightsComment: authorizedRightsComment({ user: { login: "other" } }) }),
    fakeApi({ latestRightsComment: null }),
  ]) {
    await assert.rejects(verifyProductionDeployEligibility({
      event: event(),
      repository: COINBLINK_REPOSITORY,
      githubApi: invalidRights.githubApi,
      sleep: async () => {},
    }), /Commercial publication gate blocked/);
  }
});

test("latest rights comment selection paginates and orders by update time, not API list order", async () => {
  const { readLatestIssueComment } = await import("../scripts/assert-production-deploy-eligibility.mjs");
  const older = authorizedRightsComment({ id: 1, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" });
  const latest = authorizedRightsComment({ id: 201, created_at: "2026-10-17T00:00:00Z", updated_at: "2026-10-17T01:00:00Z" });
  const firstPage = Array.from({ length: 100 }, (_, index) => ({
    ...older,
    id: index + 1,
    created_at: new Date(Date.UTC(2026, 8, 1, 0, index)).toISOString(),
    updated_at: new Date(Date.UTC(2026, 8, 1, 0, index)).toISOString(),
  }));
  const requestedPages = [];
  const selected = await readLatestIssueComment(async (path) => {
    requestedPages.push(path);
    if (path.endsWith("page=1")) return firstPage;
    if (path.endsWith("page=2")) return [latest];
    throw new Error(`Unexpected rights comment page: ${path}`);
  });
  assert.equal(selected.id, latest.id);
  assert.equal(requestedPages.length, 4);
});

test("latest rights comment selection blocks if Issue 72 changes during pagination", async () => {
  const { readLatestIssueComment } = await import("../scripts/assert-production-deploy-eligibility.mjs");
  let pageOneReads = 0;
  await assert.rejects(readLatestIssueComment(async (path) => {
    if (path.endsWith("page=1")) {
      pageOneReads += 1;
      return [authorizedRightsComment({
        id: pageOneReads,
        created_at: `2026-10-17T10:0${pageOneReads}:00Z`,
        updated_at: `2026-10-17T10:0${pageOneReads}:00Z`,
      })];
    }
    throw new Error(`Unexpected rights comment page: ${path}`);
  }), /comments changed during the rights readback/);
});

test("preflight log messages reject control characters and oversized untrusted errors", () => {
  assert.equal(safePreflightLogMessage(new Error("main advanced before deployment.")), "main advanced before deployment.");
  assert.equal(safePreflightLogMessage(new Error("failure\r\n::warning::forged")), "unknown preflight failure");
  assert.equal(safePreflightLogMessage(new Error("x".repeat(201))), "unknown preflight failure");
  assert.equal(safePreflightLogMessage("not an Error"), "unknown preflight failure");
});

test("preflight rejects failed GEF and pull-request or fork-originated workflow runs before API access", async () => {
  for (const invalidRun of [
    { conclusion: "failure" },
    { event: "pull_request" },
    { head_branch: "feature/preview" },
    { repository: { full_name: "fork/coinblink" } },
    { head_repository: { full_name: "fork/coinblink" } },
    { pull_requests: [{ number: 8 }] },
  ]) {
    const { githubApi, apiCalls } = fakeApi();
    await assert.rejects(verifyProductionDeployEligibility({
      event: event(invalidRun),
      repository: COINBLINK_REPOSITORY,
      githubApi,
      sleep: async () => {},
    }));
    assert.equal(apiCalls.length, 0);
  }
});

test("preflight rejects stale main before PR or check lookup", async () => {
  const { githubApi, apiCalls } = fakeApi({ currentMain: "d".repeat(40) });
  await assert.rejects(verifyProductionDeployEligibility({
    event: event(),
    repository: COINBLINK_REPOSITORY,
    githubApi,
    sleep: async () => {},
  }), /advanced after the GEF run/);
  assert.equal(apiCalls.filter((path) => path.includes("/pulls/")).length, 0);
});

test("preflight rejects tree changes and incomplete required checks", async () => {
  for (const invalidApi of [
    fakeApi({ prTree: "e".repeat(40) }),
    fakeApi({ missingMainCheck: MAIN_COMMIT_CHECKS[0] }),
    fakeApi({ missingPrCheck: REQUIRED_CHECKS[0] }),
  ]) {
    await assert.rejects(verifyProductionDeployEligibility({
      event: event(),
      repository: COINBLINK_REPOSITORY,
      githubApi: invalidApi.githubApi,
      sleep: async () => {},
    }));
  }
});

test("preflight stops if main changes while checks are being verified", async () => {
  const { githubApi } = fakeApi({ currentMain: (lookup) => lookup === 1 ? mainSha : "e".repeat(40) });
  await assert.rejects(verifyProductionDeployEligibility({
    event: event(),
    repository: COINBLINK_REPOSITORY,
    githubApi,
    sleep: async () => {},
  }), /advanced after the GEF run/);
});
