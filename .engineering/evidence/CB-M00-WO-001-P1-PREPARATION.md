# CB-M00-WO-001 · P1 Worker Preview Preparation Evidence

**Change:** P1 preparation only

**Base:** `954b4db2d6dff3798e76fd4d75d6bccaf24b0876` (`origin/main`)

**Branch:** `codex/cb-m00-preview-json-fix`

**Candidate HEAD:** published in the PR description and exact-head check run links after commit; this file deliberately avoids a self-referential commit hash.

**Context Lock:** `.engineering/context-locks/CB-M00-WO-001-P1-PREPARATION.md`

**Fingerprints:** `.engineering/evidence/CB-M00-WO-001-P1-PREPARATION-FINGERPRINTS.json`

## Objective and boundary

Prepare a fail-closed, manual-only Cloudflare Worker Preview lane for admitted M00 P1. At the time of the original PR #37 preparation, no Cloudflare operation had been authorized or performed. A separate explicit Owner authorization was later provided on 2026-10-09; the provider actions and their current evidence are recorded below. The canonical checkpoint, admitted Work Order, original execution Context Lock, and M01–M18 governance remain unchanged. M00 completion remains 0% and is not declared done.

## Source and compatibility evidence

- Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current checkpoint, admitted Work Order, immutable execution Context Lock, Issue #36, Astro/Wrangler config, and existing CI/tests before editing.
- Base `origin/main` and the fresh branch start point both resolve to `954b4db2d6dff3798e76fd4d75d6bccaf24b0876`.
- `package-lock.json` pins Wrangler `4.149.0`; installed Astro is `7.3.8` and `@astrojs/cloudflare` is `14.3.4`. The adapter peer requirements are Astro `^7.2.0` and Wrangler `^4.125.0`, so both installed versions satisfy them.
- The source Worker remains `coinblink-m00-local`. Preview configuration is explicitly empty, `--ignore-base-config` is required, and automated checks reject unreviewed settings, sessions, production/resource bindings, non-empty variables, and any non-empty Preview bindings. Only the approved static `ASSETS` binding is allowed.
- Official references: [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), [Preview configuration](https://developers.cloudflare.com/workers/previews/configuration/), [Preview getting started](https://developers.cloudflare.com/workers/previews/get-started/), [Preview resource isolation](https://developers.cloudflare.com/workers/previews/resources/), [static Worker headers](https://developers.cloudflare.com/workers/static-assets/headers/), and [Cloudflare GitHub Actions security guidance](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).

## Implemented preparation controls

- Added a separate P1 Context Lock bound to the exact main SHA and raw source fingerprints; a test validates all frozen base fingerprints.
- Added explicit noindex metadata and `X-Robots-Tag`; `robots.txt` permits crawling so crawlers can read those noindex signals. Noindex is not access control; only public demonstration content is in scope.
- `/preview-status` reports `cloudflarePreview: "preview"` only in the exact preview build environment; local and ordinary CI builds report `not-deployed`.
- Added configuration safety checks against both source Wrangler config and Astro-generated Worker config, including the adapter's normalized empty defaults. Windows `127.0.0.1` and Linux `localhost` are accepted as loopback; wildcard binds are rejected.
- Added a manual-only GitHub Actions workflow, exact-current-main guard immediately before each provider operation, Owner/environment/plan/zero-cost/IAM/dedicated-Worker/isolation/credential gate, run-derived Preview names, output validation, exact-SHA health and preview-status smoke contract, and name-scoped rollback. It uses the locked Wrangler binary already installed by npm ci.
- Cloudflare credentials are absent from the read-only preflight job. The protected job passes them to its authorization step and to the conditional Wrangler Preview create/delete steps. The workflow never uses `pull_request_target`, `wrangler deploy`, or version upload.
- Added deterministic policy, config, workflow, Wrangler-output, smoke-contract, and Context Lock tests.
- The canonical-main guard logs only fixed success/failure messages and never forwards API or error text; deterministic regressions verify both paths without network access and ensure malformed multiline identity input cannot enter CLI output.

## Owner review corrections · PR #37

- Corrected `scripts/record-preview-output.mjs` to consume the nested stdout JSON emitted by the pinned Wrangler `4.149.0` CLI: `runPreview` logs `{ preview, deployment }` for `--json`, while the separate `writeOutput` event is a flattened output-file format. The pinned source and [Cloudflare's Preview automation example](https://developers.cloudflare.com/workers/previews/examples/) agree on this distinction. The parser verifies the returned Preview ID/name, deployment ID/Preview linkage/name, the dedicated Worker identity encoded in each `workers.dev` hostname, exactly one URL per resource, HTTPS-only origins, and distinct stable/deployment URLs.
- Replaced the flattened mock with a representative Wrangler 4.149.0 nested CLI-response fixture. Regressions cover wrong Worker, wrong Preview name, mismatched Preview linkage/deployment ID, duplicate URLs, malformed or unsafe origins, and rejection of the unrelated flattened output-file event.
- Inspected local `wrangler preview --help` and `wrangler preview delete --help` at the pinned `4.149.0`, with metrics disabled and no provider credentials or API calls. The CLI help exposes `--ignore-base-config` as an inherited Preview option, but the delete implementation only declares `--name`, `--worker-name`, and `--skip-confirmation`; the workflow no longer passes the inapplicable base-config option when deleting. The regression test checks each workflow command's option set separately and invokes only the two local `--help` commands.
- Corrected the credential-boundary description: the read-only preflight job has no Cloudflare secrets; the protected job passes them to its authorization step and the conditional Wrangler Preview create/delete steps. Updated the rollback instructions to list only the supported delete options.
- Strengthened fingerprint verification to compare the exact changed Git path set against the frozen base, excluding only the fingerprint manifest, and to reject missing, extra, duplicate, and deleted paths. SHA-1/SHA-256 still verify staged Git blobs; every manifest path must also have a clean Git index-to-working-tree diff. Regressions prove omissions and real tracked deletions fail, unstaged edits fail, and Git-normalized line endings remain portable.
- Addressed Owner audit continuation #5468234422: Preview `robots.txt` now permits crawling so crawlers can read the existing HTML, response-header, and static-asset noindex controls. Browser/config tests and the exact-SHA remote-smoke contract reject `Disallow: /`; this is not access control and Preview content remains public demo data.
- Addressed the final-head CodeRabbit deletion regression: a manifest entry with `candidate: null` now also requires the worktree path to be absent. The isolated Git test stages a deletion, recreates the path as untracked, and verifies that the index/worktree diff alone misses it while fingerprint validation rejects it.
- The first Owner-authorized Preview attempt is documented in the provider evidence section below. Its CLI command created a real Preview successfully, then the output recorder rejected Wrangler's leading `Attaching ...` progress line before the nested JSON. The parser accepts only the single expected progress line with the exact run-derived Preview name and dedicated Worker name; regressions reject other names, Workers, suffixes, unknown prefixes, and trailing output.
- Updated the root `AGENTS.md` status note to reflect the Owner-authorized Preview for the documented base SHA, while explicitly keeping corrected-head validation pending and leaving production/checkpoint claims unchanged.

## Owner-authorized Cloudflare Preview evidence · 2026-10-09

- GitHub CLI authentication was confirmed for `KayzenRoot`; Environment `cloudflare-preview` remains protected by required reviewer `KayzenRoot`, self-review allowed, admin bypass disabled, and a custom branch policy limited to `main`. The Account ID and API token were saved only as Environment secrets; values were not read back or logged.
- Cloudflare Workers Free and the `kayzendev.workers.dev` subdomain were confirmed in the authenticated account. Workers reported 100,000 requests/day on Free and current-cycle billable usage of USD 0.00. The account has a pre-existing Paid R2 subscription unrelated to CoinBlink; no R2 binding or operation was used. The existing USD 10 alert is informational, not a hard account-wide spending cap, so the workflow's USD 0 internal ceiling is policy metadata rather than a provider-enforced billing guarantee.
- Before provisioning, the Workers & Pages list contained no Worker resources. The dedicated Worker `coinblink-m00-preview` was then created through the protected workflow. The temporary account-level Workers Admin token was revoked after bootstrap. The active token `coinblink-github-preview` is limited to the Individual Workers Editor role for that single Worker, with a 90-day expiry; it grants no DNS, Billing, R2, KV, or D1 permissions. The final token has not yet completed a Wrangler Preview operation.
- The manual workflow run [37930510285](https://github.com/KayzenRoot/coinblink/actions/runs/37930510285) used exact `main` SHA `ec3b5df6e477b349c0761fd46dec7c873ebd2cc5`. Its preflight and Owner Environment approval passed. Wrangler Preview creation returned success, but the job ended failed when the recorder parsed the CLI progress line as JSON. No `wrangler deploy` or production deployment was run.
- The dashboard showed the created Preview as Ready and showed no active production deployment. The real Preview URLs were `https://coinblink-m00-run-37930510285-1-coinblink-m00-preview.kayzendev.workers.dev` (stable) and `https://562a6468-coinblink-m00-preview.kayzendev.workers.dev` (immutable deployment URL).
- Direct HTTPS checks against both URLs returned `/en` 200 with `noindex`, `/health` 200 with exact build SHA `ec3b5df6e477b349c0761fd46dec7c873ebd2cc5` and `environment: preview`, `/preview-status` 200 with demonstration-only data and no connected editorial or market feeds, and a deliberately unknown route 404. `X-Robots-Tag` and the configured security headers were present. These checks validate the base SHA Preview only; the corrected workflow and least-privilege token still require a fresh exact-main run after this parser correction passes PR review and merges.
- Headless Chromium checked both real Preview URLs at 1536×864, 768×1024, and 390×844: all six `/en` loads returned 200, had no horizontal overflow, zero axe violations, and zero console/page errors. On both URLs `/health` and `/preview-status` returned 200 and the unknown-route probe returned 404; `X-Robots-Tag: noindex` and `X-Frame-Options: DENY` were present. This validates the already-published base SHA, not the parser correction.
- No Cloudflare production deployment, other project Worker modification, R2 use, billing change, or new paid service was performed. M00 remains in progress; this evidence does not promote the canonical checkpoint or declare P1/M00 complete.

## Local validation

| Check | Result |
|---|---|
| Runtime | Canonical validation used Node.js `22.19.0`; npm CLI `11.17.0` |
| `npm ci --ignore-scripts` | PASS; locked install completed |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm run lint` | PASS; ESLint with zero warnings allowed |
| `npm run typecheck` | PASS; 34 files, 0 errors, 0 warnings, 0 hints |
| `npm test` | PASS on Windows with Node.js `22.19.0`; parser correction HEAD: 53/53 unit tests, Astro Cloudflare build plus generated-config guard, 7/7 Playwright tests |
| `npm run build` | PASS independently with Node.js `22.19.0`; Astro Cloudflare build completed and generated-config guard found no SESSION/data/service/production bindings |
| Playwright views | PASS at 1536×864, 768×1024, and 390×844; accessibility assertions included |
| Docker Compose localhost smoke | PASS on verified free `127.0.0.1:3010` using unique project `coinblink-m00-p1-sanitizer-local-20261009`; Linux adapter build, health/buildSha, local `not-deployed` status, robots/noindex and true 404 passed. Only that temporary Compose project was removed. |
| GEF `doctor --target . --json` | Exit 0, effect `NONE`; checkpoint present/valid and toolchain healthy. Linked-worktree observation remains `repository.observable=FINDING` (`GIT_DIRECTORY_NOT_A_DIRECTORY` / `WORKING_TREE_NOT_OBSERVED`); dependency provenance remains `unverified` / `REVIEW`. These limits are retained, not suppressed. |
| GEF `status --target . --json` | Exit 0, effect `NONE`; checkpoint is `M00_ADMITTED`, `IMPLEMENTATION_IN_PROGRESS`, 0%, with the canonical P1 authorization/evidence gate as next stage. Dirtiness is `UNKNOWN`; absent drift baseline is conservatively `stale=true`. No baseline was fabricated. |
| `git diff --check` | PASS after removing one extra trailing blank line |

Correction-specific validation on Node.js `22.19.0`: `npm run lint` PASS; `npm run typecheck` PASS (34 files, 0 errors/warnings/hints); `npm test` PASS (53/53 unit, build/session guard, 7/7 Playwright); `npm audit --audit-level=high` PASS (0 vulnerabilities); `GEF doctor` and `GEF status` exit 0 with the observation limits above. The parser accepts only the exact expected Wrangler progress line and nested JSON; regressions reject unrelated output, wrong Preview/Worker names, unexpected suffixes, unknown prefixes, and trailing text. Real Preview responsiveness and route checks passed for both URLs as recorded above. The preceding PR #38 candidate passed Ubuntu, Windows, Docker, SonarCloud, Socket, and CodeRabbit checks; use the live PR #38 checks for the final evidence commit because any correction creates a new HEAD. Owner audit and merge remain pending.

Local `docker ps` confirmed unrelated `nexlabs-website-web-1` owns `127.0.0.1:3000`; it was left running. The local Docker smoke used port 3010 and an isolated Compose project. The PR CI Docker Compose smoke remains the exact-head remote check for this candidate.

## External and exact-head evidence boundary

- A real Preview exists for the base `main` SHA as documented above. The corrected parser branch has not yet been deployed, and the final least-privilege token has not yet been exercised by Wrangler.
- The exact-SHA health and `/preview-status` contract passed against the documented base Preview. Owner provider authorization is complete; the corrected code still requires its final exact-head checks, Owner audit and merge, followed by a fresh protected manual Preview run on the corrected `main` SHA before it can be called verified remotely.
- The original PR #37 exact-head results apply to its merged base. The preceding PR #38 candidate passed Ubuntu, Windows, Docker, SonarCloud, Socket, and CodeRabbit checks; use the live PR #38 checks for the final evidence commit because any documentary correction creates a new HEAD. Owner audit and merge remain pending.
- Cloudflare account and Free plan, scoped IAM token, dedicated Worker, GitHub Environment protection, and secret presence were verified as described above. An enforceable USD 0 account-wide cost ceiling is unavailable; the account alert is not a hard stop. No provider-enforced cost guarantee is claimed.
- No checkpoint delta is proposed in this correction. The canonical checkpoint remains unchanged at 0%; this parser fix and the already-running base Preview do not satisfy the full M00 Definition of Done or authorize M01+.

## Result

The original P1 preparation has since been followed by a separate Owner-authorized Preview operation documented above. The earlier first workflow run failed at output recording; the correction and successful deployment are recorded in the dated addendum below. That earlier statement remains historical. No checkpoint promotion, production deployment, or M00 completion is claimed.

## 2026-10-10 status reconciliation

Protected Preview workflow [#38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879) succeeded on exact canonical `main` SHA `e8886e21c6f152ca374b1e42852c6b6638543f40`. Stable/immutable URLs and remote browser results are in [the P1 closeout Evidence Bundle](CB-M00-WO-001-P1-CLOSEOUT.md). The read-only dashboard showed Workers Free and `$0.00` observed for October; this is not an enforceable cost cap. The live binding inventory remains pending because it was not exposed in the authenticated Worker detail view. Do not repeat deployment or change the checkpoint in this evidence update.
