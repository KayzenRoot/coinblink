# CoinBlink

**Crypto news in a blink.** An international crypto news and research publication under active planning.

> **Status (2026-10-08):** GEF Bootstrap 1.1.2 installed and CI validated in CB-BOOT-001. Documentation preservation underway in CB-DOCS-001. **Portal NOT implemented or deployed; product planning OPEN; original Golden image binaries are not yet in Git.**

## Product decisions already selected

- English (`en`) is the canonical product language; Brazilian Portuguese (`pt-BR`) and Spanish (`es`) are planned from the beginning.
- User-approved **dark 1536×864 homepage visual reference** and metallic eye/coin/lightning logo are the visual source of truth. Textual visual specifications are in [the full Design Bible](docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md).
- Faithful interface reconstruction is required with screenshot comparison/visual QA; no screenshot-as-fake-UI shortcuts.
- Working global brand **CoinBlink** and provisional tagline **Crypto news in a blink.** Commercial trademark/domain clearance pending.
- Codex Cloud + GitHub + Cloudflare preview deployments is the intended development workflow; local Docker remains an alternative. **No preview is live yet**.

## Documentation and engineering

Read [Documentation Map](docs/README.md) then [Decisions Ledger](docs/DECISIONS_LEDGER.md). The full historical [Ideas Master v0.6](docs/planning/history/PORTAL_CRIPTO_MASTER_IDEIAS_v0.6.md) is preserved for traceability and is **not** an approved Scope/Architecture.

The [Source Pack staging index](docs/source-pack/README.md) tracks product governance gaps. Golden reference filenames and SHA-256 digests are recorded at [Reference Manifest](assets/reference/reference-manifest.json); the original JPG bytes are still awaiting exact-byte repository import.

This repository uses **GEF CLI v1.1.2** and three pinned Matt Pocock skills. Existing bootstrap CI uses Node 22.17.0 and verifies Linux/Windows exact-head test execution.

```sh
npm ci
npm test
npm exec -- gef --version
npm exec -- gef doctor --target . --json
```

A missing product `.engineering/CHECKPOINT.json` may be reported by GEF doctor while scope/architecture are still unapproved. Do not override that finding with fabricated green status.

**No financial advice:** draft and screenshot market prices/headlines are illustrative, not live factual claims. The product editorial verification and provider licensing gates are still under design.

## Proposed implementation roadmap (planning round, not shipped code)

The owner has selected an admin-first, continuously viewable build process: module-wide lengthy Work Orders, in-PR Cloudflare previews, faithful Golden design, comprehensive private Mission Control, X/Instagram/TikTok Social Studio and a rights-cleared paid developer API when ready.

See [Product Blueprint](docs/product/PRODUCT_BLUEPRINT_v0.1.md), [Module Roadmap](docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md) and [Engineering Planned Work Orders](.engineering/planned-work-orders/). These are proposed module specifications and are **not an app release, active Cloudflare environment, or finished product architecture**.
