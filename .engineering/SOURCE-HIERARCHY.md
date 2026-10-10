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
- If current GEF doctor reports absent `.engineering/CHECKPOINT.json`, do not fake a healthy production checkpoint to silence it. Once the bounded source authority is approved, a conservative initial checkpoint may be proposed from verified facts and must pass the pinned GEF observer before it can become canonical by merge.
- The M00-only source pack is Owner-approved at PR #30; that approval is bounded to M00 and does not freeze global Issue #6. CB-GOV-004 established the initial GEF checkpoint at `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`. CB-GOV-005 / PR #32 merged at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`, admitting M00 and `CB-M00-WO-001`. That admission-base checkpoint recorded `IMPLEMENTATION_NOT_STARTED`, 0%, and no `stopState`. PR #33 later merged the local P0 foundation at `b40a6467b1b143cc28a6e9969fddaefd0ebc438b`; the checkpoint on that exact main still contained the pre-P0 snapshot. CB-GOV-006 proposes the truthful promotion to `IMPLEMENTATION_IN_PROGRESS` / `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, retaining 0%, `NOT_DEPLOYED`, admission provenance, and module boundaries. The candidate promotion is not canonical until its authorized PR merge. P1 remains gated on provider authorization and verified preview evidence. Issue #6 remains open and no other module is admitted.
- GEF CLI 1.1.2 `doctor`/`status` are read-only checkpoint observers. Their project checkpoint projection is schema v2; the separate `packages/checkpoint-engine` continuation capsule is schema v1 for M17 continuity and is not the project checkpoint or an admission mechanism.
- A GitHub comment that mentions `@codex` is not proof that Codex Cloud accepted a coding task; confirm provider execution and evidence.

**As of October 9 2026:** CB-PLAN-001 merged in PR #24 at `a783a90c87b212123aeb23ce57036424e87d233c`; CB-DESIGN-002 merged in PR #28 at `72302dd2ada7be5be7a8b43c558c2a3a799a4240` and its v2 page designs remain drafts; the bounded M00-only source pack merged in PR #30; CB-GOV-004 / PR #31 established the initial checkpoint at `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`, and CB-GOV-005 / PR #32 admitted M00 at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`. PR #33 merged the local CB-M00-WO-001 P0 foundation at `b40a6467b1b143cc28a6e9969fddaefd0ebc438b`. Its canonical checkpoint still has the pre-P0 snapshot until the separate CB-GOV-006 promotion is authorized and merged; this candidate records the proposed current values while leaving overall progress at 0%. Issue #6 remains OPEN for global product Scope/Architecture/DoD. M01-M18 remain unadmitted, the original Golden JPEG bytes remain absent from Git, and no Cloudflare preview is deployed.

**Historical pre-admission state:** before CB-GOV-005 merged, `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f` recorded `M00_NOT_ADMITTED`, 0% application progress, and no active Work Order. The PR #32 merge at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` made its post-merge checkpoint effective: `M00_ADMITTED`, implementation `NOT_STARTED`, 0%, no pending `stopState`, and `CB-M00-WO-001` active. The prior candidate branch remained unauthorized until that merge.

## 2026-10-08 draft design/source extension

Frozen v1.0 Golden Home and original logo remain above all new v2 page sketches in visual authority. Draft v2 visual docs, page coverage matrix, settings/security and media engine proposals merged under docs/design/ in PR #28; they are **not approved screenshots, product Scope/DoD or code instructions**. CB-M17 and CB-M18 remain NOT ADMITTED. One Owner V1 security directive supersedes any proposed multi-human admin RBAC found in earlier planning docs. Root encryption/bootstrap material is never saved in ordinary site Settings DB.

## Proposed review-policy clarification · CB-GOV-SOLO-001

**Status: PROPOSED / OWNER-DIRECTED / NOT EFFECTIVE UNTIL AUTHORIZED MERGE.** This addendum is part of the candidate governance PR #46. It has no effect on this branch and becomes prospective policy only when the ADR-CB-0003, this clarification, and its append-only Decisions Ledger record pass their ELEVATED review and are merged together through the normal GitHub process. Until then, existing review requirements remain in force.

If adopted, LOW/STANDARD work still requires an objective technical audit by a reviewer other than the implementation executor, exact-HEAD required checks, traceable evidence, closed findings, and a separate Owner go/no-go tied to the exact HEAD. This clarifies only the acceptance record where a distinct-human GitHub APPROVE is unavailable and no GitHub-enforced rule requires one. An Owner-authored COMMENTED review remains NOT_INDEPENDENT_GITHUB_APPROVE; do not mislabel it, change identities, bypass branch protection, or ignore any GitHub-required review or status.

This exception does not apply to ELEVATED or HIGH_ASSURANCE work, including governance-rule changes, money or billing, Web3/signing, privileged authentication, irreversible changes, production/provider mutations, or critical security. Those require qualified independent assurance, stronger proof, and any separate Owner/provider authorization. If risk is ambiguous, use the stricter class. GEF and other higher-priority authority prevail; this clarification does not change Scope, DoD, checkpoint, module admission, provider approval, or deployment authority.

The 2026-10-09 status paragraphs above and dated status narratives in other documents are historical snapshots. For current state, the actual live GitHub state and promoted checkpoint control according to authority items 1 and 2; do not read a stale narrative as a current admission, review, or deployment fact. A rejection or changed source requires a corrected proposal, refreshed Context Lock/evidence, and a new exact-HEAD audit; there is no automatic or retroactive acceptance.

