import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, test } from "node:test";
import { chromium } from "playwright";
import { createPreviewEvidenceRouteHandler } from "../scripts/preview-evidence-origin-guard.mjs";

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
  const context = await browser.newContext({ ignoreHTTPSErrors: false });
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

test("blocks a cross-origin navigation redirect before fetching its destination", async () => {
  const context = await browser.newContext({ ignoreHTTPSErrors: false });
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
