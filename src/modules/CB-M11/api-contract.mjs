// CB-M11-P1-API-CONTRACT-001: the machine-readable contract of the offline
// developer sandbox. It describes what the endpoints already promise, so a
// change in behaviour or payload shape fails a test instead of drifting.
//
// Nothing here is a public API: mode stays SYNTHETIC, live stays false and
// redistributable stays false in every response.
export const API_CONTRACT_VERSION = "2026-10-demo.1";

const ENVELOPE_FIELDS = Object.freeze(["live", "mode", "redistributable", "status", "items"]);
const COMMON_INVARIANTS = Object.freeze({ mode: "SYNTHETIC", live: false, redistributable: false });

export const V1_ENDPOINTS = Object.freeze([
  Object.freeze({
    path: "/v1/demo/articles",
    summary: "Three canonical invented news specimens, never published.",
    methods: Object.freeze(["GET"]),
    allowedQueryParameters: Object.freeze([]),
    success: Object.freeze({ status: 200, payloadStatus: "DEMO_ONLY" }),
    errorStatuses: Object.freeze([
      Object.freeze({ status: 400, payloadStatus: "BAD_REQUEST" }),
      Object.freeze({ status: 405, payloadStatus: "METHOD_NOT_ALLOWED" }),
      Object.freeze({ status: 503, payloadStatus: "UNAVAILABLE" }),
    ]),
    envelopeFields: ENVELOPE_FIELDS,
    itemFields: Object.freeze(["category", "id", "published", "rights", "slug", "summary", "title"]),
    itemInvariants: Object.freeze({ published: false, rights: "SYNTHETIC_NOT_LICENSED_NEWS" }),
    itemCount: 3,
  }),
  Object.freeze({
    path: "/v1/demo/market-readiness",
    summary: "Three fictional assets reported as unavailable, never a quote.",
    methods: Object.freeze(["GET"]),
    allowedQueryParameters: Object.freeze([]),
    success: Object.freeze({ status: 200, payloadStatus: "BLOCKED_DEMO" }),
    errorStatuses: Object.freeze([
      Object.freeze({ status: 400, payloadStatus: "BAD_REQUEST" }),
      Object.freeze({ status: 405, payloadStatus: "METHOD_NOT_ALLOWED" }),
      Object.freeze({ status: 503, payloadStatus: "UNAVAILABLE" }),
    ]),
    envelopeFields: ENVELOPE_FIELDS,
    itemFields: Object.freeze(["asset", "blockers", "freshness", "numericQuote", "pair", "publiclyUsable", "rights"]),
    itemInvariants: Object.freeze({ rights: "NOT_CLEARED", numericQuote: null, publiclyUsable: false }),
    itemCount: 3,
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

export function listContractPaths() {
  return Object.freeze(V1_ENDPOINTS.map((endpoint) => endpoint.path));
}

function sameFields(actual, declared) {
  if (actual === null || typeof actual !== "object" || Array.isArray(actual)) return false;
  const keys = Object.keys(actual);
  return keys.length === declared.length && declared.every((field) => Object.hasOwn(actual, field));
}

/**
 * Check one observed response against the contract.
 * @returns {{ok: boolean, problems: ReadonlyArray<string>}}
 */
export function conformsToContract(path, status, payload) {
  const problems = [];
  const endpoint = contractFor(path);
  if (endpoint === null) return { ok: false, problems: Object.freeze([`unknown path ${path}`]) };
  const known = [endpoint.success, ...endpoint.errorStatuses].some((entry) => entry.status === status);
  if (!known) problems.push(`undeclared status ${status}`);
  if (!sameFields(payload, endpoint.envelopeFields)) {
    problems.push("envelope fields differ from the contract");
    return { ok: false, problems: Object.freeze(problems) };
  }
  for (const [field, expected] of Object.entries(COMMON_INVARIANTS)) {
    if (payload[field] !== expected) problems.push(`${field} must stay ${JSON.stringify(expected)}`);
  }
  const declaredStatuses = [endpoint.success.payloadStatus,
    ...endpoint.errorStatuses.map((entry) => entry.payloadStatus)];
  if (typeof payload.status !== "string" || !declaredStatuses.includes(payload.status)) {
    problems.push(`undeclared payload status ${JSON.stringify(payload.status)}`);
  }
  if (!Array.isArray(payload.items)) {
    problems.push("items must be an array");
    return { ok: false, problems: Object.freeze(problems) };
  }
  const isSuccess = status === endpoint.success.status;
  if (isSuccess) {
    if (payload.status !== endpoint.success.payloadStatus) problems.push("success payload status mismatch");
    if (payload.items.length !== endpoint.itemCount) problems.push(`expected ${endpoint.itemCount} items`);
  } else if (payload.items.length !== 0) {
    problems.push("an error response must never carry items");
  }
  for (const item of payload.items) {
    if (!sameFields(item, endpoint.itemFields)) {
      problems.push("item fields differ from the contract");
      break;
    }
    for (const [field, expected] of Object.entries(endpoint.itemInvariants)) {
      const value = item[field];
      const matches = expected === null ? value === null
        : (typeof expected === "object" ? JSON.stringify(value) === JSON.stringify(expected) : value === expected);
      if (!matches) problems.push(`item.${field} must stay ${JSON.stringify(expected)}`);
    }
  }
  return { ok: problems.length === 0, problems: Object.freeze(problems) };
}
