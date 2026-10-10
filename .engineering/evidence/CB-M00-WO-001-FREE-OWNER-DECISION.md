# CB-M00-WO-001 — Owner decision: Free-only Cloudflare operation

**Date:** 2026-10-10
**Owner decision:** USER APPROVED NOW, [Issue #36 comment 6099048180](https://github.com/KayzenRoot/coinblink/issues/36#issuecomment-6099048180).
**Main when recorded:** `1ecf88fef5263a8a0b0a291262123f550cfa24e8`.
**Source status:** approved Owner directive, proposed canonical source-pack reconciliation in this PR, no checkpoint promotion.
**Work Order:** existing admitted `CB-M00-WO-001`, M00 only.

## Decision
1. Continue the CoinBlink project on the existing **Cloudflare Workers Free** plan, using only the dedicated `coinblink-m00-preview` Worker and existing manual, protected, Owner-approved per-run Preview workflow when a new run is actually necessary.
2. The Owner's **US$10 budget alert remains unchanged**. It is only a notification, **not** a hard cap or permanent ceiling. Do not treat it as a blocker, pricing approval or proof of a $0 account-wide limit.
3. A hard **US$0 monthly account-wide spending cap is NOT REQUIRED by the Owner for the current Free stage**. Earlier M00-only statements treating hard cap verification as the missing condition are superseded by this dated decision. Maintain accurate provider evidence and avoid claiming guaranteed zero bills across other products.
4. Free-first and fail-closed: no billing upgrade or payment instrument addition, no paid Cloudflare feature, no R2/D1/KV/Queue/Service/SESSION bindings, no production Worker deployment, no scope expansion or automation of Preview dispatch. Free quotas may reject traffic. **If Free becomes insufficient, obtain a fresh explicit Owner decision about paid plan/credit before taking action.** No paid authorization granted now.
5. Security remains unchanged: preserve protected GitHub Environment approval for **each** deployment, least-privilege scoped token, masked secrets, independently observable exact build SHA, Worker-specific binding inventory, and CodeRabbit/security/GEF checks. Provider binding evidence can be obtained read-only; an actual unexpected paid/privileged binding is a security blocker. **Do not repeatedly block the whole M00 merely because an account-level hard spending limit is unavailable.**
6. The existing successful protected Preview [run #38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879), build `e8886e21c6f152ca374b1e42852c6b6638543f40`, stable and immutable URLs, remote browser/axe/screenshots and evidence-only merged PR #48 are retained. Re-deployment is unnecessary unless application source changes or a specific verification fails.
7. Separate, remaining closeout work: provider **binding inventory** read-only verification (without changing settings); Owner visual acceptance **of the M00 demo-only technical foundation**, not Golden M01 parity; objective audit, GEF-valid checkpoint delta and Owner authorization. M01–M17 remain unadmitted and M18 future; global Issue #6 and proposed parallel ADR have their own gates.

## Supersession, safety and proof
This approval supersedes ONLY the literal hard-US$0 financial-cap requirement at the **M00 Workers Free stage**. It does not assert provider capability that has not been observed, waive isolation/security or promise that an unrelated Cloudflare account product can never incur charges. The M00 source DoD and WO are reconciled additively here so the Owner does not have to grant this same permission repeatedly.

No `.engineering/CHECKPOINT.json` update is part of this record. The current proposal itself must be tested/reviewed on a final SHA before integration.

**STOP:** stop and request the Owner's new go/no-go before any Paid plan, credit, paid binding, production resources, destructive provider action or HIGH/CRITICAL security exception.
