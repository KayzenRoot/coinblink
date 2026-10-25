// CB-M12-P0-LOCAL-QUOTA-PREVIEW-001: fictional math, not an account or entitlement.
// NO prices, credit cards, database, remote providers, API keys, payments or billable quotas.
const EXAMPLES = Object.freeze([
  Object.freeze({ id: "sample", label: "Sample sandbox", limit: 5 }),
  Object.freeze({ id: "prototype", label: "Prototype sandbox", limit: 10 }),
  Object.freeze({ id: "lab", label: "Learning lab", limit: 20 }),
]);
const LIMITS = Object.freeze(Object.fromEntries(EXAMPLES.map(x => [x.id, x.limit])));
const INVALID = Object.freeze({
  mode: "LOCAL_SYNTHETIC", status: "INVALID_SELECTION", preview: null,
});

export function listLocalQuotaExamples() {
  return EXAMPLES;
}

export function calculateLocalQuotaPreview(preset, used) {
  if (typeof preset !== "string" || !Object.hasOwn(LIMITS, preset) ||
      !Number.isSafeInteger(used) || used < 0 || used > 20) {
    return INVALID;
  }
  const limit = LIMITS[preset];
  return Object.freeze({
    mode: "LOCAL_SYNTHETIC", status: "SIMULATION_ONLY", preset,
    simulatedLimit: limit, simulatedUsed: used,
    simulatedRemaining: Math.max(0, limit - used),
    limitReached: used >= limit,
    billingEnabled: false, purchaseEnabled: false,
    customerAccount: false, price: null, live: false,
  });
}
