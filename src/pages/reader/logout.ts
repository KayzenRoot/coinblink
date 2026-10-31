// CB-M16-P1-READERS-001: revoke the reader session.
import type { APIRoute } from "astro";
import { clearSessionCookie, logout, readSessionCookie } from "../../modules/CB-M16/readers.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (request.headers.get("origin") !== url.origin) return new Response("Forbidden", { status: 403 });
  const db = runtimeBinding("CMS_DB");
  if (db !== undefined && db !== null) {
    await logout({ db, token: readSessionCookie(request), nowMs: Date.now() });
  }
  return new Response(null, {
    status: 303,
    headers: { location: "/reader/signin", "set-cookie": clearSessionCookie(), "cache-control": "no-store" },
  });
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
