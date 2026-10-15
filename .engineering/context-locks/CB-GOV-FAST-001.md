# CB-GOV-FAST-001 — Candidate Context Lock (documentation-only)

**State:** PROPOSED / NOT EFFECTIVE. **Repository:** `KayzenRoot/coinblink`. **Base branch:** `main`. **Exact base commit:** `5a4e8c6872a48f3ce4095ecb7c111fcec92d3ac8` (verified 2026-10-15 against GitHub live main before branch creation).

## Verified immutable source anchors (Git blob SHA-1 at base)

| Canonical path | Git blob SHA-1 |
| --- | --- |
| `AGENTS.md` | `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7` |
| `.engineering/SOURCE-HIERARCHY.md` | `38ede6577b26a1c73ee0ca7b24488e21e14ab4d5` |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` |
| `.engineering/SCOPE.md` | `80fa60e1557e2b4a46b10088eb83040662b39f04` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` |
| `docs/DECISIONS_LEDGER.md` | `d33b083a9fd31f9d7509e5a39f76f183cb961a3f` |

**Machine checkpoint facts:** `schemaVersion=2`; `status=M00_COMPLETE`; `overallCompletionPercent=5`; `checkpointFacts.activeWorkOrder=NONE`; `CB-M01=ADMITTED`, `CB-M05=ADMITTED`; other not-admitted except M00; M18 future. No checkpoint edit allowed.

**Observed live ruleset (read-only):** ID `24888106`, `enforcement=active`, `required_approving_review_count=0`, required PR and squash merge, strict checks Ubuntu/GEF, Windows/GEF, Docker, SonarCloud, two Socket contexts and CodeRabbit, no bypass actors, branch deletion/non-fast-forward protection. CodeRabbit's `success` may mean *review skipped*, not verified substantive review. No ruleset modifications authorized by this docs PR.

## Candidate ownership and external conflicts

- **Write allowlist:** only `.engineering/proposals/CB-GOV-FAST-001-RISK-BASED-FAST-LANE.md`, `.engineering/work-orders/CB-GOV-FAST-001.md`, and `.engineering/context-locks/CB-GOV-FAST-001.md`.
- **Do not touch:** application, `main`, existing module branches/PRs, `.engineering/CHECKPOINT.json`, accepted source pack, ruleset, workflow, dependency manifests, Cloudflare, secrets, approvals/rights fields.
- PR #77 `e5e250985bade5ffdf975a735566969dcf874bb6`: BRAND Phase A demo-only draft; exact-head 6 hosted checks + CodeRabbit status passed, narrow technical COMMENT review was recorded separately. No merge.
- PR #58 `50f8dbd109c4362e7aea4b3ff3a2b84bfef59be5`: M01 Golden DEMO, 6 hosted checks successful; behind main, commercial rights #72 pending.
- PR #59 `289b1419fd7bf6e0896e1d69c96ab179b68cc482`: M05 P0 MOCK, 6 hosted checks successful; behind main, privileged P1 not admitted.
- **Source of Owner process-change request:** current 2026-10-15 instruction to flex repetitive GEF stages and accelerate, reserving deep audit to final project stage. This is **direction to prepare change**, not blanket consent for unsafe changes/merge.

## Invalidation / recovery

If the actual `main` commit, GEF version, governing content hashes, ruleset, Scope/DoD/Architecture or relevant ADR differs at implementation/merging time, mark candidate `STALE`, compare the actual delta, update this Context Lock with tested authoritative facts, and obtain a fresh exact-head audit. Do not blindly rewrite accepted upstream decisions. A successful local `doctor/status` is read-only evidence, never admission or approval.

**STOP:** draft docs PR only. Effective fast-lane policy requires Owner/admin specific authorized merge after exact-head CI and review; code-level automation and ruleset changes are separately scoped. Proposed checkpoint delta: NO_CHANGE.
