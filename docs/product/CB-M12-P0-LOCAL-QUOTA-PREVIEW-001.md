# CB-M12-P0-LOCAL-QUOTA-PREVIEW-001 | Offline API allowance simulator

## Narrow 2026-10-25 permission / admission boundary
- The user explicitly authorized a single isolated M12 **LOCAL fictional product increment** with tests-first RED→GREEN, Draft PR, CI security and technical review, **not** Ready, merge, billing, deployment or production.
- Canonical M12 Issue #19 still says PLANNED / NOT ADMITTED for the paid billing/plan/customer platform. This document admits **only a UI-only local demonstration slice**, not that full WO or commercial functionality.
- Frozen baseline main `524a93a970af9cf8cfb411f8ba7aa9f57ca79603`; branch `feat/cb-m12-p0-local-quota-preview-001`; PR #240. 18 existing open PRs checked for exact file collisions: 0.
- Strict scope: 10 paths under M12 module, demo page, test, Playwright, dedicated least-privilege CI, Work Order and Evidence Bundle. No changes to M06/M11, global CSS/routes, package/lock, other PRs, ruleset, main or checkpoint.

## Product acceptance and deterministic contracts
- Display accessible LOCAL SIMULATION of three invented sandbox configurations: sample=5, prototype=10, lab=20 fictional request units. These are not offers, prices, services, entitlements or production quotas.
- Input integer simulated usage 0..20 only; safe limit math `remaining=max(0,limit-used)`; `limitReached=(used>=limit)`. Invalid identifiers, prototypes, nonintegers, negative or out-of-bounds usage fail closed with no preview.
- Pure immutable model and snapshots retain `mode=LOCAL_SYNTHETIC`, `status=SIMULATION_ONLY`, `billingEnabled=false`, `purchaseEnabled=false`, `customerAccount=false`, `price=null`, `live=false`. UI doesn't use real tokens, server state or metering.
- Native select, number input and reset, with keyboard focus, polite announcement, 320/390/768/1366 layout and axe WCAG A/AA. All DOM writes textContent only. Reset/reload returns sample and zero usage.
- No account identifier, email field, checkout, cookie, storage, remote requests, billing provider, payment, purchase, paid API, real data, credentials, `/admin` exposure, fake commercial guarantees, CORS/SEO/CSP relaxation.

## Gates / stop
- Node & Chromium tests are committed before product implementation; hosted RED must be a real missing-source contract failure, not an npm timeout.
- GREEN needs exact-HEAD dedicated Node/Chromium, build, lint/typecheck, Gitleaks, CI baseline, PR Assurance, Reviewdog, SonarCloud and Socket verification; publish Evidence Bundle and revalidate new HEAD.
- Owner-designated `kayzenweb3` may perform technical review `COMMENTED` on exact last commit, never represented as independent human approval. No authorization to approve/merge or deploy from the review.
- **STOP:** DRAFT / NO_READY / NO_MERGE / NO_DEPLOY / NO_LIVE_MONETIZATION / NO_GASTOS. Full M12 remains PLANNED.
