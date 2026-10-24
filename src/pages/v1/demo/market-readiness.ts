import type { APIRoute } from "astro";
import { buildDemoMarketReadiness } from "../../../modules/CB-M11/demo-market-readiness.mjs";

export const prerender = false;

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
};

const errorPayload = (status: string) => ({
  mode: "SYNTHETIC", status, live: false, redistributable: false, items: [],
});

export const GET: APIRoute = ({ request }) => {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return new Response(JSON.stringify(errorPayload("BAD_REQUEST")), { status: 400, headers });
  }
  // No symbols, quote parameters, pagination, body or customer overrides in P0.
  if (url.searchParams.size !== 0) {
    return new Response(JSON.stringify(errorPayload("BAD_REQUEST")), { status: 400, headers });
  }
  const data = buildDemoMarketReadiness();
  return new Response(JSON.stringify(data), {
    status: data.status === "BLOCKED_DEMO" ? 200 : 503,
    headers,
  });
};

export const ALL: APIRoute = () => new Response(
  JSON.stringify(errorPayload("METHOD_NOT_ALLOWED")),
  { status: 405, headers: { ...headers, allow: "GET" } },
);
