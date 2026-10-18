# CoinBlink · Global Quality and Review Policy · CB-GOV-QUALITY-001

Status: **CANDIDATE: effective only after a separately authorized protected merge to `main`**.
Owner direction in project chat, 2026-10-18: adjust global engineering rules to resolve analysis-dialect false positives and unnecessary repeated review gates. This is a project-wide code-review policy proposal, not a Cloudflare/security/provider authorization or approval of a specific PR.

## 1. What stays mandatory

- Scope, ownership, immutable HEAD, critical fingerprints and the current effective Context Lock before editing.
- GitHub ruleset `coinblink-main-governance`: squash-only PR merge, up-to-date 7 required status checks (Ubuntu GEF, Windows GEF, Docker smoke, SonarCloud, Socket PR, Socket Project, CodeRabbit status), zero unresolved threads, no force-push to `main`.
- Meaningful secure-by-default tests and negative cases. Privileged auth, WebAuthn, D1 concurrency, sessions, provider permissions, payments, external writes, production routes, protected Preview/deploy, secrets, data migration and checkpoint promotion retain proportionate HIGH_ASSURANCE gates.
- KayzenRoot is the **only necessary human reviewer**. An automatic-review bot marked `success` but `SKIPPED` never counts as a substantive review. Exact final HEAD Owner squash merge GO remains explicit unless a future protected-approved decision specifically changes that control. No automatic merge is authorized by this policy.

## 2. Fast-path for low-risk engineering

1. For **documentation-only, isolated synthetic fixtures, mock UI, formatting and typo patches**, one Work Order and one durable acceptance report may cover all changes within its admitted surface. Do not manufacture approval rounds/duplicate issues/PRs for observations already resolved and verified.
2. Evidence may be **linked** to existing immutable CI, review or source provenance. Do not duplicate large log files into Git history when the exact run/HEAD remains accessible and test claims are verified.
3. An Owner may approve a bounded set of low-risk issues in a **single recorded decision**, retaining exact paths and STOP conditions. Do not infer new scope from a generic `continue`.
4. Tests need to be rerun on **every new final PR HEAD** if inputs change. Avoid relitigating already-cleared historic findings when unchanged exact evidence and CI remain valid.
5. Prioritize fixes that remove actual critical defects, authorization failures, races or CI breaks before prose-only gates. A passing Sonar Quality Gate does not erase open actionable critical vulnerabilities.

## 3. Static-analysis false-positive protocol

**Never globally disable SonarCloud, Socket, secret detection, all SQL, security rules or the Quality Gate.**

A finding is eligible for a *narrow analyzer mismatch exclusion* only if:
- It exists solely in a nonproduction, synthetic test fixture **and** is caused by a demonstrably incorrect language/dialect rule.
- Rule ID, severity/type, exact path/line, technical explanation and code/test proof are recorded.
- It is covered by executable tests in the protected CI; the exact path is excluded, not a file glob/directory containing product code.
- The Owner disposition is recorded. An exclusion **is not** a blanket waiver of new defects, security findings or independent authentication controls.
- A post-merge SonarCloud rerun actually verifies that the scoped setting took effect. If the four known findings persist, this configuration is **not** considered effective and the issue remains open.

### CB-M05 P1-C SQLite exception inventory

- File **only**: `test/modules/CB-M05/p1c-fixtures/schema.sql`.
- `plsql:S1192` ×2, CRITICAL-labeled **CODE_SMELL** on intentional unique-Owner `CHECK (owner_id = 1)`.
- `plsql:CreateOrReplaceCheck` ×2, CRITICAL-labeled **CODE_SMELL** on `CREATE TRIGGER`, correct SQLite syntax; SQLite rejects `CREATE OR REPLACE TRIGGER`.
- Root cause: Sonar parser treating SQLite fixture as PL/SQL. R98 technical triage and R101 issue-specific recommendation: https://github.com/KayzenRoot/coinblink/pull/128#issuecomment-6253816852.
- **Implementation proposal:** `.sonarcloud.properties` sets only `sonar.exclusions=test/modules/CB-M05/p1c-fixtures/schema.sql`. All production JS/TS, package dependencies, workflows and remaining analyzable repository files stay in scan scope.
- CI continues to load the fixture and verify D1 foreign keys, CHECK rules, triggers, migration replay, rollback, race recovery and authorization invariants. Git exclusion from static analysis does not weaken runtime/test checks.
- Exact issue dispositions in SonarCloud UI may additionally require a project administrator; no claim is made that GitHub commits can directly mark Sonar issue IDs `ACCEPTED`.
- Sonar `0.0% coverage on new code` currently indicates no ingested coverage report, **not** zero executed tests. Do not change coverage metrics or thresholds to disguise the missing ingestion. A separate properly scoped coverage-integration task is preferable.

## 4. R102/R103 relationship and safe activation

PR #128 remains an independent `HIGH_ASSURANCE` local synthetic CMS code proof. R102 recovery-challenge/session correction was tested on exact SHA `dfe4adb793fcd1ea99a0ac11e67f7f596cb4879c` with 462 Node and 48 Playwright passing per OS, 7/7 statuses; see https://github.com/KayzenRoot/coinblink/pull/128#issuecomment-6254043131.

**This global config PR must not modify #128's branch, approve it, merge it, deploy it, set `APPROVED_LOCAL_PROOF`, alter `.engineering/CHECKPOINT.json` or claim M05 DONE.** On an authorized, verified squash merge of this proposal into `main`, rerun and read back actual Sonar analysis for #128 on the changed base; if Sonar still reports four issues, choose an explicitly authorized SonarCloud project-level issue disposition or a separately validated configuration correction. No silent exceptions.

## 5. Progress and STOP

Canonical progress remains `M00_COMPLETE`, **5%** and `CHECKPOINT_DELTA={}`. The policy is **not effective until merged**. Required final: read back exact HEAD, ruleset, CI, security scope, links to evidence, and Owner explicit protected integration decision. No provider calls, subscriptions, paid resources, publication, secrets, deployment or checkpoint promotion.
