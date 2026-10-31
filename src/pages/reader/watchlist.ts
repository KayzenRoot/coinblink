// CB-M16-P1-READERS-001: add or remove a watchlist symbol for the signed-in reader.
import type { APIRoute } from "astro";
import {
  addSymbol, readSession, readSessionCookie, removeSymbol,
} from "../../modules/CB-M16/readers.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  // A cross-site POST must not act on the session cookie.
  const origin = request.headers.get("origin");
  if (origin !== url.origin) return new Response("Forbidden", { status: 403 });
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return new Response("Unavailable", { status: 503 });
  const session = await readSession({ db, token: readSessionCookie(request), nowMs: Date.now() });
  if (session === null) return Response.redirect(new URL("/reader/signin", url.origin), 303);
  const form = await request.formData();
  const symbol = String(form.get("symbol") ?? "");
  if (String(form.get("action") ?? "add") === "remove") {
    await removeSymbol({ db, readerId: session.id, symbol });
  } else {
    await addSymbol({ db, readerId: session.id, symbol, nowMs: Date.now() });
  }
  return Response.redirect(new URL("/reader", url.origin), 303);
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
