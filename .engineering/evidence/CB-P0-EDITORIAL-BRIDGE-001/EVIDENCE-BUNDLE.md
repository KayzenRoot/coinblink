# CB-P0-EDITORIAL-BRIDGE-001 Evidence Bundle

## Identity and scope

- Status: `DRAFT_FOR_REVIEW`; all hosted checks passed on implementation HEAD `bee046e4e7aea39dcd7f780ff639860a8e852086`. A later evidence-only commit is being added; hosted checks must be read again on the resulting exact PR HEAD.
- Repository: `KayzenRoot/coinblink`.
- Branch: `feat/cb-p0-editorial-bridge-001`.
- Base `main` SHA verified before publication: `a5ab57ea374ffa91f329c3fd2137020b0a468bc6`.
- Implementation HEAD exercised by local tests and hosted CI: `bee046e4e7aea39dcd7f780ff639860a8e852086`; its product code is unchanged by this evidence refresh. Implementation commits are `7e06685dafe1c39985de37417514c3ad2b32cecc`, `42046a07681536e0229ae8b38572ebf7e9118a02`, and `04a1261bf58f6f53c4b0b4cd0b0b269a8d96e8a4`.
- Runtime: focused implementation validations used Node.js `v22.19.0` and npm `11.17.0`; the later full-suite diagnostic used the available local Node.js `v26.4.0`.
- Data boundary: disposable local Miniflare/workerd D1 and synthetic WebAuthn Owner only. No remote D1, production services, or publishing action was used.

## Delivered behavior

- Extracted the existing CoinBlink Markdown parser/serializer into a shared source module used by the M05 local editor and the M02 manual file importer. Existing M01 preview consumers were migrated to the same module to avoid a second parser.
- Added a same-origin, session-bound, GET-only export for an explicitly requested persisted draft revision. A single D1 read binds the current draft and immutable revision; stale, incompatible, oversized, or malformed requests fail closed and do not mutate D1.
- The attachment includes only canonical editorial fields, a sanitized filename, and unpublished/unverified gates. It excludes authentication/session data and receives `no-store`, `nosniff`, noindex, frame-denial, referrer, and CSP response headers.
- The CMS UI requires an authenticated session, a saved unchanged form, and explicit confirmation. It rejects stale client state, aborts on logout or draft change, and scrubs draft content on session rejection. M02 accepts the download only through a user-selected local file and renders it with text nodes.
- Added test-only local D1/WebAuthn browser coverage. Stabilized fixture seeding without reducing the 2/10/100 concurrent-claim load. Added the semantic `region` role to the existing named local weekly-board region so axe checks on authenticated CMS recovery flows pass.

## Validation results

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | PASS | ESLint completed with zero warnings/errors. |
| `npm run typecheck` | PASS | 0 errors, 0 warnings; 2 existing TypeScript hints remain in untouched M07 test code. |
| `npm run build` | PASS | Astro server build completed; `assert-no-session-binding.mjs` confirmed no session/data/service/production bindings in `dist/server/wrangler.json`. |
| Hosted PR checks at implementation HEAD `bee046e4e7aea39dcd7f780ff639860a8e852086` | PASS, 19/19 | GitHub `gh pr checks` showed all 19 checks passing, including build, focused tests, lint/typecheck, Gitleaks, M01–M05 Chromium, M02/M05/M06/M07 Chromium, PR assurance, Reviewdog, SonarCloud, and Socket. The new evidence-only commit requires a fresh exact-HEAD readback. |
| Focused M02/M05 parser, D1, route, and regression tests | PASS, 45/45 | `node --test` over the two new bridge tests, M02 local article/compare/evidence tests, M05 local preview, and local admin router. Run against the final source content. |
| CMS UI and Chromium recovery checks | PASS, 4/4 | M05 LOCAL CMS tests 08, 09, E1, and E2; E1 axe reported `[]` serious/critical violations. |
| First-Owner concurrency, 2 and 10 contenders | PASS | Exactly one HTTP 201; all remaining claims explicitly denied; no D1 diagnostic failures. |
| First-Owner concurrency, 100 contenders | PASS, 3/3 trials | Each trial produced exactly one HTTP 201 and 99 HTTP 409 denials, with no D1 diagnostic failures; D1 contained one Owner/credential, one consumed ticket/challenge, no session, and unconsumed loser records. |
| Browser bridge acceptance flow | PASS, 1/1 | `M05 saved Owner D1 revision exports locally and is manually imported by the M02 browser preview`; dirty-form refusal, explicit download, manual import, warning states, and logout denial exercised. |
| Full Playwright suite | PARTIAL, 90/91 | The sole failure was an existing M00 Crypto 101 desktop case timing out at 30 seconds. Re-running that case alone passed (1/1). M01/M02/M03/M05 journeys passed in the full run; M02 axe checks passed in both locales. |
| `npm run test:unit` full suite | FAIL, 433/439 on local Node.js `v26.4.0` | Five M01 tests could not load ignored local fixtures under `.engineering/evidence/CB-M01-WO-001/` (four provenance/config contracts and one visual check); these files are not in this branch clone, and were not copied or changed. One pre-existing M05 bootstrap race test with 10 contenders returned 3 HTTP 500 responses during this highly loaded full run. An isolated exact-name rerun passed 1/1 with one HTTP 201 and nine explicit HTTP 409 denials. The same full run passed the separate 100-contender test in all 3 trials and passed the M05 D1/WebAuthn, M02, M03, and bridge-specific tests. This does not make the full suite green; the five absent M01 fixture cases and the intermittent 10-contender failure remain limitations. |
| M01 visual input integrity | PASS, 7/7 | `test/modules/CB-M01/visual-input-state.test.mjs` passed after the M01 client migration was committed. |

## Boundaries and remaining gates

- `CB-M03` files, Work Order/Context Lock, checkpoint, `main`, PR #201, and PR #209 were not modified by this work.
- No merge, deploy, production access, rights clearance, editorial approval, or publication occurred. The exported document remains a working draft; facts and rights remain unverified.
- The full local unit suite is not green for the limitations above. Hosted checks were green at the implementation HEAD; the evidence-only refresh creates a new PR HEAD, so verify its hosted checks before treating the draft as ready for technical review. The PR remains a draft.
