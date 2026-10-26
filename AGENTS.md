# CoinBlink development instructions

## Build the product first

The active goal is a functioning CoinBlink across its product modules, not a governance framework. Implement real product behavior in small, reviewable increments. Never require an admission document, checkpoint delta, GEF CLI, Work Order or extra approval round merely to edit a module.

Use normal branches and pull requests; focus on visible working features. Use `npm ci`, `npm run dev`, `npm run build` and `docker compose up --build`. Applicable PR checks include Build, SonarCloud and Socket, plus the current read-only PR Assurance (scope/review/quality) and CI Quality (lint/typecheck, focused Node/LCOV and Gitleaks) workflows and module-specific regressions. Verify the actual successful checks on the exact HEAD and every GitHub-required gate; never treat a Skipped scanner as a completed scan.

Do not invent real prices, headlines, source rights, live-feed integrations, security assurances or completed modules. Keep secrets out of git. Do not publish or deploy production, and do not use real credentials without the owner's separate request. Preserve authentication/session/CSRF/Origin protections when working on privileged CMS code. Avoid altering unrelated branches or PRs.

Read [README.md](README.md), [quick development guide](docs/BUILD_FIRST.md) and [module roadmap](docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md).

## Solo Owner pull-request reviews

This is a single-owner project. The **canonical PR-review policy**, including automated evidence, CI gates, collaborator restrictions, actual GitHub branch protection and per-merge Owner authorization, is maintained only in [the chat workflow and handoff guide](docs/CHAT_WORKFLOW_AND_HANDOFF.md#modelo-solo-owner-decisao-do-proprietario-2026-10-19). Follow that source; do not duplicate or override it here.

## Chat interaction preference

When assisting the owner in ChatGPT, read [interactive chat approvals and handoff](docs/CHAT_WORKFLOW_AND_HANDOFF.md) and preserve the preferred **clickable choice/authorization button at the end of each actionable final reply**, when the client supports it. The button requests an explicit user message; it never auto-authorizes merges. This is a collaboration preference, not GEF or a new CI gate. CLI tools without interactive buttons should provide equivalent copy-ready choices.
 Historical git commits and old discussions are archival, not active gating policies.
