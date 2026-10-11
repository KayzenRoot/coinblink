import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { get } from "node:http";
import { createServer } from "node:net";
import test from "node:test";
import { buildAstroDevArgs, childAnnouncedOrigin, cleanupVisualFixture, waitForAstroServer } from "./visual-server.mjs";

function httpGet(url, { signal }) {
  return new Promise((resolve, reject) => {
    const request = get(url, { signal }, (response) => {
      response.resume();
      resolve({ ok: response.statusCode >= 200 && response.statusCode < 400, status: response.statusCode });
    });
    request.once("error", reject);
  });
}

function deterministicClock() {
  let time = 0;
  return {
    now: () => time,
    sleep: async (milliseconds) => { time += milliseconds; },
  };
}

test("a reachable stale process cannot satisfy Astro readiness before child origin announcement", async () => {
  const clock = deterministicClock();
  const probeUrls = [];
  await assert.rejects(waitForAstroServer({
    child: { exitCode: null },
    expectedOrigin: "http://127.0.0.1:4397",
    getChildOutput: () => "Astro dev process has not announced a local URL yet",
    probe: async (url) => {
      probeUrls.push(url.toString());
      return { ok: true, status: 200 };
    },
    timeoutMs: 10,
    intervalMs: 5,
    ...clock,
  }), /did not become ready/u);
  assert.deepEqual(probeUrls, [], "readiness must not probe or accept a potentially stale listener before Astro announces its origin");
});

test("Astro dev arguments require the requested port instead of silently choosing another", () => {
  assert.deepEqual(buildAstroDevArgs("astro.mjs", 4397), [
    "astro.mjs", "dev", "--host", "127.0.0.1", "--port", "4397", "--strictPort",
  ]);
});

test("an Astro child that exits because strict binding failed cannot pass readiness", async () => {
  let probes = 0;
  await assert.rejects(waitForAstroServer({
    child: { exitCode: 1 },
    expectedOrigin: "http://127.0.0.1:4397",
    getChildOutput: () => "Port 4397 is in use",
    probe: async () => { probes += 1; return { ok: true, status: 200 }; },
  }), /exited early with code 1/u);
  assert.equal(probes, 0, "a different listener cannot mask Astro's strict-port bind failure");
});

test("a signaled Astro child cannot be masked by a listener that rebinds its announced origin", async () => {
  let probes = 0;
  await assert.rejects(waitForAstroServer({
    child: { exitCode: null, signalCode: "SIGTERM" },
    expectedOrigin: "http://127.0.0.1:4397",
    getChildOutput: () => "┃ Local http://127.0.0.1:4397/",
    probe: async () => { probes += 1; return { ok: true, status: 200 }; },
  }), /signal SIGTERM/u);
  assert.equal(probes, 0, "a replacement listener returning HTTP 200 cannot mask Astro child termination by signal");
});

test("a different Local origin is not accepted as the child server origin", async () => {
  const clock = deterministicClock();
  let probes = 0;
  await assert.rejects(waitForAstroServer({
    child: { exitCode: null },
    expectedOrigin: "http://127.0.0.1:4397",
    getChildOutput: () => "┃ Local http://127.0.0.1:4398/",
    probe: async () => { probes += 1; return { ok: true, status: 200 }; },
    timeoutMs: 10,
    intervalMs: 5,
    ...clock,
  }), /did not become ready/u);
  assert.equal(probes, 0);
});

test("readiness probes the requested route after Astro announces the matching Local origin", async () => {
  let probedUrl;
  const response = { ok: true, status: 200 };
  const result = await waitForAstroServer({
    child: { exitCode: null },
    expectedOrigin: "http://127.0.0.1:4397",
    getChildOutput: () => "\u001B[36m┃ Local http://127.0.0.1:4397/\u001B[39m",
    probe: async (url) => { probedUrl = url.toString(); return response; },
  });
  assert.equal(probedUrl, "http://127.0.0.1:4397/admin/articles");
  assert.equal(result, response);
});

test("an accepted TCP connection without response headers is aborted at the readiness deadline", async () => {
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
  const expectedOrigin = `http://127.0.0.1:${address.port}`;
  const startedAt = Date.now();

  try {
    await assert.rejects(waitForAstroServer({
      child: { exitCode: null, signalCode: null },
      expectedOrigin,
      getChildOutput: () => `Astro dev ┃ Local ${expectedOrigin}/`,
      timeoutMs: 150,
      intervalMs: 10,
      probe: httpGet,
    }), /did not become ready/u);
    assert.equal(acceptedConnection, true, "the readiness probe reaches the stalled TCP peer");
    assert.ok(Date.now() - startedAt < 1_000, "the readiness deadline bounds the total wait");
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
});

test("a child exit while its probe is pending cannot be masked by a later HTTP 200", async (t) => {
  for (const termination of [{ exitCode: 0 }, { signalCode: "SIGTERM" }]) {
    await t.test(JSON.stringify(termination), async () => {
      const expectedOrigin = "http://127.0.0.1:4397";
      const child = { exitCode: null, signalCode: null };
      let resolveProbe;
      let markProbeStarted;
      const probeStarted = new Promise((resolve) => { markProbeStarted = resolve; });
      const pendingProbe = new Promise((resolve) => { resolveProbe = resolve; });
      const readiness = waitForAstroServer({
        child,
        expectedOrigin,
        getChildOutput: () => `Astro dev ┃ Local ${expectedOrigin}/`,
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

test("child origin matching ignores terminal color escapes but requires Astro's Local line", () => {
  assert.equal(childAnnouncedOrigin("\u001B[36m┃ Local http://127.0.0.1:4397/\u001B[39m", "http://127.0.0.1:4397"), true);
  assert.equal(childAnnouncedOrigin("worker says http://127.0.0.1:4397/", "http://127.0.0.1:4397"), false);
});

test("Astro shutdown runs even when Chromium close rejects", async () => {
  const child = new EventEmitter();
  child.exitCode = null;
  child.signalCode = null;
  const signals = [];
  child.kill = (signal) => {
    signals.push(signal);
    if (signal === "SIGTERM") {
      setImmediate(() => {
        child.exitCode = 0;
        child.emit("exit", 0, null);
      });
    }
    return true;
  };
  const browserError = new Error("Chromium close failed");
  const browser = { close: async () => { throw browserError; } };

  await assert.rejects(cleanupVisualFixture({ browser, server: child }), browserError);
  assert.deepEqual(signals, ["SIGTERM"], "Astro receives graceful termination after browser cleanup fails");
  assert.equal(child.exitCode, 0, "Astro exit is observed before cleanup completes");
});
