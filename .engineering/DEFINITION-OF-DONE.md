# CoinBlink · Definition of Done: M00 Preview Foundation

**Status: OWNER_APPROVED_M00_ONLY / M00_ADMITTED; module-specific DoD only.** Not a frozen full-project DoD for modules M01–M18. PR #32 merged at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`; its canonical checkpoint records implementation `NOT_STARTED`, 0%, with no pending `stopState`. This Work Order may implement M00 P0, but it does not mark M00 `DONE`.

**Current candidate:** local P0 implementation and browser/build checks have passed on the execution branch; exact-head GitHub CI, independent review, Owner audit and merge remain pending. The canonical checkpoint JSON is unchanged. Port 3000 is occupied in the local host by an unrelated container; Compose passed at port 3010, and a dedicated CI smoke uses port 3000.

## Admission gate
- [x] Exact owner approval of this M00-only Scope / Requirements / Architecture / Security / DoD bundle is recorded for initial source HEAD `84f6c02a119259806d230470efc115162d733855` in PR #30 comment `6067708856` (2026-10-08). The separate GEF admission gate was completed in CB-GOV-005 / PR #32.
- [x] CB-GOV-004 checkpoint is canonical on main `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`; its post-merge Ubuntu and Windows GEF validation passed on that SHA. This records verified zero application implementation progress and does not mark a module done.
- [x] CB-GOV-005 / PR #32 merged at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` after exact-head checks, independent review and the Owner's audit of `947cc330e2fb3ba41ee5ff66ff1bd7b980b9e0d0`. The merged checkpoint admits only M00, preserves 0%/`NOT_STARTED`, and has no pending `stopState`. The old PR #29 base is not reusable.

## P0: Working local foundation
- [x] Code authored by Codex on the admitted execution branch; local `npm ci`, Node engine, typecheck, GEF and app build pass. Exact-head GitHub CI remains a separate P2 gate.
- [x] `/en`, `/health`, `/preview-status`, and 404 work with honest demo states and no fabricated content in local Playwright and Docker smoke.
- [ ] Docker Compose default port 3000 is **BLOCKED locally** by unrelated container `d76127e8ff37` (`nexlabs-website-web-1`). The same build and health/routes passed on port 3010; do not stop or remove the unrelated container. Dedicated exact-head CI validation on 3000 is pending.
- [x] Playwright desktop 1536×864, tablet 768×1024 and mobile 390×844 screenshots, keyboard/focus, axe accessibility, overflow and browser-console checks pass locally. Exact-head CI artifacts remain pending.
- [x] Astro session auto-KV is disabled and the generated Worker config has no unrequested `SESSION` binding.

## P1: Remote preview (external authorization gate)
- [ ] Owner-scoped Cloudflare account/plan/access/cost gate and trusted GitHub secrets explicitly validated.
- [ ] Verified real per-PR Worker Preview stable URL + immutable build URL, /health exact SHA, no production binding access, optional private admin route protected when present.
- [ ] No preview deployed unless provider authorization/cost gate passed. If missing: `PROVIDER_SETUP_REQUIRED`, never describe as DONE.

## P2: Review and promotion
- [ ] Existing Linux/Windows GEF and relevant new app CI jobs green at exact final SHA.
- [ ] No unresolved critical/high security or CodeRabbit/Codex independent review items, no fake tests or provider claims.
- [ ] Evidence Bundle shows actual logs, screenshots, URLs, build versions, isolation, local Docker proof, cost/rollback and Owner visual approval.
- [ ] Gate-valid checkpoint delta promoted only after independent audit and merge approval, no force push.

**STOP:** The entire M00 is NOT DONE until real preview evidence exists. Local P0 can be approved as a checkpoint even if Cloudflare permission is pending; that does not bypass governance or imply M00 release completed.
