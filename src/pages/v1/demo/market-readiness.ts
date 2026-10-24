import type { APIRoute } from "astro";
import { buildDemoMarketReadiness } from "../../../modules/CB-M11/demo-market-readiness.mjs";

export const prerender = false;

// No shared mutable transport state, CORS opt-in, credential or user identity.
function jsonResponse(payload: unknown, status: number, denyMethod = false) {
  const safeHeaders = new Headers();
  safeHeaders.set("Content-Type", "application/json; charset=utf-8");
  safeHeaders.set("Cache-Control", "no-store");
  safeHeaders.set("X-Content-Type-Options", "nosniff");
  safeHeaders.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (denyMethod) safeHeaders.set("Allow", "GET");
  return new Response(JSON.stringify(payload), { status, headers: safeHeaders });
}

function emptyMarketResponse(code: "BAD_REQUEST" | "METHOD_NOT_ALLOWED" | "UNAVAILABLE") {
  return { status: code, mode: "SYNTHETIC", live: false,
    redistributable: false, items: [] };
}

export const GET: APIRoute = ({ request }) => {
  try {
    // No asset selection, price filters, pagination or other query extensions.
    const incoming = new URL(request.url);
    if (incoming.searchParams.size !== 0) {
      return jsonResponse(emptyMarketResponse("BAD_REQUEST"), 400);
    }
  } catch {
    return jsonResponse(emptyMarketResponse("BAD_REQUEST"), 400);
  }
  const payload = buildDemoMarketReadiness();
  return jsonResponse(payload, payload.status === "BLOCKED_DEMO" ? 200 : 503);
};

export const ALL: APIRoute = () =>
  jsonResponse(emptyMarketResponse("METHOD_NOT_ALLOWED"), 405, true);
