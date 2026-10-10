# CB-Mxx · Proposed Module Contract (Template)

**State:** `PROPOSED / NOT_EXECUTABLE` until the module's Work Order is admitted on canonical `main`.
**Module / issue:** `CB-Mxx` / `Issue #__`
**Work Order:** `CB-Mxx-WO-001`
**Base SHA:** `__`
**Context Lock:** `.engineering/context-locks/CB-Mxx-WO-001.md`

> This is a blank governance template. Filling it with an interface proposal does not approve product scope, architecture, data rights, provider access, or module code.

## Authority and dependencies

- Canonical planned Work Order and issue:
- Owner-approved Scope/Requirements/Architecture/DoD sources and exact version:
- Producer module / responsible owner:
- Consumers and their expected version ranges:
- Required predecessor module merge SHAs:
- External/provider/legal/privacy/cost gates:
- Contract change reviewers:

## Interface shape

- Purpose and explicit non-goals:
- Exported operations / events / routes:
- Request and response schemas (field types, nullability, bounds, validation):
- Versioning and compatibility/deprecation policy:
- Error codes, timeout, retry, backoff and idempotency behavior:
- Authentication/authorization and privacy boundary:
- Provenance, source, freshness and staleness semantics:
- Retention, migration and rollback semantics (only if approved):
- Resource and cost limits (measured evidence, not a variable standing in for a provider limit):

## Deterministic test seam

- Local interface/fake implementation and its owned path:
- Fixture provenance, fixed clock/IDs, namespace and `DEMO`/`SIMULATED` labels at data and UI/API boundaries:
- Success, invalid input, empty state and failure/fallback cases:
- Timeout/retry/idempotency behavior where applicable:
- Consumer contract test commands and expected results:
- Prohibited live services/secrets in the test lane (external network disabled, no provider credentials, zero provider calls):
- Separate `MOCK` vs `LIVE` evidence records and actual provider-call count:

Fakes must be deterministic and local, contain no real credentials, and must never be presented as live or publishable facts. Provider adapters remain disabled until their separate authorization gates pass. A consumer may not edit a producer-owned contract silently; changes require producer/consumer review and steward arbitration. Shared architecture/schema changes also require a separate ADR.

Database migrations are blocked without a separately approved database ADR and Work Order. The Work Order must name one owner for the shared migration history/manifest, require unique migration IDs, and prove apply plus rollback against an isolated database. Per-module folders do not create independent global migration sequences.

## Integration and ownership

- Module-exclusive paths:
- Integration Steward-owned shared paths touched (if any):
- Required route/composition handoff:
- Required migration/contract handoff:
- Changed-path allowlist and deletion rationale:
- Cross-module integration gate and exact dependency SHA:

## Evidence required before admission / merge

- [ ] Exact canonical base SHA and frozen file fingerprints
- [ ] Reviewed contract and consumer list
- [ ] Work Order file manifest is disjoint from active module manifests
- [ ] GEF doctor/status and applicable preflight results
- [ ] Unit, contract, integration, E2E, a11y and security tests applicable to this module
- [ ] Lint, typecheck, build and applicable Docker/Preview checks
- [ ] Exact-head GitHub checks, independent review, Owner audit and proposed checkpoint delta
- [ ] Risks, failed/skipped checks, mock-vs-live state and external authorization gates recorded

## Decision record

- `PROPOSED` / `APPROVED` / `REJECTED` (link exact approval and merge SHA):
- Unresolved questions and stop condition:
