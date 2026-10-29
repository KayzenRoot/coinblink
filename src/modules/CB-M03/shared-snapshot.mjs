// CB-M03-P1-SHARED-SNAPSHOT-001: one collection per data center, not per isolate.
//
// Cloudflare gives every isolate its own memory, so the in-process memo alone
// repeats the same five feed requests from each isolate. The Cache API is
// shared inside a data center; this adapter stores the already-frozen snapshot
// and falls back to the previous behaviour when the cache is absent or fails.
export const SHARED_SNAPSHOT_KEY = "https://coinblink.internal/cb-m03/live-snapshot/v2";

function usable(cache) {
  return cache !== null && typeof cache === "object"
    && typeof cache.match === "function" && typeof cache.put === "function";
}

/** The platform cache when it exists and looks usable, otherwise null. */
export function resolveSharedCache(candidate = globalThis.caches?.default) {
  return usable(candidate) ? candidate : null;
}

/** Restore the frozen contract after a JSON round trip. */
function freezeDeep(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(freezeDeep));
  const frozen = {};
  for (const [key, child] of Object.entries(value)) frozen[key] = freezeDeep(child);
  return Object.freeze(frozen);
}

/**
 * Read a snapshot written by another isolate. Anything but a valid live
 * collection is ignored, so a corrupted entry can never masquerade as data.
 * @param {unknown} cache
 * @param {string} [key]
 */
export async function readSharedSnapshot(cache, key = SHARED_SNAPSHOT_KEY) {
  if (!usable(cache)) return null;
  try {
    const response = await cache.match(key);
    if (response === undefined || response === null) return null;
    const parsed = await response.json();
    if (parsed === null || typeof parsed !== "object" || parsed.status !== "LIVE_HEADLINES") return null;
    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.sources)) return null;
    return freezeDeep(parsed);
  } catch {
    return null;
  }
}

/**
 * Store a live collection for the shared window. Failures are swallowed: the
 * reader keeps working from its own memory.
 * @param {unknown} cache
 * @param {unknown} snapshot
 * @param {number} ttlSeconds
 * @param {string} [key]
 */
export async function writeSharedSnapshot(cache, snapshot, ttlSeconds, key = SHARED_SNAPSHOT_KEY) {
  if (!usable(cache) || snapshot === null || typeof snapshot !== "object") return false;
  const maxAge = Number.isSafeInteger(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : 900;
  try {
    await cache.put(key, new Response(JSON.stringify(snapshot), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=" + maxAge,
      },
    }));
    return true;
  } catch {
    return false;
  }
}
