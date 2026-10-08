# CoinBlink · Immutable Golden Visual References

The approved 1536×864 desktop homepage and 1179×1040 logo raster files must be added **byte for byte** at the two exact paths specified in [reference-manifest.json](reference-manifest.json).

## Critical: Golden image bytes are not in Git yet

The manifest deliberately marks `presentInGit:false` because this documentation PR imported only text. The user-selected masters are available in their source attachments and local copies, but the authenticated GitHub connector does not presently accept a local binary file path for uploading. **Do not fabricate JPEGs, silently substitute image-search results, rename derived crops to masters, or claim this asset step done.**

Images are required before pixel-accurate design work can pass visual QA. Later add derivative crops in `assets/reference/regions/` from these verified originals and the CSV/tokens recorded by the Design Bible. After transfer, compute SHA-256, compare the exact expected digests, audit imagery and change `presentInGit` to true in the same reviewed PR.

Related: `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md`.
