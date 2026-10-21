# CoinBlink PR assurance V1 · fast, bounded, read-only

**Status: active on main (historically introduced by PR #173 and subsequent updates).** A lightweight safety net, not a governance framework or GEF. This is not a new approval round. Existing branch protection remains authoritative.

## Automated orchestration

The workflow .github/workflows/pr-assurance.yml runs on pull requests targeting main: open, update, reopen and ready-for-review. It starts **three parallel, independent CI lanes** in Ubuntu with Node 22 and GitHub read-only contents, pull-requests and checks permissions:

| Lane | Responsibility | Result |
| --- | --- | --- |
| Scope | Check the exact PR head/base, all file paths, prevent accidental secret/GEF paths; scan complete changed workflows for elevated write tokens, pull_request_target, workflow_run and schedule/deployment triggers | Fail closed on confirmed prohibited paths, elevated workflow triggers, API errors or stale HEAD |
| Quality | Read completed SonarCloud check runs and up to 15 associated GitHub annotations (bounded short wait); report issue paths/lines without altering or overriding the official check | Advisory diagnostic only; official SonarCloud quality gate remains mandatory |
| Review | Inspect submitted review states and requested reviewers; current script may also show historical CodeRabbit comments/quotas as optional diagnostic metadata, not an operational dependency | Informational summary only; never fabricates approval or gates on CodeRabbit availability |

Each lane executes the same fast Node built-in contract tests and emits a GitHub Actions summary. Each can run independently. They do **not** execute LLM agents, request external bot reviews, approve PRs, commit, merge, deploy or publish. No paid APIs, credentials or new dependencies.

## Relationship to product CI and external reviews

- Existing Build, Chromium module checks M01–M07, SonarCloud, Socket and CI Quality remain separate, authoritative and unchanged. Reviewdog / ESLint annotations (read-only), integrated via PR #184, adds free static diagnostics for PRs; it is not an AI semantic reviewer, a substitute for tests, or a formal independent approval.
- CodeRabbit is **retired as an operational dependency**. Do not require or request its reviews, poll its quota, purchase credits, or interpret its absence/rate limits as a failure gate. Older comments and the current script's legacy CodeRabbit diagnostic summary may remain for history only; the script does not use them to fail the review lane.
- Neither reviewdog annotations, CodeRabbit/Copilot bot feedback nor a second account controlled by the Owner constitutes a distinct human approval. Independent substantive review is required only where the Owner explicitly requested it for a specific PR/HEAD or actual GitHub protection mandates it; past specific authorizations (including PR #181) require separate explicit replacement if the method changes.
- A verified GitHub APPROVED submitted on the exact HEAD by another account is only a **candidate**: repository write permission, identity independence and actual branch-protection approval requirements still need verification. This CI does not silently lower GitHub rules.
- The only safe autonomous Correction Delta is a minimal and evidenced fix on the existing feature branch, followed by full CI for the new HEAD. No generic autofix without a defect, no new route, credentials, LIVE integrations, GEF or unrelated changes.
- Current main Security Rating D debt in #147/#169 remains independent of PR Sonar checks; this proposal does not claim to solve it.

## PR lifecycle

1. Developer/agent opens a small PR. Existing CI and the three assurance analyzers run automatically.
2. The scope lane blocks obvious dangerous paths and elevated workflow changes. The review lane summarizes submitted reviews and optional legacy bot diagnostics without blocking on CodeRabbit. The separate reviewdog lane publishes ESLint annotations with read-only permissions.
3. Fix concrete failures within the PR's authorized files. Re-run CI against the new exact SHA. No blanket changes to make checks pass.
4. Triage real reviewdog, SonarCloud, Socket, tests and security findings. Keep historical CodeRabbit findings as past evidence only; quota or missing bot response is not a current gate. Do not infer substantive review from green read-only diagnostics.
5. Obtain eligible independent human approval if required by actual GitHub protection. Zero review threads and all required checks must be verified before **separately requested and authorized** squash merge.
6. Audit protected main after any separately authorized merge. Deploy, publishing, real social accounts, remote D1, LIVE, GEF, checkpoint and release remain prohibited.

## Deterministic local regression

Run the native Node tests without additional packages:

    node --check scripts/pr-assurance.mjs
    node --test test/automation/pr-assurance.test.mjs

The Actions jobs use only their own short-lived read-only GitHub token and GET requests. They reject stale HEAD/base and unbounded or inaccessible results. They never store access tokens or private data in artifacts. No new required status context is configured by this PR; it must be reviewed and merged before becoming active on main.

## Security trust boundary verified during PR #173 audit

**Critical distinction:** The pull_request workflow checks out and executes scripts and tests from the *untrusted PR*. Although its GitHub token is read-only, the PR author can change the script, tests or workflow and cause the PR assurance jobs to report misleading success. **These lanes and reviewdog are useful diagnostics, NOT independent security verdicts or required merge approval.** Neither a passed scope check nor a passed review advisory proves that a hostile PR is safe. Existing branch protection, SonarCloud, Socket and explicit Owner authorization remain separate and essential; obtain genuinely independent substantive review whenever the Owner specifically required it for that PR/HEAD or effective branch protection mandates it.

**Correction Delta from independent audit:** Detect privileged workflow triggers written in YAML list form (including on: followed by - pull_request_target or - workflow_run), and preserve an APPROVED GitHub review when the same reviewer adds a later COMMENTED review; DISMISSED continues to invalidate the candidate. Scope the explicit read-only GITHUB_TOKEN to the API auditing step instead of the entire job, to reduce accidental exposure during local unit tests. Contract tests cover both defects. These changes strengthen the candidate workflow but do not remove the PR-code trust limitation described above.

**Future trusted enforcement requires a separately reviewed design:** Run the security evaluator from a protected, immutable trusted reference or separately controlled GitHub App, with PR content treated strictly as input, and attach a required status only after its issuer and rule configuration are independently verified. Do not enable privileged triggers (such as pull_request_target or workflow_run with write-capable tokens) merely to circumvent this limit. Historical CodeRabbit quota records do not affect current review gates; any separately required human-review eligibility remains unaffected.

## Limitations

The jobs are security/scope and evidence analyzers, not equivalent to independently operated AI coding agents. This first safe slice requires no third-party secrets and no new spend. GitHub approval requirements may be inaccessible via the current integration (403), so do not assert an exact approval threshold without verified configuration. Future expansion into correction bots or webhook-triggered agent orchestration requires a separate narrow security-reviewed PR and least-privilege credentials. The Owner's later explicit merge authorization is still mandatory.
