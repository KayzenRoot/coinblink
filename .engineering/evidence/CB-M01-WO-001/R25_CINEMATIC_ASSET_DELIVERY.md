# CoinBlink M01 — R25 static master and Blender motion correction

**Status:** local technical preview only; no rights clearance, Owner visual acceptance, publication, merge, or checkpoint promotion is granted. The PR remains open.

## Policy and scope

The Owner's R25 direction adopts an approved-pipeline static master and reserves Blender for motion derivatives. It supersedes the earlier R25 proposal to use a Blender still as the primary hero. The main source remains the generated OpenAI image; its provenance is still `OPENAI_IMAGE_GENERATION`, and it has not been relabeled as Blender output.

- Work Order: `CB-M01-WO-001`
- PR: [#58](https://github.com/KayzenRoot/coinblink/pull/58)
- PR branch: `codex/cb-m01-wo-001-impl-20261011`
- Static master: `src/modules/CB-M01/hero-cinematic-original.png` (1774×887, 2,349,624 bytes, SHA-256 `a07bf7ccfa6fa06030de506353c40456f0fb9d4f5d33069f7857c50d0d37448c`)
- Static WebP: `src/modules/CB-M01/hero-cinematic-original.webp` (1774×887, 310,054 bytes, SHA-256 `56a36a84487f278420207dbbcb8c643cacca3e0ef065d9ba69114bec69b15c6b`)
- Blender motion runtime derivative: `src/modules/CB-M01/hero-cinematic-motion.webp` (640×320, 48 frames, 4,000 ms, 1,394,724 bytes, SHA-256 `0e1e9e2070fc717b3b03473bdc4daab3fe371a634e0d486c1af843f57fc41d5a`)
- Portable Blender source: `hero-cinematic-animation-portable.blend` (SHA-256 `898b99ff862f141f27871a2979a1a383fb7a60c3349a0810af2b6fcbafa6d8ec`)

The static source and output hashes match the exact bytes. The static master is selected by default and for reduced-motion users; the optional motion derivative is selected only for `prefers-reduced-motion: no-preference`. Copy remains accessible HTML outside the decorative image. The generated lightning PNGs are decorative Blender inputs packed in the portable project, not individual browser requests or CSS animation frames.

## Separate historical Blender still exports

The files `hero-cinematic-blender.png` and `hero-cinematic-blender.webp` are genuine Blender Cycles still exports. They are classified as `BLENDER_CYCLES_STILL_RENDER_NOT_MASTER`, retained for provenance, and not used by the runtime. The static ImageGen master is the source of record for the still hero.

## Motion traceability and portability

The Blender project is recorded as `BLENDER_MOTION_DERIVATIVE` and links to the static master by exact SHA-256. Its inspection report records 96 source frames at 24 fps, 1600×800, eight packed external images, relative image references, and zero linked libraries. The report was checked for drive-letter, UNC, and absolute image paths. Blender was unavailable in this run, so the binary was not reopened; this limitation is recorded and no independent Blender launch is claimed.

The source animation preview is 1600×800, 96 frames, 4,000 ms. The runtime derivative samples every other source frame and resizes to 640×320 with Lanczos, preserving 4,000 ms total duration. The runtime WebP ANMF frame table was parsed and verified as 48 frames totaling 4,000 ms. The contact sheet remains separate evidence.

## Rights, approval, and publication gates

- Rights review: `PENDING_OWNER_OR_LEGAL`.
- Owner visual approval: `false`.
- Commercial publication allowed: `false`.
- Publication permission: `false`.
- Allowed use: local/nonpublic demo preview only.
- No production data, external service, deploy, or publication is authorized by this evidence.

## Evidence and validation

The current detailed manifests are `hero-cinematic-imagegen-provenance.json`, `hero-cinematic-blender-provenance.json`, `lightning-sprites-provenance.json`, `hero-cinematic-animation-portable-inspection.json`, and `cinematic-delivery-inventory.json`. The current R25 local capture and validation are recorded below and in `integrated-visual-check.json`; historical R23/R25-pre-correction results remain historical and are not presented as current validation.

No merge, deployment, main-branch modification, ruleset change, checkpoint update, rights clearance, Owner visual approval, or publication permission was performed.

## Fresh R25 local capture · code HEAD `7153d8c91c60b7592dbaa4fbc80d5e11b578c31a` · 2026-10-13

The built integrated `/en` route was run in local Wrangler mode with remote bindings disabled. The current visual report and screenshots bind to code HEAD `7153d8c91c60b7592dbaa4fbc80d5e11b578c31a`, based on `main` SHA `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`. I visually inspected the three newly captured screenshots. The browser selected the 640×320, 48-frame, 4,000 ms Blender motion derivative under `prefers-reduced-motion: no-preference`, and selected the 1774×887 static master under `prefers-reduced-motion: reduce`.

| Integrated `/en` capture | Dimensions | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Desktop `screenshots/golden-home-integrated-desktop-1536x864.png` | 1536×864 | 789,613 | `5321f1ab9582ce8ac7a36620b9b13f877f247fdde5d92374d3058e24e31a51b9` |
| Tablet `screenshots/golden-home-integrated-tablet-768x1024.png` | 768×1024 | 491,074 | `6842a5060bff7c72b2e6bbd7d0dd4002c5bb492768292f6106d7a50466fdc652` |
| Mobile `screenshots/golden-home-integrated-mobile-390x844.png` | 390×844 | 242,653 | `d16340199d9af1489ac8c8c7b11b2001dd0792ada75b495d038c1f99cd2623e1` |

The isolated module captures were also regenerated and visually inspected:

| Isolated capture | Dimensions | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| Desktop `screenshots/golden-home-desktop.png` | 1536×864 | 789,916 | `78e0ca363bad196d6f5db4714db852e05bcf1865923652f0e20f9083cb304f96` |
| Tablet `screenshots/golden-home-tablet.png` | 768×1024 | 491,278 | `d8ee87d9baccb20017ceb0933b53a8d3f4f438f35cf6e029fd9a3b328c23ac01` |
| Mobile `screenshots/golden-home-mobile.png` | 390×844 | 242,244 | `9293a52368ce7a9407aebb51b8fd9d64fafefc3874a89d790ac74657aac80ffe` |

`integrated-visual-check.json` SHA-256: `972163824c53ecb0e9e51b3c578db51273070cda75a1c27847127d77aca970d7`. The isolated module `visual-check.json` SHA-256 is `8b57d7610d436cc378520d4ede15b80392e1b8a0a7c698f3ce89453e702f24ce`; both reports say `passed` and identify the same base and code HEAD. All three route responses were HTTP 200, document widths matched their viewport widths, module and full-page Axe each reported zero violations, and console errors, page errors, and external requests were zero. The reports record CSP, `nosniff`, frame denial, strict referrer policy, `X-Robots-Tag: noindex, nofollow, noarchive`, and the matching robots meta. Local single-pass LCP was 480 ms desktop, 172 ms tablet, and 112 ms mobile, with CLS 0; these are local lab observations, not field Core Web Vitals.

Node.js `v22.23.3` / npm `10.9.9` validation on that code HEAD passed: `npm test` (185/185 unit/subtests; Astro build and no-binding guard passed; Playwright 34/34), `npm run lint` (zero warnings), `npm run typecheck` (76 files; zero errors, warnings, or hints), and `npm audit --audit-level=high` (zero vulnerabilities). The new deterministic derivative script reproduced the runtime WebP byte-for-byte: 1,394,724 bytes, SHA-256 `0e1e9e2070fc717b3b03473bdc4daab3fe371a634e0d486c1af843f57fc41d5a`.

The original Golden home and logo JPEGs remain unchanged and their integrity test passed in the full suite. Blender itself was unavailable, so the portable `.blend` was not reopened in Blender; only its recorded path audit, packed-image metadata, and binary/hash provenance were checked. Rights review remains pending, and Owner visual approval, commercial publication, and publication permission remain false. This local evidence does not authorize merge, route changes, deployment, or checkpoint promotion.

The first pushed R25 candidate `eb9f09e36c319c209d14427cb2a2362797c29808` passed exact-head hosted run [#38488533443](https://github.com/KayzenRoot/coinblink/actions/runs/38488533443): Ubuntu GEF, Windows GEF, Docker Compose smoke, SonarCloud, and both Socket contexts all succeeded (6/6). The CodeRabbit status context was green; this status alone is not a substantive hosted review. Subsequent commits only refresh the R25 evidence narrative and delivery inventory; they do not change application source or test inputs. The live PR rollup is the authority for the current evidence-only HEAD. Independent review and Owner visual acceptance remain pending.
