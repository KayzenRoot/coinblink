# CB-M00-WO-001 · P1 URL Identity Correction Context Lock

**Lock state:** `BASE_FROZEN / CORRECTION CANDIDATE`.
**Repository:** `KayzenRoot/coinblink`.
**Work Order:** `CB-M00-WO-001`; admitted M00, P1 Preview workflow correction only.
**Base:** verified canonical `main` SHA `9c900fda5044c1cfa42934f20dcd3621a48cd613` (PR #41 merge).
**Branch:** `codex/cb-m00-wo-001-p1-url-identity`.
**GEF:** Bootstrap `1.1.2`, source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.

## Frozen authority and state

- `.engineering/SOURCE-HIERARCHY.md`, `.engineering/CHECKPOINT.json`, the admitted Work Order, Security, Definition of Done, ADR-CB-0001, the pinned Wrangler package, and the protected workflow at the base are the authority for this correction.
- The canonical checkpoint at base admits M00 only, records `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, `previewDeployment=NOT_DEPLOYED`, and `overallCompletionPercent=0`. M01–M17 remain not admitted; M18 remains future/not admitted; there is no `stopState`.
- The official run `38045607351` created a real isolated Preview but concluded `FAILURE` in its output recorder. This Context Lock does not promote P1 or change the checkpoint; the live Preview and its independent verification are documented as operational evidence, separately from workflow success.
- Existing Context Locks, the Work Order, Scope, Architecture, Security, DoD, ADR, workflow, dependency versions, `wrangler.jsonc`, and canonical checkpoint are immutable under this correction.
- The previous P1 preparation Context Lock remains frozen and describes its earlier base. This correction has a separate lock bound to `9c900f…`; no old lock or fingerprint was rewritten.

## Bounded write set

1. `scripts/record-preview-output.mjs`: map a UUID deployment ID to the documented eight-character immutable Preview hostname identity, while retaining exact Worker, Preview name, HTTPS, URL-origin, uniqueness, and identifier checks.
2. `test/cloudflare-preview-output.test.mjs`: add mock regressions for the UUID/prefix contract and rejection of a mismatched prefix.
3. Add only this correction Context Lock, the dated Evidence Bundle addendum, its fingerprint manifest, a no-promotion Checkpoint Delta proposal, and the three screenshots captured from the actual stable Preview URL in run `38045607351`.
4. Append one link/status update to `.engineering/evidence/CB-M00-WO-001-EVIDENCE.md` so its current operational status points to the addendum.

No Worker configuration, secrets, Cloudflare resource, production route, CI gate, module boundary, or application feature is changed by this correction.

## Base fingerprints

Git blob SHA-1 and raw blob SHA-256 are computed from the exact base commit's Git object bytes.

| Path | Git blob SHA-1 | Raw blob SHA-256 |
|---|---|---|
| `AGENTS.md` | `ac48525e1a586c65766922539d420fb8d37caccb` | `2c899a0ee1fd4b72f36b4e6446a5ff79f7662aed9c1a2766feba5bcc5cb9f68e` |
| `.engineering/SOURCE-HIERARCHY.md` | `503257fb6af2c7d95b59f92b4b68fe62a9b8b08f` | `4e9cd445ecd5f8448e88c3faec1e3a0fbf1674aa9bb9ee15b531d5f10d8decb2` |
| `.engineering/CHECKPOINT.json` | `595c1743006c07e5b9f7c4520b45ded647a5ea07` | `06d795102b453d3a446b0eaa4d26cf6be83f6471dc844d6bc7ef8f4823713d85` |
| `.engineering/CHECKPOINT.md` | `1f455d2c6392317a425587d3ae9ddf79bbf18470` | `5f572b1b2c75e08d6881494bffd61892f9121280e31ca6fbfa08e5c48b27587e` |
| `.engineering/work-orders/CB-M00-WO-001.md` | `a4ee309193e5c825283d95e828ce0839379e2694` | `cf28ad350d34c0906474b27b53bd0cb560387fd4cc13052ac7f5c69e946b6fa1` |
| `.engineering/DEFINITION-OF-DONE.md` | `3804f6f521de9f5251c4329f4cc02b8e7ec2631e` | `4952f2b7ec9ac6479c0c3723054d521b702aeee0499130e2c1e12f658a98ac5d` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` | `1bc1f0627097c30d95faa2b1faaa6f74ba79acae` | `82255f331af4c383dea4ef1c2f567aaf4b8f261cb14f5ef4dfd26c65457bf4cd` |
| `.github/workflows/cloudflare-worker-preview.yml` | `adf7c2f46fb1819671584707d0780a5c84eb5a6a` | `4b59eb40f07cd75dde2618926df493965c54438ac76210ee915147b5efd7f669` |
| `scripts/record-preview-output.mjs` | `6c2f58f0a2c304f47bbe55487d20cd74f6490139` | `86a48563d6aa6d7e1b2a4e0c800d70e1561eb28119c2ef185ed32ac88d547aa1` |
| `test/cloudflare-preview-output.test.mjs` | `fb9bf318038666686f58824a80570511837cfae2` | `48025009e30b685abfa65ad9ceb783bc627fabdb76c1780aa60ee253f4dbc819` |
| `package.json` | `77391db66af630f8dc8463f1c90f903356533322` | `0c16820bff7fb5d8cc99b6e18f451b6fe458e835d4a7b2412c1aafd1f3d07438` |
| `package-lock.json` | `bf984890253d1fc09c8cda60adf98c10e9ec4e15` | `79255c007f327d69714b76ba401e87261ae557f725af89a117b5afd609be3bd8` |
| `wrangler.jsonc` | `980a4af6a5c3cd40a37797ad53d27530a54bbbe2` | `9e384a485e0bb610da3dd06160da2bfad2bfba807166e6f7d38a8e0c0dfba046` |

## Exit gates

- Keep the correction isolated to the two parser/test paths and the bounded evidence files above.
- Run the full pinned local test, lint, typecheck, build, security, and GEF checks; record linked-worktree observer findings without calling them a clean GEF pass.
- Require exact-head GitHub CI, security checks, and fresh independent review on the final correction PR HEAD.
- Do not re-dispatch Cloudflare from this candidate branch. After owner audit and merge, run the existing protected workflow against exact current `main`, obtain its per-run Environment approval, and require the complete workflow to succeed.
- Do not promote the checkpoint or mark P1/M00 complete in this correction. Preserve 0% and the M00-only admission boundary.
