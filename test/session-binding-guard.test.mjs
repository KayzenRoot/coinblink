import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { test } from "node:test";

const guardPath = resolve("scripts/assert-no-session-binding.mjs");

function runGuard(config) {
  const directory = mkdtempSync(join(tmpdir(), "coinblink-worker-binding-"));
  const relativePath = relative(tmpdir(), directory);
  assert.ok(relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath));

  try {
    const serverDirectory = join(directory, "dist", "server");
    mkdirSync(serverDirectory, { recursive: true });
    writeFileSync(join(serverDirectory, "wrangler.json"), JSON.stringify(config));
    const result = spawnSync(process.execPath, [guardPath], { cwd: directory, encoding: "utf8" });
    assert.equal(result.error, undefined);
    return result;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("accepts the approved static asset binding", () => {
  const result = runGuard({ assets: { binding: "ASSETS" }, vars: {} });
  assert.equal(result.status, 0, result.stderr);
});

test("rejects a SESSION binding nested in a namespace list", () => {
  const result = runGuard({
    assets: { binding: "ASSETS" },
    kv_namespaces: [{ binding: "SESSION", id: "session-store" }],
    vars: {},
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unrequested SESSION binding/);
});
