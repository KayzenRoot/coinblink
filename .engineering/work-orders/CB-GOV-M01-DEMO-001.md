# CB-GOV-M01-DEMO-001 — Work Order: narrow M01 DEMO integration decision

**Status:** CANDIDATE / ROUTE_B_SELECTED_FOR_PREPARATION / NOT EFFECTIVE AS MERGE AUTHORITY. **Risk:** ELEVATED (public source visibility, rights and integration governance). **Owner:** KayzenRoot. **Base main:** `85ece8e63e56ac8006701eda121f462d901d2d2f`. **Parent:** existing `CB-M01-WO-001`; Issues #8, #60, #72; PR #58. **Decision owner:** KayzenRoot; **governance preparer:** ChatGPT, technical merge executor only after separate GO.

## OWNER SELECTION AND AUTHORITY BOUNDARY

On 2026-10-15 the Owner selected retaining `KayzenRoot/coinblink` **PUBLIC** and preparing a source-only M01 DEMO integration into protected `main` without deployment, with rights and gates preserved. Selection **does not** grant `authorizedToMerge=true`, waive Issue #72, change commercial publication flags, or authorize public site deployment. This Work Order is for preparing that conditional integration decision, not for executing the product merge. Route B selection is pinned in the proposal and will be copied to Issues #60/#72.

## OBJECTIVE
Prepare the *smallest safe decision* that permits accelerating CoinBlink M01 DEMO integration **after** selecting a truthfully private staging destination or consciously approving a public-code integration. Disambiguate repository visibility from deployment exposure. Preserve the approved Golden visual, all mandatory exact-head checks, security, rights and checkpoint authority.

## CONTEXT / SOURCE CHECK
R36 synchronized PR #58 without product-path changes. PR #58 head `c7c8ee2239d3e4468d80f06efe345b2849a20ede`, base `85ece8e63e56ac8006701eda121f462d901d2d2f`, six hosted checks PASS and CodeRabbit status skipped. Latest prior review https://github.com/KayzenRoot/coinblink/pull/58#pullrequestreview-5533812621. Repo public: `visibility=public` / `private=false` verified from GitHub API. Issue #72 still `PENDING_OWNER_OR_LEGAL` and `authorizedToMerge=false`. `.engineering/CHECKPOINT.json`: M00 COMPLETE, 5%, M01 ADMITTED not DONE. GEF Fast Lane #78 merged but does not override gates.

## SCOPE
- Record visibility fact, three decision routes and precise prerequisites.
- Prepare docs-only proposal / Work Order / Context Lock in one draft PR on branch `governance/cb-gov-m01-demo-001-visibility-decision`.
- Draw the distinction between code exposure in a public repository and deploying a public website.
- Require SHA-scoped final approval **separate from** a policy/decision PR; no automatic merge.
- Define minimal technical assurance checklist and staged next increment per chosen option.

## OUT OF SCOPE
No changes to PR #58, #59, #77, #79, app routes, assets, source bytes, tests, workflows, repo visibility, Github ruleset, GEF CLI, Cloudflare, secrets, GitHub environments, live sources, checkpoint, releases, brand rights or actual code merge. No new private repository creation or copying code without explicit authorization. No inferred intellectual-property waiver.

## FILES / SOURCES TO READ
`AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, `.engineering/CHECKPOINT.json`, `.engineering/SCOPE.md`, `.engineering/DEFINITION-OF-DONE.md`, `.engineering/ARCHITECTURE.md`, `docs/DECISIONS_LEDGER.md`, `.engineering/work-orders/CB-M01-WO-001.md`, `.engineering/proposals/CB-GOV-FAST-001-RISK-BASED-FAST-LANE.md`, `.github/workflows/gef-validation.yml`, `.github/workflows/cloudflare-worker-preview.yml`; live repo visibility; Issues #60/#72; PR #58 exact HEAD.

## REQUIREMENTS
1. Document actual GitHub repo visibility and caveat that past public Git objects may persist outside GitHub control.
2. Preserve the three recorded alternatives, but mark **public source-only integration (Route B)** as Owner-selected **for preparation**; require exact-SHA later integration GO and asset-level rights resolution before any merge.
3. Preserve no deployment, no production credentials, no LIVE claims, no commercial rights, no checkpoint advancement.
4. Keep rights review per asset and stop on HIGH/CRITICAL security defects.
5. Use one consolidated Evidence Bundle and existing CI where source/input SHA identical. Final target commit requires current strict seven contexts and substantive technical audit. CodeRabbit skipped green isn't technical review.
6. Never call a public-branch merge private; never claim privacy for public Worker Preview.

## ARCHITECTURE RULES
Only Integration Steward may change shared files and integrate; merge serially; avoid force-push and history rewriting. Repo contains public Astro DEMO source, currently no privileged P1. `cloudflare-worker-preview.yml` manual dispatch with protected owner environment, but other providers/webhooks remain unverified until preflight. Treat platform visibility as a high-impact fact.

## CONSTRAINTS
Documentation paths only:
`.engineering/proposals/CB-GOV-M01-DEMO-001-VISIBILITY-AND-INTEGRATION.md`,
`.engineering/work-orders/CB-GOV-M01-DEMO-001.md`,
`.engineering/context-locks/CB-GOV-M01-DEMO-001.md`.
Do not edit the canonical Source Pack or checkpoint in this proposal. Code and draft reviews in English; reviewer summary in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
- Live public/private fact verified twice (GitHub repository metadata).
- Verified SHA pointers, Source Lock, proposed write allowlist and no forbidden changes.
- Risks of public repository and public preview clearly distinguished.
- Route B explicitly selected for preparation only, with public GitHub code/asset exposure acknowledged; non-deploy gates and exact rights-aware integration conditions documented; alternatives A/C remain informative.
- Work Order and candidate docs PR with no merge, no code changes.
- Protected required checks at docs PR exact HEAD, then a technical review and separate Owner decision before any merge.
- Identified next code step is bounded, actionable and does not change `authorizedToMerge=false` by itself.

## TESTS
GitHub API readbacks; file scope diff review; Markdown links/paths; `git diff --check` when available; existing strict GEF hosted CI on PR. No claims of local code tests in this docs-only increment.

## DELIVERABLES
Three candidate Markdown documents; one draft PR and cross-linked Issue #60 note. Checkpoint Delta: NO_CHANGE. No release or deployment.

## REVIEW FORMAT
Brazilian Portuguese: verdict, exact HEAD/base, changed files, host check statuses, unresolved external gates, recommended A/B/C decision, STOP. Do not represent same-account COMMENT or skipped CodeRabbit as independent GitHub APPROVED.

## STOP CONDITION
Stop at **ROUTE_B_PREPARED__RIGHTS_AND_EXACT_SHA_GO_PENDING** with documentation-only candidate PR open, unmerged. Do not set `authorizedToMerge=true`, merge M01 or the governance PR, create a private repo, change repo visibility, or deploy without separate explicit user decision.
