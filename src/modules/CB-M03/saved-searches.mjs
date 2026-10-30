// CB-M03-P1-SAVED-SEARCHES-001: browser-local saved searches.
//
// Only search preferences are stored: query text, publisher id and time
// window. No headline text, account, server, cookie or tracking. Storage is
// injected so the model stays pure and every read tolerates corrupt or foreign
// data without throwing.
import {
  LIVE_NEWS_ALL_SOURCES, clampLiveSearchQuery, clampLiveSince, clampLiveSource,
} from "./live-news-filter.mjs";

export const SAVED_SEARCH_KEY = "coinblink.live.saved-searches.v1";
export const SAVED_SEARCH_MAX = 8;
const SURFACES = new Set(["live", "coverage"]);

function freezeItems(items) {
  return Object.freeze(items);
}

/** Canonical saved search, or null when it would not narrow anything. */
export function normalizeSavedSearch(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) return null;
  const q = clampLiveSearchQuery(typeof input.q === "string" ? input.q : "");
  const source = clampLiveSource(typeof input.source === "string" ? input.source : LIVE_NEWS_ALL_SOURCES);
  const since = clampLiveSince(input.since);
  const surface = typeof input.surface === "string" && SURFACES.has(input.surface) ? input.surface : "live";
  if (q === "" && source === LIVE_NEWS_ALL_SOURCES && since === 0) return null;
  return Object.freeze({ q, source, since, surface, id: [surface, q, source, since].join("|") });
}

export function savedSearchHref(entry, locale) {
  const params = new URLSearchParams();
  if (entry.q !== "") params.set("q", entry.q);
  if (entry.source !== LIVE_NEWS_ALL_SOURCES) params.set("source", entry.source);
  if (entry.since > 0) params.set("since", String(entry.since));
  const search = params.toString();
  const path = entry.surface === "coverage" ? "/news/coverage" : "/news/live";
  return "/" + locale + path + (search === "" ? "" : "?" + search);
}

function storedEntries(storage) {
  try {
    const raw = storage.getItem(SAVED_SEARCH_KEY);
    if (typeof raw !== "string") return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    const items = [];
    for (const row of parsed.slice(0, SAVED_SEARCH_MAX)) {
      const entry = normalizeSavedSearch(row);
      if (entry === null || seen.has(entry.id)) continue;
      seen.add(entry.id);
      items.push(entry);
    }
    return items;
  } catch {
    return [];
  }
}

function persist(storage, items) {
  try {
    storage.setItem(SAVED_SEARCH_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function readSavedSearches(storage) {
  if (storage === null || typeof storage !== "object") return freezeItems([]);
  return freezeItems(storedEntries(storage));
}

export function addSavedSearch(storage, input) {
  const items = [...readSavedSearches(storage)];
  const entry = normalizeSavedSearch(input);
  if (entry === null) return Object.freeze({ status: "EMPTY", items: freezeItems(items) });
  if (items.some((row) => row.id === entry.id)) {
    return Object.freeze({ status: "DUPLICATE", items: freezeItems(items) });
  }
  if (items.length >= SAVED_SEARCH_MAX) {
    return Object.freeze({ status: "FULL", items: freezeItems(items) });
  }
  const next = freezeItems([entry, ...items]);
  if (!persist(storage, next)) return Object.freeze({ status: "ERROR", items: freezeItems(items) });
  return Object.freeze({ status: "SAVED", items: next });
}

export function removeSavedSearch(storage, id) {
  const items = readSavedSearches(storage);
  if (typeof id !== "string") return Object.freeze({ status: "NOT_FOUND", items });
  const next = freezeItems(items.filter((row) => row.id !== id));
  if (next.length === items.length) return Object.freeze({ status: "NOT_FOUND", items });
  if (!persist(storage, next)) return Object.freeze({ status: "ERROR", items });
  return Object.freeze({ status: "REMOVED", items: next });
}

export function clearSavedSearches(storage) {
  const items = readSavedSearches(storage);
  if (items.length === 0) return Object.freeze({ status: "EMPTY", items });
  if (!persist(storage, [])) return Object.freeze({ status: "ERROR", items });
  return Object.freeze({ status: "CLEARED", items: freezeItems([]) });
}
