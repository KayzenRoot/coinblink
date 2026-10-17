export const COINBLINK_REPOSITORY = "KayzenRoot/coinblink";
export const COINBLINK_OWNER_LOGIN = "KayzenRoot";
export const PRODUCTION_WORKER_NAME = "coinblink-production";
export const PRODUCTION_WORKER_URL = "https://coinblink-production.kayzendev.workers.dev";
export const CLOUDFLARE_ACCOUNT_ID = "91aeaffe2456eff6bb9ce76ce177bb3f";
export const COINBLINK_MAIN_RULESET_ID = 24888106;

export const REQUIRED_CHECKS = Object.freeze([
  "M00 and GEF (ubuntu-24.04)",
  "M00 and GEF (windows-2022)",
  "Docker Compose smoke (Ubuntu)",
  "SonarCloud Code Analysis",
  "Socket Security: Pull Request Alerts",
  "Socket Security: Project Report",
  "CodeRabbit",
]);

// These five required contexts are emitted on the resulting main commit.
// CodeRabbit and Socket Pull Request Alerts are emitted on the source PR SHA.
export const MAIN_COMMIT_CHECKS = Object.freeze([
  "M00 and GEF (ubuntu-24.04)",
  "M00 and GEF (windows-2022)",
  "Docker Compose smoke (Ubuntu)",
  "SonarCloud Code Analysis",
  "Socket Security: Project Report",
]);

const fullShaPattern = /^[0-9a-f]{40}$/;

function equalSet(left, right) {
  return left.length === right.length && new Set(left).size === left.length && left.every((value) => right.includes(value));
}

export function validateWorkflowRun(workflowRun, repository = COINBLINK_REPOSITORY) {
  const errors = [];
  if (workflowRun?.name !== "GEF validation") errors.push("unexpected workflow");
  if (workflowRun?.event !== "push") errors.push("source event is not a push");
  if (workflowRun?.head_branch !== "main") errors.push("source branch is not main");
  if (workflowRun?.repository?.full_name !== repository) errors.push("source repository is not trusted");
  if (workflowRun?.head_repository?.full_name && workflowRun.head_repository.full_name !== repository) {
    errors.push("source head repository is not trusted");
  }
  if (workflowRun?.conclusion !== "success") errors.push("GEF did not succeed");
  if (!fullShaPattern.test(workflowRun?.head_sha ?? "")) errors.push("source SHA is invalid");
  if (!Number.isSafeInteger(workflowRun?.id) || workflowRun.id <= 0) errors.push("workflow run ID is invalid");
  if (!Array.isArray(workflowRun?.pull_requests) || workflowRun.pull_requests.length !== 0) {
    errors.push("source run contains pull request context");
  }
  return errors;
}

export function validateMainSha(expectedSha, currentMainSha) {
  if (!fullShaPattern.test(expectedSha ?? "")) return ["expected main SHA is invalid"];
  if (expectedSha !== currentMainSha) return ["main advanced after the GEF run"];
  return [];
}

export function validateMergedPullRequest(pullRequest, expectedMergeSha, mainTreeSha, pullRequestHeadTreeSha) {
  const errors = [];
  if (!Number.isSafeInteger(pullRequest?.number) || pullRequest.number <= 0) errors.push("merged PR number is invalid");
  if (pullRequest?.state !== "closed" || !pullRequest?.merged_at) errors.push("associated PR is not merged");
  if (pullRequest?.merge_commit_sha !== expectedMergeSha) errors.push("associated PR merge SHA does not match main");
  if (!fullShaPattern.test(pullRequest?.head?.sha ?? "")) errors.push("associated PR head SHA is invalid");
  if (pullRequest?.merged_by?.login !== COINBLINK_OWNER_LOGIN) errors.push("associated PR was not merged by the authorized Owner");
  if (pullRequest?.base?.ref !== "main") errors.push("associated PR base is not main");
  if (pullRequest?.base?.repo?.full_name !== COINBLINK_REPOSITORY) errors.push("associated PR base repository is not trusted");
  if (pullRequest?.head?.repo?.full_name !== COINBLINK_REPOSITORY) errors.push("fork PRs cannot authorize deployment");
  if (!fullShaPattern.test(mainTreeSha ?? "") || !fullShaPattern.test(pullRequestHeadTreeSha ?? "")) {
    errors.push("source tree SHA is invalid");
  } else if (mainTreeSha !== pullRequestHeadTreeSha) {
    errors.push("merged PR tree differs from deployable main tree");
  }
  return errors;
}

function checkObservation(checkRun) {
  return {
    name: checkRun.name,
    at: checkRun.completed_at ?? checkRun.started_at ?? checkRun.created_at,
    passed: checkRun.status === "completed" && checkRun.conclusion === "success",
    source: "check_run",
  };
}

function statusObservation(status) {
  return {
    name: status.context,
    at: status.updated_at ?? status.created_at,
    passed: status.state === "success",
    source: "commit_status",
  };
}

export function verifyRequiredChecks({ checkRuns = [], statuses = [], requiredChecks }) {
  const errors = [];
  const observations = [
    ...checkRuns.map(checkObservation),
    ...statuses.map(statusObservation),
  ];

  for (const name of requiredChecks) {
    const matching = observations.filter((item) => item.name === name);
    if (matching.length === 0) {
      errors.push(`required check is missing: ${name}`);
      continue;
    }

    const timestamps = matching.map((item) => Date.parse(item.at ?? "")).filter(Number.isFinite);
    if (timestamps.length !== matching.length) {
      errors.push(`required check has an invalid timestamp: ${name}`);
      continue;
    }
    const latest = Math.max(...timestamps);
    const latestItems = matching.filter((item) => Date.parse(item.at) === latest);
    if (new Set(latestItems.map((item) => item.passed)).size !== 1 || !latestItems[0].passed) {
      errors.push(`latest required check did not succeed: ${name}`);
    }
  }
  return errors;
}

