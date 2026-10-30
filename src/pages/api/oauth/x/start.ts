// CB-M07-P1-X-OAUTH-001: begin the X OAuth 2.0 authorization-code flow.
import type { APIRoute } from "astro";
import {
  buildAuthorizeUrl, createPkcePair, randomToken,
  X_COOKIE_MAX_AGE, X_COOKIE_PATH, X_STATE_COOKIE, X_VERIFIER_COOKIE,
} from "../../../../modules/CB-M07/x-oauth.mjs";
import { runtimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;

const NO_STORE = Object.freeze({
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
});

export const GET: APIRoute = async ({ cookies, redirect, url }) => {
  const clientId = runtimeEnv("X_CLIENT_ID");
  if (clientId === undefined) {
    return new Response("X OAuth is not configured on this deployment.", { status: 503, headers: NO_STORE });
  }
  const { verifier, challenge } = await createPkcePair();
  const state = randomToken();
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
