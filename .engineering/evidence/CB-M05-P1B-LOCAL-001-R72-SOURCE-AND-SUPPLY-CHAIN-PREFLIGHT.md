# CB-M05-P1B-LOCAL-001 / R72 - Source and supply-chain preflight

**Status:** READ-ONLY VERIFIED + UNEXECUTED TESTS / DRAFT / HIGH_ASSURANCE.
**Main base:** `54d3f21bbfd34fef5b57d3acb84e11cc6800b60a` after PRs #86 and #87. **Work Order:** `CB-M05-P1B-LOCAL-001` (same stable ID). **Owner:** KayzenRoot.
**Delta:** only source Context Lock and Work Order correction plus this Evidence Bundle. No code, package manifest, dependency, test harness or cloud change.

## Grounded GitHub main evidence

- `.engineering/CHECKPOINT.json` Git blob `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be`: `M00_COMPLETE`, `overallCompletionPercent=5`, `activeWorkOrder=NONE`. M01/M05 admitted only in bounded scopes, M05 real privileged code still gated.
- PR #59 P0 MOCK and #85 P1-A fake D1 tests already merged. #86 approved and integrated the P1-B *candidate docs*, not real authentication. #87 merged only SimpleWebAuthn *candidate evaluation docs*. New test results cannot inherit validity from either docs PR.
- `package.json` blob `77391db66af630f8dc8463f1c90f903356533322` pins Node `>=22.19.0 <23`, npm `10.9.3`, Wrangler `4.149.0`; `package-lock.json` blob `bf984890253d1fc09c8cda60adf98c10e9ec4e15`; `wrangler.jsonc` blob `980a4af6a5c3cd40a37797ad53d27530a54bbbe2`.
- `test/modules/CB-M05/p1a-d1-local.test.mjs` blob `b6177afc76fe0374792912e68ea81d1dbfe753a3`, local fixture `test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc` blob `1451364bf371213133508f6fbe65cef2df41dfba`, **not** to be replaced in P1-B.
- `main` at `54d3f21bbfd34fef5b57d3acb84e11cc6800b60a` push checks all five applicable completed/success (GEF Ubuntu+Windows, Docker, SonarCloud, Socket Project Report). This verifies the preceding docs merge only. Context Lock fingerprint details are in the companion file.

## External public read-only package assessment (2026-10-16)

- `@simplewebauthn/server@14.0.3` is npm's current fixed release at time of research, MIT, published 2026-09-25, supports Node LTS 22.x; upstream lists Cloudflare Workers as a supported runtime. References:
  - https://www.npmjs.com/package/@simplewebauthn/server
  - https://simplewebauthn.dev/docs/packages/server
  - https://github.com/MasterKale/SimpleWebAuthn
  - https://jsr.io/@simplewebauthn/server/versions
- npm lists ten **direct** production dependencies: `@hexagon/base64`, `@levischuck/tiny-cbor`, `@peculiar/asn1-android`, `@peculiar/asn1-ecc`, `@peculiar/asn1-rsa`, `@peculiar/asn1-schema`, `@peculiar/asn1-x509`, `@peculiar/asn1-x509-post-quantum`, `@peculiar/x509`, `reflect-metadata`. Actual transitive resolution is unknown until a lockfile is generated and inspected.
- Public Snyk reports **zero known direct vulnerabilities** on 14.0.3 at query time, explicitly excluding its dependencies: https://security.snyk.io/package/npm/%40simplewebauthn%2Fserver/14.0.3 . Do not translate this into a complete audit.
- The upstream changelog documents GHSA-2g3p-m8c9-hhwh and GHSA-j3h4-m3m2-7p7j CRL/certificate revocation fixes in 14.0.2; historical attestation-chain GHSA-6hxq-p678-4hr2 fixed in 13.3.2. Candidate 14.0.3 is newer but requires direct reproducible supply-chain verification. https://github.com/MasterKale/SimpleWebAuthn/blob/master/CHANGELOG.md
- Exact npm registry tarball integrity/SRI, provenance signatures and complete dependency advisories were NOT verified in this read-only session. Runtime bundling and cryptographic tests were NOT executed.

## Current execution environment boundary

The assistant's temporary container reports Node `v22.16.0`, npm `10.9.2`. Both differ from the repository's pinned engine/package-manager, so it cannot be used as a positive compatibility proof. A read-only `npm view @simplewebauthn/server@14.0.3 ...` attempt failed due to registry DNS `EAI_AGAIN`. There was no fallback to unaudited copies; **no installation** took place. Codex Desktop LOCAL must verify its own runtime, installed package registry and real test results.

## Evidence ledger

| Obligation | Actual state | Follow-up |
| --- | --- | --- |
| Canonical main/checkpoint readback | PASS | Recheck after other PRs merge |
| Public package version/license/upstream docs | PASS_READ_ONLY | Confirm against exact npm tarball |
| Package SRI/provenance and lockfile | NOT_EXECUTED | Integrity and reproducibility check |
| Full direct+transitive audit incl. dev dependencies | NOT_EXECUTED | `npm audit --json` and OSV/GHSA cross-check |
| Node 22.19+ and pinned Wrangler worker compatibility | NOT_EXECUTED | Local env execution required |
| WebAuthn signed registration/assertion and negative tests | NOT_EXECUTED | Real signatures, not Boolean mock |
| D1-local atomic nonce/session/recovery tests | NOT_EXECUTED | Wranglers' local emulator |
| M05 P0, P1-A regression on implementation HEAD | NOT_EXECUTED | Re-run after actual code change |
| Hosted exact-HEAD CI for this R72 PR | PENDING | GitHub run after branch creation |
| Privileged P1 product/auth/cloud/deploy | NOT_AUTHORIZED | Future separate gates |
| Checkpoint Delta | `{}` | M00_COMPLETE / 5% unchanged |

**Verdict:** `SOURCE_PREFLIGHT_READY / DEPENDENCY_CANDIDATE_READ_ONLY / IMPLEMENTATION_BLOCKED_PENDING_EXPLICIT_OWNER_GO`.
**STOP:** DRAFT proposal cannot install dependencies or execute P1-B crypto/security code; do not classify a successful docs CI as cryptographic proof.