export function validateRuleset(ruleset) {
  const errors = [];
  if (ruleset?.id !== COINBLINK_MAIN_RULESET_ID) errors.push("unexpected ruleset ID");
  if (ruleset?.name !== "coinblink-main-governance") errors.push("unexpected ruleset name");
  if (ruleset?.source_type !== "Repository") errors.push("ruleset is not repository-scoped");
  if (ruleset?.enforcement !== "active") errors.push("main ruleset is not active");
  if (ruleset?.target !== "branch") errors.push("ruleset target is not branch");
  if (ruleset?.source !== COINBLINK_REPOSITORY) errors.push("ruleset source repository is not trusted");
  if ((ruleset?.bypass_actors ?? []).length !== 0) errors.push("ruleset bypass actors are configured");

  const refName = ruleset?.conditions?.ref_name;
  if (!equalSet(refName?.include ?? [], ["refs/heads/main"]) || (refName?.exclude ?? []).length !== 0) {
    errors.push("ruleset scope differs from refs/heads/main");
  }

  const rules = ruleset?.rules ?? [];
  const statusRules = rules.filter((rule) => rule.type === "required_status_checks");
  const statusRule = statusRules[0];
  const configuredChecks = statusRule?.parameters?.required_status_checks?.map((entry) => entry.context) ?? [];
  if (statusRules.length !== 1 || !statusRule || statusRule.parameters?.strict_required_status_checks_policy !== true || statusRule.parameters?.do_not_enforce_on_create !== false) {
    errors.push("required checks are not strict");
  }
  if (!equalSet(configuredChecks, REQUIRED_CHECKS)) errors.push("required check contexts differ from the seven approved contexts");

  const pullRequestRules = rules.filter((rule) => rule.type === "pull_request");
  const pullRequestRule = pullRequestRules[0];
  const pullRequest = pullRequestRule?.parameters;
  if (
    pullRequestRules.length !== 1 ||
    !pullRequestRule ||
    pullRequest?.required_approving_review_count !== 0 ||
    pullRequest?.require_last_push_approval !== false ||
    pullRequest?.dismiss_stale_reviews_on_push !== true ||
    pullRequest?.require_code_owner_review !== false ||
    pullRequest?.require_extra_approval_for_unattributed_changes !== true ||
    (pullRequest?.required_reviewers ?? []).length !== 0 ||
    pullRequest?.required_review_thread_resolution !== true ||
    !equalSet(pullRequest?.allowed_merge_methods ?? [], ["squash"])
  ) {
    errors.push("pull request protections differ from the approved single-admin ruleset");
  }
  for (const requiredRule of ["deletion", "non_fast_forward"]) {
    if (!rules.some((rule) => rule.type === requiredRule)) errors.push(`ruleset is missing ${requiredRule} protection`);
  }
  return errors;
}

export function validateProductionTarget({ repository, workerName, workerUrl, accountId }) {
  const errors = [];
  if (repository !== COINBLINK_REPOSITORY) errors.push("repository is not the authorized CoinBlink repository");
  if (workerName !== PRODUCTION_WORKER_NAME) errors.push("production Worker name is not the fixed target");
  if (workerUrl !== PRODUCTION_WORKER_URL) errors.push("production Worker URL is not the fixed workers.dev target");
  if (accountId !== CLOUDFLARE_ACCOUNT_ID) errors.push("Cloudflare account ID does not match the verified account");
  return errors;
}

const commercialPublicationMarkers = Object.freeze({
  authorization: "COINBLINK_COMMERCIAL_PUBLICATION_GATE=AUTHORIZED",
  rightsReview: "rightsReview=CLEARED",
  publicationAllowed: "commercialPublicationAllowed=true",
});

export function validateCommercialPublicationDecision(issue, latestComment) {
  const errors = [];
  if (issue?.number !== 72) errors.push("commercial rights gate is not Issue 72");
  if (issue?.state !== "closed") errors.push("commercial rights issue is not closed");
  if (!Number.isSafeInteger(latestComment?.id) || latestComment.id <= 0) errors.push("latest rights comment identity is invalid");
  if (latestComment?.user?.login !== COINBLINK_OWNER_LOGIN) errors.push("latest rights decision is not by the authorized Owner");

  const body = typeof latestComment?.body === "string" ? latestComment.body : "";
  const lines = body.split(/\r?\n/);
  for (const marker of Object.values(commercialPublicationMarkers)) {
    const matching = lines.filter((line) => line.startsWith(`${marker.split("=")[0]}=`));
    if (matching.length !== 1 || matching[0] !== marker) {
      errors.push(matching.length > 1
        ? "commercial publication decision is not unambiguous"
        : "latest rights decision lacks explicit authorization");
    }
  }

  const evidenceLines = lines.filter((line) => line.startsWith("rightsEvidence="));
  if (evidenceLines.length !== 1) {
    errors.push("latest rights decision must contain one HTTPS evidence URL");
  } else {
    try {
      const evidenceUrl = new URL(evidenceLines[0].slice("rightsEvidence=".length));
      if (evidenceUrl.protocol !== "https:" || !evidenceUrl.hostname || evidenceUrl.username || evidenceUrl.password) {
        errors.push("latest rights decision evidence URL must use HTTPS");
      }
    } catch {
      errors.push("latest rights decision evidence URL is invalid");
    }
  }

  return errors;
}

export function isFullCommitSha(value) {
  return fullShaPattern.test(value ?? "");
}
