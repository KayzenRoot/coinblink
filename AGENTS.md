# CoinBlink development instructions

## Build the product first

The active goal is a functioning CoinBlink across its product modules, not a governance framework. Implement real product behavior in small, reviewable increments. Never require an admission document, checkpoint delta, GEF CLI, Work Order or extra approval round merely to edit a module.

Use normal branches and pull requests; focus on visible working features. Use `npm ci`, `npm run dev`, `npm run build` and `docker compose up --build`. Automated CI only checks installation and build; tests are available for focused regression work but are not a required prerequisite for every incremental UI feature.

Do not invent real prices, headlines, source rights, live-feed integrations, security assurances or completed modules. Keep secrets out of git. Do not publish or deploy production, and do not use real credentials without the owner's separate request. Preserve authentication/session/CSRF/Origin protections when working on privileged CMS code. Avoid altering unrelated branches, especially PR #137.

Read [README.md](README.md), [quick development guide](docs/BUILD_FIRST.md) and [module roadmap](docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md).

## Solo Owner pull-request reviews

CoinBlink is a **single-owner project**. Do not require or recruit an external human collaborator as a standing process prerequisite for developing, technically reviewing, or preparing pull requests. The Owner does not want third-party repository participants. Do not invite contributors, add reviewers, or grant write access without a new, specific instruction.

Use automated technical evidence instead: required Build (Ubuntu), SonarCloud Code Analysis, Socket Security: Pull Request Alerts, relevant module tests, and Copilot Code Review when available within the Owner's existing no-overage plan. CodeRabbit is optional and its skipped/rate-limited reviews must not count as completed substantive reviews. AI feedback is technical evidence, **not a forged GitHub human APPROVED review**. Do not ask the Owner to use their alternate accounts to impersonate independent people.

**No extra independent-human-review gate is imposed by this project policy.** However, this documentation does **not** modify GitHub branch-protection rules. If GitHub actually requires human approvals, leave the PR blocked until the Owner explicitly changes that admin setting through an authorized mechanism. Keep all three required CI gates, zero unresolved blocking threads, accurate HEAD/base/diff verification, and a new explicit Owner authorization for each protected squash merge. Never automatically merge or bypass GitHub protections. No deploy, publication, LIVE, D1 remote, GEF, release or checkpoint promotion without separate authorization.

## Chat interaction preference

When assisting the owner in ChatGPT, read [interactive chat approvals and handoff](docs/CHAT_WORKFLOW_AND_HANDOFF.md) and preserve the preferred **clickable choice/authorization button at the end of each actionable final reply**, when the client supports it. The button requests an explicit user message; it never auto-authorizes merges. This is a collaboration preference, not GEF or a new CI gate. CLI tools without interactive buttons should provide equivalent copy-ready choices.
 Historical git commits and old discussions are archival, not active gating policies.
