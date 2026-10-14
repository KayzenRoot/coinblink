# CB-M01-WO-001 — R26 local delivery evidence

**Status:** technical evidence for independent review only. This report does not complete M01, grant visual/commercial approval, or authorize merge or publication.

## Candidate identity

- Repository: `KayzenRoot/coinblink`, PR [#58](https://github.com/KayzenRoot/coinblink/pull/58)
- Branch: `codex/cb-m01-wo-001-impl-20261011`
- Frozen base: `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`
- Tested code HEAD: `52eaba80a7d98d021e9a9473706f7dfb6b6bb803`
- Runtime: Node.js `v22.23.3`, npm `10.9.9`, Wrangler `4.149.0 --local`
- Product state: `DEMO`; `authorizedToMerge=false`

The code HEAD is the commit tested by the R26 browser report and full local suite. This evidence file and the captured report/screenshots are added afterward; they do not change application or test source inputs.

## R26 image masters and lineage

Five original OpenAI Codex ImageGen PNG outputs were registered in `r26-static-asset-provenance.json`. Provider version was `NOT_EXPOSED`. Every derivative below is resized/re-encoded from its listed master; none is cropped or derived from the Golden reference. Prompts, generated output identifiers, complete technical provenance, and release gates are in that manifest.

| Master | Dimensions | Bytes | Master SHA-256 | PNG derivative SHA-256 | WebP derivative SHA-256 |
| --- | ---: | ---: | --- | --- | --- |
| `promo.png` | 1774×887 | 1,888,339 | `ed4de820d063df68f1787de9ee8b0cab2bbdec0300ab9766715fe4996761e699` | `a04f89bb2684e0af2fb3f0baf16f3d907e077a8faa8e1c2763ae4d91fc69415f` | `fbb6788b43c4dfd4112bd8929135adeaeb1f3f136a183de19ae945ccc3d02e54` |
| `bitcoin.png` | 1536×1024 | 2,399,367 | `3225f1208ac65aa2f7a7fc6d1c0dac95724ff7464bd4405a49ddbd7a2ddbd18d` | `a257765c960720852330daed15425c2469588a9ef44299bfa20ff698372739a7` | `60dc4f2cd316ff65c53d50891ba03968fbc45167bf79736a7c5c7e203292484b` |
| `ethereum.png` | 1536×1024 | 2,695,778 | `6f3c2345f1ab98c48f25d8ba1c4c86587f6f1d3a109445bb39914f42fa700a36` | `67546e502dc2c415fdfe7dbed632f50ffd6279e59e56b939b8c9d55d224349fd` | `eec4fedcb3b6efa626cf9e9debda4262260dda6ac615e3e8f6d594c3b4362ef2` |
| `policy.png` | 1536×1024 | 2,488,133 | `466cd6754613ea3ec7f8ab27cf84241af72921f5f5065c5a48fda77106188331` | `993e95ca5a87720aa14cd17544663ec85e5f60fe19bec556f03db84e5e7e657c` | `22b0772d75110c8c4a2865d497a994b01881c3e1ec362ddcc37f4746c6813ffa` |
| `ecosystem.png` | 1536×1024 | 2,234,115 | `1b987f917afcba2bb6ef2ea22cc34ac137e1af236e24c281cbdd31f272a74f0d` | `d85a2451b1e3581f3a41bc9fbcbbbed6432e60d3cef0abee8a3f722d6e30bb7a` | `ad01f2a2478796c0db115d9c40065c51a10cd1bd61f21f053338ea95abeefc08` |

WebP derivatives are 73,490–98,994 bytes each. All five PNG/WebP pairs are below the existing per-asset limits. Exact derivative paths, dimensions, byte counts, and source-master hashes are recorded in the provenance manifest. The rejected preliminary Ethereum generation is not used.

## Integrated browser evidence

`r26-integrated-visual-check.json` was generated on the tested code HEAD against the built `/en` route in local Wrangler mode with remote bindings disabled. Its source-input state is `clean` and its status is `passed`.

| Viewport | Size | HTTP | Document width | Axe violations | Screenshot SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| Desktop | 1536×864 | 200 | 1536 | 0 | `de02b117b4d622835aaf8f70a53d47bc86ca5b4e6fe4b5ecc87023c8ae7b393d` |
| Tablet | 768×1024 | 200 | 768 | 0 | `a12f5caf834491f820e3ba6424a7711368f73560c0048a7935e59550edbb9c02` |
| Mobile | 390×844 | 200 | 390 | 0 | `1dfece79a52af3f2076f717ad9771e746baab602d9644474258a82879714369d` |

The report records no browser console errors, page errors, or external requests. The shared `script-src 'self'` CSP remains unchanged. Hero motion decodes and is visible on the normal-motion route; `prefers-reduced-motion` and Save-Data both select the static master. A motion-load failure recovers to the static hero while retaining title and CTA (hero Axe violations: 0); full preview failure leaves the vector fallback visible. Promo and four editorial images load lazily, retain their SVG fallbacks, and remain decorative.

Constrained runs used 250 ms latency, 200 KB/s download, 4× CPU throttling, and disabled cache; values below are single-run local lab observations, not field Core Web Vitals:

| Scenario | Selected asset | Transfer | LCP | CLS | Long tasks |
| --- | --- | ---: | ---: | ---: | ---: |
| Desktop 1536×864, motion allowed | 640×320 motion WebP | 1,395,024 B | 1,956 ms | 0 | 0 |
| Mobile 390×844, emulated 3G | 1774×887 static WebP | 310,354 B | 1,444 ms | 0 | 0 |

The mobile constrained run requested no motion asset. Save-Data requested one static image and no motion image. Normal desktop motion body size was 1,394,724 bytes. These results are not a claim of field performance.

## Existing Blender source inspection

The existing portable animation project was reopened read-only with Blender `5.2.2`; no save or render was performed in this R26 validation. `hero-cinematic-animation-portable.blend` SHA-256 is `898b99ff862f141f27871a2979a1a383fb7a60c3349a0810af2b6fcbafa6d8ec` (4,249,267 bytes). Inspection found 9 objects, a slow cinematic camera, seven animated lightning sprite meshes, frames 1–96 at 24 fps, and eight packed images. Image paths are relative/packed, no linked libraries or missing unpacked images were found. This inspection validates portability and animation inputs; it is not evidence of a new Blender master render or of a 3D coin model.

## Commands and results

All commands below used Node.js `v22.23.3` and npm `10.9.9`:

- `npm test` — passed: 192/192 unit tests, Astro/Cloudflare build, 34/34 Playwright E2E tests.
- `npm run lint` — passed with `--max-warnings=0`.
- `npm run typecheck` — passed: 79 Astro files, 0 errors, 0 warnings, 0 hints.
- `npm audit --audit-level=high` — passed: 0 vulnerabilities found.
- `node test/modules/CB-M01/integrated-visual-check.mjs` — passed as part of `npm test`; evidence report records the tested HEAD, viewports, fallbacks, reduced motion, Save-Data, constrained network, and screenshots.

The test runner regenerated the legacy R25 `visual-check.json` and R25 screenshots during the full suite; those historical files were restored unchanged after validation. R26 screenshots and the R26 report are retained separately.

## Governance and limitations

- The image provenance identifies generation pipeline, not Owner or legal approval. Rights/trademark review remains pending; `ownerVisualApproval=false`, `commercialPublicationAllowed=false`, and publication permission remains false.
- The page remains a nonpublic DEMO preview. No real APIs, production data, or external image requests were introduced.
- No merge, deploy, main-branch change, ruleset change, or checkpoint change was made.
- The Blender inspection did not produce the 2560×1280 original render requested by the earlier R25 correction scope. That item remains unverified and must not be represented as completed by this R26 evidence.
- `authorizedToMerge=false`; M01 remains subject to independent technical review, rights review, and Owner visual approval.
