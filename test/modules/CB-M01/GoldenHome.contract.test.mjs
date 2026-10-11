import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("../../../src/modules/CB-M01/GoldenHome.astro", import.meta.url);
const component = await readFile(componentPath, "utf8");

test("GoldenHome exposes the approved semantic page seam", () => {
  for (const required of ['<header', '<nav', '<main id="main"', '<footer', 'aria-label="Primary navigation"']) {
    assert.ok(component.includes(required), "missing semantic seam: " + required);
  }
});

test("all market and editorial samples remain visibly demonstration-only", () => {
  for (const required of ["DEMO", "Not connected", "no live story connected", "MOCK MODE", "No message will be sent"]) {
    assert.ok(component.includes(required), "missing demo boundary: " + required);
  }
  assert.doesNotMatch(component, /<[^>]+>\s*Live\s*<\/[^>]+>/i);
});

test("the newsletter form cannot send data to an external destination", () => {
  assert.match(component, /data-demo-form/);
  assert.match(component, /event\.preventDefault\(\)/);
  assert.doesNotMatch(component, /action\s*=|fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
});

test("the component uses the immutable approved logo and does not flatten the Golden Home", () => {
  assert.match(component, /coinblink-logo-approved-original-1179x1040\.jpg/);
  assert.doesNotMatch(component, /coinblink-home-master-dark-1536x864\.jpg/);
});

test("the hero uses a readable Bitcoin symbol rather than a generic T-shaped mark", () => {
  assert.match(component, />₿<\/text>/u);
});
