# CB-GOV-PARALLEL-003 · Read-only multiagent execution preflight

**Status:** PROPOSED IMPLEMENTATION TOOLING (not admission/ADR adoption).
**Base main:** `9757772d145f0aea69e0ecc0d7d0e7190e07916e`, M00 COMPLETE/5%. **Owner direction:** maximum safe simultaneous Codex Desktop LOCAL agents, functional development as soon as admitted, local Docker visual loop and shared validated Cloudflare Preview.
**Non-mutation:** This CLI does not spawn Codex, admit modules, checkout a worktree, merge, deploy or touch paid services.

Run `node scripts/plan-parallel-modules.mjs` or `node scripts/plan-parallel-modules.mjs --max-agents 6` from the local repo. It reads the **canonical** `.engineering/CHECKPOINT.json`, the frozen **proposal** matrix (without changing history), all five global approval/adoption gates, local resource slots, and optional per-module gate evidence. Pass optional JSON with `--gate-evidence <path>` only when evaluating supplied evidence; the CLI labels that input unverified and non-authorizing. It reports dependency-ready module candidates separately from planner-eligible agent-module slots under evaluated inputs. Planner output never admits modules or authorizes code work.

**What is ready after M00?** The current *dependency-ready candidates* are M01 and M05. Both are NOT_ADMITTED; M01 still needs both byte-exact Golden images from Issue #5 and M05 still needs the single human Owner to document decisions on identity, recovery, MFA, and vault storage. The global V1 source pack and parallel ADR in Issue #6 remain unapproved. No module application code is authorized by this PR.

**Future dispatch policy:**
1. Freeze reviewed global source pack, ADR and compatibility contracts, per-module Work Orders, frozen Context Locks, exclusive path manifests and provider/security gates. Promote each admission using GEF, never through this CLI or an issue label.
2. Start **one Codex Desktop LOCAL implementation agent per independently admitted dependency-ready module**, as many as safely permitted by CPU/RAM and path ownership. Never hardcode a maximum of two if more independent modules qualify. Use a separate Integration Steward for shared app routes/types/migrations/config.
3. All agents develop simultaneously in isolated worktrees and branches, with their own PR and unit tests. Heavy Playwright/Docker runs use a bounded shared queue. CI/review remains mandatory at exact PR HEAD; main merges are serialized until a verified merge queue is adopted. Refresh remaining branch CI after main moves, never force-push.
4. Keep `coinblink-local` on its existing Windows port `http://localhost:3187/en` and use the protected Cloudflare Worker Preview only when the source app/build changes and the deployment run is separately approved. No other host's container may be stopped.
5. Require observed authoring/worktree/agent IDs at dispatch time. Suggested names in the plan are prospective, **never claims of created worktrees**. The CLI does not infer that module M02+ is completed merely from a proposed wave or a prior `ADMITTED` field. Future multi-module completion proof requires explicit promoted evidence; the scheduler is intentionally conservative until a source-backed completion registry exists.

**STOP CONDITION:** execute `npm test`, lint/typecheck, Windows/Ubuntu/Docker GitHub checks and CodeRabbit on exact candidate SHA; audit and merge this tool under normal authority. Follow with real Scope/Architecture/DoD/ADR and admission decisions. Existing 19 modules and M18 FUTURE unchanged. All source-heavy product modules remain subject to their own DoD and Owner review.

## Same-PR SonarCloud correction · 2026-10-10

The pre-correction PR head `e0d9c85496bfb16b22de0f94808022b9ad97b75f` failed the new-code Reliability Quality Gate (rating D, required A). The PR-specific SonarCloud API returned three open diagnostics in `scripts/plan-parallel-modules.mjs`:

