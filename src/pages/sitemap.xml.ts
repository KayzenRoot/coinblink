// CB-M09-P1-SEO-001: sitemap of the public routes plus published articles.
import type { APIRoute } from "astro";
import { listArticles } from "../modules/CB-M05/p1-production/articles.mjs";
import { runtimeBinding } from "../lib/runtime-env";

export const prerender = false;

const LOCALES = ["en", "pt-br", "es"] as const;
const STATIC_PATHS = ["", "/news", "/news/live", "/news/sources", "/news/coverage", "/legal", "/editorial"];

function origin(request: Request): string {
  const configured = import.meta.env.PUBLIC_SITE_ORIGIN;
  if (typeof configured === "string" && configured.trim() !== "") return configured.replace(/\/$/u, "");
  return new URL(request.url).origin;
}

export const GET: APIRoute = async ({ request }) => {
  const base = origin(request);
  const urls: string[] = [];
  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) urls.push(base + "/" + locale + path);
  }
  urls.push(base + "/developers", base + "/status", base + "/newsletter", base + "/newsletter/editions");

  const db = runtimeBinding("CMS_DB");
  const articles = db === undefined || db === null ? [] : await listArticles({ db, limit: 200 });
  for (const article of articles) urls.push(base + "/" + article.locale + "/article/" + article.slug);

  const body = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map((url) => "  <url><loc>" + url.replaceAll("&", "&amp;") + "</loc></url>").join("\n")
    + "\n</urlset>\n";
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
};
