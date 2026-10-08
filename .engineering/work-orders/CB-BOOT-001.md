# Work Order CB-BOOT-001 · GEF 1.1.2 + approved engineering skills

**Status:** ADMITTED FOR CODEX EXECUTION · NO PRODUCT IMPLEMENTATION  
**Risk:** STANDARD (toolchain and governance bootstrap)  
**Issue:** https://github.com/KayzenRoot/coinblink/issues/1  
**Repository:** `KayzenRoot/coinblink`  
**Branch:** `chore/cb-boot-001-gef-112`  
**Initial base:** `6efd4d9c8fd8f23e59ae572bd0dddc1c7c959bac`

## OBJECTIVE
Install and prove the official GEF Bootstrap CLI v1.1.2 inside this repository and make it reproducible from a clean checkout. After verification, install a narrowly scoped audited selection of Matt Pocock Codex skills. Stop before product documentation migration and implementation.

## CONTEXT
The CoinBlink product is an international (English primary, pt-BR/es secondary) cryptocurrency news portal. The user-approved logo and desktop dark home screenshot are visually canonical, but are not yet staged in Git. The product planning is still open. Public GitHub CI is desired but not quota-free or unlimited.

GEF 1.1.2 is a published GitHub release: https://github.com/KayzenRoot/gef-bootstrap/releases/tag/v1.1.2. Its release notes report npm provenance and package validation. Legacy README text may be stale: use **the exact release** and verify the registry artifact rather than assuming.

GEF `AGENTS.md` and ADR-0008 reserve implementation, test and CI authorship to Codex. GEF supersedes conflicting external skills.

## SCOPE
- Read-only discovery and preflight of existing repo, branch, files, permissions, toolchain and existing CI.
- Reproducible installation of **`@gef-bootstrap/cli@1.1.2`**, using Node.js 22 and a committed dependency lock file. Do not rely on global, unpinned CLI.
- Run documented `gef --help`, `gef --version`, `gef init --target . --json` preview, `gef doctor --target . --json`, and `gef status --target . --json` with truthful exit statuses. Governed `gef init --apply --target . --json` only if its preconditions are satisfied; never claim apply on preview evidence.
- Add appropriate GitHub CI validation for an exact fresh checkout and Windows compatibility. Pin dependencies and avoid injecting secrets in public logs. Configure tests so CI really checks the CLI; do not use dummy green checks.
- After GEF is **functionally demonstrated**, audit and install only relevant skills from `mattpocock/skills`. Initial candidates (not mandatory): `code-review`, `tdd`, `diagnosing-bugs`, `research`, `grill-with-docs`, `writing-for-agents`, `setup-matt-pocock-skills`. Prefer repository-local, reproducible installation or documented Codex plugin integration. Pin source commit and recorded file hashes; check external SKILL.md before allowing execution. Do not install the full catalogue automatically.
- Evidence, PR, exact-head review request, and proposed Checkpoint Delta.

## OUT OF SCOPE
- No homepage implementation, logos/SVG work, app scaffold, site deployment, backend/APIs, DeepSeek, JEV, X integration, or article generation.
- No importing historical CoinBlink Master or Visual Design Bible until the GEF and skill gate is audited APPROVED.
- No secret provisioning, account registration, forced merge, or automatic promotion of draft product decisions.

## FILES/SOURCES TO READ
1. `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, `.engineering/CHECKPOINT.md`, `.engineering/context-locks/CB-BOOT-001.md`.
2. `AGENTS.md`, ADR-0008 and `packages/cli/README.md` pinned to GEF source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`: https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/AGENTS.md, https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/.engineering/decisions/ADR-0008-CODEX-ONLY-GITHUB-FIRST.md, and https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/packages/cli/README.md.
3. https://github.com/KayzenRoot/gef-bootstrap/releases/tag/v1.1.2 and verified published package.
4. Matt Pocock's README and selected skill files pinned to commit `b0618bc436ad893b3c5e84e55fba86586d34a404`: https://github.com/mattpocock/skills/blob/b0618bc436ad893b3c5e84e55fba86586d34a404/README.md, plus the selected `SKILL.md` files, referenced documents and scripts. Inspect linked scripts and references.

## REQUIREMENTS
- Reproducible npm package, exact version, verified provenance and lock.
- GEF init/status/doctor not masquerading an unknown state as healthy. If apply is blocked, capture the blocker and stop before skills or docs.
- Effective skills available to Codex in repo or installed through supported Codex mechanism, with verification.
- Skills cannot modify the source hierarchy, DoD, approval gates or GEF rules.

## ARCHITECTURE RULES
- GEF governance is higher priority than a community skill workflow.
- Distinguish `installed`, `verified in CI`, `initialized for project` and `approved`.
- Commit deterministic state only; preserve any tool receipts separately without leaking system-specific machine paths or private data.

## CONSTRAINTS
No destructive operation, no force-push, no history rewrite. No action bypasses a failing required check. Use owner `KayzenRoot` for GitHub writes. If no installed Codex mechanism can authenticate or run, mark BLOCKED and provide a precisely bounded correction.

## ACCEPTANCE CRITERIA
1. A clean checkout can run `npm ci` using committed lockfile and `gef --version` returns **1.1.2**.
2. GEF help and diagnostic commands execute without missing vendor/assets; failure statuses are recorded honestly.
3. The preflight and `init --apply` reach a verifiable terminal result; if apply must be blocked on lack of canonical Source Pack, report `BLOCKED` and stop.
4. CI exercises the same declared commands, with results linked to the exact commit. Relevant Windows environment is checked.
5. Each installed Matt skill has an origin, commit, hash, security review, invocation mechanism, no authority conflict, and availability evidence.
6. PR contains Evidence Bundle, test results, base/head SHAs, changed files, risks, failures/corrections, and proposed Checkpoint Delta.
7. No product code or editorial content added.

## TESTS
- Static pin audit, `npm ci` fresh and (as applicable) Linux + Windows.
- `gef --version`, `gef --help`, `gef init` preview, `gef doctor`, `gef status`, safe `init --apply` where admitted.
- GEF state file schema/integrity, package provenance and lock integrity.
- Verify installed skills discoverable by Codex; forbid unsupported or untrusted instructions.
- Negative test: missing required context remains BLOCKED/UNKNOWN, not fabricated PASS.

## DELIVERABLES
Package metadata/lock, bounded GEF toolchain state, skill manifest, CI workflow(s), source fingerprints, change log, Evidence Bundle, PR, audit request, Checkpoint Delta proposal.

## REVIEW FORMAT
In Brazilian Portuguese: `WORK ORDER | BASE SHA | HEAD SHA | SCOPE | TESTS | CI | EVIDENCE | RISKS | VERDICT RECOMMENDATION | PROPOSED CHECKPOINT DELTA | NEXT LEGAL ACTION`.

## STOP CONDITION
Stop after objective implementation and test evidence is submitted on the same PR. **Do not merge or update canonical checkpoint by yourself.** If any HIGH/CRITICAL defect or missing GEF prerequisite remains, `BLOCKED` / `CORRECTION REQUIRED`, no successor work.

## PHASE 2 (NOT ADMITTED)
After owner exact-head APPROVED: install/import CoinBlink Master v0.6, CoinBlink Visual Design Bible v1.0, both original image masters and the product Source Pack; keep product planning OPEN. That is a separate increment.