| Rule / classification | Prior location | Correction |
|---|---|---|
| `javascript:S2871`, CRITICAL / BUG, Reliability impact HIGH | Line 40, both bare `.sort()` calls in the checkpoint registry equality guard | Replaced sorting with exact set equality: compare set size with the 19 expected IDs, then verify every canonical ID with `Set.has()`. This preserves order-independent equality and rejects missing or extra checkpoint keys. |
| `javascript:S7776`, MINOR / CODE_SMELL, Maintainability impact MEDIUM | Line 111, `tokens.includes()` in the status parser | Store the status tokens in a `Set` and use `.has()` for all membership checks; the `NOT_ADOPTED` exclusion remains unchanged. |

The five planner functions also received concise JSDoc descriptions in response to CodeRabbit's prior docstring-coverage warning; this changes no runtime behavior.

The regression test `checkpoint admission registry matches the exact canonical module ID set` verifies reordered keys are accepted while a missing ID or unexpected `CB-M19` fails closed. No quality gate, assertion, module count, checkpoint, ADR status, or module-admission state was weakened or changed.

## Independent final-head findings and same-PR corrections

Read-only spec and standards reviews of the Sonar-corrected head found four planning correctness gaps and one resource-floor defect. All were corrected in this same PR without changing any module admission or canonical decision:

| Finding | Correction | Regression coverage |
|---|---|---|
| A host below the documented two-CPU/four-GiB-per-author floor still received one slot. | Resource calculation now returns zero slots below the floor; the planner accepts zero and schedules no active author. | Low-CPU/low-RAM results and a zero-slot schedule. |
| M00 completion checked only status, completed-through, and Preview, allowing contradictory checkpoint facts. | Requires `applicationImplementation=M00_COMPLETE`, `CB-M00=ADMITTED`, `overallCompletionPercent=5`, plus the existing status, module, and Preview facts. | Contradictions in each of the new canonical fields fail closed. |
| One ADR status represented five separate global gates. | Requires individually true Scope, Architecture, DoD, Issue #6 closure, and parallel ADR adoption. CLI status checks require explicit global-approved/frozen source status and read the Issue #6 state; unavailable GitHub access fails closed. | Each missing global gate independently prevents eligibility. |
| CLI had no way to consume module gate evidence, so planner-eligible agent-module slots could never be displayed from supplied gates. | Added optional `--gate-evidence <path>` JSON input with schema validation. It is explicitly marked `UNVERIFIED_OPERATOR_INPUT_NOT_AUTHORIZATION`; absent input remains fail-closed. | Valid JSON shape and malformed JSON, unsupported IDs, and non-boolean gates are tested. |
| Integration-only contracts were omitted from readiness output. | Reports missing `integrationGates` separately from authoring blockers, preserving the distinction between isolated authoring and cross-module merge readiness. | M17 displays the M08 and M07 integration contracts separately. |

The planner still creates no worktrees, branches, tasks, approvals, admissions, deployments, or merges. A zero-agent result is expected until every canonical global and per-module gate is independently satisfied. The currently open Issue #6, unadopted ADR, M01 source-image hashes, M05 identity/security decisions, and absent individual admissions remain real blockers; no source was promoted or altered to imply approval.

Source SHA-256 fingerprints before the same-PR reviewer corrections (historical):

| Path | SHA-256 |
|---|---|
| `scripts/plan-parallel-modules.mjs` | `b757dd641ef5b82e6b46fb7bf4ade32eb6ee044034e260e5ef702f212b475ae4` |
| `test/parallel-batch-planner.test.mjs` | `034b720032276f686017aefe4af8d557a66c9443a9cbe3806997446f4c8bc2a8` |

Local validation on the original Sonar correction used Node `22.19.0` and npm `10.9.3`:

- `npm ci`: 437 packages installed, 448 audited, 0 vulnerabilities.
- `npm test`: 95/95 unit tests pass; Astro build and binding guard pass; 7/7 Playwright checks pass.
- `npm run lint`: pass with zero warnings.
- `npm run typecheck`: 44 files, 0 errors, 0 warnings, 0 hints.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- GEF `doctor` and `status`: read-only commands succeeded with `effect: NONE`; repository observability is **REVIEW**, because this managed linked worktree reports `GIT_DIRECTORY_NOT_A_DIRECTORY` and `WORKING_TREE_NOT_OBSERVED`. GEF also reports unverified dependency provenance, an absent drift baseline, and a stale operator snapshot; this is not represented as a clean GEF PASS.
- `git diff --check`: pass.

