# CoinBlink

**Crypto news in a blink.** An international crypto news and research publication under active planning.

> **Status (2026-10-08):** GEF Bootstrap 1.1.2 is installed. M00 was admitted by CB-GOV-005 / PR #32 at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`; this `CB-M00-WO-001` candidate adds the local P0 foundation and awaits exact-head CI and audit. The checkpoint JSON remains at the admitted base (`IMPLEMENTATION_NOT_STARTED`, 0%) until a reviewed checkpoint promotion. Cloudflare deployment is not authorized or live; product-wide planning remains open; original Golden image binaries are not in Git.

## Product decisions already selected

- English (`en`) is the canonical product language; Brazilian Portuguese (`pt-BR`) and Spanish (`es`) are planned from the beginning.
- User-approved **dark 1536×864 homepage visual reference** and metallic eye/coin/lightning logo are the visual source of truth. Textual visual specifications are in [the full Design Bible](docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md).
- Faithful interface reconstruction is required with screenshot comparison/visual QA; no screenshot-as-fake-UI shortcuts.
- Working global brand **CoinBlink** and provisional tagline **Crypto news in a blink.** Commercial trademark/domain clearance pending.
- Codex Desktop LOCAL + Git/GitHub is the active implementation workflow. Cloudflare preview deployment is a separate future gate requiring explicit provider authorization; **no preview is live yet**.

## Documentation and engineering

Read [Documentation Map](docs/README.md) then [Decisions Ledger](docs/DECISIONS_LEDGER.md). The full historical [Ideas Master v0.6](docs/planning/history/PORTAL_CRIPTO_MASTER_IDEIAS_v0.6.md) is preserved for traceability and is **not** an approved Scope/Architecture.

The [Source Pack staging index](docs/source-pack/README.md) tracks product governance gaps. Golden reference filenames and SHA-256 digests are recorded at [Reference Manifest](assets/reference/reference-manifest.json); the original JPG bytes are still awaiting exact-byte repository import.

This repository uses **GEF CLI v1.1.2** and three pinned Matt Pocock skills. CI uses Node 22.19.0 and its bundled npm 10.9.3 for Linux/Windows exact-head checks. The admitted M00 shell is English-first, demonstration-only, and has no live market data or application authentication.

```sh
npm ci
npm run dev
# Open http://127.0.0.1:4321/en

npm test
npm run lint
npm run typecheck
npm run build
npm run preview
npm exec -- gef --version
npm exec -- gef doctor --target . --json
```

Docker Compose serves the local Worker-compatible preview on `127.0.0.1:3000`:

```sh
docker compose up --build
```

If that host port is occupied, set `COINBLINK_PORT` to a free port for the current shell before starting Compose. Do not stop unrelated containers to free it. GEF `doctor` and `status` are read-only; record dependency provenance or missing local drift-baseline findings as review states rather than fabricating state.

**No financial advice:** draft and screenshot market prices/headlines are illustrative, not live factual claims. The product editorial verification and provider licensing gates are still under design.

## Proposed implementation roadmap (planning round, not shipped code)

The owner has selected an admin-first, continuously viewable build process: module-wide lengthy Work Orders, in-PR Cloudflare previews, faithful Golden design, comprehensive private Mission Control, X/Instagram/TikTok Social Studio and a rights-cleared paid developer API when ready.

See [Product Blueprint](docs/product/PRODUCT_BLUEPRINT_v0.1.md), [Module Roadmap](docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md) and [Engineering Planned Work Orders](.engineering/planned-work-orders/). These are proposed module specifications and are **not an app release, active Cloudflare environment, or finished product architecture**.
