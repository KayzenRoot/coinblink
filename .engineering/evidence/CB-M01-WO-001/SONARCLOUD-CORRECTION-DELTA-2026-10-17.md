# M01 SonarCloud correction delta — 2026-10-17

## Scope and identity

- Repository: `KayzenRoot/coinblink`
- Work Order: `CB-M01-WO-001`
- PR: [#112](https://github.com/KayzenRoot/coinblink/pull/112)
- Base: `cbcfa5c0d587dfce78406cfe79c4ea3b836a2f18`
- Pre-correction PR HEAD: `84fa7a06ffe481fd6c4c0a8770e6a5bacb7f2f13`
- Code correction HEAD tested locally: `ae88a7b79123830be9edbd5a7135425dd86f69f0`
- `CHECKPOINT_DELTA={}`

Only the existing M01 test file was changed for this correction. The visual fixture remains local, synthetic, and external-request-denying. No production module, route, dependency, workflow, Golden source, or checkpoint changed.

## SonarCloud remediation matrix

| ISSUE_ID | RULE | SEVERITY | FILE:LINE | CAUSE | FIX | TEST | RESULT |
|---|---|---|---|---|---|---|---|
| `AaFJE-4gbbm1AbGOPb9A` | `javascript:S9382` | MINOR | `test/modules/CB-M01/visual-check.mjs:272` | Sequential navigation and DOM assertions were expressed in a loop using `await`. | Extracted a per-route async check and chained route cases with `reduce`/`.then`, preserving page-state order and failure propagation. | Full Node 22 unit suite; Playwright. | Resolved; fresh Sonar analysis for PR HEAD `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110` returned 0 open issues. |
| `AaFJE-4gbbm1AbGOPb9B` | `javascript:S6551` | MINOR | `test/modules/CB-M01/visual-check.mjs:272` | Route tuple inferred a union type and was concatenated into a URL. | Converted cases to objects with string `path`; use `new URL(path, origin).href`. | Full Node 22 unit suite; Playwright. | Resolved; fresh Sonar analysis for PR HEAD `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110` returned 0 open issues. |
| `AaFJE-4gbbm1AbGOPb9C` | `javascript:S6551` | MINOR | `test/modules/CB-M01/visual-check.mjs:273` | Same implicit route-to-string conversion in the assertion message. | Assertion message now uses the typed string `path`. | Full Node 22 unit suite; Playwright. | Resolved; fresh Sonar analysis for PR HEAD `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110` returned 0 open issues. |
| `AaFJE-4gbbm1AbGOPb9D` | `javascript:S9382` | MINOR | `test/modules/CB-M01/visual-check.mjs:275` | DOM reads followed a page navigation inside the loop. | Kept each navigation and its subsequent DOM reads inside the serial per-route function. | Full Node 22 unit suite; Playwright. | Resolved; fresh Sonar analysis for PR HEAD `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110` returned 0 open issues. |
| `AaFJE-4gbbm1AbGOPb9E` | `javascript:S9382` | MINOR | `test/modules/CB-M01/visual-check.mjs:276` | Same sequential DOM-read pattern. | Same serial per-route function; no parallel page reuse. | Full Node 22 unit suite; Playwright. | Resolved; fresh Sonar analysis for PR HEAD `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110` returned 0 open issues. |
| `AaFJE-4gbbm1AbGOPb9F` | `javascript:S9382` | MINOR | `test/modules/CB-M01/visual-check.mjs:277` | Same sequential DOM-read pattern. | Same serial per-route function; no parallel page reuse. | Full Node 22 unit suite; Playwright. | Resolved; fresh Sonar analysis for PR HEAD `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110` returned 0 open issues. |
| `AaFJE-4gbbm1AbGOPb9G` | `javascript:S9382` | MINOR | `test/modules/CB-M01/visual-check.mjs:280` | Body inspection depended on the same page remaining on the current route. | Kept body inspection and assertions inside the serial per-route function. | Full Node 22 unit suite; Playwright. | Resolved; fresh Sonar analysis for PR HEAD `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110` returned 0 open issues. |

The independent read-only review found the sequence and URL construction semantics preserved. The request route handler now awaits both `continue()` and `abort()`, rethrows handler failures, and the test asserts the captured failure list is empty. The existing request listener remains the single recorder for attempted external requests.

## Validation

Runtime: Node.js `v22.23.3` (isolated runtime); npm `11.17.0`. `npm ci` completed with 0 reported vulnerabilities. npm withheld install scripts for `esbuild` and `workerd` under the local script-approval policy; the following full build and tests nevertheless completed successfully using the installed platform packages.

Commands and results on code HEAD `ae88a7b79123830be9edbd5a7135425dd86f69f0`:

- `npm test` — PASS: unit 407/407, Astro build and no-session-binding guard PASS, Playwright 48/48.
- `npm run lint` — PASS (`eslint . --max-warnings=0`).
- `npm run typecheck` — PASS: 143 files, 0 errors, 0 warnings, 0 hints.
- `node --check test/modules/CB-M01/visual-check.mjs` — PASS.
- `git diff --check` — PASS.
- Local M01 Chromium visual evidence — desktop 1536×864, tablet 768×1024, mobile 390×844; screenshots and JSON reports are updated in this directory. Axe checks reported zero violations in the captured M01 runs.
- SonarCloud API re-read returned **0 open issues** for PR #112 at `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110`; its SonarCloud check was successful. The exact HEAD's GEF Ubuntu, GEF Windows, Docker smoke, SonarCloud, Socket Pull Request Alerts, Socket Project Report, and CodeRabbit status contexts all passed. CodeRabbit's green status is not a substantive review because automatic review was skipped.

### Updated visual evidence SHA-256

| File | Bytes | SHA-256 |
|---|---:|---|
| `r26-integrated-visual-check.json` | 18765 | `1c38d891bff9eea315aeb9938969af42aedf95cf68952a2bb82565d78ef54e46` |
| `visual-check.json` | 17071 | `48bd4ce2c52e9559966458a4457ee931653c3155918068ddddc4256688e8b77b` |
| `screenshots/golden-home-desktop.png` | 869507 | `1cd0ef96d23b8d1febaF90b1493184808cb0bf923c2b58d976defaed195c849d` |
| `screenshots/golden-home-tablet.png` | 534847 | `76326af7e95ab16b2ec30552bcc2babf2ae6cce068699fce41cd51423e2c8045` |
| `screenshots/golden-home-mobile.png` | 242496 | `add56458c9446a9b1e273d509651da5ef9541ae335c56bdf6b9dc159b4a5529` |
| `screenshots/r26-home-integrated-desktop-1536x864.png` | 868482 | `6de01bd1ab69f5c034977555a5bc8b286d3ec1ba6257f205e7a10c188ab3cf0d` |
| `screenshots/r26-home-integrated-tablet-768x1024.png` | 534942 | `bcb1dfe5b81df09f6f4cbdcbd6bd4e9ca5d9ef6456f4e12d23a3bb390cb85f0d` |
| `screenshots/r26-home-integrated-mobile-390x844.png` | 244434 | `cb46d1a09422f5071a941855c001d69e2bc87bedd09c261e2f72d36d9ce0f5ba` |

No merge, deployment, checkpoint promotion, live content, external provider request, or credential was used.

## Prior exact-head readback and evidence update

- The code/test result recorded above was validated on `ae88a7b79123830be9edbd5a7135425dd86f69f0`.
- The prior exact-head check was on `18a8c697ac5970e70c2d2d1e7132c78f4d9a3110`: seven status contexts passed and SonarCloud returned zero open issues. That was not the branch's later HEAD.
- The evidence-only commit `cddeb0bdb83e36b469491d2623a77763eaa95b44` then updated this report. A fresh GitHub readback on that exact commit showed all seven required statuses passed; SonarCloud API returned zero open issues for PR #112. The report's previous final section incorrectly continued to identify `18a8...` as the final HEAD; this paragraph corrects that record.
- This correction changes only this Evidence Bundle. Its new commit requires a fresh hosted exact-HEAD check. The latest PR head and its check links on GitHub are authoritative for the final hash and results; do not infer the new commit's status from its parent.
- CodeRabbit status is green but its review was skipped; it is not counted as a substantive review.
- No merge, deploy, or checkpoint change was made.
