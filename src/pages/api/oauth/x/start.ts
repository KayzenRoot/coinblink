// CB-M07-P1-TOKEN-CUSTODY-001: begin the owner-initiated X OAuth flow.
//
// The start requires the owner session and records a one-use state digest in
// D1, so the callback can prove the flow was started by the owner even though
// the Strict session cookie is not sent on the cross-site redirect back.
import type { APIRoute } from "astro";
import { authorize } from "../../../../modules/CB-M05/p1-production/owner-auth.mjs";
import {
  buildAuthorizeUrl, createPkcePair, randomToken,
  X_COOKIE_MAX_AGE, X_COOKIE_PATH, X_STATE_COOKIE, X_VERIFIER_COOKIE,
} from "../../../../modules/CB-M07/x-oauth.mjs";
import { createOauthState } from "../../../../modules/CB-M07/token-vault.mjs";
import { runtimeBinding, runtimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;

const NO_STORE = Object.freeze({
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
});

export const GET: APIRoute = async ({ cookies, redirect, request, url }) => {
  const clientId = runtimeEnv("X_CLIENT_ID");
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  const ownerEnabled = runtimeEnv("M05_OWNER_ENABLED");
  if (clientId === undefined || db === undefined || db === null || typeof secret !== "string"
    || ownerEnabled !== "true") {
    return new Response("X OAuth is not configured on this deployment.", { status: 503, headers: NO_STORE });
  }
  const session = await authorize(request, { db, secret, now: Math.floor(Date.now() / 1000) });
  if (session === null) return new Response("Not found", { status: 404, headers: NO_STORE });
  const { verifier, challenge } = await createPkcePair();
  const state = randomToken();
  if (!(await createOauthState({ db, state, nowMs: Date.now() }))) {
    return new Response("Owner storage is not ready for OAuth.", { status: 503, headers: NO_STORE });
  }
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: X_COOKIE_PATH,
    maxAge: X_COOKIE_MAX_AGE,
  };
  cookies.set(X_STATE_COOKIE, state, options);
  cookies.set(X_VERIFIER_COOKIE, verifier, options);
  const redirectUri = new URL("/api/oauth/x/callback", url.origin).toString();
  return redirect(buildAuthorizeUrl({ clientId, redirectUri, state, challenge }), 302);
};
