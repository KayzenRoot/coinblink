# CB-PLAN-001 · Planning Context Lock revision 2

**Status:** documentation-only admitted plan; module implementation NOT admitted.
**Branch:** docs/cb-plan-001-modular-product-roadmap
**Main base:** 1c1257871b9d2ee9c3b2943f07f05dfeaa1410b0
**Source snapshot HEAD (before lock update):** f645b5cec99ae7d93aea35588a3189cec34fd823
**Source snapshot tree:** 5fe8d622feb6fb4ccdbcf3bd8d178a95be76925d
**GEF:** v1.1.2, pinned official source revision af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82
**Issue:** https://github.com/KayzenRoot/coinblink/issues/6
**PR:** https://github.com/KayzenRoot/coinblink/pull/24

## Immutable reference visuals (SHA-256 binary masters)
Home 1536×864 JPEG: 82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8
Logo 1179×1040 JPEG: 126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0

The Golden original bytes are NOT YET COMMITTED. The file manifest keeps presentInGit=false. No app can claim actual visual parity before exact-byte transfer.

## Actual repository source fingerprints

These are **Git blob object SHA-1 hashes** over the repository source contents, NOT SHA-256 file hashes. They reflect the docs packet through the user-requested advertising expansion and review fixes; do not infer hashes for undocumented source content. The immutable artifact SHA-256 values above use a different algorithm.

- .engineering/CHECKPOINT.md: 1bde77b0981ff2cb5828ae0dbbb8448ef9e84eec
- .engineering/SOURCE-HIERARCHY.md: 6e4f8e04276af48754dd81a312963e9178ca3bc4
- .engineering/planned-work-orders/CB-M00.md: 698f1d4032a4240d63c4e72b130423a59b1c91ee
- .engineering/planned-work-orders/CB-M01.md: 61df9c61d8327f8e4c9ab8b0dc7c1633d3ae2967
- .engineering/planned-work-orders/CB-M02.md: fbaa7483f90a31a27b9c515417a91d411ba26f9e
- .engineering/planned-work-orders/CB-M03.md: f2cbf712998cf34bb412cb8219f5e96c37453efc
- .engineering/planned-work-orders/CB-M04.md: 2b3b4c5a5a1ac46a6856c44518e077626d5ee516
- .engineering/planned-work-orders/CB-M05.md: 2c37b6bf8ea20d634093ee522cce3ba92bce33c9
- .engineering/planned-work-orders/CB-M06.md: c07bb399d56ce5e9824cc59874db4d3d9f829aff
- .engineering/planned-work-orders/CB-M07.md: a616bd98673eb1d7d87ebf6c71611801534f80be
- .engineering/planned-work-orders/CB-M08.md: 9f4e8e29f8cb9ceb386763ead04e8cdd90c55bc6
- .engineering/planned-work-orders/CB-M09.md: 4db2161e212fa6840407941530ff75f1373be4d6
- .engineering/planned-work-orders/CB-M10.md: b2a65a7fedc350129af8d94d9be126eda4a81cd3
- .engineering/planned-work-orders/CB-M11.md: 6b362cb40e7eb30394b23416d9757b08f22c4d97
- .engineering/planned-work-orders/CB-M12.md: 577efbf26f41f396992798daa875e80d85bd74bc
- .engineering/planned-work-orders/CB-M13.md: e89d140a7b45cb371fe33a298aabb532453ea377
- .engineering/planned-work-orders/CB-M14.md: 52e0dec108d1e6d5aae91e34ac8dfe5d2f727f94
- .engineering/planned-work-orders/CB-M15.md: 952575c164b0662c668daa51ec38ac9e12474a08
- .engineering/planned-work-orders/CB-M16.md: bc31cbcfbdedb0464bd54dbcc3d8b2c3cd291d0c
- .engineering/work-orders/CB-PLAN-001.md: c74d3a79c8fb224c23fdb524a810e594ea10491e
- AGENTS.md: 901204f8d3ea6ee48c93028ff3cfa062b8cf43f3
- docs/DECISIONS_LEDGER.md: 83c7370db2f4064c6e67c50e8966cf31dd6cd06c
- docs/planning/OPEN_QUESTIONS.md: f0d1239a0137d683ea167e7c77eaacdf8e35bee6
- docs/product/ADVERTISING_AND_MONETIZATION_v0.1.md: 563e55103803b40858b285016652648c59ff56fe
- docs/product/ARCHITECTURE_OPTIONS_AND_NONFUNCTIONALS_v0.1.md: 630ab6a1f40f89bab33cfbc712701083cabf592b
- docs/product/COMMAND_CENTER_AND_ANALYTICS_v0.1.md: cb04011e9464036758ca44c29387e6bf41103551
- docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md: 2058446f230e4c39fdce13a8e5f6a100e701f945
- docs/product/INNOVATION_AND_REVENUE_BACKLOG_v0.1.md: e50cd509ce56b6eb82de58be73e327a30a56ffb9
- docs/product/PAID_API_AND_DATA_PLATFORM_v0.1.md: 5204b1836ff498580f2b993b2cdb07c7ed9ebeb3
- docs/product/PRODUCT_BLUEPRINT_v0.1.md: ed2e26a828e62537fbf818eedf926c8cb3accad9
- docs/product/PROPOSED_MODULE_DEFINITION_OF_DONE.md: 78f0614e9c5ac7a3c48a7c5997d7a6f08924faad
- docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md: 12b05d96dc77b3e744233cfc79a7ff3ba8c3424b
- docs/product/SOCIAL_STUDIO_AND_PUBLISHING_v0.1.md: 9be686bf661106bb62a9a8858863fc1903d2f6c0

## Owner decisions vs implementation

Accepted product directions: premium Golden Homepage and logo, English primary with pt-BR/es, one long coherent GEF work order per module, visually accessible Cloudflare/phone previews, owner Command Center per-article analytics, X/Instagram/TikTok Social Studio, future paid external API, and now advertising placements with Google AdSense publisher monetization, direct company sponsor banners and house promotions for future courses.

Specific banner positions, Google publisher account/site eligibility, network earnings, CMP/privacy implementation, pricing, course sales, advertiser vetting and billing are NOT approved; all are still planning dependencies. Ad slots are conditional on Golden visual approval. No external Google ad tag in PR previews. Module M13 owns advertising; M01/M02 only layout seams, M05/M06 admin/revenue integration.

Corrected dependent module boundaries: M04 needs M05 (admin identity/RBAC); M15 needs M09/M10 (SEO and newsletter); M03 Worker Preview Queue testing requires isolated nonproduction consumer because previews cannot consume Queues.

**STOP:** Product Scope/Architecture/DoD/checkpoint JSON remain OPEN. All CB-M00..M16 are draft planned WOs, not admitted implementation. Review, green exact-head CI, resolve inline feedback, then merge planning doc only. M00 future implementation must be separately admitted with own approved Context Lock.
