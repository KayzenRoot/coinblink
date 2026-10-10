# Context Lock · CB-M00-WO-001 P1 evidence closeout

**Lock state:** `BASE_FROZEN / EVIDENCE-ONLY CLOSEOUT CANDIDATE`.
**Repository:** `KayzenRoot/coinblink`.
**Work Order:** `CB-M00-WO-001` (existing admitted M00 Work Order).
**Canonical base:** verified `main` SHA `e8886e21c6f152ca374b1e42852c6b6638543f40`.
**Branch:** `codex/cb-m00-wo-001-p1-closeout`.
**GEF:** Bootstrap CLI `1.1.2`; source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.
**Base fingerprint manifest:** `.engineering/evidence/CB-M00-WO-001-P1-CLOSEOUT-BASE-FINGERPRINTS.json` (SHA-256 `c22fa7d58c494b9e9b175762f61733f8d8ff69fcc706f2dad7cacbbece6e68a6`).

## Frozen authority and canonical state

- Source Hierarchy, current canonical checkpoint, admitted CB-M00-WO-001, M00 Scope/Requirements/Architecture/Security/DoD, Decisions Ledger, ADR-CB-0001, protected Preview workflow, Wrangler/Astro configuration and pinned dependencies are fingerprinted below at exact base bytes.
- At base, the machine checkpoint is `M00_ADMITTED`, `IMPLEMENTATION_IN_PROGRESS`, `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, preview `NOT_DEPLOYED`, overall `0%`, completed module `NONE`, M01–M17 `NOT_ADMITTED`, M18 `FUTURE_NOT_ADMITTED`; there is no `stopState`. The checkpoint file is outside the write set.
- Protected Preview run [38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879) is a verified operational event on this base; its actual URLs and browser/billing evidence are recorded in the closeout Evidence Bundle. GEF checkpoint and operational provider state remain distinct until a separate audited checkpoint action.
- Existing Context Locks, `.engineering/CHECKPOINT.json`, application routes/components/styles, workflow, dependency manifest/lock, Cloudflare resources/secrets/billing, and all modules except evidence documentation are immutable for this candidate.
- The prior P1 recovery instruction is Issue #36 comment [6097266338](https://github.com/KayzenRoot/coinblink/issues/36#issuecomment-6097266338); its host allowlist, exact-SHA health-before-write, no-origin-bypass and read-only provider rules are honored.

## Bounded write set

1. Add one isolated evidence collector under `scripts/collect-m00-preview-evidence.mjs`, its strict exact-origin/redirect guard under `scripts/preview-evidence-origin-guard.mjs`, a fixed-name stale-artifact cleanup helper under `scripts/preview-evidence-output-cleanup.mjs`, and focused local regression tests under `test/`; these have no application runtime role/dependency. The collector only requests the two exact Preview HTTPS origins, rejects other origins, blocks 3xx responses before navigation or resources can follow them, and stops before output when exact-SHA `/health` fails. It removes only the known prior run artifacts after that exact-SHA gate passes. The insecure-loopback exception exists only as an explicit test option and is disabled in the collector.
2. Add the three actual responsive PNGs and machine-readable/log/hash outputs under `.engineering/evidence/CB-M00-WO-001-P1-preview-run-38049696879/`.
3. Add the closeout Evidence Bundle, no-promotion proposed Checkpoint Delta, immutable-base fingerprint manifest, candidate fingerprint manifest and this Context Lock.
4. Append dated status corrections to `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, `.engineering/CHECKPOINT.md`, `.engineering/DEFINITION-OF-DONE.md`, `.engineering/work-orders/CB-M00-WO-001.md`, `.engineering/evidence/CB-M00-WO-001-EVIDENCE.md`, earlier non-lock P1 Evidence Bundles, `docs/DECISIONS_LEDGER.md`, ADR-CB-0001, and the Cloudflare operations guide. Older Context Locks and dated event narratives are preserved.

No application behavior, package manifest, Cloudflare configuration, workflow, checkpoint JSON, secrets, provider resource, billing setting, production route or module admission is changed.

## Base fingerprints

Git blob SHA-1 is calculated over the Git blob header and exact base bytes; raw SHA-256 is calculated over the exact blob bytes. The full manifest is stored at the path above.

