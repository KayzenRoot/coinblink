# CB-SONAR-147-CODEX-READONLY-001

**Mission (historical 2026-10-20):** investigate SonarQube Cloud main Security Rating D for KayzenRoot/coinblink, issue #147. **Execution engine: Codex**, without switching to ChatGPT Work. The dated aggregate result is recorded in this PR; this text is not standing authorization to rerun, publish, or remediate.
**Prepared:** 2026-10-20 | **Repository:** https://github.com/KayzenRoot/coinblink
**Historical main SHA:** aae3533973518e1af846c321a9df89d03a0918f5. **Later main (2026-10-21):** c3001ccfb663ad0c84085e07783f8d4566b394a4, SonarCloud Quality Gate PASS. Reconfirm for any newly authorized investigation.
**Related PR:** https://github.com/KayzenRoot/coinblink/pull/180 (historical HEAD adc24255154c137daebebe2939a87103a6bc1a09; now MERGED; never modify through this document).
**Evidence branch / PR:** docs/cb-sonar-147-codex-handoff-20261020 / PR #181. Further evidence writes require a new specific Owner authorization, are limited to this branch, and must remain safely aggregated; NO other branch writes.

## 0. Historical authorized operations and absolute limits (not a standing grant)

- SonarCloud: ONLY GET reads on the project and relevant rule descriptions. Do not alter issue states, credentials, Quality Gates, settings or baselines.
- GitHub: read current main, issue #147, issue #169, and PR #180. The ONLY write allowed is sanitized evidence under docs/audits/sonar/issue-147/ on the same handoff branch, with a commit updating the handoff PR. No issue comments or other PR/branch modifications.
- NEVER commit credentials, cookies, authorization headers, bearer tokens, secrets, full HTTP logs, unfiltered issue responses, or sensitive code data.
- NO product code changes, merge, deploy, release, publication, social posting, real scheduling, LIVE feeds, D1 remote, GEF, billing or checkpoint promotion.
- On a discovered HIGH/CRITICAL/BLOCKER issue, STOP after documenting the finding; do not attempt fixes. See public-repository confidentiality rule below.
- Repository is PUBLIC; a PR branch is also public. Treat unpatched exploitable vulnerability details as sensitive even if the API is accessible.

## 1. Readiness/preflight

1. Check git remote URL points to KayzenRoot/coinblink and fetch refs; do not reset or discard unrelated local changes.
2. Verify current main SHA and its check. If it differs from the historic reference, record both and distinguish the historic failing check from the current Quality Gate without claiming they match.
3. Check current Issue #147 and PR #180 states (historically OPEN, now CLOSED/completed and MERGED respectively). Never demand the historical states nor modify these resources; the Copilot creditStatus finding was separate.
4. Check GitHub checks by exact SHA: historical run 118552202578 was FAILURE with D Security Rating on New Code (minimum A). On later main c3001ccf... SonarCloud reports SUCCESS. Do not conflate the runs.
5. Verify SonarCloud project permission Browse. If no login/authorized API access is available in Codex, report BLOCKED. Do not steal browser cookies, inspect token stores or bypass authentication.

## 2. SonarCloud safe read-only retrieval

Use ONLY GET requests to https://sonarcloud.io. Start with:

GET https://sonarcloud.io/api/issues/search?componentKeys=KayzenRoot_coinblink&branch=main&sinceLeakPeriod=true&ps=100&p=1

- Continue p=2,3,... until API reported total is completely covered. Reconcile total, pages retrieved, raw count, unique keys, duplicate keys, errors and HTTP status for every page. Do not invent time or severity ordering.
- If API requires authentication, use ONLY a pre-existing explicitly authorized secure environment/interactive method supported by the local Codex client. Never ask for secrets in ChatGPT, write tokens in a URL, print them, store them in files or commit them. If no such method exists, finish BLOCKED.
- If receiving HTML/login, 401/403/404, rate limit, malformed JSON or incompatible paging, record only sanitized error category/status and stop or perform a limited GET-only supported diagnostic. Never interpret blocked/empty as zero vulnerabilities.
- If sinceLeakPeriod=true returns zero while the main check says D, perform one additional GET-only diagnostic query without sinceLeakPeriod, labelled separately; do not silently replace the primary result.
- For obtained rule keys, optional GET https://sonarcloud.io/api/rules/show?key=<percent-encoded-rule-key>, subject to authentication and GET-only rule.
- If no API access but authorized GUI browser access exists in Codex, inspect the visible UI in read-only mode, label findings PARTIAL unless full pagination/record reconciliation is proven.

