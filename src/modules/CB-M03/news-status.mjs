// CB-M11-P1-NEWS-STATUS-001: content-free projection of the live collection.
//
// A status endpoint may expose which feeds answered and how much they returned,
// but never the headline text itself. Publisher names are omitted too: ids and
// counts are enough to monitor the pipeline without redistributing anything.
import { LIVE_NEWS_SOURCES } from "./rss-sources.mjs";

const DISCLAIMER = "This response contains no headline text or article content.";

function feedRows(snapshot) {
  return snapshot.sources.map((source) => Object.freeze({
    id: source.id,
    status: source.status,
    itemCount: source.itemCount,
    reason: source.reason,
  }));
}

export function buildNewsStatus(snapshot, options = {}) {
  if (snapshot === null || typeof snapshot !== "object" || typeof snapshot.status !== "string") {
    throw new TypeError("a live-news snapshot is required");
  }
  const windowSeconds = Number.isSafeInteger(options.windowSeconds) && options.windowSeconds > 0
    ? options.windowSeconds
    : 900;
  if (snapshot.status === "DISABLED" || snapshot.status === "UNAVAILABLE") {
    return Object.freeze({
      status: snapshot.status === "DISABLED" ? "disabled" : "unavailable",
      mode: "LIVE_THIRD_PARTY",
      reason: snapshot.reason,
      windowSeconds,
      stale: false,
      feedsTotal: LIVE_NEWS_SOURCES.length,
      feedsRead: 0,
      items: 0,
      rights: "NO_CONTENT",
      feeds: Object.freeze([]),
      disclaimer: DISCLAIMER,
    });
  }
  if (snapshot.status !== "LIVE_HEADLINES") {
    throw new TypeError("unknown live-news snapshot status");
  }
  const feeds = Object.freeze(feedRows(snapshot));
  const stale = snapshot.stale === true;
  return Object.freeze({
    status: "ok",
    mode: "LIVE_THIRD_PARTY",
    collectedAt: snapshot.collectedAt,
    stale,
    ...(stale ? { refreshFailedAt: snapshot.refreshFailedAt } : {}),
    windowSeconds,
    feedsTotal: feeds.length,
    feedsRead: snapshot.sourcesRead,
    items: snapshot.itemCount,
    rights: snapshot.rightsStatus,
    attribution: Object.freeze({ required: true, path: "/en/news/sources" }),
    feeds,
    disclaimer: DISCLAIMER,
  });
}
