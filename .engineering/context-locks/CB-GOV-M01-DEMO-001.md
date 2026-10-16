# CB-GOV-M01-DEMO-001 — Candidate Context Lock

**State:** PROPOSED / ROUTE_B_SELECTED_FOR_PREPARATION / NON-EFFECTIVE MERGE AUTHORITY.
**Repository:** `KayzenRoot/coinblink`, **verified current `visibility=public` and `private=false`** from GitHub authenticated repo metadata on 2026-10-15. **Main commit pinned:** `85ece8e63e56ac8006701eda121f462d901d2d2f`.
**Owner route choice (2026-10-15):** Keep CoinBlink repository **PUBLIC**, prepare M01 DEMO code integration into protected `main` with **NO DEPLOY**, **NO COMMERCIAL PUBLICATION**, and all rights/DoD/CI/Owner exact-SHA gates before merging. This is a binding preparation preference, **not** an authorized merge. Issues #60/#72 are the current cross-references. If any subsequent Owner decision changes branch/repo visibility or integration scope, refresh this lock.

**Parent product PR #58:** `c7c8ee2239d3e4468d80f06efe345b2849a20ede`; latest technical-delta COMMENT review `5533812621`. **No product merge authorized.**

## Canonical Git blob SHA-1 inputs at base

| Input | Blob SHA-1 |
| --- | --- |
| `AGENTS.md` | `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7` |
| `.engineering/SOURCE-HIERARCHY.md` | `38ede6577b26a1c73ee0ca7b24488e21e14ab4d5` |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` |
| `.engineering/SCOPE.md` | `80fa60e1557e2b4a46b10088eb83040662b39f04` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` |
| `docs/DECISIONS_LEDGER.md` | `d33b083a9fd31f9d7509e5a39f76f183cb961a3f` |
| `.engineering/work-orders/CB-M01-WO-001.md` | `1a29abc4e8ca7ec134b14c68cc4fed7a5e1163c5` |
| `.engineering/proposals/CB-GOV-FAST-001-RISK-BASED-FAST-LANE.md` | `cfb773bab09fffcda10b6e112fa3f5bf758037c4` |
| `.github/workflows/gef-validation.yml` | `d29833428c93e9c8479909255d285f61d839bdb1` |
| `.github/workflows/cloudflare-worker-preview.yml` | `d302d6b2878fc829553870f973f7d0e44eb32c4c` |

**Checkpoint:** `M00_COMPLETE / IMPLEMENTATION_IN_PROGRESS / 5%`; `CB-M01=ADMITTED`, `activeWorkOrder=NONE`. **Brand/rights:** Issue #72 currently `rightsReview=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, `authorizedToMerge=false`. The GitHub PR #58 HEAD hosts **six successful checks**, plus CodeRabbit status success despite auto-review disabled. A prior substantive technical-delta review has been recorded but is not a public-release or admin GO.

## Workflow boundaries observed
- `gef-validation.yml` on `pull_request` and `push` to main: deterministic CI, **no Cloudflare deployment steps**.
- `cloudflare-worker-preview.yml` on explicit `workflow_dispatch`: requires protected Owner environment and explicit inputs. **No deployment observed or authorized by this preparation**. Other external auto-deploy hooks/providers have not been exhaustively inspected and must be verified before GO.
- Existing public-source exposure is real irrespective of runtime deployment. A change to GitHub visibility or copying to a new private repo is **not** part of this Work Order.

## Write allowlist
Only:
1. `.engineering/proposals/CB-GOV-M01-DEMO-001-VISIBILITY-AND-INTEGRATION.md`
2. `.engineering/work-orders/CB-GOV-M01-DEMO-001.md`
3. `.engineering/context-locks/CB-GOV-M01-DEMO-001.md`

**Explicit denylist:** `src/**`, `public/**`, `test/**`, `assets/**`, `.github/**`, other WOs/ADRs, checkpoint, workflows, ruleset, permissions, repository visibility, Cloudflare, all M01/M05/brand PR branches and `main`.

