// CB-M11-P1-OPENAPI-001: shared handler for the public JSON endpoints.
//
// Every real endpoint accepts only GET/HEAD/OPTIONS, rejects query parameters,
// serves a conditional 200/304 and fails closed with a JSON error envelope.
import { conditionalResponse } from "./conditional-get.mjs";

/** The reviewed header set every public JSON endpoint shares. */
export function publicJsonHeaders(cacheControl) {
  return Object.freeze({
    "content-type": "application/json; charset=utf-8",
    "cache-control": cacheControl,
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "x-robots-tag": "noindex",
  });
}

function json(body, status, headers, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, ...extraHeaders } });
}

/**
 * @param {{headers?: Record<string, string>, buildBody?: () => string | Promise<string>}} [options]
 */
export function publicJsonEndpoint(options) {
  const { headers, buildBody } = options ?? {};
  if (typeof buildBody !== "function") throw new TypeError("buildBody must be a function");
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    throw new TypeError("headers are required");
  }
  return Object.freeze({
    GET: async ({ url, request }) => {
      if ([...url.searchParams.keys()].length > 0) {
        return json({ status: "bad_request", reason: "UNSUPPORTED_QUERY" }, 400, headers);
      }
      try {
        return conditionalResponse(await buildBody(), request, headers);
      } catch {
        return json({ status: "unavailable", reason: "INTERNAL" }, 503, headers);
      }
    },
    OPTIONS: () => new Response(null, { status: 204, headers }),
    ALL: ({ request }) => request.method === "HEAD"
      ? new Response(null, { status: 200, headers })
      : json({ status: "method_not_allowed" }, 405, headers, { allow: "GET" }),
  });
}
