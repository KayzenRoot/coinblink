// CB-M09-P1-SEO-001: crawler entry point that points at the sitemap.
import type { APIRoute } from "astro";
import { buildRobotsText, publicIndexingEnabled } from "../modules/CB-M09/seo-policy.mjs";
import { seoIndexingConfig } from "../lib/seo-indexing";

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const config = seoIndexingConfig(request);
  return new Response(buildRobotsText(config), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": publicIndexingEnabled(config) ? "public, max-age=3600" : "no-store",
      "x-content-type-options": "nosniff",
    },
  });
};
