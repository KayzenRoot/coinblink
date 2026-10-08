# CoinBlink Editorial AI Image, Chart, Animation & Video Engine v2.0 (DRAFT)

User direction: news editor should optionally generate a complete visual story package from the factual story, including distinctive cover art, inline informative illustrations, verified-data graphics and subtle motion. No provider/model selected or deployed. Planned CB-M17 Issue #27 integrates M05 CMS, M03 source provenance, M08 research and M07 Social Studio. The owner is the single final approver.

## Visual asset types
| Type | Visual use | Suggested sizes/aspects | Key safety |
| --- | --- | --- | --- |
| Hero image | article lead and sharing | 16:9, responsive image set | illustrated concept if synthetic; cannot mimic real event photo |
| Concept image | explanatory section | 16:9, 3:2, occasional 1:1 | accurate concept and material AI disclosure |
| Data chart | statistics, on-chain and quote price contexts | responsive 16:9/2:1 with axes | numeric values ONLY from timestamped verified data source |
| Process/timeline diagram | protocol, regulation or incident evolution | SVG, accessible text, poster | labels tied to verified claims and sourced chronology |
| Soft animation | article explainer, crypto mechanics | optimized CSS/SVG/WebM and static poster | prefers-reduced-motion, pause and accessible captions |
| Social exports | X text image, IG carousel, TikTok reel | 1:1 / 4:5 / 9:16 | platform rights, explicit final post approval |
| Rich editorial media card | quote/compare/fact check | 3:2 and mobile stacked layout | quote source must be attributable |

## Editorial-safe pipeline
Source/rights-verified article -> evidence bundle and specific claim IDs -> story image plan with bounded prompts and negative constraints -> user selects cover, inline diagram, chart and optional motion -> approved external inference model OR optional authenticated local GPU worker -> async job with idempotency, cost and retry cap -> media result + license + model/provider/version/prompt hash + source fact references -> quality/authenticity and copyright checks -> store originals and optimized derivatives in private R2/media store -> Owner reviews each relevant asset -> caption/alt/AI disclosure and correct localized labels -> article mobile/desktop preview -> Owner publishes/schedules.

Media stages must be draft, generating, awaiting review, accepted, rejected, revoked, outdated after claim revision, and provider failed. Do not rerun forever or surprise-charge. Settings controls per-provider secret, model, max cost/story/day, quality, 3D motion preference, disabled channels and safe fallback. The public website serves cached, approved static media, never raw key-bearing generation output.

Charts are produced from real recorded series with source, timestamp, units, timezone and uncertainty. LLM may propose chart style but NEVER write fake market values to 'make story more attractive'. A rendered price chart must be regenerated if source data changes and its past dataset remains traceable.

Never invent eyewitness news photographs, company official statements, signatures/contracts, screenshots of transactions, identifiable real-person defamatory media, unverified exchange quotes, exact logos in misleading claims or guarantees about trading returns. Generated conceptual art must be labelled where necessary and editorially distinguishable. All source text is untrusted prompt data and cannot issue system instructions or access credentials.

Motion is progressive enhancement: poster fallback for all animations; audio/video captions and transcript where relevant; click-to-play video by default; decorative glows last 200–600ms with restrained lime brand, no strobe/loop-induced distraction, reduce-motion fallback; aim responsive and page speed without freezing unmeasured performance numbers.

Local acceleration option: optional RTX GPU + ComfyUI remote worker on user's Windows PC with authenticated private tunnel and queue, not an Internet-exposed localhost; model, VRAM limits and quality/performance require tests. Cloud API provider fallback if owner authorizes spend. No assumption personal PC always online or available. Store no unlicensed output, use provider terms and right of publicity checks.

## Template packages
Breaking News: cinematic conceptual but honest; Explainer: labeled process schematic; Regulation: official primary-document summary with source not fake photo; Cybersecurity: non-attributive illustrative icons/network, no hacking alarmism; Market Movers: verified chart plus brief; Radar24h: verified event timeline; Article Comparison: visual table with truthful attribution; Social 9:16: short video storyboard with alt/transcript; Corrections: precise annotated difference not made-up old image.

## UI design and controls
Admin /admin/media/create is a three-panel workspace: left grounded story facts, middle primary canvas/variant carousel, right model/art direction and cost guardrails. Status and action buttons Preview, Regenerate, Reject, Select, Approve with audit, Use in story; before approved only Draft watermark (internal preview), never live. Article Editor can suggest slot-by-slot media plan, but owner chooses. Site P03 renders hero/inline data/motion with caption/sources. News Page Mobile prioritizes image scale and avoids media overtaking facts.

## Acceptance
Deterministic mock mode with samples, actual asynchronous job and media storage, source citations and rights record, cost cap/queue kill switch, final owner manual gate, chart-data provenance, image prompt injection test, falsified source chart rejection, accessible video/poster/transcript, crop/alt and responsive layout tests, version invalidation on article correction, true provider failure fallback, exact-head CI and working preview. External paid generation requires a separately approved credential, provider contract and spending ceiling.

## Authenticated transport & redirect boundary (provider contract)
All outbound API calls containing integration keys or bearer credentials must require HTTPS/TLS with certificate and hostname validation, explicitly allowlisted provider hostnames, no HTTP downgrade and no credential-forwarding across origins. On any redirect to a different origin, fail closed (or strip all credentials and use a separately verified authorized endpoint), never repeat Authorization, URL query secrets or session cookies. Do not accept a remote feed item's supplied provider URL as an authorized model endpoint; guard against SSRF and prompt-injection redirects. For optional local ComfyUI GPU workers require encrypted authenticated private connectivity and approved endpoint identity (not public HTTP localhost exposed to Internet). Include tests with attacker-controlled redirect, expired/mismatched TLS certificate and plain HTTP rejection. Never log credential headers or plaintext vault data.