## 3. Sanitization and evidence model

Per issue ALLOWLIST only: key, rule, type, severity, impacts (softwareQuality and severity only), component, textRange, line, message, status, issueStatus, creationDate, updateDate if present. Never manufacture missing fields.
Per metadata: project, branch, referenceSha, observedMainSha, checkedAtUTC, source, queryParameters, pageHttpStatuses, reportedTotal, pagesFetched, retrievedCount, uniqueIssueCount, paginationComplete, accessStatus COMPLETE/PARTIAL/BLOCKED, limitations.
Examine ALL allowed free-text fields for private URLs, tokens, credentials, personally identifying details, leaked secrets or raw source code and replace unsafe spans with [REDACTED]. Do not serialize original HTTP payloads, headers, sessions or environmental variables.

IMPORTANT PUBLIC-REPO RULE: If any finding describes an unresolved potentially exploitable HIGH/CRITICAL/BLOCKER vulnerability, DO NOT push its issue-specific path, line, message, exploitation instructions or detailed rules into this public GitHub repository. Commit only a NON-SENSITIVE status summary (counts/status/blocked reason, without secrets or exploit paths) and mark detailed evidence as needing owner-approved private storage. Do not claim full detailed JSON is safely published. Keep any detailed data only in an untracked local file protected by workstation permissions, not committed or uploaded, pending owner instruction. Do not provide exploit instructions.

## 4. GitHub evidence outputs and minimal writing rights

Evidence directory: docs/audits/sonar/issue-147/ . On the handoff branch ONLY, create or update:

- status.json: always safe sanitized summary with status, main SHA, counts, HTTP status codes, metadata and limitations; no issue-level exploit details.
- issues-sanitized.json: sanitized allowlisted issue records ONLY when they are demonstrably safe for a PUBLIC repository. Otherwise omit it and note withheld-for-private-storage in status.json.
- report.md: concise factual interpretation; rule, severity, file:line only when safe to publish, distinguishing aggregated Sonar Rating D from a specific technical finding. Separate PR #180 findings, including its Sonar 1 new issue and Copilot creditStatus thread, from main #147.

Before committing inspect the staged diff and run a secrets/redaction scan; fail closed if unsafe. Do not add personal data, any environment file or credential. Stage ONLY the three evidence paths above. Commit/push to docs/cb-sonar-147-codex-handoff-20261020 ONLY, update the existing documentation PR; do not create any new PR or push main. If push is unavailable, leave a safe local report and declare the GitHub upload BLOCKED, without changing permissions.

## 5. Acceptance, STOP and handback

- COMPLETE only when access and authorization verified, all API pages read, counts match, records sanitized, risks categorized, evidence safe for public GitHub and committed to the allowed branch.
- PARTIAL when the API/UI provides only some valid results; record all omissions.
- BLOCKED when there is no authorized access, paging cannot be reconciled, or safe-publication cannot be guaranteed. A BLOCKED state is not zero issues.
- HIGH/CRITICAL: STOP all implementation and provide only risk-safe evidence and next decision. No change to Sonar issue status or Quality Gate.
- Return to ChatGPT with only: status, exact main SHA, safe evidence GitHub URL(s), counts, identified severity bands, limitations, PR #180 preservation, branch HEAD and explicit statement that no merge/deploy occurred.

## 6. Operator handoff

This 2026-10-20 historical extraction is COMPLETE only for its old observed SHA. Issue #147 is now CLOSED and PR #180 is MERGED. Do not automatically rerun these instructions or disclose additional details; any fresh mission needs explicit Owner authorization.

Codex is the execution tool. ChatGPT chat is the permanent coordination/decision interface. Do not require ChatGPT Work or file downloads. If evidence is safe, store it through a non-merged GitHub PR; any code remediation is a later, separately authorized task.
