// CB-M11-P1-CONDITIONAL-GET-001: strong ETags and If-None-Match matching.
//
// The hash is deliberately simple and synchronous: it must run inside the
// Worker, be deterministic across runtimes, and change whenever the body does.
export function strongEtag(body) {
  if (typeof body !== "string") throw new TypeError("body must be a string");
  let hash = 0x811c9dc5;
  for (let index = 0; index < body.length; index += 1) {
    hash ^= body.codePointAt(index) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return '"' + hash.toString(16).padStart(8, "0") + "-" + body.length.toString(16) + '"';
}

/** Strong and weak validators match; `*` matches any current representation. */
export function matchesIfNoneMatch(header, etag) {
  if (typeof header !== "string" || typeof etag !== "string" || etag === "") return false;
  for (const candidate of header.split(",")) {
    const value = candidate.trim();
    if (value === "*") return true;
    if (value.replace(/^W\//u, "") === etag) return true;
  }
  return false;
}

/**
 * Build the 200/304 pair both public endpoints share.
 * @param {string} body
 * @param {{headers?: {get: (name: string) => string | null}}} request
 * @param {Record<string, string>} headers
 */
export function conditionalResponse(body, request, headers) {
  if (typeof body !== "string") throw new TypeError("body must be a string");
  const etag = strongEtag(body);
  const validator = request?.headers?.get?.("if-none-match") ?? null;
  if (matchesIfNoneMatch(validator, etag)) {
    return new Response(null, { status: 304, headers: { ...headers, etag } });
  }
  return new Response(body, { status: 200, headers: { ...headers, etag } });
}
