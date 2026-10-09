# ADR-CB-0002 · Controlled Parallel Module Delivery

**Status:** `PROPOSED / NOT_OWNER_APPROVED / NOT_ADOPTED`
**Work Order:** `CB-GOV-PARALLEL-001`
**Base main:** `27015adc87caacabbed0e318f892644ce0473f10`
**Scope:** proposed scheduling and integration mechanics for the existing 19 modules CB-M00–CB-M18 only. This ADR does not approve product functionality, architecture choices, new modules, paid services, deployment, or any module admission.

## Context

The repository has 19 planned module IDs and 19 corresponding issues, but only CB-M00 is canonically admitted. The checkpoint at the base records M00 P0 local implementation, P1 pending, Preview `NOT_DEPLOYED`, and 0% project completion. Global product Scope/Architecture/DoD decisions remain open in Issue #6. The roadmap says one critical-path Work Order at a time and prohibits undocumented parallel changes to shared critical-path files. Issue #6 contains a proposed wave schedule but has no separate Owner approval for changing that delivery rule.

The source-of-truth comparison also identifies schedule details that need an explicit resolution before adoption: M03/M04/M11 have direct prerequisites in their planned Work Orders that are omitted from Issue #6's compact DAG; M15's “critical launch modules” wording is open-ended; M17 is placed in Wave C while its planned Work Order integrates with M08 evidence and M07 social exports. See the matrix and operating model for the bounded proposed reconciliation. No existing Scope, Architecture, DoD, Decision Ledger entry, or historical Context Lock is modified by this proposal.

## Proposed decision

If the Owner approves this ADR and its prerequisites are promoted under GEF, allow independent **same-wave authoring** only for individually admitted module Work Orders whose exclusive path manifests and frozen contracts are disjoint. Keep the current Issue #6 wave set and 19-module inventory. Preserve one full Work Order and one PR per cohesive module.

Every admitted module Work Order receives one Codex Desktop local agent, one fresh managed worktree, one uniquely named branch, one frozen Context Lock, an exclusive file allowlist, module tests, an Evidence Bundle, and its own PR. No module agent shares a writable checkout or changes another module's owned paths. Shared routing, layout, contracts registry, schemas/migrations, dependency manifests, runtime/deployment configuration, CI, and governance sources are reserved for a separately authorized Integration Steward Work Order.

Permit contract and mock preparation before module code admission only as labelled proposals and deterministic local fixture specifications. Application/runtime code, migrations, live provider integrations, credentials, publication, payments, deployment, and completion claims require canonical module admission first.

Independent same-wave PRs may be developed concurrently, but merges stay serialized on `main` until a merge queue is explicitly configured and its exact `merge_group` tree is validated by CI. Every main update requires open PRs to incorporate current main without rewriting history, then repeat exact-head CI and review. No auto-merge, bypass, self-approval, or last-writer-wins conflict resolution.

## Proposed prerequisites for effect

This ADR becomes effective only after all of the following are separately verified and approved:

1. M00 satisfies its complete admitted DoD, including the corrected-main protected Preview and exact-SHA evidence; its checkpoint/evidence closeout is reviewed and Owner-authorized.
2. The Owner resolves the global Scope/Architecture/DoD decisions and explicitly changes the roadmap's one-critical-path rule, if desired.
3. The 19-module matrix, dependency/merge gates, source contracts, file ownership map, and this ADR pass independent review, Owner audit, exact-head CI, and normal authorized merge.
4. Each future module is individually admitted with a fresh base SHA, approved module scope/contract, verified dependency SHAs, external gates, Work Order, Context Lock, file fingerprint manifest, tests, evidence fields, and stop condition.
5. Repository CI validates the exact Work Order change-path set and runs exact-head module checks. Merge queue use is prohibited until `merge_group` is present and verified; otherwise the serial merge rule remains mandatory.

