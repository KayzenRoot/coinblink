import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  assertVisualInputsClean,
  resolveGitExecutable,
  visualInputPaths,
} from "./visual-input-state.mjs";

const gitExecutable = resolveGitExecutable();

async function createRepository(t) {
  const root = await mkdtemp(join(tmpdir(), "coinblink-m01-visual-inputs-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync(gitExecutable, ["init", "--quiet", root], { stdio: "pipe" });
  execFileSync(gitExecutable, ["-C", root, "config", "user.name", "CoinBlink test"], { stdio: "pipe" });
  execFileSync(gitExecutable, ["-C", root, "config", "user.email", "coinblink-test@example.invalid"], { stdio: "pipe" });
  for (const path of visualInputPaths) {
    const filePath = extname(path) ? join(root, path) : join(root, path, "fixture.txt");
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, "committed visual input\n", "utf8");
  }
  execFileSync(gitExecutable, ["-C", root, "add", "--all"], { stdio: "pipe" });
  execFileSync(gitExecutable, ["-C", root, "-c", "user.name=CoinBlink test", "-c", "user.email=coinblink-test@example.invalid", "commit", "--quiet", "-m", "fixture"], { stdio: "pipe" });
  return root;
}

test("visual source inputs are clean relative to the commit before claiming exact-HEAD evidence", async (t) => {
  const root = await createRepository(t);
  const result = assertVisualInputsClean(root, { gitExecutable });
  assert.deepEqual(result, { status: "clean", paths: visualInputPaths });
});

test("visual provenance covers every rendered source and fixture configuration input", () => {
  for (const path of [
    "src/layouts/BaseLayout.astro",
    "src/styles/global.css",
    "test/modules/CB-M01/fixture/src",
    ".engineering/evidence/CB-M01-WO-001/astro-fixture.config.mjs",
    "test/modules/CB-M01/visual-check.mjs",
    "test/modules/CB-M01/visual-server.mjs",
    "test/modules/CB-M01/visual-request-origin.mjs",
    "package-lock.json",
  ]) assert.ok(visualInputPaths.includes(path), "missing visual input from provenance boundary: " + path);
});
test("staged and unstaged Golden Home changes invalidate exact-HEAD visual evidence", async (t) => {
  const root = await createRepository(t);
  const component = join(root, visualInputPaths[0], "fixture.txt");
  await writeFile(component, "staged change\n", "utf8");
  execFileSync(gitExecutable, ["-C", root, "add", "--", `${visualInputPaths[0]}/fixture.txt`], { stdio: "pipe" });
  await writeFile(component, "unstaged change\n", "utf8");

  assert.throws(
    () => assertVisualInputsClean(root, { gitExecutable }),
    /visual source inputs are not clean relative to HEAD/u,
  );
});

test("untracked Golden Home sources also invalidate exact-HEAD visual evidence", async (t) => {
  const root = await createRepository(t);
  const untracked = join(root, visualInputPaths[0], "untracked.astro");
  await writeFile(untracked, "<p>Uncommitted visual source</p>\n", "utf8");

  assert.throws(
    () => assertVisualInputsClean(root, { gitExecutable }),
    /untracked\.astro/u,
  );
});

test("Git executable resolution uses only fixed system locations and never PATH lookup", () => {
  const argumentCounts = [];
  assert.throws(
    () => resolveGitExecutable({ platform: "win32", fileExists: () => false }),
    /fixed system location/u,
  );
  assert.equal(
    resolveGitExecutable({
      platform: "win32",
      fileExists: function (candidate) {
        argumentCounts.push(arguments.length);
        return candidate === "C:\\Program Files\\Git\\cmd\\git.exe";
      },
    }),
    "C:\\Program Files\\Git\\cmd\\git.exe",
  );
  assert.deepEqual(argumentCounts, [1]);
});
