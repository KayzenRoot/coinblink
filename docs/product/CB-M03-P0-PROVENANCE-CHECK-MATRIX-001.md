# CB-M03-P0-PROVENANCE-CHECK-MATRIX-001 · Source evidence comparison

**Base:** `11413b0ed90d48e9b15fd6421d204819dab36336`  · **Scope:** P0 incremental, demo-only, no ingestion.

## Backlog selection

The CoinBlink catalog has 19 modules M00–M18. The verified source tree includes application folders M01–M10 (incremental, not complete), M00 shell/build infrastructure, and no application folders for M11–M18. Historical open issues marked PLANNED are not proof of absent implementation. M02 already supports localized search and private editorial review; M04 recently added a readiness blocker comparison. The M03 fictional provenance workbench already has inspection details and a summary comparison, but **did not tell readers whether specific evidence checks agree across the two selected source examples**.

This P0 addition makes the existing four checks (`URL`, `RIGHTS`, `CAPTURE`, `DIGEST`) visible in the comparison, alongside mismatched synthetic inspection and licensing labels. Data is exclusively **the pre-existing server-rendered `inspectSyntheticProvenance` result**. All records remain mock, unlicensed and blocked.

## Functional acceptance

- Compare two distinct example sources on `/demo/sources`: retain the original two-record status summary and show **matching/different check states** plus whether inspection outcomes and license labels agree.
- Example alpha/gamma: identical mock `URL:SYNTHETIC_ONLY`, `RIGHTS:NOT_CLEARED`, `CAPTURE:NOT_CAPTURED`, `DIGEST:NO_DIGEST`; different inspection outcome (DENIED_RIGHTS/UNAVAILABLE). Alpha/beta shows different license labels.
- When either selection changes, previous checklist is hidden and its text cleared, avoiding stale evidence presentation. Missing/invalid/same-source selections fail closed and never reveal checklist. All output uses inert DOM `textContent`, no HTML interpolation of user input.
- One existing M03 E2E now verifies rights/capture/digest matching, inspection/rights differences, selection reset and same-source denial, while retaining axe, responsive and network isolation checks.
- Unit DOM VM test is extended for select change events and canonical source-check fixtures. No production data, HTTPS requests, provider SDK, license approval, D1, publishing, owner authority or browser persistence introduced.

## Required gates

Exact-head CI Build, integrated Chromium, Node/LCOV, lint/typecheck, Gitleaks, PR Assurance, Reviewdog, SonarCloud **0 New issues/0 Security Hotspots**, Socket checks, zero review threads and Solo Owner merge policy. Before any merge, Owner must separately authorize a NORMAL squash at exact HEAD and main. ECC PR #209 cannot be changed. No deploy, money or LIVE data.
