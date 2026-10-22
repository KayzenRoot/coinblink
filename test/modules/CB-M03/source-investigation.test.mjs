import test from "node:test";
import assert from "node:assert/strict";
import {
  inspectSyntheticProvenance, summarizeSyntheticProvenance, compareSyntheticProvenance,
} from "../../../src/modules/CB-M03/source-investigation.mjs";
import { listSyntheticSources } from "../../../src/modules/CB-M03/source-lab.mjs";

test("M03 investigation derives immutable fail-closed reports from the canonical synthetic sources", () => {
  const sources = listSyntheticSources().items;
  const overview = summarizeSyntheticProvenance();
  assert.deepEqual(overview, { mode: "MOCK", state: "REVIEW_ONLY_NO_INGESTION",
    total: 3, rightsDenied: 2, unavailable: 1, captured: 0, publiclyUsable: 0 });
  assert.ok(Object.isFrozen(overview));
  for (const source of sources) {
    const response = inspectSyntheticProvenance(source.id);
    assert.equal(response.status, "MOCK_REPORT_NOT_PUBLISHED");
    assert.equal(response.report.id, source.id);
    assert.equal(response.report.publiclyUsable, false);
    assert.equal(response.report.mode, "MOCK");
    assert.ok(Object.isFrozen(response.report) && Object.isFrozen(response.report.checks));
    assert.equal(response.report.checks.length, 4);
    assert.ok(response.report.checks.every(Object.isFrozen));
    assert.deepEqual(response.report.checks.map(check => check.code),
      ["URL", "RIGHTS", "CAPTURE", "DIGEST"]);
    assert.deepEqual(response.report.checks.slice(2).map(check => check.state),
      ["NOT_CAPTURED", "NO_DIGEST"]);
    assert.doesNotMatch(JSON.stringify(response.report), /password|secret|token|body|admin|APPROVED_FOR_PUBLIC/u);
  }
});
test("M03 investigation refuses invalid IDs without enumerating private candidates", () => {
  for (const id of [null, undefined, 10, "demo-source-unknown", "demo-source-alpha/../admin",
    "https://feed.example.test/a", "__proto__", "demo-source-ABCDEFGHIJKLMNOPQRST"]) {
    assert.deepEqual(inspectSyntheticProvenance(id), {status:"NOT_FOUND",report:null});
  }
});
test("M03 comparison is immutable, bounded, and never infers publication rights", () => {
  const comparison = compareSyntheticProvenance("demo-source-alpha", "demo-source-gamma");
  assert.equal(comparison.status, "MOCK_COMPARISON_NOT_PUBLICATION");
  assert.equal(comparison.bothBlocked, true);
  assert.equal(comparison.left.inspection, "DENIED_RIGHTS");
  assert.equal(comparison.right.inspection, "UNAVAILABLE");
  assert.deepEqual(comparison.left.blockers, ["RIGHTS", "CAPTURE", "DIGEST"]);
  assert.equal(comparison.right.blockers.includes("RIGHTS"), true);
  assert.ok(Object.isFrozen(comparison) && Object.isFrozen(comparison.left)
    && Object.isFrozen(comparison.right) && Object.isFrozen(comparison.left.blockers));
  assert.doesNotMatch(JSON.stringify(comparison), /originUrl|fetchedAt|evidenceDigest|secret|body/u);
  for (const inputs of [["demo-source-alpha", "demo-source-alpha"],
    ["not-a-source", "demo-source-beta"], ["demo-source-beta", undefined]]) {
    assert.deepEqual(compareSyntheticProvenance(...inputs),
      { status: "INVALID_PAIR", left: null, right: null });
  }
});
