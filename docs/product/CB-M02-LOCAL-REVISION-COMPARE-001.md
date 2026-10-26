# CB-M02-P0-LOCAL-REVISION-COMPARE-001

Status: implementation candidate, unmerged. Locked base: `4eb2bf73b4af8fec892c9482aa4da46b027562d7`. Product link: M02 #9, M05 #12, local integrated journey #152; related future high-priority Corrections Ledger in the ideas backlog.

## Vertical
Users may manually choose two **canonical** M05 demonstrative Markdown exports in M02 EN/PT-BR and see changes in headline, author, summary, article prose and provided source. Differences show bounded 140-character inert excerpts. The files must be distinct local selections; the app never asserts historical chronology, file identity, published corrections, factual accuracy or rights verification.

## Privacy and safety
- Reuse `parseLocalArticlePreview` and the M05 parser with a strict 64,000-byte input limit.
- All values remain only in this browser tab; no HTTP calls, storage, provider integrations, telemetry, browser history, publication or outbound links.
- Invalid/oversized export clears the previous comparison. Explicit clear, navigation/pagehide and BFCache restore scrub local references, filenames and DOM. Per-slot version guards prevent stale asynchronous import reappearance.
- All user-controlled content is written using `textContent`; no HTML/Markdown rendering. Existing M02 fictional stories, Home, M05 editor and production admin denial remain unchanged.

## Evidence / DoD
- Node: five-field deterministic comparison, immutable DTO, invalid inputs, 140-character excerpt bounds and no-egress/no-storage contract.
- Chromium EN/PT-BR: valid two-export comparison, malicious markup inert, invalid and over-limit rejection, identical-file warning, clear, reload, focus, axe WCAG, no network writes/external requests, existing M01-M05 regression suite.
- All checks (Build, SonarCloud zero new issues, Socket, lint/typecheck, Gitleaks, Reviewdog, PR Assurance, applicable tests) must complete SUCCESS on exact HEAD. No merge until separately authorized by Owner.

## STOP
This is **NOT** an official Corrections Ledger or editorial version history: no server-side provenance, immutable audit trail, verified timestamps, authorization or publication. No deploy, billing, dependency/workflow/config change or checkpoint promotion.
