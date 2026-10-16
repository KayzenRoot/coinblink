# CB-M05-P1B-VERIFIER-001 — Supply-chain preflight Evidence Bundle

**Status:** DOC-ONLY CANDIDATE, not an effective product/security decision. **Base main:** `2d59c065e5b55d9e3d68abc838007441e570cc48`. **Scope:** one WebAuthn server-side verifier version evaluation and Context Lock, no npm package changes, no code. **Checkpoint Delta:** `{}`.

## Repository facts actually read
| Item | Verified value |
| --- | --- |
| Canonical CHECKPOINT | `M00_COMPLETE` / 5%, activeWorkOrder NONE; unchanged |
| Source hierarchy | Owner KayzenRoot solely reviews; PR/squash, required checks, source locks and security gates remain |
| P1-B docs admission | PR #86 merged to `main=2d59c065e5b55d9e3d68abc838007441e570cc48` |
| `package.json` Git blob | `77391db66af630f8dc8463f1c90f903356533322` |
| Node / npm | `>=22.19.0 <23` / `npm@10.9.3` |
| Wrangler | Pinned `4.149.0`; `wrangler.jsonc` main Git blob `980a4af6a5c3cd40a37797ad53d27530a54bbbe2` |
| Workers compatibility | `2026-10-08`, `nodejs_compat` declared |
| P1-B WO Git blob | `35f37f93e9d0dd2a402083742e1bf6fee1fd8133` |
| P1-B ADR Git blob | `4579a8c95abc52d378633234011e96a798c4bc6e` |

## Read-only upstream evidence and interpretation
- npm and upstream docs: `@simplewebauthn/server` 14.0.3, MIT, Node 22+; SimpleWebAuthn README names Workers as a supported runtime. This is *stated support*, not tested CoinBlink compatibility.
- Upstream changelog 14.0.2 describes security fixes for two certificate-revocation GHSAs. 14.0.3 is newer; package tarball and advisories must be rechecked when actually installed.
- Snyk public metadata reported zero **known direct** advisories at snapshot time, but no transitive npm dependency audit or OSV scan was actually executed in this read-only review.
- Cloudflare docs expose Web Crypto/Node crypto, but no Worker/Miniflare/Wrangler harness verification has run in this session.

## Objective verification ledger
| Obligation | State | Exit evidence to require |
| --- | --- | --- |
| Main/source Git blob readback | PASS | GitHub connector returned immutable blobs listed above |
| External package docs/license and version | PASS_READ_ONLY | Upstream and npm public links in companion evaluation |
| Exact package tarball integrity / npm lock | NOT_EXECUTED | npm metadata/integrity + committed deterministic lock on separately approved implementation branch |
| Direct and transitive advisory scan | NOT_EXECUTED | full `npm audit --json` and independent OSV/GHSA review on exact lockfile |
| Installed Node 22 and Wrangler local parity | NOT_EXECUTED | actual local Node + Workers/Miniflare/Wrangler harness logs |
| Real signed WebAuthn registration/assertion | NOT_EXECUTED | generated disposable keys and real verifier API |
| All P1-B negative tests | NOT_EXECUTED | actual WA/REC/OWN/SESSION/CSRF matrix PASS/FAIL/NOT_EXECUTED rows |
| D1 local transactional tests | NOT_EXECUTED | `wrangler ... --local --config` with isolated fake state |
| Security / CI on eventual implementation HEAD | NOT_EXECUTED | required exact-HEAD checks and Owner risk review |
| Product real auth / remote D1 / deploy | NOT_AUTHORIZED | separate admission and go-live, not part of this increment |

## Proposed reviewer outcome
`CANDIDATE_RECOMMENDED`, limited to exact version 14.0.3 **for developer-local proof only**. Security dependency and LOCAL harness execution require explicit Owner GO on the final candidate SHA, updated Context Lock, reviewed Integration Steward dependency lane and reproducible tests. This PR changes exactly three Markdown files (verifier evaluation, Evidence Bundle and Context Lock) and must stay DRAFT until reviewed. No fake claim of implementation, no change to M01 rights, M05 product completion or checkpoint.