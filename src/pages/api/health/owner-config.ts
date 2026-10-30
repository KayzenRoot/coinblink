import type { APIRoute } from "astro";
import { runtimeBinding, runtimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = () => {
  const db = runtimeBinding("CMS_DB") as { prepare?: unknown } | undefined;
  const owner = runtimeEnv("M05_OWNER_ENABLED");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  return new Response(JSON.stringify({
    dbType: typeof db,
    dbPrepare: typeof db?.prepare,
    ownerType: typeof owner,
    ownerIsTrue: owner === "true",
    ownerLength: owner?.length ?? -1,
    secretLength: secret?.length ?? -1,
    secretHex: /^[0-9a-f]{64}$/u.test(secret ?? ""),
    rpId: runtimeEnv("M05_RP_ID") ?? null,
    origin: runtimeEnv("M05_ORIGIN") ?? null,
  }), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
};
