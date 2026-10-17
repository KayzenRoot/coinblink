import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  COINBLINK_REPOSITORY,
  MAIN_COMMIT_CHECKS,
  REQUIRED_CHECKS,
  isFullCommitSha,
  validateDemoDeploymentAuthorization,
  validateMainSha,
  validateMergedPullRequest,
  validateWorkflowRun,
  verifyRequiredChecks,
} from "./cloudflare-production-policy.mjs";

const apiRoot = "https://api.github.com";
const checkAttempts = 4;
const retryDelayMs = 5_000;

function requireApiResponse(response) {
  if (!response.ok) throw new Error(`GitHub API request failed with HTTP ${response.status}.`);
}

export function createGitHubApi({ token, fetchImpl = fetch } = {}) {
  if (typeof token !== "string" || token.length < 20) throw new Error("GITHUB_TOKEN is unavailable.");
  return async function githubApi(path) {
    const response = await fetchImpl(new URL(path, apiRoot), {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "user-agent": "coinblink-main-only-production-deploy-guard",
        "x-github-api-version": "2022-11-28",
      },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    requireApiResponse(response);
    return response.json();
  };
}

async function currentMainSha(githubApi) {
  const result = await githubApi(`/repos/${COINBLINK_REPOSITORY}/commits/main`);
  if (!isFullCommitSha(result?.sha)) throw new Error("GitHub main lookup returned an invalid commit SHA.");
  return result.sha;
}

async function verifyCheckContexts(githubApi, sha, requiredChecks, label, sleep) {
  let lastErrors = [];
  for (let attempt = 0; attempt < checkAttempts; attempt += 1) {
    const [checks, combinedStatus] = await Promise.all([
      githubApi(`/repos/${COINBLINK_REPOSITORY}/commits/${sha}/check-runs?per_page=100`),
      githubApi(`/repos/${COINBLINK_REPOSITORY}/commits/${sha}/status`),
    ]);
    if (!Array.isArray(checks?.check_runs) || checks.total_count > 100 || !Array.isArray(combinedStatus?.statuses)) {
      throw new Error(`${label} check response is incomplete.`);
    }
    lastErrors = verifyRequiredChecks({
      checkRuns: checks.check_runs,
      statuses: combinedStatus.statuses,
      requiredChecks,
    });
    if (lastErrors.length === 0) return;

    const onlyMissing = lastErrors.every((message) => message.startsWith("required check is missing:"));
    if (!onlyMissing || attempt + 1 >= checkAttempts) break;
    await sleep(retryDelayMs);
  }
  throw new Error(`${label} required checks failed: ${lastErrors.join("; ")}`);
}

async function findMergedPullRequest(githubApi, mainSha) {
  const candidates = await githubApi(`/repos/${COINBLINK_REPOSITORY}/commits/${mainSha}/pulls?per_page=100`);
  if (!Array.isArray(candidates) || candidates.length > 100) throw new Error("GitHub returned an incomplete main PR association list.");
  const matches = candidates.filter((candidate) => candidate?.merge_commit_sha === mainSha);
  if (matches.length !== 1) throw new Error("main SHA does not map to exactly one merged pull request.");
  if (!Number.isSafeInteger(matches[0]?.number) || matches[0].number <= 0 || !isFullCommitSha(matches[0]?.head?.sha)) {
    throw new Error("Associated main PR identity is incomplete.");
  }

  const pullRequest = await githubApi(`/repos/${COINBLINK_REPOSITORY}/pulls/${matches[0].number}`);
  if (pullRequest?.head?.sha !== matches[0].head?.sha) {
    throw new Error("Associated pull request head changed during eligibility verification.");
  }
  const mainCommit = await githubApi(`/repos/${COINBLINK_REPOSITORY}/commits/${mainSha}`);
  const pullRequestHeadCommit = await githubApi(`/repos/${COINBLINK_REPOSITORY}/commits/${pullRequest.head.sha}`);
  const errors = validateMergedPullRequest(
    pullRequest,
    mainSha,
    mainCommit?.commit?.tree?.sha,
    pullRequestHeadCommit?.commit?.tree?.sha,
  );
  if (errors.length > 0) throw new Error(`Merged PR source verification failed: ${errors.join("; ")}`);
  return pullRequest;
}

async function verifyGefeRun(githubApi, workflowRun) {
  const [workflow, run] = await Promise.all([
    githubApi(`/repos/${COINBLINK_REPOSITORY}/actions/workflows/gef-validation.yml`),
    githubApi(`/repos/${COINBLINK_REPOSITORY}/actions/runs/${workflowRun.id}`),
  ]);
  if (workflow?.path !== ".github/workflows/gef-validation.yml" || workflow?.state !== "active") {
    throw new Error("Canonical GEF workflow could not be verified.");
  }
  if (
    run?.id !== workflowRun.id ||
    run?.workflow_id !== workflow.id ||
    run?.name !== "GEF validation" ||
    run?.event !== "push" ||
    run?.head_branch !== "main" ||
    run?.head_sha !== workflowRun.head_sha ||
    run?.conclusion !== "success" ||
    run?.repository?.full_name !== COINBLINK_REPOSITORY ||
    (run?.pull_requests ?? []).length !== 0
  ) {
    throw new Error("Completed GEF run does not prove a successful trusted push to main.");
  }
}

export async function verifyProductionDeployEligibility({
  event,
  repository,
  publicDemoDeploymentAuthorization,
  commercialPublicationAllowed,
  token,
  fetchImpl = fetch,
  githubApi: injectedApi,
  sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)),
} = {}) {
  if (repository !== COINBLINK_REPOSITORY) throw new Error("Workflow repository is not authorized.");
  const authorizationErrors = validateDemoDeploymentAuthorization({
    authorization: publicDemoDeploymentAuthorization,
    commercialPublicationAllowed,
  });
  if (authorizationErrors.length > 0) {
    throw new Error(`Demo deployment authorization blocked: ${authorizationErrors.join("; ")}`);
  }
  const workflowRun = event?.workflow_run;
  const eventErrors = validateWorkflowRun(workflowRun);
  if (eventErrors.length > 0) throw new Error(`Workflow run rejected: ${eventErrors.join("; ")}`);

  const githubApi = injectedApi ?? createGitHubApi({ token, fetchImpl });
  await verifyGefeRun(githubApi, workflowRun);

  const expectedSha = workflowRun.head_sha;
  const firstMainSha = await currentMainSha(githubApi);
  const shaErrors = validateMainSha(expectedSha, firstMainSha);
  if (shaErrors.length > 0) throw new Error(`Deployment stopped: ${shaErrors.join("; ")}`);

  const pullRequest = await findMergedPullRequest(githubApi, expectedSha);
  await Promise.all([
    verifyCheckContexts(githubApi, expectedSha, MAIN_COMMIT_CHECKS, "main SHA", sleep),
    verifyCheckContexts(githubApi, pullRequest.head.sha, REQUIRED_CHECKS, "merged PR head", sleep),
  ]);

  const mainCommit = await githubApi(`/repos/${COINBLINK_REPOSITORY}/commits/${expectedSha}`);
  const finalMainSha = await currentMainSha(githubApi);
  const finalShaErrors = validateMainSha(expectedSha, finalMainSha);
  if (finalShaErrors.length > 0) throw new Error(`Deployment stopped: ${finalShaErrors.join("; ")}`);

  return {
    mainSha: expectedSha,
    mainTreeSha: mainCommit?.commit?.tree?.sha,
    pullRequestNumber: pullRequest.number,
    pullRequestHeadSha: pullRequest.head.sha,
    deploymentScope: "DEMO_ONLY",
    commercialPublicationAllowed: false,
  };
}

