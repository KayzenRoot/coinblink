// CB-M16-P1-READERS-001: consume the magic link, open a session, land on /reader.
import type { APIRoute } from "astro";
import { consumeLogin, sessionCookie } from "../../modules/CB-M16/readers.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return new Response("Unavailable", { status: 503 });
  const result = await consumeLogin({ db, token: url.searchParams.get("token") ?? "", nowMs: Date.now() });
  if (result.status !== "ok") {
    return Response.redirect(new URL("/reader/signin?error=link", url.origin), 303);
  }
  return new Response(null, {
    status: 303,
    headers: { location: "/reader", 'set-cookie': sessionCookie(result.session), "cache-control": "no-store" },
  });
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "GET" } });
