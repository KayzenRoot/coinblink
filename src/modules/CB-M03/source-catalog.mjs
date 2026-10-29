// CB-M11-P1-SOURCE-CATALOG-001: public publisher metadata.
//
// Names, home pages, feed URLs and the localized reader pages are public
// provenance data. This catalog never includes headlines, excerpts or any
// other editorial content.
import { LIVE_NEWS_SOURCES } from "./rss-sources.mjs";

const DISCLAIMER = "Publisher metadata only; no article content is included.";
const LOCALES = Object.freeze(["en", "pt-br", "es"]);

function pagesFor(id) {
  return Object.freeze(Object.fromEntries(
    LOCALES.map((locale) => [locale, "/" + locale + "/news/source/" + id]),
  ));
}

export function buildSourceCatalog() {
  const sources = LIVE_NEWS_SOURCES.map((source) => Object.freeze({
    id: source.id,
    name: source.name,
    home: source.home,
    feed: source.url,
    pages: pagesFor(source.id),
    rights: "ATTRIBUTION_ONLY",
  }));
  return Object.freeze({
    status: "ok",
    mode: "PUBLIC_METADATA",
    count: sources.length,
    rights: "ATTRIBUTION_ONLY",
    sources: Object.freeze(sources),
    disclaimer: DISCLAIMER,
  });
}
