# CB-M00-WO-001 · PR #41 synchronization Context Lock

**Lock state:** `BASE_FROZEN`; source snapshot is canonical `main` SHA `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`, merged normally into the existing PR #41 branch.
**Repository:** `KayzenRoot/coinblink`.
**Work Order:** `CB-M00-WO-001`; M00 P1 Wrangler-output correction only.
**Execution branch:** `codex/cb-m00-wrangler-structured-output`.
**Pre-sync PR head:** `d9bc2e2073c4071ff3fcda9e341cf05872e830e3`.
**Main merge commit:** `6de7469c931187ddb46fbbc2e8c94818b3436070` (parents: pre-sync PR head and `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`).
**Executor:** Codex Desktop LOCAL.
**GEF:** Bootstrap CLI `1.1.2`; official source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.

## Authority and state at the frozen base

- The canonical checkpoint at `b4ddb9891cc66cd3688b8e11a86abc75db4b8544` admits M00 and `CB-M00-WO-001`; implementation is `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, Preview is `NOT_DEPLOYED`, overall completion is `0`, and M01–M17 remain not admitted while M18 remains future/not admitted.
- The next legal stage remains `SATISFY_M00_P1_PROVIDER_AUTHORIZATION_AND_PREVIEW_EVIDENCE_GATE`.
- Scope, Requirements, Architecture, Security, Definition of Done, ADR-CB-0001, the Work Order, and the protected Preview workflow remain the controlling sources. This lock records their byte identities at the synchronized base; it changes none of their decisions.
- This continuation does not modify PR #46, does not adopt its proposed policy, does not begin M01+, and does not promote the checkpoint.
- No Cloudflare API, Wrangler Preview/delete/deploy, workflow dispatch, billing, credentials, production resource, or R2 operation is authorized by this synchronization. P1 remains pending.

## Historical provenance and integration boundary

- The original P1 correction evidence and its `baseCommitSha` `27015adc87caacabbed0e318f892644ce0473f10` are retained as historical provenance. This lock does not rewrite that snapshot.
- `comparisonBaseCommitSha` in the correction fingerprint manifest is the synchronized `main` SHA above. The candidate validator uses it only to prove exact path coverage for the current PR diff; it continues verifying source/base Git blob SHA-1 and raw SHA-256 against the original frozen correction base.
- Between the original correction base and synchronized `main`, Git reports 19 changed paths; between synchronized `main` and the pre-sync PR head, it reports 13 PR paths. Their intersection is empty. No same-path integration conflict was found. Semantic compatibility is established only by the required combined-tree test and CI results, not by this path comparison.
- The original `.engineering/context-locks/CB-M00-WO-001-EXECUTION.md` and `.engineering/context-locks/CB-M00-WO-001-P1-PREPARATION.md`, including their frozen base fingerprint tables, remain unchanged. This new lock records the later synchronization boundary.
- The only added path for this synchronization record is this Context Lock. Other candidate edits remain limited to the original 13 M00 correction paths and its fingerprint/evidence updates.

## Frozen source fingerprints

SHA-1 is the Git blob object ID and SHA-256 is computed from raw Git blob bytes at `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`; checkout newline conversion is excluded.

| Path | Git blob SHA-1 | Raw blob SHA-256 |
|---|---|---|
| `AGENTS.md` | `ac48525e1a586c65766922539d420fb8d37caccb` | `2c899a0ee1fd4b72f36b4e6446a5ff79f7662aed9c1a2766feba5bcc5cb9f68e` |
| `.engineering/SOURCE-HIERARCHY.md` | `503257fb6af2c7d95b59f92b4b68fe62a9b8b08f` | `4e9cd445ecd5f8448e88c3faec1e3a0fbf1674aa9bb9ee15b531d5f10d8decb2` |
| `.engineering/CHECKPOINT.json` | `595c1743006c07e5b9f7c4520b45ded647a5ea07` | `06d795102b453d3a446b0eaa4d26cf6be83f6471dc844d6bc7ef8f4823713d85` |
| `.engineering/CHECKPOINT.md` | `1f455d2c6392317a425587d3ae9ddf79bbf18470` | `5f572b1b2c75e08d6881494bffd61892f9121280e31ca6fbfa08e5c48b27587e` |
| `.engineering/work-orders/CB-M00-WO-001.md` | `a4ee309193e5c825283d95e828ce0839379e2694` | `cf28ad350d34c0906474b27b53bd0cb560387fd4cc13052ac7f5c69e946b6fa1` |
| `.engineering/DEFINITION-OF-DONE.md` | `3804f6f521de9f5251c4329f4cc02b8e7ec2631e` | `4952f2b7ec9ac6479c0c3723054d521b702aeee0499130e2c1e12f658a98ac5d` |
| `.engineering/SCOPE.md` | `f6b78727ec8aea1890aba2c36a42235cda8913cb` | `934239b1aeecc56a1f2ff59eb8d7f0583acc34592b8c899e6809f89389f07b60` |
| `.engineering/REQUIREMENTS.md` | `7f3834d40220a6663591bb5c568569969dc7d27f` | `3e1c0aa46c83629bd9eb2aa44fd59faeb7bc9b7fa2eb6f1fee0d6fc3744e6490` |
| `.engineering/ARCHITECTURE.md` | `a1f13a450246217ee6d1cca70354f9ca8b3ac4e4` | `2fb75be7f99d061ff8c0e7c77c6d3138775249a18c317dfa652091a11b4dd179` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `docs/DECISIONS_LEDGER.md` | `79bc32e119fc7b9e4b45a8a082bf55ed46cb6eca` | `829477e61f57b1b39e2cb8aeb3e2361da1a4a5fb9f4ce03b925948839751a28b` |
| `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` | `1bc1f0627097c30d95faa2b1faaa6f74ba79acae` | `82255f331af4c383dea4ef1c2f567aaf4b8f261cb14f5ef4dfd26c65457bf4cd` |
| `.engineering/context-locks/CB-M00-WO-001-P1-PREPARATION.md` | `747e97f7fc936740a47be8f83b746b4fe3916654` | `febd1028ec4892e6d42a1ba8037d65e3adbce0462eaea296d72f01a629e23220` |
| `.github/workflows/cloudflare-worker-preview.yml` | `5b30c9fc2fa4e5b490dd56aabf2816aa84537bb0` | `202bab411fc1fb4a45a2b4363b3c036b05465e9b4bf1ec817f1a6eb5cd29cead` |
| `.github/workflows/gef-validation.yml` | `3d9c6e3823be195074cafd8004f27de4ef59b2d8` | `1c84923eeda3d182f7ebb9c5e4b5ed4a425e802665187c072f24166c052129a4` |
| `package.json` | `77391db66af630f8dc8463f1c90f903356533322` | `0c16820bff7fb5d8cc99b6e18f451b6fe458e835d4a7b2412c1aafd1f3d07438` |
| `package-lock.json` | `bf984890253d1fc09c8cda60adf98c10e9ec4e15` | `79255c007f327d69714b76ba401e87261ae557f725af89a117b5afd609be3bd8` |
| `scripts/record-preview-output.mjs` | `69f019cb45dc536bb7077a6b20e746bd335162a7` | `ed398421ff608185f6052c7ff3bebea1a09285547c8fe241d07c0ef0eace0ac1` |
| `test/cloudflare-preview-output.test.mjs` | `c8abebfb8c90e4f34e7f057d181d5fe268a5297e` | `9a979306853fda27141b6600ba4c0a54d1df3956154e591f41a90c0528337a8e` |
| `test/cloudflare-preview-workflow.test.mjs` | `7a05aca1ac09d4382d9139b6ea5586ea4d5e7695` | `d3d00d830dc8213556566848cb6dbbce8a5f80d279dbc735ee3437d9af6d5729` |

## Validation boundary

The frozen values above are verified against the synchronized base. Candidate hashes are maintained by `.engineering/evidence/CB-M00-WO-001-P1-WRANGLER-OUTPUT-FIX-FINGERPRINTS.json`; its candidate-only validator must pass on the current PR branch and exact combined tree. Run the pinned Node `22.19.0` / npm `10.9.3` local gates, GEF doctor/status, audit, lint, typecheck, full unit/build/Playwright suite, and safe Docker smoke. Then push this same PR branch and verify exact-head Ubuntu/Windows GEF, Docker Compose, SonarCloud, Socket, and full CodeRabbit. A provider Preview remains unexecuted until its separate current account/secret/plan/cost/IAM/isolated-resource gates are satisfied and the protected environment authorizes the run.
