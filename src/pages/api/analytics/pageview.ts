// CB-M06-P1-PAGEVIEWS-001: same-origin, cookieless pageview counter.
import type { APIRoute } from "astro";
import { runtimeBinding } from "../../../lib/runtime-env";
import { normalizePageviewPath, recordPageview } from "../../../modules/CB-M06/pageview.mjs";

export const prerender = false;

const HEADERS = Object.freeze({ "cache-control": "no-store", "x-robots-tag": "noindex" });

function reply(status: number): Response {
  return new Response(null, { status, headers: HEADERS });
}

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin || request.headers.get("sec-fetch-site") !== "same-origin") {
    return reply(403);
  }
  if (!/^application\/json(?:\s*;|$)/iu.test(request.headers.get("content-type") ?? "")) return reply(415);
  const text = await request.text();
  if (text.length === 0 || text.length > 2048) return reply(413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return reply(400);
  }
  const path = normalizePageviewPath(body?.path);
  if (path === null) return reply(400);
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return reply(503);
  const day = new Date().toISOString().slice(0, 10);
  await recordPageview({ db, path, locale: body?.locale, day });
  return reply(204);
};

export const ALL: APIRoute = ({ request }) => (request.method === "OPTIONS"
  ? new Response(null, { status: 204, headers: { ...HEADERS, allow: "POST" } })
  : new Response(null, { status: 405, headers: { ...HEADERS, allow: "POST" } }));
