# CB-GOV-M01-DEMO-001 — Source visibility and DEMO-only integration decision (CANDIDATE)

**State: OWNER_ROUTE_B_SELECTED_FOR_PREPARATION / PROPOSED / NOT EFFECTIVE AS MERGE AUTHORITY.** Owner directed preparation and progress in the conversation following the R36 audit on 2026-10-15. This document does **not** grant `ADMIN_GO_NO_GO=GO` or change any existing prohibition.

## The material fact discovered in R37
Authenticated GitHub REST readback for `KayzenRoot/coinblink` reports **`private=false`, `visibility=public`**, default branch `main`. The PR #58 M01 work is already in branches of that public repository, and source/assets committed to those branches may already be viewed or copied externally. **Merging PR #58 to this `main` is not a private code integration**, regardless of whether a public website is deployed. Making this repository private later would not erase earlier public exposure, forks, cached copies, or prior redistribution.

The verified `main` was `85ece8e63e56ac8006701eda121f462d901d2d2f`. The candidate PR #58 was open, `mergeable_state=clean`, exact `head=c7c8ee2239d3e4468d80f06efe345b2849a20ede`, `base=85ece8e63e56ac8006701eda121f462d901d2d2f`. Its six GitHub hosted checks were all `success`; CodeRabbit context `success` means skipped automatic substantive review. Historic R35 locally evidenced 192 Node / 34 E2E on unchanged M01 product paths; these were not rerun during R36. Its R36 technical delta review: https://github.com/KayzenRoot/coinblink/pull/58#pullrequestreview-5533812621

The existing `.github/workflows/gef-validation.yml` runs checks on PR / push to main with no provider-deploy steps; `.github/workflows/cloudflare-worker-preview.yml` has **only manual `workflow_dispatch`** with explicit protected Owner environment gate. This observation does not rule out external integrations/webhooks or imply permission to deploy.

## Owner choice recorded, 2026-10-15

The Owner explicitly selected **Route B: retain `KayzenRoot/coinblink` as a public repository and prepare an M01 source-only integration into protected `main` without deployment, with rights review and all gates before any merge**. This is an authorization to **prepare**, not `ADMIN_GO_NO_GO=GO`. No actual source merge, commercial publication, asset rights clearance, new service, deployment or checkpoint promotion is authorized by this choice. 

**Selection proof:** Owner instruction in the originating ChatGPT conversation: "Escolho manter CoinBlink público. Prepare o caminho de integração do M01 no main sem deploy, mantendo a revisão de direitos e todos os gates antes do merge." A full exact-SHA merge authorization must be requested separately after checks and rights assessment.

## Decision variants (Route B selected for preparation; A/C retained as alternatives)

### A. Actual private, isolated DEMO staging (recommended if code or assets must remain nonpublic)

Prepare an **explicitly authorized, actually private** destination repository or staging environment. Verify its live visibility using the GitHub API, credential/worker isolation, allowed asset ingress and any fork/mirror relationships **before transferring code**. Prepare a bounded source snapshot without real secrets or forbidden rights-sensitive assets. No automatic migration, visibility change or creation is authorized by this document. Any private-demo runtime must require appropriate access controls; an internet-reachable Worker Preview URL is not inherently private. Revalidate technical tests on the exact transfer target commit.

**Important:** the existing public PR #58 content is already exposed. Creating a private destination does not retrospectively make that source private.

### B. PUBLIC repo / source-only M01 integration into protected `main` — SELECTED FOR PREPARATION ONLY

Requires a **new, explicit Owner decision acknowledging public source and asset exposure**, asset-level legal/rights gate treatment in Issue #72, and a source-backed amendment if accepted frozen Scope/DoD or the existing `authorizedToMerge=false` gate would otherwise prohibit the action. Do not call this a non-public integration. A source merge must not activate the website, distribution, provider feeds, monetization, domains, previews, social publishing or unapproved rights. Existing Github PR+strict 7 checks+review/diff/Owner SHA-scoped GO remain mandatory. No blanket trademark/copyright clearance can be inferred from GitHub visibility or AI output provider terms.

### C. Maintain current public feature branch and defer main integration

Continue within the already admitted M01 WO and safe DEMO testing locally; avoid repetitive QA of unchanged SHAs. Complete the asset-by-asset rights matrix and resolve any HIGH/CRITICAL issues, then return to a fresh Owner merge decision. This is the default while a choice is not made.

## Two separate attestations, no silent escalation

