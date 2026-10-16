# CoinBlink · Global staged V1 baseline

**Status: OWNER_APPROVED_GLOBAL / FROZEN.**

## Current protected-main readback · 2026-10-15

Read-only source readback at protected `main` SHA `58321c21508bd6089de1c1a77c21f93a4f0b856a`: the canonical checkpoint is unchanged at `M00_COMPLETE` / `IMPLEMENTATION_IN_PROGRESS`, `completedThroughModule=CB-M00`, 5%, 19 module identities and `activeWorkOrder=NONE`. M01 and M05 are admitted only within their bounded Work Orders; M01 remains incomplete with PR #58 open. PR #59 has merged at this main SHA and supplies only the M05 P0 static, nonprivileged `MOCK / SECURITY DISABLED` UI. That merge is not the Owner's acceptance of the mock, not M05 completion, and not P1 authorization. M05 privileged auth/session/MFA/recovery/persistence/database/vault work remains not admitted. M02–M04 and M06–M17 remain not admitted; M18 remains future/not admitted. Issue #72 is open, rights remain pending, and commercial publication remains disallowed.

The Owner's sole-administrator directive is effective through merged PR #82: `KayzenRoot` is the sole human administrator and reviewer; a second GitHub approver or external review is not mandatory. Protected pull requests, required automated checks, resolved threads, proportionate security evidence and the Owner's recorded decision on the exact final SHA remain required. This proposed source correction does not itself change canonical policy, admit work, mark modules done, change the checkpoint, clear rights or authorize merge/deploy.
## Historical module-admission readback snapshot · 2026-10-11

**Historical protected-main readback as of 2026-10-11 at 07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c:** Exactly 19 module IDs, M00 COMPLETE / 5% (last completed), M01 ADMITTED within reviewed Golden Home/local-safe scope, and M05 ADMITTED **only P0 static nonprivileged CMS MOCK / SECURITY DISABLED**. M02–M04 and M06–M17 are NOT_ADMITTED; M18 is FUTURE_NOT_ADMITTED. `activeWorkOrder=NONE`; no M01/M05 implementation is DONE. Admission PR #56 merged as `c4ba069f1dfaddc8273001950805e8a18125db66`; PR #57 merged as `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`. The checkpoint's `EFFECTIVE_ONLY_AFTER_OWNER_APPROVED_REVIEWED_MERGE` was a historical condition satisfied by those admission merges, not a completion claim. At that snapshot, implementation PR #58/#59 were OPEN; PR #59 later merged at main `58321c21508bd6089de1c1a77c21f93a4f0b856a`. M05 P1 auth/session/MFA/DB/vault, paid resources, production and additional module code require their own approvals.

**Chronology:** Any older lines below claiming M01–M17 NOT_ADMITTED are dated M00-only or global-staging baseline statements from 2026-10-08/10, preserved as historical evidence. They are **not the current effective module-admission map** and do not override the machine checkpoint. This source clarification does not itself admit new work or change 5%.

## Historical original staged-baseline wording (before M01/M05 admissions)

This status becomes canonical only after a reviewed merge. The Owner instructed Continue immediately after the specific question to approve the first V1 functional milestone: exact Golden Home, a secure one-human-Owner editorial CMS, and one source-backed article journey, with the other planned modules retained. The approval applies to staged scope and fixed safety invariants, not to paid/live provider access or any unselected security implementation. Main base: 842fc5a0e54bdaed37066abd830fd1b346368b2b. M00 is COMPLETE at 5%; M01-M17 NOT_ADMITTED and M18 FUTURE_NOT_ADMITTED. This source pack does not admit a new module.

## Approved staging and product boundary

