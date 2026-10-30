// CB-M07-P1-TOKEN-CUSTODY-001: finish the flow and store encrypted tokens.
//
// The raw access and refresh tokens are encrypted inside this request and never
// logged or rendered. The one-use state digest binds the callback to an
// owner-initiated start. Publishing remains disabled.
import type { APIRoute } from "astro";
import {
  escapeHtml, exchangeCode, fetchViewer, readCallback,
  X_COOKIE_PATH, X_STATE_COOKIE, X_VERIFIER_COOKIE,
} from "../../../../modules/CB-M07/x-oauth.mjs";
import { consumeOauthState, storeSocialAccount } from "../../../../modules/CB-M07/token-vault.mjs";
import { runtimeBinding, runtimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;

const HEADERS = Object.freeze({
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
});

function page(status: number, title: string, body: string): Response {
  const html = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
    + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
    + "<meta name=\"robots\" content=\"noindex, nofollow\">"
    + "<title>" + escapeHtml(title) + " · CoinBlink</title></head><body><main>"
    + "<h1>" + escapeHtml(title) + "</h1>" + body
    + "<p><a href=\"/admin/social\">Social accounts</a> · <a href=\"/status\">Service status</a></p>"
    + "</main></body></html>";
  return new Response(html, { status, headers: HEADERS });
}

export const GET: APIRoute = async ({ cookies, url }) => {
  const clientId = runtimeEnv("X_CLIENT_ID");
  const clientSecret = runtimeEnv("X_CLIENT_SECRET");
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  const ownerEnabled = runtimeEnv("M05_OWNER_ENABLED");
  if (clientId === undefined || clientSecret === undefined || ownerEnabled !== "true") {
    return page(503, "X OAuth is not configured",
      "<p>This deployment has no X client credentials. Nothing was exchanged.</p>");
  }
  if (db === undefined || db === null || typeof secret !== "string") {
    return page(503, "Owner storage is not configured",
      "<p>The owner vault is unavailable. Nothing was exchanged.</p>");
  }
  const params = readCallback(url.searchParams);
  const state = cookies.get(X_STATE_COOKIE)?.value ?? "";
  const verifier = cookies.get(X_VERIFIER_COOKIE)?.value ?? "";
  cookies.delete(X_STATE_COOKIE, { path: X_COOKIE_PATH });
  cookies.delete(X_VERIFIER_COOKIE, { path: X_COOKIE_PATH });
  if (params.error !== null) {
    return page(400, "Authorization cancelled",
      "<p>X returned <code>" + escapeHtml(params.error) + "</code>. Start the connection again.</p>");
  }
  if (params.code === null || params.state === null || state === "" || verifier === ""
    || params.state !== state) {
    return page(400, "Invalid callback",
      "<p>The authorization state did not match this browser. Start the connection again.</p>");
  }
  if (!(await consumeOauthState({ db, state: params.state, nowMs: Date.now() }))) {
    return page(400, "Invalid callback",
      "<p>This authorization state was already used or expired. Start again from the owner workspace.</p>");
  }
  try {
    const redirectUri = new URL("/api/oauth/x/callback", url.origin).toString();
    const token = await exchangeCode({ clientId, clientSecret, code: params.code, verifier, redirectUri });
    const viewer = await fetchViewer({ accessToken: token.accessToken });
    const stored = await storeSocialAccount({
      db, secret, provider: "x",
      account: { id: viewer.id, username: viewer.username, name: viewer.name },
      token, nowMs: Date.now(),
    });
    if (stored.status !== "stored") {
      return page(502, "Could not store the connection",
        "<p>The account was authorized but the encrypted token could not be stored. Nothing was kept.</p>");
    }
    const display = viewer.name === "" ? "" : " (" + escapeHtml(viewer.name) + ")";
    return page(200, "X connected",
      "<p>Authenticated as <strong>@" + escapeHtml(viewer.username) + "</strong>" + display + ".</p>"
      + "<p>The access and refresh tokens are stored encrypted. Publishing is disabled: "
      + "connecting the account does not post anything.</p>");
  } catch {
    return page(502, "Connection failed",
      "<p>X did not complete the token exchange. No token was stored.</p>");
  }
};
