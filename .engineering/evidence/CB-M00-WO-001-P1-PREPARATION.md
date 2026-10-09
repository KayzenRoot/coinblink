# CB-M00-WO-001 · P1 Worker Preview Preparation Evidence

**Change:** P1 preparation only

**Base:** `954b4db2d6dff3798e76fd4d75d6bccaf24b0876` (`origin/main`)

**Branch:** `codex/cb-m00-p1-preparation`

**Candidate HEAD:** published in the PR description and exact-head check run links after commit; this file deliberately avoids a self-referential commit hash.

**Context Lock:** `.engineering/context-locks/CB-M00-WO-001-P1-PREPARATION.md`

**Fingerprints:** `.engineering/evidence/CB-M00-WO-001-P1-PREPARATION-FINGERPRINTS.json`

## Objective and boundary

Prepare a fail-closed, manual-only Cloudflare Worker Preview lane for admitted M00 P1, without invoking Cloudflare or changing provider state. The canonical checkpoint, admitted Work Order, original execution Context Lock, and M01–M18 governance are unchanged. P1 remains `PROVIDER_SETUP_REQUIRED / NOT_DEPLOYED / OWNER_AUTHORIZATION_REQUIRED`; M00 completion remains 0% and is not declared done.

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
- No Cloudflare login, API request, Preview create/delete, deployment, billing change, credential read, or remote resource operation occurred.

## Local validation

| Check | Result |
|---|---|
| Runtime | Canonical validation used Node.js `22.19.0`; npm CLI `11.17.0` |
| `npm ci --ignore-scripts` | PASS; locked install completed |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm run lint` | PASS; ESLint with zero warnings allowed |
| `npm run typecheck` | PASS; 34 files, 0 errors, 0 warnings, 0 hints |
| `npm test` | PASS on Windows with Node.js `22.19.0`; 50/50 unit tests, Astro Cloudflare build plus generated-config guard, 7/7 Playwright tests |
| `npm run build` | PASS independently with Node.js `22.19.0`; Astro Cloudflare build completed and generated-config guard found no SESSION/data/service/production bindings |
| Playwright views | PASS at 1536×864, 768×1024, and 390×844; accessibility assertions included |
| Docker Compose localhost smoke | PASS on verified free `127.0.0.1:3010` using unique project `coinblink-m00-p1-sanitizer-local-20261009`; Linux adapter build, health/buildSha, local `not-deployed` status, robots/noindex and true 404 passed. Only that temporary Compose project was removed. |
| GEF `doctor --target . --json` | Exit 0, effect `NONE`; checkpoint present/valid and toolchain healthy. Linked-worktree observation remains `repository.observable=FINDING` (`GIT_DIRECTORY_NOT_A_DIRECTORY` / `WORKING_TREE_NOT_OBSERVED`); dependency provenance remains `unverified` / `REVIEW`. These limits are retained, not suppressed. |
| GEF `status --target . --json` | Exit 0, effect `NONE`; checkpoint is `M00_ADMITTED`, `IMPLEMENTATION_IN_PROGRESS`, 0%, with P1 Owner authorization and Preview evidence as next stage. Dirtiness is `UNKNOWN`; absent drift baseline is conservatively `stale=true`. No baseline was fabricated. |
| `git diff --check` | PASS after removing one extra trailing blank line |

Correction-specific validation on Node.js `22.19.0`: `npm run lint` PASS; `npm run typecheck` PASS (34 files, 0 errors/warnings/hints); `npm test` PASS (50/50 unit, build/session guard, 7/7 Playwright); standalone `npm run build` PASS; `npm audit --audit-level=high` PASS (0 vulnerabilities). The fingerprint regressions verify exact path equality, omitted/extra/duplicate paths, tracked deletions including a recreated untracked path, unstaged mutations, and Git EOL normalization. Robots tests verify that crawlers can read noindex signals without removing the noindex headers/meta. The delete documentation test and local Wrangler help tests use installed `wrangler@4.149.0` only. The system-default Node.js `24.19.0` initially failed the repository's intentional GEF Node-major-22 assertion; rerunning the suite with the CI-pinned Node.js `22.19.0` passed.

Local `docker ps` confirmed unrelated `nexlabs-website-web-1` owns `127.0.0.1:3000`; it was left running. The local Docker smoke used port 3010 and an isolated Compose project. The PR CI Docker Compose smoke remains the exact-head remote check for this candidate.

## External and exact-head evidence boundary

- No Cloudflare login, account API, Wrangler Preview command, resource creation/deletion, deployment, billing change, or credential read was performed. No actual stable or immutable Preview URL exists from this preparation.
- The exact-SHA health and `/preview-status` contract is covered with deterministic fake-response tests. Real network health checks can run only after Owner setup and a separately authorized manual workflow dispatch; they are not claimed as complete here.
- Exact-head Ubuntu, Windows, Docker, SonarCloud, Socket, and CodeRabbit results are published against the final candidate SHA in the PR. They were not available at local evidence authoring time.
- Cloudflare account ownership, Workers Free plan, enforceable USD 0 cost ceiling, IAM token scope, dedicated Worker availability, GitHub environment protection, and credentials remain externally unverified. The workflow stops until the Owner configures and attests every required value.
- No checkpoint delta is proposed: preparation does not deploy P1, alter canonical progress, or satisfy M00 completion.

## Result

The local preparation is ready for independent review. Merge and external deployment remain outside this work's stop boundary. The Owner must audit the exact final HEAD, review the PR evidence and checks, and separately authorize provider setup before any Preview action can run.
