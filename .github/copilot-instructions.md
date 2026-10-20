# CoinBlink repository-wide review guidance

Review PRs for concrete defects and regressions, not superficial stylistic preferences.
This file does not authorize merges, new reviewers, external operations, deployment or publication.

- Determine the PR's exact HEAD, its protected main base, and the changed-file scope; never claim passing checks from a prior commit.
- Look for exploitable or unintended behavior. Cite path, line and a reproducible scenario. Separate proven bugs from suggestions.
- For authenticated CMS paths, audit session binding, CSRF/Origin verification, 401/403/404 behavior, authorization and stale UI requests; do not widen access to privileged /admin routes.
- CoinBlink M02/M03/M04 data are mock/offline. Flag real quotes, feeds, social publishing, unlicensed sources, and real-user accounts if introduced unintentionally.
- Keep D1 remote access, LIVE data, deploy, publication, release, GEF and checkpoint actions outside LOCAL-only PRs unless specifically authorized in their own scope.
- For GitHub Actions, inspect permissions, untrusted pull_request code and secrets, privileged events, persistence of credentials, pinning of third-party actions, workflow race conditions and bypassable checks.
- Avoid confusing a green self-hosted PR-script diagnostic with an independent trusted security review. Require external evidence for merge-risk conclusions.
- Suggest the smallest Correction Delta with focused tests if a defect is confirmed. Never ask for disabling Build, SonarCloud, Socket or branch protection.
- Do not represent approval by an alternate login of the repository owner as a distinct human review. CodeRabbit/Copilot feedback is technical evidence, not proof of a separate human.
- Favor short, actionable review comments in English with exact file/line and impact, matching the canonical code/documentation language.
- No AI reviewer, including Copilot, is authorized by these instructions to auto-approve merges or change billing. Merge requires a later owner authorization for the exact HEAD and verified gates.
