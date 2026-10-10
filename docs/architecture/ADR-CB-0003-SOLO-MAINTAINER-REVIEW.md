# ADR-CB-0003 — Solo Maintainer Review and Owner Acceptance

**Status:** PROPOSED / OWNER DIRECTION AUTHORIZED / NOT EFFECTIVE UNTIL GOVERNANCE MERGE
**Work Order:** CB-GOV-SOLO-001; **Issue:** #45
**Owner intent:** Explicit authorization to establish a bounded solo-maintainer exception on 2026-10-09. This is not a representation that GitHub emitted `APPROVE` by a distinct reviewer.
**Compatibility:** GEF pinned ADR-0008, CoinBlink Source Hierarchy, ADR-CB-0002. No changes to product scope, deployment, provider authorization, or module admissions.

## Context
CoinBlink is currently a one-human-maintainer repository. GitHub does not accept an author's own formal PR approval. PR #44 (STANDARD, tests/governance-only) has exact-head green checks, code-review findings closed and an objective technical review by a different non-authoring reviewer role, recorded as `COMMENTED` on the author's linked GitHub account. An explicit different-human GitHub `APPROVE` cannot be substituted by an assertion or a bot status. The historical requirement for *independent audit* remains; this ADR narrows the **form** of acceptance for LOW/STANDARD risk only, after canonical promotion.

## Decision for LOW and STANDARD changes
The sole Owner may issue **explicit, reviewable acceptance for the exact PR HEAD** when all are true:

1. One stable admitted Work Order and frozen/current Context Lock define the change; no expansion outside its permitted paths or approved Scope/Architecture/DoD.
2. Executor and auditor are separated by role. The auditor inspects actual diff/source, accepted interfaces, error paths, security and regressions; it records a factual review verdict and limitations. A different assistant/tool reviewing read-only may satisfy this *technical* separation only if it did not implement that change. Automated CI/CodeRabbit alone does not replace the objective audit.
3. Risk classification is evidenced. Any ambiguous or elevated-impact behavior is escalated, never downclassified to obtain this exception.
4. Exact-head required CI, security/static analysis, unit/integration/E2E as appropriate, Evidence Bundle, reviewer findings and any correction delta are PASS/closed. No known HIGH/CRITICAL defect remains.
5. GitHub status is reported exactly: a review attributed to the PR author or a `COMMENTED` record is **NOT_INDEPENDENT_GITHUB_APPROVE**. Never impersonate independent human approval, manufacture a bot APPROVE, disable protections, merge against GitHub refusal, or bypass a required status. If GitHub actually requires an independent GitHub APPROVE, stop for a real eligible reviewer.
6. The Owner records an explicit SHA-bound go/no-go and authorizes normal non-force merge. Post-merge main SHA, tests and checkpoint effects are read back. Corrections stay in their Work Order/PR when safe.
7. This policy is prospective only after its own approved/authorized merge; a one-off Owner authorization of PR #44 is separately recorded in that PR and is not generalized retroactively.

## Exclusions: ELEVATED and HIGH_ASSURANCE
This exception **does not apply** to money/billing/trading, Web3/signature/custody, privileged authentication, irreversible actions, production infrastructure changes, cloud resource creation/deletion or plan/billing modifications, destructive database migrations, security-critical code, major governance rule reductions or suspected critical/high defects. These require the original independent qualified review, additional proof obligations, separate Owner/provider authorization and rollback/roll-forward evidence. A governance rule change itself is classified ELEVATED and therefore requires its own stricter assurance at adoption. An unresolved gate yields BLOCKED.

## Parallel modules and Cloudflare
This decision does not admit M01–M17, change M18 FUTURE, activate ADR-CB-0002, approve global Issue #6, finish M00, change Cloudflare/GitHub connection, or create Workers. Module WOs still need their individual admissions; merges remain serialized on main pending a verified merge queue. Existing protected Preview, account/cost/IAM and no-production-binding checks remain mandatory.

## Rejected alternatives
- Pretend author `COMMENTED` is formal GitHub `APPROVE`: rejected as inaccurate.
- Create a second identity solely to rubber-stamp: rejected as not independent.
- Disable required checks/branch protection: rejected.
- Adopt unconditional auto-merge of all risk classes: rejected.
- Keep every safe documentation/test PR indefinitely blocked due to absent second human reviewer: rejected as target workflow after safe approval and promotion.

## Evidence and activation
Issue #45 and PR #44 owner-exception note document the user's decision; PR #44 technical assessment and CI establish the bounded example but not approval of this ADR. This ADR is only effective after exact-head review, risk-appropriate gate verification and recorded Owner-authorized merge with canonical read-back. No checkpoint/module status is automatically promoted. Existing GEF source policy takes precedence if a conflict cannot be resolved.
