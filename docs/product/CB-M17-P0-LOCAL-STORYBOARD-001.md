# CB-M17-P0-LOCAL-STORYBOARD-001 | Synthetic no-media storyboard composer

## Scope, authority and frozen base
- This is one bounded LOCAL fictitious planning increment, not admission of full M17 media generation, not a renderer and not a production authorization. The M17 Issue #27 and the planned media pipeline stay PLANNED / NOT ADMITTED.
- Main base `2fecdd29d3baf89499080fbce9569826f22f4727` (protected main after the M16 merge). Isolated branch `feat/cb-m17-p0-local-storyboard-001`.
- Owned files only: pure M17 model, Astro component, demo route, static JS/CSS, Node contracts, browser spec, read-only CI workflow, this document and the Evidence Bundle. No shared file, demo navigation, admin route, dependency, lockfile, workflow of another module or other PR is modified.

## What this increment exercises
- Storyboard planning, not generation: an invented story title, an illustrative aspect ratio, and up to five shots chosen from an allowlisted kind set with bounded captions.
- **Media prompt safety as a first-class contract.** A brief whose title or any shot caption claims authenticity — `authentic photo`, `real photo`, `photo of the event`, `real footage`, `breaking photo` and similar — is refused. Generated artwork must never be presented as authentic event photography.
- **The client loads the tested model instead of copying its rules.** The component emits the model as an asset (`?url&no-inline`) and the browser module imports it. Validation therefore has one implementation, exercised by the Node contracts and by the browser at the same time.

## Fail-closed contract
- `planLocalStoryboard(brief, beats)` accepts only an object brief with a trimmed title of 8..120 characters, a ratio in `16:9|4:5|9:16`, and 1..5 beats whose kind is in `cover|section|diagram|chart|timeline|animation` and whose caption is a trimmed 6..140 character string. Rejected input returns `INVALID_BRIEF` with no plan: wrong types, arrays, padding, control characters, unknown kinds or ratios, duplicated kind+caption pairs, more than five shots or zero shots.
- Every accepted plan returns `status=LOCAL_PLAN_ONLY`, `mode=LOCAL_SYNTHETIC`, frozen shots carrying only `index`, `kind`, `ratio` and `caption`, and the flags `mediaProduced=false`, `providerConnected=false`, `uploadEnabled=false`, `published=false`, `storageUsed=false`, `rightsCleared=false`, `provenanceAttached=false`, `renderQueued=false`, `costCapEnforced=false`, with `costUsd=0`, `costCapUsd=0` and frozen `actions=[]`. `altTextRequired` and `humanReviewRequired` stay `true`.
- `/demo/storyboard` is a noindex BaseLayout page built from external CSP-compatible JS/CSS. Shots are rendered with `createElement` and `textContent`, the list is refreshed with `replaceChildren`, and reset clears every value. No storage, network, cookie, upload, provider, queue or privileged endpoint.
- axe WCAG A/AA, no horizontal overflow at 320/390/768/1366/1536 px, no third-party request, no page-initiated non-GET browser request, and `/admin` stays denied.

## Explicitly not implemented
- No image, video or audio is produced, uploaded, stored, versioned or published. No provider is connected and no credential exists. Media prompt safety beyond the authenticity claim check, person and brand rights, cost caps, render queues, idempotency, alt text authoring, captions, poster fallback, reduced motion, provenance metadata and owner publication approval all remain unimplemented and NOT_ADMITTED.

## Mandatory proof and STOP
- Local proof: Node contracts for the model and shipped sources, `npm run lint`, `npm run build`, `npm run typecheck`, and the Chromium spec pairing M17 with the existing M03 provenance demo regression.
- STOP: PR remains Draft. Never Ready, merge, deploy, generate or publish media, connect a provider, spend, use real data or credentials, or modify other PRs, main or checkpoints.
