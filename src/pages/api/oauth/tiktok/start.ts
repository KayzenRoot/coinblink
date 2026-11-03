// CB-M07-P1-SOCIAL-OAUTH-001: begin the owner-initiated TikTok OAuth flow.
//
// The client key comes from the owner settings with the Worker env as the
// fallback, so the owner can paste it without a deploy. The state, cookie and
// session checks live in oauth-start.mjs, shared with every other network.
import type { APIRoute } from "astro";
import { getSetting } from "../../../../modules/CB-M05/p1-production/settings.mjs";
import { buildAuthorizeUrl, TT_COOKIE_PATH, TT_STATE_COOKIE } from "../../../../modules/CB-M07/tiktok-oauth.mjs";
import { startSocialOAuth } from "../../../../modules/CB-M07/oauth-start.mjs";
import { runtimeBinding, runtimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, request, url }) => {
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  const readable = typeof db === "object" && db !== null && typeof secret === "string";
  const clientKey = readable
    ? await getSetting({ db, secret, env: { TIKTOK_CLIENT_KEY: runtimeEnv("TIKTOK_CLIENT_KEY") }, key: "TIKTOK_CLIENT_KEY" })
    : null;
  return startSocialOAuth({
    request, url, cookies, db, secret,
    ownerEnabled: runtimeEnv("M05_OWNER_ENABLED"),
    clientId: typeof clientKey === "string" ? clientKey : null,
    provider: "TikTok",
    missing: "TikTok client credentials",
    cookieName: TT_STATE_COOKIE,
    cookiePath: TT_COOKIE_PATH,
    callbackPath: "/api/oauth/tiktok/callback",
    authorizeUrl: ({ redirectUri, state }) => buildAuthorizeUrl({
      clientKey: String(clientKey), redirectUri, state,
    }),
  });
};
