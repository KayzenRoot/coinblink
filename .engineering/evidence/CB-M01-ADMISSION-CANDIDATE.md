# CB-M01 individual admission · proposed evidence delta

**Source canonical main:** `e40d36b2a589596869eb296696e917f724d5be65`; M00 COMPLETE/5%, 19 module IDs, Issue #6 global gate CLOSED, Issue #5 original Golden bytes CLOSED after upstream #53/#54 merges and 5/5 main CI. PR #55 predecessor candidate `772f2d11f26f798e0917067319991079974eb849` must itself be merged and checked before this admission PR becomes eligible.

**Proposed only:** M01 module admission NOT_ADMITTED→ADMITTED effective on the separate reviewed admission PR merge, not before; Work Order CB-M01-WO-001 created, Context Lock recorded, no module code, no actual desktop agent started and no checkpoint completion percent increase (still 5%). M05–M17 remain NOT_ADMITTED; M18 FUTURE.

**Gates:** exact Golden SHA-256 and Git binary blobs, current main GEF 1.1.2 readback, PR #55 contract adoption, exclusive ownership, exact-head CI/tests/CodeRabbit, Owner go/no-go and actual merge; historic sourceMainSha is provenance and remains untouched. No Cloudflare new deployment, costs, code or external services in this admission candidate.

**POST-MERGE EVIDENCE NOT YET CLAIMED:** no exact CI URL/independent review/main SHA can be asserted before actually observed. After promotion, Codex Desktop LOCAL starts M01 code in a separate new worktree with a fresh execution Context Lock referencing real postmerge main.

## Progress invariant regression follow-up

The admission-only checkpoint must remain 5% while `completedThroughModule=CB-M00`; admissions may not advance completion. The regression test now asserts exact 5% conditionally on the canonical last completed module, while allowing a later explicitly completed module's separately reviewed checkpoint to increase percent without falsely failing the historic global test. No completion percent or application code changed by this fix.
