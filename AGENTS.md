# CoinBlink · Agent Operating Contract

GEF Bootstrap v1.1.2 is installed and tested in merged CB-BOOT-001 / PR #2; product modules and Cloudflare previews are NOT yet deployed.

1. Read `.engineering/SOURCE-HIERARCHY.md`, `.engineering/CHECKPOINT.md`, and the admitted Work Order before any change.
2. GEF's [ADR-0008 at the admitted v1.1.2 source commit](https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md) delegates code/tests/CI/migrations to **Codex**. ChatGPT prepares governance, GitHub coordination and owner exact-head audit. Matt Pocock skills are advisory, never above GEF sources.
3. Completed WOs: CB-BOOT-001, CB-DOCS-001, CB-PLAN-001 draft packet PR #24 and CB-DESIGN-002 draft Bible PR #28. Issue #6 remains OPEN for global Scope/Architecture/DoD. Owner asked to START bounded CB-M00; current branch `feat/cb-m00-preview-foundation` includes M00-only ADR/scope and long Codex WO. Implementation requires verified GEF module preflight and an actual Codex run; Cloudflare preview deployment separately requires authorized account. CB-M01..M18 remain NOT ADMITTED, M18 FUTURE.
4. Every Work Order must have stable ID, base HEAD, file fingerprints, tests, Evidence Bundle, owner audit, and checkpoint delta (proposed, not self-promoted).
5. No force push, history rewrite, secret disclosure, speculative completion, or skip of a failing gate.
6. Project language: English canonical; `pt-BR` and `es` secondary. Review and final operator response in Brazilian Portuguese.
7. Future visual implementation must use approved master screenshot and logo as immutable source references. Never replace them with a generic template.
8. Planning is **OPEN**. Proposed modules and tools do not authorize implementation.

**Immediate next step:** CB-M00-WO-001 preflight on branch `feat/cb-m00-preview-foundation`: review accepted source and scoped ADR, GEF governance/cost/account gates, then have CODEX build local Astro shell+Docker+CI; only deploy Cloudflare Preview once scoped account access and policy are proven. Never imply @codex comments alone started an executor.

## Current bounded implementation start · CB-M00

Read `.engineering/work-orders/CB-M00-WO-001.md`, `.engineering/context-locks/CB-M00-WO-001.md` and `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` before coding. First implement genuine local shell using no provider secrets, and only claim LIVE_PREVIEW after actual Cloudflare verified preview URL. Original Golden image bytes still not in Git; no generic generated visual replacements or screenshot-as-webpage. The Owner is the only human admin (M05 later), token M18 FUTURE. Do not self-approve global Product Scope/Architecture/DoD.

