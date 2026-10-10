# CoinBlink · Immutable Golden Visual References

The approved 1536×864 desktop homepage and 1179×1040 logo masters are kept byte-for-byte at the two exact paths specified by [reference-manifest.json](reference-manifest.json). The manifest records the approved names, roles, JPEG dimensions, byte sizes, and SHA-256 digests.

`presentInGit` describes the tree containing that manifest. A candidate branch or unmerged PR does not change canonical `main`; verify the exact main tree before treating the originals as canonical inputs for M01.

Do not recompress, resize, strip metadata, convert, or replace the master images. Later derivative crops belong in `assets/reference/regions/` and must be reproducibly derived from these originals with documented crop coordinates. The v1.0 Visual Design Bible remains the visual contract.

Related: [COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md](../../docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md).