- **Technical candidate readiness:** HEAD/diff, exact-head checks, human-auditable technical review, no open critical flaws, unchanged DEMO-only business semantics. This is currently supported **for the examined R36 delta only**, not a full legal or launch acceptance.
- **Owner release/integration authority:** separate `ADMIN_GO_NO_GO` specifically identifying selected option, exact source SHA, destination repository/branch visibility, actual permitted rights use, `main` SHA, rollback path, non-deploy status and required prerequisites. An approved **governance proposal does not authorize a code merge**.

**Always excluded without separate proof and authorization:** deploy/publish/SEO promotion, real news/prices or feed provider access, commercial use, signing, credentials, new paid Cloudflare product, protected single-Owner CMS P1, global favicon/header replacement, checkpoint promotion, ruleset/GEF CLI modification or pushing to a new destination.

## M01 completion truth table

| State | Claim allowed |
| --- | --- |
| M01 DEMO tests & visuals accepted | `M01_DEMO_READY_FOR_OWNER_ADMIN_DECISION` |
| DEMO code integrated after required scoped GO | `M01_DEMO_CODE_INTEGRATED` only |
| Rights/DoD/P1+P2 gates unresolved | `M01_NOT_FORMALLY_DONE`, `commercialPublicationAllowed=false` |
| All accepted DoD verified, documented, approved and checkpoint merged | Only then `M01_DONE` and recalculated progress |

## Route B execution prerequisites and minimum-change action plan

| Gate | Current state | Required next action |
| --- | --- | --- |
| B-01 Owner's destination choice | **SELECTED_FOR_PREPARATION** | Retain PUBLIC repo, protected `main`, no change to repo visibility; document acknowledgment of public Git history exposure |
| B-02 PR #58 technical delta | **TECHNICAL_DELTA_REVIEW_RECORDED** on `c7c8ee2239d3e4468d80f06efe345b2849a20ede` | Check last HEAD/changed file classes, reconcile all scope/contract DoD acceptance; no rote re-audit for identical unchanged inputs |
| B-03 Exact HEAD CI | **6/6 hosted checks success** at current #58 SHA + CodeRabbit skipped/success | Immediately before any GO, re-read all seven required contexts at the **actual latest SHA**; no false independent review |
| B-04 Asset-level rights, license and trademark | **PENDING_OWNER_OR_LEGAL** (#72) | Present manifest for original JPEG, generated assets, animations, typefaces, logo/brand name and required decisions `CLEARED/REWORK/BLOCKED`; no unsupported waiver from public Git status |
| B-05 Canonical source-policy reconciliation | **NOT EFFECTIVE** | If approved frozen Scope/DoD/rights gate prohibits any merge before rights, prepare *separately reviewed* decision text that preserves law/safety, DEMO labels and distinct publication authority. Do not self-modify #72 gate |
| B-06 No-deploy proof | **GITHUB WORKFLOWS PARTIALLY INSPECTED** | Verify **all** workflow triggers and relevant hosting integrations/webhooks/environments before GO. `gef-validation.yml` currently runs CI on push; Cloudflare Preview requires manual workflow dispatch plus protected Owner approval; external auto-deploy hooks are not yet excluded |
| B-07 Integration Steward | **PENDING_FINAL_GO** | Lock shared ownership, compare final `main` to #58, forbid secret/high-risk code; use normal protected squash only after exact scoped GO |
| B-08 Post-merge readback | **NOT PERFORMED** | If later explicitly authorized, confirm main commit, CI, runtime/non-deploy condition, unchanged release flags and no M01 completion claim |

**Conditional GO format, not yet issued:** `ADMIN_GO_NO_GO=GO_FOR_PUBLIC_REPOSITORY_DEMO_CODE_MERGE_ONLY; PR=58; HEAD=<latest full SHA>; BASE=<latest main SHA>; RIGHTS_GATE_DECISION=<linked approved asset-by-asset decision>; DEPLOY=DENIED; COMMERCIAL_PUBLICATION=DENIED; CHECKPOINT_PROMOTION=DENIED; RULESET_BYPASS=DENIED`. This template is not an authorization and cannot be used to skip rights/DoD.

**Near-term delivery:** (1) register the Owner's Route B selection in this candidate PR and Issues #60/#72, (2) assemble one concise gate status matrix based on existing evidence, (3) obtain real rights dispositions and any necessary source-policy approval, (4) request explicit exact-head GO, (5) only then a protected serial merge and readback. Do not merge #58 or this governance PR automatically.

**STOP:** This is a **proposal only**. With Route B chosen for planning, remain `BLOCKED_RIGHTS_AND_EXACT_SHA_OWNER_GO` **for integration only**, while already admitted safe development may continue.

**Default fields:** `authorizedToMerge=false`, `rightsReview=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, `M01_FORMALLY_COMPLETE=false`, `checkpoint=M00_COMPLETE/5%`.
