// CB-M16-P1-READERS-001: the reader deletes the account and everything tied to it.
import type { APIRoute } from "astro";
import {
  clearSessionCookie, deleteReader, readSession, readSessionCookie,
} from "../../modules/CB-M16/readers.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (request.headers.get("origin") !== url.origin) return new Response("Forbidden", { status: 403 });
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return new Response("Unavailable", { status: 503 });
  const session = await readSession({ db, token: readSessionCookie(request), nowMs: Date.now() });
  if (session === null) return Response.redirect(new URL("/reader/signin", url.origin), 303);
  const form = await request.formData();
  if (String(form.get("confirm") ?? "") !== "yes") {
    return Response.redirect(new URL("/reader?error=confirm", url.origin), 303);
  }
  await deleteReader({ db, readerId: session.id });
  return new Response(null, {
    status: 303,
    headers: {
      location: "/reader/signin?deleted=1",
      "set-cookie": clearSessionCookie(),
      "cache-control": "no-store",
    },
  });
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
