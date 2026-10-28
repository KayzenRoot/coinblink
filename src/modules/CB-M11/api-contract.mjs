// CB-M11-P1-API-CONTRACT-001: the machine-readable contract of the offline
// developer sandbox. It describes what the endpoints already promise, so a
// change in behaviour or payload shape fails a test instead of drifting.
//
// Nothing here is a public API: mode stays SYNTHETIC, live stays false and
// redistributable stays false in every response.
export const API_CONTRACT_VERSION = "2026-10-demo.1";

const ENVELOPE_FIELDS = Object.freeze(["live", "mode", "redistributable", "status", "items"]);
const COMMON_INVARIANTS = Object.freeze({ mode: "SYNTHETIC", live: false, redistributable: false });
const ERROR_STATUSES = Object.freeze([
  Object.freeze({ status: 400, payloadStatus: "BAD_REQUEST" }),
  Object.freeze({ status: 405, payloadStatus: "METHOD_NOT_ALLOWED" }),
  Object.freeze({ status: 503, payloadStatus: "UNAVAILABLE" }),
]);

export const V1_ENDPOINTS = Object.freeze([
  Object.freeze({
    path: "/v1/demo/articles",
    requestPattern: "^/v1/demo/articles$",
    shape: "list",
    summary: "Three canonical invented news specimens, never published.",
    methods: Object.freeze(["GET"]),
    allowedQueryParameters: Object.freeze([]),
    success: Object.freeze({ status: 200, payloadStatus: "DEMO_ONLY" }),
    errorStatuses: ERROR_STATUSES,
    envelopeFields: ENVELOPE_FIELDS,
    itemFields: Object.freeze(["category", "id", "published", "rights", "slug", "summary", "title"]),
    itemInvariants: Object.freeze({ published: false, rights: "SYNTHETIC_NOT_LICENSED_NEWS" }),
    itemCount: 3,
  }),
  Object.freeze({
    path: "/v1/demo/market-readiness",
    requestPattern: "^/v1/demo/market-readiness$",
    shape: "list",
    summary: "Three fictional assets reported as unavailable, never a quote.",
    methods: Object.freeze(["GET"]),
    allowedQueryParameters: Object.freeze([]),
    success: Object.freeze({ status: 200, payloadStatus: "BLOCKED_DEMO" }),
    errorStatuses: ERROR_STATUSES,
    envelopeFields: ENVELOPE_FIELDS,
    itemFields: Object.freeze(["asset", "blockers", "freshness", "numericQuote", "pair", "publiclyUsable", "rights"]),
    itemInvariants: Object.freeze({ rights: "NOT_CLEARED", numericQuote: null, publiclyUsable: false }),
    itemCount: 3,
  }),
  Object.freeze({
    path: "/v1/demo/articles/{slug}",
    requestPattern: "^/v1/demo/articles/[A-Za-z0-9-]{1,48}$",
    examplePath: "/v1/demo/articles/demo-wallet-safety",
    shape: "detail",
    summary: "One canonical invented article record, never published, body excluded.",
    methods: Object.freeze(["GET"]),
    allowedQueryParameters: Object.freeze([]),
    success: Object.freeze({ status: 200, payloadStatus: "DEMO_DETAIL_NOT_PUBLISHED" }),
    errorStatuses: Object.freeze([
      Object.freeze({ status: 400, payloadStatus: "BAD_REQUEST" }),
      Object.freeze({ status: 404, payloadStatus: "NOT_FOUND" }),
      Object.freeze({ status: 405, payloadStatus: "METHOD_NOT_ALLOWED" }),
      Object.freeze({ status: 503, payloadStatus: "UNAVAILABLE" }),
    ]),
    envelopeFields: Object.freeze(["live", "mode", "redistributable", "status", "item"]),
    itemFields: Object.freeze(["category", "id", "published", "rights", "slug", "summary", "title"]),
    itemInvariants: Object.freeze({ published: false, rights: "SYNTHETIC_NOT_LICENSED_NEWS" }),
  }),
]);

/** The shared error envelope returned for 400, 405 and 503. */
export const ERROR_ENVELOPE = Object.freeze({
  fields: ENVELOPE_FIELDS,
  itemsAreEmpty: true,
  invariants: Object.freeze({ ...COMMON_INVARIANTS, status: "ERROR_CODE" }),
});

