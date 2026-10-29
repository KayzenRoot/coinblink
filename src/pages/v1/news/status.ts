// CB-M11-P1-NEWS-STATUS-001: public, content-free collection status.
import type { APIRoute } from "astro";
import { readLiveNews } from "../../../modules/CB-M03/live-news.mjs";
import { buildNewsStatus } from "../../../modules/CB-M03/news-status.mjs";
import { LIVE_NEWS_WINDOW_SECONDS } from "../../../modules/CB-M03/rss-sources.mjs";
import { matchesIfNoneMatch, strongEtag } from "../../../modules/CB-M11/conditional-get.mjs";

export const prerender = false;

const HEADERS = Object.freeze({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "x-robots-tag": "noindex",
});

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...HEADERS, ...extraHeaders },
  });
}

export const GET: APIRoute = async ({ url, request }) => {
  if ([...url.searchParams.keys()].length > 0) {
    return json({ status: "bad_request", reason: "UNSUPPORTED_QUERY" }, 400);
  }
  try {
    const snapshot = await readLiveNews({ enabled: import.meta.env.PUBLIC_NEWS_LIVE });
    const body = JSON.stringify(buildNewsStatus(snapshot, { windowSeconds: LIVE_NEWS_WINDOW_SECONDS }));
    const etag = strongEtag(body);
    if (matchesIfNoneMatch(request.headers.get("if-none-match"), etag)) {
      return new Response(null, { status: 304, headers: { ...HEADERS, etag } });
    }
    return new Response(body, { status: 200, headers: { ...HEADERS, etag } });
  } catch {
    return json({ status: "unavailable", reason: "INTERNAL" }, 503);
  }
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: HEADERS });

export const ALL: APIRoute = ({ request }) => {
  if (request.method === "HEAD") return new Response(null, { status: 200, headers: HEADERS });
  return json({ status: "method_not_allowed" }, 405, { allow: "GET" });
};
