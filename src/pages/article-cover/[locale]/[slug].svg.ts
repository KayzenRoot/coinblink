// CB-M17-P1-COVERS-001: deterministic branded cover for a published article.
//
// The cover is drawn from the article's own title, tags and locale: no external
// image provider, no storage and no claim of photography. The same article
// always renders the same cover, and an unknown or unpublished slug answers 404.
import type { APIRoute } from "astro";
import { readArticle } from "../../../modules/CB-M05/p1-production/articles.mjs";
import { runtimeBinding } from "../../../lib/runtime-env";

export const prerender = false;

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_LINES = 3;
const LINE_CHARS = 26;

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

/** Splits a title into at most three balanced lines. */
export function wrapTitle(title: string): string[] {
  const words = title.split(/\s+/u).filter((word) => word !== "");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current === "") {
      current = word;
    } else if ((current + " " + word).length <= LINE_CHARS) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
    if (lines.length === MAX_LINES) break;
  }
  if (lines.length < MAX_LINES && current !== "") lines.push(current);
  if (lines.length === MAX_LINES && lines.join(" ").split(/\s+/u).length < words.length) {
    lines[MAX_LINES - 1] = lines[MAX_LINES - 1].replace(/.{2}$/u, "") + "…";
  }
  return lines;
}

export function coverSvg({ title, tags, locale }: { title: string; tags: readonly string[]; locale: string }): string {
  const lines = wrapTitle(title);
  const label = tags.length > 0 ? tags.slice(0, 3).join(" · ") : "CoinBlink";
  const startY = 300 - (lines.length - 1) * 44;
  const text = lines.map((line, index) => '<text x="72" y="' + (startY + index * 88)
    + '" class="t">' + escapeXml(line) + "</text>").join("");
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + WIDTH + '" height="' + HEIGHT
    + '" viewBox="0 0 ' + WIDTH + " " + HEIGHT + '" role="img" aria-label="' + escapeXml(title) + '">'
    + '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0%" stop-color="#0f2419"/><stop offset="55%" stop-color="#0a1410"/><stop offset="100%" stop-color="#070e0c"/>'
    + '</linearGradient><radialGradient id="glow" cx="82%" cy="18%" r="55%">'
    + '<stop offset="0%" stop-color="#b8f34b" stop-opacity=".38"/><stop offset="100%" stop-color="#b8f34b" stop-opacity="0"/>'
    + "</radialGradient></defs>"
    + '<rect width="' + WIDTH + '" height="' + HEIGHT + '" fill="url(#bg)"/>'
    + '<rect width="' + WIDTH + '" height="' + HEIGHT + '" fill="url(#glow)"/>'
    + '<circle cx="1010" cy="120" r="150" fill="none" stroke="#b8f34b" stroke-opacity=".28" stroke-width="2"/>'
    + '<circle cx="1010" cy="120" r="96" fill="none" stroke="#b8f34b" stroke-opacity=".18" stroke-width="2"/>'
    + '<text x="72" y="120" class="k">COINBLINK · ' + escapeXml(locale.toUpperCase()) + "</text>"
    + text
    + '<text x="72" y="556" class="m">' + escapeXml(label) + "</text>"
    + "<style>.t{fill:#f1ffe1;font:700 68px/1.05 system-ui,-apple-system,'Segoe UI',sans-serif}"
    + ".k{fill:#b8f34b;font:800 26px system-ui,sans-serif;letter-spacing:6px}"
    + ".m{fill:#9fb6a5;font:600 26px system-ui,sans-serif;letter-spacing:3px}</style>"
    + "</svg>";
}

export const GET: APIRoute = async ({ params }) => {
  const db = runtimeBinding("CMS_DB");
  const article = await readArticle({
    db, locale: String(params.locale ?? ""), slug: String(params.slug ?? "").replace(/\.svg$/u, ""),
  });
  if (article === null || article.status !== "published") {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }
  return new Response(coverSvg({ title: article.title, tags: article.tags, locale: article.locale }), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=604800",
      "x-content-type-options": "nosniff",
    },
  });
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "GET" } });
