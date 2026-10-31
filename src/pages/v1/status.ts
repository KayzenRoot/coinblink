// CB-M11-P1-API-KEYS-001: metered partner endpoint.
//
// Requires an owner-issued API key and counts every accepted call against the
// plan quota. The payload is content-free collection status plus the caller's
// own metering; no third-party article text is served and the redistribution
// gate stays closed.
import type { APIRoute } from "astro";
import { authenticateApiKey, consumeQuota, readPresentedKey } from "../../modules/CB-M11/api-keys.mjs";
import { buildNewsStatus } from "../../modules/CB-M03/news-status.mjs";
import { readLiveNews } from "../../modules/CB-M03/live-news.mjs";
import { LIVE_NEWS_WINDOW_SECONDS } from "../../modules/CB-M03/rss-sources.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "authorization, x-api-key",
};

function fail(status: number, reason: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ status: "error", reason }), {
    status,
    headers: { ...HEADERS, ...extra },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return fail(503, "NOT_CONFIGURED");
  const auth = await authenticateApiKey({ db, presented: readPresentedKey(request) });
  if (auth.status === "missing") return fail(401, "API_KEY_REQUIRED", { "www-authenticate": "Bearer" });
  if (auth.status === "invalid") return fail(401, "INVALID_API_KEY", { "www-authenticate": "Bearer" });
  if (auth.status === "revoked") return fail(403, "API_KEY_REVOKED");

  const quota = await consumeQuota({ db, keyId: auth.keyId, plan: auth.plan });
  if (!quota.allowed) {
    return fail(429, "QUOTA_EXCEEDED", { "retry-after": String(quota.resetsInSeconds) });
  }

  const collection = buildNewsStatus(
    await readLiveNews({ enabled: import.meta.env.PUBLIC_NEWS_LIVE }),
    { windowSeconds: LIVE_NEWS_WINDOW_SECONDS },
  );
  const body = JSON.stringify({
    status: "ok",
    contract: {
      version: "v1",
      license: "CoinBlink operational metadata; no third-party article content",
      redistribution: false,
      attribution: { required: true, path: "/en/news/sources" },
    },
    plan: auth.plan,
    quota: {
      limit: quota.limit,
      used: quota.used,
      remaining: quota.remaining,
      period: quota.period,
    },
    generatedAt: new Date().toISOString(),
    collection,
  });
  return new Response(body, { status: 200, headers: HEADERS });
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: HEADERS });

export const ALL: APIRoute = () => fail(405, "METHOD_NOT_ALLOWED", { allow: "GET, HEAD, OPTIONS" });
