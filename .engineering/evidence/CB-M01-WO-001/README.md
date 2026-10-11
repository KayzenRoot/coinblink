# CB-M01-WO-001 · isolated visual evidence

## Scope and provenance

- Canonical implementation base: `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`.
- The initial implementation evidence was captured while `HEAD` equaled this base; append-only correction records below document later PR commits.
- Browser fixture renders the M01 component in isolation. The Integration Steward still owns mounting it at `/en`; this evidence does not claim route integration or M01 completion.
- Golden JPEG source files remain unchanged: Home 1536×864, 532,365 bytes, SHA-256 `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8`, Git blob `4e96bc960eb507c87ec71fc88bc347ccbc64b21f`; logo 1179×1040, 121,728 bytes, SHA-256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`, Git blob `60771965fa0eb3b19fc38db51b36cc295563f6ab`.
- Browser: project Playwright Chromium, launched headlessly by `test/modules/CB-M01/visual-check.mjs`.

## Fresh captures

| Viewport | Image | SHA-256 | Horizontal overflow | Axe within M01 |
| --- | --- | --- | ---: | ---: |
| Desktop 1536×864 | `screenshots/golden-home-desktop.png` | `16f825a0ababb9e6d4b3885a4b34c654e1e10ef6fab04bcf12f403f611f9d898` | none | 0 violations |
| Tablet 768×1024 | `screenshots/golden-home-tablet.png` | `cffc4ba6e2578efb473f55bdd189f1c1f394344538db38a289951bdc6c381cc3` | none | 0 violations |
| Mobile 390×844 | `screenshots/golden-home-mobile.png` | `30132155bebf1363d2b55c5bf43778d38938b0812e7ce258f869180c06efcbe5` | none | 0 violations |

Detailed DOM, Axe, console, request, and screenshot metadata are in `visual-check.json`.

The immutable desktop Golden and the fresh desktop capture were also compared at 1536×864. The 50/50 overlay is `golden-home-desktop-overlay.png` (SHA-256 `0bd7466afed096a4cfe5391c18a2e86be1929eb81d4640b2a376578e1ea0f114`); the 3× contrast absolute-difference visualization is `golden-home-desktop-difference-3x.png` (SHA-256 `da1f60c4d4fe4129a5e666eb738a976ddf986389051e3ba05b71782fd7324bf2`). Raw per-channel mean absolute differences are R 32.0081, G 35.4853, B 24.4279 on the 0–255 scale; this is a visual comparison metric, not an acceptance score. The conspicuous expected differences include unsourced live stories/prices replaced with explicit placeholders and the remaining vertical-fold mismatch.

## Results and limitations

- The M01 component has zero Axe violations in all three viewports. Full-page Axe separately records one inherited moderate `region` finding for `.skip-link`, which is outside the M01 component in the shared `BaseLayout`. The Integration Steward owns that shared markup; it is not suppressed from the evidence and is not changed here.
- No browser console errors, uncaught page errors, or requests outside the local fixture were observed.
- Mobile menu open/expanded state and category filtering were exercised. The search input is intentionally hidden at the mobile breakpoint; search behavior was tested at tablet width, without asserting against an invisible mobile input.
- The tablet header now uses the menu at 768px, so navigation links no longer overlap search controls. The mobile hero illustration was reduced and repositioned so the main actions remain legible.
- The central hero mark is rendered as the Bitcoin `₿` symbol (not a generic T-shaped mark); the final captures below include this correction.
- Residual visual mismatch against the immutable desktop Golden: at 1536×864, the screenshot shows only the beginning of “Latest news” at the fold; the original reference exposes more below-hero content. Desktop vertical spacing has been compressed where practical without changing mobile layout, but this demo is not claimed to be pixel-parity with the Golden.
- Screenshots show the isolated component fixture, not the merged `/en` route, and do not constitute Owner visual acceptance or checkpoint promotion.

## Validation commands

- `node --test test/modules/CB-M01/GoldenHome.contract.test.mjs` — 5/5 passed after adding the Bitcoin glyph regression assertion.
- `node test/modules/CB-M01/visual-check.mjs` — final run after glyph and responsive corrections; 0 M01 Axe violations per viewport, full-page `.skip-link` finding recorded, no overflow/errors/external requests.
- `npm run test:unit` — 125/125 passed after the glyph correction; the run also regenerated the final three screenshots and full-page Axe report.
- `npm run lint`, `npm run typecheck`, `npm run build`, isolated Astro fixture build, and Golden integrity test passed in this worktree. Typecheck reports 52 files, 0 errors/warnings/hints. Build has no `SESSION` binding.
- `gef doctor --target .` and `gef status --target .` completed read-only but are not PASS: this linked worktree reports repository observability `FINDING` / dirtiness `UNKNOWN` (`GIT_DIRECTORY_NOT_A_DIRECTORY`, `WORKING_TREE_NOT_OBSERVED`) and conservative `operator.stale=true`. The Integration Steward will repeat them in a normal clone at the pushed exact SHA.
- Raw read-only GEF outputs are retained in `gef-doctor.json` and `gef-status.json`.
- Exact-head CI, independent review, Owner visual acceptance, `/en` integration, and checkpoint promotion are pending.

## Append-only publication state correction · 2026-10-11

The earlier Evidence Bundle sentence stating that `HEAD` still equaled the base and changes were uncommitted is a historical snapshot from evidence authoring and is superseded by this append-only correction. The work is committed on `codex/cb-m01-wo-001-impl-20261011` in implementation commit `2ce7dcd`, EOF hygiene commit `282c42b`, and stylesheet line-ending correction `1335d83`. Base SHA: `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`; the verified pre-documentation-correction head was `1335d83bbb333ec578656e4d3dc425d9ac1e6a8f`. The branch-wide `git diff --check <base> HEAD` passed after these commits. This note is documentation-only; record the post-note commit SHA as the exact PR head. Exact-head CI and independent review, `/en` route integration, Owner visual acceptance and checkpoint promotion remain pending. The linked-worktree GEF `FINDING/UNKNOWN` is not reported as PASS and will be repeated by the Steward in a normal clone.

## Append-only SonarCloud security correction · 2026-10-11

SonarCloud exact-head analysis of PR #58 at `f1c98e640092b4c7cc528e1194a01d85ada72b75` reported two duplicate `javascript:S5443` Critical findings at `test/modules/CB-M01/visual-check.mjs:44` and assigned Security Rating D. That line derived a predictable fixture output path from inherited `TEMP`/`TMP` values (or the repository root); the fixture config also used fixed cache/output locations. The findings are corrected in this candidate, but the new exact-head SonarCloud result remains pending and is not claimed as passed.

The runner now creates its root with `mkdtemp` directly under `os.tmpdir()`, passes only that generated root to the fixture, and never reads `TEMP` or `TMP`. Astro cache and build output are children of this root. The fixture config moved into this Evidence Bundle so `node --test` does not execute it as a test file; it fails closed unless the supplied path is absolute, is a direct child of the OS temp root, and has the CoinBlink M01 prefix. Shutdown is bounded to a three-second graceful wait plus a three-second forced-termination wait. The runner removes only its generated root after an exit code or signal confirms Astro exited; if shutdown cannot be confirmed, it preserves the root and fails with its location and captured server output.

Regression coverage checks the unique root, config environment, cache/output containment, absence of inherited temp variables, bounded shutdown, and cleanup only after process exit. An initial full `node --test` run with the fail-closed config still inside `test/` correctly exposed Node's broad test-file discovery; relocating that config into the Evidence Bundle resolved the discovery issue. The final full run below is the authoritative result.

The same SonarCloud review reported 11 `javascript:S9382` Minor code smells (“Unexpected await inside a loop”) at old `visual-check.mjs` lines 57, 81, 82, 83, 84, 86, 88, 97, 98, 111, and 148 on the reviewed head. They are sequential operations over one Playwright page per viewport, a bounded local-server readiness poll, and ordered screenshot reads. Their awaits preserve browser/page ordering and deterministic evidence; changing them to concurrent promises would introduce races. The rule was not suppressed, and no change was needed for these advisory findings.

Final local validation after the correction used Node.js `v22.23.3`:

- `node --test test/modules/CB-M01/GoldenHome.contract.test.mjs` — PASS, 6/6; this supersedes the earlier 5/5 focused count above.
- `npm run test:unit` — PASS, 125/125.
- `node test/modules/CB-M01/visual-check.mjs` — PASS across 1536×864, 768×1024, and 390×844; zero M01 Axe violations, no overflow, browser console errors, page errors, or external requests. The inherited full-page `.skip-link` landmark finding remains recorded separately.
- `npm run lint` — PASS with `--max-warnings=0`.
- `git diff --check` — PASS.

Fresh screenshot SHA-256 values: desktop `16f825a0ababb9e6d4b3885a4b34c654e1e10ef6fab04bcf12f403f611f9d898` (578,591 bytes), tablet `d0ee32e043f5feef9fa7efb9f277a77a799e12a0756b50d84faa21ba8f0042bb` (406,155 bytes), and mobile `fcd3609b3d7cd93e0093a6f77616693d7b57c5ba8dc16b39b53224743fb6418d` (180,017 bytes). Exact-head CI, SonarCloud, independent review, `/en` route integration, Owner visual acceptance and checkpoint promotion remain pending.

## Append-only exact-head CI and Sonar status correction · 2026-10-11

This addendum corrects the earlier pending-status statements above without removing their historical timeline. GitHub run [#38118073331](https://github.com/KayzenRoot/coinblink/actions/runs/38118073331) completed successfully at exact SHA `20e3dee003f334724331a03552197c40eb88a73f`. The check-run API confirmed this same `head_sha` for all results: GEF validation on Ubuntu and Windows, Docker Compose smoke, SonarCloud Code Analysis, Socket Security Project Report, and Socket Security Pull Request Alerts all passed. The successful SonarCloud result supersedes the earlier pending status for this SHA and validates the S5443 correction on that exact candidate.

CodeRabbit's check status was `success` only because the bot skipped review on this draft PR; it is not an independent code review. The independent audit of SHA `20e3dee` found this evidence-status drift and no code finding. This append-only documentation correction will produce a new commit and exact HEAD; run #38118073331 is evidence for `20e3dee` only, so CI/Sonar checks must be revalidated on the resulting SHA before claiming current-head success. GEF normal-clone observation, `/en` route integration, Owner visual acceptance, and checkpoint promotion remain pending.

## Append-only exact-head check result correction · 2026-10-11

The preceding statement that exact-head CI/Sonar needed revalidation was accurate before GitHub run [#38118515098](https://github.com/KayzenRoot/coinblink/actions/runs/38118515098) completed. That run succeeded on exact SHA `e81a51029254050144e9396f86cfef9611d976cf`. GitHub check-run records bind all six results to that SHA: M00 and GEF on Ubuntu, M00 and GEF on Windows, Docker Compose smoke, SonarCloud Code Analysis, Socket Security Project Report, and Socket Security Pull Request Alerts; all passed. This supersedes the pending CI/Sonar statements for `e81a510` only. CodeRabbit remains skipped because this PR is draft and is not an independent review. This append-only correction creates a new commit, so run #38118515098 does not validate the resulting SHA; exact-head checks for that new SHA remain pending. Normal-clone GEF observation, `/en` route integration, Owner visual acceptance, independent review, and checkpoint promotion also remain pending.

## Append-only exact CI readback for `d3dbecb` · 2026-10-11

GitHub run [#38118898129](https://github.com/KayzenRoot/coinblink/actions/runs/38118898129) completed successfully on exact SHA `d3dbecb8590208d2ddd436e0d15922afd0d48a83`. Check-run records bind all six results to that SHA: M00 and GEF on Ubuntu, M00 and GEF on Windows, Docker Compose smoke, SonarCloud Code Analysis, Socket Security Project Report, and Socket Security Pull Request Alerts; all passed. This supersedes the pending current-head status for `e81a510` and confirms the CI/Sonar evidence-status correction on `d3dbecb`. This addendum is documentation-only and changes no application code. Its new commit will have a different SHA; run #38118898129 does not validate that later SHA, whose exact-head CI/Sonar remains pending until its own run completes. CodeRabbit remains skipped while the PR is draft; normal-clone GEF observation, `/en` route integration, Owner visual acceptance, independent review, and checkpoint promotion remain pending.

## Correction Delta · exact review findings · 2026-10-11

The CodeRabbit review of PR #58 HEAD `86123eb6605ddf70e0fa080c1c4bd43cc0a933f6` and review summary #5483015675 identified four actionable M01 issues. The same PR now preserves visible keyboard focus on the search field; switches to the complete menu at 1050px so Tools/Videos/About are reachable from 851–1050px; bounds the Astro readiness probe and only removes its temp directory after a confirmed child exit; and includes category labels in local search while keeping category filtering, result counts and All/reset semantics. Added focused checks cover the stalled TCP deadline and cleanup, Tab focus, responsive boundary widths, and Bitcoin search combined with category selection. Regression tests failed against the preceding implementation for the new readiness helper and now pass.

The Playwright runner revalidated 1536×864, 768×1024 and 390×844. It also exercised 850, 851, 1024, 1050 and 1051px navigation boundaries. `visual-check.json` records five successful navigation boundary checks, visible 2px solid focus reached by Tab, a category-inclusive Bitcoin result, zero M01 Axe violations at the three primary viewports, no horizontal overflow, no console/page errors, and no external requests. Screenshot bytes did not change: desktop `16f825a0ababb9e6d4b3885a4b34c654e1e10ef6fab04bcf12f403f611f9d898`, tablet `d0ee32e043f5feef9fa7efb9f277a77a799e12a0756b50d84faa21ba8f0042bb`, mobile `fcd3609b3d7cd93e0093a6f77616693d7b57c5ba8dc16b39b53224743fb6418d`. The inherited shared `.skip-link` moderate landmark Axe item remains separately recorded and is Steward-owned.

At the preceding SonarCloud snapshot on PR #58 SHA `86123eb`, 13 OPEN findings were all MINOR CODE_SMELLs in `test/modules/CB-M01/visual-check.mjs`: 11 `javascript:S9382` sequential awaits (ordered Playwright actions, bounded readiness, screenshot reads), and two `javascript:S6582` optional-chain style suggestions. The dashboard showed `new_lines=384`, `new_lines_to_cover=0`; its 0.0% coverage display therefore has no coverable-line denominator and is not a measured zero. Two earlier Critical `javascript:S5443` findings about predictable temp output paths are CLOSED by the previously reviewed isolated-temp-root correction. A fresh Sonar analysis at the final PR HEAD remains required and authoritative.

## Correction Delta local validation · 2026-10-11

Node.js `v22.23.3` local verification: `npm test` passed (131 unit tests, build/no-binding guard, 7 E2E tests); lint, Astro typecheck and dependency audit passed (0 vulnerabilities). The M01 browser matrix passed at the three required viewports and five responsive navigation widths; keyboard focus, category-inclusive filtering, Axe (0 module violations), console and overflow checks passed. Existing screenshot hashes are unchanged. GEF doctor/status commands succeeded but the linked-worktree repository observation remains `FINDING/UNKNOWN`; it is not a clean-observation PASS. Hosted exact-head CI and the new review remain pending for the correction commit.

## Normal-clone GEF readback · code commit SHA 91332e66cc77d0ab522367074b221478294799d2 · 2026-10-11

A fresh ordinary clone at exact code commit `91332e66cc77d0ab522367074b221478294799d2` returned GEF 1.1.2 doctor/status exit 0; repository observation is HEALTHY, with no observation limits, and the status is observed CLEAN/no conflict. The previous linked-worktree finding is resolved for this code SHA. Because this addendum changes the PR head, repeat doctor/status and hosted checks against the resulting documentation commit.

## SonarCloud exact-head triage · 04a562abee44a68f4ba6499b28782fd0323f65b7 · 2026-10-11

Read-only SonarCloud API at this exact PR #58 HEAD reports **33 OPEN issues**, all `MINOR / CODE_SMELL`; the quality-gate check passed. Classification by rule/file/line:

| Severity | Rule | File | Count / lines | Disposition |
| --- | --- | --- | --- | --- |
| MINOR | `javascript:S9382` | `test/modules/CB-M01/visual-check.mjs` | 30 at 110–113, 115, 117, 126–127, 140, 144–145, 150–157, 160–161, 163–167, 169, 184–185, 255 | Sequential Playwright navigation, menu state, keyboard focus, query/filter, screenshot and assertion operations depend on prior page state; parallelizing these awaits would change test semantics. |
| MINOR | `javascript:S9382` | `test/modules/CB-M01/visual-server.mjs` | 1 at 66 | Readiness retry is sequential and deadline-bounded; a later probe depends on the prior result. |
| MINOR | `javascript:S6582` | `test/modules/CB-M01/visual-check.mjs` | 1 at 51 | Optional-chain style suggestion; no functional defect. |
| MINOR | `javascript:S6582` | `test/modules/CB-M01/visual-server.mjs` | 1 at 73 | Optional-chain style suggestion; no functional defect. |

No HIGH/CRITICAL issue was reported in this scan. Measures report `new_lines=638`, `new_lines_to_cover=0`, and `new_uncovered_lines=0`; therefore a dashboard 0% new-code coverage value has no coverable-line denominator and is not a measured zero-coverage result. This is a historical exact-head snapshot; the append below will change HEAD, so fresh Sonar/CI is required there.

## Correction Delta · inactive mobile search affordance · 2026-10-11

CodeRabbit identified an inactive search affordance at widths up to 760px on exact PR #58 HEAD `1b008811b8d9da696cef53941427d8ca351961ca`: CSS hid the search input but left its magnifier visible. The regression was reproduced at 390×844: `.search-box` remained visible while its search input was hidden. M01 now hides the entire search control at the existing mobile breakpoint. Playwright asserts the whole control and input are unavailable on mobile, and `visual-check.json` records that intentional state. Search remains usable above the breakpoint.

The mobile capture is now SHA-256 `f8edf1c9420b2521e38d54a21edb88efc420ee350df14e724a259ea5aa42155d` (179,479 bytes); desktop and tablet are unchanged at `16f825a0ababb9e6d4b3885a4b34c654e1e10ef6fab04bcf12f403f611f9d898` and `d0ee32e043f5feef9fa7efb9f277a77a799e12a0756b50d84faa21ba8f0042bb`. The updated mobile PNG was visually inspected. M01 Axe remains at 0 violations; the shared `.skip-link` moderate landmark finding is unchanged and Integration-Steward-owned.

On predecessor HEAD `1b008811`, exact CI run [#38136990859](https://github.com/KayzenRoot/coinblink/actions/runs/38136990859) passed Docker Compose smoke, Ubuntu GEF, Windows GEF, SonarCloud, and both Socket checks. Sonar reported 33 open MINOR CODE_SMELL findings (31 ordered `javascript:S9382` awaits and two style-only `javascript:S6582` suggestions), with no HIGH/CRITICAL issue; new-code measures were 638 lines, 0 lines to cover, and 0 uncovered. That is not measured 0% coverage. CodeRabbit's full review of the same predecessor found the mobile affordance defect; the corrected candidate needs its own exact-head CI/Sonar and review.

Local validation of the correction on Node.js `v22.23.3`: `npm test` passed (131 unit tests, Astro build/no-binding guard, and 7/7 E2E); lint, typecheck (53 files, 0 diagnostics), and `npm audit --audit-level=high` (0 vulnerabilities) passed. The standalone Playwright matrix passed at desktop 1536×864, tablet 768×1024, and mobile 390×844, including mobile control visibility, M01 Axe, responsive navigation boundaries, category-inclusive search, no overflow/errors, and no external requests. One exploratory `npm test` inherited Node 24 and correctly failed the repository's Node 22 version assertions; rerunning with the supported Node 22 runtime passed.

## Correction Delta · no-script newsletter privacy · 2026-10-11

CodeRabbit's finding on predecessor PR #58 HEAD `4bf5d1fdfdc8053ec703a1d7134282d76ca843a9` was reproducible: with JavaScript disabled, the native GET form submitted the entered demo address into the page query string. The M01 component now has no native form; its demo button is `type="button"` and its JavaScript handler only updates local status text. A no-script Playwright regression fills the field, clicks the control, and proves that neither origin navigation nor a query string containing the address occurs. The test report records `noScriptNewsletter.addressSerialized=false`.

Node.js `v22.23.3`: full `npm test` passed (131/131; Astro build/no-SESSION guard and 7/7 E2E included), `npm run lint` passed, `npm run typecheck` passed (53 files, 0 diagnostics), and `npm audit --audit-level=high` reported 0 vulnerabilities. The three M01 viewports passed; module Axe violations: 0. The existing shared `.skip-link` full-page landmark finding remains Integration-Steward-owned. Screenshots are unchanged: desktop 1536×864 SHA-256 `16f825a0ababb9e6d4b3885a4b34c654e1e10ef6fab04bcf12f403f611f9d898` (578,591 bytes), tablet 768×1024 `d0ee32e043f5feef9fa7efb9f277a77a799e12a0756b50d84faa21ba8f0042bb` (406,155 bytes), mobile 390×844 `f8edf1c9420b2521e38d54a21edb88efc420ee350df14e724a259ea5aa42155d` (179,479 bytes).

The original Context Lock source fingerprint table and immutable Golden references remain unchanged. These are local correction results; exact candidate SHA, ordinary-clone GEF, hosted CI, SonarCloud and fresh CodeRabbit review must be read back after publication. No shared route integration, checkpoint change, module completion, or merge is claimed.

## Exact-head review closeout · 2026-10-11

At code HEAD `cee281bb2dd015f2d977fb09751c78de59e321e9` (PR #58; frozen base `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`), run [#38138890526](https://github.com/KayzenRoot/coinblink/actions/runs/38138890526) passed all six hosted checks on that exact commit: GEF/M00 Ubuntu, GEF/M00 Windows, Docker Compose smoke, Socket Project Report, Socket Pull Request Alerts, and SonarCloud. CodeRabbit's full review requested in [comment #6108959526](https://github.com/KayzenRoot/coinblink/pull/58#issuecomment-6108959526) completed in [reply #6108960416](https://github.com/KayzenRoot/coinblink/pull/58#issuecomment-6108960416); it posted no new inline finding on `cee281b`. The older readiness thread #4241291133 was rechecked against the current bounded/abortable readiness code, answered in [reply #4241601270](https://github.com/KayzenRoot/coinblink/pull/58#discussion_r4241601270), and resolved; the fix is already in the exact tested candidate.

A qualified read-only independent auditor checked the exact code diff, governance sources, tests, evidence, Context Lock fingerprints, Golden files, screenshots, CodeRabbit/Sonar results, and exact checks. Its `CORRECTION REQUIRED` disposition was limited to stale pending-status wording in this README and Work Order, the unresolved historical readiness thread, and an outdated PR body. It reported no remaining code defect. The thread and both documents are now corrected; the PR description is being synchronized. The review was not blind: the auditor had familiarity with earlier M01/M05 snapshots. A fresh audit of the final documentation-only HEAD is still required before Owner audit.

Read-only SonarCloud on `cee281b` passed the quality gate and reports 35 OPEN `MINOR / CODE_SMELL` findings: 31 sequential `javascript:S9382` Playwright/readiness awaits and four `javascript:S6582` style suggestions across M01's visual/readiness test files. There are no HIGH/CRITICAL findings. Measures show `new_lines_to_cover=0` and `new_uncovered_lines=0`; the displayed 0% is not a measured zero over coverable lines. The two previous `javascript:S5443` Critical items remain closed.

Local Node `v22.23.3` validation at `cee281b` passed: `npm test` (131/131 unit tests, build/no-SESSION guard, 7/7 Playwright E2E), lint, typecheck (53 files / 0 diagnostics), high-severity audit (0 vulnerabilities), and the standalone Playwright/Axe matrix at desktop 1536×864, tablet 768×1024 and mobile 390×844. All three captures match the committed hashes and dimensions; M01 Axe has zero violations. The inherited shared `.skip-link` landmark finding is Integration-Steward-owned. GEF 1.1.2 doctor/status in a fresh ordinary clone observed the same SHA, healthy repository state and clean tree; conservative operator-staleness, absent drift-baseline, and security-review flags remain informational limitations, not code failures.

This section records evidence for code HEAD `cee281b`; an append-only documentation commit changes the PR head and requires fresh exact-head CI/Sonar/CodeRabbit and independent audit. Shared `/en` route integration, Owner visual acceptance, merge, and checkpoint promotion remain pending. M01 is not declared DONE.

## Exact-head correction readback · 2026-10-11

The prior independent read-only audit of exact PR #58 HEAD `b3992da666a039a42f3e6beb71d6064ee2847902` returned `CORRECTION REQUIRED` solely because this Evidence Bundle, Work Order and PR body still described the exact-head run as pending. It reported no code defect, verified the 18 Context Lock source fingerprints against the frozen base, and confirmed that the historical readiness thread was answered and resolved. The auditor had familiarity with earlier M01/M05 snapshots; it was not blind. This addendum records the actual result for `b3992da`; it does not claim a completed audit of a later documentation HEAD.

GitHub run [#38140315586](https://github.com/KayzenRoot/coinblink/actions/runs/38140315586) completed SUCCESS on exact HEAD `b3992da666a039a42f3e6beb71d6064ee2847902`. All six checks passed: GEF/M00 Ubuntu, GEF/M00 Windows, Docker Compose smoke, SonarCloud Code Analysis and both Socket checks. Each check-run `head_sha` matched `b3992da`. The GitHub CodeRabbit status says success because the bot skipped review while this PR is draft; it is not a hosted review. A local CodeRabbit deep review of `b3992da` against frozen base `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c` returned zero findings. The hosted full review completed earlier on unchanged code SHA `cee281bb2dd015f2d977fb09751c78de59e321e9` in reply #6108960416 and reported no new inline finding.

The exact-head Sonar quality gate passed. The latest detailed issue census available for the unchanged M01 code is the scan at `cee281b`: 35 open findings, all MINOR CODE_SMELL (31 sequential `javascript:S9382`, four stylistic `javascript:S6582`); no HIGH/CRITICAL findings. It reported `new_lines_to_cover=0`, so the displayed 0% coverage has no coverable-line denominator and is not measured zero coverage. The `cee281b` and `b3992da` difference is documentation-only; no M01 source or test code changed.

The auditor's requested status correction is now recorded in this bundle and the Work Order. The new append-only documentation commit changes the current PR HEAD and therefore needs its own exact-head checks, hosted review status, and read-only audit. The PR body must be synchronized to that resulting SHA. Shared `/en` integration, Owner visual acceptance, merge, checkpoint promotion, and M01 completion remain pending.

## Local CodeRabbit correction delta · 2026-10-11

The local deep review of documentation HEAD `68d0bfc487bbd7afd17ed510a4d8d7f16d8fdf2f` raised two MINOR documentation issues: duplicate “Append-only exact-head check result correction” headings in this README, and an ambiguous M01 implementation GO-AHEAD authority in the Context Lock. The duplicate historical heading is now uniquely labeled `d3dbecb`. The lock and Work Order now clarify that the Integration Steward acted as the coordinator role defined in the Owner's parallel-delivery directive [Issue #6 comment #6098519375](https://github.com/KayzenRoot/coinblink/issues/6#issuecomment-6098519375); no separate delegated approver is claimed. The 18-entry base fingerprint table and the historical preflight text were preserved. This records the point-in-time review of `68d0bfc`: the two corrections were prepared afterward in this same branch. The new commit needs exact-head CI, fresh review and a read-only audit before Owner review; no merge or checkpoint progress is authorized.

## Correction-delta final verification · 2026-10-11

The final correction candidate before this evidence-only append was PR #58 HEAD `58d27293bac83c9fe57cb84d89875b5180a26371`, based on frozen main `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`. GitHub run [#38142527674](https://github.com/KayzenRoot/coinblink/actions/runs/38142527674) passed all six hosted checks on that exact SHA. Local CodeRabbit deep review on this SHA returned zero findings; the hosted full-review request [#6109514512](https://github.com/KayzenRoot/coinblink/pull/58#issuecomment-6109514512) remained pending at readback.

GEF Bootstrap 1.1.2 doctor/status ran read-only against a clean ordinary clone at that exact SHA. Doctor succeeded with all four findings, including repository.observable, HEALTHY; status succeeded with repository CLEAN and dirtiness OBSERVED. Conservative operator.stale=true, absent drift baseline, and security provenance/immutable-ref review remain informational limits. This ordinary-clone observation supersedes the historical linked-worktree limitation.

This append is documentation-only and advances the branch; it requires fresh exact-head checks and CodeRabbit review. PR #58 remains draft/open. Owner audit, shared /en route integration, visual acceptance, merge, checkpoint promotion, and M01 DONE remain pending.

## CodeRabbit correction delta · responsive trending strip · 2026-10-11

A local CodeRabbit deep review of evidence HEAD d2c2a7a8e0c15b909f4143335a0c5f3c40183020 found one MINOR visual issue. Inspection confirmed it: between 851 and 1050 px, the title plus three visible trend cards were assigned only three grid tracks, wrapping a card; at mobile width, four restored cards used only two item tracks and wrapped to a second row. No original Golden asset or manifest was involved.

The isolated Playwright visual runner now checks actual child rectangles at widths 850, 851, 1024, and 1050, and verifies that mobile's title and four cards overlap on one row while the strip scrolls horizontally. Before the CSS correction this regression failed at 390×844 with two card rows; after the correction it passed. Tablet uses four explicit tracks (title plus three visible cards). Mobile uses a title track plus single-row implicit card columns with overflow-x scrolling. The always-run module contract test also asserts the CSS contract and the real-browser assertions.

Final local validation on Node 22.23.3 / npm 10.9.9: npm test PASS (132 unit tests, Astro build and no-binding guard, Playwright E2E 7/7); npm run lint PASS; npm run typecheck PASS (53 files, 0 errors/warnings/hints); npm audit --audit-level=high PASS (0 vulnerabilities); isolated visual Playwright/Axe PASS at 1536×864, 768×1024 and 390×844. Module Axe violations: 0; console/page errors and external requests: 0; document overflow: none. The one inherited full-page Axe region finding targets the shared .skip-link and remains Steward-owned.

Updated M01 screenshots: desktop 1536×864, 578591 bytes, SHA-256 16f825a0ababb9e6d4b3885a4b34c654e1e10ef6fab04bcf12f403f611f9d898; tablet 768×1024, 417089 bytes, SHA-256 cffc4ba6e2578efb473f55bdd189f1c1f394344538db38a289951bdc6c381cc3; mobile 390×844, 179438 bytes, SHA-256 30132155bebf1363d2b55c5bf43778d38938b0812e7ce258f869180c06efcbe5. The updated Playwright JSON records one-row tablet/mobile layout assertions. The approved Golden JPEGs and manifest remain unchanged.

The result is limited to M01 component CSS, M01 contract/visual tests and M01 evidence. The new code/test head must receive exact-hosted CI, fresh local/hosted CodeRabbit review, and Owner audit. PR #58 stays draft/open; no shared /en integration, checkpoint change, merge, or M01 completion is claimed.

## Local CodeRabbit evidence-table correction · 2026-10-11

The local deep review of HEAD 36a535e raised minor evidence findings: the Fresh captures table still contained predecessor tablet/mobile hashes, and a historical Work Order heading did not identify its d3dbecb evidence commit. The table now matches the committed 768×1024 and 390×844 PNGs, and the heading is uniquely labeled. The review's additional concern about the Context Lock blob was checked deterministically: git rev-parse at frozen base 07f31d8 returns 75e155ae8d4bd6886dc565cf8841f1d64938f6d4 for .engineering/context-locks/CB-M01-WO-001.md, exactly matching the documented pre-refresh source blob. It remains unchanged; the current source blob is a separate later value. No fingerprint was fabricated or rewritten.