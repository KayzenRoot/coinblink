# CB-M04 · Markets, Ticker & Radar · P0 contract candidate

**State:** PRE_ADMISSION_CANDIDATE / MOCK_ONLY / NOT_EXECUTABLE_UNTIL_CANONICAL_ADMISSION. **Version:** 0.1-proposal. **Source base:** `28e20b3bafef940e465d6d2a7ba938ae8e393e74`. Owner permitted this preparatory branch while Codex runs R78; Owner explicitly forbade shared-path edits, main changes, merges, remote providers, live data, deploy and publishing.

## Interface to freeze before P0 implementation
MarketObservation DTO with symbol, counter currency/unit, provider, asOf UTC, observedAt UTC, freshness state, data rights and MOCK label.

**Dependencies:** CB-M00; CB-M01 Golden Home consumer; CB-M05 secured provider controls. **Reserved future routes (Integration Steward only):** `/en/markets, /admin/market-providers`.

### Deterministic fixture specification
`test/modules/CB-M04/fixtures/p0-contract.json` is a schema EXAMPLE, not runtime data, a licensed source, actual market quote or deployable application. All sample labels `MOCK`; all URLs under `example.test`; no secrets, remote calls, accounts, billing or trusted provider access. `test/modules/CB-M04/fixture-contract.test.mjs` validates static spec invariants only, NOT functional implementation.

### Security/rights/compatibility requirements
No mock quote may be labeled live; stale/unknown observations cannot be shown as current. No actual exchange/provider network, key or paid rates.

- Fail closed for unknown license/rights, missing timestamp, untrusted source identity, missing permission and invalid input.
- Stable producer version + explicit consumer acknowledgment required for changes, no implicit import from M01/M05 branch into main.
- P0 routes must only be prepared in module-only roots; final route ownership assigned to Integration Steward after approval.
- No public site may present these fixture records as published, approved, live or market-accurate.

## Current dependency and admission gate
M01 #58 rights/home integration and M05 #91 secure shell pending; market licensing/provider approval pending; only stand-alone MOCK UI when admitted.
Read canonical `.engineering/CHECKPOINT.json`: `CB-M04=NOT_ADMITTED` at 28e20b3bafef940e465d6d2a7ba938ae8e393e74. This PR by itself cannot make the module admitted. If admission requires a checkpoint update, that is **separate Integration Steward-owned authorized protected change**, not performed in this branch. If main/ref fingerprints change, recompile Context Lock before execution.

## STOP
Admission-candidate evidence/fixtures/tests only. Do not start `src/modules/CB-M04/**` runtime code or module routes until canonical checkpoint/WO, Owner GO and GEF preflight all prove effective admission. PR remains unmerged until separately authorized.
