// CB-M02-P1-SHARED-SEARCH-001: one matcher for the news list.
//
// The server decides the initial visible set from the URL and the browser
// re-filters on input. Both must agree exactly, so the comparison lives here and
// is loaded by both sides instead of being written twice.
//
// Pure and dependency-free: no DOM, no network, no storage.
export const MOCK_NEWS_CATEGORIES = Object.freeze(["security", "protocol", "education"]);
export const MAX_SEARCH_LENGTH = 80;

/** Fold diacritics and case so "SEGURANCA" matches "segurança" in any locale. */
export function normalizeSearchText(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLocaleLowerCase("en");
}

/** Clamp an untrusted query: strings only, no padding, bounded length. */
export function clampSearchQuery(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, MAX_SEARCH_LENGTH);
}

/** Clamp an untrusted category to the known set, falling back to "all". */
export function clampSearchCategory(value) {
  return typeof value === "string" && MOCK_NEWS_CATEGORIES.includes(value) ? value : "all";
}

/**
 * Decide whether one entry survives a filter.
 * @param {{category: string, searchable: string}} entry
 * @param {{query?: string, category?: string}} filter
 */
export function matchesMockNewsFilter(entry, filter = {}) {
  if (!entry || typeof entry !== "object") return false;
  const category = clampSearchCategory(filter.category);
  if (category !== "all" && entry.category !== category) return false;
  const query = normalizeSearchText(clampSearchQuery(filter.query));
  if (query === "") return true;
  return normalizeSearchText(entry.searchable).includes(query);
}

/** Count how many entries survive, so the page and the client agree on totals. */
export function countMockNewsMatches(entries, filter = {}) {
  if (!Array.isArray(entries)) return 0;
  return entries.filter((entry) => matchesMockNewsFilter(entry, filter)).length;
}