## Invalidation and recovery
Prior to any future merge or code transfer check: live GitHub repo `private/visibility`; actual target destination visibility; `main` and product PR head SHA; Git blobs above; protected ruleset and checked statuses; exact deploy behavior; updated Issue #72 decisions. On divergence, create the smallest Context Lock delta and perform only relevant re-review. Do not ignore HIGH/CRITICAL findings; do not assume private hosting from an access-restricted GitHub branch or Preview URL.

## STOP
End at a **documentation-only, draft PR** and the rights plus final exact-SHA admin GO gates. Route B has already been selected for *preparation*, so do not ask for a redundant A/B/C selection. No governance document in this candidate authorizes integration or commercial use. Product `authorizedToMerge=false` remains unchanged, and no checkpoint promotion is proposed.

## R70 live-source refresh · 2026-10-15

The historical base anchors above are retained; current GitHub API and fetched product `main` read back **58321c21508bd6089de1c1a77c21f93a4f0b856a**. PR #80 remote head before this append was `c3eb4ce8e97bf7564dd1ee33ba167a3f875bd3e2`; its separate worktree received a conflict-free ordinary merge of current main at `f0f4e527652b11305c488c2af31997e9e5d91b2c`. No rebase, force-push, main merge, application edit, or deployment occurred. The repository metadata readback remains `visibility=public`, `private=false`.

### Current source Git blob identities at main `58321c2…`

| Canonical source | Blob SHA-1 |
|---|---|
| `AGENTS.md` | `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7` |
| `.engineering/SOURCE-HIERARCHY.md` | `46b2f93c9cc65a468e33b16036e8c5627a442d4d` |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` |
| `.engineering/SCOPE.md` | `80fa60e1557e2b4a46b10088eb83040662b39f04` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` |
| `docs/DECISIONS_LEDGER.md` | `d33b083a9fd31f9d7509e5a39f76f183cb961a3f` |
| `.engineering/work-orders/CB-M01-WO-001.md` | `1a29abc4e8ca7ec134b14c68cc4fed7a5e1163c5` |
| `.engineering/proposals/CB-GOV-FAST-001-RISK-BASED-FAST-LANE.md` | `cfb773bab09fffcda10b6e112fa3f5bf758037c4` |
| `.github/workflows/gef-validation.yml` | `d29833428c93e9c8479909255d285f61d839bdb1` |
| `.github/workflows/cloudflare-worker-preview.yml` | `d302d6b2878fc829553870f973f7d0e44eb32c4c` |

The Source Hierarchy changed from `38ede6577b26a1c73ee0ca7b24488e21e14ab4d5` at this proposal's old base to `46b2f93c9cc65a468e33b16036e8c5627a442d4d`; PR #82 is merged and the single-owner process applies. Read-only ruleset #24888106 remains active on main only: `required_approving_review_count=0`, `require_last_push_approval=false`, PR+squash, thread resolution, strict seven checks, empty bypass list, deletion/non-fast-forward protection. No ruleset or workflow change was made.

### Current gates

- PR #58 is OPEN at exact candidate `18e00f6180dfcb1003a1291739479c26af01c946`, based on current main. Its latest exact-head check state is on GitHub; this preparation PR grants no merge authority.
- PR #59 and #85 are already in current main; this R70 operation did not merge them. PR #77 remains a separate OPEN/DRAFT SVG demo-only library, with no header/favicon integration or commercial clearance.
- Issue #72 is OPEN. Its latest public-web preliminary search did not verify an official INPI record, but no official case-database query or asset-level legal clearance is established. `rightsReview=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, `authorizedToMerge=false`.
- The machine checkpoint is unchanged: M00 COMPLETE, implementation in progress, 5%, M01/M05 admitted, neither formally complete. Route B remains selected for preparation only; no deploy or commercial-publication decision is inferred.
