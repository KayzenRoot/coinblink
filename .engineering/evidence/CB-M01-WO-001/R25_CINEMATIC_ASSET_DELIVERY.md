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

The current detailed manifests are `hero-cinematic-imagegen-provenance.json`, `hero-cinematic-blender-provenance.json`, `lightning-sprites-provenance.json`, `hero-cinematic-animation-portable-inspection.json`, and `cinematic-delivery-inventory.json`. The exact local screenshots, axe checks, responsive geometry, browser errors, runtime binding checks, and test results will be summarized here after the fresh R25 integrated run. Historical R23/R25-pre-correction results remain in Git history and are not current validation.

No merge, deployment, main-branch modification, ruleset change, checkpoint update, rights clearance, Owner visual approval, or publication permission was performed.