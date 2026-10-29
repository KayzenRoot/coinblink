# CB-M03-P1-SHARED-SNAPSHOT-001 · one collection per data center

Status: implemented. The live reader stores its collected snapshot in the
Cloudflare Cache API, so isolates in the same data center share one collection
instead of each fetching the five feeds.

## Why

The in-process memo bounds egress per isolate, but Cloudflare runs many
isolates. Each cold isolate repeated the same five requests and built its own
collection, which could differ by a few seconds — the coverage page and the
live page could even report different story counts at the same moment. The
Cache API is shared inside a data center and closes both gaps without a new
dependency.

## Contract

`src/modules/CB-M03/shared-snapshot.mjs`:

- `SHARED_SNAPSHOT_KEY` — a synthetic same-origin-style key,
  `https://coinblink.internal/cb-m03/live-snapshot/v1`. Bump the version when
  the collected shape changes.
- `resolveSharedCache(candidate)` — returns the cache only when it exposes
  `match` and `put`; otherwise `null`. Defaults to `globalThis.caches?.default`.
- `readSharedSnapshot(cache, key)` — parses the stored JSON and accepts only a
  `LIVE_HEADLINES` snapshot with `items` and `sources` arrays; the value is
  deep-frozen again so consumers keep the `readLiveNews` contract. Missing,
  corrupted, partial or failing entries return `null`.
- `writeSharedSnapshot(cache, snapshot, ttlSeconds, key)` — stores the snapshot
  with `Content-Type: application/json` and
  `Cache-Control: public, max-age=<window>`. Failures return `false` and never
  propagate.

`readLiveNews` checks its own memory first, then the shared cache. A shared
snapshot is used only while its `collectedAt` is inside the collection window;
the remaining TTL is written into the local memo, so a snapshot read at the
edge of the window cannot be extended. Only a successful `LIVE_HEADLINES`
collection is written; disabled and unavailable results are never shared. A
successful collection is written after the local memo, and the awaited write is
best-effort.

## Boundaries

- The Cache API is scoped to a data center, not the whole edge. A cold data
  center still performs one collection and then shares it locally.
- No user, request, header or query influences the key.
- If the platform cache is absent (Node dev, tests) or throws, behaviour is
  exactly the previous in-process memo.
- Feed conditional-GET state remains per isolate; the shared snapshot avoids
  the request entirely while fresh.

## Verification

`test/modules/CB-M03/shared-snapshot.test.mjs` covers cache detection, the
round trip with frozen output and TTL headers, corrupted and throwing caches,
a second isolate skipping every feed request, an out-of-window snapshot being
ignored, and a disabled reader touching neither cache. The rest of the M03
suite still passes with the shared cache absent.
