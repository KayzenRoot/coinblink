// CB-M07-P1-SOCIAL-OAUTH-001: begin the owner-initiated Instagram OAuth flow.
//
// The start requires the owner session and records a one-use state digest in
// D1, so the callback can prove the flow was started by the owner even though
// the Strict session cookie is not sent on the cross-site redirect back. The
// app credentials are read from the owner settings with the Worker env as the
// fallback, so the owner can paste them without a deploy.
import type { APIRoute } from "astro";
import { authorize } from "../../../../modules/CB-M05/p1-production/owner-auth.mjs";
import { getSetting } from "../../../../modules/CB-M05/p1-production/settings.mjs";
import {
  buildAuthorizeUrl, IG_COOKIE_MAX_AGE, IG_COOKIE_PATH, IG_STATE_COOKIE,
} from "../../../../modules/CB-M07/instagram-oauth.mjs";
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
    return new Response("Instagram OAuth is not configured on this deployment.", { status: 503, headers: NO_STORE });
  }
  const appId = await getSetting({ db, secret, env: { META_APP_ID: runtimeEnv("META_APP_ID") }, key: "META_APP_ID" });
  if (typeof appId !== "string" || appId === "") {
    return new Response("Instagram OAuth is not configured on this deployment.", { status: 503, headers: NO_STORE });
  }
  const session = await authorize(request, { db, secret, now: Math.floor(Date.now() / 1000) });
  if (session === null) return new Response("Not found", { status: 404, headers: NO_STORE });
  const state = randomToken();
  if (!(await createOauthState({ db, state, nowMs: Date.now() }))) {
    return new Response("Owner storage is not ready for OAuth.", { status: 503, headers: NO_STORE });
  }
  cookies.set(IG_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: IG_COOKIE_PATH,
    maxAge: IG_COOKIE_MAX_AGE,
  });
  const redirectUri = new URL("/api/oauth/instagram/callback", url.origin).toString();
  return redirect(buildAuthorizeUrl({ appId, redirectUri, state }), 302);
};
