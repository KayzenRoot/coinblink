# CB-M10-P0-LOCAL-NEWSLETTER-PREVIEW-001 · offline unsent newsletter builder

Exact main base: ad00d6a671f8af71c6e729d15347b261997ec75b. M10 depends on existing M02 fictional news; future M05/M06 owner workflow must be designed and reviewed separately. Related GitHub Issue #17.

## Visible vertical
- Accessible /demo/newsletter page linked in the existing local journey.
- Choose among all, security, protocol and educational topics. Compose an email-style preview only from 3 fictional, unpublished and unlicensed M02 learning examples; deep links lead to their existing /en/news routes.
- Topic changes, reset and page reload discard draft from the DOM. Stable and immutable model contracts, no network, server storage, signup, subscriber records, consent capture, scheduling, subscription status or delivery.
- On-screen warning: MOCK, UNSENT, NEVER PUBLISHED, no real content rights. There is no consent mechanism masquerading as an operational campaign or an implied newsletter.
- This is P0 interface groundwork, not a completed newsletter and alerts or retention engine.

## Security and verification
M02 is the single canonical source for sample content. Invalid categories fail closed and samples must have demo:true / published:false and synthetic rights flags. Inputs/outputs bounded to max 3, validated internal slug paths and inert textContent. Check on exact HEAD: Node focused tests including M10; integrated Chromium (M01-M05 + M10), mobile/tablet/desktop, axe 2A/AA, no outbound traffic, no browser writes, noindex; Build, SonarCloud zero PR-new issues/hotspots, Socket, Gitleaks, lint/typecheck and PR Assurance/Reviewdog. Changes to existing GitHub Actions append M10 coverage only.

**STOP:** no merge, deploy, cloud tokens, mailing provider, external links, personal data, real email addresses, consent collection, paid tool, rule changes or ECC #209 writes. Prior functional PR #210/#212/#213 unaffected. Integration may require a small LocalJourneyNav rebase when other module PRs are eventually merged into main.
