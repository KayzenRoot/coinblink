# CB-M17-P0-LOCAL-STORYBOARD-001 · Local evidence bundle

**Pinned main base:** `2fecdd29d3baf89499080fbce9569826f22f4727`. **Isolated branch:** `feat/cb-m17-p0-local-storyboard-001`.

## Context and boundary
- Issue #27 and the planned M17 media pipeline stay `PLANNED / NOT_ADMITTED / NO CODE AUTHORIZED`. This increment is one bounded **LOCAL synthetic** storyboard planning exercise. It does not admit M17 and does not produce media.
- The owned path set is listed in the Work Order document. No shared file, demo navigation, admin route, dependency, lockfile, workflow of another module or other PR is modified.

## Capability exercised
- Composing a fictional shot plan: invented title, illustrative ratio, up to five shots with allowlisted kinds and bounded captions.
- **Prompt safety:** a title or caption that claims authenticity (`authentic photo`, `real photo`, `photo of the event`, `real footage`, `breaking photo`, and the other listed claims) is refused, because generated artwork must never read as authentic event photography.
- **Single source of validation:** the Astro component emits the model as an asset and the browser module imports it, so the Node contracts and the browser exercise the same code. A regression test asserts the client imports the model rather than reimplementing its rules.

## Negative contract
- Rejected input returns `INVALID_BRIEF` with no plan: wrong types, arrays, padded text, control characters, unknown kind or ratio, duplicated kind+caption, zero shots and more than five shots.
- Every accepted plan returns frozen shots carrying only `index`, `kind`, `ratio`, `caption`, and the flags `mediaProduced`, `providerConnected`, `uploadEnabled`, `published`, `storageUsed`, `rightsCleared`, `provenanceAttached`, `renderQueued`, `costCapEnforced` all `false`, `costUsd=0`, `costCapUsd=0`, `altTextRequired=true`, `humanReviewRequired=true` and frozen `actions=[]`.
- Asserted absence across shipped sources: no `fetch`, `XMLHttpRequest`, `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`, `innerHTML`, `outerHTML`, `iframe`, `img`, `video`, e-mail or password field, `document.cookie`, `process.env`, `serviceWorker` or `/admin/api`.

## Local verification performed
- `node --test test/modules/CB-M17/storyboard-model.test.mjs`: 5 contracts passing.
- `npm run lint` (`--max-warnings=0`): clean. `npm run typecheck`: 0 errors.
- `npm run build` on Node 22.19.0.
- `playwright test e2e/m17-local-storyboard.spec.mjs e2e/m03-source-demo.spec.mjs`: 4 passed, with axe WCAG A/AA at zero violations, no horizontal overflow across the five widths, no third-party request, no page-initiated non-GET request, no page error, and `/admin` plus `/admin/login` denied.

## Corrections made during construction
- `?url` inlined the model as a `data:` URL and the browser import silently failed; the component now emits `?url&no-inline` and the browser module imports a real asset.
- The model first used a control-character regular expression, which the repository lint rejects (`no-control-regex`); it now iterates code points.

## Not performed
Any image, video or audio generation, provider connection, upload, storage, versioning, publication, credential, cost, deployment or production claim. Prompt safety beyond the authenticity claim check, rights clearance, cost caps, queues, alt text authoring, captions, poster fallback, reduced motion and provenance metadata are unimplemented. Not verified by a separate human reviewer.

## STOP
PR remains Draft. Never Ready, merge, deploy, generate or publish media, connect a provider, spend, or use real data or credentials.
