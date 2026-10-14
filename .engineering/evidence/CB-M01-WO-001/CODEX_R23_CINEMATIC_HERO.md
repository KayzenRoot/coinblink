> **Historical R23 procedure. Superseded by the Owner R25 policy.** Do not apply its Blender-still-as-master gate to the current hero. The current static master is the approved-pipeline ImageGen asset; Blender is used for motion derivatives only.
# CODEX LOCAL · COINBLINK · CB-M01-WO-001 · R23 CINEMATIC HERO ASSET
**Status:** READY-TO-EXECUTE LOCALLY WHEN DESKTOP/CODEX IS AVAILABLE. This document is an execution prompt, not authorization to merge, publish or change gates.

## Your role and source of truth
You are the local Codex implementation agent tasked with replacing only the stylized demonstration artwork in the CB-M01 BreakingHero with a materially closer **original cinematic 3D Bitcoin/rockscape image**. Prioritize faithful visual composition, safety, repeatability, security and responsive fidelity, not inflated checklists.

Repository: `KayzenRoot/coinblink`. Current candidate PR: [#58](https://github.com/KayzenRoot/coinblink/pull/58), feature branch `codex/cb-m01-wo-001-impl-20261011`. Before beginning, **fetch actual current head and compare with remote**; do not assume the HEAD written in this document is current, force-push, rebase protected main or overwrite other work. The initial R23 preflight code is `src/modules/CB-M01/hero-cinematic-preflight.mjs`. The approval rules are binding even when tools suggest shortcuts.

Read completely:
1. `.engineering/CHECKPOINT.json` **from protected main**, and M01 Work Order/governance/DoD/stop conditions.
2. `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md`, especially §6.2, §11, §15, §16, §17.
3. `assets/reference/coinblink-home-master-dark-1536x864.jpg` (immutable SHA256 `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8`) and `assets/reference/regions/12-hero-image-detail.png` if present.
4. `.engineering/evidence/CB-M01-WO-001/scene-asset-provenance.json`, current `GoldenHome.astro`, `golden-home.css`, existing tests, `hero-cinematic-preflight.mjs`.
5. PR #58 comments/reviews and protected branch ruleset. Do not claim approval because CodeRabbit or CI is green.

## Non-negotiable scope
- Change only the M01-owned hero files, relevant tests and `.engineering/evidence/CB-M01-WO-001/**`. Keep all other modules (especially M05), protected `main`, global pages/routing, checkpoint, workflows and rulesets untouched.
- **No live coin prices, news, false ATH claims, trading execution, API integrations, auth/database, external network imagery, copyrighted image scraping, or website publication**.
- Golden JPEG and approved logo are visual reference **only**. **Never crop/trace/pixel-extract the Golden JPEG as the shipped art** or conceal the mock as a fake functional UI.
- Preserve readable HTML for headline, demo/status, description, links and CTA. No rendered price/words embedded in the new raster. Keep the `DEMO` notices until an approved real editorial feed exists.
- Preserve accessible, keyboard-operated CTAs, aria-hidden decorative artwork, contrast, layout proportions and no horizontal overflow across 1536×864, 768×1024 and 390×844.
- The hero needs **original depth**, not another flat filter: impressive golden Bitcoin with visibly three-dimensional minted edge, subdued rocky foreground/backdrop, natural raytraced lighting, soft lime chart energy and dark readable left side.

## Production path
1. Confirm Windows/Blender/ComfyUI tools actually installed. If Blender absent, discover an approved local DCC alternative or STOP with evidence; never install untrusted toolchains or buy services without user authorization. Optimize for local GPU around **8GB VRAM** and **24GB RAM**; use CPU fallback or reduced denoise/resolution if necessary. Do not assume RTX availability without checking.
2. Build an **original** scene from primitives, procedural rocky mesh/displacement/noise, extruded Bitcoin coin (real rim thickness and edge notches), 3/4 camera, PBR metal/gold, dark basalt, lime emissive chart/reflected light, physically plausible shadows/ambient haze. No logos from unlicensed packs. Save editable local source `.blend` or documented equivalent. Track Blender/renderer version, render script/preset and origin of every texture.
3. Render a master >= 2K (e.g. 2560×1280), then create review candidate with **1600×800 or equivalent within contract bounds**: image WebP primary `src/modules/CB-M01/hero-cinematic-original.webp`, PNG fallback `src/modules/CB-M01/hero-cinematic-original.png`. Initial WebP budget ≤1,500,000 bytes, PNG ≤3,500,000 bytes; do not silently crush quality to hit a budget: if impossible, report the evidence and propose exception.
4. Composition: keep roughly the left 40–45% dark/low-detail for HTML text, dominant large gold BTC middle-right, glowing lime upward graph behind the subject and mountains at bottom/right. Match approximate golden hero x~44..1135, y~61..343 on the 1536×864 screenshot. Avoid duplicate symbolic/chart text.
5. Use new preflight `inspectHeroCinematicCandidate` with real bytes (not dummy fixture). Check original local path, SHA-256, byte length, file magic, dimensions, metadata `origin=ORIGINAL_LOCAL_RENDER`, non-public `rightsStatus=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false` and editable source master. Preflight is **technical only**; cannot establish ownership or publication rights.
6. Integrate **conditionally as an M01 DEMO candidate only**, retaining the existing original vector scene as safe fallback. Keep HTML text separate; prefer `<picture>` with explicit width/height, decoding and responsive handling when appropriate, or a deterministic local CSS art layer if it does not worsen LCP. Never auto-enable production.
7. Register each output in `.engineering/evidence/CB-M01-WO-001/**` with source master, reproducible workflow, origin, SHA-256, Git blob, dimensions/bytes, license status, usage restrictions and artifact paths. Any changes to `GoldenHome.astro` require updating **both source and bounded hero/promo fragment provenance hashes and Git source blob** and their locking tests. Do not invent a Git commit hash while the commit is being created; record actual HEAD after push.
8. Run strict Windows + Ubuntu CI checks where available: lint, typecheck, unit, build, audit, integrated browser, 34 Playwright and responsive screenshots. Ensure Windows LF binary/source hashing remains stable; do not globally relax `.gitattributes`. Compare screenshots to current R22+ actual HEAD and Golden reference, document geometry, LCP/art weight, color and visual gaps. Test image decode, 404s, no external requests, accessibility, keyboard and mobile CTA overlap.
9. Create/update **a draft PR or safe update to #58 only if it matches the actual open HEAD and approved scope**. Never merge, deploy, mark M01 COMPLETE, remove release gates, or mark a GitHub review `APPROVED`. Publish screenshot previews and a clear go/no-go evidence review.
10. Report the final HEAD, commit list, source hashes, exact CI runs, images/render proof, licensing/origin evidence, remaining blockers and **one actionable next prompt only if a further local step is genuinely required**.

## STOP CONDITION
Stop successfully when the new **original image candidate** has a reproducible local source master, hashed and reviewed WebP/PNG demo assets, fallback integration, bounded provenance, passing CI across available operating systems, and desktop/tablet/mobile screenshot comparisons, **with PR open and unmerged**. If any tests fail or new tool/asset rights are unavailable, STOP as `CORRECTION REQUIRED` with exact failure evidence and do not falsely report completion.

**Owner gates retained:** final Golden visual signoff, independent eligible GitHub `APPROVED`, commercial image/logo rights, and release governance. All remain pending even if every technical test passes.
