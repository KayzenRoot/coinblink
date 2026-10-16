# Context Lock — CB-M05-P1B-LOCAL-001

**STATE:** PROPOSED / NOT EFFECTIVE / INVALDATE ON CANONICAL CHANGE.
**Base:** `58321c21508bd6089de1c1a77c21f93a4f0b856a`. **Branch:** `docs/cb-m05-p1b-admission-001` (candidate). **Risk:** HIGH_ASSURANCE. **Owner:** KayzenRoot.

## Canonical main blob fingerprints
| Path | SHA-1 Git blob |
| --- | --- |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` |
| `.engineering/SOURCE-HIERARCHY.md` | `46b2f93c9cc65a468e33b16036e8c5627a442d4d` |
| `.engineering/SCOPE.md` | `80fa60e1557e2b4a46b10088eb83040662b39f04` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` |
| `.engineering/REQUIREMENTS.md` | `5d3d8c2c18ae0356f4d28a535265314c22600a41` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` |
| `docs/DECISIONS_LEDGER.md` | `d33b083a9fd31f9d7509e5a39f76f183cb961a3f` |
| `docs/architecture/contracts/CB-M05.md` | `2b35f56903bb00f9c4025eafb6b40d7265c26405` |
| `docs/architecture/ADR-CB-M05-P1-SECURE-OWNER-CMS-PROPOSAL.md` | `e5a0054773fa8f6c669ab3861f8cc71bcea73886` |
| `docs/architecture/ADR-CB-M05-P1A-001-LOCAL-SYNTHETIC-ADMISSION.md` | `6753274e2230a9f289711102fb9c4f341c839d33` |
| `.engineering/work-orders/CB-M05-WO-001.md` | `4f1f472f1abb2fb2dbdfbe3fc2d64d1126bba660` |
| `.engineering/work-orders/CB-M05-P1A-LOCAL-001-EXECUTION.md` | `0bdf501720becb0834294af6cd38a426062832fa` |
| `.engineering/evidence/CB-M05-P1A-LOCAL-001.md` | `b30c5745b4b97e956692738ff77c275baf1cdc23` |
| `package.json` | `77391db66af630f8dc8463f1c90f903356533322` |
| `.github/workflows/gef-validation.yml` | `d29833428c93e9c8479909255d285f61d839bdb1` |

## Authority and scope
Main currently has M00 COMPLETE/5%, M01 and M05 individually admitted (M05 P0 MOCK only). PR #59 P0 MOCK and PR #85 P1-A D1 local test evidence merged; nothing constitutes P1-B cryptographic proof or production auth. Existing M05 P1 Security/Data ADR is proposal only. Issue #12 R51 Owner selection of passkey plus independently enrolled second authenticator and D1 local P1-A is a design input, not a privilege grant. PR #82 established sole KayzenRoot human review. PR #67 governance candidate remains DRAFT and is not overwritten by these documents.

## Downstream execution preconditions
1. Exact-doc-HEAD protected CI pass, recorded Owner security audit, explicit exact SHA GO limited to local cryptographic proof and protected squash merge of this documentation admission candidate.
2. Canonical main readback after merge; new implementation branch and refreshed Context Lock. Freeze/review a maintained WebAuthn verifier and its supply-chain/compatibility before adding dependency or writing protocol code.
3. Restrict any future local executable changes to the WO allowlist. Separate Integration Steward authorization for packages/migrations/runtime/routes. Cloudflare production/network/resources and real credentials prohibited.
4. Treat source mismatches, changed ruleset, different SHA, unresolved crypto/third-party licensing, or substantive CI failure as STALE/BLOCKED; never silently rebase or skip high assurance.

## STOP
At this candidate phase the only allowed changes are documentation. No application code, test harness, GitHub ruleset, code merge, cloud operation, real passkey, private key file, publication or checkpoint promotion is authorized. CodeRabbit green/skipped is not substantive proof. Subsequent tests must be evidenced at their own exact source SHA.

## R72 context refresh proposal - 2026-10-16 (not yet effective)

**Immutable updated baseline:** `54d3f21bbfd34fef5b57d3acb84e11cc6800b60a` (protected main after PR #86 docs admission and PR #87 dependency evaluation). The original `58321c2...` base above is historical. **Until this R72 delta itself passes the required checks, gets Owner exact-HEAD GO, and merges, treat the existing implementation lock as STALE and NON_EXECUTABLE.** This addendum is not a GO to install or execute security code.

### Source fingerprints read directly on updated main

| Added/new relevant source | Git blob SHA-1 |
| --- | --- |
| `docs/architecture/CB-M05-P1B-WEBAUTHN-VERIFIER-REVIEW.md` | `efc33f126c7d0414f22c2ad625ecc7ccaa60767a` |
| `.engineering/context-locks/CB-M05-P1B-VERIFIER-001.md` | `61647432f535ac3dc1662d3a081baea1457d3f9d` |
| `.engineering/evidence/CB-M05-P1B-VERIFIER-001-PREFLIGHT.md` | `4883b501083ada38c2653de67b8538c2eab03b53` |
| `docs/architecture/ADR-CB-M05-P1B-LOCAL-001-CANDIDATE.md` | `4579a8c95abc52d378633234011e96a798c4bc6e` |
| `.engineering/work-orders/CB-M05-P1B-LOCAL-001.md` (pre-R72) | `35f37f93e9d0dd2a402083742e1bf6fee1fd8133` |
| `docs/architecture/CB-M05-P1B-LOCAL-TEST-MATRIX.md` | `13c22ef24b398f8f8e67517465cf381716a4a5df` |
| `test/modules/CB-M05/p1a-d1-local.test.mjs` | `b6177afc76fe0374792912e68ea81d1dbfe753a3` |
| `test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc` | `1451364bf371213133508f6fbe65cef2df41dfba` |
| `package-lock.json` | `bf984890253d1fc09c8cda60adf98c10e9ec4e15` |

The original 16 source fingerprints above must also be verified in the next preflight; they remain historical anchors, not a license to ignore a source change. Git source/file paths are authoritative; no chat-derived hash substitutes for a live Git readback. `package.json` was verified at `77391db66af630f8dc8463f1c90f903356533322`, and the shared root `wrangler.jsonc` at `980a4af6a5c3cd40a37797ad53d27530a54bbbe2`. Future executor must refresh the baseline again if the main moves (including any merging of PR #67/#58/#77/#79/#80).

### Run-gate and source policy

PR #87 documented **`@simplewebauthn/server@14.0.3` as a CANDIDATE**, MIT, Node >=22, upstream-stated Cloudflare Workers support; this is not dependency approval, license/supply-chain verification of transitive dependencies, or executed compatibility. The current evaluator environment reports Node 22.16.0, below this repository's `>=22.19.0 <23` engine, and registry npm access failed with `EAI_AGAIN`. No tarball SRI, npm full audit, Node/Workers runtime test or WebAuthn cryptographic assertion is credited.

Preflight for Codex Desktop LOCAL: check current main, Node engine, pinned npm/Wrangler, and exact source fingerprints. Then perform **read-only** dependency metadata/security review; if actual install, package/lockfile change, or test code is needed, require **separate Owner execution/Integration Steward path GO**, not an interpretation of this doc merge. Pin an approved exact dependency version, verify tarball SRI and provenance, audit all direct/transitive dependencies, and fail closed on HIGH/CRITICAL or unsupported Workers behavior. Preserve no-real-credential/no-remote-D1/no-deploy boundary and `CHECKPOINT_DELTA={}`.

**R72 STOP:** documentation candidate only. No execution authorization is implied by writing or later merging this addendum.
