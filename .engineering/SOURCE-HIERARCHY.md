# CoinBlink · GEF Source Hierarchy and Decision Authority

## Owner-approved M00 Free-only cost interpretation · 2026-10-10

**CURRENT OWNER DIRECTIVE (Issue #36 comment 6099048180):** Continue CoinBlink M00 on Cloudflare **Workers Free now**, leave the **US$10 informational budget alert** as configured, and **do not require an enforced hard US$0 monthly account-wide spending cap** as a prerequisite for Free-only development. The Owner will explicitly decide on credits or Paid only when Free is no longer sufficient. No paid upgrade or purchase is authorized today. This **supersedes previous hard-cap interpretations for M00**, while preserving authorization/least-privilege IAM, secrets, no-paid-bindings and no-production Worker security, exact-SHA Preview evidence, actual live Worker binding inventory review, visual acceptance and checkpoint governance.

The Free-only Owner directive is effective as an operational authorization immediately. This source clarification is proposed in its own traceable governance PR and does **not** promote `.engineering/CHECKPOINT.json`, M00 completion, global Issue #6 or M01+ code admissions. See `.engineering/evidence/CB-M00-WO-001-FREE-OWNER-DECISION.md`.

## Current operational status · 2026-10-10

The manual, protected Preview workflow [#38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879) succeeded for canonical `main` SHA `e8886e21c6f152ca374b1e42852c6b6638543f40`; real stable/immutable URLs and remote browser evidence are in `.engineering/evidence/CB-M00-WO-001-P1-CLOSEOUT.md`. The authenticated read-only dashboard showed Workers Free and USD 0.00 observed for the current cycle. The US$10 budget alert is informational only; an account-wide hard USD 0 ceiling is NOT a current M00 gate under the Owner's Free-only decision above. Live provider binding inventory and final closeout audit remain pending. The canonical GEF checkpoint is deliberately unchanged (`previewDeployment=NOT_DEPLOYED`, implementation P1 pending, overall 0%) until a separately audited checkpoint delta; the operational Preview evidence must not be confused with checkpoint promotion. M00 is not `DONE`; M01–M17 remain unadmitted and M18 remains future/not admitted.

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
- The M00-only source pack is Owner-approved at PR #30; that approval is bounded to M00 and does not freeze global Issue #6. CB-GOV-004 established the initial GEF checkpoint at `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`. CB-GOV-005 / PR #32 merged at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`, admitting M00 and `CB-M00-WO-001`. That admission-base checkpoint recorded `IMPLEMENTATION_NOT_STARTED`, 0%, and no `stopState`. PR #33 later merged the local P0 foundation at `b40a6467b1b143cc28a6e9969fddaefd0ebc438b`; the checkpoint at that historical commit still contained the pre-P0 snapshot. CB-GOV-006 / PR #35 merged at `954b4db2d6dff3798e76fd4d75d6bccaf24b0876`, and its promotion is canonical on current main `e8886e21c6f152ca374b1e42852c6b6638543f40`: `IMPLEMENTATION_IN_PROGRESS` / `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, retaining 0%, `NOT_DEPLOYED`, admission provenance, and module boundaries. P1 closeout remains gated on real provider binding isolation evidence and formal Owner/audit/checkpoint acceptance. The earlier hard-dollar spending-cap gate is superseded by the explicitly approved Workers Free rule. Issue #6 remains open and no other module is admitted.
- GEF CLI 1.1.2 `doctor`/`status` are read-only checkpoint observers. Their project checkpoint projection is schema v2; the separate `packages/checkpoint-engine` continuation capsule is schema v1 for M17 continuity and is not the project checkpoint or an admission mechanism.
- A GitHub comment that mentions `@codex` is not proof that Codex Cloud accepted a coding task; confirm provider execution and evidence.

**Historical status before CB-GOV-006 / PR #35 merged:** CB-PLAN-001 merged in PR #24 at `a783a90c87b212123aeb23ce57036424e87d233c`; CB-DESIGN-002 merged in PR #28 at `72302dd2ada7be5be7a8b43c558c2a3a799a4240` and its v2 page designs remain drafts; the bounded M00-only source pack merged in PR #30; CB-GOV-004 / PR #31 established the initial checkpoint at `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`, and CB-GOV-005 / PR #32 admitted M00 at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`. PR #33 merged the local CB-M00-WO-001 P0 foundation at `b40a6467b1b143cc28a6e9969fddaefd0ebc438b`. At that PR #33 commit the checkpoint still had its pre-P0 snapshot, and the CB-GOV-006 promotion was only proposed. CB-GOV-006 / PR #35 subsequently merged at `954b4db2d6dff3798e76fd4d75d6bccaf24b0876`; current main now records the promoted phase and P0 status while preserving 0%. The protected Preview run `38049696879` is operationally present; it does not promote P1 or authorize production. Issue #6 remains OPEN for global product Scope/Architecture/DoD. M01-M18 remain unadmitted, and the original Golden JPEG bytes remain absent from Git.

**Historical pre-admission state:** before CB-GOV-005 merged, `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f` recorded `M00_NOT_ADMITTED`, 0% application progress, and no active Work Order. The PR #32 merge at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` made its post-merge checkpoint effective: `M00_ADMITTED`, implementation `NOT_STARTED`, 0%, no pending `stopState`, and `CB-M00-WO-001` active. The prior candidate branch remained unauthorized until that merge.

## 2026-10-08 draft design/source extension

Frozen v1.0 Golden Home and original logo remain above all new v2 page sketches in visual authority. Draft v2 visual docs, page coverage matrix, settings/security and media engine proposals merged under docs/design/ in PR #28; they are **not approved screenshots, product Scope/DoD or code instructions**. CB-M17 and CB-M18 remain NOT ADMITTED. One Owner V1 security directive supersedes any proposed multi-human admin RBAC found in earlier planning docs. Root encryption/bootstrap material is never saved in ordinary site Settings DB.

