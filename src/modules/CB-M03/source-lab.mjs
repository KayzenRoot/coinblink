// M03 P0: synthetic provenance and rights workbench. No I/O, fetching, publishing or owner admin.
export const SOURCE_DEMO_POLICY = "P0_OFFLINE_PROVENANCE_ONLY";
const samples = Object.freeze([
  Object.freeze({ id: "demo-source-alpha", label: "Fictional protocol bulletin", originUrl: "https://feed.example.test/articles/001",
    licensing: "NOT_CLEARED", fetchedAt: null, evidenceDigest: null, status: "DENIED_RIGHTS", mode: "MOCK" }),
  Object.freeze({ id: "demo-source-beta", label: "Imaginary educational notice", originUrl: "https://learn.example.test/demo/002",
    licensing: "UNKNOWN", fetchedAt: null, evidenceDigest: null, status: "DENIED_RIGHTS", mode: "MOCK" }),
  Object.freeze({ id: "demo-source-gamma", label: "Synthetic unavailable provider", originUrl: "https://offline.example.test/demo/003",
    licensing: "NOT_CLEARED", fetchedAt: null, evidenceDigest: null, status: "UNAVAILABLE", mode: "MOCK" }),
]);

/** Validates *labels only*: this function NEVER fetches its result. */
export function validateSyntheticSourceUrl(value) {
  if (typeof value !== "string" || value.length > 512 || value.trim() !== value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
    if (url.hostname !== "example.test" && !url.hostname.endsWith(".example.test")) return null;
    if (url.search || url.pathname.includes("\\") || url.pathname.length > 256) return null;
    return url.href;
  } catch {
    return null;
  }
}
/** Always fail closed for public reuse. An example.test URL is never publication permission. */
export function inspectSyntheticSource(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { state: "BAD_REQUEST", publiclyUsable: false, mode: "MOCK" };
  }
  const url = validateSyntheticSourceUrl(candidate.originUrl);
  if (!url) return { state: "BAD_REQUEST", publiclyUsable: false, mode: "MOCK" };
  if (candidate.status === "UNAVAILABLE") {
    return { state: "UNAVAILABLE", publiclyUsable: false, mode: "MOCK" };
  }
  if (candidate.licensing !== "APPROVED") {
    return { state: "DENIED_RIGHTS", publiclyUsable: false, mode: "MOCK" };
  }
  return { state: "SYNTHETIC_PREVIEW_ONLY", publiclyUsable: false, mode: "MOCK" };
}

export function listSyntheticSources({ query = "" } = {}) {
  if (typeof query !== "string" || query.length > 80) {
    return { state: "BAD_REQUEST", items: [], mode: "MOCK" };
  }
  const q = query.trim().toLowerCase();
  const items = samples.filter(item => [item.label, item.originUrl, item.status].some(s => s.toLowerCase().includes(q)));
  return { state: items.length ? "MOCK_RESULTS" : "EMPTY", items, mode: "MOCK" };
}

export function dedupeSyntheticIds(ids) {
  if (!Array.isArray(ids) || ids.some(id => typeof id !== "string" || id.length > 80)) return null;
  return [...new Set(ids)];
}
