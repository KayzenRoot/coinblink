// CB-M03 P0: wholly fictional registry and deterministic offline event model.
// Not RSS ingestion, source rights approval, a queue, or a provider endpoint.
export const SOURCE_POLICY = "OFFLINE_NO_RIGHTS_CLEARED";
const EXAMPLES = Object.freeze([
  Object.freeze({ id: "demo-source-a", label: "Synthetic academic bulletin", origin: "https://academy.example.test/sample",
    rights: "NOT_CLEARED", capture: "DISABLED", publisherVerified: false, redistributable: false }),
  Object.freeze({ id: "demo-source-b", label: "Imaginary protocol notebook", origin: "https://protocol.example.test/notes",
    rights: "NOT_CLEARED", capture: "DISABLED", publisherVerified: false, redistributable: false }),
]);

/** @param {{ status?: unknown, query?: unknown }} [options] */
export function listOfflineSources(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)
    || !["ALL", "DENIED", "UNAVAILABLE"].includes(options.status ?? "ALL")
    || typeof (options.query ?? "") !== "string" || (options.query ?? "").length > 80) {
    return { state: "BAD_REQUEST", items: [], mode: "MOCK" };
  }
  if (options.status === "UNAVAILABLE") return { state: "UNAVAILABLE", items: [], mode: "MOCK" };
  const term = (options.query ?? "").trim().toLowerCase();
  const selected = EXAMPLES.filter(entry => entry.label.toLowerCase().includes(term));
  return { state: selected.length ? "OFFLINE_NOT_LICENSED" : "EMPTY",
    mode: "MOCK", items: selected };
}

/** @param {unknown} candidate */
function validate(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
  try {
    const { id, url, mode } = candidate;
    if (typeof id !== "string" || !/^[a-z0-9-]{1,48}$/u.test(id)
      || typeof url !== "string" || url.length > 200 || mode !== "MOCK") return false;
    const target = new URL(url);
    return target.protocol === "https:" && target.hostname.endsWith(".example.test")
      && !target.username && !target.password && target.search === "" && target.hash === "";
  } catch { return false; }
}

/** @param {unknown} samples */
export function simulateOfflineIngestion(samples) {
  if (!Array.isArray(samples) || samples.length > 20) return { state: "BAD_REQUEST", events: [] };
  const seen = new Set();
  const events = samples.map(entry => {
    if (!validate(entry)) return Object.freeze({ status: "BAD_REQUEST", redistributable: false });
    if (seen.has(entry.id)) return Object.freeze({ status: "DEDUPLICATED", redistributable: false });
    seen.add(entry.id);
    if (entry.providerState === "OFFLINE") return Object.freeze({ status: "UNAVAILABLE", redistributable: false });
    if (entry.providerState === "QUOTA") return Object.freeze({ status: "RETRY_AFTER", redistributable: false });
    return Object.freeze({ status: "DENIED_RIGHTS", redistributable: false });
  });
  return { state: "OFFLINE_SIMULATED", events, networkCalls: 0, captured: 0 };
}
