import test from "node:test";
import assert from "node:assert/strict";
import { buildDemoArticleDetail } from "../../../src/modules/CB-M11/demo-article-detail.mjs";

test("CB-M11-P1 a canonical slug returns one unpublished record without the body", () => {
  const result = buildDemoArticleDetail("demo-wallet-safety");
  assert.equal(result.status, "DEMO_DETAIL_NOT_PUBLISHED");
  assert.equal(result.mode, "SYNTHETIC");
  assert.equal(result.live, false);
  assert.equal(result.redistributable, false);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.item));
  assert.deepEqual(Object.keys(result.item).sort(),
    ["category", "id", "published", "rights", "slug", "summary", "title"]);
  assert.equal(result.item.slug, "demo-wallet-safety");
  assert.equal(result.item.published, false);
  assert.equal(result.item.rights, "SYNTHETIC_NOT_LICENSED_NEWS");
  assert.equal(Object.hasOwn(result.item, "body"), false, "full text stays out of the sandbox");
});

test("CB-M11-P1 unknown and malformed slugs fail closed with no item", () => {
  // Well-shaped slugs that simply do not exist are NOT_FOUND, not BAD_REQUEST.
  for (const slug of ["unknown-slug", "constructor", "tostring"]) {
    const result = buildDemoArticleDetail(slug);
    assert.equal(result.status, "NOT_FOUND", slug);
    assert.equal(result.item, null);
  }
  for (const slug of [undefined, null, 42, true, {}, [], "BAD SLUG", "../admin", "a".repeat(60),
    "__proto__", "demo-wallet-safety ", "DEMO-WALLET-SAFETY", "demo_wallet"]) {
    const result = buildDemoArticleDetail(slug);
    assert.equal(result.status, "BAD_REQUEST", JSON.stringify(slug));
    assert.equal(result.item, null);
    assert.equal(result.live, false);
    assert.equal(result.redistributable, false);
  }
});

test("CB-M11-P1 every canonical slug resolves and none exposes private fields", () => {
  for (const slug of ["demo-wallet-safety", "demo-protocol-classroom", "demo-chain-basics"]) {
    const result = buildDemoArticleDetail(slug);
    assert.equal(result.status, "DEMO_DETAIL_NOT_PUBLISHED", slug);
    assert.equal(result.item.slug, slug);
    const raw = JSON.stringify(result);
    for (const banned of ["private_notes", "password", "access_token", "api_key", "provider_secret", "\"body\""]) {
      assert.equal(raw.includes(banned), false, slug + " leaked " + banned);
    }
  }
});
