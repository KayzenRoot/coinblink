# Context Lock — CB-GOV-SOLO-001

**Status:** PROPOSED / ELEVATED / NOT EFFECTIVE
**Repository / PR:** `KayzenRoot/coinblink` / [#46](https://github.com/KayzenRoot/coinblink/pull/46)
**Source main SHA:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`
**R1 normal-merge commit:** `d9d6e54b1697387088cf33712037a70b3e8f2db2`
**Candidate branch:** `codex/cb-gov-solo-001`
**Risk:** ELEVATED; this proposal changes governance assurance rules.
**GEF:** Bootstrap `1.1.2`; pinned source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`; GEF ADR-0008 is upstream authority.

## Locked canonical sources at source main SHA

Hashes bind the raw Git blob at `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`; Git blob SHA-1 and SHA-256 are included. The candidate documents are not source fingerprints.

| Source | Git blob SHA-1 | Raw SHA-256 |
|---|---|---|
| `AGENTS.md` | `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7` | `4424180619660921939c73236ac1aa7ea2973787263e1314437b8be052ef713d` |
| `.engineering/SOURCE-HIERARCHY.md` | `38ede6577b26a1c73ee0ca7b24488e21e14ab4d5` | `4c5376e66b872ba1ab1c0b1e131d9a02c086dac3d76e4850fd2b7d800cc46921` |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` | `c2b9ef9f0c30f946f9287534305ad4f5f072875b9cfa5fe3e20b7442b45fa6f8` |
| `.engineering/CHECKPOINT.md` | `ad3d8aa36c0d310ba701f746820771119435947b` | `dac14bf9dfddae622fd72112c1a0bdabb55b8fa46d2370182af7ad2fa0ddd850` |
| `.engineering/SCOPE.md` | `80fa60e1557e2b4a46b10088eb83040662b39f04` | `c2c728d30d915dec287b56e9294aa59332fd6e56aaeb1f8f0554a890268d4ac9` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` | `19782491ab5f5dba185e4756f3b478760e31aa4f566aeae17e95d39fbcc15fe0` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` | `c61119f0f7c4df1ad4f051626a413b022cc5f8b934a56d2981b6afdc488323ed` |
| `docs/DECISIONS_LEDGER.md` | `d33b083a9fd31f9d7509e5a39f76f183cb961a3f` | `ae505b48f383ab929b827c0b54a57d243d00156e6173f09d0168ded881b42117` |
| `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` | `a8599fc7587e46e4a1d6869fc150803dbc8082eb` | `3dfeba7af7d4ab61e7737f52f19eb369efb62f57eaf26e89daac80a99cd1825d` |
| `docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md` | `57d6f502ae65fae1f4d6f027b2a92eeec33f4ee6` | `cfa4937121772eae4697bc3a8dd01f7e412dde48df9ba949b617f5e3ba813df6` |

## Current authority and status

Current checkpoint values are authoritative: M00 `M00_COMPLETE`, phase `IMPLEMENTATION_IN_PROGRESS`, 5%; M01/M05 `ADMITTED` but incomplete; M02–M17 `NOT_ADMITTED`; M18 `FUTURE_NOT_ADMITTED`; `activeWorkOrder=NONE`; no `stopState`. `ADR-CB-0002` is adopted on current main. Issue #45 owner direction authorizes preparation only. Issue #6 and each module's source-backed admission requirements remain distinct.

The active effective ruleset `coinblink-main-governance` ID `24888106` matches `refs/heads/main`, has no bypass actors, requires one eligible distinct GitHub approval, strict required statuses and squash-only merge, and blocks deletion/non-fast-forward. A classic branch-protection endpoint 404 is not used as a substitute for effective-ruleset evidence. Prior PR #46 checks, reviews, lock, and evidence at HEAD `342ae16be15d69250eb0ed004b77f9cc02140ede` are historical.

## Exact write boundary

Only these eight Git paths are permitted in this PR:
1. `.engineering/SOURCE-HIERARCHY.md` — additive reconciliation only
2. `docs/DECISIONS_LEDGER.md` — append-only CB-DEC-044 proposal record
3. `docs/architecture/ADR-CB-0003-SOLO-MAINTAINER-REVIEW.md`
4. `.engineering/work-orders/CB-GOV-SOLO-001.md`
5. `.engineering/context-locks/CB-GOV-SOLO-001.md`
6. `.engineering/evidence/CB-GOV-SOLO-001-CHECKPOINT-DELTA.md` — no-op only
7. `.engineering/evidence/CB-GOV-SOLO-001-EVIDENCE.md`
8. `.engineering/evidence/CB-GOV-SOLO-001-FINGERPRINTS.json` — self-excluded from file entries only

No checkpoint, Scope/Architecture/Security/DoD, workflow/verifier/test, application, secret, Cloudflare, or unrelated Work Order path may change. Trusted gate code requires a separate steward-owned Work Order/PR with explicit admission.

## Revalidation and stop conditions

Re-fetch GitHub before final audit. Any changed main, ruleset payload, base, source blob, risk or path set requires a refreshed lock, fingerprints, tests and audit. The proposal stays ineffective until qualified independent ELEVATED assurance, all exact-head checks/reviews, a real eligible approval under the active ruleset (unless a separately governed transition legitimately changes it), Owner exact-SHA GO/NO-GO, normal merge and canonical read-back. Never use force-push, self-approval, alternate Owner identity, admin bypass or a fabricated status. No module work or Cloudflare action is authorized here.
