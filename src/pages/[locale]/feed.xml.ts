// CB-M09-P1-FEED-001: RSS 2.0 feed of our own published articles.
//
// One feed per locale. An unknown locale answers 404 and an empty locale keeps
// a valid, empty channel instead of pretending there is content.
import type { APIRoute } from "astro";
import { buildFeed, isFeedLocale } from "../../modules/CB-M09/feed.mjs";
import { listArticles } from "../../modules/CB-M05/p1-production/articles.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

const HEADERS = {
  "content-type": "application/rss+xml; charset=utf-8",
  "cache-control": "public, max-age=300, s-maxage=900",
};

export const GET: APIRoute = async ({ params, request }) => {
  const locale = String(params.locale ?? "");
  if (!isFeedLocale(locale)) {
    return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const configured = import.meta.env.PUBLIC_SITE_ORIGIN;
  const origin = typeof configured === "string" && configured.trim() !== ""
    ? configured.replace(/\/$/u, "")
    : new URL(request.url).origin;
  const db = runtimeBinding("CMS_DB");
  const articles = db === undefined || db === null
    ? []
    : await listArticles({ db, locale, limit: 50 });
  return new Response(buildFeed({ locale, origin, articles }), { status: 200, headers: HEADERS });
};
