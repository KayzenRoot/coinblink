// CB-M11-P1-API-KEYS-001: metered article metadata for partners.
//
// Only metadata of owner-published articles: id, locale, slug, title, summary,
// tags, timestamps and the canonical URL. The article body is never served, so
// the endpoint cannot redistribute text beyond what the publisher wrote for the
// site itself.
import type { APIRoute } from "astro";
import { authenticateApiKey, consumeQuota, readPresentedKey } from "../../modules/CB-M11/api-keys.mjs";
import { listArticles, validLocale } from "../../modules/CB-M05/p1-production/articles.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

type ArticleRow = {
  id: string; locale: string; slug: string; title: string; summary: string;
  tags: readonly string[]; authorLabel: string; sourceUrl: string;
  publishedAt: number; updatedAt: number;
};

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "authorization, x-api-key",
};

function fail(status: number, reason: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ status: "error", reason }), { status, headers: { ...HEADERS, ...extra } });
}

export const GET: APIRoute = async ({ request, url }) => {
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return fail(503, "NOT_CONFIGURED");
  const auth = await authenticateApiKey({ db, presented: readPresentedKey(request) });
  if (auth.status === "missing") return fail(401, "API_KEY_REQUIRED", { "www-authenticate": "Bearer" });
  if (auth.status === "invalid") return fail(401, "INVALID_API_KEY", { "www-authenticate": "Bearer" });
  if (auth.status === "revoked") return fail(403, "API_KEY_REVOKED");

  const locale = url.searchParams.get("locale");
  if (locale !== null && !validLocale(locale)) return fail(400, "INVALID_LOCALE");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) return fail(400, "INVALID_LIMIT");

  const quota = await consumeQuota({ db, keyId: auth.keyId, plan: auth.plan });
  if (!quota.allowed) return fail(429, "QUOTA_EXCEEDED", { "retry-after": String(quota.resetsInSeconds) });

  const articles = await listArticles({ db, locale: locale ?? null, limit });
  const body = JSON.stringify({
    status: "ok",
    contract: {
      version: "v1",
      license: "CoinBlink original article metadata; the article body is not served",
      redistribution: false,
      attribution: { required: true, path: "/en/news/sources" },
    },
    plan: auth.plan,
    quota: { limit: quota.limit, used: quota.used, remaining: quota.remaining, period: quota.period },
    count: articles.length,
    items: articles.map((article: ArticleRow) => ({
      id: article.id,
      locale: article.locale,
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      tags: article.tags,
      author: article.authorLabel,
      publishedAt: new Date(article.publishedAt * 1000).toISOString(),
      updatedAt: new Date(article.updatedAt * 1000).toISOString(),
      canonical: "/" + article.locale + "/article/" + article.slug,
      sourceUrl: article.sourceUrl,
    })),
  });
  return new Response(body, { status: 200, headers: HEADERS });
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: HEADERS });

export const ALL: APIRoute = () => fail(405, "METHOD_NOT_ALLOWED", { allow: "GET, HEAD, OPTIONS" });
