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

## Correction Delta · verified Sonar individual issue (2026-10-23)
The original PR HEAD `0104b0afe193e441894a561e76412f0255192302` had SonarCloud Quality Gate SUCCESS but **1 New issue**. The M05 diagnostic workflow had a stale PR #217 query. The only workflow delta in this work order changes the read-only SonarCloud PR query to `${{ github.event.pull_request.number }}`; no runner permission, dependency, production configuration, or gate was changed.

On diagnostic HEAD `18635a07bb03537d1867a35983b0946ff6f77aa4`, hosted [Actions job #120691977293](https://github.com/KayzenRoot/coinblink/actions/runs/40034939421/job/120691977293) queried the official public SonarCloud API for **PR #218** and returned:
- Key `AaFq6d6x15H_r3sx6u2V`, **`javascript:S6582`**, **MINOR**, `src/modules/CB-M03/source-transfer.mjs:47`: prefer optional chaining.
- **One-line exact correction**: `if (!specimen || specimen.mode !== 'MOCK' ||` → `if (specimen?.mode !== 'MOCK' ||`. Absent records still fail closed because `undefined !== 'MOCK'` is true.
- Same hosted Node 22.19.0 diagnostic: **12/12** bridge contracts PASS, **3/3** isolated BOOT-10 PASS with histogram `201=1,409=9`, workerd 2/10 PASS with `d1Failures {}`. Historical unrelated intermittent BOOT-10 under other load remains unproven to be impossible.
- [M03 hosted job](https://github.com/KayzenRoot/coinblink/actions/runs/40034752727/job/120691372672) on initial HEAD: **16/16 Node** and **2/2 Chromium** passed, including an actual browser JSON download with no foreign network.
- [M05 local Chromium job](https://github.com/KayzenRoot/coinblink/actions/runs/40034752800/job/120691374700) on initial HEAD: **40/40 guards** and **11/11 browser tests** passed, including the new M03→M05 explicit-Apply/zero-D1-write scenario.
- The exact replacement HEAD introduced by this correction MUST have its own CI/Sonar/Socket readback; old-HEAD evidence is not a substitute. `NOT_RUN` until confirmed.
- **Veredito:** `CORRECTION REQUIRED / PR DRAFT` while awaiting zero SonarCloud new issues and all required hosted checks. No fake APPROVED, no merge/deploy/gastos/LIVE.

## Vertical browser continuation · explicit Save and existing M05→M02 Markdown
Extended the same LOCAL WebAuthn/D1 browser scenario to assert a **zero-row D1 state after Apply**, then a distinct explicit **Save** creates exactly one persisted synthetic draft, followed by the original confirmed revision-export flow. The browser download is parsed with `parseLocalDraftMarkdown` used by M02, with original fictional source and draft-only safety flags intact. The browser test continues to scrub the inspected source on new draft and logout. **No code or new endpoint modified by this test-only delta**. New-HEAD CI / Chromium status remains `NOT_RUN` until verified; no merge authorized.