Exact-head Ubuntu/Windows/Docker/SonarCloud/Socket checks, hosted CodeRabbit review, and final audit are evaluated on the pushed candidate SHA in the PR; this local Evidence Bundle does not pre-claim their results. The canonical checkpoint remains `M00_COMPLETE` at 5%; M01–M17 remain `NOT_ADMITTED`, and M18 remains `FUTURE_NOT_ADMITTED`.

## Final local validation for the same-PR reviewer corrections

Validation used the project-pinned runtime **Node `22.19.0` / npm `10.9.3`**. The machine-default Node 24/npm 11 was excluded because an evergreen GEF test correctly asserts Node 22; all final checks below were rerun with the pinned versions.

| Check | Result |
|---|---|
| `npm ci` | PASS — 437 packages installed, 448 audited, 0 vulnerabilities. |
| `npm test` | PASS — 101/101 unit/governance tests, Astro build and no-binding guard, 7/7 Playwright checks. |
| `npm run lint` | PASS — ESLint, zero warnings. |
| `npm run typecheck` | PASS — 44 files, 0 errors, 0 warnings, 0 hints. |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities. |
| Parallel planner focused tests | PASS — 13/13. |
| `git diff --check` | PASS. |
| GEF `doctor` / `status` | Commands succeeded read-only with `effect: NONE`, but the repository result remains **REVIEW**: linked-worktree observation reports `GIT_DIRECTORY_NOT_A_DIRECTORY` / `WORKING_TREE_NOT_OBSERVED`, dependency provenance is unverified, drift baseline is absent, and the operator snapshot is stale. No GEF PASS is claimed. |

The planner run against live sources reports M00 `COMPLETE` / 5%, 19 modules and 18 unfinished; Issue #6, global Scope/Architecture/DoD approval and ADR adoption are still pending. The dependency-ready candidates remain M01/M05, with no admitted or eligible code agents. It observed **zero** current local resource slots under the two-CPU/four-GiB-per-author floor; the implementation now fails closed at zero rather than inventing one slot. The original M01 Golden image bytes/hashes and M05 identity/recovery/MFA/secret decisions remain pending. No files were changed in the canonical checkpoint, module catalog, application, deployment workflow, or Docker configuration.

The existing project Docker container was observed healthy at `http://localhost:3187`; `/health` and `/preview-status` both returned the unchanged main build SHA `9757772d145f0aea69e0ecc0d7d0e7190e07916e`, and `/en` returned HTTP 200. This PR changes governance tooling only, so the running local preview was not rebuilt. The unrelated port-3000 `nexlabs-website-web-1` container and all other observed containers were left running.

Final code/test fingerprints after these corrections:

| Path | SHA-256 |
|---|---|
| `scripts/plan-parallel-modules.mjs` | `f9756239390c994e15224bcd634befa130f6b00f685e2b91a7c365f37c5d3419` |
| `test/parallel-batch-planner.test.mjs` | `a8cf4973e80eb69390b42c510a9eb025c9c1a58db7f092618bf0cf01a858203d` |

Exact-head hosted checks and the final independent review remain to be read from the current PR after the correction push; no hosted status is claimed in this local result section.

## SonarCloud and fail-closed status correction on the same PR

The PR #52 SonarCloud API and check annotations were queried read-only for the exact pre-correction HEAD `0d0d2f56da3dde78c23418e8dd3c3c2c08d95362`. It reported these three open findings in `scripts/plan-parallel-modules.mjs`:

