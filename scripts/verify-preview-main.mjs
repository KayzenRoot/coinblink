import { execFileSync } from "node:child_process";
import { validatePreviewMainIdentity } from "./cloudflare-preview-policy.mjs";

const headSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const remoteLine = execFileSync("git", ["ls-remote", "origin", "refs/heads/main"], { encoding: "utf8" }).trim();
const currentMainSha = remoteLine.split(/\s+/)[0] ?? "";
const errors = validatePreviewMainIdentity({
  repository: process.env.GITHUB_REPOSITORY,
  ref: process.env.GITHUB_REF,
  sha: process.env.GITHUB_SHA,
  headSha,
  currentMainSha,
});

if (errors.length > 0) {
  console.error(`Preview workflow stopped: ${errors.join("; ")}.`);
  process.exit(1);
}

console.log(`Verified canonical main SHA ${headSha}.`);
