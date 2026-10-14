# CB-VIS-WO-002 · Bounded brand-vector Work Order admission proposal

**Status: PROPOSED / NOT ADMITTED / REQUIRES SEPARATE EXPLICIT OWNER SCOPE AUTHORIZATION.** This is a non-executable governance candidate. Approval of visual R32 bytes alone does not provide code scope. Based on frozen Design Bible §16.8, `CB-VIS-WO-002` (Design system, brand SVG & header), narrowed to **Phase A, assets and tests only**.

## Source and authoritative inputs

- Repo `KayzenRoot/coinblink`; proposed base is exact protected main commit `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c` (2026-10-14 readback).
- Design Bible `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md` §3, §16.8; Source Hierarchy and DoD.
- Owner vector **visual** acceptance evidence: `.engineering/evidence/CB-VIS-WO-002/OWNER_R32_VECTOR_ACCEPTANCE.md` and [Issue #74](https://github.com/KayzenRoot/coinblink/issues/74) with contact-sheet and five vector SHAs.
- Rights Issue [#72](https://github.com/KayzenRoot/coinblink/issues/72): unverified brand/logo/source permissions, remains pending; no commercial claims.
- M01 [PR #58](https://github.com/KayzenRoot/coinblink/pull/58) is separate, open and admitted under its own WO, with previously accepted **DEMO-only** appearance; this proposal does **not** admit brand changes inside that PR or replace its header/favicon.

## Proposed exact admission and ownership, Phase A only

**Owner approval needed:** “Autorizo a admissão de `CB-VIS-WO-002`, fase A, exclusivamente para importar e validar os 5 SVGs R32 em `public/brand/**`, com testes `test/brand/**` e evidências `.engineering/evidence/CB-VIS-WO-002/**`. Sem editar o header, a main, M01/M05, o favicon global ou publicar comercialmente.”

**Post-admission implementation allowlist** after a reviewed, authorized governance promotion:
- `public/brand/**` (five approved SVGs only + explicit provenance manifest, permitted responsive PNG derivatives, *no changed Golden reference*).
- `test/brand/**` (SVG security/size/real browser/viewbox/a11y checks).
- `.engineering/evidence/CB-VIS-WO-002/**` (source fingerprints, screenshots, QA/DoD, hash manifests).
- `.engineering/work-orders/CB-VIS-WO-002.md` and `.engineering/context-locks/CB-VIS-WO-002.md` **only as part of separate, authorized governance admission**, not automatic executor write scope.

**Explicit exclusions:**
- **NO** `src/modules/CB-M01/**`, `src/pages/**`, `src/components/**`, global header/favicon wiring, CSS/layout changes or M05 source until an Integration Steward-authorized Phase B proposal identifies exact paths/base/head and collision-free PR order.
- **NO** `.engineering/CHECKPOINT.json` promotion to a new module or fictitious M01 completion; main M00_COMPLETE/5% is unchanged by this proposal.
- **NO** provider credentials, publishing, external image source, paid resources, branch protection modification, merge/deploy.

## Admission promotion steps and exact-head controls

1. Owner provides **distinct explicit Phase A scope admission authorization** in chat or authenticated GitHub Issue #74, separate from R32 visual acceptance.
2. Governance Steward reviews this proposed WO against current `main`, Context Lock and Source Hierarchy, then marks the admission as `OWNER_APPROVED_PHASE_A` **only after** that authorization. Carry the exact allowed paths, exclusions, source hashes, CI gates and STOP into `.engineering/work-orders/CB-VIS-WO-002.md` and a fresh Context Lock.
3. A standalone admission/governance PR is reviewed at exact HEAD, all configured hosted checks pass, and the single-admin `ADMIN_GO_NO_GO` is explicitly documented. If Owner declines or scope differs, revise proposal; don't infer authority.
4. Only after **effective admission under repository authority** may Codex R33 import the SVG ZIP into `public/brand/**` in its own isolated brand PR. Validate ZIP CRC, exact SHA of all 5 raw SVGs, XML/SVG security, small-icon rendering, dark/light backgrounds, browser/a11y and applicable CI.
5. Phase B header/favicon integration, if wanted, needs its own formally authorized allowlist and exact-head CI; never silently mix PR #58 or overwrite Golden JPEG.

## STOP CONDITIONS

- `OWNER_VECTOR_APPROVAL_PENDING`: **RESOLVED** by explicit Owner acceptance of R32, version-pinned in Issue #74.
- `BLOCKED_SCOPE_ADMISSION`: **REMAINS** until explicit Owner Phase A scope approval, source-backed WO/Context Lock, audited PR and effective admission.
- `COMMERCIAL_RIGHTS_GATE`: **PENDING** regardless of vector approval or Phase A DEMO integration.
- This proposal does **not** authorize implementation, merge, production/public release, M01 DONE or checkpoint changes.
