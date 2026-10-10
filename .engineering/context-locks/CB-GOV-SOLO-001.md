# Context Lock — CB-GOV-SOLO-001

**Status:** PROPOSED / ELEVATED / NOT EFFECTIVE UNTIL AUTHORIZED MERGE
**Repository:** `KayzenRoot/coinblink`
**Issue / PR:** [#45](https://github.com/KayzenRoot/coinblink/issues/45) / [#46](https://github.com/KayzenRoot/coinblink/pull/46)
**Source main SHA:** `b4ddb9891cc66cd3688b8e11a86abc75db4b8544` (PR #44 squash merge)
**Integration commit:** `19692990b3221875f6c0085321a7204e7f133224` (normal merge of updated `origin/main`; no rebase or force-push)
**Candidate branch:** `codex/cb-gov-solo-001`
**Risk:** ELEVATED; this proposal changes governance assurance rules.
**GEF:** Bootstrap `1.1.2`, source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`, ADR-0008.

## Locked sources at source main SHA

The hashes below are SHA-256 of the raw Git blob bytes at `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`; blob SHA-1 is included to bind each path to Git.

| Source | Git blob SHA-1 | Raw SHA-256 |
|---|---|---|
| `AGENTS.md` | `ac48525e1a586c65766922539d420fb8d37caccb` | `2c899a0ee1fd4b72f36b4e6446a5ff79f7662aed9c1a2766feba5bcc5cb9f68e` |
| `.engineering/SOURCE-HIERARCHY.md` | `503257fb6af2c7d95b59f92b4b68fe62a9b8b08f` | `4e9cd445ecd5f8448e88c3faec1e3a0fbf1674aa9bb9ee15b531d5f10d8decb2` |
| `.engineering/CHECKPOINT.json` | `595c1743006c07e5b9f7c4520b45ded647a5ea07` | `06d795102b453d3a446b0eaa4d26cf6be83f6471dc844d6bc7ef8f4823713d85` |
| `.engineering/CHECKPOINT.md` | `1f455d2c6392317a425587d3ae9ddf79bbf18470` | `5f572b1b2c75e08d6881494bffd61892f9121280e31ca6fbfa08e5c48b27587e` |
| `.engineering/SCOPE.md` | `f6b78727ec8aea1890aba2c36a42235cda8913cb` | `934239b1aeecc56a1f2ff59eb8d7f0583acc34592b8c899e6809f89389f07b60` |
| `.engineering/ARCHITECTURE.md` | `a1f13a450246217ee6d1cca70354f9ca8b3ac4e4` | `2fb75be7f99d061ff8c0e7c77c6d3138775249a18c317dfa652091a11b4dd179` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `.engineering/DEFINITION-OF-DONE.md` | `3804f6f521de9f5251c4329f4cc02b8e7ec2631e` | `4952f2b7ec9ac6479c0c3723054d521b702aeee0499130e2c1e12f658a98ac5d` |
| `docs/DECISIONS_LEDGER.md` | `79bc32e119fc7b9e4b45a8a082bf55ed46cb6eca` | `829477e61f57b1b39e2cb8aeb3e2361da1a4a5fb9f4ce03b925948839751a28b` |
| `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` | `1bc1f0627097c30d95faa2b1faaa6f74ba79acae` | `82255f331af4c383dea4ef1c2f567aaf4b8f261cb14f5ef4dfd26c65457bf4cd` |
| `docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md` | `07b8cde6542aef7ef4d4ddc2fe91cf8e5ba903d0` | `59de022a38b31e96fca3ce4c94f8182ff34a8a70568518cad0a72af9c512343e` |

## Authority and stale-source handling

The canonical authority order in `.engineering/SOURCE-HIERARCHY.md` applies. The older dated status narratives are retained as history; the current GitHub state and promoted checkpoint at the source SHA govern present status. At `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`, the checkpoint is unchanged: M00 `ADMITTED`, `IMPLEMENTATION_IN_PROGRESS`, `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, P1 `NOT_DEPLOYED`, overall progress `0%`; M01–M17 are not admitted and M18 remains future. This Work Order does not change that state.

The Owner's comment [#6091952619](https://github.com/KayzenRoot/coinblink/pull/44#issuecomment-6091952619) authorized only PR #44 at its exact reviewed SHA. Its terms do not themselves adopt this broader prospective policy. Review #5476676345 is a `COMMENTED` event by the PR author/Owner, not a different-human GitHub approval. No branch-protection or provider requirement may be bypassed.

If `main`, any locked source, the GEF source, reviewer requirements, or risk classification changes, stop. Refresh this lock and all fingerprints, re-evaluate the diff, and rerun exact-HEAD validation and assurance on the updated candidate. Do not amend or rewrite prior commits.

## Exact write boundary

Only these eight changed Git paths are permitted:

1. `.engineering/work-orders/CB-GOV-SOLO-001.md`
2. `.engineering/context-locks/CB-GOV-SOLO-001.md`
3. `.engineering/evidence/CB-GOV-SOLO-001-CHECKPOINT-DELTA.md`
4. `.engineering/evidence/CB-GOV-SOLO-001-EVIDENCE.md`
5. `.engineering/evidence/CB-GOV-SOLO-001-FINGERPRINTS.json` (self-excluded from its file entries only)
6. `.engineering/SOURCE-HIERARCHY.md` (additive clarification only)
7. `docs/DECISIONS_LEDGER.md` (append-only row only)
8. `docs/architecture/ADR-CB-0003-SOLO-MAINTAINER-REVIEW.md`

No tests, CI, application, product sources, canonical checkpoint, Scope, Architecture, Security, DoD, other ADRs, issues, or Cloudflare resources are in this branch's write boundary.

## Stop conditions

The proposal remains ineffective until qualified independent assurance of the ELEVATED exact-head diff, all required exact-head checks, closure of HIGH/CRITICAL findings, the Owner's explicit go/no-go for the final SHA, normal authorized merge, and canonical read-back. If the review is rejected or the Owner withdraws direction, correct or withdraw through a new governed change; do not silently reinterpret this proposal. No PR #41 changes, M00 completion, Cloudflare action, checkpoint promotion, M01+ code, or M18 token is authorized here.
