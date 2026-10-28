// CB-M03-P1-LIVE-RSS-001: strict, pure RSS/Atom projection.
//
// Feed content is third-party and untrusted: every field is stripped of markup,
// bounded in length, and every link must be https on the publisher's own host.
// Nothing is stored and no full article text is ever taken.
import {
  LIVE_NEWS_MAX_ITEMS, LIVE_NEWS_SUMMARY_MAX, LIVE_NEWS_TITLE_MAX,
} from "./rss-sources.mjs";

const ENTITIES = Object.freeze({
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", "#x27": "'",
});

export function decodeEntities(text) {
  return text.replace(/&([a-zA-Z#0-9x]+);/gu, (whole, name) => ENTITIES[name] ?? whole);
}

/** Remove tags and collapse whitespace: feed descriptions often carry HTML. */
export function stripMarkup(value) {
  if (typeof value !== "string") return "";
  const withoutCdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gu, "$1");
  const withoutTags = withoutCdata.replace(/<[^>]*>/gu, " ");
  return decodeEntities(withoutTags).replace(/\s+/gu, " ").trim();
}

function clip(text, limit) {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + "\u2026";
}

function firstTag(xml, tag) {
  const pattern = "<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + tag + ">";
  const match = new RegExp(pattern, "iu").exec(xml);
  return match === null ? null : match[1];
}

function linkOf(item) {
  const direct = firstTag(item, "link");
  const inline = direct === null ? "" : stripMarkup(direct);
  if (inline !== "") return inline;
  // Atom style: <link href="..."/>
  const href = /<link\b[^>]*\bhref\s*=\s*["']([^"']+)["']/iu.exec(item);
  if (href !== null) return decodeEntities(href[1]).trim();
  return stripMarkup(firstTag(item, "guid") ?? "");
}

function safeLink(link, source) {
  try {
    const url = new URL(link);
    if (url.protocol !== "https:") return null;
    if (!source.hosts.includes(url.hostname)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function publishedAtOf(item) {
  const raw = stripMarkup(firstTag(item, "pubDate") ?? firstTag(item, "published") ??
    firstTag(item, "updated") ?? "");
  if (raw === "") return null;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

/**
 * Project one feed into frozen headline items. Malformed entries are dropped
 * individually: one bad item never empties the feed.
 * @param {unknown} xml
 * @param {{source: {id: string, name: string, home: string, hosts: readonly string[]}, collectedAt: string, limit?: number}} options
 */
export function parseRssFeed(xml, { source, collectedAt, limit = LIVE_NEWS_MAX_ITEMS } = {}) {
  if (typeof xml !== "string" || xml.trim() === "") return Object.freeze([]);
  if (source === null || typeof source !== "object" || !Array.isArray(source.hosts)) {
    throw new TypeError("a source with allowed hosts is required");
  }
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/giu)].map((match) => match[2]);
  const seen = new Set();
  const items = [];
  for (const block of blocks) {
    const title = clip(stripMarkup(firstTag(block, "title") ?? ""), LIVE_NEWS_TITLE_MAX);
    const link = safeLink(linkOf(block), source);
    if (title === "" || link === null || seen.has(link)) continue;
    seen.add(link);
    items.push(Object.freeze({
      id: source.id + ":" + link,
      title,
      summary: clip(stripMarkup(firstTag(block, "description") ?? firstTag(block, "summary") ?? ""),
        LIVE_NEWS_SUMMARY_MAX),
      link,
      sourceId: source.id,
      sourceName: source.name,
      sourceHome: source.home,
      publishedAt: publishedAtOf(block),
      collectedAt,
    }));
  }
  items.sort((a, b) => String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")));
  return Object.freeze(items.slice(0, Math.max(0, limit)));
}
