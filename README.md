# CoinBlink

International cryptocurrency news and intelligence portal.

> **Status:** repository bootstrap in progress. The canonical design, scope, architecture, and implementation plan have not yet been promoted. Do not interpret this repository initialization as a functioning website.

- Canonical product language: English (`en`).
- Secondary planned locales: Brazilian Portuguese (`pt-BR`) and Spanish (`es`).
- Selected dark visual reference: CoinBlink Home Master (approved).
- Engineering framework target: GEF Bootstrap CLI `1.1.2`.

The project follows GitHub-first governed engineering. Requirements, architectural contracts, Definition of Done and checkpoints will be committed only as they are compiled, reviewed and accepted.

## Engineering toolchain

The governed bootstrap uses Node.js `22.17.0`, npm `10.9.2`, and the exact local dependency `@gef-bootstrap/cli@1.1.2`. From a clean checkout, run `npm ci` and `npm test`. The test suite validates the installed CLI, the fail-closed status for the not-yet-promoted canonical checkpoint, a disposable governed `init --apply`, and the pinned npm SLSA provenance.

Read-only local diagnostics are available through `npm run gef -- --version`, `npm run gef -- init --target . --json`, `npm run gef -- doctor --target . --json`, and `npm run gef -- status --target . --json`. Product implementation remains outside this bootstrap.
