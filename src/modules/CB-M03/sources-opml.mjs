// CB-M03-P1-OPML-001: the reviewed publisher feeds as an OPML 2.0 list.
//
// OPML carries public metadata only: publisher name, feed URL and home page.
// No headline, excerpt or article link is included, so the export never
// republishes content.
import { LIVE_NEWS_SOURCES } from "./rss-sources.mjs";

const XML_ESCAPES = Object.freeze({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
});

/** Escape one attribute value; non-strings become an empty attribute. */
export function escapeXml(value) {
  return typeof value === "string" ? value.replace(/[&<>"']/gu, (character) => XML_ESCAPES[character]) : "";
}

function outlineOf(source) {
  if (source === null || typeof source !== "object" || typeof source.id !== "string") return "";
  return '    <outline type="rss" text="' + escapeXml(source.name) + '" title="' + escapeXml(source.name)
    + '" xmlUrl="' + escapeXml(source.url) + '" htmlUrl="' + escapeXml(source.home) + '"/>';
}

/**
 * @param {unknown} [sources]
 * @returns {string}
 */
export function buildSourcesOpml(sources = LIVE_NEWS_SOURCES) {
  if (!Array.isArray(sources)) throw new TypeError("sources must be an array");
  const outlines = sources.map(outlineOf).filter((line) => line !== "").join("\n");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0">\n  <head>\n'
    + "    <title>CoinBlink publisher feeds</title>\n  </head>\n  <body>\n"
    + outlines + "\n  </body>\n</opml>\n";
}
