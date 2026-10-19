# CoinBlink

Crypto information and editorial experiences, built module by module. **Development-first:** prioritize a functioning local web application and improve features, tests and reliability iteratively.

## Run locally

Requirements: Node.js 22.19.0+, npm 10.x, and optionally Docker.

```bash
npm ci
npm run dev
# http://127.0.0.1:4321/en or /pt-br
```

```bash
npm run build
npm run preview
# or: docker compose up --build
# Docker local preview: http://127.0.0.1:3000/en
```

Use `npm run lint`, `npm run typecheck`, `npm run test:unit` or `npm run test:e2e` when investigating or fixing a feature. The minimal automated workflow checks only installation and build; it does not deploy.

## Roadmap

See [module catalog](docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md), [product blueprint](docs/product/PRODUCT_BLUEPRINT_v0.1.md), [design bible](docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v2.0_DRAFT.md), and [development guide](docs/BUILD_FIRST.md).

The six official publisher links currently form an external-source directory, **not** a live news feed or a license to republish. UI demonstrations and local CMS fixtures must not be represented as production-ready integrations. Work on M01/M05 should focus on a usable Home and editor without blocking further module implementation.

## Development policy

There is no GEF CLI, mandatory Work Order, module admission or checkpoint approval in the current development model. GitHub branch/ruleset settings are controlled separately from repository files and must be simplified there before retiring their legacy required-check contexts.

Keep product security boundaries, ownership of credentials, and explicit user authorization for any external production deployment. Local builds are safe and can run independently of production publishing.