| Rule | Severity / type | Exact prior line | Finding and disposition |
|---|---|---:|---|
| `javascript:S3776` | CRITICAL / CODE_SMELL | 135 | Cognitive Complexity 20 exceeded 15. Split gate evidence parsing into bounded record, field, and entry validators; JSON syntax failures now use `SyntaxError`, and schema failures use `TypeError`. |
| `javascript:S7786` | MINOR / CODE_SMELL | 163 | A generic `Error` was used for a type-check failure. Replaced it with `TypeError`; invalid JSON is separately reported as `SyntaxError`. |
| `javascript:S4036` | MINOR / VULNERABILITY | 206 | `execFileSync('gh', ...)` resolved `gh` through `PATH`. Removed process execution and replaced the Issue #6 state read with a fixed public GitHub REST GET, no credentials, redirect rejection, a five-second timeout, and fail-closed error handling. |

The Quality Gate failure was the new-code Security Rating (`B`, required `A`). The earlier `S2871` and `S7776` findings were reported resolved by SonarCloud. Regression coverage now also rejects explicit negative, contradictory, extra, and reordered Scope/Architecture/DoD approval status tokens; only the exact `OWNER_APPROVED_GLOBAL / FROZEN` status is accepted. The additional case for an unknown `PENDING` status was first run red, then passed after the exact-status comparison was implemented.

CodeRabbit's two actionable comments on `0d0d2f56da3dde78c23418e8dd3c3c2c08d95362` were also checked against the code: (1) the approval parser could accept `FROZEN` inside a negative or unknown status, and (2) output labels implied actual code-authorized agents despite relying on unverified operator gate input. The parser now accepts only the exact `OWNER_APPROVED_GLOBAL / FROZEN` status; the CLI calls outputs planner-eligible modules based on evaluated inputs, exposes `moduleApplicationCodeAuthorizedByPlanner: false`, and states that it never grants code authority. Regression tests cover negative, contradictory, reordered, and additional status tokens, and verify that planner eligibility never becomes authorization. A new CodeRabbit run is required on the pushed correction HEAD.

Fresh local validation for this corrective candidate used Node `22.19.0` and npm `10.9.3`:

| Check | Result |
|---|---|
| Focused planner tests | PASS — 14/14, including fixed unauthenticated Issue #6 GET semantics and fail-closed response handling. |
| `npm test` | PASS — 102/102 unit/governance tests, Astro build and no-binding guard, 7/7 Playwright tests. |
| `npm run lint` | PASS — zero warnings. |
| `npm run typecheck` | PASS — 44 files, zero errors, warnings, or hints. |
| `npm audit --audit-level=high` | PASS — zero vulnerabilities. |
| `git diff --check` | PASS. |
| GEF 1.1.2 `doctor` and `status` | Commands succeeded read-only with `effect: NONE`; result remains **REVIEW** because the managed worktree reports `GIT_DIRECTORY_NOT_A_DIRECTORY` and `WORKING_TREE_NOT_OBSERVED`, dependency provenance is unverified, drift baseline is absent, and the operator snapshot is stale. |

The M00 checkpoint and 19-module catalog are unchanged. Issue #6 remains OPEN, the global Scope/Architecture/DoD and parallel ADR are not approved/adopted, M01–M17 remain `NOT_ADMITTED`, and M18 remains `FUTURE_NOT_ADMITTED`. This planner creates no agent, worktree, branch, PR, admission, deployment, or merge. Exact-head hosted CI, a new SonarCloud result, CodeRabbit, and independent review are pending on the next pushed HEAD.

Corrective-candidate source fingerprints (SHA-256):

| Path | SHA-256 |
|---|---|
| `scripts/plan-parallel-modules.mjs` | `c9eb103a7783706196aab0195f55344e5d6d27bf7c74ee59ab32ee8ce659bfed` |
| `test/parallel-batch-planner.test.mjs` | `01d7530564b246f74c5a81dc3fa9399e41a9d706c8adeeb0d39ca8e43c38ed42` |

