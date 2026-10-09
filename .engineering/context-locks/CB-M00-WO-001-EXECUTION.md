# CB-M00-WO-001 · Post-admission execution Context Lock

**Lock state:** `BASE_FROZEN`; exact implementation base is canonical `main` at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` (CB-GOV-005 / PR #32 merge). This lock records the source bytes at that base. The scoped status reconciliations authorized by the Work Order are listed below; they do not change the approved M00 decisions.
**Repository:** `KayzenRoot/coinblink`
**Work Order:** `CB-M00-WO-001`
**Execution branch:** `codex/cb-m00-wo-001-p0`
**Executor:** Codex Desktop LOCAL; no Codex Cloud execution.
**GEF:** Bootstrap CLI `1.1.2`; source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`
**Admission evidence:** PR #32 merged at the locked base; canonical checkpoint reports `M00_ADMITTED`, `IMPLEMENTATION_NOT_STARTED`, and 0%.

## Locked authority and boundaries

- Only the bounded M00 P0 work in `.engineering/work-orders/CB-M00-WO-001.md` is authorized.
- M00 remains the only admitted module. M01–M17 remain `NOT_ADMITTED`; M18 remains `FUTURE_NOT_ADMITTED`; global Issue #6 remains open.
- Cloudflare Worker Previews are an approved direction, but credentials, plan/cost, account authority, and isolation are not verified. Do not run the P1 remote lane.
- Preserve the original Golden raster sources and manifest. The JPEGs are not in Git; do not create substitute logo art or claim visual parity.
- `.gef/` in the user's original checkout is local state and is outside this clone, Context Lock, and commit.
- Do not change `.engineering/CHECKPOINT.json` in this implementation candidate. Record only a proposed Checkpoint Delta; canonical progress remains 0% until a reviewed and authorized merge.

## Explicit stale-status reconciliation

The admission facts in PR #32 are now effective because the exact merge SHA is the `main` tip. In this branch, update only statements that say PR #32 is open, admission is pending, M00 is not admitted, or CB-M00-WO-001 is non-executable. Preserve the owner-approved scope, architecture, security rules, excluded modules, and separate Cloudflare authorization gate. Historical admission evidence may continue to describe the then-open candidate when it is clearly labeled as historical.

## Fingerprint method

The table below binds canonical Git blob bytes at the exact base SHA. Git blob IDs are SHA-1; file hashes are SHA-256 of the raw Git blob bytes returned by `git cat-file blob`, so Windows checkout line-ending conversion cannot change the record. The Context Lock excludes itself to avoid self-reference. These base fingerprints remain immutable; post-reconciliation candidate fingerprints belong in the CB-M00-WO-001 Evidence Bundle.

