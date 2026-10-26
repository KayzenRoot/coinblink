/* global window, document, DOMParser */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "../../../../");
const EVIDENCE = SCRIPT_DIR;
const BRAND_FILES = new Set([
  "coinblink-symbol.svg",
  "coinblink-horizontal-dark.svg",
  "coinblink-horizontal-light.svg",
  "coinblink-stacked.svg",
  "favicon.svg",
]);
const HTML = await readFile(path.join(ROOT, "test/brand/render-harness.html"));
const outsideRequests = [];
const contentType = { ".svg": "image/svg+xml", ".html": "text/html; charset=utf-8" };

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://127.0.0.1").pathname;
  if (request.method !== "GET") {
    response.writeHead(405).end();
    return;
  }
  if (pathname === "/qa") {
    response.writeHead(200, { "content-type": contentType[".html"], "cache-control": "no-store" }).end(HTML);
    return;
  }
  const filename = pathname.startsWith("/brand/") ? pathname.slice("/brand/".length) : "";
  if (!BRAND_FILES.has(filename)) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {
    "content-type": contentType[path.extname(filename)],
    "x-content-type-options": "nosniff",
    "cache-control": "no-store",
  });
  createReadStream(path.join(ROOT, "public/brand", filename)).pipe(response);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const baseUrl = "http://127.0.0.1:" + address.port;
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    if (!request.url().startsWith(baseUrl + "/")) outsideRequests.push(request.url());
  });
  await page.route("**/*", async (route) => {
    if (route.request().url().startsWith(baseUrl + "/")) await route.continue();
    else {
      outsideRequests.push(route.request().url());
      await route.abort();
    }
  });

  const viewports = [
    { name: "desktop-1536x864", width: 1536, height: 864 },
    { name: "tablet-768x1024", width: 768, height: 1024 },
    { name: "mobile-390x844", width: 390, height: 844 },
  ];
  const visualProofs = [];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(baseUrl + "/qa", { waitUntil: "load" });
    await page.waitForFunction(() => window.qaReady === true);
    await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));

    const domResult = await page.evaluate(async () => {
      const sources = [...new Set([...document.images].map((image) => new URL(image.src).pathname))];
      const parsed = [];
      for (const source of sources) {
        const text = await (await fetch(source)).text();
        const xml = new DOMParser().parseFromString(text, "image/svg+xml");
        parsed.push({ source, root: xml.documentElement.localName, parserErrors: xml.getElementsByTagName("parsererror").length });
      }
      const images = [...document.images];
      return {
        sourceCount: sources.length,
        imageCount: images.length,
        unlabeledImages: images.filter((image) => !image.alt.trim()).length,
        badImages: images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
        renderSizes: images.map((image) => {
          const originalMaxWidth = image.style.maxWidth;
          image.style.maxWidth = "none";
          const bounds = image.getBoundingClientRect();
          image.style.maxWidth = originalMaxWidth;
          return {
            file: new URL(image.src).pathname,
            kind: image.className,
            requested: Number(image.dataset.size),
            width: bounds.width,
            height: bounds.height,
          };
        }),
        xml: parsed,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    const accessibleImages = await page.getByRole("img").count();

    assert.equal(domResult.sourceCount, 5, viewport.name + " distinct asset count");
    assert.equal(domResult.imageCount, 38, viewport.name + " rendered size/surface sample count");
    assert.equal(accessibleImages, 38, viewport.name + " accessible image role count");
    assert.equal(domResult.unlabeledImages, 0, viewport.name + " accessible labels");
    assert.deepEqual(domResult.badImages, [], viewport.name + " image loads");
    assert.ok(
      domResult.renderSizes.every((sample) =>
        sample.kind === "icon"
          ? sample.width === sample.requested && sample.height === sample.requested
          : sample.height === sample.requested,
      ),
      viewport.name + " exact icon and logo rendering sizes",
    );
    assert.ok(domResult.xml.every((entry) => entry.root === "svg" && entry.parserErrors === 0), viewport.name + " XML parse");
    assert.ok(domResult.scrollWidth <= domResult.innerWidth, viewport.name + " horizontal overflow");

    const screenshotDirectory = path.join(EVIDENCE, "screenshots");
    await mkdir(screenshotDirectory, { recursive: true });
    for (const capture of [
      { suffix: "", fullPage: false, type: "viewport" },
      { suffix: "-full", fullPage: true, type: "fullPage" },
    ]) {
      const output = path.join(screenshotDirectory, viewport.name + capture.suffix + ".png");
      await page.screenshot({ path: output, fullPage: capture.fullPage });
      const bytes = await readFile(output);
      visualProofs.push({
        path: path.relative(ROOT, output).replaceAll("\\", "/"),
        captureType: capture.type,
        bytes: bytes.byteLength,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        viewport: viewport.width + "x" + viewport.height,
        imageCount: domResult.imageCount,
        assetsXmlParsed: domResult.xml.length,
        sizeSamples: domResult.renderSizes.length,
      });
    }
  }

  assert.deepEqual(outsideRequests, [], "the isolated harness must not request remote resources");
  assert.deepEqual(pageErrors, [], "the isolated harness must not raise page errors");
  assert.deepEqual(consoleErrors, [], "the isolated harness must not emit console errors");
  const proof = {
    generatedAt: new Date().toISOString(),
    browser: browser.version(),
    baseUrl,
    externalRequests: outsideRequests,
    pageErrors,
    consoleErrors,
    screenshots: visualProofs,
  };
  await writeFile(path.join(EVIDENCE, "browser-qa.json"), JSON.stringify(proof, null, 2) + "\n");
  console.log(JSON.stringify(proof, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