Final planner CLI observation on this correction candidate: `M00_COMPLETE` / 5%, 19 modules, 18 unfinished, dependency-ready candidates M01 and M05, five pending global gates, zero resource slots, zero planner-eligible agent modules, and `moduleApplicationCodeAuthorizedByPlanner=false`. Issue #6 remained OPEN; the CLI marked operator gate input absent and unverified. The existing Docker preview remained up at `http://localhost:3187`: `/health` and `/preview-status` returned HTTP 200 with build SHA `9757772d145f0aea69e0ecc0d7d0e7190e07916e`; `/en` returned HTTP 200. This governance-only change did not rebuild or restart the container.

## Diagnostic redaction correction and final local validation

The independent read-only audit identified that malformed operator-supplied JSON could place a parser excerpt in the CLI error and exception cause. A regression test first failed on a synthetic `SYNTHETIC_SECRET_SENTINEL` input. The parser now emits only the fixed `SyntaxError` message `Gate evidence must be valid JSON`, without including or retaining the underlying parser exception. The regression test confirms the exact safe message, absent cause, and absent input marker.

Validation after this correction used Node `22.19.0` and npm `10.9.3` after `npm ci`:

| Check | Result |
|---|---|
| Focused planner tests | PASS — 15/15. |
| `npm test` | PASS — 103/103 unit/governance tests, Astro build and no-binding guard, 7/7 Playwright tests. |
| `npm run lint` | PASS — zero warnings. |
| `npm run typecheck` | PASS — 44 files, zero errors, warnings, or hints. |
| `npm audit --audit-level=high` | PASS — zero vulnerabilities. |
| `git diff --check` | PASS. |
| GEF 1.1.2 `doctor` and `status` | Read-only commands succeeded with `effect: NONE`; result remains **REVIEW**, because this managed worktree reports `GIT_DIRECTORY_NOT_A_DIRECTORY` and `WORKING_TREE_NOT_OBSERVED`, dependency provenance is unverified, drift baseline is absent, and the operator snapshot is stale. |
| Planner CLI | M00 COMPLETE / 5%, 19 modules, Issue #6 open, five global gates pending, zero resource slots, no planner-eligible modules, no code authority. |
| Docker local smoke | Existing `coinblink-local-app-1` remained healthy on `127.0.0.1:3187`; `/health`, `/preview-status`, and `/en` each returned HTTP 200. No container was restarted or modified. |

Final code/test fingerprints (SHA-256):

| Path | SHA-256 |
|---|---|
| `scripts/plan-parallel-modules.mjs` | `34dfd6b4ba5ce199b40fe8e4ad575dafe115239552df6b8670fa4ac628830143` |
| `test/parallel-batch-planner.test.mjs` | `97181daac2483e7460d0d77b1a07811169d91cd65fe5079f0b6163acd2e87958` |

The final PR HEAD checks, SonarCloud findings, CodeRabbit review and Owner audit must be re-read after pushing this correction. This local validation does not authorize merge or module implementation.

## SonarCloud follow-up and final CLI correction

SonarCloud analyzed the pushed HEAD `9804b6be2b21420fcc65e321ddc68f4922969651`. Its Quality Gate passed and the earlier three findings were absent, but the exact new-code issue query returned one open issue:

| Rule | Severity / type | Exact prior line | Finding and disposition |
|---|---|---:|---|
| `javascript:S7785` | MAJOR / CODE_SMELL | `scripts/plan-parallel-modules.mjs:286` | Prefer top-level `await` over the Promise chain. Replaced the nested async `run()` plus `.catch()` chain with top-level `await` inside the direct-execution guard and a local `try/catch`. |

After this correction, the planner CLI executed successfully and continued to report M00 COMPLETE / 5%, 19 modules, five pending global gates, zero resource slots, no planner-eligible module slots, and no code authority. The `9804b6be` hosted result remains recorded as historical evidence; the next pushed HEAD requires fresh exact-HEAD SonarCloud and CodeRabbit reviews.

Validation after the top-level-await correction, using Node `22.19.0` and npm `10.9.3`:

