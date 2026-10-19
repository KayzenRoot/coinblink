# CoinBlink PR assurance V1 · fast, bounded, read-only

**Status: candidate branch / PR only.** A lightweight safety net, not a governance framework or GEF. This is not a new approval round. Existing branch protection remains authoritative.

## Automated orchestration

The workflow .github/workflows/pr-assurance.yml runs on pull requests targeting main: open, update, reopen and ready-for-review. It starts **three parallel, independent CI lanes** in Ubuntu with Node 22 and GitHub read-only contents, pull-requests and checks permissions:

| Lane | Responsibility | Result |
| --- | --- | --- |
| Scope | Check the exact PR head/base, all file paths, prevent accidental secret/GEF paths; scan complete changed workflows for elevated write tokens, pull_request_target, workflow_run and schedule/deployment triggers | Fail closed on confirmed prohibited paths, elevated workflow triggers, API errors or stale HEAD |
| Quality | Read completed SonarCloud check runs and up to 12 associated GitHub annotations (bounded short wait); report issue paths/lines without altering or overriding the official check | Advisory diagnostic only; official SonarCloud quality gate remains mandatory |
| Review | Inspect submitted review states, requested reviewers and CodeRabbit issue comments; distinguish rate-limit, missing and stale reviews; display formal HEAD APPROVED candidates | Informational summary, never fabricates approval or creates CI deadlock while human review is pending |

Each lane executes the same fast Node built-in contract tests and emits a GitHub Actions summary. Each can run independently. They do **not** execute LLM agents, generate CodeRabbit reviews, approve PRs, commit, merge, deploy or publish. No paid APIs, credentials or new dependencies.

## Relationship to product CI and external reviews

- Existing build, Chromium module checks M01–M07, SonarCloud and Socket remain separate, authoritative and unchanged.
- CodeRabbit is the independent external *technical reviewer* when available. Its COMMENTED / no-finding response is not human APPROVED. A second account operated by the Owner is also not a distinct human.
- CodeRabbit rate limits mean **pending**, not approved. Do not automatically publish review commands from a PR workflow requiring write credentials. The previously authorized periodic PR #172 follow-up can submit at most one new CodeRabbit request only after an evidenced quota reset; it must avoid duplicates.
- A verified GitHub APPROVED submitted on the exact HEAD by another account is only a **candidate**: repository write permission, identity independence and actual branch-protection approval requirements still need verification. This CI does not silently lower GitHub rules.
- The only safe autonomous Correction Delta is a minimal and evidenced fix on the existing feature branch, followed by full CI for the new HEAD. No generic autofix without a defect, no new route, credentials, LIVE integrations, GEF or unrelated changes.
- Current main Security Rating D debt in #147/#169 remains independent of PR Sonar checks; this proposal does not claim to solve it.

## PR lifecycle

1. Developer/agent opens a small PR. Existing CI and the two assurance analyzers run automatically.
2. The scope lane blocks obvious dangerous paths and elevated workflow changes. The review lane lists human/CodeRabbit pending evidence without falsely rejecting the PR merely because approval is pending.
3. Fix concrete failures within the PR's authorized files. Re-run CI against the new exact SHA. No blanket changes to make checks pass.
4. Treat CodeRabbit findings or limits as external evidence. Limit reached: record pending and do not spam. No implicit promotion to success.
5. Obtain eligible independent human approval if required by actual GitHub protection. Zero review threads and all required checks must be verified before **separately requested and authorized** squash merge.
6. Audit protected main after any separately authorized merge. Deploy, publishing, real social accounts, remote D1, LIVE, GEF, checkpoint and release remain prohibited.

## Deterministic local regression

Run the native Node tests without additional packages:

    node --check scripts/pr-assurance.mjs
    node --test test/automation/pr-assurance.test.mjs

The Actions jobs use only their own short-lived read-only GitHub token and GET requests. They reject stale HEAD/base and unbounded or inaccessible results. They never store access tokens or private data in artifacts. No new required status context is configured by this PR; it must be reviewed and merged before becoming active on main.

## Limitations

The jobs are security/scope and evidence analyzers, not equivalent to independently operated AI coding agents. This first safe slice requires no third-party secrets and no new spend. GitHub approval requirements may be inaccessible via the current integration (403), so do not assert an exact approval threshold without verified configuration. Future expansion into correction bots or webhook-triggered agent orchestration requires a separate narrow security-reviewed PR and least-privilege credentials. The Owner's later explicit merge authorization is still mandatory.
