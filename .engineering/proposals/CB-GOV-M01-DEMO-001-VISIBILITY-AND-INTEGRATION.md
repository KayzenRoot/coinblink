# CB-GOV-M01-DEMO-001 — Source visibility and DEMO-only integration decision (CANDIDATE)

**State: PROPOSED / NOT ADMITTED AS A MERGE EXCEPTION / NOT EFFECTIVE.** Owner directed preparation and progress in the conversation following the R36 audit on 2026-10-15. This document does **not** grant `ADMIN_GO_NO_GO=GO` or change any existing prohibition.

## The material fact discovered in R37
Authenticated GitHub REST readback for `KayzenRoot/coinblink` reports **`private=false`, `visibility=public`**, default branch `main`. The PR #58 M01 work is already in branches of that public repository, and source/assets committed to those branches may already be viewed or copied externally. **Merging PR #58 to this `main` is not a private code integration**, regardless of whether a public website is deployed. Making this repository private later would not erase earlier public exposure, forks, cached copies, or prior redistribution.

The verified `main` was `85ece8e63e56ac8006701eda121f462d901d2d2f`. The candidate PR #58 was open, `mergeable_state=clean`, exact `head=c7c8ee2239d3e4468d80f06efe345b2849a20ede`, `base=85ece8e63e56ac8006701eda121f462d901d2d2f`. Its six GitHub hosted checks were all `success`; CodeRabbit context `success` means skipped automatic substantive review. Historic R35 locally evidenced 192 Node / 34 E2E on unchanged M01 product paths; these were not rerun during R36. Its R36 technical delta review: https://github.com/KayzenRoot/coinblink/pull/58#pullrequestreview-5533812621

The existing `.github/workflows/gef-validation.yml` runs checks on PR / push to main with no provider-deploy steps; `.github/workflows/cloudflare-worker-preview.yml` has **only manual `workflow_dispatch`** with explicit protected Owner environment gate. This observation does not rule out external integrations/webhooks or imply permission to deploy.

## Decision variants (choose one explicitly before the next integration action)

### A. Actual private, isolated DEMO staging (recommended if code or assets must remain nonpublic)

Prepare an **explicitly authorized, actually private** destination repository or staging environment. Verify its live visibility using the GitHub API, credential/worker isolation, allowed asset ingress and any fork/mirror relationships **before transferring code**. Prepare a bounded source snapshot without real secrets or forbidden rights-sensitive assets. No automatic migration, visibility change or creation is authorized by this document. Any private-demo runtime must require appropriate access controls; an internet-reachable Worker Preview URL is not inherently private. Revalidate technical tests on the exact transfer target commit.

**Important:** the existing public PR #58 content is already exposed. Creating a private destination does not retrospectively make that source private.

### B. Integrate the DEMO code into this public repository's protected `main` (not a private merge)

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

## Next necessary delivery

1. Collect the Owner's explicit selection A, B or C; do not infer it from broad instructions to accelerate.
2. For A, prepare an isolated private staging plan with provider/credential-safe inventory; for B, resolve rights/source policy and prepare explicit public-source decision; for C, prioritize outstanding necessary technical work and evidence.
3. Consolidate a single integration readiness evidence block (no repeated rounds for unchanged paths) and an exact-head GO request; do not merge as part of this documentation PR.

**STOP:** This is a **proposal only**. If option, rights or destination visibility is ambiguous, remain `BLOCKED_OWNER_DECISION` **for integration only**, while already admitted safe development may continue.

**Default fields:** `authorizedToMerge=false`, `rightsReview=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, `M01_FORMALLY_COMPLETE=false`, `checkpoint=M00_COMPLETE/5%`.
