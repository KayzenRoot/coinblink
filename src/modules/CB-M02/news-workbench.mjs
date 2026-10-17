// CB-M02-WO-002: self-authored fictional specimens. Not a public news feed.
// No network, published claim, real source, private draft, or provider data.
export const NEWS_MOCK_POLICY = "P0_OFFLINE_MOCK_ONLY";
const ROWS = Object.freeze([
  Object.freeze({ id: "demo-wallet-safety", slug: "demo-wallet-safety", category: "security",
    title: "Fictional wallet safety workshop", summary: "Invented scenario for testing safety-oriented article navigation. No event occurred.",
    body: "In this imaginary exercise, readers compare recovery options without handling any real keys.",
    demo: true, published: false, rights: "SYNTHETIC_NOT_LICENSED_NEWS" }),
  Object.freeze({ id: "demo-protocol-classroom", slug: "demo-protocol-classroom", category: "protocol",
    title: "Imaginary protocol classroom", summary: "Fictional demonstration of how a protocol explanation might appear.",
    body: "An invented class explores network confirmations. This is not a real announcement.",
    demo: true, published: false, rights: "SYNTHETIC_NOT_LICENSED_NEWS" }),
  Object.freeze({ id: "demo-chain-basics", slug: "demo-chain-basics", category: "education",
    title: "Practice ledger tutorial", summary: "Synthetic teaching example, not a report about actual token prices.",
    body: "A fake ledger gives readers a harmless way to inspect hypothetical transaction states.",
    demo: true, published: false, rights: "SYNTHETIC_NOT_LICENSED_NEWS" }),
]);
const CATEGORIES = new Set(["all", "security", "protocol", "education"]);

/** @param {{ query?: unknown, category?: unknown, state?: unknown }} [options] */
export function listMockNews(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return { status: "BAD_REQUEST", items: [], mode: "MOCK" };
  }
  const { query = "", category = "all", state = "READY" } = options;
  if (typeof query !== "string" || query.length > 80 || !CATEGORIES.has(category)
    || !["READY", "LOADING", "UNAVAILABLE", "DENIED_RIGHTS"].includes(state)) {
    return { status: "BAD_REQUEST", items: [], mode: "MOCK" };
  }
  if (state !== "READY") return { status: state, items: [], mode: "MOCK" };
  const word = query.trim().toLocaleLowerCase("en");
  const found = ROWS.filter(item => (category === "all" || item.category === category)
    && [item.title, item.summary, item.category].some(text => text.toLocaleLowerCase("en").includes(word)));
  return { status: found.length ? "MOCK_RESULTS" : "EMPTY", items: found, mode: "MOCK" };
}

/** @param {unknown} slug */
export function resolveMockNews(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,48}$/u.test(slug)) {
    return { status: "BAD_REQUEST", item: null };
  }
  const item = ROWS.find(entry => entry.slug === slug);
  return item ? { status: "MOCK_DETAIL_NOT_PUBLISHED", item } : { status: "NOT_FOUND", item: null };
}