| Check | Result |
|---|---|
| Focused planner tests | PASS — 15/15. |
| `npm test` | PASS — 103/103 unit/governance tests, Astro build and no-binding guard, 7/7 Playwright tests. |
| `npm run lint` | PASS — zero warnings. |
| `npm run typecheck` | PASS — 44 files, zero errors, warnings, or hints. |
| `npm audit --audit-level=high` | PASS — zero vulnerabilities. |
| `git diff --check` | PASS. |
| GEF 1.1.2 `doctor` and `status` | Read-only commands succeeded with `effect: NONE`; the managed worktree remains REVIEW for the documented repository-observation, dependency-provenance, drift-baseline, and operator-snapshot limitations. |
| Docker local smoke | Existing `coinblink-local-app-1` remained healthy at `127.0.0.1:3187`; `/health`, `/preview-status`, and `/en` returned HTTP 200 and reported app build SHA `9757772d145f0aea69e0ecc0d7d0e7190e07916e`. No container was restarted or modified. |

Final post-Sonar source fingerprints (SHA-256):

| Path | SHA-256 |
|---|---|
| `scripts/plan-parallel-modules.mjs` | `7a375f828256c7d2c9b51c06ba7d9f1d7c0189df333ec44e039b57bc126ee10c` |
| `test/parallel-batch-planner.test.mjs` | `97181daac2483e7460d0d77b1a07811169d91cd65fe5079f0b6163acd2e87958` |

## Full CodeRabbit review on `699cb29cd56d6dfac0f8be20c2b76a146768e6a5`

The full review covered all three PR files. It identified one verified parser edge case: when a bold `Status:` value is followed by same-line prose, removing a closing bold marker only at end-of-line caused the planner to reject an otherwise exact approved status. The regression test was first run red (14/15 pass); parsing now extracts the value up to the first closing bold marker before normalization and still requires exact `OWNER_APPROVED_GLOBAL / FROZEN`. A negative M00-only status followed by prose remains rejected.

The review also suggested clarifying the outstanding M05 Owner decisions; the opening readiness summary now says the single human Owner must document identity, recovery, MFA, and vault storage. Its resource-clamping note was non-actionable: `Math.min(slots, maxAgents)` cannot exceed observed host slots, and a non-positive memory reading throws and fails closed. The review's test comment was LGTM. This correction requires fresh exact-HEAD tests, hosted checks, SonarCloud and CodeRabbit review before audit or merge.

Validation after the full-review correction used Node `22.19.0` and npm `10.9.3`. An initial unpinned `npm test` on host Node 24 failed only the two GEF-version assertions (the pinned GEF test requires Node 22); the complete suite was rerun with the repository's pinned toolchain:

| Check | Result |
|---|---|
| Red regression before parser correction | PASS as a defect reproduction: 14/15 focused tests passed; the new approved-status-plus-prose assertion failed. |
| Focused planner tests after correction | PASS — 15/15. |
| `npm test` with Node 22.19.0 / npm 10.9.3 | PASS — 103/103 unit/governance tests, Astro build and no-binding guard, 7/7 Playwright tests. |
| `npm run lint` | PASS — zero warnings. |
| `npm run typecheck` | PASS — 44 files, zero errors, warnings, or hints. |
| `npm audit --audit-level=high` | PASS — zero vulnerabilities. |
| GEF 1.1.2 `doctor` / `status` | Commands succeeded read-only with `effect: NONE`; overall remains REVIEW because this managed worktree reports `GIT_DIRECTORY_NOT_A_DIRECTORY`, `WORKING_TREE_NOT_OBSERVED`, unverified dependency provenance, absent drift baseline, and stale operator snapshot. |
| Planner CLI | PASS, read-only/non-authorizing: M00 COMPLETE / 5%, 19 modules, Issue #6 open, five global gates pending, zero resource slots, no eligible modules, and no application-code authority. |
| Existing Docker smoke | `coinblink-local-app-1` remained healthy on port 3187; `/health`, `/preview-status`, and `/en` returned HTTP 200. The app SHA remains `9757772d145f0aea69e0ecc0d7d0e7190e07916e`; no container was restarted. |
| `git diff --check` | PASS. |

