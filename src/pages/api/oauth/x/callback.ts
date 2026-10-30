// CB-M07-P1-X-OAUTH-001: finish the flow and show the authenticated handle.
//
// The access and refresh tokens are used only inside this request and are not
// stored, logged or rendered. Publishing stays disabled until M05 provides the
// owner storage and authorization layer.
import type { APIRoute } from "astro";
import {
  escapeHtml, exchangeCode, fetchViewer, readCallback,
  X_COOKIE_PATH, X_STATE_COOKIE, X_VERIFIER_COOKIE,
} from "../../../../modules/CB-M07/x-oauth.mjs";
import { runtimeEnv } from "../../../../lib/runtime-env";

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
    + "<p><a href=\"/status\">Service status</a> · <a href=\"/developers\">Developers</a></p>"
    + "</main></body></html>";
  return new Response(html, { status, headers: HEADERS });
}

export const GET: APIRoute = async ({ cookies, url }) => {
  const clientId = runtimeEnv("X_CLIENT_ID");
  const clientSecret = runtimeEnv("X_CLIENT_SECRET");
  if (clientId === undefined || clientSecret === undefined) {
    return page(503, "X OAuth is not configured",
      "<p>This deployment has no X client credentials. Nothing was exchanged.</p>");
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
  try {
    const redirectUri = new URL("/api/oauth/x/callback", url.origin).toString();
    const token = await exchangeCode({ clientId, clientSecret, code: params.code, verifier, redirectUri });
    const viewer = await fetchViewer({ accessToken: token.accessToken });
    const display = viewer.name === "" ? "" : " (" + escapeHtml(viewer.name) + ")";
    return page(200, "X connected",
      "<p>Authenticated as <strong>@" + escapeHtml(viewer.username) + "</strong>" + display + ".</p>"
      + "<p>This verification did not store the access or refresh token. Publishing stays disabled "
      + "until the owner storage and authorization layer exists.</p>");
  } catch {
    return page(502, "Connection failed",
      "<p>X did not complete the token exchange. No token was stored.</p>");
  }
};
