// CB-M03-P1-LIVE-RSS-001: strict, pure RSS/Atom projection.
//
// Feed content is third-party and untrusted: every field is stripped of markup,
// bounded in length, and every link must be https on the publisher's own host.
// Nothing is stored and no full article text is ever taken.
import {
  LIVE_NEWS_MAX_PER_SOURCE, LIVE_NEWS_SUMMARY_MAX, LIVE_NEWS_TITLE_MAX,
} from "./rss-sources.mjs";

const ENTITIES = Object.freeze({
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", "#x27": "'",
});
const ENTITY_PATTERN = /&(?:amp|lt|gt|quot|apos|nbsp|#39|#x27);/gu;
const CDATA_PATTERN = /<!\[CDATA\[([\s\S]*?)\]\]>/gu;

export function decodeEntities(text) {
  return text.replace(ENTITY_PATTERN, (whole) => ENTITIES[whole.slice(1, -1)] ?? whole);
}

/** Drop tags in one linear pass: feed descriptions often carry HTML. */
function removeTags(text) {
  let kept = "";
  let index = 0;
  while (index < text.length) {
    const open = text.indexOf("<", index);
    if (open === -1) {
      kept += text.slice(index);
      break;
    }
    kept += text.slice(index, open) + " ";
    const close = text.indexOf(">", open + 1);
    if (close === -1) {
      kept += text.slice(open);
      break;
    }
    index = close + 1;
  }
  return kept;
}

export function stripMarkup(value) {
  if (typeof value !== "string") return "";
  return decodeEntities(removeTags(value.replace(CDATA_PATTERN, "$1")))
    .replace(/\s+/gu, " ")
    .trim();
}

function clip(text, limit) {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + "\u2026";
}

function firstTag(xml, tag) {
  const pattern = String.raw`<${tag}(?:\s[^>]*)?>([\s\S]*?)</${tag}>`;
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

/** @param {unknown} source */
function isFeedSource(source) {
  return source !== null && typeof source === "object" && !Array.isArray(source) &&
    typeof source.id === "string" && typeof source.name === "string" &&
    typeof source.home === "string" && Array.isArray(source.hosts);
}

/**
 * Project one feed into frozen headline items. Malformed entries are dropped
 * individually: one bad item never empties the feed.
 * @param {unknown} xml
 * @param {{source?: {id: string, name: string, home: string, hosts: readonly string[], language?: string}, collectedAt?: string, limit?: number}} [options]
 */
export function parseRssFeed(xml, options = {}) {
  const { source, collectedAt, limit = LIVE_NEWS_MAX_PER_SOURCE } = options ?? {};
  if (typeof xml !== "string" || xml.trim() === "") return Object.freeze([]);
  if (!isFeedSource(source)) throw new TypeError("a source with allowed hosts is required");
  const feed = /** @type {{id: string, name: string, home: string, hosts: readonly string[], language?: string}} */ (source);
  const blocks = [...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/giu)].map((match) => match[2]);
  const seen = new Set();
  const items = [];
  for (const block of blocks) {
    const title = clip(stripMarkup(firstTag(block, "title") ?? ""), LIVE_NEWS_TITLE_MAX);
    const link = safeLink(linkOf(block), feed);
    if (title === "" || link === null || seen.has(link)) continue;
    seen.add(link);
    items.push(Object.freeze({
      id: feed.id + ":" + link,
      title,
      summary: clip(stripMarkup(firstTag(block, "description") ?? firstTag(block, "summary") ?? ""),
        LIVE_NEWS_SUMMARY_MAX),
      link,
      sourceId: feed.id,
      sourceName: feed.name,
      sourceHome: feed.home,
      language: typeof feed.language === "string" && feed.language !== "" ? feed.language : "en",
      publishedAt: publishedAtOf(block),
      collectedAt,
    }));
  }
  items.sort((a, b) => String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")));
  return Object.freeze(items.slice(0, Math.max(0, limit)));
}
