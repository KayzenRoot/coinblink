# Full-suite audit · 2026-10-29

Scope: complete Node test suite on the pinned Node 22.19.0, complete Playwright
suite, lint, typecheck and build. The goal was to find silent test rot and
restore signal, then close the gaps in CI.

## Commands

```bash
npx node@22.19.0 --test --test-concurrency=1      # before the fix
npm run test:unit                                 # after the fix uses a test glob
npx playwright test                               # all 155 browser tests
npm run lint && npm run typecheck && npm run build
```

## Results

| Suite | Result |
| --- | --- |
| Node, before fixes | 719 tests, 706 pass, 13 fail |
| Node, after classification | 2 real issues fixed; 11 host-specific M05 failures |
| Playwright | 155/155 pass, including the new link crawl |
| Lint / typecheck / build | clean |

The 13 failures were:

1. `GoldenHome.contract.test.mjs` — stale assertion (real, fixed).
2. `test/modules/CB-M01/visual-check.mjs` — a helper executed as a test (real, fixed).
3. Eleven M05 local CMS tests — host-specific Miniflare/D1 failures (classified).

## Finding 1 · `test:unit` executed helper modules

`node --test` with no arguments discovers files under `test/`, not only
`*.test.mjs`. It ran `visual-check.mjs`, which expects a different entry point,
failed, and rewrote `.engineering/evidence/CB-M01-WO-001/` screenshots and JSON
as a side effect. The same run also executed `visual-input-state.mjs`,
`visual-request-origin.mjs` and `visual-server.mjs` as if they were tests.

Fix: `"test:unit": "node --test \"test/**/*.test.mjs\""`. Node 22.19 supports
the glob, the helper scripts are excluded, and the evidence bundle is no longer
touched by a unit run. The artifacts produced during this audit were reverted.

## Finding 2 · a contract test was stale and unrun

The trilingual home refactor renamed the client message table from `MESSAGES`
to the key-major `MESSAGE_ROWS`. `GoldenHome.contract.test.mjs` still asserted
the old name, so the full suite failed — but no workflow executed that file.
The comment in `ci-quality.yml` claimed the CB-M01 contract files could not run
because the evidence bundle was removed; the bundle was restored since then.

Fix: the assertion now checks `MESSAGE_ROWS` and `LOCALE_INDEX`, and all four
CB-M01 contract files (`GoldenHome`, `HeroCinematicPreflight`,
`HeroLightningSprites`, `R26StaticAssets`) run in the always-on quality job.
They pass: 39 tests.

## Finding 3 · M05 local CMS fails on this Windows host only

`test/modules/CB-M05/p1c-local-cms.test.mjs` fails 11 of 44 tests locally, in
isolation as well as inside the full run, with `500` responses and
`Not authenticated` assertions across different D1/WebAuthn cases. The same
file passes in the dedicated `m05-local-cms-browser.yml` workflow on Ubuntu with
the same lockfile (the workflow ran on commit `7108687`, the dependency bump).
The failure pattern is environmental: Miniflare/workerd D1 on this Windows host,
not a product regression. No test was weakened. Run this suite in CI or a Linux
container when a local signal is needed.

## Finding 4 · no internal link crawl

Nothing verified that links rendered by the product resolve. Added
`e2e/link-integrity.spec.mjs`: it loads 21 seeded surfaces in all three
locales, collects every same-origin anchor, strips fragments, and asserts each
URL answers below 400. External publisher links are collected but never fetched,
and `/admin` is required to stay unreachable. The crawl found no broken links
and now runs in the `site-surfaces.yml` workflow on every product change.

## Actions

- `package.json`: unit script restricted to `test/**/*.test.mjs`.
- `test/modules/CB-M01/GoldenHome.contract.test.mjs`: current message-table
  assertions.
- `.github/workflows/ci-quality.yml`: the four CB-M01 contracts now run.
- `e2e/link-integrity.spec.mjs` + `.github/workflows/site-surfaces.yml`: link
  crawl on every product change.

## Residual risk

The M05 local CMS suite cannot be exercised on this Windows host. CI remains the
authority for it. Everything else — 719 Node tests except that host-specific
cluster, all 155 browser tests, lint, typecheck and build — is green.
