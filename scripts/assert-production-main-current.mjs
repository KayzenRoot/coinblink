import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { COINBLINK_REPOSITORY, isFullCommitSha } from "./cloudflare-production-policy.mjs";

export async function verifyProductionMainCurrent({
  expectedSha,
  repository,
  ref,
  githubToken,
  fetchImpl = fetch,
  execFile = execFileSync,
} = {}) {
  if (repository !== COINBLINK_REPOSITORY) throw new Error("Repository is not the authorized CoinBlink repository.");
  if (ref !== "refs/heads/main") throw new Error("Deployment job is not running for refs/heads/main.");
  if (!isFullCommitSha(expectedSha)) throw new Error("Expected production SHA must be a full commit SHA.");

  const checkedOutSha = execFile("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (checkedOutSha !== expectedSha) throw new Error("Checked out source does not match the eligible main SHA.");

  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "coinblink-production-main-head-guard",
    "x-github-api-version": "2022-11-28",
  };
  if (typeof githubToken === "string" && githubToken.length > 0) headers.authorization = `Bearer ${githubToken}`;
  const response = await fetchImpl(`https://api.github.com/repos/${COINBLINK_REPOSITORY}/commits/main`, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`GitHub main lookup failed with HTTP ${response.status}.`);
  const currentMain = await response.json();
  if (!isFullCommitSha(currentMain?.sha)) throw new Error("GitHub main lookup returned an invalid commit SHA.");
  if (currentMain.sha !== expectedSha) throw new Error("main advanced before production deployment.");
  return expectedSha;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const sha = await verifyProductionMainCurrent({
      expectedSha: process.env.EXPECTED_MAIN_SHA,
      repository: process.env.GITHUB_REPOSITORY,
      ref: process.env.GITHUB_REF,
      githubToken: process.env.GITHUB_TOKEN,
    });
    console.log(`Verified exact current main source ${sha}.`);
  } catch (error) {
    console.error(`Production source guard blocked: ${error instanceof Error ? error.message : "unknown failure"}`);
    process.exitCode = 1;
  }
}
