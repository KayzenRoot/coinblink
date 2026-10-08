# CoinBlink · GEF Source Hierarchy and Decision Authority

## Canonical authority order

1. Actual live GitHub state: branch/base/HEAD, current exact-head CI, artifacts, provider approvals, and verified persisted deployment state.
2. Accepted GEF policies and promoted checkpoints/ADRs; GEF CLI `v1.1.2` official release pinned to source `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.
3. Owner-approved Scope, Requirements, Security and Definition of Done **when promoted**. Until then these are **explicitly absent/draft** and cannot be presumed accepted.
4. Accepted Decisions Ledger entries; every row has explicit USER APPROVED, RECOMMENDED, PROPOSED, PENDING or IMPLEMENTED status.
5. Admitted **active** Work Order plus current verified Context Lock (its SHA and critical file fingerprints), never a candidate draft.
6. Approved visual source: exact owner-provided Golden Home and Logo image bytes and SHA-256, plus frozen 1013-line `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md` as visual contract. **Original JPGs are not yet in Git**; see `assets/reference/reference-manifest.json`.
7. `docs/product/` module blueprints, architecture options, roadmap, command-center, social/API, revenue ideas and `.engineering/planned-work-orders/CB-Mxx.md` are **planning proposals**, NOT executable until separately admitted.
8. `docs/planning/history/PORTAL_CRIPTO_MASTER_IDEIAS_v0.6.md` is complete historical brainstorming, not approved code scope; chat history and other external documents are supporting noncanonical context.

## How to resolve conflicts

- Never treat a suggested stack or an unadmitted planned WO as authorization for code changes.
- Owner-approved dark Golden visuals outrank style suggestions from frameworks, themes or generators. Never substitute remote reference images.
- Product legal/platform policies, license and app account approvals outrank desired convenience (social posting, paid data/API and market facts).
- All meaningful changes have one work order, context lock, exact SHA CI, independent review, checkpoint delta and traceable merge.
- If current GEF doctor reports absent `.engineering/CHECKPOINT.json`, do not fake a healthy production checkpoint to silence it; resolve approved Source Pack first.
- A GitHub comment that mentions `@codex` is not proof that Codex Cloud accepted a coding task; confirm provider execution and evidence.

**As of October 8 2026:** bootstrap, original source-document import, CB-PLAN-001 draft module plan and CB-DESIGN-002 draft internal-page Bible are merged. CB-M00 owner-requested implementation start is underway as scoped preflight/PR, not deployed code. Golden JPEG binary import is separate open Issue #5.

## 2026-10-08 draft design/source extension

Frozen v1.0 Golden Home and original logo remain above all new v2 page sketches in visual authority. Draft v2 visual docs, page coverage matrix, settings/security and media engine proposals live under docs/design/; future token research under docs/product/. They are **not approved screenshots, product Scope/DoD or code instructions**. CB-DESIGN-002 Issue #25 is CLOSED as documentation delivered. Current owner-requested bounded implementation candidate is CB-M00-WO-001 on feature branch, subject to GEF preflight and Cloudflare external permission. CB-M17 and CB-M18 remain NOT ADMITTED. One Owner V1 security directive supersedes any proposed multi-human admin RBAC found in earlier planning docs. Root encryption/bootstrap material never saved in ordinary site Settings DB.


## Scoped build authority CB-M00

The owner instructed that implementation begin with preview foundation, not a general release. Review docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md and docs/product/CB-M00-IMPLEMENTATION-SCOPE.md for bounded proposed stack. Treat provider token/Cloudflare account setup and global Scope/Architecture/DoD as still open. Never infer Cloudflare authenticated access solely from GitHub account. GEF Codex-only ADR-0008 is unchanged.
