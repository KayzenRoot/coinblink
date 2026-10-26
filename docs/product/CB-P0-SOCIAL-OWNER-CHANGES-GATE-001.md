# CB-P0-SOCIAL-OWNER-CHANGES-GATE-001 · M05 Owner change request gate for M07 social concepts

**Main baseline:** `33564e59baeef1712987c4e1f9015292c735818a`; exclusive branch `feat/cb-p0-social-owner-changes-gate-001`. M07 is P0 and already consumes authenticated LOCAL M05 D1 draft metadata.

## Why NECESSARY and not duplicate
Prior main merges integrate M03→M05, M05→M02, M07→M05, M08→M05, M05→M06 and immutable Owner review/history. None prevents M07 from generating a new X/Instagram/TikTok concept when the **current saved revision** has an explicit immutable `CHANGES_REQUESTED` Owner decision. The original M07 mock preview, variant and in-memory calendar all funnel through `createLocalSocialPreview`, making a single strict fail-closed enforcement point the smallest vertical. It is a decision enforcement guard, not another handoff, export or publication workflow. No overlap with the 13 unrelated preexisting open PRs, including ECC #209.

## Implementation
1. M07 validates the authenticated M05 D1 row using existing M06 queue contract. For `PRIVATE_CHANGES_REQUESTED` on the *current saved revision*, reject social preview generation, variant composition, local approval events that require canonical variants, and new hypothetical calendar ideas. Other states retain original behavior: `PREVIEW_REVIEWED` is **private-process-only**, not rights clearance; `null` means unreviewed and creates only fictitious concepts, never publication. Forged/invalid decisions already fail closed.
2. Protected M07 draft picker displays current Owner status as inert text; blocked actions show accessible status. The same session/focus metadata equality compares `current_review_decision`, so external same-revision changes invalidate old client choices and stale cards.
3. Existing protected `refresh()` scrubs LOCAL preview/card/variant data when M05 Owner saves a decision. A new persisted revision has no inherited review status. No new route, write, DB schema, consent, social API, credentials, scheduler, endpoint or live data.
4. Keep M05 WebAuthn Origin/CSRF/Fetch-Metadata guards, no reviewer notes/body in M07, textContent-only display, and existing rights/status `NOT_CLEARED`, `DRAFT_ONLY` and `SOURCE_VERIFICATION_PENDING`.

## Mandatory tests and stop
Node: current `CHANGES_REQUESTED` blocks all 3 channels, variants and hypothetical calendar; forged values fail; later revision without current decision remains a purely fictitious concept. Hosted Chromium/D1: private Owner passkey, saved draft, visible initial mock card, current decision causes scrub and block, new revision re-allows purely mock preview, no leaked private body or note, logout + 401 and zero off-origin egress. Exact HEAD CI/Node/Chromium, Build, SonarCloud 0 new issues/0 Security Hotspots, Socket both scans, Gitleaks, independent `kayzenweb3` APPROVED, zero threads. **Draft, no merge, deploy, posting, remote D1, real data, spending or changes to configs/checkpoints/main/ECC #209/other PRs.**
