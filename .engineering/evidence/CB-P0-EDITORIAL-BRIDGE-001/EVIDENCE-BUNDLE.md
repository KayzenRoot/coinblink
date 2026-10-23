# CB-P0-EDITORIAL-BRIDGE-001 Evidence Bundle

## Identity and scope

- Status: `DRAFT_FOR_REVIEW`; exact-HEAD hosted checks remain pending.
- Repository: `KayzenRoot/coinblink`.
- Branch: `feat/cb-p0-editorial-bridge-001`.
- Base `main` SHA verified before publication: `a5ab57ea374ffa91f329c3fd2137020b0a468bc6`.
- Implementation HEAD tested: `04a1261bf58f6f53c4b0b4cd0b0b269a8d96e8a4`. Its implementation/test commits are `7e06685dafe1c39985de37417514c3ad2b32cecc`, `42046a07681536e0229ae8b38572ebf7e9118a02`, and `04a1261bf58f6f53c4b0b4cd0b0b269a8d96e8a4`. This evidence-only document is committed afterward; the final PR HEAD is recorded in the PR.
- Runtime: Node.js `v22.19.0`, npm `11.17.0`.
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
| Focused M02/M05 parser, D1, route, and regression tests | PASS, 45/45 | `node --test` over the two new bridge tests, M02 local article/compare/evidence tests, M05 local preview, and local admin router. Run against the final source content. |
| CMS UI and Chromium recovery checks | PASS, 4/4 | M05 LOCAL CMS tests 08, 09, E1, and E2; E1 axe reported `[]` serious/critical violations. |
| First-Owner concurrency, 2 and 10 contenders | PASS | Exactly one HTTP 201; all remaining claims explicitly denied; no D1 diagnostic failures. |
| First-Owner concurrency, 100 contenders | PASS, 3/3 trials | Each trial produced exactly one HTTP 201 and 99 HTTP 409 denials, with no D1 diagnostic failures; D1 contained one Owner/credential, one consumed ticket/challenge, no session, and unconsumed loser records. |
| Browser bridge acceptance flow | PASS, 1/1 | `M05 saved Owner D1 revision exports locally and is manually imported by the M02 browser preview`; dirty-form refusal, explicit download, manual import, warning states, and logout denial exercised. |
| Full Playwright suite | PARTIAL, 90/91 | The sole failure was an existing M00 Crypto 101 desktop case timing out at 30 seconds. Re-running that case alone passed (1/1). M01/M02/M03/M05 journeys passed in the full run; M02 axe checks passed in both locales. |
| Full unit suite | NOT GREEN IN THE FIRST BROAD RUN; NOT RERUN AFTER FINAL FIXES | The first full run preceded the final commits and reported missing legacy M01 evidence files plus CMS/recovery-test issues. CMS 08/09, the 2/10/100 concurrency cases, M01 visual-input-state tests, and CMS E1/E2 were subsequently verified in focused runs. The complete suite must still be checked by hosted CI on the final PR HEAD. |
| M01 visual input integrity | PASS, 7/7 | `test/modules/CB-M01/visual-input-state.test.mjs` passed after the M01 client migration was committed. |

## Boundaries and remaining gates

- `CB-M03` files, Work Order/Context Lock, checkpoint, `main`, PR #201, and PR #209 were not modified by this work.
- No merge, deploy, production access, rights clearance, editorial approval, or publication occurred. The exported document remains a working draft; facts and rights remain unverified.
- This bundle does not claim the complete repository unit suite is green. Review the exact-head GitHub checks before treating the PR as ready. The PR remains a draft until the remaining suite/check results are reviewed.
