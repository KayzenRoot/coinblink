# R23 cinematic delivery reconciliation

**State:** local artifacts and the seven-frame demo effect are inventoried for PR review. The cinematic image candidate remains blocked by its recorded origin and missing 2K local render master. This report is not M01 completion, visual approval, commercial clearance, or publication approval.

## Repository and PR snapshot

- Repository: `KayzenRoot/coinblink`
- Branch: `codex/cb-m01-wo-001-impl-20261011`
- Frozen base: `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`
- PR #58 before this synchronization: `a0b9bec58e7594a4efeed20ded33daae6f569a2a`
- At inspection, both the live PR and remote branch pointed to that same head; `main` remained at the frozen base. The PR was open, not draft, and still required review.
- The inventory JSON records every changed/new M01 or R23 evidence file and hashes, plus excluded local scratch. The final published HEAD is recorded in the PR comment after push to avoid a self-referential commit hash.

## Artifacts found

- `src/modules/CB-M01/hero-cinematic-original.png`: OpenAI ImageGen output, 1774×887, 2,349,624 bytes. Its bytes match the retained `hero-cinematic-imagegen-source.png` (`a07bf7ccfa6fa06030de506353c40456f0fb9d4f5d33069f7857c50d0d37448c`).
- `src/modules/CB-M01/hero-cinematic-original.webp`: converted preview candidate, 1774×887, 310,054 bytes, SHA-256 `56a36a84487f278420207dbbcb8c643cacca3e0ef065d9ba69114bec69b15c6b`.
- `hero-cinematic-imagegen-lightning.png`: an unused still alternative, 1774×887, 2,500,979 bytes. It is recorded as an alternate with incomplete prompt/input lineage; the module does not reference it.
- Editable scene sources: `blender-hero-scene.py` and `hero-cinematic-original.blend`. Their saved Blender scene is reproducible from original procedural geometry; the only saved Blender render found is `hero-cinematic-preview-800x400.png` (800×400, 962,711 bytes). The script contains master/candidate render modes, but this checkout contains no 2560×1280 master output.
- Motion/compositing source: `animate-generated-hero.py` and the local `hero-cinematic-animation.blend`. This Blender project composites the generated 2D image and lightning sprites, with camera drift and exposure flashes; it records `coinHasIndependentMotion=false` and does not create an editable 3D coin animation. The `.blend` contains absolute workstation/worktree paths in embedded image references, and Blender is unavailable here to resave it with portable paths, so the binary is withheld from GitHub; its local SHA-256 and reason are recorded in `cinematic-delivery-inventory.json`. The Python source and rendered animation remain publishable.
- Motion output: `hero-cinematic-motion-preview.webp`, 1600×800, 96 frames, 24 fps, 4 seconds, 21,557,886 bytes. A contact sheet and 12 selected 800×400 stills are retained. The other 96 1600×800 PNG frame intermediates remain under `%TEMP%/coinblink-cb-m01-motion-frames` (184,889,351 bytes total); they are represented by the final animation and selected stills and are not copied into Git.
- Runtime lightning effect: seven transparent 1774×887 PNGs, copied byte-for-byte from `lightning-sprites-v2` into `src/modules/CB-M01/lightning-sprites/`. The sequence is local, decorative, loops every 6.4 seconds, and holds a low-opacity impact frame for `prefers-reduced-motion`. Total runtime sprite payload is 2,242,695 bytes.
- The older `lightning-sprites/` set is retained as a historical unused iteration. Its individual files are hashed in the inventory, but its prompt/input lineage is incomplete. Blender `.blend1` backups and Python `__pycache__` bytecode are excluded as scratch. The animation `.blend` is separately withheld because it contains local absolute paths.

`cinematic-delivery-inventory.json` is the machine-readable full file/hash/size/dimension inventory. `hero-cinematic-imagegen-provenance.json` records the actual R23 preflight result, and `lightning-sprites-provenance.json` records runtime paths, prompts, hashes, rights state, motion behavior, and byte budget.

## R23 and Design Bible conformance

| Requirement | Evidence | Result |
|---|---|---|
| R23 local original render provenance | Actual image candidates record `origin=OPENAI_IMAGE_GENERATION`; the scene file is separate and did not produce those pixels. | **Blocked.** Real-byte preflight fails closed with `ORIGINAL_SOURCE_UNESTABLISHED`. No relabeling was made. |
| R23 2K editable render master | Blender source and an 800×400 preview exist; no 2560×1280 master render exists in the checkout. | **Not met.** `blender` is unavailable in this environment, so no Blender reopen/render verification was possible. |
| R23 review candidate bounds | ImageGen candidate is 1774×887 with valid PNG/WebP payloads and matching hashes; both satisfy the binary header/dimension checks. | Technical bytes are valid; the required original-local-render gate still blocks candidate acceptance. |
| Design Bible §6.2 hero direction | Generated study has a dark text side, dominant gold Bitcoin, rocky horizon, green chart energy, and lightning; active component keeps separate HTML copy and local vector fallback. | Direction is recorded for review only. No Golden screenshot comparison or visual acceptance is claimed. |
| Design Bible §11.4 asset metadata | Candidate and active v2 lightning assets have prompt/workflow, hash, size, dimensions, source/reference, and rights fields. | Active v2 provenance is recorded. Historical alternatives are explicitly marked incomplete and unused. |
| Design Bible §15 benchmark | The generated animation contact sheet exists. A deterministic same-viewport page screenshot and frozen-motion comparison were not produced for this change. | **Pending.** No pixel-parity, LCP, or responsiveness approval is claimed. |

The existing candidate guard still prevents `hero-cinematic-original.png` or `.webp` from becoming the active hero. `GoldenHome.astro` uses the existing vector demo and layers only the seven separately registered lightning sprites. Commercial rights, CoinBlink trademark clearance, final Owner visual decision, and independent review remain pending.

## Local validation

Validation ran on Windows with Node.js 22.19.0 and npm 10.9.3 at source HEAD `cba620d9c9b344b871882f759cdc857ac031744d`.

- `npm test`: **PASS** — unit suite 183/183; build completed and reported no SESSION, data, service, or production bindings; Playwright E2E 34/34. The isolated and integrated visual checks captured desktop 1536×864, tablet 768×1024, and mobile 390×844. Both reports record zero Axe violations, zero browser/page errors, and no external requests.
- `npm run lint`: **PASS** — ESLint completed with `--max-warnings=0`.
- `npm run typecheck`: **PASS** — 76 files, 0 errors, 0 warnings, 0 hints.
- Python syntax compilation: **PASS** — all four pipeline/inventory scripts compile, including the revised inventory script.
- The initial pre-commit visual run rejected dirty source inputs as designed. SonarCloud identified a duplicated `18%` selector in the newly added scene-flash keyframes on intermediate remote head `1af136f); a regression test reproduced it red-first, and the corrected code passes the full suite at `cba620d`. The final hosted analysis result is recorded separately in the PR checks.
- The actual image candidates still fail the required original-local-render preflight with `ORIGINAL_SOURCE_UNESTABLISHED`; the existing vector demo and generated lightning overlays remain the active visual.
- The 2560×1280 Blender master was not produced, Blender could not be used to reopen/resave the animation project, and the local animation `.blend` remains withheld due embedded absolute paths. These are delivery limitations, not passing validation claims.

## Boundaries

No merge, deployment, main-branch modification, ruleset change, checkpoint update, or publication/visual approval was performed. CB-M01 remains admitted and not complete; `authorizedToMerge=false`.
