# CoinBlink · Definition of Done: M00 Preview Foundation

**Status: OWNER_APPROVED_M00_ONLY / M00_ADMITTED; module-specific DoD only.** Not a frozen full-project DoD for modules M01–M18. PR #32 merged at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`; its canonical checkpoint records implementation `NOT_STARTED`, 0%, with no pending `stopState`. This Work Order may implement M00 P0, but it does not mark M00 `DONE`.

## Owner-approved Free-only operational policy · 2026-10-10

**USER APPROVED, effective for operations now:** [Owner decision on Issue #36](https://github.com/KayzenRoot/coinblink/issues/36#issuecomment-6099048180). CoinBlink will **continue on Cloudflare Workers Free**. Keep the existing **US$10 budget alert** unchanged as informational only. A hard monthly **US$0 account-wide spending ceiling is NOT a prerequisite** for this Free-only M00 stage, superseding earlier financial gate statements in this document. Free quotas and currently billed US$0 are observations, not a guarantee against charges for unrelated account services. When Free becomes insufficient, the Owner will decide whether to add credit/enable Paid; **Paid upgrade, purchasing and paid bindings are NOT authorized now**.

Preserve existing protected per-run GitHub Environment Owner approval, Worker-only IAM, secret protection, no paid products/bindings, preview-only isolation, no production deployment and actual live Worker binding inventory verification. The binding inventory is a separate security proof, **not a reason to resurrect the discarded hard-cap gate**. Reuse successful [Preview run #38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879) and merged [P1 Evidence PR #48](https://github.com/KayzenRoot/coinblink/pull/48); do not force an unnecessary repeat deployment. M00 demo-only visual Owner acceptance is now recorded in the current closeout status and does not imply Golden Home parity; independent audit and checkpoint promotion remain separate gates.

**Historical evidence note:** any text below stating a hard effective US$0 ceiling is 'unmet' describes the earlier DoD interpretation and is superseded **only for the spending cap** by this approved update. P1 is **not yet DONE** for the other DoD conditions.

## P1 evidence update · 2026-10-10

Protected Preview run [#38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879) succeeded for exact application SHA `e8886e21c6f152ca374b1e42852c6b6638543f40`; its real URLs, exact-SHA routes/headers, screenshots, keyboard focus and axe results are in `.engineering/evidence/CB-M00-WO-001-P1-CLOSEOUT.md`. The application/build inputs are unchanged through canonical main `bd5eea7da88c83aaa0cf15a64d77c01ed7677738`. Workers Free and the non-gating informational `$10` alert are Owner-approved; current-cycle `$0.00` remains an observation. Authenticated read-only inspection now confirms the dedicated Worker and its sole Preview `ASSETS` binding, zero bindings on the base Worker, and no custom domain/route. The Owner accepted the three screenshots as an M00 technical demo only, with no Golden Home parity claim. Redundant exact-main run [#38068609949](https://github.com/KayzenRoot/coinblink/actions/runs/38068609949) passed preflight, but its protected job was canceled before provider action under the Owner's reuse decision in [Issue #6 comment 6099111571](https://github.com/KayzenRoot/coinblink/issues/6#issuecomment-6099111571); no new deployment occurred. The original checklist below is a historical snapshot where binding and visual acceptance were still pending; those two facts are now verified. The final audit and checkpoint decision remain pending, so M00 is not yet canonically `DONE`.

## Current closeout candidate status · 2026-10-10

The read-only Cloudflare UI showed Workers Free, the sole listed Worker `coinblink-m00-preview`, Preview `coinblink-m00-run-38049696879-1` with exactly one `ASSETS` binding, the base Worker with zero bindings, no custom domains or routes, and `$0.00` observed billable usage for the displayed cycle. This does not claim the account has no other paid products, nor guarantee future account-wide charges; the Owner-approved `$10` alert remains unchanged and informational. The redundant exact-main run #38068609949 completed preflight and was canceled at the protected gate before provider action, following the Owner's direction in Issue #6 comment 6099111571 to reuse #38049696879 because app/build inputs are unchanged. No approval is pending for the canceled run. The canonical checkpoint on `main` is still 0%, P1 pending, and unchanged. A final Checkpoint Delta is proposed separately and does not self-promote. The local Windows Docker preview is served by the project-owned Compose service at `http://localhost:3187`; port 3000 remains reserved by an unrelated container and is not disturbed.

**Historical P0 audit candidate before PR #41 merge:** the local P0 implementation and run `37870422086` passed on audited HEAD `ccbce66b216796012689869b9de17effd2327f5a`. That isolated Docker smoke used port 3000 on Ubuntu. The subsequent CodeRabbit review identified two M00 corrections; each candidate SHA required its own exact-head CI result. The evidence below remains historical; current P1 and checkpoint status is recorded in the dated update above and the live P1 closeout Evidence Bundle.

## Admission gate
- [x] Exact owner approval of this M00-only Scope / Requirements / Architecture / Security / DoD bundle is recorded for initial source HEAD `84f6c02a119259806d230470efc115162d733855` in PR #30 comment `6067708856` (2026-10-08). The separate GEF admission gate was completed in CB-GOV-005 / PR #32.
- [x] CB-GOV-004 checkpoint is canonical on main `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`; its post-merge Ubuntu and Windows GEF validation passed on that SHA. This records verified zero application implementation progress and does not mark a module done.
- [x] CB-GOV-005 / PR #32 merged at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` after exact-head checks, independent review and the Owner's audit of `947cc330e2fb3ba41ee5ff66ff1bd7b980b9e0d0`. The merged checkpoint admits only M00, preserves 0%/`NOT_STARTED`, and has no pending `stopState`. The old PR #29 base is not reusable.

## P0: Working local foundation
- [x] Code authored by Codex on the admitted execution branch; local `npm ci`, Node engine, typecheck, GEF and app build pass. Exact-head GitHub CI remains a separate P2 gate.
- [x] `/en`, `/health`, `/preview-status`, and 404 work with honest demo states and no fabricated content in local Playwright and Docker smoke.
- [ ] Docker Compose default port 3000 remains **BLOCKED locally** by unrelated container `d76127e8ff37` (`nexlabs-website-web-1`). Local smoke used port 3010; do not stop or remove the unrelated container.
- [x] Exact-head run `37870422086` on `ccbce66b216796012689869b9de17effd2327f5a` passed the isolated Ubuntu Docker smoke on port 3000, including health, preview-status, exact build SHA and 404 checks. Any later candidate requires a fresh run.
- [x] Playwright desktop 1536×864, tablet 768×1024 and mobile 390×844 screenshots, keyboard/focus, axe accessibility, overflow and browser-console checks pass locally. Exact-head artifact `coinblink-m00-playwright-37870422086-1` was uploaded; current candidate artifacts are linked from PR #33 checks.
- [x] Astro session auto-KV is disabled and the generated Worker config has no unrequested `SESSION` binding.

## P1: Remote preview (external authorization gate)
- [x] Owner approved the existing Workers Free plan, dedicated Worker, protected GitHub Environment and scoped secrets, as evidenced by successful protected run #38049696879 and Issue #36 decision #6099048180. Hard account-wide USD 0 ceiling is not required; the USD 10 alert remains informational. Any future Paid change requires separate Owner permission.
- [ ] Verified real per-PR Worker Preview stable URL + immutable build URL, /health exact SHA, no production binding access, optional private admin route protected when present.
- [x] Current M00 Preview was deployed only after Owner and protected Environment authorization on Workers Free. New runs still require separate per-run approval and must not use Paid or production resources without explicit Owner permission.

## P2: Review and promotion
Exact-head CI is SHA-specific: run `37870422086` passed on audited candidate `ccbce66b216796012689869b9de17effd2327f5a`; the live PR #33 checks are authoritative for any correction candidate that follows.
- [ ] No unresolved critical/high security or CodeRabbit/Codex independent review items, no fake tests or provider claims.
- [ ] Evidence Bundle shows actual logs, screenshots, URLs, build versions, isolation, local Docker proof, cost/rollback and Owner visual approval.
- [ ] Gate-valid checkpoint delta promoted only after independent audit and merge approval, no force push.

**STOP:** The entire M00 is NOT DONE until real preview evidence exists. Local P0 can be approved as a checkpoint even if Cloudflare permission is pending; that does not bypass governance or imply M00 release completed.