| Path | Git blob SHA-1 | Raw SHA-256 |
|---|---|---|
| `AGENTS.md` | `ac48525e1a586c65766922539d420fb8d37caccb` | `2c899a0ee1fd4b72f36b4e6446a5ff79f7662aed9c1a2766feba5bcc5cb9f68e` |
| `.engineering/SOURCE-HIERARCHY.md` | `503257fb6af2c7d95b59f92b4b68fe62a9b8b08f` | `4e9cd445ecd5f8448e88c3faec1e3a0fbf1674aa9bb9ee15b531d5f10d8decb2` |
| `.engineering/CHECKPOINT.md` | `1f455d2c6392317a425587d3ae9ddf79bbf18470` | `5f572b1b2c75e08d6881494bffd61892f9121280e31ca6fbfa08e5c48b27587e` |
| `.engineering/CHECKPOINT.json` | `595c1743006c07e5b9f7c4520b45ded647a5ea07` | `06d795102b453d3a446b0eaa4d26cf6be83f6471dc844d6bc7ef8f4823713d85` |
| `.engineering/CB-M00-ADMISSION.md` | `1dc43704fdc3536ae051f89a477ec0a66c144c39` | `8d30679cd873d213962be8f4e6dccdbb6a44061aa6f8630836e76650758d3886` |
| `.engineering/SCOPE.md` | `f6b78727ec8aea1890aba2c36a42235cda8913cb` | `934239b1aeecc56a1f2ff59eb8d7f0583acc34592b8c899e6809f89389f07b60` |
| `.engineering/REQUIREMENTS.md` | `7f3834d40220a6663591bb5c568569969dc7d27f` | `3e1c0aa46c83629bd9eb2aa44fd59faeb7bc9b7fa2eb6f1fee0d6fc3744e6490` |
| `.engineering/ARCHITECTURE.md` | `a1f13a450246217ee6d1cca70354f9ca8b3ac4e4` | `2fb75be7f99d061ff8c0e7c77c6d3138775249a18c317dfa652091a11b4dd179` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `.engineering/DEFINITION-OF-DONE.md` | `3804f6f521de9f5251c4329f4cc02b8e7ec2631e` | `4952f2b7ec9ac6479c0c3723054d521b702aeee0499130e2c1e12f658a98ac5d` |
| `.engineering/work-orders/CB-M00-WO-001.md` | `a4ee309193e5c825283d95e828ce0839379e2694` | `cf28ad350d34c0906474b27b53bd0cb560387fd4cc13052ac7f5c69e946b6fa1` |
| `.engineering/evidence/CB-M00-WO-001-EVIDENCE.md` | `dd337a77bd75fdbd6b3b3e432c95f0887105d6f4` | `d4ad7c4590d73daf58991c16c5c547fe708d2871c6094e0d42926df8d46248bb` |
| `.engineering/evidence/CB-M00-WO-001-CHECKPOINT-DELTA.md` | `4032b682165ba8e722e998f93a9c518f07960f91` | `4a9151fabdf9cf1d7f1b1cf01272608d57da6afef2bb18faaff352a75926631f` |
| `.engineering/evidence/CB-M00-WO-001-P1-PREPARATION.md` | `abebd50cfd53d0621d34d9d02a0383436fb7d74d` | `8a1d9863a0c832f91b1b2ceff97d26d56c549ff2eeeeada0305c96326fd62e72` |
| `.engineering/evidence/CB-M00-WO-001-P1-URL-IDENTITY-CORRECTION.md` | `66262b7d98a92c655c3601820ec8ba6e6b86866a` | `fe50c3365c3f0d2826d92b58cdbbfdea8961f4b295f271af917d09715520b06f` |
| `.engineering/context-locks/CB-M00-WO-001-EXECUTION.md` | `406136fded6c7dd90a415996cf387257d98eef8c` | `a209324291429ce22495abc0b3c7029e84686f621cadff80b1b6ff1f97eaee1e` |
| `.engineering/context-locks/CB-M00-WO-001-P1-PREPARATION.md` | `747e97f7fc936740a47be8f83b746b4fe3916654` | `febd1028ec4892e6d42a1ba8037d65e3adbce0462eaea296d72f01a629e23220` |
| `.engineering/context-locks/CB-M00-WO-001-P1-URL-IDENTITY-CORRECTION.md` | `6a4f93a99ac45d876431612745d211695868c24b` | `7b86222234512137d04398c8d41985fd768d2ef50fbb2fb023bc6cd6cd4e2dcd` |
| `docs/DECISIONS_LEDGER.md` | `79bc32e119fc7b9e4b45a8a082bf55ed46cb6eca` | `829477e61f57b1b39e2cb8aeb3e2361da1a4a5fb9f4ce03b925948839751a28b` |
| `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` | `1bc1f0627097c30d95faa2b1faaa6f74ba79acae` | `82255f331af4c383dea4ef1c2f567aaf4b8f261cb14f5ef4dfd26c65457bf4cd` |
| `docs/operations/CB-M00-CLOUDFLARE-PREVIEW.md` | `c65eca6a10b6ce1dc56ce3d995b485e26217eb0e` | `8e0f5c42e4654ea60381af07f17387ce431186afbb879d192817deeeee405434` |
| `.github/workflows/cloudflare-worker-preview.yml` | `adf7c2f46fb1819671584707d0780a5c84eb5a6a` | `4b59eb40f07cd75dde2618926df493965c54438ac76210ee915147b5efd7f669` |
| `wrangler.jsonc` | `980a4af6a5c3cd40a37797ad53d27530a54bbbe2` | `9e384a485e0bb610da3dd06160da2bfad2bfba807166e6f7d38a8e0c0dfba046` |
| `astro.config.mjs` | `0aac3db4256ec4c1a3a29149b90c570e54352420` | `2b6cd0fea71a7db0b514677ab7b7b9ac94585ae52965f915ac80870efc109294` |
| `package.json` | `77391db66af630f8dc8463f1c90f903356533322` | `0c16820bff7fb5d8cc99b6e18f451b6fe458e835d4a7b2412c1aafd1f3d07438` |
| `package-lock.json` | `bf984890253d1fc09c8cda60adf98c10e9ec4e15` | `79255c007f327d69714b76ba401e87261ae557f725af89a117b5afd609be3bd8` |
| `scripts/assert-no-session-binding.mjs` | `7610a66937dc6daf65e8205a5ede93a733cb4e26` | `ad941cb7f0ade96a1bd3961e5160739940885894b652f617644c4ccb0c6de541` |
| `scripts/assert-preview-deployment-authorization.mjs` | `4498882baa255f96b1e6bc5591382fd8e444253a` | `3f665dde67b5defea91770b89c7b1204545bf3a906d1c8343f2d00449cea0344` |
| `test/cloudflare-preview-config.test.mjs` | `ac5fb5911c9d37e5253cd90ff5f5efe7feded99e` | `219cdf2d4490c6cc1357fe48597aaff8817a7e002559499c27b93ea5768c90bf` |
| `test/cloudflare-preview-smoke.test.mjs` | `3fb781797ff6548404e20c42d779f6426065729a` | `0d141a9a1756201bf8c71a0b9911d1a6dc55a3fb86a349cfa6be21ee2578910c` |
| `test/cloudflare-preview-workflow.test.mjs` | `39d15de56fc915003cecc29dc292b7789cf3fb9c` | `1945030b187d8a38044aa14089dc14e00e4c37fce5ba862a735423277465e9ea` |
| `test/session-binding-guard.test.mjs` | `6e2c31b22f2bc237ff1cebe1fe4ef3b21ebea0ba` | `9bda83959b768477bfcd4085412640b3e48613a01f3998939888a2a2126a3f15` |

## Validation and exit gates

- Collector must pass exact stable and immutable `/health` SHA gates before screenshots or cleanup, preserve HTTPS validation and exact-origin allowlist, prove redirects are blocked for documents/resources, verify stale-artifact cleanup is limited to known outputs, verify route/security/noindex, exact PNG IHDR dimensions, axe, responsive overflow, keyboard focus, console/page/network error counts, and output SHA-256 hashes.
- Run repository unit/browser tests, lint, typecheck, build, security audit and GEF 1.1.2 doctor/status; record that the local shell uses Node 24 if pinned Node 22.19/npm 10.9.3 cannot be selected. Exact-head PR CI uses the repository-pinned runtime.
- Verify exact remote Preview run/commit/check state without triggering a new deployment. Do not reuse the deploy token to inspect billing or provider bindings.
- Open one PR under this same Work Order; require exact-head CI and independent review. Do not merge, promote checkpoint, mark M00 done, or start M01+.
