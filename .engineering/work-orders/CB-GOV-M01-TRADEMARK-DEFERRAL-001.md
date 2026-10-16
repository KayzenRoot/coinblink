# CB-GOV-M01-TRADEMARK-DEFERRAL-001 — M01 trademark filing deferral

**Risk:** STANDARD governance / ELEVATED potential launch-rights implications. **State:** CANDIDATE / NOT CANONICAL BEFORE OWNER-REVIEWED PROTECTED MERGE. **Owner directive:** 2026-10-16. **Frozen base main:** `c5077fadd053936fa83e3beff11097505b8a093c`.

## OBJECTIVE
Accelerate M01 technical DEMO completion by deferring formal Brazilian INPI trademark registration, fees, filing classes and comprehensive registrability paperwork to a future, need-driven business stage, without pretending that deferral grants rights to use third-party marks or assets.

## CONTEXT
M00 COMPLETE / 5%; M01 and M05 admitted within bounded scopes. M01 PR #58 is OPEN/UNMERGED; rights Issue #72 is OPEN with a reported lead of similar/earlier CoinBlink name use in a crypto-related field. Existing owner Route B proposal PR #80 prepares source-only DEMO integration, not deployment. Codex R75 M05 P1-B local HIGH_ASSURANCE work is in progress and must remain isolated.

## SCOPE
Documentation-only owner timing correction to canonical Scope, Definition of Done and Decisions Ledger. Clarify the difference between M01 **DEMO-only implementation/technical QA** and public/commercial release gates. Record the deferment as `CB-DEC-048`; retain `CB-DEC-001` and rights issue history unchanged.

## OUT OF SCOPE
No blanket waiver of third-party IP/license/source-provenance obligations; no statement that trademark use is risk-free or registered. No application code, M05/R75, PR #58/#79/#80, branch protection, tests/CI, deploy, secrets, third-party publication, commercial launch, checkpoint, module-completion promotion or merge authority change. No INPI fee, submission or external legal action.

## FILES / SOURCES TO READ
`.engineering/CHECKPOINT.json`; `.engineering/SOURCE-HIERARCHY.md`; `.engineering/SCOPE.md`; `.engineering/DEFINITION-OF-DONE.md`; `.engineering/REQUIREMENTS.md`; `.engineering/ARCHITECTURE.md`; `docs/DECISIONS_LEDGER.md`; `AGENTS.md`; `docs/architecture/contracts/CB-M01.md`; M01 PR #58; source-only PR #80; rights Issue #72; active ruleset #24888106.

## REQUIREMENTS
1. Formal INPI trademark filing/registration and comprehensive filing dossier must not block M01 DEMO-only build and technical QA; no implication that a registered trademark is needed for source-only demo implementation.
2. Maintain article/source rights evidence, applicable licensing of logo/art/fonts/icons and specific third-party assets actually reused. Retain Issue #72 as a risk record and do not falsely change `rightsReview` to `CLEARED`.
3. Preserve risk assessment before commercial public launch, including identified prior-name-use leads; filing can be postponed but possible third-party rights cannot be ignored.
4. Preserve existing Owner-only explicit final-head approval, strict seven protected checks, GEF 1.1.2 and module permissions.
5. Keep historical decisions and original master asset SHA identities untouched; record a new bounded decision instead of overwriting past approvals.

## ARCHITECTURE RULES
No executable architecture changes. M01 and M05 maintain separate ownership/worktrees/PRs; shared protected `main` integration remains serialized. M05 privileged authentication remains HIGH_ASSURANCE.

## CONSTRAINTS
English canonical documentation, Brazilian Portuguese review, zero commercial assumption from technical CI, no automated merges, no new public publication, no force-push, no change to security/legal controls by implication.

## ACCEPTANCE CRITERIA
A. Only five documentation paths touched: Scope, DoD, Decisions Ledger, this WO and its Context Lock.
B. Existing owner/product rights and module scope are preserved, with formal trademark filing deferred only for technical DEMO construction.
C. Issue #72 remains open and publication/commercial clearance is not asserted.
D. Diff/markdown hygiene audited, approved exact-HEAD CI successful, and explicit Owner decision applies to final immutable PR SHA.
E. `CHECKPOINT.json`, ruleset, product PRs, application and M05/R75 files untouched.

## TESTS
GitHub changed-path allowlist and source SHA compare; inspect diff for whitespace; readback of owner decision and rights constraints; protected exact-HEAD checks: Ubuntu/Windows GEF, Docker, SonarCloud, Socket ×2 and CodeRabbit status (skipped is not substantive review). Documentation-only; do not claim runtime tests were run locally here. If current main advances, perform a relevant source-delta freshness check before any merge.

## DELIVERABLES
This Work Order, a Context Lock, bounded source/DoD/ledger text, a DRAFT PR with delta-oriented Evidence Bundle in PR body/comment and proposed checkpoint delta `NO_CHANGE`.

## REVIEW FORMAT
Brazilian Portuguese: base/head SHA; changed paths; verified CI evidence; rights risk; APPROVED / CORRECTION REQUIRED / BLOCKED; exactly what is or is not authorized.

## STOP CONDITION
Stop at ready-for-Owner-review draft PR after exact-HEAD checks. Do not merge, approve or release M01/PR #58, publish/deploy the site, clear any rights, promote the checkpoint or touch M05/R75 as a consequence of this governance proposal.
