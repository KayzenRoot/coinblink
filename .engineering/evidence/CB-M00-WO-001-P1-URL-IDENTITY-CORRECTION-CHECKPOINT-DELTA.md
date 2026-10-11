# Proposed Checkpoint Delta · CB-M00-WO-001 P1 URL identity correction

**State:** `PROPOSED / NO PROMOTION IN THIS CHANGE`.
**Base:** canonical `main` `9c900fda5044c1cfa42934f20dcd3621a48cd613`.
**Correction candidate:** see the final PR HEAD and exact-head checks; current operational evidence is in `CB-M00-WO-001-P1-URL-IDENTITY-CORRECTION.md`.

The official protected workflow run `38045607351` created an isolated Preview and Cloudflare currently shows it as Ready. Both actual stable and immutable URLs independently passed the repository's route/security verifier at the exact main build SHA. The workflow itself concluded `FAILURE` because the recorder rejected Wrangler's UUID deployment identity format. Accordingly, this correction does not claim a successful official P1 run and proposes no canonical checkpoint promotion.

| Canonical checkpoint field | Value kept unchanged in this correction | Promotion boundary |
|---|---|---|
| `status` | `M00_ADMITTED` | Preserve M00-only admission. |
| `phase` | `IMPLEMENTATION_IN_PROGRESS` | P1 and M00 DoD remain incomplete. |
| `completedThroughModule` | `NONE` | No module is marked complete. |
| `overallCompletionPercent` | `0` | No approved project denominator exists. |
| `checkpointFacts.applicationImplementation` | `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING` | A real Preview resource alone does not finish P1. |
| `checkpointFacts.previewDeployment` | Canonical file remains `NOT_DEPLOYED` until an audited checkpoint update | Do not rewrite this field from a failed workflow run. Reassess only after corrected exact-main workflow success and audit; capture the live resource fact in Evidence Bundle meanwhile. |
| module map | M00 `ADMITTED`; M01–M17 `NOT_ADMITTED`; M18 `FUTURE_NOT_ADMITTED` | No admission change. |
| `stopState` | Absent | No stop state is introduced. |

**Required before any later promotion:** correction PR exact-head CI and independent review; authorized merge; new protected workflow run on current canonical `main` with its Environment approval; successful output recording and remote validation of both URLs, routes, security headers, noindex, isolation, and responsive browser evidence; then a separate audited checkpoint delta based on the resulting exact main SHA. Do not mark M00 `DONE` or start M01+ here.
