# CoinBlink · M00 Requirements and Acceptance Inputs

**Status: PROPOSED_FOR_OWNER_APPROVAL.** Specific to M00 only. The full product Requirements for future modules are not yet frozen.

| ID | Requirement | Verification |
|---|---|---|
| M00-R01 | Preserve existing npm GEF 1.1.2, Node engine and CI; do not disable safety gates | `npm ci`, current GEF checks remain green |
| M00-R02 | Functional branded but honest build-preview shell `/en`, no false live site | browser and screenshot test |
| M00-R03 | `/health` JSON and `/preview-status` disclose build SHA/environment, not secrets | contract test, output redaction |
| M00-R04 | Local app available at http://localhost:3000 via Docker Compose | actual docker run + HTTP smoke; if Docker unavailable, transparently BLOCKED |
| M00-R05 | Browser smoke: desktop 1536×864, tablet 768×1024, mobile 390×844 | Playwright evidence and accessibility checks |
| M00-R06 | Worker Preview config isolated from prod: no D1/KV/R2/Queues/SESSION KV by default | wrangler deploy dry-run/static binding inspect |
| M00-R07 | Astro sessions disabled by `session: false` or **verified** supported equivalent; no accidental `SESSION` KV auto-binding | config test + generated Worker inspect |
| M00-R08 | Cloudflare permission blocks **deployment only**; local P0 may execute without it once GEF admits WO | environment tests and explicit gate state |
| M00-R09 | No production secrets in GH workflows, PR previews, browser/network/log, especially untrusted forks | static/negative checks |
| M00-R10 | Trusted live preview only after owner authorizes scoped Cloudflare access, with stable/immutable URLs and external SHA health verification | real URL evidence, not a hypothetical link |
| M00-R11 | Owner sees actionable screenshots and results before branch merge | owner checkpoint + exact SHA review |
| M00-R12 | No fake Golden visual parity, token issuance, paid provider API, news or market data | source and content checks |

## Non-functional constraints
Readability and contrast, no horizontal scrolling at 390px, reduced-motion behavior, basic screenreader/keyboard semantics, responsive media and source-based English text. Store secrets out of Git and app frontend. Avoid unnecessary external services and keep free/usage costs explicitly visible.

## External prerequisites
For local coding: admitted M00 source pack/WO/context lock and validated Git HEAD. For Cloudflare preview deployment only: scoped Cloudflare account and authorized preview resource/secret setup. For Golden Home M01: original JPG byte import verified against manifest; not a blocker for M00.
