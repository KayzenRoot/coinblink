# CB-M01-WO-001 · isolated visual evidence

## Scope and provenance

- Canonical implementation base: `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`.
- Current Git `HEAD` is still exactly that base; implementation and evidence changes are uncommitted pending Integration Steward review.
- Browser fixture renders the M01 component in isolation. The Integration Steward still owns mounting it at `/en`; this evidence does not claim route integration or M01 completion.
- Golden JPEG source files remain unchanged: Home 1536×864, 532,365 bytes, SHA-256 `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8`, Git blob `4e96bc960eb507c87ec71fc88bc347ccbc64b21f`; logo 1179×1040, 121,728 bytes, SHA-256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`, Git blob `60771965fa0eb3b19fc38db51b36cc295563f6ab`.
- Browser: project Playwright Chromium, launched headlessly by `test/modules/CB-M01/visual-check.mjs`.

## Fresh captures

| Viewport | Image | SHA-256 | Horizontal overflow | Axe within M01 |
| --- | --- | --- | ---: | ---: |
| Desktop 1536×864 | `screenshots/golden-home-desktop.png` | `7e6df8ff376c4a51fb9d6b88fc0b9d53c23ea3c3bacf143a199e456c2919bc4c` | none | 0 violations |
| Tablet 768×1024 | `screenshots/golden-home-tablet.png` | `d0ee32e043f5feef9fa7efb9f277a77a799e12a0756b50d84faa21ba8f0042bb` | none | 0 violations |
| Mobile 390×844 | `screenshots/golden-home-mobile.png` | `fcd3609b3d7cd93e0093a6f77616693d7b57c5ba8dc16b39b53224743fb6418d` | none | 0 violations |

Detailed DOM, Axe, console, request, and screenshot metadata are in `visual-check.json`.

The immutable desktop Golden and the fresh desktop capture were also compared at 1536×864. The 50/50 overlay is `golden-home-desktop-overlay.png` (SHA-256 `0bd7466afed096a4cfe5391c18a2e86be1929eb81d4640b2a376578e1ea0f114`); the 3× contrast absolute-difference visualization is `golden-home-desktop-difference-3x.png` (SHA-256 `da1f60c4d4fe4129a5e666eb738a976ddf986389051e3ba05b71782fd7324bf2`). Raw per-channel mean absolute differences are R 32.0081, G 35.4853, B 24.4279 on the 0–255 scale; this is a visual comparison metric, not an acceptance score. The conspicuous expected differences include unsourced live stories/prices replaced with explicit placeholders and the remaining vertical-fold mismatch.

## Results and limitations

- The M01 component has zero Axe violations in all three viewports. Full-page Axe separately records one inherited moderate `region` finding for `.skip-link`, which is outside the M01 component in the shared `BaseLayout`. The Integration Steward owns that shared markup; it is not suppressed from the evidence and is not changed here.
- No browser console errors, uncaught page errors, or requests outside the local fixture were observed.
- Mobile menu open/expanded state and category filtering were exercised. The search input is intentionally hidden at the mobile breakpoint; search behavior was tested at tablet width, without asserting against an invisible mobile input.
- The tablet header now uses the menu at 768px, so navigation links no longer overlap search controls. The mobile hero illustration was reduced and repositioned so the main actions remain legible.
- The central hero mark is rendered as the Bitcoin `₿` symbol (not a generic T-shaped mark); the final captures below include this correction.
- Residual visual mismatch against the immutable desktop Golden: at 1536×864, the screenshot shows only the beginning of “Latest news” at the fold; the original reference exposes more below-hero content. Desktop vertical spacing has been compressed where practical without changing mobile layout, but this demo is not claimed to be pixel-parity with the Golden.
- Screenshots show the isolated component fixture, not the merged `/en` route, and do not constitute Owner visual acceptance or checkpoint promotion.

## Validation commands

- `node --test test/modules/CB-M01/GoldenHome.contract.test.mjs` — 5/5 passed after adding the Bitcoin glyph regression assertion.
- `node test/modules/CB-M01/visual-check.mjs` — final run after glyph and responsive corrections; 0 M01 Axe violations per viewport, full-page `.skip-link` finding recorded, no overflow/errors/external requests.
- `npm run test:unit` — 125/125 passed after the glyph correction; the run also regenerated the final three screenshots and full-page Axe report.
- `npm run lint`, `npm run typecheck`, `npm run build`, isolated Astro fixture build, and Golden integrity test passed in this worktree. Typecheck reports 52 files, 0 errors/warnings/hints. Build has no `SESSION` binding.
- `gef doctor --target .` and `gef status --target .` completed read-only but are not PASS: this linked worktree reports repository observability `FINDING` / dirtiness `UNKNOWN` (`GIT_DIRECTORY_NOT_A_DIRECTORY`, `WORKING_TREE_NOT_OBSERVED`) and conservative `operator.stale=true`. The Integration Steward will repeat them in a normal clone at the pushed exact SHA.
- Raw read-only GEF outputs are retained in `gef-doctor.json` and `gef-status.json`.
- Exact-head CI, independent review, Owner visual acceptance, `/en` integration, and checkpoint promotion are pending.
