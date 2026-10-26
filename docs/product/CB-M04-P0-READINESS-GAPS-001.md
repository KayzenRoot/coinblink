# CB-M04-P0-READINESS-GAPS-001 · Shared vs asset-specific blocker comparison

## Backlog selection / 19-module snapshot

Baseline main: `93b242cbe9f949d67aca4dcf15d15b7b67c05d28`. The roadmap has **19 logical modules (CB-M00 through CB-M18)**. Current source inventory includes product module folders **M01–M10**, plus the M00 shell/CI platform. M11–M18 have no application module folders in this baseline. Their planning issues and documentation are not implementation evidence. This inventory does not establish completion of any module. The M07-E weekly-to-draft feature already exists in source and tests despite an older planning issue.

Selected **M04**, an existing P0 public offline market workbench, to improve the actual market comparison. The previous compare button reported only freshness; it did not identify shared vs asset-specific licensing/observation/freshness blockers.

## Functional behavior

On `/demo/markets`, select two different assets and click **Compare offline readiness**. The existing result remains. A new accessible detail displays common and per-asset **blockers from existing server-rendered `inspectMockReadiness` results**, with no new provider requests or invented data.

For BTC vs ETH, common blockers: `RIGHTS_NOT_CLEARED`, `NO_CAPTURED_OBSERVATION`, `NO_LIVE_FEED`. BTC only: `OUTDATED_ILLUSTRATION`. ETH only: `NO_ILLUSTRATION_TIMESTAMP`. Selecting a different asset clears stale detail until another explicit Compare; invalid or same-asset comparisons fail closed.

The DOM uses `textContent`, existing native keyboard controls, a polite live region and responsive layout. Tests cover comparison, no stale display, same-asset refusal, axe, mobile/tablet/desktop and absence of external requests.

## Safety / release

No quotes, LIVE provider calls, numerical forecasts, trading advice, real licenses, external fetch, storage, sending, scheduler, deployment, dependencies, new permissions or publish state. Existing mock fixtures and readonly contracts are untouched. Keep Node, Chromium, Build, SonarCloud zero new issues/hotspots, Socket and reviews as mandatory before Owner-specific squash approval. No merge under this implementation authorization. PR #209 ECC is independent and protected.
