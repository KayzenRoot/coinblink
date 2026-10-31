// CB-M13-P1-ADS-001: counted click-through.
//
// The placement is counted first and the visitor is sent to the sponsor. A
// paused or out-of-window placement answers 404 instead of redirecting.
import type { APIRoute } from "astro";
import { clickTarget, readPlacement, recordClick } from "../../modules/CB-M13/ads.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return new Response("Not found", { status: 404 });
  const placement = await readPlacement({ db, id: url.searchParams.get("id") ?? "" });
  if (placement === null || placement.status !== "active") return new Response("Not found", { status: 404 });
  const target = clickTarget(placement);
  if (target === null) return new Response("Not found", { status: 404 });
  await recordClick({ db, placementId: placement.id });
  return new Response(null, {
    status: 303,
    headers: { location: target, "cache-control": "no-store", "referrer-policy": "no-referrer" },
  });
};

export const ALL: APIRoute = () => new Response("Method not allowed", { status: 405, headers: { allow: "GET" } });
