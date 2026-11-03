// CB-M07-P1-SOCIAL-OAUTH-001: begin the owner-initiated TikTok OAuth flow.
//
// The start requires the owner session and records a one-use state digest in
// D1, so the callback can prove the flow was started by the owner even though
// the Strict session cookie is not sent on the cross-site redirect back.
import type { APIRoute } from "astro";
import { authorize } from "../../../../modules/CB-M05/p1-production/owner-auth.mjs";
import { getSetting } from "../../../../modules/CB-M05/p1-production/settings.mjs";
import {
  buildAuthorizeUrl, TT_COOKIE_MAX_AGE, TT_COOKIE_PATH, TT_STATE_COOKIE,
} from "../../../../modules/CB-M07/tiktok-oauth.mjs";
import { createOauthState } from "../../../../modules/CB-M07/token-vault.mjs";
import { randomToken } from "../../../../modules/CB-M07/x-oauth.mjs";
import { runtimeBinding, runtimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;

const NO_STORE = Object.freeze({
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
});

export const GET: APIRoute = async ({ cookies, redirect, request, url }) => {
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  const ownerEnabled = runtimeEnv("M05_OWNER_ENABLED");
  if (db === undefined || db === null || typeof secret !== "string" || ownerEnabled !== "true") {
    return new Response("TikTok OAuth is not configured on this deployment.", { status: 503, headers: NO_STORE });
  }
  const clientKey = await getSetting({ db, secret, env: { TIKTOK_CLIENT_KEY: runtimeEnv("TIKTOK_CLIENT_KEY") }, key: "TIKTOK_CLIENT_KEY" });
  if (typeof clientKey !== "string" || clientKey === "") {
    return new Response("TikTok OAuth is not configured on this deployment.", { status: 503, headers: NO_STORE });
  }
  const session = await authorize(request, { db, secret, now: Math.floor(Date.now() / 1000) });
  if (session === null) return new Response("Not found", { status: 404, headers: NO_STORE });
  const state = randomToken();
  if (!(await createOauthState({ db, state, nowMs: Date.now() }))) {
    return new Response("Owner storage is not ready for OAuth.", { status: 503, headers: NO_STORE });
  }
  cookies.set(TT_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: TT_COOKIE_PATH,
    maxAge: TT_COOKIE_MAX_AGE,
  });
  const redirectUri = new URL("/api/oauth/tiktok/callback", url.origin).toString();
  return redirect(buildAuthorizeUrl({ clientKey, redirectUri, state }), 302);
};