- First beta: M01 exact Golden Home and logo from original hash-verified JPEGs, M05 one-human-Owner CMS/Settings and the M02/M03 article workflow with real license-backed evidence and explicit publish approval. The article and its source integrations cannot be declared LIVE using fixtures.
- Preserve the existing 19 product module IDs and all previously planned functionality. No feature removal: later module waves add live markets, source connectors, evidence, analytics, social, localization, media, advertising, subscriptions, API, billing and ops. M18 remains FUTURE, not authorized for token issuance.
- M00 foundation remains complete with Docker local and isolated Cloudflare Workers Free Preview. Keep the US$10 alert unchanged; no paid upgrade or production deployment authorization.
- Codex Desktop LOCAL may execute several independently admitted modules concurrently using separate worktrees, agents, Work Orders and PRs, with shared paths owned by the Integration Steward and serial main merges.
- Golden original bytes are required for real M01 visual implementation. M05 P0 may start with clearly mocked non-privileged UI only under its own admitted Work Order; M05 P1 password, MFA, secure recovery and secrets vault require independently approved auth/data/security ADR. No mock UI may be presented as working protected authentication.
- All other module code requires its own admitted Work Order, frozen interface and dependency evidence. Future provider secrets, licensed sources, D1/R2/Queues, paid APIs, messaging, social publication, production release and legal/token functionality require separate review and explicit consent.

## Frozen product invariants

One human Owner, no public admin signup, English canonical plus planned pt-BR/es, licensed factual article sources, Owner editorial publishing approval, no fake live prices or news, unchanged approved Golden identity, accessibility on desktop/mobile, strict secrets redaction, no automatic paid services, GEF/CI/security reviews on exact HEAD.

## Deferred implementation decisions

Database and migration topology, chosen auth/MFA/session provider, separate KEK or scoped vault, live data licensing, analytics legal consent, social provider permissions, production routing, paid plan and monetization are NOT selected by this source freeze. Each remains a module/provider decision with security proof.

## Historical M00-only source boundary, retained below

### CoinBlink · Scoped Implementation Boundary

**Historical M00-only status: OWNER_APPROVED_M00_ONLY / M00_ADMITTED.** This does not mean the entire product Scope is FROZEN. Owner explicitly accepted this bounded source contract on 2026-10-08, PR #30 comment 6067708856; PR #32 admitted M00 at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`. Full product Scope remains open.

## Included in first admitted execution candidate CB-M00-WO-001
- TypeScript/Astro Worker-compatible functional site preview scaffold, intentionally not a finished Golden Home.
- Real `/en`, `/health`, `/preview-status` and branded 404 route, honest "under construction" states, no invented news/quotes.
- Docker Compose on `localhost:3000`, Node 22 engine, reproducible lockfile/environment, basic local verification.
- Tested per-PR deployment design for Cloudflare Workers Previews, trusted source-only pipeline and environment isolation. **Cloudflare account permission gates only remote deployment, NOT local P0 implementation.**
- Playwright screenshots on 1536×864, 768×1024 and 390×844, HTML semantics, keyboard focus, console-error/overflow checks; CI on Linux + Windows plus security scans and exact-HEAD evidence.
- Preserve GEF bootstrap, approved source/brand contracts and pending Golden JPG import. No use of synthetic logo substitute. No irreversible remote costs.

## Excluded from M00
Complete Golden Homepage rendering (M01), public article/CMS/business data, root/admin credential onboarding (M05), social publishing, image inference (M17), paid API billing, revenue network deployment, real market prices, production Cloudflare release, or blockchain/token issuance (M18 indefinite future).

## Scope boundary
Existing module contracts M01–M18 remain PLANNED/NOT_ADMITTED, globally open. Existing planning Issue #6 remains open. Closing M00 scope does not freeze the whole product. If actual GEF v1.1.2 doctor/preflight **requires** global approved product sources even for this slice, report the missing gate rather than silently promoting those broader draft decisions.

## Staged admission
P0 local and CI is independent of Cloudflare account credentials; P1 remote Preview needs separate authorization; P2 exact-head audit, recorded Owner-led review and visual acceptance. The Owner approved this bounded M00 scope in PR #30 comment 6067708856. A protected Git merge makes the approved source pack canonical on `main`; separate GEF `doctor`/checkpoint validation and an evidence-backed Work Order admission gate executable implementation. GEF validation does not grant or revoke the Owner's scope approval.
