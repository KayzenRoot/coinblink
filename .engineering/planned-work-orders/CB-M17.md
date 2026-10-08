# PLANNED Work Order CB-M17 · Editorial Image, Diagram, Animation and Video Generation

Priority: P1 when CMS+source evidence available. Status: PROPOSED / NOT ADMITTED. Issue #27. Deps M00 + M05 + M03; integrates with M08 fact review and M07 Social Studio. Design contract: docs/design/COINBLINK_EDITORIAL_MEDIA_ENGINE_v2.0_DRAFT.md. No provider keys/configuration are available yet.

## Mission
Deliver ONE complete, coherent creative media module for articles, with owner-facing generator UI, secure provider abstraction, truthful visual data, cost controls and media approval. No splitting into separate tiny WOs per button, aspect or prompt type. Inside one module PR use meaningful P0/P1/P2 checkpoints with screenshots and tests.

## P0 visual vertical (in live secure Preview)
Build protected /admin/media and /admin/media/create editor surfaces, media library, cover/inline/diagram/timeline/data-chart/social-art tabs, selectable generator type and responsive previews. Integrate story editor contextual Create Illustration action, source evidence panel, accurate status badges, demo costs and drafts; use reproducible sandbox mock providers so no external account cost. Implement original CoinBlink dark graphite/lime visual language, mobile/desktop preview and reduced-motion poster fallback.

## P1 functional end-to-end
Provide provider-independent task interface for image and animated artwork with approved templates, media 16:9/4:5/9:16 crops, user-provided per-provider credentials from secure M05 Settings Vault, source claim reference whitelist, safe prompt assembly, permissions, network timeouts, retry/idempotency and queue capacity. Store media original+derivatives and cryptographic digests/licensing/alt/caption/credit/review records. Story media storyboard and approval queue with owner selection/edit/refuse, invalidation if story evidence changes. Generate real datasets from licensed timestamped market data or verified documents, never numeric content via LLM imagination. Optional ComfyUI local GPU worker only behind authenticated private connectivity with timeout/offline resilience, not auto-installed/exposed over public Internet. Integrate source metadata into story and Social Studio variants via versioned asset references.

## P2 governance, quality and performance
Provider/key absence and cost-limit safe fallback; step-up user approval before any real paid provider activation, allow cancel/retry without double billing where provider supports idempotence. Tests for prompt injection from syndicated feeds, famous-person defamation/synthetic real-events confusion, token/crypto fake screenshots, image credits, copyright/licensing, NSFW as relevant to publication, no guarantee of financial results. Responsive media 1536×864, 768×1024, 390×844 with alt/transcript/video pause/reduced motion; no CLS and defined size/performance budget. Media endpoints authorized server-side, no key-bearing requests from frontend; no job may autonomously publish news or upload to social platforms. Audit all prompts/model versions and costs with redaction and retention caps.

## Acceptance gates
1. Protected working media UI with story facts/evidence and generator status, screenshot and stable Preview URL.
2. Provider-free sandbox generation and safe, bounded real-provider test behind explicit budget authorization.
3. Image approval is required before live article publishing, with full license/AI disclosure metadata.
4. Charts/diagrams state data source/time, reject unsupported/fabricated numbers and update when claims revise.
5. Browser displays static fallback if model/API is unavailable, user chooses whether to regenerate.
6. Branded controls follow v1 Home and v2 article/editor visual design without default generic purple AI theme.
7. Unit/integration/E2E and adversarial safety tests, Cloudflare binding isolation, exact-head CI, third-party review and evidence bundle green.

## STOP CONDITION
Only merge after secure working Preview, producer/storage integration, costs/licensing, editorial proof and owner approval; otherwise BLOCKED with accurate staged UI. One WO, one PR. Report provider success only after a provider returns a verifiable asset, with receipt or artifact evidence; claim live generation only when it actually occurred. Sandbox mock output is labeled DEMO and never reported as a real external generation.

## Outbound provider credential transport (security acceptance)
Every credential-bearing outbound inference request MUST use authenticated HTTPS/TLS with valid certificate-chain and hostname validation. Reject HTTP/insecure/non-allowlisted endpoints, credentials in URL strings, redirects to an untrusted origin, TLS downgrade, expired certificates and attempts to forward Authorization headers, keys, query params or bearer cookies to a different origin. If permitted provider redirect changes origin, strip secrets, fail closed and require a separately reviewed approved endpoint. Optional local GPU workers require strong authenticated private connectivity, origin/identity pinning and equivalent encryption. Negative tests cover cross-origin 30x redirect, downgrade and certificate mismatch, with no logs/telemetry containing secret bytes.
