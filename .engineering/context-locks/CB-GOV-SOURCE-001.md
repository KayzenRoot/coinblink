# Context Lock | CB-GOV-SOURCE-001

**Authority:** this is a DRAFT governance clarification proposed under [Issue #66](https://github.com/KayzenRoot/coinblink/issues/66), NOT a promoted GEF admission or authority to implement another module. Baseline `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c` must match protected main before any promotion.

**Canonical main at preflight:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`, protected=true, ruleset #24888106 active on main, no bypass, one distinct eligible approving review. **Risk:** ELEVATED. **Status:** PROPOSED, not admitted. **Target branch:** `codex/cb-gov-source-001`.

## Immutable source anchors from current main

| Canonical source | Git blob SHA-1 | Raw SHA-256 |
|---|---|---|
| `AGENTS.md` | `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7` | `4424180619660921939c73236ac1aa7ea2973787263e1314437b8be052ef713d` |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` | `c2b9ef9f0c30f946f9287534305ad4f5f072875b9cfa5fe3e20b7442b45fa6f8` |
| `.engineering/SOURCE-HIERARCHY.md` | `38ede6577b26a1c73ee0ca7b24488e21e14ab4d5` | `4c5376e66b872ba1ab1c0b1e131d9a02c086dac3d76e4850fd2b7d800cc46921` |
| `.engineering/SCOPE.md` | `80fa60e1557e2b4a46b10088eb83040662b39f04` | `c2c728d30d915dec287b56e9294aa59332fd6e56aaeb1f8f0554a890268d4ac9` |
| `.engineering/REQUIREMENTS.md` | `5d3d8c2c18ae0356f4d28a535265314c22600a41` | `36b83012d76927a5e3dac2a86f9a29113c663f0e0865beac6842f45f8e74c1e4` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` | `19782491ab5f5dba185e4756f3b478760e31aa4f566aeae17e95d39fbcc15fe0` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` | `c61119f0f7c4df1ad4f051626a413b022cc5f8b934a56d2981b6afdc488323ed` |
| `docs/DECISIONS_LEDGER.md` | `d33b083a9fd31f9d7509e5a39f76f183cb961a3f` | `ae505b48f383ab929b827c0b54a57d243d00156e6173f09d0168ded881b42117` |

## Strict exclusivity

Seven source paths listed in [Issue #66's scope extension](https://github.com/KayzenRoot/coinblink/issues/66#issuecomment-6114558000) plus the dedicated own WO/Context Lock/Evidence Bundle/NO-OP delta. Do not change actual `.engineering/CHECKPOINT.json`, workflow rules, any product module, code, dependency or external resource.

**Authority STOP:** A draft source branch cannot admit itself. If source freshness, GEF admission, qualified ELEVATED review, CodeRabbit resolution, actual distinct eligible GitHub approval or Owner final-SHA GO is missing, leave DRAFT/BLOCKED. No force push, bypass or fake audit approval.
