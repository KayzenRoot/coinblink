/* global document, window */
// Browser-local saved searches for the live reader. No network, account,
// server, cookie or tracking; only query, publisher and window are stored.
import { LIVE_NEWS_SOURCES } from "./rss-sources.mjs";
import { fillLiveNewsCopy, getLiveNewsCopy } from "./live-news-copy.mjs";
import {
  SAVED_SEARCH_MAX, addSavedSearch, clearSavedSearches, normalizeSavedSearch,
  readSavedSearches, removeSavedSearch, savedSearchHref,
} from "./saved-searches.mjs";

const root = document.querySelector("[data-m03-saved-searches]");
if (root) {
  const locale = root.dataset.locale ?? "en";
  const copy = getLiveNewsCopy(locale);
  const sourceNames = new Map(LIVE_NEWS_SOURCES.map((source) => [source.id, source.name]));
  const storage = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  if (storage !== null) {
    const current = normalizeSavedSearch({
      q: root.dataset.currentQ ?? "",
      source: root.dataset.currentSource ?? "all",
      since: Number(root.dataset.currentSince ?? 0),
    });
    const list = root.querySelector("[data-m03-saved-list]");
    const empty = root.querySelector("[data-m03-saved-empty]");
    const status = root.querySelector("[data-m03-save-status]");
    const clear = root.querySelector("[data-m03-saved-clear]");
    const save = root.querySelector("[data-m03-save-current]");

    const labelOf = (entry) => {
      const parts = [];
      if (entry.q !== "") parts.push(entry.q);
      if (entry.source !== "all") parts.push(sourceNames.get(entry.source) ?? entry.source);
      if (entry.since > 0) parts.push(fillLiveNewsCopy(copy.sinceHours, { hours: entry.since }));
      return parts.length === 0 ? copy.savedAll : parts.join(" · ");
    };
    const announce = (message) => { status.textContent = message; };
    const render = (items) => {
      list.replaceChildren();
      for (const entry of items) {
        const item = document.createElement("li");
        item.dataset.m03SavedItem = entry.id;
        const link = document.createElement("a");
        link.href = savedSearchHref(entry, locale);
        link.textContent = labelOf(entry);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", fillLiveNewsCopy(copy.savedRemove, { label: labelOf(entry) }));
        remove.addEventListener("click", () => {
          const result = removeSavedSearch(storage, entry.id);
          if (result.status === "ERROR") { announce(copy.savedError); return; }
          render(result.items);
          announce(copy.savedRemoved);
        });
        item.append(link, remove);
        list.append(item);
      }
      empty.hidden = items.length !== 0;
      clear.hidden = items.length === 0;
      save.disabled = current === null;
    };

    save.addEventListener("click", () => {
      if (current === null) return;
      const result = addSavedSearch(storage, current);
      const message = {
        SAVED: copy.savedSaved,
        DUPLICATE: copy.savedDuplicate,
        FULL: fillLiveNewsCopy(copy.savedFull, { max: SAVED_SEARCH_MAX }),
        ERROR: copy.savedError,
      }[result.status] ?? copy.savedError;
      render(result.items);
      announce(message);
    });
    clear.addEventListener("click", () => {
      const result = clearSavedSearches(storage);
      if (result.status === "ERROR") { announce(copy.savedError); return; }
      render(result.items);
      announce(copy.savedCleared);
    });
    root.hidden = false;
    render(readSavedSearches(storage));
  }
}
