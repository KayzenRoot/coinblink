# CB-M06 · LOCAL Editorial Command Center, P0 Extended Slice

This increment enhances the existing **private** M06 panel inside the **synthetic WebAuthn + D1 LOCAL-only CMS**. It does **not** complete the full M06 product module or represent production analytics.

## One coherent vertical
1. Reuse one authenticated GET /local/articles (or test-only /admin/articles alias) with at most 100 synthetic drafts.
2. Derive seven-calendar-day UTC last-edit trend, missing-credit drafts, drafts not edited for >=7 full days, and those edited during the last 24 hours. Each bucket counts **listed drafts by latest edit**, never revisions, visitors, audience or publishing rights.
3. Show honest partial scope if local listing reaches 100; never infer global totals.
4. Add private review-queue filter for drafts last edited at least seven full days ago, alongside existing filters.
5. Clear all trend/metrics/queue state on logout, session revocation and denied GET. Reuse read epoch/generation protection. Render via textContent only.
6. Extend model/negative tests and Chromium WebAuthn+D1 coverage for empty, saved draft, filter and logout.

## Safety
LOCAL_SYNTHETIC, CMS_D1_LOCAL, SOURCE_VERIFICATION_PENDING, DRAFT_ONLY, NOT_CLEARED. No new API, database query, route, external network request, payment, real provider, source reuse permission, public admin exposure, production identity or release.

Calendar trend uses UTC calendar days; other age windows roll from last authorized read. No completion or publishing approval is inferred.

## STOP
Require exact-head M06 Node and WebAuthn D1 Chromium, build, SonarCloud, Socket, Gitleaks, integrated Chromium and Owner-specific separate squash approval. No merge, deploy, Quality Gate, branch rule or checkpoint change.
