# Owner authorization · main-only public DEMO deployment

**Captured:** 2026-10-17 UTC
**Repository:** `KayzenRoot/coinblink`
**Work Order:** `CB-CF-MAIN-ONLY-001` · **PR:** #117
**State:** authorization recorded; local implementation and validation complete; final hosted checks and production deployment are pending; no production deployment has occurred.

## Direct Owner instruction

The Owner directly instructed Codex to remove the blocker and make the deployment work, then explicitly authorized automatic production deployment for every modification integrated into the GitHub `main` branch. This authorizes the operational main-only deploy path after its exact-SHA checks pass.

The instruction is recorded as an operational deployment authorization, not as a legal opinion or rights decision. Issue #72 remains the source for rights status. Its latest readback (`https://github.com/KayzenRoot/coinblink/issues/72#issuecomment-6225569671`) still states `COINBLINK_NAME_COMMERCIAL_CLEARANCE=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, and `M01_DONE=false`. The earlier Issue #72 request against automatic deployment is superseded only for this bounded main-only DEMO deployment path by the newer direct Owner instruction. Issue #72 was not edited.

## Implemented boundary

- Production workflow trigger remains only the completed trusted `GEF validation` run for a same-repository `push` to `main`.
- The `production` GitHub environment has a custom deployment branch policy whose only allowed branch is `main`; administrator bypass is disabled.
- Repository variable `COINBLINK_PUBLIC_DEMO_DEPLOYMENT=AUTHORIZED_DEMO_ONLY` was set and read back through GitHub API at `2026-10-17T15:11:29Z`.
- The workflow hard-codes `COINBLINK_COMMERCIAL_PUBLICATION_ALLOWED=false`, requires the demo authorization in preflight and immediately before Wrangler, and reports `DEMO_ONLY`.
- Existing seven required PR contexts, five exact-main contexts, identical source/main tree, current-main SHA recheck, no-preview triggers, existing preview Worker, and protected ruleset are preserved.
- Cloudflare API token secret exists by name in the environment; its value has not been read. Its account-wide Workers Scripts Write scope is a recorded risk.
- No Worker, domain, route, billing option, live feed, authentication service, or checkpoint is created or changed by this authorization record.

## Validation at this checkpoint

- Regression tests were added first and failed against the old commercial-rights gate (5 failures), showing that the previous implementation could not honor the new demo authorization.
- After the code correction, focused tests passed 26/26 under the default Node `26.4.0` runtime.
- Current Node `22.23.3` validation: focused Cloudflare tests 33/33; full `npm test` 401 unit tests and 48/48 Playwright; lint and typecheck clean; `npm audit --audit-level=high` found zero vulnerabilities; Astro build and Wrangler dry-run passed. The dry-run used no Cloudflare token and did not publish.
- Exact hosted CI for the changed PR HEAD, protected merge, automatic production run, and public health smoke remain pending. Do not claim the Worker is live until the workflow succeeds and the exact-SHA endpoint verifies.

## Non-goals retained

`commercialPublicationAllowed=false`, `PENDING_OWNER_OR_LEGAL`, `M01_DONE=false`, the 5% checkpoint, and ruleset `24888106` remain unchanged. This evidence does not grant commercial rights, trademark clearance, independent review, or approval of any asset.
