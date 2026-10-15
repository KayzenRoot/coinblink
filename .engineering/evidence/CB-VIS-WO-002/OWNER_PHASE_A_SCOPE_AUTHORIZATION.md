# CB-VIS-WO-002 · Owner authorization for bounded Phase A scope

**Source:** Owner's direct statement in the conversation on 2026-10-14, recorded at [Issue #74](https://github.com/KayzenRoot/coinblink/issues/74). This is **separate from** earlier visual approval of R32.

> Autorizo formalmente a admissão da CB-VIS-WO-002, Fase A, limitada a public/brand/**, test/brand/** e .engineering/evidence/CB-VIS-WO-002/**, conforme a PR #75. Não autorizo merge, deploy, mudanças na homepage ou publicação comercial.

## Status
- **Owner scope approval:** `OWNER_APPROVED_PHASE_A=TRUE`.
- **Governance candidate:** `PRE_ADMISSION_OWNER_AUTHORIZED`.
- **Effective main source admission:** `NOT_EFFECTIVE` as of this writing; the Owner expressly prohibited the necessary later merge.
- **Executor permission to write production assets:** `NOT_GRANTED_UNTIL_EFFECTIVE_ADMISSION`.
- **Commercial logo/source clearance:** `PENDING_OWNER_OR_LEGAL` in [Issue #72](https://github.com/KayzenRoot/coinblink/issues/72); no automatic release.

## Bounded eventual implementation paths
1. `public/brand/**`: exactly five approved SHA-pinned vector assets from R32 and declared local PNG derivatives/provenance.
2. `test/brand/**`: SVG parsing, security, a11y, hash and browser/resolution tests.
3. `.engineering/evidence/CB-VIS-WO-002/**`: raw asset fingerprints, tests and preview-only evidence.

**Not granted**: `src/**`, global header/favicon wiring, edits to M01/M05/other modules, `assets/reference/**`, `.engineering/CHECKPOINT.json`, dependency/workflow/ruleset changes, production hosting, public commercialization, deployment, merging the governance PR, or promoting M01/brand to `DONE`.

Governance-only files `.engineering/work-orders/CB-VIS-WO-002.md`, `.engineering/context-locks/CB-VIS-WO-002.md`, and the proposal update are **pre-admission draft documentation**, not an expansion of the future executor allowlist. They live exclusively in [draft PR #75](https://github.com/KayzenRoot/coinblink/pull/75) until further authorization.

**STOP:** After exact-head CI, report `OWNER_APPROVED_PENDING_EFFECTIVE_ADMISSION`. Request an **additional explicit Owner merge authorization** if effective admission is desired. No Codex import before that event.
