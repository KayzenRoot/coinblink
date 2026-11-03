// CB-M07-P1-SOCIAL-OAUTH-001: begin the owner-initiated Instagram OAuth flow.
//
// The app id comes from the owner settings with the Worker env as the fallback,
// so the owner can paste it without a deploy. The state, cookie and session
// checks live in oauth-start.mjs, shared with every other network.
import type { APIRoute } from "astro";
import { getSetting } from "../../../../modules/CB-M05/p1-production/settings.mjs";
import { buildAuthorizeUrl, IG_COOKIE_PATH, IG_STATE_COOKIE } from "../../../../modules/CB-M07/instagram-oauth.mjs";
import { startSocialOAuth } from "../../../../modules/CB-M07/oauth-start.mjs";
import { runtimeBinding, runtimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, request, url }) => {
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  const readable = typeof db === "object" && db !== null && typeof secret === "string";
  const appId = readable
    ? await getSetting({ db, secret, env: { META_APP_ID: runtimeEnv("META_APP_ID") }, key: "META_APP_ID" })
    : null;
  return startSocialOAuth({
    request, url, cookies, db, secret,
    ownerEnabled: runtimeEnv("M05_OWNER_ENABLED"),
    clientId: typeof appId === "string" ? appId : null,
    provider: "Instagram",
    missing: "Meta app credentials",
    cookieName: IG_STATE_COOKIE,
    cookiePath: IG_COOKIE_PATH,
    callbackPath: "/api/oauth/instagram/callback",
    authorizeUrl: ({ redirectUri, state }) => buildAuthorizeUrl({
      appId: String(appId), redirectUri, state,
    }),
  });
};
