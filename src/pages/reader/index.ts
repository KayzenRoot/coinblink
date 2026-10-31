// CB-M16-P1-READERS-001: reader dashboard with the watchlist.
import type { APIRoute } from "astro";
import { listSymbols, readSession, readSessionCookie, readerPage } from "../../modules/CB-M16/readers.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return new Response("Unavailable", { status: 503 });
  const session = await readSession({ db, token: readSessionCookie(request), nowMs: Date.now() });
  if (session === null) return Response.redirect(new URL("/reader/signin", url.origin), 303);
  return readerPage({ email: session.email, symbols: await listSymbols({ db, readerId: session.id }) });
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "GET" } });
