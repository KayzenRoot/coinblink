import { execFileSync } from "node:child_process";

const expected = process.env.EXPECTED_SHA;
if (typeof expected !== "string" || !/^[0-9a-f]{40}$/.test(expected)) {
  console.error("EXPECTED_SHA must be a full 40-character commit SHA.");
  process.exit(2);
}

let actual;
try {
  actual = execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  console.error("Unable to read the checked-out commit with git rev-parse HEAD.");
  process.exit(2);
}

if (actual !== expected) {
  console.error(`Exact-head mismatch: expected ${expected} but checked out ${actual}.`);
  process.exit(1);
}

console.log(`Verified exact commit ${actual}.`);
