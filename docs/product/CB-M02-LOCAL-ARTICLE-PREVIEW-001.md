# CB-M02-P0-LOCAL-ARTICLE-PREVIEW-001

Status: P0 NECESSARY candidate. Base: `2cfa69ee545100be932d81dd901eb378449f8c88`. Related: #152, M02 #9, M05 #12.

## Vertical / Scope
M02 EN/PT-BR fictional news directory accepts only a manually selected, canonical exported M05 demonstrative `.md` (64,000 bytes maximum). The existing M05 parser is reused unchanged; article preview renders title, author label, summary, body and provided-but-unverified HTTPS source via inert textContent. Native file input, accessible status, explicit clear, reload/pagehide/BFCache cleanup and generation-guarded asynchronous file reads. Never a published article or an authenticated D1 editor.

## Out of scope
No new public route, backend, D1, credential, provider, license authorization, publishing, upload, storage, telemetry, external requests, live price/news, dependency, workflow, billing, configuration, deploy, merge or checkpoint.

## Evidence / DoD
Node canonical input and malformed-file tests; EN/PT-BR Chromium valid/invalid/oversize, inert HTML, privacy/no-egress, focus, reload, axe WCAG A/AA and existing M02/M01-M05 regression. Build, lint, typecheck, Gitleaks, SonarCloud zero new issues, Socket and all applicable PR checks required before APPROVED. No completion claim until actual evidence. Later squash merge requires separate exact-head Owner approval.