# CB-M08-P0-LOCAL-RESEARCH-001 · Working offline evidence desk

**Base:** ad00d6a671f8af71c6e729d15347b261997ec75b (2026-10-23). **Modules:** M08 new P1 demonstration, dependent on current M03 provenance and M04 readiness. **Owner request:** resume product development without touching ECC experiment PR #209.

## Delivered P0 vertical
- Navigable **/demo/research** page linked from the existing LOCAL journey in M03 and M04.
- Select one invented M03 source and one M04 offline market example. Generate an **eight-gate evidence checklist** with original M03 provenance report fields and M04 blockers, including missing rights, capture/digest, observation timestamp and absence of an approved live provider.
- Strict fail-closed validation, immutable plain DTO, no fabricated quotes or publishing/verification flags.
- Human review only: neither an AI research agent nor a factual-verification engine has been built or executed. Every selection is synthetic and no network or D1 access occurs. This is explicitly a foundation for future real M08 work, not M08 completion.
- Reset stale results on selection changes or navigation. Keyboard focus/aria-live status, responsive desktop/mobile controls.

## Checks and release gate
Unit contract: canonical M03/M04 dependency, nine valid cases, invalid inputs, immutability and privacy. Browser: 390/768/1366, axe A/AA, no off-origin or write requests, source→market path, reset and noindex. Extend existing free Ubuntu read-only CI Quality and integrated journey test *coverage only*, preserving previous required checks and policies.

**STOP:** exact HEAD SonarCloud 0 PR-new issues/0 hotspots, all GitHub checks completed SUCCESS, no security/regression concerns, recorded evidence. Squash merge requires a separate specific Owner authorization. No deploy, remote data, commercial rights, keys, production admin/Cloudflare, external LLM, payments or ECC PR #209 writes.