These prerequisites are not satisfied by this candidate PR. In particular, M00 P1 and the global Issue #6 approval remain open. GitHub currently has no `main` branch protection or ruleset; required reviews and checks must be established and verified before adoption. An Environment deployment approval is not independent code review.

## Proposed wave and interface rules

The schedule is recorded in `.engineering/proposals/CB-GOV-PARALLEL-001-MODULE-MATRIX.json`. It contains exactly M00–M18. Direct prerequisites from existing planned Work Orders are retained even where transitive through a wave. M17 may begin isolated work in Wave C only after its M08 evidence interface is frozen; its final cross-module integration/merge waits for the M07 social-export contract. M15 is gated on the explicit set M01/M02/M03/M04/M05/M06/M09/M10/M14, plus M13 policy checks if ads are enabled.

`.engineering/proposals/CB-GOV-PARALLEL-001-CONTRACT-REGISTER.json` records proposal-only producer seams and consumers for each module. It intentionally does not define runtime schemas: the planned WOs do not yet contain approved IDs, lifecycle, provenance, license, consent, error, and compatibility contracts. M05 is a high-fan-out producer; the Article/Story/Source/Claim/Evidence/Correction/Translation model and ownership boundaries remain open. Other shared seams include M03 source provenance, M04 market observations, M06 analytics events, and M17 media assets. The register calls out the M05 multi-author/single-human-Owner conflict and M13 admin-route inconsistency for resolution before those interfaces are frozen.

The producer owns its canonical versioned interface. Consumers cannot edit it silently. Contract-breaking changes require producer/consumer review, compatibility tests, steward arbitration, and an ADR when shared architecture or schema changes. Fakes are deterministic, local, clearly synthetic, run with no provider credentials or external network, produce zero provider calls, and test failure and fallback cases. Evidence labels separate `MOCK` and `LIVE`; no fake is used as live evidence.

No database migration is allowed without a separate approved database ADR and Work Order naming one owner for the shared migration history/manifest, requiring unique migration IDs, and proving apply/rollback against an isolated database. Separate module folders do not prevent conflicts in a global migration sequence.

CB-M18 remains `FUTURE_NOT_ADMITTED`, outside executable waves; legal, custody, chain, tokenomics, security and explicit Owner go/no-go gates are separate. This ADR cannot mint, deploy, trade, or transact a token.

## Consequences

**Benefits:** independent admitted work can progress in parallel without sharing mutable worktrees; producer/consumer changes become reviewable; the source-of-truth change set and exact tests are traceable per PR.

**Costs and risks:** path separation alone does not eliminate semantic or integration conflicts; stale same-wave branches require updates and full reruns; the Integration Steward may become a bottleneck; the current CI lacks a verified merge-queue job. If path or dependency claims cannot be proven, work is serialized rather than forced through.

**No current operational change:** until the status is promoted, current canonical admission and scheduling rules remain unchanged. M00 continues as the only admitted implementation; this PR does not launch or authorize M01+.

## Rejected alternatives

- **Unrestricted parallel module branches:** rejected because shared routes, contracts, schemas, dependency files, and checks have no ownership enforcement and the product-wide decisions are open.
- **Keep parallelism undocumented:** rejected as a target state because it obscures file ownership and base-SHA compatibility; the existing serial critical-path rule remains in force until this proposal is explicitly adopted.
- **Merge several PRs concurrently without a merge queue:** rejected because individually green PR checks do not prove the combined main tree.

## Evidence and review

See `.engineering/work-orders/CB-GOV-PARALLEL-001.md`, `.engineering/proposals/CB-GOV-PARALLEL-001-OPERATING-MODEL.md`, and `.engineering/evidence/CB-GOV-PARALLEL-001-EVIDENCE.md`. The checkpoint delta is intentionally a no-op proposal: preserve M00 in progress, P1 not deployed, 0%, M01–M17 unadmitted, and M18 future/unadmitted.
