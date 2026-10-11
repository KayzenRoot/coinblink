import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import {
  createPreviewEvidenceBrowserContext,
  createPreviewEvidenceRouteHandler,
} from "../scripts/preview-evidence-origin-guard.mjs";
import { clearStalePreviewEvidenceArtifacts } from "../scripts/preview-evidence-output-cleanup.mjs";

let originServer;
let targetServer;
let browser;
let origin;
let target;
let targetHits;

before(async () => {
  targetHits = [];
  targetServer = createServer((request, response) => {
    targetHits.push(request.url);
    response.end("redirect destination must not be reached");
  });
  await new Promise((resolve) => targetServer.listen(0, "127.0.0.1", resolve));
  target = `http://127.0.0.1:${targetServer.address().port}`;

  originServer = createServer((request, response) => {
    if (request.url === "/service-worker.js") {
      response.writeHead(200, { "content-type": "application/javascript" });
      response.end("self.addEventListener('fetch', () => {});");
      return;
    }

    if (request.url === "/service-worker-page") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<!doctype html><html><body>Service Worker guard fixture</body></html>");
      return;
    }

    if (request.url === "/") {
      response.writeHead(200, { "content-type": "text/html" });
      response.end('<!doctype html><html><body><img id="redirected" src="/redirect-resource"></body></html>');
      return;
    }
    const destinationPath = request.url === "/redirect-resource" ? "/resource" : "/navigation";
    response.writeHead(302, { location: `${target}${destinationPath}` });
    response.end();
  });
  await new Promise((resolve) => originServer.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${originServer.address().port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  await Promise.all(
    [originServer, targetServer].map(
      (server) => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    ),
  );
});

function installGuard(page, blockedRedirects) {
  return page.route(
    "**/*",
    createPreviewEvidenceRouteHandler({
      allowedOrigins: new Set([origin]),
      blockedOrigins: [],
      blockedRedirects,
      routeFetchErrors: [],
      allowInsecureLoopbackForTest: true,
    }),
  );
}

test("blocks a cross-origin redirect from a document subresource before fetching its destination", async () => {
  targetHits.length = 0;
  const context = await createPreviewEvidenceBrowserContext(browser, { ignoreHTTPSErrors: false });
  try {
    const page = await context.newPage();
    const blockedRedirects = [];
    await installGuard(page, blockedRedirects);
    await page.goto(`${origin}/`, { waitUntil: "networkidle" });

    assert.equal(targetHits.length, 0);
    assert.equal(blockedRedirects.length, 1);
    assert.deepEqual(blockedRedirects[0], {
      source: `${origin}/redirect-resource`,
      destination: `${target}/resource`,
    });
  } finally {
    await context.close();
  }
});

test("registers the Service Worker fixture when a regular context explicitly allows it", async () => {
  const context = await browser.newContext({
    ignoreHTTPSErrors: false,
    serviceWorkers: "allow",
  });
  try {
    const page = await context.newPage();
    await page.goto(`${origin}/service-worker-page`, { waitUntil: "networkidle" });

    const registrationResult = await page.evaluate(async () => {
      await navigator.serviceWorker.register("/service-worker.js");
      return (await navigator.serviceWorker.getRegistrations()).length;
    });

    assert.equal(registrationResult, 1);
    assert.equal((await context.serviceWorkers()).length, 1);
  } finally {
    await context.close();
  }
});

test("blocks Service Worker registration in an evidence browser context", async () => {
  targetHits.length = 0;
  const context = await createPreviewEvidenceBrowserContext(browser, {
    ignoreHTTPSErrors: false,
    serviceWorkers: "allow",
  });
  try {
    const page = await context.newPage();
    await page.goto(`${origin}/service-worker-page`, { waitUntil: "networkidle" });

    const serviceWorkerState = await page.evaluate(async () => {
      try {
        await navigator.serviceWorker.register("/service-worker.js");
        return {
          registrationResult: "resolved",
          registrations: (await navigator.serviceWorker.getRegistrations()).length,
        };
      } catch (error) {
        return {
          registrationResult: error instanceof Error ? error.name : String(error),
          registrations: (await navigator.serviceWorker.getRegistrations()).length,
        };
      }
    });

    assert.equal(serviceWorkerState.registrations, 0);
    assert.deepEqual(await context.serviceWorkers(), [], `unexpected worker after registration result: ${serviceWorkerState.registrationResult}`);
  } finally {
    await context.close();
  }
});

test("blocks a cross-origin navigation redirect before fetching its destination", async () => {
  targetHits.length = 0;
  const context = await createPreviewEvidenceBrowserContext(browser, { ignoreHTTPSErrors: false });
  try {
    const page = await context.newPage();
    const blockedRedirects = [];
    await installGuard(page, blockedRedirects);
    await assert.rejects(page.goto(`${origin}/redirect-navigation`));

    assert.equal(targetHits.length, 0);
    assert.equal(blockedRedirects.length, 1);
    assert.deepEqual(blockedRedirects[0], {
      source: `${origin}/redirect-navigation`,
      destination: `${target}/navigation`,
    });
  } finally {
    await context.close();
  }
});

test("clears only stale success/failure artifacts before a fresh evidence capture", async () => {
  const directory = await mkdtemp(join(tmpdir(), "coinblink-preview-evidence-"));
  const staleArtifacts = [
    "desktop-1536x864.png",
    "tablet-768x1024.png",
    "mobile-390x844.png",
    "RESULTS.json",
    "PLAYWRIGHT-LOG.md",
    "SHA256SUMS.txt",
    "FAILED.json",
  ];
  try {
    await Promise.all(staleArtifacts.map((fileName) => writeFile(join(directory, fileName), "stale")));
    await writeFile(join(directory, "unrelated.txt"), "preserve");

    await clearStalePreviewEvidenceArtifacts(directory);

    await Promise.all(staleArtifacts.map((fileName) => assert.rejects(readFile(join(directory, fileName)), { code: "ENOENT" })));
    assert.equal(await readFile(join(directory, "unrelated.txt"), "utf8"), "preserve");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("checks stable and immutable build identity before clearing prior evidence", () => {
  const collector = readFileSync(new URL("../scripts/collect-m00-preview-evidence.mjs", import.meta.url), "utf8");
  const stableHealth = collector.indexOf('assert.deepEqual(health, {');
  const immutableHealth = collector.indexOf("assert.deepEqual(immutableHealth, health");
  const cleanup = collector.indexOf("await clearStalePreviewEvidenceArtifacts(outputDirectory)");

  assert.ok(stableHealth >= 0, "stable health identity assertion is present");
  assert.ok(immutableHealth >= 0, "immutable health identity assertion is present");
  assert.ok(cleanup >= 0, "stale output cleanup is present");
  assert.ok(stableHealth < immutableHealth, "stable origin must be verified first");
  assert.ok(immutableHealth < cleanup, "both origins must pass before old artifacts are cleared");
});
