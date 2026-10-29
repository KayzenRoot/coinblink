# Mobile and documentation audit · 2026-10-29

Scope: every shipped HTML surface at mobile widths, and every local link in the
documentation set.

## Mobile surfaces

All 35 surfaces from the shared sweep were loaded at **320×800** and
**390×844** and checked for:

- HTTP 200 and the expected `lang`;
- `documentElement.scrollWidth` not exceeding the viewport;
- Axe WCAG 2.0/2.1 A and AA violations.

**Findings: none.** No horizontal overflow and no axe violations at either
width. The dense pages (live filters, publisher tables, demo labs, editorial
shells) already reflow or scroll inside their own containers.

The 390px pass is now part of `e2e/site-surfaces.spec.mjs`, so the result is a
regression guard rather than a one-off measurement. The desktop pass remains
unchanged; the mobile test adds about 80 seconds to the surfaces job.

## Documentation links

A scan of 100 Markdown files (README plus `docs/**`) found **18 broken local
links**:

- 17 roadmap links to `.engineering/planned-work-orders/CB-Mxx.md`. Those work
  orders live on the planning branch `docs/cb-plan-001-modular-product-roadmap`,
  not on `main`. The roadmap now links to the branch blobs, matching how the
  module issues already reference them, and its text says the contracts live on
  the planning branch.
- 1 design README link to `docs/source-pack/README.md`, an index that was never
  imported. It now points to the existing
  `assets/reference/reference-manifest.json`, which is the authoritative asset
  status.

After the fix the scan reports **0 missing**. `test/automation/docs-links.test.mjs`
now performs the same scan in the always-on quality job: it walks the docs,
ignores external/mailto/anchor targets, resolves relative paths and fails on any
missing file. It also asserts the scan covered at least 80 files, so a broken
walker cannot pass silently.

## Verification

- `node --test test/automation/docs-links.test.mjs` — pass, 0 missing.
- `playwright test e2e/site-surfaces.spec.mjs` — 5/5 pass, desktop and mobile.
- Lint clean, typecheck 0 errors, build clean.

## Residual notes

External links in the documentation are not fetched by the test; that would add
network dependence and third-party traffic. Only local paths are verified.
