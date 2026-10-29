// CB-M11-P1-SOURCE-CATALOG-001: public publisher metadata endpoint.
import type { APIRoute } from "astro";
import { buildSourceCatalog } from "../../modules/CB-M03/source-catalog.mjs";

export const prerender = false;

const HEADERS = Object.freeze({
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=3600",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "x-robots-tag": "noindex",
});

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...HEADERS, ...extraHeaders } });
}

export const GET: APIRoute = ({ url }) => {
  if ([...url.searchParams.keys()].length > 0) {
    return json({ status: "bad_request", reason: "UNSUPPORTED_QUERY" }, 400);
  }
  try {
    return json(buildSourceCatalog(), 200);
  } catch {
    return json({ status: "unavailable", reason: "INTERNAL" }, 503);
  }
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: HEADERS });

export const ALL: APIRoute = ({ request }) => {
  if (request.method === "HEAD") return new Response(null, { status: 200, headers: HEADERS });
  return json({ status: "method_not_allowed" }, 405, { allow: "GET" });
};
