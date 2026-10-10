# CB-GOV-PARALLEL-003 · Read-only multiagent execution preflight

**Status:** PROPOSED IMPLEMENTATION TOOLING (not admission/ADR adoption).
**Base main:** `9757772d145f0aea69e0ecc0d7d0e7190e07916e`, M00 COMPLETE/5%. **Owner direction:** maximum safe simultaneous Codex Desktop LOCAL agents, functional development as soon as admitted, local Docker visual loop and shared validated Cloudflare Preview.
**Non-mutation:** This CLI does not spawn Codex, admit modules, checkout a worktree, merge, deploy or touch paid services.

Run `node scripts/plan-parallel-modules.mjs` or `node scripts/plan-parallel-modules.mjs --max-agents 6` from the local repo. It reads the **canonical** `.engineering/CHECKPOINT.json`, the frozen **proposal** matrix (without changing history), and the active status of ADR-CB-0002. It reports the dependency-ready admission candidates separately from **actual code-authorized** agents.

**What is ready after M00?** The current *dependency-ready candidates* are M01 and M05. Both are NOT_ADMITTED; M01 still needs both byte-exact Golden images from Issue #5 and M05 requires documented one-human-Owner auth/recovery/MFA/secret strategy. The global V1 source pack and parallel ADR in Issue #6 remain unapproved. No module application code is authorized by this PR.

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

Candidate source SHA-256 fingerprints (before commit):

| Path | SHA-256 |
|---|---|
| `scripts/plan-parallel-modules.mjs` | `b757dd641ef5b82e6b46fb7bf4ade32eb6ee044034e260e5ef702f212b475ae4` |
| `test/parallel-batch-planner.test.mjs` | `034b720032276f686017aefe4af8d557a66c9443a9cbe3806997446f4c8bc2a8` |

Local validation used Node `22.19.0` and npm `10.9.3`:

- `npm ci`: 437 packages installed, 448 audited, 0 vulnerabilities.
- `npm test`: 95/95 unit tests pass; Astro build and binding guard pass; 7/7 Playwright checks pass.
- `npm run lint`: pass with zero warnings.
- `npm run typecheck`: 44 files, 0 errors, 0 warnings, 0 hints.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- GEF `doctor` and `status`: read-only commands succeeded with `effect: NONE`; repository observability is **REVIEW**, because this managed linked worktree reports `GIT_DIRECTORY_NOT_A_DIRECTORY` and `WORKING_TREE_NOT_OBSERVED`. GEF also reports unverified dependency provenance, an absent drift baseline, and a stale operator snapshot; this is not represented as a clean GEF PASS.
- `git diff --check`: pass.

Exact-head Ubuntu/Windows/Docker/SonarCloud/Socket checks, hosted CodeRabbit review, and final audit are evaluated on the pushed candidate SHA in the PR; this local Evidence Bundle does not pre-claim their results. The canonical checkpoint remains `M00_COMPLETE` at 5%; M01–M17 remain `NOT_ADMITTED`, and M18 remains `FUTURE_NOT_ADMITTED`.
