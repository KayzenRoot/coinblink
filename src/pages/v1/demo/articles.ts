import type { APIRoute } from "astro";
import { buildDemoArticles } from "../../../modules/CB-M11/demo-articles.mjs";

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
  // Any query extension is unadmitted: no limit, cursor, locale, fields or private include.
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return new Response(JSON.stringify(errorPayload("BAD_REQUEST")), { status: 400, headers });
  }
  if (url.searchParams.size > 0) {
    return new Response(JSON.stringify(errorPayload("BAD_REQUEST")), { status: 400, headers });
  }
  const data = buildDemoArticles();
  return new Response(JSON.stringify(data), {
    status: data.status === "DEMO_ONLY" ? 200 : 503,
    headers,
  });
};

// Astro uses ALL only for methods without a separately defined handler.
export const ALL: APIRoute = () => new Response(
  JSON.stringify(errorPayload("METHOD_NOT_ALLOWED")),
  { status: 405, headers: { ...headers, allow: "GET" } },
);
