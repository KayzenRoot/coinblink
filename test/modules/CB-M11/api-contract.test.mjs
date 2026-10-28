import test from "node:test";
import assert from "node:assert/strict";
import { buildDemoArticles } from "../../../src/modules/CB-M11/demo-articles.mjs";
import { buildDemoMarketReadiness } from "../../../src/modules/CB-M11/demo-market-readiness.mjs";
import {
  API_CONTRACT_VERSION, ERROR_ENVELOPE, V1_ENDPOINTS, conformsToContract, contractFor, listContractPaths,
} from "../../../src/modules/CB-M11/api-contract.mjs";

const ARTICLES = "/v1/demo/articles";
const MARKETS = "/v1/demo/market-readiness";

test("CB-M11-P1 the contract is frozen, versioned and covers both sandbox endpoints", () => {
  assert.equal(Object.isFrozen(V1_ENDPOINTS), true);
  assert.match(API_CONTRACT_VERSION, /^\d{4}-\d{2}-demo\.\d+$/u);
  assert.deepEqual(listContractPaths(), [ARTICLES, MARKETS, "/v1/demo/articles/{slug}"]);
  for (const endpoint of V1_ENDPOINTS) {
    assert.equal(Object.isFrozen(endpoint), true);
    assert.deepEqual([...endpoint.methods], ["GET"], "the sandbox is read-only");
    assert.deepEqual([...endpoint.allowedQueryParameters], [], "query extensions are unadmitted");
    assert.equal(endpoint.success.status, 200);
    assert.ok(endpoint.errorStatuses.some((entry) => entry.status === 405), "the read-only method is declared");
    if (endpoint.shape === "list") {
      assert.deepEqual(endpoint.errorStatuses.map((entry) => entry.status), [400, 405, 503]);
      assert.equal(endpoint.itemCount, 3);
    } else {
      assert.deepEqual(endpoint.errorStatuses.map((entry) => entry.status), [400, 404, 405, 503]);
      assert.match(endpoint.requestPattern, /\{slug\}/.source === "" ? /.*/u : /A-Za-z0-9/);
      assert.equal(typeof endpoint.examplePath, "string");
    }
  }
  assert.equal(contractFor("/v1/other"), null);
  assert.equal(Object.isFrozen(ERROR_ENVELOPE), true);
  assert.equal(ERROR_ENVELOPE.itemsAreEmpty, true);
});

test("CB-M11-P1 the real builders conform to their own contract", () => {
  const cases = [
    { path: ARTICLES, status: 200, payload: buildDemoArticles() },
    { path: MARKETS, status: 200, payload: buildDemoMarketReadiness() },
  ];
  for (const { path, status, payload } of cases) {
    const result = conformsToContract(path, status, payload);
    assert.deepEqual([...result.problems], [], `${path} must conform`);
    assert.equal(result.ok, true);
  }
});

test("CB-M11-P1 a tampered envelope, item, status or item count is refused", () => {
  const truth = buildDemoArticles();
  const withField = { ...truth, extra: "smuggled" };
  assert.equal(conformsToContract(ARTICLES, 200, withField).ok, false);
  assert.match(conformsToContract(ARTICLES, 200, withField).problems.join(" "), /envelope fields/u);

  assert.equal(conformsToContract(ARTICLES, 200, { ...truth, live: true }).ok, false);
  const redistributable = conformsToContract(ARTICLES, 200, { ...truth, redistributable: true });
  assert.match(redistributable.problems.join(" "), /redistributable must stay false/u);

  assert.equal(conformsToContract(ARTICLES, 418, truth).ok, false, "an undeclared status is refused");
  assert.equal(conformsToContract(ARTICLES, 200, { ...truth, status: "LIVE" }).ok, false);
  assert.equal(conformsToContract(ARTICLES, 200, { ...truth, items: truth.items.slice(0, 2) }).ok, false);

  const item = { ...truth.items[0], rights: "LICENSED" };
  assert.equal(conformsToContract(ARTICLES, 200, { ...truth, items: [item] }).ok, false);
  const widened = { ...truth, items: [{ ...truth.items[0], extra: 1 }] };
  assert.equal(conformsToContract(ARTICLES, 200, widened).ok, false);
});

test("CB-M11-P1 an error response carries the empty envelope and never items", () => {
  const error = { status: "METHOD_NOT_ALLOWED", mode: "SYNTHETIC", live: false, redistributable: false, items: [] };
  assert.equal(conformsToContract(ARTICLES, 405, error).ok, true);
  assert.equal(conformsToContract(MARKETS, 400, { ...error, status: "BAD_REQUEST" }).ok, true);
  const leaky = { ...error, items: [{ id: "demo-x" }] };
  const result = conformsToContract(ARTICLES, 405, leaky);
  assert.equal(result.ok, false);
  assert.match(result.problems.join(" "), /never carry items/u);
});

test("CB-M11-P1 unknown paths and malformed payloads are refused without throwing", () => {
  assert.equal(conformsToContract("/v1/secret", 200, {}).ok, false);
  for (const payload of [null, undefined, "text", 42, [], true]) {
    const result = conformsToContract(ARTICLES, 200, payload);
    assert.equal(result.ok, false, `${JSON.stringify(payload)} must be refused`);
  }
  const noItems = { status: "DEMO_ONLY", mode: "SYNTHETIC", live: false, redistributable: false, items: "nope" };
  assert.match(conformsToContract(ARTICLES, 200, noItems).problems.join(" "), /items must be an array/u);
});

test("CB-M11-P1 the detail endpoint conforms and refuses a widened item", async () => {
  const { buildDemoArticleDetail } = await import("../../../src/modules/CB-M11/demo-article-detail.mjs");
  const { contractForRequestPath } = await import("../../../src/modules/CB-M11/api-contract.mjs");
  const sample = "/v1/demo/articles/demo-wallet-safety";
  const endpoint = contractForRequestPath(sample);
  assert.equal(endpoint?.shape, "detail");
  assert.equal(contractForRequestPath("/v1/demo/articles/demo-wallet-safety/extra"), null);
  assert.equal(contractForRequestPath("/v1/demo/articles/BAD SLUG"), null);
  assert.equal(contractForRequestPath(42), null);

  const ok = buildDemoArticleDetail("demo-wallet-safety");
  assert.deepEqual([...conformsToContract(sample, 200, ok).problems], []);
  const missing = buildDemoArticleDetail("unknown-slug");
  assert.equal(missing.status, "NOT_FOUND");
  assert.deepEqual([...conformsToContract("/v1/demo/articles/unknown-slug", 404, missing).problems], []);

  const errorWithItem = { ...missing, item: ok.item };
  assert.match(conformsToContract("/v1/demo/articles/unknown-slug", 404, errorWithItem).problems.join(" "), /never carry an item/u);
  const successWithoutItem = { ...ok, item: null };
  assert.match(conformsToContract(sample, 200, successWithoutItem).problems.join(" "), /must carry one item/u);
  const widened = { ...ok, item: { ...ok.item, body: "smuggled" } };
  assert.match(conformsToContract(sample, 200, widened).problems.join(" "), /item fields differ/u);
  const live = { ...ok, live: true };
  assert.match(conformsToContract(sample, 200, live).problems.join(" "), /live must stay false/u);
});
