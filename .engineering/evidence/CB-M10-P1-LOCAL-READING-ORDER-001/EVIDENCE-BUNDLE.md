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