export async function runProductionDeployEligibility({ env = process.env, logger = console } = {}) {
  try {
    const eventPath = env.GITHUB_EVENT_PATH;
    if (typeof eventPath !== "string" || eventPath.length === 0) throw new Error("GitHub event payload is unavailable.");
    const event = JSON.parse(readFileSync(eventPath, "utf8"));
    const result = await verifyProductionDeployEligibility({
      event,
      repository: env.GITHUB_REPOSITORY,
      publicDemoDeploymentAuthorization: env.COINBLINK_PUBLIC_DEMO_DEPLOYMENT,
      commercialPublicationAllowed: env.COINBLINK_COMMERCIAL_PUBLICATION_ALLOWED,
      token: env.GITHUB_TOKEN,
    });
    if (typeof env.GITHUB_OUTPUT !== "string" || env.GITHUB_OUTPUT.length === 0) {
      throw new Error("GitHub workflow output path is unavailable.");
    }
    appendFileSync(env.GITHUB_OUTPUT, `main_sha=${result.mainSha}\nsource_pr=${result.pullRequestNumber}\n`, "utf8");
    if (typeof env.GITHUB_STEP_SUMMARY === "string" && env.GITHUB_STEP_SUMMARY.length > 0) {
      appendFileSync(
        env.GITHUB_STEP_SUMMARY,
        `\n### Cloudflare main-only preflight\n\n- Main SHA: \`${result.mainSha}\`\n- Main tree: \`${result.mainTreeSha}\`\n- Merged source PR: #${result.pullRequestNumber} at \`${result.pullRequestHeadSha}\`\n- Main commit contexts: 5/5 successful\n- Merged PR contexts: 7/7 successful; its source tree must equal main\n- Owner deployment scope: DEMO_ONLY\n- Commercial publication: disabled; this workflow does not grant or infer rights clearance\n- Result: eligible for the protected production job only.\n`,
        "utf8",
      );
    }
    logger.log("Main-only production preflight passed.");
    return 0;
  } catch {
    logger.error("Cloudflare production preflight blocked; details withheld.");
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await runProductionDeployEligibility();
}
