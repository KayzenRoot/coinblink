# CB-VIS-WO-002 · Bounded brand-vector Work Order admission proposal

**Status: OWNER_SCOPE_APPROVED / GOVERNANCE MERGED & EFFECTIVE FOR PHASE A ASSET LIBRARY ONLY.** Original candidate merged in [PR #75](https://github.com/KayzenRoot/coinblink/pull/75) after later Owner authorization, canonical post-merge main `310969049d756b6ba5c0aff4e386c693030656a0`. This update reconciles stale pre-merge statements; no commercial approval. This is a non-executable governance candidate. Approval of visual R32 bytes alone does not provide code scope. Based on frozen Design Bible §16.8, `CB-VIS-WO-002` (Design system, brand SVG & header), narrowed to **Phase A, assets and tests only**.

## Source and authoritative inputs

- Repo `KayzenRoot/coinblink`; proposed base is exact protected main commit `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c` (2026-10-14 readback).
- Design Bible `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md` §3, §16.8; Source Hierarchy and DoD.
- Owner vector **visual** acceptance evidence: `.engineering/evidence/CB-VIS-WO-002/OWNER_R32_VECTOR_ACCEPTANCE.md` and [Issue #74](https://github.com/KayzenRoot/coinblink/issues/74) with contact-sheet and five vector SHAs.
- Rights Issue [#72](https://github.com/KayzenRoot/coinblink/issues/72): unverified brand/logo/source permissions, remains pending; no commercial claims.
- M01 [PR #58](https://github.com/KayzenRoot/coinblink/pull/58) is separate, open and admitted under its own WO, with previously accepted **DEMO-only** appearance; this proposal does **not** admit brand changes inside that PR or replace its header/favicon.

## Proposed exact admission and ownership, Phase A only

**Owner's explicit authorization RECEIVED on 2026-10-14 (verbatim):** “Autorizo formalmente a admissão da CB-VIS-WO-002, Fase A, limitada a public/brand/**, test/brand/** e .engineering/evidence/CB-VIS-WO-002/**, conforme a PR #75. Não autorizo merge, deploy, mudanças na homepage ou publicação comercial.” Recorded in [Issue #74](https://github.com/KayzenRoot/coinblink/issues/74) and `.engineering/evidence/CB-VIS-WO-002/OWNER_PHASE_A_SCOPE_AUTHORIZATION.md`. This authorizes preparing the admission documents, **not merging this candidate or changing implementation code before effective admission**.

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

1. **SATISFIED: Owner provided distinct explicit Phase A scope authorization** on 2026-10-14 in chat, separately recorded in Issue #74 and source-backed evidence. Owner simultaneously **forbade merge**, so source admission is still not effective.
2. **PREPARED AND MERGED IN PR #75:** Governance Steward includes a bounded `.engineering/work-orders/CB-VIS-WO-002.md` and `.engineering/context-locks/CB-VIS-WO-002.md`, pinned to the main/source SHA. These are **non-executable pre-admission records** until an explicitly authorized, separately audited merge.
3. **SATISFIED:** PR #75 was independently technically reviewed `COMMENTED`, all seven strict checks passed, and a narrow admin GO for the **governance merge only** was explicitly documented. Squash merged to main `310969049d756b6ba5c0aff4e386c693030656a0`; never generalize this to M01 merge or commercial use.
4. Only after **effective admission under repository authority** may Codex R33 import the SVG ZIP into `public/brand/**` in its own isolated brand PR. Validate ZIP CRC, exact SHA of all 5 raw SVGs, XML/SVG security, small-icon rendering, dark/light backgrounds, browser/a11y and applicable CI.
5. Phase B header/favicon integration, if wanted, needs its own formally authorized allowlist and exact-head CI; never silently mix PR #58 or overwrite Golden JPEG.

## STOP CONDITIONS

- `OWNER_VECTOR_APPROVAL_PENDING`: **RESOLVED** by explicit Owner acceptance of R32, version-pinned in Issue #74.
- `BLOCKED_SCOPE_ADMISSION`: **RESOLVED for Phase A asset-library scope** via Owner-authorized governance PR #75 merge and post-merge readback. Current status-reconciliation candidate must also land with exact-head checks before Codex asset import. Scope excludes `src/**`, global favicon/header and M01 PR #58.
- `COMMERCIAL_RIGHTS_GATE`: **PENDING** regardless of vector approval or Phase A DEMO integration.
- This proposal does **not** authorize implementation, merge, production/public release, M01 DONE or checkpoint changes.
