import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { assertWorkerPreviewConfig } from "../scripts/worker-preview-config-safety.mjs";

const config = JSON.parse(readFileSync(resolve("wrangler.jsonc"), "utf8"));

test("source Wrangler config declares isolated empty Previews and only static assets", () => {
  assertWorkerPreviewConfig(config, "wrangler.jsonc");
  assert.deepEqual(config.previews, {});
  assert.deepEqual(config.assets, {
    directory: "./dist",
    binding: "ASSETS",
    not_found_handling: "404-page",
  });
});

test("rejects any top-level production data/resource binding", () => {
  for (const [key, value] of [
    ["kv_namespaces", [{binding:"KV", id:"prod"}]],
    ["d1_databases", [{binding:"DB", database_id:"prod"}]],
    ["services", [{binding:"SERVICE", service:"production"}]],
    ["secrets", ["PRIVATE_KEY"]],
    ["account_id", "f".repeat(32)],
  ]) {
    assert.throws(() => assertWorkerPreviewConfig({ ...config, [key]: value }), /unreviewed top-level settings/);
  }
});

test("rejects preview bindings, vars, and any non-empty dashboard-derived preview configuration", () => {
  assert.throws(() => assertWorkerPreviewConfig({
    ...config,
    previews: { d1_databases: [{ binding: "DB", database_id: "production" }] },
  }), /empty isolated previews block/);
  assert.throws(() => assertWorkerPreviewConfig({ ...config, previews: { vars: { ENVIRONMENT: "production" } } }), /empty isolated previews block/);
  assert.throws(() => assertWorkerPreviewConfig({ ...config, vars: { API_URL: "https://production.invalid" } }), /unchecked production plaintext variables/);
});

test("static and Worker responses carry noindex controls without treating them as access control", () => {
  const middleware = readFileSync(resolve("src/middleware.ts"), "utf8");
  const layout = readFileSync(resolve("src/layouts/BaseLayout.astro"), "utf8");
  const headers = readFileSync(resolve("public/_headers"), "utf8");
  const robots = readFileSync(resolve("public/robots.txt"), "utf8");

  assert.match(middleware, /X-Robots-Tag.*noindex, nofollow, noarchive/);
  assert.match(layout, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(headers, /X-Robots-Tag: noindex, nofollow, noarchive/);
  assert.match(robots, /Disallow: \/\s*$/);
});
