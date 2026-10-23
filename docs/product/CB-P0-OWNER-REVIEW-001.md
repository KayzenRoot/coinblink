# CB-P0-OWNER-REVIEW-001 · Work Order and Context Lock

**Base:** \`debb765ea39afaf8a346c8432ca30db72ce3e808\` (verified \`main\` after merging #217 and #218).
**Branch:** \`feat/cb-p0-owner-review-001\`. **Risk:** ELEVATED, LOCAL D1 + synthetic WebAuthn.

## OBJECTIVE
Create private, persistent, exact-revision synthetic Owner review for a saved M05 draft before its already-available manual M05 Markdown export to the private M02 browser preview.

## CONTEXT / FILES TO READ
\`AGENTS.md\`; \`docs/BUILD_FIRST.md\`; \`docs/CHAT_WORKFLOW_AND_HANDOFF.md\`; M05 and M02 contracts; \`src/modules/CB-M05/p1c-local/local-cms.mjs\`; schema, preview runner, admin router and UI; the existing M05→M02 bridge tests.

## SCOPE
- One immutable LOCAL Owner process note per saved article revision.
- Reuse signed synthetic Owner session, Origin/Fetch Metadata, CSRF, same-origin and LOCAL-only hard gate.
- Add review table/triggers compatibly to existing local D1 without deleting or rewriting saved drafts.
- Display the private decision in M05; editing creates a new revision with no current review.
- Preserve the already merged canonical Markdown export and manual M02 local import.

## OUT OF SCOPE
No public publishing approval, rights clearance, live news, real identity, remote D1, network integration, credentials, payments, deployments, ECC #209 changes, global checkpoint promotion or PR merge.

## ARCHITECTURE RULES / CONSTRAINTS
Only existing M05 server authority can read/write the review. An immutable review does not set \`status\` to approved, does not modify M02 and never changes draft visibility. Do not relax session, CSRF or revision checks, suppress scans or bypass GitHub protections. Existing persistent LOCAL D1 is not a throwaway migration target.

## ACCEPTANCE CRITERIA
Unauthenticated/cross-site/no-CSRF, malformed/forged requests, stale/duplicate decisions and DB update/delete attacks are denied; exact current saved revision is reviewed at most once; later edits invalidate its current review without deleting historical evidence; previously working M02 manual import, original fixture routes, local persisted drafts and security gates remain intact.

## TESTS / DELIVERABLES / REVIEW FORMAT
Run Node 22.19.0 focused M05 D1/bootstrap and Chromium, \`npm run lint\`, \`npm run typecheck\`, \`npm run build\`; inspect SonarCloud new issue/hotspot totals and both Socket checks on the exact PR HEAD. Deliver code, regression cases, this Work Order, Evidence Bundle and PR. Review must give base/head SHAs, diff, test evidence, Sonar/Socket, issues, risks and exact verdict.

## STOP CONDITION
Draft PR stays BLOCKED or CORRECTION REQUIRED until required exact-HEAD checks and security/regression evidence satisfy acceptance. **No merge, deploy, remote D1, expenses or public publication.**
