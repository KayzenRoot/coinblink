import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MODEL = "../../../src/modules/CB-M12/local-quota-preview.mjs";

test("M12 P0 synthetic quota presets are immutable, finite and do not sell entitlements", async () => {
  const { listLocalQuotaExamples } = await import(MODEL);
  const list = listLocalQuotaExamples();
  assert.ok(Object.isFrozen(list));
  assert.deepEqual(list.map(x => [x.id, x.limit]), [
    ["sample", 5], ["prototype", 10], ["lab", 20],
  ]);
  for (const plan of list) {
    assert.ok(Object.isFrozen(plan));
    assert.deepEqual(Object.keys(plan).sort(), ["id","label","limit"]);
    assert.equal(typeof plan.label, "string");
    assert.ok(!/pro|premium|purchase|customer|subscription|billing/i.test(plan.label));
  }
});

test("M12 P0 quota simulation is bounded fail-closed and strictly no billing or accounts", async () => {
  const { calculateLocalQuotaPreview } = await import(MODEL);
  const sample = calculateLocalQuotaPreview("sample", 0);
  assert.deepEqual(sample, Object.freeze({
    mode: "LOCAL_SYNTHETIC", status: "SIMULATION_ONLY", preset: "sample",
    simulatedLimit: 5, simulatedUsed: 0, simulatedRemaining: 5,
    limitReached: false, billingEnabled: false, purchaseEnabled: false,
    customerAccount: false, price: null, live: false,
  }));
  assert.equal(Object.isFrozen(sample), true);
  for(const [preset, usage, remaining, reached] of [
    ["sample", 5, 0, true], ["sample", 6, 0, true],
    ["prototype", 7, 3, false], ["prototype", 20, 0, true],
    ["lab", 19, 1, false], ["lab", 20, 0, true],
  ]) {
    const result=calculateLocalQuotaPreview(preset, usage);
    assert.equal(result.simulatedRemaining, remaining);
    assert.equal(result.limitReached, reached);
    assert.equal(result.price, null);
    assert.equal(result.billingEnabled, false);
    assert.equal(result.live, false);
    assert.ok(Object.isFrozen(result));
  }
  for (const [preset, usage] of [
    ["__proto__", 2], ["sample", -1], ["sample", 21],
    ["sample", 1.5], ["sample", "3"], ["SAMPLE", 2],
    ["https://external.invalid", 1], [null, null], ["lab", NaN],
    ["sample", Infinity], [{id:"sample"}, 3],
  ]) {
    const denied=calculateLocalQuotaPreview(preset, usage);
    assert.deepEqual(denied, Object.freeze({mode:"LOCAL_SYNTHETIC",status:"INVALID_SELECTION",preview:null}));
  }
});

test("M12 P0 page stays an independent offline simulation with CSP-safe assets and no privileged endpoints", () => {
  const page=readFileSync("src/pages/demo/api-usage.astro","utf8");
  const astro=readFileSync("src/modules/CB-M12/LocalQuotaPreview.astro","utf8");
  const client=readFileSync("src/modules/CB-M12/local-quota-preview.client.js","utf8");
  const css=readFileSync("src/modules/CB-M12/local-quota-preview.css","utf8");
  assert.match(page, /LocalQuotaPreview/u);
  assert.match(astro, /data-m12-preset/u);
  assert.match(astro, /data-m12-used/u);
  assert.match(astro, /data-m12-status/u);
  assert.match(astro, /data-m12-remaining/u);
  assert.match(astro, /local-quota-preview\.client\.js\?url&no-inline/u);
  assert.match(astro, /local-quota-preview\.css\?url&no-inline/u);
  assert.match(astro, /NO BILLING|NO PAYMENTS/u);
  assert.match(client, /data-m12-reset/u);
  assert.match(client, /textContent/u);
  assert.match(css, /:focus-visible/u);
  for(const text of [page,astro,client]) assert.doesNotMatch(text,
    /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|sendBeacon|innerHTML|type="email"|<form|\/admin\/|process\.env/u);
});