Final planner and regression-test source fingerprints (SHA-256):

| Path | SHA-256 |
|---|---|
| `scripts/plan-parallel-modules.mjs` | `7681b7919fed69a6507addab0c81d57d0c426d1ae03e9b248ffed7227bbaa2b5` |
| `test/parallel-batch-planner.test.mjs` | `e3288cc8a1f64e65d08b301b9b94856cb1952fe4a679888f5160b3d51de32fef` |

The hosted results on `699cb29cd56d6dfac0f8be20c2b76a146768e6a5` passed all seven checks, including SonarCloud with zero open new-code issues and a completed full CodeRabbit review. That review's verified parser finding was fixed after it, so all hosted checks, SonarCloud and full CodeRabbit review must be rerun on the new final HEAD. Owner audit/go-no-go is still required before merge; global gates and per-module admissions remain pending.

## Full CodeRabbit review on `1aed0d7032dd291c60203b6bead7232b0e8c0a8d`

The exact-HEAD review found one verified fail-open case in the parallel ADR gate: token membership accepted additional or contradictory status tokens. The canonical ADR currently says `PROPOSED / NOT_OWNER_APPROVED / NOT_ADOPTED`. The planner now exposes a pure status parser used by the CLI and accepts only exact `ADOPTED / OWNER_APPROVED`; it extracts the first current `Status:` line, removes its formatting, and rejects extra tokens or trailing prose. Regression tests cover the exact adopted value, current proposal, extra/negative tokens, trailing prose, and historical text. This changes no ADR status and grants no module authority.

The SonarCloud PR comment reports `0.0% Coverage on New Code`; the public PR measure API currently reports `new_lines_to_cover=0` and `new_uncovered_lines=0`, and the PR-specific open-issue query reports zero. The project test script runs `node --test` but does not enable Node coverage collection or configure an LCOV report for SonarCloud. The planner behavior is exercised by focused regression tests, but SonarCloud receives no attributable test-coverage report for the changed JavaScript. The Quality Gate passes; no coverage instrumentation or unrelated project-wide issue was added because it is not required by this governance-only correction. The repository-wide open-issue count is distinct from this PR's zero new issues.

This ADR-gate correction requires fresh local tests, exact-HEAD GitHub checks and SonarCloud, and another full CodeRabbit review before the Owner audit/go-no-go. The checkpoint and all module admissions remain unchanged.

## ADR-gate correction and local verification

After the ADR-status correction, the focused planner suite passed 16/16. Full validation used Node `22.19.0` and npm `10.9.3`: `npm test` passed 104/104 unit/governance tests, the Astro build and binding guard, and 7/7 Playwright tests; lint had zero warnings; typecheck passed 44 files with zero diagnostics; `npm audit --audit-level=high` reported zero vulnerabilities; `git diff --check` passed. GEF 1.1.2 `doctor` and `status` succeeded read-only with `effect: NONE`, with the same documented REVIEW/observation limitations. The current planner output remains non-authorizing with five global gates pending and zero resource slots.

Latest planner/test fingerprints before this evidence-only addition (SHA-256):

| Path | SHA-256 |
|---|---|
| `scripts/plan-parallel-modules.mjs` | `5fb94a4fc92c586d97a53aed2ea3eb01229788ef813ae93f2a86d2aab3749ba4` |
| `test/parallel-batch-planner.test.mjs` | `37363eaa86ef19be96be2b9f48cbd8642ed3020540b70bb6709f4ba5915824ea` |

The `1aed0d7` SonarCloud check passed with zero new issues. Its comment showed 0.0% new-code coverage; the public measure API returned zero new lines to cover and zero new uncovered lines. The repository test command does not collect Node coverage or configure an LCOV report, so this metric is not evidence that the planner tests were skipped; it is a coverage-attribution limitation. The behavioral tests exercise the planner. No unrelated coverage tooling was added to this narrow governance fix. Fresh exact-HEAD SonarCloud results are required after the ADR correction.
