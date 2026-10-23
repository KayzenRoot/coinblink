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

## Correction Delta audit readback — 2026-10-23

Status: **CORRECTION REQUIRED / BLOCKED FOR APPROVAL**, not a merged or completed module. This is an evidence-only audit delta, not source-code remediation. The verified base remains `a5ab57ea374ffa91f329c3fd2137020b0a468bc6` and the reviewed prior HEAD is `efb1935184ec68b3cf904c17ba1cbec8bc62ff8c`; any evidence commit requires fresh exact-HEAD CI. The branch and PR must remain Draft until subsequent corrections and independent audit. No changes to M03, PR #209 ECC, production, or main.

### Independently checked from hosted GitHub records

- All **19/19** GitHub check runs returned `success` on `efb1935184ec68b3cf904c17ba1cbec8bc62ff8c`, including Build, M05 local D1/Chromium, M02 browser, CI Quality, PR Assurance, Gitleaks, Reviewdog, SonarCloud and Socket. SonarCloud's `success` is **not** equivalent to zero findings.
- SonarCloud's exact-HEAD check output and its bot comment explicitly report **2 new issues, 0 Security Hotspots, 0.0% New Code Coverage, and 0.0% New Code Duplication**, while the Quality Gate passed. Neither the issue rule IDs, affected lines, severities nor dispositions have been independently retrieved; therefore **zero-new-issues acceptance is NOT MET**. Do not mark them fixed or suppress them based on this aggregate count.
- Socket PR Alerts concluded `success` but says **Skipped** due to no net dependency changes. The separate Socket Project Report concluded `success`. This must not be reported as a freshly executed PR dependency-diff scan.
- Actual hosted CI Quality test log: **66/66 PASS** under Node 22.19.0; it generated `coverage/lcov.info` using Node's experimental test coverage and uploaded `cb-ci-quality-lcov` (artifact ID `12533520932`). Only specific M02/M03/M04/M08/M10 and automation tests are in that CI coverage command. The project contains **no `sonar-project.properties`** or repository workflow that visibly downloads the generated LCOV into the SonarCloud analysis job. Sonar's **0.0%** remains a coverage-import/measurement gap to diagnose, not evidence that no tests exist and not evidence that coverage meets a threshold.
- The full local unit diagnostic in the preexisting bundle is **433/439 FAIL** on Node 26.4.0; this differs from declared Node engine `>=22.19.0 <23` and hosted Node 22.19.0. Five M01 failures reference ignored/missing visual-evidence fixtures under `.engineering/evidence/CB-M01-WO-001/`, which are absent from the verified branch Git tree. These are **environment/fixture prerequisites, not proved bridge regressions**. No deletion, fabrication or silent skip is authorized.
- The remaining local unit failure was BOOT-10 first-Owner concurrency, with transient HTTP 500 under loaded execution. Existing M05 test commentary documents prior Miniflare Node-to-workerd D1-proxy `ECONNRESET`/hydration failures at 100-way load, and runs 100-way claims inside workerd instead; **the specific 10-way incident is not conclusively attributed**. In focused runs BOOT-10 passed; the existing workerd-hosted 100-way test passed 3/3 in the Codex report. Preserve atomic one-Owner invariants, zero 500 proof obligations and test diagnostics. Do not weaken rejection assertions or mask a server error by retries.
- Full local Playwright diagnostic **90/91**, single M00 Crypto 101 desktop timeout; its isolated rerun passed. This is not yet a proven change-introduced defect; no M00 product change is justified from the available evidence.
- GitHub PR #217 reported no review submissions or inline comments in the initial audit. No human approval may be inferred from PR Assurance, CodeRabbit, reviewdog or the assistant's audit.

### Required before APPROVED

1. Retrieve and classify each of the **2 SonarCloud new issues** with concrete rule ID, file, line, severity and code evidence. Resolve confirmed in-scope problems in this same Work Order/branch; if unaddressed, retain `CORRECTION REQUIRED`. Do not change Quality Gate, scanner thresholds or ignore/suppress an issue without independently justified proof.
2. Investigate BOOT-10 under the supported Node 22.19.0 and isolate whether the source of HTTP 500 is application transactional logic or test-host D1 proxy. Record status histograms, stack/log diagnostics, database invariants, reproducible seed and repeat count. No reduction to concurrency/adversarial assertions.
3. Reconcile full-suite prerequisites for the five M01 fixtures without fabricating generated artifacts, and classify M00 timeout as environment or genuine regression from evidence. Record `NOT_RUN` where execution is unavailable.
4. Determine how LCOV may be consumed and file paths matched by the configured SonarCloud service, without modifying security permissions, paid integrations or broader CI workflows in this narrow correction until explicitly justified.
5. Revalidate all applicable GitHub required checks on the next exact HEAD, SonarCloud's new-issue count and Socket semantics; finish audit/reviews and preserve Draft. No merge, deploy, costs, LIVE providers, remote D1, publishing, checkpoint promotion, M03 write or ECC #209 write.

**Audit evidence delta only:** no runtime source code, tests, config or deployment modified by this annotation. **STOP: CORRECTION_REQUIRED_SONAR_2_AND_CONCURRENCY_DIAGNOSTICS_PENDING.**
