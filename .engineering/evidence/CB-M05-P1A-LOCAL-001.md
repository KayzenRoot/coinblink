# CB-M05-P1A-LOCAL-001 · Local synthetic D1 execution evidence

**Status:** `R65_CORRECTIONS_IMPLEMENTED; LOCAL_GUARDS_AND_D1_PASS; FULL_REPOSITORY_UNIT_SUITE_ENVIRONMENT_LIMITED`
**Scope:** test-only local D1 emulator proof. This is not production authentication, real WebAuthn validation, a CMS release, or checkpoint completion.

## Source and admission readback

- Repository: `KayzenRoot/coinblink`
- Issue: [#84](https://github.com/KayzenRoot/coinblink/issues/84)
- Base branch: `main`
- Verified `origin/main` and local `main` before branch creation: `9cf67520eab258c226d774ae01015f083c04294b`
- Admission PR: [#83](https://github.com/KayzenRoot/coinblink/pull/83), `MERGED` at `9cf67520eab258c226d774ae01015f083c04294b` by `KayzenRoot`
- R64 in Issue #84 authorizes GitHub fetch/push/PR activity and local synthetic D1 tests while continuing to prohibit Cloudflare remote access.
- PR #83's exact-head Owner comment review inspected `77d8a5130c6bc9faa0cdfd963b384d4e8b2c303e`; its six hosted execution checks passed. CodeRabbit's required status reported that automatic review was skipped; it is not represented as a substantive review. The protected merge and main readback satisfy the admission sequence described by R64.
- Work Order and Context Lock source fingerprints were read from the updated main. Their `00ac6c...` values identify provenance; current execution base is the verified `9cf6752...` main.
- Execution branch: `codex/cb-m05-p1a-local-001-tests`
- R65 review: [PR review 5540023823](https://github.com/KayzenRoot/coinblink/pull/85#pullrequestreview-5540023823), against prior PR HEAD `3cbfc0aa4321187ae1c42fe8e12f4f5a50f14a9f`.
- R65 scope stayed within the admitted local test harness: strict D1 CLI argument validation, its negative tests, synthetic local D1 concurrency assertions, and this evidence file.
- Test source bytes were measured before packaging this evidence document. SHA-256 values are recorded below; the final branch commit contains these same test and fixture bytes plus this report.

## Changed files and fixture fingerprints

All tracked changes are in the Work Order allowlist:

| Path | SHA-256 |
| --- | --- |
| `src/modules/CB-M05/p1a-local/guardrails.mjs` | `21F69FEB3A53FEA64E3214D6A81E9AEB4C04D322B8DBB6427617FEB28B72FC1F` |
| `test/modules/CB-M05/p1a-guards.test.mjs` | `ECA27006B273342D3D863E2D51AD7AB7098C4370FA4B66C8FB20A887108D1295` |
| `test/modules/CB-M05/p1a-d1-local.test.mjs` | `A392987BF45DD10088039F1473EDCB1B06BF26106C86104AA85407D89052C408` |
| `test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc` | `3A5B37AD621F467885B6AAA79909EFC64CAAB3795B52999E4E1DB602509F0C66` |
| `test/modules/CB-M05/p1a-local-fixtures/schema.sql` | `537CEB262E559612BDD3F71D31F729F849F006D7C9EC13323D2A6D678A238959` |
| `test/modules/CB-M05/p1a-local-fixtures/seed.sql` | `D7203E172E85638419A0BB0EC374377DCD8EA33292A795C0868CF1BBE0B6D4BE` |

The local fixture declares exactly one synthetic `CB_M05_P1A_LOCAL` binding with reserved ID `00000000-0000-4000-8000-000000000084`; no account ID, credential, production binding, route, zone, or `remote` option is present. The root `wrangler.jsonc` was read-only and unchanged. `.wrangler/p1a-local-state/**` is Git-ignored; a generated state file was checked with `git check-ignore`. No local database file is tracked.

## Execution environment and isolation

- Date: 2026-10-15
- Host: Windows checkout; execution ran in a local Linux Docker container with `--network none`, `--memory=2g`, and `--cpus=2`.
- Container image: `coinblink-m01-r26-app:latest` (already present locally)
- Node.js: `v22.19.0`; npm: `10.9.3`
- Wrangler: `4.149.0` (matches repository pin)
- Miniflare: `5.20261006.1-alpha`, using its local workerd runtime
- Fixture compatibility date: `2026-10-13`, the newest date supported by the bundled local workerd binary at execution time.
- The test guard accepts only this exact 11-token command grammar: `d1 execute CB_M05_P1A_LOCAL --local --config test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc --persist-to .wrangler/p1a-local-state/<run-id>/<case> (--command <bounded SQL>|--file <exact schema.sql or seed.sql>) --json`. It rejects unknown or duplicate arguments, alternate `--flag=value` forms, remote/preview flags, account/profile/environment selectors, option-like input values, absolute paths, traversal, and unapproved fixture paths before Wrangler is invoked.
- No Worker listener, Pages server, remote D1, Cloudflare login/API, real credential, paid service, deployment, or external network access was used.

## D1 local results

Final isolated command:

```text
docker run --rm --network none --memory=2g --cpus=2 \
  -e WRANGLER_SEND_METRICS=false -e NO_UPDATE_NOTIFIER=1 -e CI=1 \
  -e P1A_WRANGLER_JS=/app/node_modules/wrangler/bin/wrangler.js \
  -v <execution-worktree>:/app/project -w /app/project \
  --entrypoint node coinblink-m01-r26-app:latest \
  --test test/modules/CB-M05/p1a-d1-local.test.mjs
```

Result: **10 tests passed, 0 failed** (`141,630 ms` reported by Node's test runner). The six fail-closed guard tests passed separately (`6/6`); all 16 targeted P1-A tests passed across the two final-state runs.

| Case | Result | Direct observation |
| --- | --- | --- |
| `OWNER-01 / 2` | PASS | Two independent local workerd requests crossed the barrier; exactly one returned HTTP 201 `owner-created` with `changes=1`, one returned explicit HTTP 409 denial, and the D1 table contained one Owner. |
| `OWNER-01 / 10` | PASS | Ten concurrent local D1 requests; exactly one returned HTTP 201 `owner-created` with `changes=1`, nine returned explicit HTTP 409 denial, and the table contained one Owner. |
| `OWNER-01 / 100` | PASS | One hundred concurrent local D1 requests; exactly one returned HTTP 201 `owner-created` with `changes=1`, 99 returned explicit HTTP 409 denial, and the table contained one Owner. |
| `REC-01` | PASS | Two different fake device IDs persisted; revoking the recovery device removed modeled recovery eligibility. |
| `CHAL-01` | PASS · model only | Wrong origin, wrong RP, expiry and replay left the fake nonce unconsumed; one valid consume succeeded once. No signature validation is claimed. |
| `SESSION-01` | PASS · model only | Only a synthetic SHA-256 digest was stored; the in-memory fake token was absent from query results; expiry and revocation denied modeled access. No cookie/session authentication is claimed. |
| `ARTICLE-01` | PASS | Expected revision 1 advanced to 2; the stale revision-1 writer did not change the article; one revision row was recorded. |
| `ARTICLE-02` | PASS | The synthetic audit trigger deliberately aborted the update; the original article stayed at revision 1 and no revision/audit row leaked through. |
| `RESTORE-01` | PASS | Synthetic seed counts matched, reset reached zero for the tested tables, and restore returned the expected counts. |
| `FAIL-01` | PASS | Invalid binding/config, `--remote` and `--remote=true`, `--env=prod`, unknown/duplicate flags, `--` separator, unauthorized/absolute/traversal paths, option-like SQL input, oversized SQL, and inherited Cloudflare token variables were rejected before any D1 invocation. |

The 2/10/100 concurrency proof uses the pinned Wrangler dependency's local Miniflare/workerd D1 runtime and separate simultaneously dispatched D1 requests, without listening on a network port. Exactly one response per run reports a committed row (`changes=1`); every other response is an explicit denial (`owner-already-claimed` with `changes=0` or `contention-rejected` for local SQLite contention). Other stateful contract cases use Wrangler D1 CLI with the explicit `--local`/fixture-config/ignored-persistence arguments. An initial experiment that launched many standalone Wrangler CLI processes hit SQLite `SQLITE_BUSY` contention and a Docker `unexpected EOF`; those process-launch attempts are not counted as passing evidence.

## Local project checks

| Command | Result |
| --- | --- |
| `npm run lint` | PASS, `eslint . --max-warnings=0` |
| `npm run typecheck` | PASS, 50 Astro files, 0 errors, 0 warnings, 0 hints |
| `npm run build` | PASS; build completed and `assert-no-session-binding.mjs` reported no session/data/service/production bindings in the generated Wrangler config |
| `node --test test/modules/CB-M05/p1a-guards.test.mjs` | PASS, 6/6 guard tests |
| `node --test test/modules/CB-M05/p1a-d1-local.test.mjs` | PASS, 10/10 D1 tests |
| `npm run test:unit` | **113 passed / 21 failed of 134** in the offline local image. Failure traces include missing system Git/GEF CLI support and missing Playwright Chromium; `test/gef-provenance.test.mjs` attempted `npm pack @gef-bootstrap/cli@1.1.2` and timed out at its existing 60-second limit with `--network none`. This full-suite result is environment-limited, not reported as green. No tests or gates were suppressed; the focused 6 guard and 10 local D1 tests passed separately. Hosted exact-HEAD CI remains required. |
| `git diff --check` | PASS before evidence packaging |

The R65 negative guard regression first failed on the old validator because `--remote=true` produced “Missing expected exception”; the new concurrency assertion first failed because zero responses reported `changes=1`. After the fixes, the final guard suite passed `6/6`, and all 2/10/100 local D1 requests were classified as exactly one creation plus explicit denials. No timeout or remote access was added. An earlier combined targeted run hit the unchanged 60-second per-command limit while initializing restore under concurrent test load (`14/15`); restore passed in the final isolated D1 suite.

## Explicit non-claims and stop state

- `WEBAUTHN_CRYPTOGRAPHIC_VALIDATION = NOT_EXECUTED`
- Real passkey registration/assertion, step-up authentication, secure cookies, session issuance, production authorization routes, vault encryption, real Owner identity and CMS publication remain `NOT_IMPLEMENTED` / `OUT_OF_SCOPE`.
- M05 P1 production implementation remains unadmitted. M05 is not marked DONE; checkpoint remains `M00_COMPLETE / IMPLEMENTATION_IN_PROGRESS / 5%` and was not edited.
- No merge, deploy, remote database, permission change, secret creation, or paid resource action occurred.
- Final branch commit SHA and hosted checks are recorded in the PR description after publication; this evidence records the immutable source-file fingerprints tested above.

**STOP CONDITION:** Submit the isolated test branch for KayzenRoot review and protected CI. Do not merge this PR or promote a checkpoint from these synthetic results.
