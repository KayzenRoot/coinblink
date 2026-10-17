import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { get } from "node:http";
import { createServer } from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  clearVisualCheckReport,
  removeFixtureTempRootAfterExit,
  waitForFixtureReady,
  writeVisualCheckFailure,
} from "./visual-server.mjs";

const announcedChild = (origin) => ({
  exitCode: null,
  signalCode: null,
  output: `Astro dev server Local ${origin}/`,
});
function httpGet(url, { signal }) {
  return new Promise((resolve, reject) => {
    const request = get(url, { signal }, (response) => {
      response.resume();
      resolve({ ok: response.statusCode >= 200 && response.statusCode < 400, status: response.statusCode });
    });
    request.once("error", reject);
  });
}

test("a TCP listener that accepts without sending response headers cannot hang readiness beyond its deadline", async () => {
  const sockets = new Set();
  let acceptedConnection = false;
  const server = createServer((socket) => {
    acceptedConnection = true;
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const startedAt = Date.now();

  try {
    await assert.rejects(waitForFixtureReady({
      child: announcedChild(origin),
      origin,
      timeoutMs: 150,
      intervalMs: 10,
      probe: httpGet,
    }), /did not become ready/u);
    assert.equal(acceptedConnection, true, "the readiness request reached the stalled TCP listener");
    assert.ok(Date.now() - startedAt < 1_000, "the total readiness time remains bounded");
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
});

test("a child exit while the probe is pending cannot be masked by a later HTTP 200", async (t) => {
  for (const termination of [{ exitCode: 0 }, { signalCode: "SIGTERM" }]) {
    await t.test(JSON.stringify(termination), async () => {
      const origin = "http://127.0.0.1:4397";
      const child = { ...announcedChild(origin) };
      let resolveProbe;
      let markProbeStarted;
      const probeStarted = new Promise((resolve) => { markProbeStarted = resolve; });
      const pendingProbe = new Promise((resolve) => { resolveProbe = resolve; });
      const readiness = waitForFixtureReady({
        child,
        origin,
        timeoutMs: 1_000,
        probe: () => {
          markProbeStarted();
          return pendingProbe;
        },
      });

      await probeStarted;
      Object.assign(child, termination);
      resolveProbe({ ok: true, status: 200 });
      await assert.rejects(readiness, termination.exitCode !== undefined ? /exited early with code 0/u : /exited early with signal SIGTERM/u);
    });
  }
});

test("the generated fixture directory is removed only after child exit is confirmed", async () => {
  const child = { exitCode: null, signalCode: null };
  const removals = [];
  const remove = async (path, options) => removals.push({ path, options });

  assert.equal(await removeFixtureTempRootAfterExit(child, "coinblink-m01-fixture-test", remove), false);
  assert.deepEqual(removals, [], "a live child keeps its isolated fixture directory");

  child.signalCode = "SIGTERM";
  assert.equal(await removeFixtureTempRootAfterExit(child, "coinblink-m01-fixture-test", remove), true);
  assert.deepEqual(removals, [{
    path: "coinblink-m01-fixture-test",
    options: { recursive: true, force: true },
  }]);
});

test("a fresh visual run clears the prior report instead of leaving stale passing evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "coinblink-m01-report-test-"));
  const reportPath = join(root, "nested", "visual-check.json");
  try {
    await mkdir(join(root, "nested"), { recursive: true });
    await writeFile(reportPath, JSON.stringify({ status: "passed" }), "utf8");
    await clearVisualCheckReport(reportPath);
    await assert.rejects(readFile(reportPath, "utf8"), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("failed visual runs retain the current diagnostic error and exact candidate identity", async () => {
  const root = await mkdtemp(join(tmpdir(), "coinblink-m01-report-test-"));
  const reportPath = join(root, "visual-check.json");
  const run = {
    baseSha: "07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c",
    headSha: "bc3f7b7c1c66dca10b778348d2e723196e4d8660",
    viewports: [],
    consoleErrors: ["fixture console error"],
  };
  try {
    await writeVisualCheckFailure(reportPath, run, new Error("expected visual assertion failure"));
    const saved = JSON.parse(await readFile(reportPath, "utf8"));
    assert.equal(saved.status, "failed");
    assert.deepEqual(saved.failure, { name: "Error", message: "expected visual assertion failure" });
    assert.equal(saved.baseSha, run.baseSha);
    assert.equal(saved.headSha, run.headSha);
    assert.deepEqual(saved.consoleErrors, ["fixture console error"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
