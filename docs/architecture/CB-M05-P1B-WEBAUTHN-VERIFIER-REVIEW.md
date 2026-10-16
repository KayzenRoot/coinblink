# CB-M05-P1B-VERIFIER-001 — WebAuthn verifier dependency selection candidate

**Status:** PROPOSED / NOT EFFECTIVE / docs-only security preflight. **Risk:** HIGH_ASSURANCE.
**Source main:** `2d59c065e5b55d9e3d68abc838007441e570cc48` after #86; **Owner:** KayzenRoot. **Related Work Order:** `CB-M05-P1B-LOCAL-001` (unchanged).
**Decision requested:** select a verifier candidate for a LOCAL, synthetic-only cryptographic WebAuthn test harness, NOT for public account/authentication deployment.

## Technical recommendation
**Candidate:** `@simplewebauthn/server` **exact version `14.0.3`** (do not use `^`, `~`, floating/latest or unreviewed newer version). Project `MasterKale/SimpleWebAuthn`, MIT; package and version readback as of 2026-10-16. The upstream 14.0.x documentation exposes `verifyAuthenticationResponse()` and `verifyRegistrationResponse()` and requires server-bound challenge, origin, RP ID and user verification. The upstream project states compatibility with Node LTS 22 and Cloudflare Workers, but this is *not* proof of runtime compatibility in CoinBlink's pinned Wrangler stack.

Read-only external evidence:
- Official usage: https://simplewebauthn.dev/docs/packages/server
- Latest published package status at evaluation: https://www.npmjs.com/package/@simplewebauthn/server (14.0.3 as observed, MIT, Node 22+)
- Upstream source/license: https://github.com/MasterKale/SimpleWebAuthn and https://github.com/MasterKale/SimpleWebAuthn/blob/master/LICENSE.md
- WebAuthn server verification implementation: https://github.com/MasterKale/SimpleWebAuthn/blob/master/packages/server/src/authentication/verifyAuthenticationResponse.ts
- Cloudflare crypto surface: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ and https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/
- Recent changelog: https://github.com/MasterKale/SimpleWebAuthn/blob/master/CHANGELOG.md
- External registry advisories snapshot: https://security.snyk.io/package/npm/%40simplewebauthn%2Fserver/14.0.3

## Why this candidate and not a homemade verifier?
- Project already pins Node `>=22.19.0 <23`, npm `10.9.3`, Wrangler `4.149.0` and `wrangler.jsonc` with `compatibility_date=2026-10-08` and `nodejs_compat`; the upstream library declares Node 22+ and Workers support. **Bundling and operation still require direct local execution proofs.**
- A maintained verifier handles signature, CBOR/COSE, challenge/origin/RP and UV checks. Manually combining `crypto.subtle.verify()` and ad hoc CBOR parsers would expand cryptographic review burden.
- The package is MIT, but NOTICE/license preservation must be confirmed in generated bundle/distribution before production.
- An optional browser helper is unnecessary for this **synthetic server-side harness**: do NOT add `@simplewebauthn/browser` to the public UI, create browser credentials, or add `/admin` routes in this increment.

## Security advisories / uncertainty
- Upstream `v14.0.2` changelog explicitly notes two CRL certificate-revocation fixes, GHSA-2g3p-m8c9-hhwh and GHSA-j3h4-m3m2-7p7j; the candidate 14.0.3 is newer than this patch. Older trust-chain advisory GHSA-6hxq-p678-4hr2 was patched in 13.3.2. Verify all fixes through package release material before approval.
- External Snyk snapshot reported zero *direct* advisories for 14.0.3 at research time. It **does not scan, rule out, or waive transitive vulnerabilities, unknown vulnerabilities, malicious changes or runtime-specific bugs**.
- Before an executable GO, the local executor must retrieve the exact npm tarball integrity/SRI plus registry metadata, inspect its dependency tree, lock deterministically, execute `npm audit --omit=dev` (and fuller audit with configured severities), compare GitHub security advisories / OSV / Snyk on the intended date, and stop for any HIGH/CRITICAL unresolved issue.
- Audit signature/COSE algorithms, EdDSA/PQC handling and FIPS/Worker support explicitly; prefer a conservative test matrix (ES256 first). Do not assume every offered algorithm works with the pinned Worker compatibility date. No silent flag/ruleset change.

## Needed preflight before tests
1. Refresh latest protected main, critical canonical blob fingerprints, and the new P1-B ADR/WO from PR #86. If the main moved, mark Context Lock STALE and re-evaluate relevant source deltas.
2. Obtain a **separate Owner exact-HEAD dependency and LOCAL harness GO**. This is a recommendation only, not a modification to `package.json` or `package-lock.json`.
3. Integration Steward owns a narrowly reviewed exact-version change to root package/lockfile *only if* an executable local harness requires it; no changes to Astro router, runtime, Worker config, GEF or production application. Existing Work Order's path ownership remains binding.
4. Generate disposable, isolated fake signing keys **at test runtime** (never Git-committed); derive clientDataJSON/authenticatorData signatures under the actual verifier API; negative checks for challenge mismatch, replay/expiry, origin/RP, type, UV/UP, wrong credential public key, wrong algo, tampered signed bytes and malformed CBOR/COSE.
5. Run `wrangler` with test-only config and `--local` for D1 one-use claim/revoke/session proofs. Record Node test and Worker-runtime compatibility separately. Reject any remote Cloudflare use or unexpected network access.
6. Re-run P0 MOCK and P1-A regressions, lint/typecheck/build, CI exact HEAD (Ubuntu/Windows/Docker/SonarCloud/Socket), security-negative tests and Evidence Bundle; keep all NOT_EXECUTED items visible until tested.

## Acceptance and stopping
**Review verdict now:** `CANDIDATE_RECOMMENDED / LOCAL_COMPATIBILITY_UNPROVEN / DEPENDENCY_NOT_INSTALLED / CRYPTO_TESTS_NOT_EXECUTED`.
Do NOT mark the general P1 secure-CMS ADR effective, invoke live WebAuthn, create credentials, install dependencies, provision D1 remote, expose privileged routes, deploy, publish, increase checkpoint or merge this proposal without explicit Owner SHA-scoped GO. This choice, if approved later, is only for the LOCAL P1-B cryptographic test harness, not production authentication.