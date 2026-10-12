# CB-M05 · Proposed LOCAL_D1_SPIKE Scope Delta (not executable)

**State:** REVIEW_REQUIRED / INACTIVE, 2026-10-12.
**Authorized action:** Owner requested preparation and review, **not a merge, migration or binding**.
**Base:** canonical main `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`.
**Reference:** [ADR-CB-0003](../../docs/architecture/ADR-CB-0003-M05-LOCAL-D1-DATA-BOUNDARY.md).
**Existing P0 implementation:** [M05 PR #59](https://github.com/KayzenRoot/coinblink/pull/59), HEAD `a20a4bd629c3beb29dcf1e45eeac8f04465b3b8c`; never presume this open PR is already in canonical main.

## Delta, and only after separate gates

- **Add one experimental substage:** `CB-M05-LOCAL-D1-SPIKE`; technical validation of **local development-only** article draft persistence via Wrangler D1 simulator.
- **Feature envelope:** create/list/load/update with optimistic revision checks; local migration and restart persistence; revision history and deterministic import/export; backing data exclusively synthetic test articles and HTTPS original-source pointers.
- **Delivery invariant:** the public demo and the Worker preview are not authenticated CMS services. Their published code must remain fixture/mock-only, with no reachable privileged write path. Real P1 cannot be claimed from a simulator.
- **Infrastructure:** reuse pinned Wrangler; isolated `--local` and `--persist-to`; never use `--remote`, dashboard provisioning, paid plans, cloud credentials, VPS or production Worker.
- **Permissions:** only module-owned interfaces/tests under M05 agent; **Integration Steward exclusively owns migrations, local binding/configuration, API/router, package manifests, Docker and CI.** Separate serialized evidence/approval for shared changes.
- **Denylist unchanged:** Owner sign-in, MFA/passkeys, session, vault, cloud database, publish, real news ingestion, user information, unlicensed texts, public mutations and paid services stay BLOCKED.
- **Rollback:** any simulated schema/state migration has a local, documented data snapshot/restore and failed migration test. No published data exists or is rolled back.
- **No impact on main checkpoint:** remains `M00_COMPLETE`, `completedThroughModule=CB-M00`, 5%, with M02/M03 `NOT_ADMITTED`, M18 `FUTURE_NOT_ADMITTED`. This proposed scope is *not* a new module completion, P1 admission, or checkpoint promotion.

## Reviews needed before a Codex task

1. Confirm competing governance PRs #46/#62/#65/#67/#69 do not change independent-review or owner/Steward responsibilities.
2. Validate the proposed ADR and the M05 Work Order/Context Lock additive amendments with the frozen SCOPE/ARCHITECTURE baseline. Those historical baselines are **not modified** by this proposal.
3. Obtain eligible independent review, six exact-head checks, Owner explicit go/no-go on ADR **adoption/merge**, and normal protected merge of the governance PR. No bypass.
4. Re-read *canonical* checkpoint and new main SHA after merge; regenerate execution lock (fingerprints/owners/file allowlist), then ask Owner for an explicit scoped **local D1 implementation** go/no-go.
5. Only then invoke Codex Desktop locally to execute the validated local-only plan. Stop on denied shared-file permission, uncertain local D1 CLI flags, remote binding or security ambiguity.

**This is a proposal. The current M05 P0 boundary is unchanged until the complete gate.**
