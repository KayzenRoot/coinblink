# Security and accessibility QA

## Source-file controls

- The ZIP envelope was integrity-checked, but only the five approved SVG entries were read and imported.
- Every imported SVG has a byte-length and SHA-256 pin in brand-manifest.json and source-lock.json.
- The static validator rejects DTD/entity declarations, script and embedded content, event handlers, links, remote or executable schemes, external CSS/font imports, unresolved local paint-server references, duplicate IDs, and invalid viewBox numbers.
- The ordinary http://www.w3.org/2000/svg namespace is allowed; it is an XML namespace identifier, not a network resource.
- The original Golden JPEG is hash-checked and unchanged.

## Browser and assistive technology checks

The separate harness and runner are test-only; the runner serves the harness from an ephemeral loopback server and references only the five local SVG assets. It parses each asset through browser DOMParser, asserts successful image decode, accessible image roles and names, no script/console errors, no external requests, and no horizontal page overflow at desktop 1536×864, tablet 768×1024, and mobile 390×844.

Symbol and favicon proposals are shown at 32, 48, 96, 128, 256, and 512 pixels on light and dark surfaces. Horizontal marks are shown at 32, 48, 96, and 128 pixels high on their designated surface. The stacked mark is shown at 64, 128, and 256 pixels on light and dark surfaces.

This automated check verifies accessible names and rendering. It is not a screen-reader certification or a legal, trademark, or contrast approval.

## Result

PASS for static SVG safety and the isolated browser harness: all five SVGs parsed as XML; the 38 rendered samples at each of three viewports loaded with accessible image roles and non-empty names; no external requests, page errors, console errors, or horizontal overflow were observed. The harness also verified exact requested icon dimensions and logo heights.

Limitations: no assistive-technology / screen-reader certification or formal numeric contrast audit was run. Visual review found the stacked mark's “Coin” wordmark has insufficient visible contrast on a light background. The source vector remains byte-identical and the manifest now restricts its recommendation to dark surfaces. See visual-proof-index.md and the six hashed captures.
