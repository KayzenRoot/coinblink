// CB-M16-P1-READERS-001: request a magic link. Always the same answer, so the
// endpoint never reveals whether an address already has an account.
import type { APIRoute } from "astro";
import { normalizeEmail, requestLogin, sendLoginLink } from "../../../modules/CB-M16/readers.mjs";
import { runtimeBinding, runtimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  if (db === undefined || db === null || typeof secret !== "string") return new Response("Unavailable", { status: 503 });
  const type = request.headers.get("content-type") ?? "";
  const form = type.includes("application/json")
    ? (await request.json().catch(() => ({})) as Record<string, unknown>)
    : Object.fromEntries((await request.formData().catch(() => new FormData())).entries());
  const email = normalizeEmail(String(form.email ?? ""));
  const locale = String(form.locale ?? "en");
  const wantsHtml = (request.headers.get("accept") ?? "").includes("text/html");
  if (email === null) {
    return wantsHtml
      ? Response.redirect(new URL("/reader/signin?error=email", url.origin), 303)
      : new Response(JSON.stringify({ status: "invalid_email" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  const result = await requestLogin({ db, email, locale, nowMs: Date.now() });
  if (result.status === "sent") {
    const integrations = Object.fromEntries(
      ["RESEND_API_KEY", "COINBLINK_EMAIL_FROM"].map((key) => [key, runtimeEnv(key)]),
    );
    await sendLoginLink({
      db, secret, env: integrations, email: result.email, token: result.token, origin: url.origin,
    });
  }
  if (wantsHtml) return Response.redirect(new URL("/reader/signin?sent=1", url.origin), 303);
  return new Response(JSON.stringify({ status: "accepted" }), {
    status: 202,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
