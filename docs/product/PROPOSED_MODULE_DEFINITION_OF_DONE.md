# CoinBlink · Product Module DoD Template (PROPOSED)

This is a **future module admission checklist**, not an owner-approved full product Definition of Done. Source: GEF v1.1.2 and the approved delivery style.

## Gate A · Source/Admit
- [ ] Module Mxx exact scope/outputs frozen and approved under recorded owner decision.
- [ ] Prior dependent modules and golden asset rights/bytes exist when relevant.
- [ ] ADRs, nonfunctional budgets, provider licensing and account availability approved.
- [ ] GEF Work Order admitted with exact Git base SHA, locked critical-source fingerprints, security/privacy threats and success metrics.
- [ ] One bounded coherent module; no unrelated broad refactors.

## Gate B · P0 Visible Preview
- [ ] Browser navigable route and owner preview URL attached to PR.
- [ ] 1536×864 and 390×844 screenshots, readiness probe and build commit SHA.
- [ ] Fixture/demo state clearly marked; preview DB and secrets isolated from prod.
- [ ] UI follows approved original Master, with visual overlay when golden images in Git.

## Gate C · P1 Complete Vertical
- [ ] Real working UI operations and backend/API/DB contracts with migration safety.
- [ ] Auth and all role-specific permissions enforced server-side.
- [ ] Data provenance/freshness/license/consent and mock/live status clear.
- [ ] Queue/retry/idempotency, payment/social posting and failure controls implemented as relevant.
- [ ] Owner-facing observability and actionable failure information present.

## Gate D · P2 Quality
- [ ] Unit/integration/contract/E2E tests with provider sandbox negative cases.
- [ ] Deterministic exact-head CI Ubuntu + Windows (where relevant); status checks no fail/pending.
- [ ] Browser console, accessibility/keyboard, responsive and performance target evidence.
- [ ] CI visual screenshots vs golden/expected tolerances and no suppressed high-priority diffs.
- [ ] No high/critical security issues; secrets scanned; usage/billing caps tested.
- [ ] A real live provider credential or paid API approval remains an explicit gate; missing permissions never counted as PASS.

## Gate E · Review / Merge
- [ ] Third-party/independent review on exact head, all actionable findings resolved with evidence.
- [ ] Owner visual/functional checkpoint recorded or narrowly delegated under approved GEF rules.
- [ ] Evidence Bundle includes screenshot, preview URL, SHA, test logs, errors corrected, provider status, cost and risk delta.
- [ ] Checkpoint Delta proposed and approved, no changes to canonical checkpoint until promotion.
- [ ] Squash merge allowed only after all required checks; rollback tested and next legal WO recorded.

## STOP
If any required item remains unsatisfied, mark **CORRECTION REQUIRED** or **BLOCKED** with exact problem and useful partial preview. Do not close a module just because many commits were pushed.
