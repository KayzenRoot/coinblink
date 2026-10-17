import assert from "node:assert/strict";
import test from "node:test";
import { isFixtureOriginRequest } from "./visual-request-origin.mjs";
test("accepts only the exact fixture origin", () => {
  const origin = "http://127.0.0.1:50137";
  assert.equal(isFixtureOriginRequest(`${origin}/asset.css`, origin), true);
  assert.equal(isFixtureOriginRequest("http://127.0.0.1:50137.attacker.invalid/asset.css", origin), false);
  assert.equal(isFixtureOriginRequest("http://127.0.0.1:50138/asset.css", origin), false);
  assert.equal(isFixtureOriginRequest("https://127.0.0.1:50137/asset.css", origin), false);
  assert.equal(isFixtureOriginRequest("not a URL", origin), false);
});