import type { APIRoute } from "astro";
import { buildInfo } from "../lib/build-info";

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      status: "demo",
      dataMode: "demonstration-only",
      editorialFeed: "not-connected",
      marketData: "not-connected",
      cloudflarePreview: "not-deployed",
      buildSha: buildInfo.sha,
      environment: buildInfo.environment,
    }),
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
