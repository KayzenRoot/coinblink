# CB-M01 · Golden Home producer contract candidate

**Status:** PROPOSED / NOT_APPROVED / NOT_ADMITTED / NON_EXECUTABLE.
**Contract owner if admitted:** CB-M01. **Consumer dependencies:** CB-M02, CB-M13 and explicitly versioned other consumers after their own WOs.
**Source base:** `d8233772a80b613015284309a30657ba576a1b4f` (M00 COMPLETE, 5%). Global staged V1 source/parallelism PR #53 is merged, and byte-identical original Golden assets PR #54 is merged. The main Git blob hashes and canonical per-file manifest flags have been verified; M01 itself remains NOT_ADMITTED until a separate GEF Work Order/Context Lock.

## Immutable inputs and gate

| Asset | Expected path | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| Golden Home JPEG | `assets/reference/coinblink-home-master-dark-1536x864.jpg` | 1536×864 | `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8` |
| Approved Logo JPEG | `assets/reference/coinblink-logo-approved-original-1179x1040.jpg` | 1179×1040 | `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0` |

**Blocking:** `main` must contain byte-identical, decoded original files and `presentInGit=true` for both. Asset PR #54 was merged and its original-byte identifiers are present in canonical main; repeat byte validation before admission. Never flatten the entire screenshot as page markup or copy it as a background; implement actual editable, accessible semantic components.

## Version-0 draft content interface (contract only, not compiled TypeScript)

```ts
export type HomeSectionId =
  | 'breaking-hero' | 'market-overview' | 'trending-now'
  | 'categories' | 'radar-24h' | 'market-sentiment'
  | 'promo' | 'latest-news' | 'newsletter';
export type EvidenceMode = 'MOCK' | 'LIVE';
export interface HomeSlot {
  id: string; section: HomeSectionId;
  mode: EvidenceMode;
  title: string;
  contentRef?: string;
  sourceId?: string;
  asOf?: string;
  unavailableReason?: string;
}
export interface HomeResponse {
  contractVersion: '0.1-draft';
  locale: 'en' | 'pt-br' | 'es';
  slots: HomeSlot[];
  advertisementEnabled: false;
}
```

The final versioned source contract must be checked against the approved Visual Bible and article/market producers. `LIVE` requires external source identity, permission and freshness; otherwise render unmistakable MOCK/DEMO or unavailable state. Do not invent tickers, numbers, news or market rankings. Third-party M04/M13 seams remain inert and default-OFF.

## Owned implementation path candidates (pending Integration Steward acceptance)

- CB-M01 agent: proposed `src/modules/CB-M01/**`, `test/modules/CB-M01/**`, `.engineering/evidence/CB-M01-WO-001-*` only after admission. If real repo structure uses another path, Integration Steward freezes mapping before code.
- Integration Steward only: `src/pages/**`, global layouts, styles imported outside module, `astro.config.*`, `package.json`, shared types, `compose.yaml`, `wrangler.jsonc`, `.github/workflows/**`, actual Golden binary import. Golden input is immutable, never rewritten by M01 agent.
- M05 agent must not edit CB-M01-owned paths; all homepage/editorial seam changes require reviewed producer contract.

## Visual and functional acceptance

At 1536×864: compare browser screenshot to original Golden master by overlay, sections, typography/colors/spacing and owner visual acceptance, with an **honest** mismatch report. Re-run desktop 1536×864, tablet 768×1024 and mobile 390×844 with keyboard/reduced-motion/axe and no overflow, safe image licensing and realistic skeleton/empty/error states. `/en` is canonical; localized `/pt-br` and `/es` navigation foundations remain planned. Genuine interactive actions and actual SSR DOM required; static screenshot masquerading as a site fails.

## Admission and integration gate

Only after #53 global source/ADR integrated, #54 exact assets integrated, Issue #6 governance accepted/closed, own `CB-M01-WO-001` and Context Lock pinned on current main, accepted contract/ownership and GEF module admission may a Codex Desktop local implementation agent start. This proposal grants **zero** worktree/code authorization. Keep the current Free Worker Preview and scoped Docker local untouched until an explicitly protected deploy/preview run.