export function contractFor(path) {
  return V1_ENDPOINTS.find((endpoint) => endpoint.path === path) ?? null;
}

/** Resolve a concrete request path, including a slug, to its contract entry. */
export function contractForRequestPath(requestPath) {
  if (typeof requestPath !== "string") return null;
  return V1_ENDPOINTS.find((endpoint) => new RegExp(endpoint.requestPattern, "u").test(requestPath)) ?? null;
}

export function listContractPaths() {
  return Object.freeze(V1_ENDPOINTS.map((endpoint) => endpoint.path));
}

function sameFields(actual, declared) {
  if (actual === null || typeof actual !== "object" || Array.isArray(actual)) return false;
  const keys = Object.keys(actual);
  return keys.length === declared.length && declared.every((field) => Object.hasOwn(actual, field));
}

function matchesInvariant(value, expected) {
  if (expected === null) return value === null;
  if (typeof expected === "object") return JSON.stringify(value) === JSON.stringify(expected);
  return value === expected;
}

/** Envelope checks, or null when the envelope shape itself is wrong. */
function envelopeProblems(endpoint, status, payload) {
  if (!sameFields(payload, endpoint.envelopeFields)) return null;
  const problems = [];
  const declaredStatuses = [endpoint.success, ...endpoint.errorStatuses].map((entry) => entry.status);
  if (!declaredStatuses.includes(status)) problems.push(`undeclared status ${status}`);
  for (const [field, expected] of Object.entries(COMMON_INVARIANTS)) {
    if (payload[field] !== expected) problems.push(`${field} must stay ${JSON.stringify(expected)}`);
  }
  const declaredPayloads = [endpoint.success.payloadStatus,
    ...endpoint.errorStatuses.map((entry) => entry.payloadStatus)];
  if (typeof payload.status !== "string" || !declaredPayloads.includes(payload.status)) {
    problems.push(`undeclared payload status ${JSON.stringify(payload.status)}`);
  }
  return problems;
}

function invariantProblems(item, endpoint) {
  const problems = [];
  if (!sameFields(item, endpoint.itemFields)) return ["item fields differ from the contract"];
  for (const [field, expected] of Object.entries(endpoint.itemInvariants)) {
    if (!matchesInvariant(item[field], expected)) {
      problems.push(`item.${field} must stay ${JSON.stringify(expected)}`);
    }
  }
  return problems;
}

function collectionProblems(endpoint, status, payload) {
  if (!Array.isArray(payload.items)) return ["items must be an array"];
  const problems = [];
  if (status === endpoint.success.status) {
    if (payload.status !== endpoint.success.payloadStatus) problems.push("success payload status mismatch");
    if (payload.items.length !== endpoint.itemCount) problems.push(`expected ${endpoint.itemCount} items`);
  } else if (payload.items.length !== 0) {
    problems.push("an error response must never carry items");
  }
  for (const item of payload.items) {
    problems.push(...invariantProblems(item, endpoint));
  }
  return problems;
}

function detailProblems(endpoint, status, payload) {
  if (status !== endpoint.success.status) {
    return payload.item === null ? [] : ["an error response must never carry an item"];
  }
  const problems = [];
  if (payload.status !== endpoint.success.payloadStatus) problems.push("success payload status mismatch");
  if (payload.item === null) return [...problems, "a success response must carry one item"];
  problems.push(...invariantProblems(payload.item, endpoint));
  return problems;
}

/**
 * Check one observed response against the contract. Never throws.
 * @returns {{ok: boolean, problems: ReadonlyArray<string>}}
 */
export function conformsToContract(path, status, payload) {
  const endpoint = contractForRequestPath(path);
  if (endpoint === null) return { ok: false, problems: Object.freeze([`unknown path ${path}`]) };
  const envelope = envelopeProblems(endpoint, status, payload);
  if (envelope === null) {
    return { ok: false, problems: Object.freeze(["envelope fields differ from the contract"]) };
  }
  const body = endpoint.shape === "detail"
    ? detailProblems(endpoint, status, payload)
    : collectionProblems(endpoint, status, payload);
  const problems = [...envelope, ...body];
  return { ok: problems.length === 0, problems: Object.freeze(problems) };
}
