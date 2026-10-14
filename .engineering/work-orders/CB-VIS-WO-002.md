# CB-VIS-WO-002 · Brand SVG · Work Order / Phase A

**Status:** `OWNER_SCOPE_APPROVED / PRE_ADMISSION_CANDIDATE / NOT_EXECUTABLE`.
**Recorded Owner approval:** 2026-10-14, [Issue #74](https://github.com/KayzenRoot/coinblink/issues/74), exact statement in `.engineering/evidence/CB-VIS-WO-002/OWNER_PHASE_A_SCOPE_AUTHORIZATION.md`.
**Canonical main source base:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`; M00 COMPLETE / **5%**, `checkpointFacts.moduleAdmission["CB-M01"]="ADMITTED"`; **no separate CB-VIS-WO-002 admission on main yet**.
**Admission proposal:** [Draft PR #75](https://github.com/KayzenRoot/coinblink/pull/75); **Owner explicitly prohibited merging that PR in this instruction**.

## Purpose and fixed visual reference
Prepare a reusable brand library of **exactly five approved vector proposals**: symbol, dark horizontal, light horizontal, stacked and favicon asset (as a file in brand library, **not installed globally**). Maintain the frozen CoinBlink visual identity in Design Bible §3 and §16.8: horizontal eye, gold coin, lightning, lime green accents, high-contrast white/lime wordmark. Source identity is the original AI-generated JPG in `assets/reference/coinblink-logo-approved-original-1179x1040.jpg`, SHA256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`, immutable. The new vectors are a visually approved reinterpretation, **not pixel-identical**.

Approved R32 fingerprints are in `.engineering/evidence/CB-VIS-WO-002/OWNER_R32_VECTOR_ACCEPTANCE.md` and [Issue #74](https://github.com/KayzenRoot/coinblink/issues/74). Contact-sheet SHA256 `8bb05c36dead19d231ae4d87004904ed8aa7202f99fcaf6b099bec5a6817f6f9`; package ZIP SHA256 `145dd33b98812d445688150065199a7f3b6954e974fb2b1de6381c14e5e69b48`. **At execution, recompute from the actual local bytes before importing.**

## Admission and execution ownership
- The Owner has **granted the bounded Phase A scope**, distinct from approving vector sketches.
- This file is drafted on a governance-only PR; **no code/asset-writing authority is effective until a separately authorized governed merge and post-merge readback**. CodeX/agent must halt if the postmerge source is not effective.
- **Once admitted only:** one Codex Desktop / admin KayzenRoot implementation agent in isolated brand worktree, with its own implementation branch and PR, never reuse PR #58 or #75 as a product-asset staging branch.
- **Exclusive post-admission allowlist:** `public/brand/**`, `test/brand/**`, `.engineering/evidence/CB-VIS-WO-002/**`.
- **Governance-stage paths only:** this work order, its Context Lock and the two Owner evidence documents in PR #75. These DO NOT authorize executor modification of governance records beyond evidence after admission.
- **Always excluded:** `src/**`, `src/pages/**`, `src/components/**`, `src/modules/CB-M01/**`, M05, global header or favicon references, `assets/reference/**`, `package*.json`, workflows, `main`, checkpoints/GEF/branch rulesets, deployment, publication, paid provider calls.

## Implementation phases AFTER effective admission
1. **Source preflight:** confirm current canonical main/WO/Context Lock/head, verify no competing brand PR modification or production mix. Do not reuse stale SHA from this candidate if main moved.
2. **Asset integrity:** ZIP CRC; compare original bytes and five SHA256+size values in Owner evidence; reject wrong file, SVG XML external DTD, scripts/events, foreignObject, `<image>`, embedded bitmap/data/remote links, external fonts or `@import`. Keep true vectors.
3. **Import under allowlist:** store five SVGs unmodified under `public/brand/**`; manifest includes origin AI-source + original local vector reconstruction workflow, exact SHA, palette, dimensions and version; favicon asset is **not** wired into site.
4. **Test under allowlist:** Node/DOM parse, no active content, no external resource, XML/VBOM parsing, accurate viewBox, alt/name usage guidance, browser render at 32/48/96/128/256/512px, dark/light and header-size preview without touching header source. If icons illegible at 32 px, report quality findings rather than replacing approved bytes silently.
5. **Evidence under allowlist:** screenshot sheet/asset diff, before-and-after hash manifest, perceptual comparison to original identity, QA/DoD/CI, known limitations and customer usage constraints. Real legally reviewed production rights still pending in Issue #72.
6. **PR and review:** one isolated brand implementation PR, exact-head 7 required status contexts, safe snapshot/rollback strategy, `COMMENTED` audit by assistant/admin per single-account policy, explicit future `ADMIN_GO_NO_GO` only when all applicable gates cleared. No fabricated `APPROVED`.

## Acceptance criteria for a DEMO-only import candidate
- Exact SHA256/byte match for 5 files, or `BLOCKED_SOURCE_MISMATCH`.
- True SVG paths, no raster/script/external resource; visual demo at relevant resolutions and a11y description guidance.
- Only allowlisted paths changed, no live header/favicon/page integration.
- Windows+Ubuntu/GEF, Docker, SonarCloud, Socket, CodeRabbit and app checks pass on exact implementation HEAD.
- `commercialPublicationAllowed=false`, `rightsReview=PENDING_OWNER_OR_LEGAL`, `ownerVectorApproval=ACCEPTED_FOR_DEMO`.
- Honest separation of owner **scope consent**, **visual consent**, **commercial rights**, and the **governed release/merge consent**.

## STOP CONDITION
**Current governance PR:** stop once the Owner authorization, this WO and Context Lock are source-backed, reviewed and CI-checked; **do NOT merge** PR #75 under current instruction. Report `OWNER_APPROVED_PENDING_EFFECTIVE_ADMISSION`.

**Future import PR only after effective admission:** stop at verifiable demo-ready SVG library, tests and provenance with PR OPEN / unmerged; neither mark product DONE nor release commercially. Any missing gate -> `BLOCKED` with evidence, not a green claim.
