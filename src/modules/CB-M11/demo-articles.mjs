// CB-M11-P0-DEVELOPER-SANDBOX-001: an offline synthetic example, NOT a public news API.
// Reuses only M02's canonical invented specimens. No network, storage, credentials or providers.
import { listMockNews } from "../CB-M02/news-workbench.mjs";

const CANONICAL = listMockNews();
const ALLOWED_KEYS = Object.freeze([
  "body", "category", "demo", "id", "published", "rights", "slug", "summary", "title",
]);
const CATEGORIES = new Set(["security", "protocol", "education"]);
const EMPTY = Object.freeze({
  status: "UNAVAILABLE", mode: "SYNTHETIC", live: false, redistributable: false,
  items: Object.freeze([]),
});

const safeRow = (row, canonical) => {
  if (!row || typeof row !== "object" || Array.isArray(row) ||
      !canonical || typeof canonical !== "object" ||
      Object.keys(row).length !== ALLOWED_KEYS.length ||
      !ALLOWED_KEYS.every(key => Object.hasOwn(row, key)) ||
      row.demo !== true || row.published !== false ||
      row.rights !== "SYNTHETIC_NOT_LICENSED_NEWS" ||
      typeof row.id !== "string" || !/^demo-[a-z0-9-]{1,42}$/u.test(row.id) ||
      row.slug !== row.id || !CATEGORIES.has(row.category) ||
      typeof row.title !== "string" || !row.title.trim() || row.title.length > 160 ||
      typeof row.summary !== "string" || !row.summary.trim() || row.summary.length > 300 ||
      typeof row.body !== "string" || !row.body.trim() || row.body.length > 1200) return false;
  // Even correctly shaped but substituted fixtures must never be admitted.
  return ALLOWED_KEYS.every(key => row[key] === canonical[key]);
};

/**
 * Deliberately strict P0 projection. The optional argument is used solely for
 * contract tests of malformed/upstream-forged records, not a provider interface.
 * @param {unknown} [source]
 */
export function buildDemoArticles(source = listMockNews()) {
  if (!source || typeof source !== "object" || Array.isArray(source) ||
      source.status !== "MOCK_RESULTS" || source.mode !== "MOCK" ||
      !Array.isArray(source.items) || source.items.length !== 3 ||
      CANONICAL.status !== "MOCK_RESULTS" || CANONICAL.mode !== "MOCK" ||
      !Array.isArray(CANONICAL.items) || CANONICAL.items.length !== 3) return EMPTY;
  const ids = new Set();
  const result = [];
  for (const [index, row] of source.items.entries()) {
    if (!safeRow(row, CANONICAL.items[index]) || ids.has(row.id)) return EMPTY;
    ids.add(row.id);
    result.push(Object.freeze({
      id: row.id, slug: row.slug, category: row.category,
      title: row.title, summary: row.summary,
      published: false, rights: "SYNTHETIC_NOT_LICENSED_NEWS",
    }));
  }
  return Object.freeze({
    status: "DEMO_ONLY", mode: "SYNTHETIC", live: false,
    redistributable: false, items: Object.freeze(result),
  });
}
