# CB-M07-H-LOCAL-001 · Independent synthetic social variants

**Execution basis:** main `aae3533973518e1af846c321a9df89d03a0918f5`; independent branch `feat/m07h-local-editorial-variants-20261020`.
**Class:** NECESSARY for the LOCAL Social Studio iteration. This is not a live channel integration.

## Objective and scope
Provide one explicitly editable in-memory text variant for each X, Instagram and TikTok channel from a signed-in M05 LOCAL D1-listed draft. Each draft/channel choice is isolated. Saving a variant updates only that channel's private visual preview. Reset affects only the selected channel. Refresh, logout, stale session, revoked access or lost authorization scrub the editor and all variants.

## Security contracts
- Pure domain creator delegates draft, source URL, revision and credit verification to existing M07-A/M06 validator.
- Source attribution is re-appended from the authorized draft and cannot be edited away. All rights/source/publication statuses remain **NOT_CLEARED / SOURCE_VERIFICATION_PENDING / DRAFT_ONLY**.
- Plain-text rendering via `textContent` and `textarea.value` only. No `innerHTML`, social provider SDK, network access, external credentials, persistence, timer, upload, job, scheduling or publication.
- Variant editing accepts 8..1600 printable characters, max 2000 for preview (inclusive of attribution), immutable bounded list (60 entries). A draft revision change cannot inherit a prior variant.
- The LOCAL CMS remains gated by the test-passkey session and private D1 listing; this is not production authorization or a claim that source/rights are verified.

## Acceptance evidence to require on exact PR HEAD
- Node unit coverage: independent channels, immutable state, invalid drafts/channels/text, source always included, no private body or secret copied, bounds and revised drafts invalidated.
- Chromium with ephemeral passkey+D1: hidden unauthenticated, explicit save vs typing, per-channel independence, reset, refresh/logout cleaning, negative validation, axe WCAG A/AA, no network egress.
- Build (Ubuntu), SonarCloud PR, Socket PR Alert, and applicable M05/M07 browser checks PASS; independent review; zero unresolved blocking threads.
- Preserve Issue #147: SonarCloud on `main` reports Security Rating D, cause/severity not yet individually identified. Do not claim it fixed or bypass gates; STOP if HIGH/CRITICAL risk is independently confirmed.

## Out of scope
No deploy, real social schedule/post, LIVE news/price, D1 remote, production Owner, token/API credentials, GEF, merge, release, billing or checkpoint promotion. Owner must separately authorize protected squash merge after an exact-head audit.
