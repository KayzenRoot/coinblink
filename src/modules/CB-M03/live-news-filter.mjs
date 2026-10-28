// CB-M03-P1-LIVE-DISCOVERY-001: pure filtering over one collected snapshot.
//
// Narrowing never triggers another request: it only selects from what the
// current collection already returned, so a search cannot multiply egress or
// turn the reader into a proxy for arbitrary publisher queries.
import { LIVE_NEWS_QUERY_MAX, LIVE_NEWS_SOURCES } from "./rss-sources.mjs";

export const LIVE_NEWS_ALL_SOURCES = "all";

/** Fold accents and case so an unaccented query still finds accented text. */
export function normalizeLiveSearch(value) {
  if (typeof value !== "string") return "";
  return value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLocaleLowerCase("en");
}

export function clampLiveSearchQuery(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, LIVE_NEWS_QUERY_MAX);
}

/** Only a publisher on the reviewed whitelist can narrow the list. */
export function clampLiveSource(value, sources = LIVE_NEWS_SOURCES) {
  if (typeof value !== "string") return LIVE_NEWS_ALL_SOURCES;
  return sources.some((source) => source.id === value) ? value : LIVE_NEWS_ALL_SOURCES;
}

export function matchesLiveHeadline(item, { query = "", source = LIVE_NEWS_ALL_SOURCES } = {}) {
  if (item === null || typeof item !== "object") return false;
  if (source !== LIVE_NEWS_ALL_SOURCES && item.sourceId !== source) return false;
  const needle = normalizeLiveSearch(clampLiveSearchQuery(query));
  if (needle === "") return true;
  return normalizeLiveSearch([item.title, item.summary, item.sourceName].join(" "))
    .includes(needle);
}

export function filterLiveHeadlines(items, filter = {}) {
  if (!Array.isArray(items)) return Object.freeze([]);
  return Object.freeze(items.filter((item) => matchesLiveHeadline(item, filter)));
}
