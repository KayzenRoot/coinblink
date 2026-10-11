import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";

export const visualInputPaths = Object.freeze(["src/modules/CB-M01", "assets/reference"]);

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
