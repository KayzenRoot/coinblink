# CB-M02-P0-LOCAL-EVIDENCE-REVIEW-001

Status: P0 NECESSARY candidate, not merged or published. Base: `8053ace0315909ceac83300b576ff9fcb19ab6f7`. Linked product: CB-M02 #9, CB-M05 #12, local reading flow #152.

## Visible vertical
The existing EN/PT-BR local article preview now exposes a structural citation hygiene panel after importing a canonical M05 Markdown export. It calls the existing `analyzeLocalCitationHygiene` from M05 through a bundled Astro module. This is the **same function**, not a competing implementation.

- Count source notes and citations; flag orphaned citation markers, unused notes, explicit review placeholders and numeric-claim hints.
- Malformed/oversized source and claim-review appendices fail closed. Bounded per-signal excerpts stay inert DOM text. Clearing/replacing files and navigation clear the panel; the original M02 file import's async generation guard remains in force.
- An empty result is **not clearance or a fact-check**. No validation of source existence, rights, chronology, editorial identity or genuine external events.
- No external requests, cookies, sessions, storage, telemetry, publication, licensed provider or new public route.

## Acceptance / evidence
Node contracts for M05 parity after Markdown export/import, orphan/unused sources, malformed sections, immutable DTO and privacy boundary. Chromium EN/PT-BR real fixture import, three structural signals, inert output, invalid and clean-draft behavior, discard and reload, axe WCAG A/AA and no external network. Existing M01–M05 regressions preserved. Validate exact-head CI, lint/typecheck, Gitleaks, SonarCloud **zero new PR issues**, Socket, Build, reviewdog and PR Assurance before approval.

## Explicit exclusions / STOP
Historical SonarCloud branch-main aggregate issues must remain visible; this PR is not a baseline reset. No editing M05 canon, production admin, APIs, dependencies, rulesets, workflow/configuration, checkpoint, deploy or costs. Do not merge without separate exact-HEAD Owner authorization.