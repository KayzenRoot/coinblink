import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { listMockResearchOptions, buildMockResearchBrief, summarizeMockResearchGates, RESEARCH_DEMO_POLICY }
  from "../../../src/modules/CB-M08/research-desk.mjs";
import { inspectSyntheticProvenance } from "../../../src/modules/CB-M03/source-investigation.mjs";
import { inspectMockReadiness } from "../../../src/modules/CB-M04/market-readiness.mjs";

test("M08 lists only frozen canonical M03/M04 synthetic samples", () => {
  const options = listMockResearchOptions();
  assert.equal(options.sources.length, 3);
  assert.deepEqual(options.markets.map(item => item.asset), ["BTC", "ETH", "SOL"]);
  assert.ok(Object.isFrozen(options) && Object.isFrozen(options.sources)
    && Object.isFrozen(options.markets) && options.sources.every(Object.isFrozen));
  assert.match(RESEARCH_DEMO_POLICY, /NO_AI_NO_FACT_CHECK/u);
});

test("M08 combines only existing source and market blockers without publication privileges", () => {
  const result = buildMockResearchBrief("demo-source-alpha", "BTC");
  const brief = result.brief;
  assert.equal(result.status, "MOCK_RESEARCH_REVIEW_REQUIRED");
  assert.equal(brief.sourceStatus, inspectSyntheticProvenance("demo-source-alpha").report.inspection);
  assert.equal(brief.freshness, inspectMockReadiness("BTC").report.freshness);
  assert.deepEqual(brief.blockers.map(item => item.code).slice(0, 4), ["URL", "RIGHTS", "CAPTURE", "DIGEST"]);
  assert.deepEqual(brief.blockers.map(item => item.code).slice(4), inspectMockReadiness("BTC").report.blockers);
  assert.equal(brief.blockerCount, 8);
  assert.equal(brief.quote, null);
  assert.equal(brief.marketLive, false);
  assert.equal(brief.publiclyUsable, false);
  assert.equal(brief.verified, false);
  assert.equal(brief.generatedByAI, false);
  assert.equal(brief.published, false);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(brief)
    && Object.isFrozen(brief.blockers) && brief.blockers.every(Object.isFrozen));
});

test("M08 rejects invalid source, unknown market, missing inputs and prototype keys", () => {
  for (const [source, asset] of [
    [undefined, "BTC"], ["demo-source-alpha", undefined], ["__proto__", "BTC"],
    ["demo-source-alpha", "__proto__"], ["demo-source-alpha", "btc"],
    ["demo-source-alpha", "ETH/USD"], ["https://fake.example.test", "BTC"],
    ["demo-source-invalid", "BTC"], [null, null],
  ]) {
    assert.deepEqual(buildMockResearchBrief(source, asset), { status: "INVALID_SELECTION", brief: null });
  }
  for (const source of listMockResearchOptions().sources) {
    for (const market of listMockResearchOptions().markets) {
      const result = buildMockResearchBrief(source.id, market.asset);
      assert.equal(result.status, "MOCK_RESEARCH_REVIEW_REQUIRED");
      assert.equal(result.brief.blockerCount, 8);
      assert.equal(result.brief.quote, null);
      assert.equal(result.brief.generatedByAI, false);
    }
  }
});

test("M08 page is a local human review interface without AI, remote calls or browser persistence", () => {
  const page = readFileSync("src/modules/CB-M08/ResearchDesk.astro", "utf8");
  const model = readFileSync("src/modules/CB-M08/research-desk.mjs", "utf8");
  assert.match(page, /data-m08-root/u);
  assert.match(page, /data-m08-blockers/u);
  assert.match(page, /role="status"/u);
  assert.match(page, /textContent/u);
  assert.match(page, /REVIEW REQUIRED/u);
  assert.doesNotMatch(page + model, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|eval\s*\(/u);
  assert.match(readFileSync("src/pages/demo/research.astro", "utf8"), /ResearchDesk/u);
});


test("M08 P1 triage maps all nine canonical source/market pairs into exactly 4+4 human-only gates", () => {
  for (const source of listMockResearchOptions().sources) {
    for (const market of listMockResearchOptions().markets) {
      const { status, summary } = summarizeMockResearchGates(source.id, market.asset);
      const canonical = buildMockResearchBrief(source.id, market.asset);
      assert.equal(status, "MOCK_TRIAGE_REVIEW_REQUIRED");
      assert.equal(summary.total, canonical.brief.blockerCount);
      assert.equal(summary.sourceGates, canonical.brief.blockers.filter(row => row.domain === "SOURCE").length);
      assert.equal(summary.marketGates, canonical.brief.blockers.filter(row => row.domain === "MARKET").length);
      assert.deepEqual([summary.sourceGates, summary.marketGates], [4, 4]);
      assert.equal(summary.humanReviewRequired, true);
      assert.equal(summary.verified, 0);
      assert.equal(summary.canPublish, false);
      assert.equal(summary.live, false);
      assert.ok(Object.isFrozen(summary));
    }
  }
});

test("M08 P1 triage denies invalid selections without false verified/publishable evidence", () => {
  for (const [source, market] of [
    [undefined, "BTC"], ["demo-source-alpha", undefined],
    ["__proto__", "BTC"], ["demo-source-alpha", "DOGE"],
    ["demo-source-alpha", "btc"], [null, null],
  ]) {
    const result = summarizeMockResearchGates(source, market);
    assert.deepEqual(result, { status: "INVALID_SELECTION", summary: null });
    assert.ok(Object.isFrozen(result));
  }
});
