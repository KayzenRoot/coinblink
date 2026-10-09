# ADR-CB-0001 · M00 Preview-first Technical Baseline

**Status:** `M00_SCOPE_APPROVED / M00_ADMITTED`. PR #32 admitted this scoped implementation detail on `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`. It is derived from the Owner-approved M00-only source pack in PR #30. `.engineering/ARCHITECTURE.md`, `.engineering/SCOPE.md`, `.engineering/REQUIREMENTS.md`, `.engineering/SECURITY.md` and `.engineering/DEFINITION-OF-DONE.md` remain the canonical boundary. This ADR does not approve the full product architecture, production deployment, paid services or other modules.

## Decision boundary

- For admitted M00 work, use strict TypeScript and Astro with the official compatible `@astrojs/cloudflare` adapter, targeting one stateless Cloudflare Worker. Verify exact package compatibility at implementation time and pin selected versions in the lockfile.
- Preserve the existing Node 22 project toolchain and GEF CLI 1.1.2. Use Docker Compose for local development at `localhost:3000`.
- M00 has no required D1, KV, R2, Queues, Durable Objects, service bindings, owner account, provider API, production secret or production deployment.
- Disable Astro sessions explicitly with `session: false` or a verified supported equivalent. Inspect generated Worker configuration and fail if an unrequested `SESSION` KV binding appears.
- Keep the UI an honest development shell. Do not substitute the missing original Golden JPEGs or claim Golden Home parity.

## Delivery lanes

1. **Local P0 after admission:** reproducible install/build, `/en`, `/health`, `/preview-status`, honest 404/under-construction states, Docker localhost:3000 and deterministic non-sensitive fixtures.
2. **Read-only CI:** GEF, install, typecheck/build, browser checks and screenshots at 1536×864, 768×1024 and 390×844. Record exact SHA and actual artifacts.
3. **Cloudflare Preview after separate authorization:** use only scoped credentials stored in GitHub secret settings, trusted same-repository PR code, non-production resources and explicit cost/plan review. Treat every preview as public; do not expose secrets, internal drafts or production services. Missing account permission blocks this lane only.
4. **Cleanup:** remove only an exact PR preview resource after verifying its name and target. Document rollback. No broad resource deletion.

## Compatibility, cost and external authority

At CB-GOV-005 admission time, no Astro build, Worker compatibility test, provider access, plan/quota review, deployment cost measurement or Preview URL had been verified. The current CB-M00-WO-001 candidate now pins compatible Astro/Cloudflare/Wrangler packages and has local build, browser, binding-isolation and Docker smoke evidence in its Evidence Bundle. Cloudflare account access, plan/cost review, remote Preview URL and deployment remain unverified and unauthorized; no provider credential is requested or committed. These facts gate the remote lane and do not change the approved local P0 scope.

## Security and exclusions

- No `pull_request_target` workflow may run untrusted fork code with deployment secrets. Preview deployment may run only from trusted source and only after authorization.
- Do not bind production D1/KV/R2/Queues, analytics, service bindings or secrets into a preview.
- Owner authentication and secret storage belong to M05; content, market data, social publishing, ads, paid APIs, media generation and M18 token activity are outside M00.
- The original Golden image bytes remain absent from Git; M01 visual fidelity remains separately gated.

## Admission and stop condition

M00 is admitted by PR #32 at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`; application code may proceed only on the active admitted Work Order and a fresh Context Lock bound to that exact SHA. No M00 completion claim is valid without its actual local, browser, Docker, security, review and (for the remote lane) provider evidence.

Official platform references retained from the pre-admission candidate:

- Cloudflare Astro Workers guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/
- Astro Cloudflare adapter: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Worker Previews: https://developers.cloudflare.com/workers/previews/get-started/
- Worker Preview configuration: https://developers.cloudflare.com/workers/previews/configuration/
- Cloudflare Access: https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/
