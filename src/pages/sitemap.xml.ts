// CB-M09-P1-SEO-001: sitemap of the public routes plus published articles.
import type { APIRoute } from "astro";
import { listPublishedSitemapPaths } from "../modules/CB-M09/sitemap-articles.mjs";
import { runtimeBinding } from "../lib/runtime-env";
import { seoIndexingConfig } from "../lib/seo-indexing";
import { publicIndexingEnabled } from "../modules/CB-M09/seo-policy.mjs";

export const prerender = false;

const LOCALES = ["en", "pt-br", "es"] as const;

export const GET: APIRoute = async ({ request }) => {
  const config = seoIndexingConfig(request);
  const urls = new Set<string>();
  if (publicIndexingEnabled(config)) {
    for (const locale of LOCALES) urls.add(config.origin + "/" + locale + "/editorial");
    const db = runtimeBinding("CMS_DB");
    try {
      const paths = await listPublishedSitemapPaths({ db });
      for (const path of paths) urls.add(config.origin + path);
    } catch {
      return new Response("Sitemap temporarily unavailable", {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow, noarchive",
        },
      });
    }
  }

  const body = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + [...urls].map((url) => "  <url><loc>" + url.replaceAll("&", "&amp;") + "</loc></url>").join("\n")
    + "\n</urlset>\n";
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": publicIndexingEnabled(config) ? "public, max-age=3600" : "no-store",
      "x-content-type-options": "nosniff",
    },
  });
};
