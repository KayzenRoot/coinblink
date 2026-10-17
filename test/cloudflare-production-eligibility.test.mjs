import assert from "node:assert/strict";
import test from "node:test";
import { verifyProductionDeployEligibility } from "../scripts/assert-production-deploy-eligibility.mjs";
import { COINBLINK_REPOSITORY, MAIN_COMMIT_CHECKS, REQUIRED_CHECKS } from "../scripts/cloudflare-production-policy.mjs";

const mainSha = "a".repeat(40);
const mainTreeSha = "b".repeat(40);
const prHeadSha = "c".repeat(40);
const prHeadTreeSha = mainTreeSha;

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

function fakeApi({ currentMain = mainSha, prTree = prHeadTreeSha, missingMainCheck, missingPrCheck } = {}) {
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
  });
  assert.equal(apiCalls.filter((path) => path.endsWith("/commits/main")).length, 2);
  assert.ok(apiCalls.includes(`/repos/${COINBLINK_REPOSITORY}/commits/${mainSha}/check-runs?per_page=100`));
  assert.ok(apiCalls.includes(`/repos/${COINBLINK_REPOSITORY}/commits/${prHeadSha}/check-runs?per_page=100`));
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
