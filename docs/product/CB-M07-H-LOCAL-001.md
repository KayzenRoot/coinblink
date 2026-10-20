# CB-M07-H-LOCAL-001 · Independent synthetic social variants

**Execution basis:** main `aae3533973518e1af846c321a9df89d03a0918f5`; independent branch `feat/m07h-local-editorial-variants-20261020`.
**Class:** NECESSARY for the LOCAL Social Studio iteration. This is not a live channel integration.

## Objective and scope
Provide one explicitly editable in-memory text variant for each X, Instagram and TikTok channel from a signed-in M05 LOCAL D1-listed draft. Each draft/channel choice is isolated. Saving a variant updates only that channel's private visual preview. Reset affects only the selected channel. Refresh, logout, stale session, revoked access or lost authorization scrub the editor and all variants.

## Security contracts
- Pure domain creator delegates draft, source URL, revision and credit verification to existing M07-A/M06 validator.
- Source attribution is re-appended from the authorized draft and cannot be edited away. All rights/source/publication statuses remain **NOT_CLEARED / SOURCE_VERIFICATION_PENDING / DRAFT_ONLY**.
- Plain-text rendering via `textContent` and `textarea.value` only. No `innerHTML`, social provider SDK, network access, external credentials, persistence, timer, upload, job, scheduling or publication.
- Variant editing accepts 8..1600 printable characters, max 2000 for preview (inclusive of attribution), immutable bounded list (60 entries). Stored entries must themselves be frozen and use one of the approved credit statuses (`CREDIT_MISSING` / `CREDIT_PRESENT_UNVERIFIED`); invalid or mutable carried-over rows are rejected during upsert and selected-row reads. A draft revision change cannot inherit a prior variant.
- The LOCAL CMS remains gated by the test-passkey session and private D1 listing; this is not production authorization or a claim that source/rights are verified.

## Acceptance evidence to require on exact PR HEAD
- Node unit coverage: independent channels, immutable state (including carried-over entries), allowed and rejected credit statuses, invalid drafts/channels/text, source always included, no private body or secret copied, bounds and revised drafts invalidated.
- Chromium with ephemeral passkey+D1: hidden unauthenticated, explicit save vs typing, per-channel independence, reset, refresh/logout cleaning, negative validation, axe WCAG A/AA, no network egress.
- Build (Ubuntu), SonarCloud PR, Socket PR Alert, and applicable M05/M07 browser checks PASS; independent review; zero unresolved blocking threads.
- **Historical security preflight (before the 2026-10-20 resolution):** `main` previously failed SonarCloud with Security Rating D; this was a dated observation, **not** the current state. The SonarCloud issues `python:S2245` and `python:S4790` were subsequently classified `RESOLVED / FALSE-POSITIVE` with contextual justifications. The owner-authorized GitHub Issue [#147](https://github.com/KayzenRoot/coinblink/issues/147) was closed as completed at 2026-10-20 17:19:37 UTC. The verified `main` quality gate became `OK`, Security Rating A (1.0), with [check #118552202578](https://github.com/KayzenRoot/coinblink/runs/118552202578) passing on the pinned main SHA. These findings do **not** resolve the independent SonarCloud new-issue finding on PR #180; that finding must be inspected on its own PR HEAD before merger. Never change or bypass Quality Gates.

## Out of scope
No deploy, real social schedule/post, LIVE news/price, D1 remote, production Owner, token/API credentials, GEF, merge, release, billing or checkpoint promotion. Owner must separately authorize protected squash merge after an exact-head audit.
