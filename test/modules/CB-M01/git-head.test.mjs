import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { readGitHead } from "./git-head.mjs";

const commit = "ad702bbc9f92c1946a91926896d8d2fc8c3b4ead";

async function createRoot(t) {
  const root = await mkdtemp(join(tmpdir(), "coinblink-m01-git-head-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("reads a detached commit directly from a regular clone HEAD", async (t) => {
  const root = await createRoot(t);
  await mkdir(join(root, ".git"));
  await writeFile(join(root, ".git", "HEAD"), commit + "\n", "utf8");
  assert.equal(await readGitHead(root), commit);
});

test("reads a loose branch ref through a linked-worktree gitdir and commondir", async (t) => {
  const root = await createRoot(t);
  const commonGitDir = join(root, "common", ".git");
  const worktreeGitDir = join(commonGitDir, "worktrees", "feature");
  const worktreeRoot = join(root, "feature-worktree");
  await mkdir(join(worktreeGitDir, "refs", "heads"), { recursive: true });
  await mkdir(worktreeRoot);
  await writeFile(join(worktreeRoot, ".git"), "gitdir: " + worktreeGitDir + "\n", "utf8");
  await writeFile(join(worktreeGitDir, "HEAD"), "ref: refs/heads/feature\n", "utf8");
  await writeFile(join(worktreeGitDir, "commondir"), "../..\n", "utf8");
  await mkdir(join(commonGitDir, "refs", "heads"), { recursive: true });
  await writeFile(join(commonGitDir, "refs", "heads", "feature"), commit + "\n", "utf8");
  assert.equal(await readGitHead(worktreeRoot), commit);
});

test("accepts a case-insensitive gitdir marker with whitespace before its path", async (t) => {
  const root = await createRoot(t);
  const worktreeRoot = join(root, "feature-worktree");
  const gitDirectory = join(root, "linked-git-directory");
  await mkdir(worktreeRoot);
  await mkdir(gitDirectory);
  await writeFile(join(worktreeRoot, ".git"), `GITDIR: \t  ${gitDirectory}\n`, "utf8");
  await writeFile(join(gitDirectory, "HEAD"), `${commit}\n`, "utf8");

  assert.equal(await readGitHead(worktreeRoot), commit);
});

test("rejects a gitdir marker with an extra non-whitespace line", async (t) => {
  const root = await createRoot(t);
  const worktreeRoot = join(root, "feature-worktree");
  await mkdir(worktreeRoot);
  await writeFile(join(worktreeRoot, ".git"), `gitdir: ${join(root, "somewhere")}\nextra\n`, "utf8");

  await assert.rejects(readGitHead(worktreeRoot), /invalid Git directory marker/u);
});

test("resolves packed refs when no loose branch ref exists", async (t) => {
  const root = await createRoot(t);
  const gitDir = join(root, ".git");
  await mkdir(gitDir);
  await writeFile(join(gitDir, "HEAD"), "ref: refs/heads/main\n", "utf8");
  await writeFile(join(gitDir, "packed-refs"), "# pack-refs with: peeled fully-peeled\n" + commit + " refs/heads/main\n", "utf8");
  assert.equal(await readGitHead(root), commit);
});

test("rejects malformed or missing Git refs rather than guessing a commit", async (t) => {
  const root = await createRoot(t);
  const gitDir = join(root, ".git");
  await mkdir(gitDir);
  await writeFile(join(gitDir, "HEAD"), "ref: refs/heads/../main\n", "utf8");
  await assert.rejects(readGitHead(root), /invalid Git HEAD reference/u);

  await writeFile(join(gitDir, "HEAD"), "ref: refs/heads/missing\n", "utf8");
  await assert.rejects(readGitHead(root), /could not resolve Git HEAD reference/u);
});
