# CB-SONAR-WAVE2-EDITORIAL-PARSER-20261022

Scope: preserve M05 canonical local source-note and claim-review parser contracts while reducing cognitive complexity in two screenshot-flagged functions.

- `local-citation-audit.mjs`: move canonical source metadata checks into a dedicated private validator, preserving exact error handling, HTTPS URL criteria, note deduplication, malformed fail-closed behavior and immutable results.
- `local-claim-reviews.mjs`: separate source ID and claim queue parsing from the main body dispatcher, preserving position rules, malformed/duplicate handling, maximum lengths, state/provenance and ordering.

**DoD:** M05 unit tests and cross-module Node/browser tests, existing M02 evidence preview and M05 WebAuthn/D1 synthetic CMS, Build, lint/typecheck, SonarCloud 0 new PR issues, Socket, Gitleaks. Compare old/new rejection and successful parse behavior; no data ingest or publication.

Base locked to `3fbdfa967e5046f6bdbb4432a7d633fedbb65200`. No merges without user's explicit exact-head approval; no deploy, spending, settings, quality gate suppression or checkpoint.
