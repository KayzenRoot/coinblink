# CB-CI-QUALITY-001 | Quality and secret-scanning baseline

Status: PROPOSED IN INDEPENDENT PR; NOT MERGED OR PROMOTED.
Baseline Git SHA: `0e981a9fb89d25c763f228b3e3bdb3a5a58d64ad`, tree `f8cab23ab72067ff83f16376af4fbac798631fb3`.
The owner authorized an independent PR, preflight, lint, typecheck, tests, coverage and Gitleaks, but **not** a merge, deploy, paid subscription or checkpoint promotion.

## Scope and source hierarchy

Read `AGENTS.md`, `README.md`, `docs/BUILD_FIRST.md`, `docs/CHAT_WORKFLOW_AND_HANDOFF.md`, relevant architecture and proposed DoD. This is a targeted CI improvement, not a rewrite of the product's build-first rules. Preserve PRs #172–#175 and the protected main required checks: `Build (Ubuntu)`, `SonarCloud Code Analysis`, `Socket Security: Pull Request Alerts`. The Sonar main Security Rating D remains a separate open investigation (#147/#169).

## What this PR does

- Adds a read-only `pull_request` workflow with three separate checks: lint+Astro typecheck, **explicit Node test-file suite (`test/**/*.test.mjs`)** with built-in Node 22 experimental LCOV reporter, and Gitleaks v3 scanning checked-out Git history.
- Produces an LCOV artifact retained for 7 days. Codecov upload is **not** activated until student entitlement, plan limits, privacy and zero paid credit are verified independently. LCOV here only measures code imported/exercised by Node tests; it does not prove browser or Astro template coverage.
- Uses pinned immutable Action commit hashes, `npm ci --ignore-scripts`, read-only `GITHUB_TOKEN` and disabled Gitleaks PR comments/SARIF artifacts to minimize permissions and accidental secret disclosure.
- Runs independently of #173 PR assurance. Both workflows execute untrusted PR code; their green checks are **technical diagnostics, not independent code review**. Never count bots or an owner's alternate account as an independent human review.

## Baseline, acceptance, and stop

Local package installation/build/typecheck were not reproducible in the chat runner because it cannot reach npm/GitHub network. First PR run is the **CI baseline**. Each command must be inspected for its actual conclusion on the exact HEAD; do not assert PASS before observing it. `continue-on-error` on lint/typecheck only lets both run; the final step explicitly **fails** the job if either is not success. Node test failure and Gitleaks findings are not suppressed. For any baseline failure, use a scoped Correction Delta in this PR, separate pre-existing findings, and preserve the three existing gates. Do not promote a new quality job into required branch protection until its baseline is green and review is complete.

Acceptance: diff restricted to the workflow, deterministic contract test, this document and scoped ESLint browser-global classification; all old required checks preserved; actual lint/typecheck/test/coverage/Gitleaks results inspected; no known HIGH/CRITICAL vulnerability waived; findings reviewed and evidence on SHA attached to the PR. Codecov SaaS integration, ruleset edits, unrelated refactors and security issue #147 remediation are out of scope.

Review format: APPROVED / CORRECTION REQUIRED / BLOCKED with baseline/head SHAs, per-check outcomes, coverage artifact, risks, diff and proposed checkpoint delta (not promoted). STOP: no merge, deploy, real accounts, publication, LIVE data, remote D1, GEF, vendor billing or checkpoint promotion.


## Correction Delta 1 (initial CI baseline)

Initial HEAD 7dd53cc1c286de2a9ddaa60a7f92890046145d6c: lint failed with 10 errors (7 pre-existing DOM global classification errors and 3 new regex-spacing errors in this PR), while typecheck passed with zero errors and one deprecation hint. Build, SonarCloud, Socket and Gitleaks were green. Correct the introduced regex formatting and configure browser globals narrowly in eslint.config.mjs, without disabling no-undef. Explicit test glob avoids running helper scripts under test/. Revalidate all CI on the correction HEAD. No merge, deploy, or checkpoint promotion.
