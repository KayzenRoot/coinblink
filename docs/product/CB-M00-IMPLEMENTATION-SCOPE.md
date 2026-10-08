# CB-M00 · Scoped Implementation Contract

**Status:** OWNER REQUESTED START, GEF / Cloudflare preflight gates pending.
**Base:** main at 72302dd2ada7be5be7a8b43c558c2a3a799a4240.
User wants visible and continuously reviewable builds, one large module WO and no repeated prompt pasting.

## Module scope
- Preserve existing GEF CLI v1.1.2, verified skills and original Golden master design references.
- Working Astro/TypeScript responsive branded PREVIEW shell (not Golden homepage implementation) with English canonical text, clear BUILD PREVIEW notice, navigation to actual implemented status/pages or honest Coming Soon labels.
- Health endpoint /health and sanitized UI /preview-status with verified environment/Git SHA, no secrets.
- Docker Compose serving localhost:3000 and deterministic fixtures, clear limitations vs Workers production.
- Cloudflare Worker Preview config, isolated environment, GitHub PR CI and preview URL/screenshots once authorized.
- Browser Playwright CI 1536x864 / 768x1024 / 390x844, keyboard, no broken links or console errors, rollback and cleanup.

## Outside
No new image/logos, no fake quotes/news, no real CMS, no auth provider, no payments, no social posting, no API resale, no token/crypto issuance, no production deploy, no automatic Golden-home screenshot-background hack.

## Boundaries and required decisions
Actual Cloudflare account/token/Workers Builds/Zero Trust Access still not connected through GitHub tools. Owner must authorize proper scoped account onboarding; never request token in public PR or chat. The original Golden JPG bytes are locally verified but not in Git (Issue #5). Do not conflate local shell success with full M00 done.
Product global Scope/Architecture/DoD remains OPEN (Issue #6). Scope here covers a bounded foundation only. If GEF policy rejects a module-specific contract without global Scope Pack, mark preflight BLOCKED instead of faking approved CHECKPOINT.json.

## Minimum evidence / STOP
npm ci + GEF checks + build + real browser screenshots + Docker verification + stable and immutable Cloudflare Preview URLs + external /health proof + env isolation + independent review on exact HEAD + owner visual checkpoint. If cloud authorization absent, label PROVIDER_SETUP_REQUIRED and keep partial local results visible in CI rather than claiming complete.