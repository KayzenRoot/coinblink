# CB-M05-P1A-LOCAL-001 · Local synthetic D1 execution evidence

**Status:** `LOCAL_SYNTHETIC_D1_CASES_PASS; FULL_REPOSITORY_UNIT_SUITE_INCOMPLETE`
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
- Test source bytes were measured before packaging this evidence document. SHA-256 values are recorded below; the final branch commit contains these same test and fixture bytes plus this report.

## Changed files and fixture fingerprints

All tracked changes are in the Work Order allowlist:

| Path | SHA-256 |
| --- | --- |
| `src/modules/CB-M05/p1a-local/guardrails.mjs` | `C526BBF62C14036220E2B05B8903DA02C4BE21CA39E23852F9197F9802B905FB` |
| `test/modules/CB-M05/p1a-guards.test.mjs` | `5EA9561CFB5B9084F7FE74C683DE5D67B21968BED3D5943F765537292532AEC5` |
| `test/modules/CB-M05/p1a-d1-local.test.mjs` | `3F8F48B03DDFC734BAEF857A4689AD29BC4819A5251DB193836F38F5A90DAA6E` |
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
- Wrangler D1 CLI commands are built only with `--local`, the dedicated fixture `--config`, a `.wrangler/p1a-local-state/**` `--persist-to` path, and `--json`. A fail-closed helper rejects `--remote`, `--preview`, account/profile/environment selectors, any other config path, or persistence outside the ignored fixture root.
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

Result: **10 tests passed, 0 failed** (`451,556 ms` reported by Node's test runner). The five fail-closed guard tests also passed in a separate invocation; all 15 targeted tests have passing evidence across the two runs.

| Case | Result | Direct observation |
| --- | --- | --- |
| `OWNER-01 / 2` | PASS | Two simultaneous independent workerd `dispatchFetch` requests crossed a barrier, wrote through local D1, and one unique Owner row remained. |
| `OWNER-01 / 10` | PASS | Ten simultaneous independent local D1 requests; exactly one Owner row remained. |
| `OWNER-01 / 100` | PASS | One hundred simultaneous independent local D1 requests; exactly one Owner row remained. |
| `REC-01` | PASS | Two different fake device IDs persisted; revoking the recovery device removed modeled recovery eligibility. |
| `CHAL-01` | PASS · model only | Wrong origin, wrong RP, expiry and replay left the fake nonce unconsumed; one valid consume succeeded once. No signature validation is claimed. |
| `SESSION-01` | PASS · model only | Only a synthetic SHA-256 digest was stored; the in-memory fake token was absent from query results; expiry and revocation denied modeled access. No cookie/session authentication is claimed. |
| `ARTICLE-01` | PASS | Expected revision 1 advanced to 2; the stale revision-1 writer did not change the article; one revision row was recorded. |
| `ARTICLE-02` | PASS | The synthetic audit trigger deliberately aborted the update; the original article stayed at revision 1 and no revision/audit row leaked through. |
| `RESTORE-01` | PASS | Synthetic seed counts matched, reset reached zero for the tested tables, and restore returned the expected counts. |
| `FAIL-01` | PASS | Invalid binding/config, `--remote`, oversized SQL input and inherited Cloudflare token variables were rejected before any remote fallback. |

The 2/10/100 concurrency proof uses the pinned Wrangler dependency's local Miniflare/workerd D1 runtime and separate simultaneously dispatched D1 requests, without listening on a network port. Other stateful contract cases use Wrangler D1 CLI with the explicit `--local`/fixture-config/ignored-persistence arguments. An initial experiment that launched many standalone Wrangler CLI processes hit SQLite `SQLITE_BUSY` contention and a Docker `unexpected EOF`; those process-launch attempts are not counted as passing evidence. The final request-level local D1 proof is the accepted result above.

## Local project checks

| Command | Result |
| --- | --- |
| `npm run lint` | PASS, `eslint . --max-warnings=0` |
| `npm run typecheck` | PASS, 50 Astro files, 0 errors, 0 warnings, 0 hints |
| `npm run build` | PASS; build completed and `assert-no-session-binding.mjs` reported no session/data/service/production bindings in the generated Wrangler config |
| `node --test test/modules/CB-M05/p1a-guards.test.mjs` / combined targeted run | PASS, 5/5 guard tests |
| `node --test test/modules/CB-M05/p1a-d1-local.test.mjs` | PASS, 10/10 D1 tests |
| `npm run test:unit` | **INCOMPLETE / LOCAL ENVIRONMENT BLOCKED**. It was run with network disabled and stopped before a final summary. Observed unrelated baseline harness failures: the image lacks checkout-local `node_modules/wrangler/package.json` and Git; exact-head/governance tests reported `git ENOENT`; the GEF CLI could not resolve from the checkout; and `test/gef-provenance.test.mjs` attempted `npm pack @gef-bootstrap/cli@1.1.2`, which timed out after 60 seconds with network disabled. No project test was changed to hide these issues, and no external fetch was allowed. Hosted PR checks remain necessary for exact-head repository validation. |
| `git diff --check` | PASS before evidence packaging |

An early combined targeted run hit the unchanged 60-second per-command limit while initializing the restore schema under concurrent test load (`14/15` in that invocation). The restore case passed in isolation, and the final isolated D1 suite passed `10/10`; no global timeout was increased.

## Explicit non-claims and stop state

- `WEBAUTHN_CRYPTOGRAPHIC_VALIDATION = NOT_EXECUTED`
- Real passkey registration/assertion, step-up authentication, secure cookies, session issuance, production authorization routes, vault encryption, real Owner identity and CMS publication remain `NOT_IMPLEMENTED` / `OUT_OF_SCOPE`.
- M05 P1 production implementation remains unadmitted. M05 is not marked DONE; checkpoint remains `M00_COMPLETE / IMPLEMENTATION_IN_PROGRESS / 5%` and was not edited.
- No merge, deploy, remote database, permission change, secret creation, or paid resource action occurred.
- Final branch commit SHA and hosted checks are recorded in the PR description after publication; this evidence records the immutable source-file fingerprints tested above.

**STOP CONDITION:** Submit the isolated test branch for KayzenRoot review and protected CI. Do not merge this PR or promote a checkpoint from these synthetic results.
