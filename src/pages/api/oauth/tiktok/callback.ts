// CB-M07-P1-SOCIAL-OAUTH-001: finish the TikTok flow and store the token pair.
//
// The access and refresh tokens are encrypted inside this request and never
// logged or rendered. The one-use state digest binds the callback to an
// owner-initiated start.
import type { APIRoute } from "astro";
import { getSetting } from "../../../../modules/CB-M05/p1-production/settings.mjs";
import {
  exchangeCode, fetchAccount, readCallback, TT_COOKIE_PATH, TT_STATE_COOKIE,
} from "../../../../modules/CB-M07/tiktok-oauth.mjs";
import {
  oauthCancelled, oauthConnected, oauthInvalidState, oauthNotConfigured, oauthPage,
  oauthStorageUnavailable, oauthStoreFailed,
} from "../../../../modules/CB-M07/oauth-page.mjs";
import { consumeOauthState, isVaultSecret, storeSocialAccount } from "../../../../modules/CB-M07/token-vault.mjs";
import { runtimeBinding, runtimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  const ownerEnabled = runtimeEnv("M05_OWNER_ENABLED");
  const env = { TIKTOK_CLIENT_KEY: runtimeEnv("TIKTOK_CLIENT_KEY"), TIKTOK_CLIENT_SECRET: runtimeEnv("TIKTOK_CLIENT_SECRET") };
  const readable = typeof db === "object" && db !== null && isVaultSecret(secret);
  const clientKey = readable ? await getSetting({ db, secret, env, key: "TIKTOK_CLIENT_KEY" }) : undefined;
  const clientSecret = readable ? await getSetting({ db, secret, env, key: "TIKTOK_CLIENT_SECRET" }) : undefined;
  if (typeof clientKey !== "string" || typeof clientSecret !== "string" || ownerEnabled !== "true") {
    return oauthNotConfigured("TikTok", "TikTok client credentials");
  }
  if (db === undefined || db === null || !isVaultSecret(secret)) return oauthStorageUnavailable();
  const params = readCallback(url.searchParams);
  const state = cookies.get(TT_STATE_COOKIE)?.value ?? "";
  cookies.delete(TT_STATE_COOKIE, { path: TT_COOKIE_PATH });
  if (params.error !== null) return oauthCancelled("TikTok", params.error);
  if (params.code === null || params.state === null || state === "" || params.state !== state) {
    return oauthInvalidState("The authorization state did not match this browser. Start the connection again.");
  }
  if (!(await consumeOauthState({ db, state: params.state, nowMs: Date.now() }))) {
    return oauthInvalidState("This authorization state was already used or expired. Start again from the owner workspace.");
  }
  try {
    const redirectUri = new URL("/api/oauth/tiktok/callback", url.origin).toString();
    const token = await exchangeCode({ clientKey, clientSecret, code: params.code, redirectUri });
    const account = await fetchAccount({ accessToken: token.accessToken, openId: token.openId });
    const stored = await storeSocialAccount({
      db, secret, provider: "tiktok",
      account: { id: account.id, username: account.username, name: account.name },
      token: {
        accessToken: token.accessToken, refreshToken: token.refreshToken,
        scope: token.scope, expiresIn: token.expiresIn,
      },
      nowMs: Date.now(),
    });
    if (stored.status !== "stored") return oauthStoreFailed();
    return oauthConnected("TikTok", {
      username: account.username, name: account.name,
      note: "The tokens are stored encrypted. Posts are published only from the reviewed plan on the "
        + "social page, and an unaudited app publishes as private.",
    });
  } catch {
    return oauthPage(502, "Connection failed",
      "<p>TikTok did not complete the token exchange. No token was stored.</p>");
  }
};
