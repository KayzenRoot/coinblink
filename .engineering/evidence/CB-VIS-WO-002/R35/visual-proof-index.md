# Visual proof index

**Purpose:** inspect the exact SVG proposals in an isolated test harness; this is not an integration into the product. Captures were rendered with Chromium 156.0.8078.4 from localhost and reviewed visually.

| Viewport | Capture | SHA-256 | Status |
|---|---|---|---|
| Desktop 1536×864 | `screenshots/desktop-1536x864.png` | `686950c0fa5252b5c11079f7bca600e867cc5005c2d2e80d72cadf957114bced` | Captured at exact viewport size |
| Desktop full page | `screenshots/desktop-1536x864-full.png` | `028c84752a44c5579c52db38de0c932dd73675f41ae1935478a6309af3550b1e` | Captured; full 38-sample matrix visible |
| Tablet 768×1024 | `screenshots/tablet-768x1024.png` | `25b38677b826a6f97485cfd963f4d3209075e8bd83a0816b453e92382e5218cf` | Captured at exact viewport size |
| Tablet full page | `screenshots/tablet-768x1024-full.png` | `76365ccf22f063c7861c367a5391d5149390b7fdc903cf29d96ac4c6d0a3f38b` | Captured; full 38-sample matrix visible |
| Mobile 390×844 | `screenshots/mobile-390x844.png` | `ca030ab0269d1a261776064c85fcac8e56398327d470aa852d7b6e91de685113` | Captured at exact viewport size |
| Mobile full page | `screenshots/mobile-390x844-full.png` | `d057a70e88e903196ee6656e745c22a195a72ce05d25dce7d1b1d4d3132f193b` | Captured; full 38-sample matrix visible |

The rendered size matrix in `test/brand/render-harness.html` covers symbol and favicon at 32/48/96/128/256/512 px on dark and light surfaces, horizontal dark and light variants at 32/48/96/128 px high, and the stacked mark at 64/128/256 px on both surfaces. Each viewport verified 38 image samples, exact requested dimensions, five parsed SVG sources, accessible names, and no horizontal overflow.

## Visual comparison and limitation

The untouched Golden raster is pinned at SHA-256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`. The vectors retain the broad eye / energy / CoinBlink concept, but their geometry, wordmark treatment, and shading are a reinterpretation and are not pixel-identical to the Golden. No pixel-match claim is made.

The full-page light-surface capture shows low visible contrast for “Coin” in the stacked mark; the approved SVG bytes were preserved. The manifest now recommends that mark for dark surfaces only until a separately approved light variant is available. This is a documented asset limitation, not an Owner commercial or legal clearance.

Automated visual captures demonstrate rendering and layout only; they are not an Owner visual acceptance or commercial release decision.
