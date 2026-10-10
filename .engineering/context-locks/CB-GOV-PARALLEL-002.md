# Context Lock · CB-GOV-PARALLEL-002

**State:** `LOCKED / CORRECTION_ONLY`
**Repository:** `KayzenRoot/coinblink`
**Base SHA:** `e98d581c7306ab255af9b96e7c046db6f49acf12`
**Worktree identity:** `cb-gov-parallel-002` (logical identifier; host path omitted)
**Branch:** `codex/cb-gov-parallel-002`
**Issue:** #43, body SHA-256 `5cd688ef6a110a9ea003523b4753c1f5ebd84076c9dc3a9cfe82753d833f3298`
**GEF:** `1.1.2`, source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.

## Live repository and PR baseline

- GitHub `main` was fetched and confirmed at the exact SHA above before the branch was created.
- PR #42 is merged in `main`; the immutable proposal commit is this base, with parent `27015adc87caacabbed0e318f892644ce0473f10`.
- PR #41 is OPEN, non-draft, base `27015adc87caacabbed0e318f892644ce0473f10`, head `d9bc2e2073c4071ff3fcda9e341cf05872e830e3`. All seven check statuses passed at inspection: CodeRabbit, Docker Compose smoke, Ubuntu GEF/M00, Windows GEF/M00, SonarCloud, Socket Project Report, and Socket PR Alerts. The `reviewDecision` is empty. No merge action is authorized.
- Canonical checkpoint at the base: M00 admitted/in progress; local P0 implemented and P1 pending; preview `NOT_DEPLOYED`; overall progress 0%; `completedThroughModule=NONE`; M01–M17 not admitted; M18 future/not admitted. No checkpoint edit is in scope.
- The Issue #43 body hash records the requested correction and stop condition. GitHub state remains higher authority for changing PR/CI values.

## Authority and source fingerprints

The following Git blob object IDs and SHA-256 hashes of the canonical blob contents (the exact bytes stored in Git, without the Git object header) were read at the locked base. These hashes are independent of working-tree line-ending conversion. A source change requires a new baseline review before further edits; it does not authorize broadening this Work Order.

