# CB-SONAR-WAVE3-BLENDER-ARCHIVE-20261022

Base: `3fbdfa967e5046f6bdbb4432a7d633fedbb65200`. Separate Python/archive refactor; not a runtime CoinBlink code path. No mesh geometry, source pixels, shaders, render quality, legal/publication metadata or animation keyframe timing is intentionally changed.

- `animate-generated-hero.py`: decompose the highly complex Blender `build_animation` function into image plate, lightning sprites, exposure flash and camera animation helpers called **in the original order**. Deduplicate the literal filenames of both secondary lightning sprite assets without changing their lookup keys or opacity and schedule values.
- `blender-hero-scene.py`: expand the nested material-index ternary to independent branches, remove the provably constant `should_render` boolean, split minted coin construction, relief engraving, background particle animation and lighting loops into helpers. Preserve their argument order and the original material, scene and render operations.

**Evidence expectations:** SonarCloud Python/static quality with zero new PR issues; CI Build, tests and Socket green. Blender rendering is an optional manual visual gate because a Blender runtime, device plugins and archived image assets are required; do **not** claim visual pixel equivalence without generating outputs. No new dependency, config or workflow changes.

**STOP:** no merge absent separate exact-head Owner authorization. No deploy, spending, archive output writes, or checkpoints.