| Path | Git blob SHA-1 at base | Raw blob SHA-256 |
|---|---|---|
| `AGENTS.md` | `d6261e9df3c9247d484f8b498621b5d0449fd5ff` | `cf656e3f026c2bda52f791319855011536cd18de0773164bcbc250d4ccd775c1` |
| `.engineering/CHECKPOINT.json` | `13fc8008a391a5e2392cdf6b997efcd7689d5ce1` | `a125996a986dc39a5fc4212a052f88fb8102826a77b587ec103c466ec5448b5f` |
| `.engineering/CHECKPOINT.md` | `6fa8ba3ed790f742bb4ab2f1d42451d10e550ff4` | `2fc7f44b1bdc659f8bbf583bfd071fe1dd6463c728bd4add2e748e002bd2f816` |
| `.engineering/SOURCE-HIERARCHY.md` | `e5725186277e66d7ff279f65a155b584ca941051` | `a81e84b36d2f84bbabbf0ac93e37c5d7dd5b2ed067829eaf008047227e799fdf` |
| `.engineering/PROJECT-OVERVIEW.md` | `821cd7b0194dc0e4a24a1fc3b3ca47275f7064a7` | `e9cbe4f4ee0a905c69e11b51364ff4417b0d1f514e61e072cd2c037688430dd7` |
| `.engineering/SCOPE.md` | `c0d51e3897a268b2beed4278ad10c25bab8bb8a9` | `1b9ba607cccf6c54ec4966844459600f384ec5bbb0199840eb88c2f560bbd491` |
| `.engineering/REQUIREMENTS.md` | `0785b582d9ebc2d0991bd2faebbf3dfc4f0bc693` | `03705713d878e946813abb074fcbc74dc13c63fe3ee9949fb1e73d4e4221994f` |
| `.engineering/ARCHITECTURE.md` | `0d5a5ee8ced87f5e83e6c58ce8bba65657561799` | `bd5609772c6132d072151647443013f88f12d5ef4157858051630791a0fbb875` |
| `.engineering/SECURITY.md` | `b4c894c571d00bf9305410c0885dfdc86b4fb838` | `2c7d4cff826f6b3f09150ee9e5dec9b4d4ba791416c756a66079592db9d56354` |
| `.engineering/DEFINITION-OF-DONE.md` | `06bc6c29c1373fba3945140147c5a5fd982ddffe` | `574a77b1dcf98baf07fdc02e3f35851912a7ecc674bf2dbfd1283742f0746a52` |
| `.engineering/CB-M00-ADMISSION.md` | `9b189872e921b97724c3f4b93debdc8002d1c67e` | `e6bd65441bcfa4c6ee076a40787d27923f4aac7b375433ed1a5b0b4c5ed8c96f` |
| `.engineering/planned-work-orders/CB-M00.md` | `978258f3bf6ecc91be1ab403c96010bde90ef026` | `83007b2a40d0729c2de75fbb32fc70735fcfd41ffe0d6de06ffb13694f8d4739` |
| `.engineering/work-orders/CB-M00-WO-001.md` | `0ffb5891d98b77c2710ce58c2221d5529f4d35b9` | `57e19920374b9bd64fa6a42200142c549b9e605165757a5d63f742b5f0317b8e` |
| `.engineering/evidence/CB-GOV-003-OWNER-APPROVAL.md` | `7f4bcd2725712486bcd3808045476b6b995e87c3` | `cf2bafc8d631ed4d8fc51f5ccb182b7d07787146e991917cd44af0668e4f7982` |
| `.engineering/evidence/CB-BOOT-001-npm-attestations.json` | `9cc47a90bb981199de67c0381acf5a15c0f78e29` | `42a7091d5b33a520af5975eca507c8c149fa28497e0fbf14af8876d5cf736a46` |
| `.engineering/evidence/CB-GOV-004-EVIDENCE.md` | `84f605733f3860ffeb194eb4e1b5e52b01c49b9a` | `6a49efbc6325ecdf82d6f0828a488c4551983fbf05eca22995806f8587552e1f` |
| `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` | `d3f14d07823a81c50183c4abd9b9a74e800d463c` | `acfd7c141b20314c10caf19fcc06f45f07aadabc989971a13893d0242a157808` |
| `docs/DECISIONS_LEDGER.md` | `ce2dab29f1647c5a3233a1aa411c609da074b78e` | `ec3bfe95ca6b8637cd7ff6258e5acd604c2d6538302d6d6c6de2dd4a4c2dbbd2` |
| `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md` | `69af2cfaccbd74fce08ef14e2c75f59ccd7053e9` | `1c8da444ba5d08bc5d4142a456021035dd885e1fc8ac972d7b97f81b6a1456a5` |
| `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md` | `2058446f230e4c39fdce13a8e5f6a100e701f945` | `b85bd0158ef305351f8dd52a90cd90deba277d26b3ed33d0b48361238de8e0fc` |
| `assets/reference/reference-manifest.json` | `2a6193118620be790dd72c4eb53261f0df85be47` | `1a6aaff5a377ece8383bfedf54d07c261795c75bb95996468e7a84639c9bfd84` |
| `package.json` | `b9b240102be6bbcc7c52f28897f02e883f281465` | `d05a2a95ebe37816cfb2e60754919743d432a2e5095a6ff9c85f9df12f38dc9b` |
| `package-lock.json` | `a02ac32a343ea02a006dd2082c86e457751a2565` | `68aa3c4967f7986770743ddc37297eab339c2f28b78ee92380c32373bf07ceb0` |
| `.github/workflows/gef-validation.yml` | `c18aa100bc35dea56023ec665b576c9410214767` | `50560315262885d9183786717661f443d6fa3aa2bef7fcfc1d4e54f98d2a57b4` |
| `test/gef-cli.test.mjs` | `4c6cadc39fff9f9c65f49afa9c021c61a82586d9` | `37c4973d5b80dcb47f0e7b0dba64151ff8287782f08c740f80bb1f5e2c973521` |
| `scripts/verify-exact-head.mjs` | `3fb0d2425c817f0f6eb2d14643813cb37ad20ca5` | `2e3c5c18b38b12b84a199fb937aa7d79a8d62862e034e83697f5a1153b7f9a10` |
| `.gitattributes` | `7a75e27b844b5a502f28251dfbd842a1899775a5` | `e21f08ec1b1f50fab72d72b5f8e0d496325d19fa5731fa463012802944140e40` |
| `README.md` | `680ae2736684ff62985be597ab4a3ed24ef8e1f2` | `6274cb1aaf00b8803020dd8b3552e613bc137e15308ea12b2c934da8857aaf84` |
| `.engineering/evidence/CB-GOV-005-ADMISSION-EVIDENCE.md` | `1387e0a184ddfe730dbdb21ac139ba1cb339fe77` | `10aad70dfa60e454fd6fcef4e8851d053d1094fe14cbb29a0228f8fba2cc21f4` |

## Verification boundary

Recompute base blob IDs and SHA-256 values against `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` before accepting this lock. Any missing path or base mismatch is `BLOCKED`. Candidate edits are limited to the Work Order's P0 implementation and the explicit status-only reconciliation above. The final Evidence Bundle records current candidate hashes and every validation result at its exact HEAD.
