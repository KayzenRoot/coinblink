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

## Approved global requirements for initial milestone

V1-G01: Preserve exactly 19 module identities with M00 COMPLETE/5%, M01/M05 admitted only under separately reviewed bounded contracts (M05 P0 MOCK/SECURITY DISABLED only), M02-M04 and M06-M17 NOT_ADMITTED, and M18 FUTURE_NOT_ADMITTED. Admission is never module completion.
V1-G02: M01 Golden Home and logo must use hash-verified original JPEG bytes; no regenerated substitute and no screenshot-as-functional-HTML.
V1-G03: M05 supports one human Owner, no public privileged enrollment; negative security tests cover login, atomic bootstrap, MFA, recovery, session revocation and owner isolation before a real auth claim.
V1-G04: Provider secrets require a write-only protected vault and external root, never exposed in GET, logs or client bundles; live vault use awaits security/provider authorization.
V1-G05: First completed article must be licensed and source-backed, reviewed and Owner-approved; draft/mock is never counted as published LIVE.
V1-G06: English is canonical; pt-BR and es translations planned with locale/SEO contracts and editorial review.
V1-G07: Keep existing Docker localhost preview and protected Workers Free Preview isolated; require separate approval per Cloudflare run and for paid/production changes.
V1-G08: Parallel Codex Desktop modules require global source/ADR effectivity, individual GEF admission, Work Order, Context Lock, exclusive file ownership, accepted producer contracts and bounded host resources.
V1-G09: Maintain Ubuntu/Windows/GEF, CodeRabbit, SonarCloud, Socket, Docker and Playwright/axe checks, positive and security-negative tests and a recorded Owner-led technical/security review of the exact HEAD; optional external assessment does not become an implicit gate.
V1-G10: Future providers, market data, social posting, ads, paid APIs and token issuance are gated; mocks must be clearly labelled and may not fabricate real-world facts.

Acceptance for the first public functional milestone requires working protected CMS and verified article-to-public-site end-to-end behavior, beyond P0 fixture screens. Each component is implemented only via its own admitted module Work Order.

## Historical M00-only requirements, retained below

### CoinBlink · M00 Requirements and Acceptance Inputs

**Historical M00-only status: OWNER_APPROVED_M00_ONLY / M00_ADMITTED.** Specific to M00 only. PR #32 admitted this bounded Work Order at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`. The full product Requirements for future modules are not yet frozen.

| ID | Requirement | Verification |
|---|---|---|
| M00-R01 | Preserve existing npm GEF 1.1.2, Node engine and CI; do not disable safety gates | `npm ci`, current GEF checks remain green |
| M00-R02 | Functional branded but honest build-preview shell `/en`, no false live site | browser and screenshot test |
| M00-R03 | `/health` JSON and `/preview-status` disclose build SHA/environment, not secrets | contract test, output redaction |
| M00-R04 | Local app available at http://localhost:3000 via Docker Compose | Compose build/HTTP smoke on an isolated CI host; if the local host port is occupied, record the owner and test on a free port without stopping unrelated containers |
| M00-R05 | Browser smoke: desktop 1536×864, tablet 768×1024, mobile 390×844 | Playwright evidence and accessibility checks |
| M00-R06 | Worker Preview config isolated from prod: no D1/KV/R2/Queues/SESSION KV by default | generated Wrangler config contract; do not run a remote deploy dry-run without provider authorization |
| M00-R07 | Astro sessions disabled by `session: false` or **verified** supported equivalent; no accidental `SESSION` KV auto-binding | config test + generated Worker inspect |
| M00-R08 | Cloudflare permission blocks **deployment only**; local P0 may execute without it once GEF admits WO | environment tests and explicit gate state |
| M00-R09 | No production secrets in GH workflows, PR previews, browser/network/log, especially untrusted forks | static/negative checks |
| M00-R10 | Trusted live preview only after owner authorizes scoped Cloudflare access, with stable/immutable URLs and external SHA health verification | real URL evidence, not a hypothetical link |
| M00-R11 | Owner sees actionable screenshots and results before branch merge | owner checkpoint + exact SHA review |
| M00-R12 | No fake Golden visual parity, token issuance, paid provider API, news or market data | source and content checks |

## Non-functional constraints
Readability and contrast, no horizontal scrolling at 390px, reduced-motion behavior, basic screenreader/keyboard semantics, responsive media and source-based English text. Store secrets out of Git and app frontend. Avoid unnecessary external services and keep free/usage costs explicitly visible.

## External prerequisites
For local coding: admitted M00 source pack/WO/context lock and validated Git HEAD. For Cloudflare preview deployment only: scoped Cloudflare account and authorized preview resource/secret setup. For Golden Home M01: original JPG byte import verified against manifest; not a blocker for M00.
