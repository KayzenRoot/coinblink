# CB-M07-I-LOCAL-001 | Session-only per-channel editorial review

**Pinned base/main:** `b919e01e7e66918b9168ae419e6757cc3d1f1c19`.
**Classification:** NECESSARY for existing LOCAL M07. **No merge authorized.**

## Scope and invariants
- Only synthetic authenticated M05 LOCAL D1-listed drafts. Saved X/Instagram/TikTok text versions receive independent PENDING, APPROVE (internal review only), REJECT (reason 8-240 characters), RESET events.
- Saving increments the selected draft/channel version and invalidates its previous decision, including when content is unchanged. Unsaved typing cannot be approved; decisions require a fresh authenticated Owner/D1 GET and session/selection race guards.
- Immutable bounded audit (120 events) records version, channel, action, reason, UTC time and canonical source-attributed variant. Rendered text only via textContent. Events are discarded on logout, session expiry/revocation and refresh, and pruned on draft revision/source/credit/authorization changes. This is NOT a durable compliance audit.
- APPROVED FOR LOCAL EDITORIAL REVIEW ONLY is never publishing authorization or clearance. NOT_CLEARED / SOURCE_VERIFICATION_PENDING / DRAFT_ONLY stay fixed. No new API, network provider call, storage or credentials.

## Tests/evidence
- Unit contracts include version lifecycle, channel isolation, invalid decisions, forged memory, stale authorized listing and private data exclusions.
- Chromium WebAuthn+D1 covers editable version save/approve/reject, isolation, logout scrubbing, server revocation and zero egress.
- Require exact-HEAD Build, SonarCloud, Socket, M07 Chromium, review and no unresolved blocking threads. If failing, CORRECTION REQUIRED. Owner must separately authorize squash merge.

## STOP
No merge, deploy, release, social posting/scheduling, LIVE prices/news, remote D1, production Owner, GEF, Quality Gate or protection edits, checkpoint promotion, PR #181/#182 changes.

**Checkpoint Delta:** proposed only; no canonical checkpoint change in this branch.
