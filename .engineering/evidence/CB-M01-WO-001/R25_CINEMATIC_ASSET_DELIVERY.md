# CoinBlink M01 — R25 cinematic asset delivery

**Status:** technical demo preview ready for independent review. M01 remains incomplete; this report does not grant visual, commercial, publication, merge, or checkpoint approval.

## Scope and source

- PR: [#58](https://github.com/KayzenRoot/coinblink/pull/58)
- Authorized branch: `codex/cb-m01-wo-001-impl-20261011`
- Starting PR head: `f79dbfced1d36cdf2705b366102a5576df3571e3`
- Tested source head: `2668fcde6d9c3bdb068580b31492a18845d3a9f0`
- Work order: `CB-M01-WO-001`
- The original ImageGen assets, R23 reconciliation report, and the existing vector illustration remain historical records. The browser uses the Blender WebP with the matching PNG fallback; if both fail, the original vector scene remains visible. The seven-frame lightning effect remains separate.

## Blender master and scene inspection

Blender 5.2.2 LTS rendered an original Cycles master at 2560×1280, 32 samples, denoising enabled. The computer has AMD Vega 8 and Radeon 535 graphics; Blender reported no supported Cycles GPU backend and selected CPU. This is consistent with the documented Cycles GPU requirements for supported AMD backends ([Blender manual](https://docs.blender.org/manual/pt/4.5/render/cycles/gpu_rendering.html)).

- Master: `hero-cinematic-renders/hero-cinematic-blender-master-2560x1280.png`
- Master SHA-256: `935d00f5384771f2a21a83bf0ee5e077e0684146364b5c36080d64b454cca460` (9,848,150 bytes)
- Saved scene: `hero-cinematic-production.blend`
- Scene inspection: `hero-cinematic-blender-scene-inspection.json`
- Production scene SHA-256: `34adf9ef2bf7d5284856143ba56209f09cb2d73504bb3d5a2ed5b084363ea560`
- Scene script SHA-256: `9d5d1a7d7849fa933edca5a9aab957557dd2829526b59d5d13190e9346f027ea`

The fresh-process inspection found 216 scene objects, 102 meshes, five area lights, a 48 mm perspective camera, a 144+ vertex beveled Bitcoin mesh with 0.2 scene-unit thickness, metallic values 0.94 and 0.96, a raised/extruded Bitcoin glyph, a 960-face ridge, ground, and 11 faceted rocks. The saved scene uses a relative render path.

The render is an original procedural 3D study, not a raster copy of the Golden reference. It places open copy space at left and the coin to the right. The mountains and rocks remain more stylized than the photographic detail in the Golden reference; visual fidelity remains for independent review.

## Derived files and traceability

Both runtime exports were fully decoded and derived from the same Blender master without resizing. Their signatures, dimensions, SHA-256, and byte counts are in `hero-cinematic-blender-export-report.json` and `hero-cinematic-blender-provenance.json`.

| File | Dimensions | Bytes | SHA-256 | Result |
|---|---:|---:|---|---|
| `src/modules/CB-M01/hero-cinematic-blender.webp` | 2560×1280 | 269,828 | `5aa50f820605d4c41f0defd8259eff534ec24750786b8c9b5a317eeec076ed5e` | below 1,500,000-byte cap |
| `src/modules/CB-M01/hero-cinematic-blender.png` | 2560×1280 | 774,726 | `bffa87afa2c1172057578aa35cd5e5958069618c2fb522baf8a1878e0ddfac67` | below 3,500,000-byte cap |

The PNG derivative records mean absolute RGB error 1.51862 and PSNR 38.8281 dB against the master. The WebP is quality 96. The browser chose WebP in all captured viewports.

`scene-asset-provenance.json` retains the pre-R25 source hashes in its history, records the exact current hero fragment, and links the new render separately as `ORIGINAL_LOCAL_RENDER`. The prior ImageGen provenance stays `OPENAI_IMAGE_GENERATION`; neither file is relabeled as a Blender render.

## Animation project portability

`hero-cinematic-animation-portable.blend` opens in a fresh Blender 5.2.2 process. Its 96-frame, 24 fps, 1600×800 project has a relative output path, eight packed external image assets, eight relative image references, and no linked libraries. The inspection is `hero-cinematic-animation-portable-inspection.json`; project SHA-256 is `898b99ff862f141f27871a2979a1a383fb7a60c3349a0810af2b6fcbafa6d8ec`.

This is the existing image-and-lightning sprite composite made portable; it is not a newly animated version of the 3D coin scene.

## Integrated preview and validation

The R25 report and responsive screenshots are retained separately from prior visual evidence:

- `r25-integrated-visual-check.json`
- `screenshots/r25-hero-desktop-1536x864.png`
- `screenshots/r25-hero-tablet-768x1024.png`
- `screenshots/r25-hero-mobile-390x844.png`

The integrated browser pass used desktop 1536×864, tablet 768×1024, and mobile 390×844. It confirmed full image decode, same-origin assets, no horizontal overflow, zero axe violations for the module and page at each size, and no external requests. At tablet width, the preview uses `contain` so the coin is not clipped and the lightning layer begins beyond the copy column. Mobile displays the preview at full scene opacity. A simulated failure of both image formats left the original vector coin visible. Reduced motion disabled all seven lightning animations and the flash, leaving only the static impact layer.

Single-pass local lab metrics (not field Core Web Vitals):

| Viewport | LCP | CLS | WebP encoded bytes |
|---|---:|---:|---:|
| Desktop | 1,740 ms | 0 | 269,828 |
| Tablet | 560 ms | 0 | 269,828 |
| Mobile | 440 ms | 0 | 269,828 |

## Tests

All final source tests were run on tested source head `2668fcde6d9c3bdb068580b31492a18845d3a9f0`, under Node.js 22.19.0:

- `npm.cmd test` — passed: 184/184 unit tests, Astro production build, and 34/34 Playwright E2E tests.
- `npm.cmd run lint` — passed with zero warnings.
- `npm.cmd run typecheck` — passed: 76 files, zero errors, warnings, or hints.
- Blender scene inspection — passed in a fresh Blender process.
- Portable animation inspection — passed in a fresh Blender process.
- Export preflight and full image decoding — passed; both size limits met.
- Integrated visual pass — passed at all three viewports, including fallback and reduced-motion probes.

## Governance and remaining review

- Usage remains `LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY`.
- Rights review remains `PENDING_OWNER_OR_LEGAL`; owner visual approval is false.
- Commercial publication is false; live market or editorial data was not connected.
- `authorizedToMerge=false`.
- No merge, deploy, ruleset, permissions, workflow, main-branch, or checkpoint change was made.
- This evidence does not mark M01 complete and does not authorize publication. A separate visual and rights review is still required.
