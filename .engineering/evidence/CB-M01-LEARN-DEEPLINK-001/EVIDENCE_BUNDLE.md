# CB-M01-LEARN-DEEPLINK-001 | Work Order + Evidence Bundle

**Status:** DRAFT / PENDING CI / NOT MERGED. **Classification:** NECESSARY; bounded product correction. **Risk:** STANDARD implementation, HIGH_ASSURANCE review. **Data:** DEMO_ONLY.

## SOURCE CHECK / CONTEXT LOCK
- Repo: `KayzenRoot/coinblink`.
- Protected main / branch base: `2257a266138dd5a724b144155d5bbe773a39c186`.
- Branch: `feature/cb-m01-guide-deeplinks-20261025`.
- Canonical sources reviewed: `AGENTS.md`, `docs/BUILD_FIRST.md`, `docs/CHAT_WORKFLOW_AND_HANDOFF.md`, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md`, existing M01 source, learning topics and `.github/workflows/m01-m05-browser.yml`.
- Blob locks:
  - `src/modules/CB-M01/learning-search.client.mjs`: `a8cdbd2be69dcc56f1592d00a671084123feefc0`.
  - `src/modules/CB-M01/learning-search.css`: `21a4e4fb76682ababecec0cac94314b0d96f27df`.
  - `e2e/m01-learning-search.spec.mjs`: `f964a0f90aa03e20c9a474ae31eb56a28c86e8ba`.
- If main, branch, scope or critical source changes: mark STALE and re-evaluate before pushing/merging.

## OBJECTIVE
Existing six SSR Crypto 101 guide IDs are deep-linkable as fragments but remain closed when a reader opens a specific URL. Enable a real accessible shareable guide permalink, direct opening, and correct interaction with search filters.

## CONTEXT
- M01 has six static EN/PT guides, native `<details>` fallback, offline filtering and explicit no-LIVE notice, integrated under earlier PR #245.
- Previously merged PR #246 is an isolated brand lab and is not part of this Work Order.
- The Goldens, vectors, header and favicon remain locked.

## SCOPE
1. Progressively add ordinary, user-visible `<a href='#learn-id'>` links to already-SSR-rendered guide details, with localized EN/PT aria-label including the actual guide title. Use safe DOM node APIs, not `innerHTML`.
2. Reveal a guide only when `location.hash` exactly matches one of the already-rendered guide IDs. Clear active filter only for valid guide hashes; expand and scroll the target.
3. Scope new styles below the Golden first fold and test initial links, hash changes, filtered targets, invalid hashes and preserved non-JS behavior.

## OUT OF SCOPE
- New content or routes, LIVE market/news feeds, accounts, cookies, storage, analytics, clipboard permissions, publishing, CMS, payments, original JPEG/SVG asset changes, global header/favicon, trademark rights, production deploy or modifications to existing draft PRs.

## FILES / SOURCES TO READ
- Three changed files: `src/modules/CB-M01/learning-search.client.mjs`, `src/modules/CB-M01/learning-search.css`, `e2e/m01-learning-search.spec.mjs`.
- This file: `.engineering/evidence/CB-M01-LEARN-DEEPLINK-001/EVIDENCE_BUNDLE.md`.
- Read-only dependencies: `src/modules/CB-M01/GoldenHome.astro`, `src/modules/CB-M01/learning-topics.mjs`, `src/modules/CB-M01/home-copy.mjs`, Golden CSS and browser workflow.

## REQUIREMENTS / ARCHITECTURE RULES / CONSTRAINTS
- Preserve static HTML guide content and IDs. Do not query by interpolating untrusted fragment strings; exact equality against pre-rendered elements only.
- No API calls or sensitive writes; `DEMO_ONLY` and restricted brand rights unchanged.
- Do not change production route, graphic assets, security controls or dependency versions.
- Maintain accessible anchor names/focus, browser hash navigation and search keyboard behavior.
- Solo Owner can review via CI; do not claim a second human review without evidence. No direct main write or unauthorized squash merge.

## ACCEPTANCE CRITERIA
1. EN/PT `#learn-recovery` on initial load expands and scrolls the correct card.
2. Each revealed guide exposes semantic hash link with localized, title-specific accessible name.
3. Valid hashchange reveals a filtered-out guide, clears search and restores all six. Unknown hashes do not mutate the filter.
4. Existing six SSR disclosures work without JS; existing search, Escape/clear, mobile, accessibility and no-off-origin requests remain unchanged.
5. Exact-HEAD CI: Build, M01-M05 Chromium, lint/typecheck, relevant Node, SonarCloud and Socket plus all applicable required GitHub checks. No untriaged HIGH/CRITICAL or pending blocking review threads.
6. Diff strictly three source/test files and this evidence file; no browser/app surface above the fold, live publishing, rights or identity changes.

## TESTS
- Added 2 browser regressions (EN/PT). Existing browser workflow runs when `src/modules/CB-M01/**` or `e2e/m01-*.spec.mjs` changes.
- `npm ci`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, browser acceptance and all applicable GitHub checks must be read back by run and exact SHA.
- Local checkout/running in this chat environment: **NOT_RUN**, container GitHub access lacked DNS. Do not substitute source inspection for executed tests.

## DELIVERABLES / REVIEW FORMAT
- Four-file PR diff and reproducible evidence; report exact main/HEAD SHA, CI run IDs/results, Sonar newly reported issues, browser E2E count, screen-reader/offline risk, unresolved threads, CHECKPOINT DELTA proposal.

## EVIDENCE (current)
- GitHub source blob fingerprints and guarded exact-string edits verified. Code/styling/E2E uploaded to a new isolated branch.
- No branch protection, existing PR, Golden image, logo or other module modified.
- Corrected exact-head QA outcomes must be populated through a PR comment after the live GitHub checks; this preflight record claims no CI success.

## PROPOSED CHECKPOINT DELTA (not promoted)
- After separate approved/merged PR: record M01 guide permalinks as implemented with EN/PT hash restoration and safe invalid-hash fallback. Do not promote while in Draft.

## STOP CONDITION
- Leave PR Draft and open. `CORRECTION REQUIRED` on failing tests or actionable findings; `BLOCKED` on drift or missing safety evidence; `READY_FOR_OWNER_DECISION` only on all proven gates. **No merge, deploy, rights change, LIVE data, costs, rule edits or checkpoint promotion.**
