import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SOURCE_DEMO_POLICY, listSyntheticSources, inspectSyntheticSource, validateSyntheticSourceUrl, dedupeSyntheticIds } from "../../../src/modules/CB-M03/source-lab.mjs";
test("M03 sources are deterministic, frozen and always NOT public", () => {
  assert.equal(SOURCE_DEMO_POLICY, "P0_OFFLINE_PROVENANCE_ONLY");
  const r = listSyntheticSources();
  assert.equal(r.items.length, 3);
  for (const row of r.items) {
    assert.equal(row.mode, "MOCK");
    assert.ok(Object.isFrozen(row));
    assert.equal(inspectSyntheticSource(row).publiclyUsable, false);
    assert.equal(row.fetchedAt, null);
    assert.equal(row.evidenceDigest, null);
    assert.equal(validateSyntheticSourceUrl(row.originUrl), row.originUrl);
  }
});
test("M03 rejects untrusted and private-network source URLs without network access", () => {
  for (const url of ["http://feed.example.test/x", "https://127.0.0.1/x", "https://localhost/x",
    "file:///etc/passwd", "https://user:pass@feed.example.test/x",
    "https://feed.example.test:444/x", "https://notexample.test/a",
    "https://feed.example.test/a#section", "https://feed.example.test/a?q=1", null]) {
    assert.equal(validateSyntheticSourceUrl(url), null, String(url));
    assert.equal(inspectSyntheticSource({ originUrl: url, licensing: "APPROVED" }).state, "BAD_REQUEST");
  }
});
test("M03 rights never enable actual publication, even with fake approval", () => {
  const originUrl = "https://feed.example.test/articles/001";
  for (const licensing of ["UNKNOWN", "NOT_CLEARED", undefined]) {
    assert.equal(inspectSyntheticSource({ originUrl, licensing }).state, "DENIED_RIGHTS");
  }
  assert.deepEqual(inspectSyntheticSource({ originUrl, licensing: "APPROVED" }),
    { state: "SYNTHETIC_PREVIEW_ONLY", publiclyUsable: false, mode: "MOCK" });
  assert.equal(inspectSyntheticSource({ originUrl, licensing: "APPROVED", status: "UNAVAILABLE" }).state, "UNAVAILABLE");
  assert.equal(listSyntheticSources({ query: "missing-synthetic" }).state, "EMPTY");
  assert.equal(listSyntheticSources({ query: "x".repeat(81) }).state, "BAD_REQUEST");
  assert.deepEqual(dedupeSyntheticIds(["a", "a", "b"]), ["a", "b"]);
  assert.equal(dedupeSyntheticIds([null]), null);
});
test("M03 DEMO cannot fetch, store credentials, publish or reach /admin", () => {
  const files = ["src/modules/CB-M03/source-lab.mjs", "src/modules/CB-M03/SourceWorkbench.astro",
    "src/modules/CB-M03/source-lab.client.js", "src/pages/demo/sources.astro"];
  for (const f of files) {
    const content = readFileSync(f, "utf8");
    assert.doesNotMatch(content, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\/admin\/|\.wrangler/u, f);
  }
});
