# CB-P0-SOURCE-TO-DRAFT-001 · Evidence Bundle

## Scope and Context Lock
- **Baseline**: `KayzenRoot/coinblink` main `f4d0c3b3b198a936e3ea9fb40bb940d26a22fe73`.
- **Branch**: `feat/cb-p0-source-to-draft-001`. Initial commits `12111b76a784db51fab8fda98a1fcf26753e4f55`, `2f5c0dad115a19a22c3a12b54131eb11ab83ec2d`.
- Local-only M03 → M05 transfer; existing M05 → M02 Markdown export unchanged.
- Protected main, PR #209 ECC HEAD `9fe08404b7896295fafd64a8e01feba2926ff044`, all other PRs, rulesets, checkpoint, production deployment, external services and real identity are **out of scope**.

## Functional implementation
1. **M03 producer**: uses pre-existing canonical `listSyntheticSources()` (exactly alpha/beta/gamma) to emit a versioned, bounded JSON report via an ordinary browser download, with no HTTP request. Record includes exact source identity and label, URL, unchanged source license/status, `MOCK`, `NOT_CLEARED`, `NOT_CAPTURED`, `NO_DIGEST` and `publiclyUsable=false`.
2. **Shared contract** `src/modules/CB-M03/source-transfer.mjs`: exact-key structural checks, version, byte budget (2048), explicit three-ID allowlist, catalog match on label/URL/license/status, https-only `example.test` URL, default refusal for unknown rights or capture. No credential, registry update, network or publish capability.
3. **M05 private consumer**: embeds the trusted canonical three-row source catalog from M03 at LOCAL UI build time. File inspection is only in the existing authenticated WebAuthn/D1 local fixture form. File read has a session/generation guard and is cleared on logout, draft switching and fresh editor. Report is displayed inertly via `textContent`. Only a separate **Apply** button plus confirmation changes the *unsaved* source URL field; no implicit POST/PATCH, Owner approval, licensing grant or CMS save.
4. **Existing path**: M05 still requires separate explicit save and later uses the merged canonical persisted-revision Markdown export for manual M02 private preview. Nothing publishes content.

## Test inventory / negative cases
- `test/modules/CB-M03/source-transfer.test.mjs`: canonical 3-source roundtrips; forged rights/availability, capture/digest, URL and label, wrong IDs/versions, fields, oversized or malformed JSON, catalog spoof, immutable in-memory result, no side effects.
- `e2e/m03-source-demo.spec.mjs`: actual Chromium mock source download; exact filename, source catalog contract, no foreign requests, no writes.
- `test/modules/CB-M05/p1c-local-admin-preview.test.mjs`: real synthetic Owner passkey + LOCAL D1 and browser. Denial before login, invalid-license rejection, valid inspect without touching form/D1, cancel then explicit Apply, no D1 rows before Save, clear on new draft and logout, zero blocked network requests.
- **Requested CI**: Node 22.19.0, npm lint/typecheck, Build, M03 unit+Chromium, M05 WebAuthn/D1+Chromium, integrated M01–M05, SonarCloud zero new issues/hotspots, Socket, Gitleaks, reviewdog and PR Assurance. Keep flags: `NOT_RUN` until actual GitHub job logs are read for the final HEAD.
- The full project unit suite has historical prerequisite issues under unsupported Node 26 and missing M01 evidence fixtures; do not conflate with new P0 failures.

## Release gates
**Current verdict: IMPLEMENTATION CANDIDATE / NOT APPROVED.**
No merge or deploy authorized. Require exact-HEAD checks, no actionable security finding, PR Draft, evidence of negative paths, explicit per-PR Owner merge authorization, and mandatory compatibility with the unmodified ECC PR #209.
Historical SonarCloud LCOV new-code coverage mismatch remains known (0.0% reporting vs generated focused LCOV). This change does not adjust the scanner, suppress rules or claim global coverage.

## STOP
No LIVE provenance, licensed content, source crawling, network fetch, scheduling, D1 remote, production Owner login, external publication or costs.
