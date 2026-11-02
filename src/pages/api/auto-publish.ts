// CB-M08-P1-AUTO-PUBLISH-001: the scheduler entry point.
//
// A scheduled workflow presents AUTO_PUBLISH_TOKEN and gets one tick back. The
// token only opens this path: it cannot read the admin, change settings or
// publish anything the guards refused. The switch (M08_AUTO_PUBLISH) still has
// to be on, so a leaked token alone publishes nothing.
import type { APIRoute } from "astro";
import { autoPublishTick } from "../../modules/CB-M08/auto-publish.mjs";
import { aiProviderFromSettings } from "../../modules/CB-M08/provider-config.mjs";
import { runtimeBinding, runtimeEnv } from "../../lib/runtime-env";
import { sameToken } from "../../modules/CB-M08/token-compare.mjs";

export const prerender = false;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

export const POST: APIRoute = async ({ request }) => {
  const expected = runtimeEnv("AUTO_PUBLISH_TOKEN");
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  if (typeof expected !== "string" || expected.length < 32 || db === undefined || db === null
    || typeof secret !== "string") {
    return reply(503, { status: "unavailable" });
  }
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!sameToken(presented, expected)) return reply(401, { status: "unauthorized" });

  const dryRun = new URL(request.url).searchParams.get("dry") === "1";
  const env = { AI: runtimeBinding("AI"), M08_MODEL: runtimeEnv("M08_MODEL") };
  const result = await autoPublishTick({
    db, secret, env, nowMs: Date.now(),
    ai: env.AI, provider: await aiProviderFromSettings({ db, secret, env }),
    dryRun,
  });
  return reply(200, { status: "ok", result });
};

export const ALL: APIRoute = () => reply(405, { status: "method_not_allowed" });
