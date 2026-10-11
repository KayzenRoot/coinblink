import assert from "node:assert/strict";
import test from "node:test";
import { buildAstroDevArgs, childAnnouncedOrigin, waitForAstroServer } from "./visual-server.mjs";

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

test("child origin matching ignores terminal color escapes but requires Astro's Local line", () => {
  assert.equal(childAnnouncedOrigin("\u001B[36m┃ Local http://127.0.0.1:4397/\u001B[39m", "http://127.0.0.1:4397"), true);
  assert.equal(childAnnouncedOrigin("worker says http://127.0.0.1:4397/", "http://127.0.0.1:4397"), false);
});
