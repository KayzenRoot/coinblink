# CB-M13-P0-LOCAL-PLACEMENT-PREVIEW-001 | Empty ad-slot layout lab

## Narrow Owner authorization, NOT commercial module admission
- On 2026-10-25, the Owner authorized only the next isolated LOCAL fictitious M13 increment, branch + Draft PR, hosted test-first RED→GREEN and technical review by kayzenweb3, with explicit no Ready/merge/deploy/monetization/personal data.
- Issue #20 and the long Work Order CB-M13 on the planning branch declare full Advertising Studio **PLANNED / NOT ADMITTED**; no production architecture, dependencies or paid ad accounts are admitted by this local prototype.
- Base Context Lock: main \`524a93a970af9cf8cfb411f8ba7aa9f57ca79603\`. Dedicated branch \`feat/cb-m13-p0-local-placement-preview-001\`. 19 pre-existing open PRs had 197 changed files compared against the ten paths here, with zero exact filename collisions.
- Own files: M13 module model/UI/client/CSS, local demo route, Node and browser test, isolated least-privilege workflow, this P0 Work Order and Evidence Bundle. No edits to other modules or protected public/home/admin views. No packages, deployment, secrets, new permissions, payment service, sponsor account or provider calls.

## Contract and UX
- Three local-only contexts: \`home\` 2 illustrative empty slots, \`article\` 3, \`digest\` 1. No content or status sourced from real advertising inventory.
- Model returns immutable \`status:EMPTY_LAYOUT_ONLY\` with \`mode:LOCAL_SYNTHETIC\`, \`live:false\`, \`adsEnabled:false\`, \`bookingEnabled:false\`, \`sponsor:null\`, \`revenue:null\`, \`impressionsTracked:false\`, \`clicksTracked:false\`; each slot has \`state:EMPTY_PLACEHOLDER\`, \`isAdvertisement:false\`, \`creative:null\`. Invalid context fails closed, including prototype keys.
- Browser demo \`/demo/placements\`: clearly labelled empty slot grid; choose context and reset with native keyboard support and assistive live status. Server precomputes model for the three allowlisted options; client verifies snapshot before using \`textContent\` only.
- WCAG axe A/AA check, focus, no horizontally overflowing layout at 320, 390, 768, 1366 and 1536 px. BaseLayout enforces noindex/nofollow/noarchive.
- No image, iframe, ad creative, outbound request, script from external origin, tracker, billing, actual sponsor, click/analytics, impressions, personal data, storage, identity, invoices, rates or commercial claims.

## Test evidence and STOP
- P0 tests and new hosted M13 workflow must precede implementation, fail for absent model, and show true hosted GREEN after product delta.
- Build, lint/typecheck, Gitleaks, SonarCloud, Socket, PR Assurance, Reviewdog, isolated M13 Node/Chromium and existing M11 regressions must pass on the exact final SHA. Evidence Bundle commits require another fresh CI run.
- \`kayzenweb3\` can publish a COMMENTED technical review of exact final SHA; it is the owner's other GitHub account, not an independent human auditor. No APPROVED event from this mandate.
- **STOP:** Stay Draft; no Ready, squash merge, deployment, spending, production ad inventory/CRM, real content, trackers, remote scripts, sponsor booking, billing, changing main/other PRs/rulesets/checkpoints. Full M13 stays \`PLANNED / NOT_ADMITTED\`.
