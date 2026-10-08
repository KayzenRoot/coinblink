import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(root, ".engineering", "evidence", "CB-BOOT-001-matt-skills.json");
const expectedNames = ["diagnosing-bugs", "tdd", "writing-for-agents"];

test("the selected Matt Pocock skills are pinned and discoverable as Codex project skills", async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.sourceRepository, "https://github.com/mattpocock/skills");
  assert.match(manifest.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(manifest.authority, /advisory only/);
  assert.deepEqual(manifest.skills.map((skill) => skill.name).sort(), expectedNames);

  const installedDirectories = (await readdir(join(root, ".agents", "skills"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(installedDirectories, expectedNames);

  for (const skill of manifest.skills) {
    const skillRoot = resolve(root, skill.localPath);
    assert.ok(skillRoot.startsWith(`${resolve(root, ".agents", "skills")}${sep}`));
    const listed = new Set();
    for (const file of skill.files) {
      const absolute = resolve(root, file.path);
      assert.ok(absolute.startsWith(`${skillRoot}${sep}`));
      const bytes = await readFile(absolute);
      const digest = createHash("sha256").update(bytes).digest("hex");
      assert.equal(digest, file.sha256, `pinned file changed: ${file.path}`);
      listed.add(file.path);
    }

    const skillFile = [...listed].find((file) => file.endsWith("/SKILL.md"));
    assert.ok(skillFile, `missing SKILL.md for ${skill.name}`);
    const contents = await readFile(resolve(root, skillFile), "utf8");
    assert.match(contents, /^---\n[\s\S]*?^name:\s*[^\n]+\n/m);
    assert.match(contents, new RegExp(`^name: ${skill.name}$`, "m"));
    assert.ok([...listed].some((file) => file.endsWith("/agents/openai.yaml")), `missing Codex metadata for ${skill.name}`);
  }
});
