import type { APIRoute } from "astro";
import { buildDemoArticleDetail } from "../../../../modules/CB-M11/demo-article-detail.mjs";

export const prerender = false;

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow, noarchive",
};

const emptyPayload = (status: string) => ({
  mode: "SYNTHETIC", status, live: false, redistributable: false, item: null,
});

const statusFor = (status: string): number => {
  if (status === "DEMO_DETAIL_NOT_PUBLISHED") return 200;
  if (status === "NOT_FOUND") return 404;
  if (status === "BAD_REQUEST") return 400;
  return 503;
};

export const GET: APIRoute = ({ request, params }) => {
  // Any query extension is unadmitted: no fields, include, locale or expansion.
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return new Response(JSON.stringify(emptyPayload("BAD_REQUEST")), { status: 400, headers });
  }
  if (url.searchParams.size > 0) {
    return new Response(JSON.stringify(emptyPayload("BAD_REQUEST")), { status: 400, headers });
  }
  const data = buildDemoArticleDetail(params.slug);
  return new Response(JSON.stringify(data), { status: statusFor(data.status), headers });
};

// Astro uses ALL only for methods without a separately defined handler.
export const ALL: APIRoute = () => new Response(
  JSON.stringify(emptyPayload("METHOD_NOT_ALLOWED")),
  { status: 405, headers: { ...headers, allow: "GET" } },
);
