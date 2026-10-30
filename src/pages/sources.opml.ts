// CB-M03-P1-OPML-001: public OPML export of the reviewed publisher feeds.
import type { APIRoute } from "astro";
import { buildSourcesOpml } from "../modules/CB-M03/sources-opml.mjs";
import { conditionalResponse } from "../modules/CB-M11/conditional-get.mjs";

export const prerender = false;

const BODY = buildSourcesOpml();
const HEADERS = Object.freeze({
  "content-type": "text/x-opml; charset=utf-8",
  "cache-control": "public, max-age=3600",
  "content-disposition": 'attachment; filename="coinblink-sources.opml"',
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "x-robots-tag": "noindex",
});

export const GET: APIRoute = ({ request, url }) => {
  if ([...url.searchParams.keys()].length > 0) {
    return new Response(JSON.stringify({ status: "bad_request", reason: "UNSUPPORTED_QUERY" }), {
      status: 400, headers: HEADERS,
    });
  }
  return conditionalResponse(BODY, request, HEADERS);
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: HEADERS });

export const ALL: APIRoute = ({ request }) => request.method === "HEAD"
  ? new Response(null, { status: 200, headers: HEADERS })
  : new Response(JSON.stringify({ status: "method_not_allowed" }), {
    status: 405, headers: { ...HEADERS, allow: "GET" },
  });
