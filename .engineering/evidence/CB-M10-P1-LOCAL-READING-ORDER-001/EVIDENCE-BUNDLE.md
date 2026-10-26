# CB-M10-P1-LOCAL-READING-ORDER-001 · Evidence Bundle

**Mode:** LOCAL fictional newsletter preview only. [PR #238](https://github.com/KayzenRoot/coinblink/pull/238), **Draft**. Base `main=524a93a970af9cf8cfb411f8ba7aa9f57ca79603`; green implementation HEAD `7fb938ab9897ebbb485cd2480c7ea8ccadf13ead` (before this evidence-only commit).

## Context Lock / collision gate
- Main branch locked at `524a93a970af9cf8cfb411f8ba7aa9f57ca79603` before branch creation and before evidence publication.
- Isolated branch `feat/cb-m10-p1-local-reading-order-001`; preflight explicitly enumerated 16 other open PRs (#237, #236, #233, #209, and all others). **Zero exact-path collisions** with the M10 file scope.
- Changes limited to five existing files: `src/modules/CB-M10/NewsletterWorkbench.astro`, `src/modules/CB-M10/newsletter-preview.client.js`, `src/modules/CB-M10/newsletter-preview.css`, `test/modules/CB-M10/newsletter-preview.test.mjs`, `e2e/m10-newsletter-demo.spec.mjs`, plus this evidence file. No changes to M02 canonical story source, dependencies, lockfiles, workflows, protected main, Owner CMS, ECC, other PRs, checkpoints or deployment.

## User-visible, bounded feature
In the `/demo/newsletter` **never-sent** preview, an editor may reorder the three canonical fictional news examples using native Move up / Move down buttons. Controls have descriptive aria-labels, automatically disabled first/last bounds, a polite screen-reader status, keyboard Enter/Space activation, and focus moves to a remaining enabled control at the edges. The new order is **DOM-only**: theme selection, Clear and reload destroy it. Nothing is stored, signed up, scheduled, dispatched or networked. No user input requiring consent is introduced.

## Hosted test-first RED
- `b87a86442b9796871ce91904d288d3f9d33aba75`: new Node contract only, no M10 implementation changes.
- `813acbf966e6f15aaafebcfca6c936f93310852a`: new Chromium negative coverage for list reorder, edge disabled state, focus, keyboard, stale reset, no email entry, same-origin GET-only requests, axe WCAG A/AA and responsiveness at 390/768/1366.
- [RED CI Quality #40152684578](https://github.com/KayzenRoot/coinblink/actions/runs/40152684578), Node job `121047339531`: **88 tests, 87 PASS / 1 FAIL**, specifically missing `data-m10-order-status` control in application HTML, no install failure. Other existing tests PASS. Real browser RED not claimed.

## Implementation and accessibility correction
- `0d86355050a27a635406187a950885fa0fdce91a`: add a local-order status with `aria-live=polite` in `NewsletterWorkbench.astro`.
- `6087b1575a5fb05ec0f653487c5b72ea9f21c674`: implement DOM-only list move-up/move-down, aria-labels and disabled edges in already-external CSP-compliant controller `newsletter-preview.client.js`.
- `e8b33b2ace7e2f379d306b0238375737a69fb3f2`: responsive styles in `newsletter-preview.css`.
- [Intermediate Chromium #40152786345](https://github.com/KayzenRoot/coinblink/actions/runs/40152786345): **38/39 PASS**, new M10 P1 case exposed a *genuine keyboard focus edge defect*: an up-button becomes disabled when its story reaches the first position, causing focus loss. Existing 38 browser tests PASS. This intermediate result is explicitly FAIL, never misreported as GREEN.
- `ef3bc1a5e658001ec8fab0b9122956d0e5bed5fe`: require focus on an enabled button in focused Chromium assertion.
- `7fb938ab9897ebbb485cd2480c7ea8ccadf13ead`: minimal implementation fix moves focus to the alternate enabled button when a movement disables the original. No backend or remote data touched.

## Hosted GREEN on implementation SHA
- [CI Quality #40152969270](https://github.com/KayzenRoot/coinblink/actions/runs/40152969270), Node job `121048181553`: **88/88 Node tests PASS**, including canonical M02/M03/M04/M08/M10 and new M10 ordering, LCOV artifact uploaded; lint, Astro typecheck and Gitleaks all SUCCESS.
- [Chromium integrated #40152969307](https://github.com/KayzenRoot/coinblink/actions/runs/40152969307), job `121048193211`: **39/39 Playwright tests PASS**. The new reorder case passed in real Chromium (996ms), including focus/keyboard boundary behavior, stale reset, axe and no network mutation.
- Build `40152969275`, Reviewdog `40152969295` and PR Assurance `40152969308` all SUCCESS. **5/5 applicable GitHub Actions workflows SUCCESS**.
- Exact green implementation SHA GitHub Check Runs: **12/12 SUCCESS**, three branch-required SUCCESS: `Build (Ubuntu)`, `SonarCloud Code Analysis`, `Socket Security: Pull Request Alerts`. SonarCloud Quality Gate PASS. Socket Project Report SUCCESS; Socket Alerts reported SUCCESS but **Skipped: no changes to dependencies**, not a full new dependency scan.
- No line/branch coverage percentage claimed from the LCOV artifact, and no production assertion made.

## Exact-final-SHA gate and review
- This evidence-only commit changes the HEAD. **Revalidate** all applicable workflows, required checks, SonarCloud, Socket, paths, branch and reviews on the NEW SHA, not only on the green implementation SHA.
- Submit technical `COMMENTED` review from the authorized connected `kayzenweb3` account at exact final SHA, not `APPROVED` or human independent attestation.
- **STOP:** keep Draft. No Ready, merge, deploy, sending emails, subscriber collection, paid providers, subscriptions, live data, secrets, external API, main/other PR mutations, ruleset, checkpoint or credential changes.
- **Implementation verdict:** `M10_P1_LOCAL_REORDER_GREEN / FINAL_EVIDENCE_HEAD_RECHECK_REQUIRED / DRAFT / NO_MERGE_NO_DEPLOY`.

## HIGH_ASSURANCE Correction/Reconciliation Delta 01 · 2026-10-26

**Authority:** Owner authorized execution of Work Order CB-M10-P1-LOCAL-READING-ORDER-001 on EXISTING PR #238 branch ONLY, not PR merge, Ready, deployment, paid requests or production functionality.

### Confirmed immutable Context Lock
- Protected main `ff86a254ac4415946b1be1d6a86a69dcc57ad52d`, original PR #238 HEAD `d2c4406afa8639e5e3a4b2ee30ccb8e608e487c1`, historical base `524a93a970af9cf8cfb411f8ba7aa9f57ca79603`, branch `feat/cb-m10-p1-local-reading-order-001`, OPEN/DRAFT, previous HEAD checks 12/12 SUCCESS, Sonar zero new issues and security hotspots, no unresolved reviews.
- Both recursive trees untruncated, protected main Git tree `23374971c6dde494759b4707949a71c39a51267b`, old PR Git tree `7a4e6892525e11018c2890570ebf3add44c79872`. Old base → current protected main: 7 additional commits and 63 changed paths, **zero same-path overlaps** with the six allowlisted files. All 19 other open PRs had zero overlap when individually rechecked.
- Current base tree will be protected main tree plus the **exact five unchanged original code/test blobs** and the new Evidence Bundle: `e2e/m10-newsletter-demo.spec.mjs=b2fc2da69760ce2ef5af762b2600866ab00f6d6c`, `NewsletterWorkbench.astro=6d4b92603799339f85b7f32d053191f0efa22d18`, `newsletter-preview.client.js=d19191e39fb63f7a6d31a28996ba25ad38c8e4ae`, `newsletter-preview.css=f05567588dc3f52ac88953fa0415d59994cce2f3`, `newsletter-preview.test.mjs=424f61228365a5672eb9b2b840d0453a326d931f`.
- Merge reconstruction uses a **true two-parent commit** `[old #238 HEAD d2c4406afa8639e5e3a4b2ee30ccb8e608e487c1, current protected main ff86a254ac4415946b1be1d6a86a69dcc57ad52d]`, written only to `feat/cb-m10-p1-local-reading-order-001` via fast-forward `force=false` and `expected_sha` lease. No rebase, history rewrite, force push, new implementation PR or main branch mutation.

### Functional scope and security STOP
- `/demo/newsletter` remains **LOCAL_DEMO_ONLY** and **UNSENT**. Reorder only three canonical fictional M02 articles with native accessible Move up/down, Enter/Space, disabled edges, correct focus recovery and `aria-live` order status.
- No persistence of reorder on theme change/reset/reload, no subscription, email collection, outbound send, email account, API, external egress, browser storage, remote services, user identity or publication. The five feature/test files are byte-for-byte unchanged by this reconciliation. No updates to M02 canonical fixtures, M05 synthetic Owner, D1, Golden/UI global styles, dependency lockfiles, rights, rulesets or checkpoints.

### Mandatory exact reconciled HEAD evidence (PENDING)
- Re-run M10 focused Node tests including fail-closed negative cases and existing M02/M03/M04/M08/M09/M10 contracts; run real Chromium on `/demo/newsletter` for reorder, focus/keyboard disabled edges, theme/reset/reload, zero email inputs, external requests, writes or storage, responsive 390/768/1366, axe WCAG 2A/AA/2.1 and no horizontal overflow.
- Re-run integrated local browser journey, Build Ubuntu, lint/typecheck, Node/LCOV, Gitleaks, PR Assurance, Reviewdog, SonarCloud 0 blocking new issues/hotspots, Socket PR Alerts and Project Report; record actual run/job IDs. Historical 88/88 Node and 39/39 Chromium on previous implementation SHA **are not** fresh exact-new-HEAD evidence.
- If any test fails, reproduce real behavioral issue and correct **only** one or more of the five original feature/test allowlisted files, with focused RED→GREEN and new exact-HEAD check run. Do not claim `PASS` until verified. Do not weaken tests to make a failure disappear.
- For independent/technical code review, `kayzenweb3` historical `COMMENTED` is not `APPROVED`. Preserve Solo Owner GitHub policy and the real required checks. Never claim a second account is an independent human security reviewer.

### Evidence fields and STOP CONDITION
- Later final audit comment must record new parent SHAs, exact final HEAD, strict six paths, check names/conclusions, real Node/Chromium counts, WCAG + privacy assertions, Sonar delta, Socket skipped-vs-scanned, reviews/threads and any NOT_RUN. Checkpoint only proposed, not promoted.
- **Until validated:** `RECONCILED_PENDING_NEW_HEAD_CI / DRAFT / NO_READY / NO_MERGE / NO_DEPLOY`. Any stale lock, colliding path, changed rights/production boundary, missing required check, regression or blocking security finding => `BLOCKED` or `CORRECTION_REQUIRED`.
- No branch-Ready, squash merge into protected main, deploy, real emails/recipients/data, real Owner/passkeys, D1 remote, spend, LIVE, publishing, branding, rights, ruleset or canonical checkpoint changes.