| Path | Git blob SHA-1 | Canonical blob SHA-256 |
|---|---|---|
| `AGENTS.md` | `ac48525e1a586c65766922539d420fb8d37caccb` | `2c899a0ee1fd4b72f36b4e6446a5ff79f7662aed9c1a2766feba5bcc5cb9f68e` |
| `.engineering/SOURCE-HIERARCHY.md` | `503257fb6af2c7d95b59f92b4b68fe62a9b8b08f` | `4e9cd445ecd5f8448e88c3faec1e3a0fbf1674aa9bb9ee15b531d5f10d8decb2` |
| `.engineering/CHECKPOINT.json` | `595c1743006c07e5b9f7c4520b45ded647a5ea07` | `06d795102b453d3a446b0eaa4d26cf6be83f6471dc844d6bc7ef8f4823713d85` |
| `.engineering/CHECKPOINT.md` | `1f455d2c6392317a425587d3ae9ddf79bbf18470` | `5f572b1b2c75e08d6881494bffd61892f9121280e31ca6fbfa08e5c48b27587e` |
| `.engineering/SCOPE.md` | `f6b78727ec8aea1890aba2c36a42235cda8913cb` | `934239b1aeecc56a1f2ff59eb8d7f0583acc34592b8c899e6809f89389f07b60` |
| `.engineering/REQUIREMENTS.md` | `7f3834d40220a6663591bb5c568569969dc7d27f` | `3e1c0aa46c83629bd9eb2aa44fd59faeb7bc9b7fa2eb6f1fee0d6fc3744e6490` |
| `.engineering/ARCHITECTURE.md` | `a1f13a450246217ee6d1cca70354f9ca8b3ac4e4` | `2fb75be7f99d061ff8c0e7c77c6d3138775249a18c317dfa652091a11b4dd179` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `.engineering/DEFINITION-OF-DONE.md` | `3804f6f521de9f5251c4329f4cc02b8e7ec2631e` | `4952f2b7ec9ac6479c0c3723054d521b702aeee0499130e2c1e12f658a98ac5d` |
| `docs/DECISIONS_LEDGER.md` | `79bc32e119fc7b9e4b45a8a082bf55ed46cb6eca` | `829477e61f57b1b39e2cb8aeb3e2361da1a4a5fb9f4ce03b925948839751a28b` |
| `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` | `1bc1f0627097c30d95faa2b1faaa6f74ba79acae` | `82255f331af4c383dea4ef1c2f567aaf4b8f261cb14f5ef4dfd26c65457bf4cd` |
| `docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md` | `07b8cde6542aef7ef4d4ddc2fe91cf8e5ba903d0` | `59de022a38b31e96fca3ce4c94f8182ff34a8a70568518cad0a72af9c512343e` |
| `.engineering/work-orders/CB-GOV-PARALLEL-001.md` | `92991b7ff731b1854a0cf6dc9e59b8d08828b334` | `486166b8a7841ec3566466c1a1099a916154539441d298a65c57a07bf089f847` |
| `.engineering/work-orders/CB-M00-WO-001.md` | `a4ee309193e5c825283d95e828ce0839379e2694` | `cf28ad350d34c0906474b27b53bd0cb560387fd4cc13052ac7f5c69e946b6fa1` |
| `.engineering/CB-M00-ADMISSION.md` | `1dc43704fdc3536ae051f89a477ec0a66c144c39` | `8d30679cd873d213962be8f4e6dccdbb6a44061aa6f8630836e76650758d3886` |
| `.engineering/context-locks/CB-M00-WO-001-EXECUTION.md` | `406136fded6c7dd90a415996cf387257d98eef8c` | `a209324291429ce22495abc0b3c7029e84686f621cadff80b1b6ff1f97eaee1e` |
| `.engineering/context-locks/CB-GOV-PARALLEL-001.md` | `d83d590ea0b00be0919d531c374732ea6ab0e7a9` | `3f171657bc2100abc70cf4c22ddba728ab88cd53e458f91df32338fb80b27875` |
| `.engineering/evidence/CB-GOV-PARALLEL-001-FINGERPRINTS.json` | `c3388b36bb71fee8529d10a1bcb0795bcb279ff3` | `37dddfe28c5a99badcbdf16256ddbdefc5a357044f3051caf7118d05a307a909` |
| `test/governance-parallel-plan.test.mjs` | `40eb3afb2c429b55a2754f0194794654c2d1c13e` | `7ad000d7095df52e5b90218bf0586eaa91b970cc9b16e72c78d4f6a2b6ea0275` |
| `test/gef-cli.test.mjs` | `54269dba0a596ce283eca96c911b541a284ab529` | `df9e009b215a88cf151db34927d1f814d24f200d0e28513cc51d797835c42f21` |
| `package.json` | `77391db66af630f8dc8463f1c90f903356533322` | `0c16820bff7fb5d8cc99b6e18f451b6fe458e835d4a7b2412c1aafd1f3d07438` |
| `package-lock.json` | `bf984890253d1fc09c8cda60adf98c10e9ec4e15` | `79255c007f327d69714b76ba401e87261ae557f725af89a117b5afd609be3bd8` |
| `.github/workflows/gef-validation.yml` | `3d9c6e3823be195074cafd8004f27de4ef59b2d8` | `1c84923eeda3d182f7ebb9c5e4b5ed4a425e802665187c072f24166c052129a4` |
| `.github/workflows/cloudflare-worker-preview.yml` | `5b30c9fc2fa4e5b490dd56aabf2816aa84537bb0` | `202bab411fc1fb4a45a2b4363b3c036b05465e9b4bf1ec817f1a6eb5cd29cead` |

The issue-body hash is recorded above because it is external to Git. Hashes are provenance only and grant no authority.

## Write boundary

Only the exact nine paths listed under “Scope and proposed files” in `.engineering/work-orders/CB-GOV-PARALLEL-002.md` may change. The live checkpoint, all other canonical governance sources, PR #42 proposal artifacts, application files, package/workflow configuration, Cloudflare resources, Issues, other branches/worktrees, and PR #41 remain untouched. The historical verifier reads `e98d581...` and parent `27015adc...` by immutable commit IDs only. Synthetic future state exists only in an automatically removed temporary clone.

## Validation and stop

The local baseline's 16 governance tests pass on the frozen base, but synthetic later checkpoint/path changes exposed four false failures before correction. Full validation is pending publication; the exact head's GitHub checks are authoritative after push. Stop at a reviewed PR. Do not merge, promote the checkpoint, or start any product module.
