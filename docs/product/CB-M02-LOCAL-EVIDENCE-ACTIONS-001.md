# CB-M02-LOCAL-EVIDENCE-ACTIONS-001 — private review next steps

**Classification:** NECESSARY P0 follow-up to merged PR #199. **Base:** `729fe0910abdb350528d539e0498dbbc30d703de`. Related modules: M02 (news) and M05 (local draft format); Issues #9, #12 and #152.

## Functional scope
After importing a valid M05 Markdown export into the browser-private M02 preview, the existing source/citation hygiene analyzer continues to report factual-review **signals only**. A new, localized suggested-actions list gives editors concrete next steps for missing references, unused source notes, explicit review markers, numerical claims and invalid note formatting. It uses the existing M05 analyzer, without creating another truth engine.

For zero structural signals, the list still requests **manual** fact, permission and publishing review. For malformed notes it requests repair, never clearance. Each entry is text-only, capped at 140 characters; at most 12 suggestions are displayed with an honest remainder count. No approval, scoring, workflow transition or fact-checking is provided.

## Boundaries
No browser persistence, fetch, remote access, telemetry, upload, clipboard or publication. No real source validation or licensing assumption. Inputs and derived suggested actions are discarded on invalid import, clear and page reload, preserving existing lifecycle controls. No change to M05/D1/WebAuthn, M01 Golden Home, routes, production credentials, workflows, dependencies, Sonar configuration or check requirements. Historical PRs #206–#209 remain untouched.

## Acceptance / verification
- EN/PT strings visible only after a valid private Markdown preview.
- Missing, unused, numeric and explicit markers yield corresponding suggested actions without describing any content as verified.
- Maximum 12 visible suggestions; undisplayed signal count truthful; capped, inert DOM text.
- Invalid, oversized or cleared drafts remove suggestions immediately.
- Run targeted Node tests, M02 Chromium both locales, integrated M01–M05 Chromium, build, lint/typecheck, SonarCloud 0 PR-new issues and 0 hotspots, Socket, Gitleaks and all applicable GitHub checks on the exact final HEAD.
- No merge or deployment without separate Owner authorization and fresh preflight.

**Evidence at authoring time:** GitHub branch creation and source fingerprint verification only. CI is **NOT YET RUN**. No checkpoint promotion.
