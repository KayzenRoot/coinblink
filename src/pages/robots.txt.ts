// CB-M09-P1-SEO-001: crawler entry point that points at the sitemap.
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const configured = import.meta.env.PUBLIC_SITE_ORIGIN;
  const base = typeof configured === "string" && configured.trim() !== ""
    ? configured.replace(/\/$/u, "")
    : new URL(request.url).origin;
  const body = "User-agent: *\nAllow: /\nSitemap: " + base + "/sitemap.xml\n";
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
};
