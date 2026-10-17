import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SOURCE_POLICY, listOfflineSources, simulateOfflineIngestion } from "../../../src/modules/CB-M03/source-ledger.mjs";

test("M03 registry is MOCK, unlicensed and cannot expose capture actions", () => {
  assert.equal(SOURCE_POLICY, "OFFLINE_NO_RIGHTS_CLEARED");
  const result = listOfflineSources();
  assert.equal(result.items.length, 2);
  assert.ok(result.items.every(x => x.rights === "NOT_CLEARED"
    && x.capture === "DISABLED" && x.redistributable === false && Object.isFrozen(x)));
  assert.equal(listOfflineSources({ query: "academic" }).items.length, 1);
  assert.equal(listOfflineSources({ query: "nothing" }).state, "EMPTY");
  assert.equal(listOfflineSources({ status: "UNAVAILABLE" }).state, "UNAVAILABLE");
  assert.equal(listOfflineSources({ status: "LIVE" }).state, "BAD_REQUEST");
  assert.equal(listOfflineSources({ query: "X".repeat(81) }).state, "BAD_REQUEST");
});
test("M03 replay/denied/invalid/quota remain offline and cannot grant redistribution", () => {
  const item = { id: "fiction-a", mode: "MOCK", url: "https://registry.example.test/example" };
  const result = simulateOfflineIngestion([
    item, item, { ...item, id: "fiction-b", providerState: "OFFLINE" },
    { ...item, id: "fiction-c", providerState: "QUOTA" },
    { ...item, id: "fiction-d", url: "https://real-world.example.com/news" },
    { ...item, id: "fiction-e", mode: "LIVE" },
  ]);
  assert.deepEqual(result.events.map(x => x.status), [
    "DENIED_RIGHTS", "DEDUPLICATED", "UNAVAILABLE", "RETRY_AFTER", "BAD_REQUEST", "BAD_REQUEST",
  ]);
  assert.equal(result.captured, 0);
  assert.equal(result.networkCalls, 0);
  assert.ok(result.events.every(x => x.redistributable === false));
  assert.equal(simulateOfflineIngestion(null).state, "BAD_REQUEST");
  assert.equal(simulateOfflineIngestion(Array(21).fill(item)).state, "BAD_REQUEST");
});
test("M03 accessible workbench and real in-page filter never fetch third-party sources", () => {
  const ui = readFileSync(resolve("src/modules/CB-M03/SourcesWorkbench.astro"), "utf8");
  const js = readFileSync(resolve("src/modules/CB-M03/source-ledger.client.js"), "utf8");
  assert.match(ui, /MOCK SOURCES/);
  assert.match(ui, /data-m03-search/);
  assert.match(ui, /aria-live="polite"/);
  assert.match(js, /addEventListener\("input"/u);
  assert.doesNotMatch(ui + js, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage/u);
});
