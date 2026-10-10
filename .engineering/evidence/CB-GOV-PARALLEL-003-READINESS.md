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
