// CB-M07-P1-SOCIAL-OAUTH-001: finish the Instagram flow and store the Page token.
//
// The long-lived Page token is encrypted inside this request and never logged
// or rendered. The one-use state digest binds the callback to an owner-initiated
// start.
import type { APIRoute } from "astro";
import { getSetting } from "../../../../modules/CB-M05/p1-production/settings.mjs";
import {
  exchangeCode, fetchAccount, IG_COOKIE_PATH, IG_STATE_COOKIE, readCallback,
} from "../../../../modules/CB-M07/instagram-oauth.mjs";
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
  const env = { META_APP_ID: runtimeEnv("META_APP_ID"), META_APP_SECRET: runtimeEnv("META_APP_SECRET") };
  const readable = typeof db === "object" && db !== null && isVaultSecret(secret);
  const appId = readable ? await getSetting({ db, secret, env, key: "META_APP_ID" }) : undefined;
  const appSecret = readable ? await getSetting({ db, secret, env, key: "META_APP_SECRET" }) : undefined;
  if (typeof appId !== "string" || typeof appSecret !== "string" || ownerEnabled !== "true") {
    return oauthNotConfigured("Instagram", "Meta app credentials");
  }
  if (db === undefined || db === null || !isVaultSecret(secret)) return oauthStorageUnavailable();
  const params = readCallback(url.searchParams);
  const state = cookies.get(IG_STATE_COOKIE)?.value ?? "";
  cookies.delete(IG_STATE_COOKIE, { path: IG_COOKIE_PATH });
  if (params.error !== null) return oauthCancelled("Meta", params.error);
  if (params.code === null || params.state === null || state === "" || params.state !== state) {
    return oauthInvalidState("The authorization state did not match this browser. Start the connection again.");
  }
  if (!(await consumeOauthState({ db, state: params.state, nowMs: Date.now() }))) {
    return oauthInvalidState("This authorization state was already used or expired. Start again from the owner workspace.");
  }
  try {
    const redirectUri = new URL("/api/oauth/instagram/callback", url.origin).toString();
    const token = await exchangeCode({ appId, appSecret, code: params.code, redirectUri });
    const account = await fetchAccount({ accessToken: token.accessToken });
    const stored = await storeSocialAccount({
      db, secret, provider: "instagram",
      account: { id: account.id, username: account.username, name: account.name },
      token: { accessToken: account.pageToken, scope: token.scope, expiresIn: null },
      nowMs: Date.now(),
    });
    if (stored.status !== "stored") return oauthStoreFailed();
    return oauthConnected("Instagram", {
      username: account.username, name: account.name,
      note: "The Page token is stored encrypted. Posts are published only from the reviewed plan "
        + "on the social page.",
    });
  } catch {
    return oauthPage(502, "Connection failed",
      "<p>Meta did not complete the token exchange or returned no professional account. No token was stored.</p>");
  }
};
