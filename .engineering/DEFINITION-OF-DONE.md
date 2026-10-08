# CoinBlink · Definition of Done: M00 Preview Foundation

**Status: OWNER_APPROVED_M00_ONLY / CB-GOV-005_ADMISSION_CANDIDATE; module-specific DoD only.** Not a frozen full-project DoD for modules M01–M18. While PR #32 is open, canonical main remains M00-not-admitted and the candidate grants no code authority. Its checkpoint records the intended post-merge state: M00 admitted, implementation not started, 0%, with no pending stop state.

## Admission gate
- [x] Exact owner approval of this M00-only Scope / Requirements / Architecture / Security / DoD bundle is recorded for initial source HEAD `84f6c02a119259806d230470efc115162d733855` in PR #30 comment `6067708856` (2026-10-08). Full GEF technical gate remains separately pending.
- [x] CB-GOV-004 checkpoint is canonical on main `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`; its post-merge Ubuntu and Windows GEF validation passed on that SHA. This records verified zero application implementation progress and does not mark a module done.
- [ ] CB-GOV-005 admission candidate passes pinned GEF 1.1.2, exact Context Lock, secret scan, Linux/Windows exact-head checks and independent review; the Owner audits and merges that same HEAD. Only the resulting main SHA makes the checkpoint target canonical and admits M00. The open candidate is not executable. The old PR #29 base is not reusable.

## P0: Working local foundation
- [ ] Code authored by Codex on authorized execution branch; npm ci, Node engine, typecheck, GEF and app build all pass.
- [ ] /en, /health, /preview-status, 404 actually work, with honest demo/under-construction states and no fabricated content.
- [ ] Docker Compose localhost:3000 actually builds and serves, or remains explicitly BLOCKED with a testable reason.
- [ ] Playwright desktop 1536×864, tablet 768×1024 and mobile 390×844 screenshots, keyboard/focus and browser-console pass. Capture real artifact names/commit IDs.
- [ ] Astro session auto-KV disabled and generated config has NO unrequested SESSION binding.

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
