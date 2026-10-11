import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";

export const visualInputPaths = Object.freeze([
  "src/modules/CB-M01",
  "src/layouts/BaseLayout.astro",
  "src/styles/global.css",
  "assets/reference",
  "test/modules/CB-M01/fixture/src",
  ".engineering/evidence/CB-M01-WO-001/astro-fixture.config.mjs",
  "test/modules/CB-M01/visual-check.mjs",
  "test/modules/CB-M01/visual-server.mjs",
  "test/modules/CB-M01/visual-input-state.mjs",
  "test/modules/CB-M01/visual-request-origin.mjs",
  "test/modules/CB-M01/git-head.mjs",
  "test/modules/CB-M01/GoldenHome.contract.test.mjs",
  "test/modules/CB-M01/visual-server.test.mjs",
  "test/modules/CB-M01/visual-input-state.test.mjs",
  "test/modules/CB-M01/visual-request-origin.test.mjs",
  "test/modules/CB-M01/git-head.test.mjs",
  "package.json",
  "package-lock.json",
]);

export function resolveGitExecutable({ platform = process.platform, fileExists = existsSync } = {}) {
  const candidates = platform === "win32"
    ? [
      "C:\\Program Files\\Git\\cmd\\git.exe",
      "C:\\Program Files\\Git\\bin\\git.exe",
      "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
      "C:\\Program Files (x86)\\Git\\bin\\git.exe",
    ]
    : ["/usr/bin/git", "/bin/git", "/usr/local/bin/git"];
  const resolved = candidates.find(fileExists);
  if (resolved) return resolved;
  throw new Error("Git was not found at a fixed system location; visual evidence cannot be bound to a clean HEAD");
}

export function assertVisualInputsClean(repositoryRoot, { gitExecutable = resolveGitExecutable() } = {}) {
  if (!isAbsolute(gitExecutable)) throw new Error("visual input verification requires an absolute Git executable path");
  const status = execFileSync(gitExecutable, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--",
    ...visualInputPaths,
  ], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const dirtyEntries = status.split(/\r?\n/u).filter(Boolean);
  if (dirtyEntries.length > 0) {
    throw new Error(`visual source inputs are not clean relative to HEAD: ${dirtyEntries.map((entry) => entry.slice(3)).join(", ")}`);
  }
  return { status: "clean", paths: visualInputPaths };
}
