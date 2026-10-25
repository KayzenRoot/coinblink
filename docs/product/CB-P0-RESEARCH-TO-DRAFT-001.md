# CB-P0-RESEARCH-TO-DRAFT-001 · M08 to M05 Manual Synthetic Research Handoff

**Base:** `5fccd10d3d3591056f04951b8968658bfcc9f4df`. **Branch:** `feat/cb-p0-research-to-owner-draft-001`. Scope: new LOCAL/OFFLINE P0 integration, no production behavior.

## Audit / rationale
- Main already integrates M03 fictional provenance → M05 (#218), M05 Markdown → M02 manual preview (#217), Owner current (#219) and historical (#220) reviews and M07 weekly-to-draft navigation. No duplicate bridge was introduced.
- M08 builds an eight-blocker fictitious M03+M04 research brief, but no handoff to the private M05 editor existed.
- Other preexisting open PRs, including ECC #209, remain outside this change.

## Approved by task request: implementation scope only
- Download exact canonical M08 JSON from the public OFFLINE research lab; no API, AI, real market price, source fetch, rights, permissions or storage.
- Existing isolated M05 LOCAL WebAuthn Owner CMS accepts only nine strictly reconstructed source+market combinations, max 4096 bytes; forged metadata, blockers, quotes, verification, rights, extra keys and invalid IDs fail closed.
- Preview in private CMS via textContent. Explicit confirmation appends a clearly marked unverified mock blocker note to the **unsaved body only**. Existing Owner text preserved. Reject duplicates and >40000-character body. No save on import; preexisting authenticated Save remains the sole persistence point.
- Bound file inspection to sessionEpoch, readGeneration, draftOpenGeneration and snapshot; clear pending and DOM on logout/401/new draft/alternate draft.
- Preserve M03 source-only handoff and M05→M02 Markdown import, privileged route guards, CSRF/Origin, same-origin, D1 immutability and no privileged production Admin.
- No new dependencies, route, D1 migration, workflow/config, endpoint, credentials or external services.

## Required exact-HEAD gates / STOP
GitHub CI including Build, local integrated Chromium, M05 WebAuthn/D1 Chromium, Node tests, quality, SonarCloud 0 new issues/0 hotspots, Socket Project Report and Pull Request Alerts, review by independent kayzenweb3 at HEAD, 0 threads. Preserve LCOV caveat explicitly. Keep PR Draft and do not merge, deploy, publish, spend or touch remote D1, main, ECC #209 or any other PR.
