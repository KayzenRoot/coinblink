# ADR-CB-0004 · M05: strictly local D1 draft-persistence boundary

**Status: PROPOSED / REVIEW_REQUIRED / NOT_EFFECTIVE.** This is an architectural decision *candidate*, not an executable database or P1 security admission.
**Owner intent (2026-10-12):** approved preparation for review, **without automatic merge**; no authority to provision, migrate, expose or deploy a database is inferred.
**Source canonical main:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`.
**Existing application evidence:** M05 PR #59, inspected at HEAD `a20a4bd629c3beb29dcf1e45eeac8f04465b3b8c`, has a local-only Markdown drafting UI. It remains OPEN/UNMERGED. M01 PR #58 is separate.
**Governance prerequisites:** existing adopted ADR-CB-0002, CB-M05 contract, the canonical main checkpoint, the M05 Work Order and Context Lock; other open governance PRs (#46/#62/#65/#67/#69) must not be silently superseded.

## Decision sought

After a **separately reviewed, Owner-approved and merged** governance change, permit a bounded **M05 LOCAL_D1_SPIKE** with a small, versioned data model and integration tests. All writes occur in a named, disposable **local Wrangler D1 state directory** on the developer's Windows machine. This decision deliberately **does not authorize** a remotely provisioned Cloudflare D1 database, paid services, remote migrations, production databases, an internet-accessible authenticated CMS, an admin API, an active Owner account/session, or article publishing.

Local experimental persistence is an engineering capability, **not** completion of M05 P1. Publicly reachable `/demo/editorial/**` remains MOCK / SECURITY DISABLED and must not silently begin saving user text to an arbitrary backend. The current exported/imported Markdown experience remains usable when the local experiment is absent.

### Boundary and acceptance table

| Area | Permitted after all activation gates | Not permitted by this ADR |
| --- | --- | --- |
| Database | D1 local simulation, explicit local `--persist-to` path, versioned migrations, isolated fixture data | Cloudflare D1 remote resource, `--remote`, remote dashboard binding, paid usage |
| Data | Only synthetic/non-sensitive article drafts, original HTTPS source reference, monotonic revisions, timestamps | Credentials, personal data, provider tokens, live articles, third-party full text without rights |
| Runtime | Local isolated repository/service adapter and integration harness; only an explicitly gated loopback development adapter if later independently authorized | `/admin` or `/api` publicly exposed for unprotected writes, Worker production writes, public signup |
| Security | Default-deny absent local environment and explicit gate; tests for nonproduction-only wiring | Treating localhost as authentication; skipping MFA, CSRF, server authorization or audit for future real deployment |
| Delivery | Codex Desktop LOCAL isolated worktree; M05 module-owned code plus Steward-serialized shared changes | VPS, production deploy, automatic squash/merge, CI secret use, bypassing branch protection |
| State | Designated `LOCAL_TEST` drafts, validation-only source URLs, backup/restore in local sandbox | Claim that articles are approved, fact-checked, licensed, published or available to M02/M03 as LIVE |

## Implementation contract (proposed, to be verified in the Codex execution review)

1. Define an additive, portable v1 schema for `drafts` and `draft_revisions`. Suggested fields: `id`, `title`, `author_label`, `summary`, `body`, `source_url`, `locale`, `revision`, `state='draft'`, `mode='LOCAL_TEST'`, `created_at`, `updated_at`. Revision rows carry prior complete snapshots and revision ordering. Design names/indexes with M05 owner review before migration approval.
2. Use parameterized SQL only, bounded field lengths, rejection of non-HTTPS/malformed source URLs, transactionally consistent revision updates, positive revision preconditions and conflict results. Never interpolate IDs or user-supplied SQL; no unconditional overwrite on simultaneous edits.
3. Keep migrations idempotent where feasible and explicitly versioned, with fresh-install, repeat-run, rollback/restore and data-migration safety evidence. On interruption, recover from an isolated local backup/snapshot; do not claim `ROLLBACK` of a remote D1 migration.
4. Execute only Wrangler commands verified against the locked CLI version. For any D1 migration command, explicitly require `--local` and a fixed test-only `--persist-to` directory. Use distinct database names/paths for different worktrees and CI. Never use or fall through to `--remote`.
5. Do not commit SQLite databases, SQLite WAL/SHM, `.wrangler` state, `.env`, tokens, seed data with user information, downloaded drafts or other runtime artifacts. Add necessary ignores via an Integration Steward review, not by the module agent alone.
6. Data access must be clearly demarcated from browser UI. The public static demo should not gain privileged mutation routes. Prefer local-only harness and integration tests first; if a loopback-only HTTP development interface is later proposed, require an additional isolated network/access decision, production fail-closed build check, CSRF-like origin protection and negative remote access evidence before enabling it.
7. Preserve CSP `script-src 'self'`, noinline script exceptions, no user-provided executable HTML, preview `noindex`, and disabled publication, privileged login, Settings vault and external providers. Source URL format checking alone is never called a factual verification.
8. Require deterministic unit tests for validators/revision conflict; integration tests against locally persisted D1 with restart survival; negative tests for missing binding, missing local mode flag, production build exclusion, injection, malformed source, recovery after failed migration and refusal of publish/approve/review or arbitrary status mutation.
9. Test in an isolated Windows Codex Desktop worktree first. Ubuntu/Windows GEF, lint/typecheck/build, Docker and Playwright/axe exact-head checks remain mandatory before proposing any broader UI adapter. The CI cannot require remote D1 credentials or paid resources.
10. Create a clear operational checkpoint with successful local migration command **as run**, before/after schema version, local path (without personal/private data), test counts, SHA, known limitations and cleanup process. No fabricated screenshots, database state or gate successes.

### Exclusive ownership

**M05 module worker:** `src/modules/CB-M05/**`, `test/modules/CB-M05/**`, M05-only nonsecret test fixtures. Owns the data access interfaces and validation contracts, but does **not** mutate shared platform wiring.

**Integration Steward only, sequenced:** `wrangler.jsonc`, `astro.config.*`, `src/pages/**`, `src/middleware.*`, shared `src/layouts/**`, `package*.json`, `migrations/**` (or any other canonical database migration tree), central DB binding typings, shared test harnesses, Docker files, CI/workflow configuration and real Worker/binding configuration. Steward must inspect all shared-file edits independently and retain one serialized integration owner.

**Architecture/Owner reviewers:** this ADR, associated Scope Delta, Work Order/Context Lock update, cost boundaries and all P1 security decisions. Existing frozen provenance/history remains unchanged.

## What this ADR explicitly leaves OPEN

- Real one-human-Owner claim, account bootstrap, login, MFA/passkeys, session cookie/security headers, recovery, CSRF, rate limiting and privileged audit trails.
- Production database, migration/backup tenancy, encrypted vault/root KEK, provider API connection, remote D1 provisioning/binding, licensing and external publishing.
- M02/M03 live content contracts and content rights/attribution, preview versus production API permissions and any spending authorization.

Those require a **separate comprehensive security/data/provider ADR**, actual integration tests and fresh Owner permission. Do not treat a local D1 test or this proposal as proof of production security.

## Promotion sequence and STOP condition

1. Review proposal against current canonical main, active GEF Context Lock and concurrent governance PRs; request a substantive eligible independent review (CodeRabbit status `skipped` is not approval).
2. Obtain **explicit Owner decision on the precise D1-local-only boundary**, pass six exact-HEAD CI checks and GEF preflight, then integrate this governance proposal through the protected, authorized serial merge flow. **This user instruction authorizes drafting/review only, not merge.**
3. Only once canonical main contains an effective decision, reconcile the Work Order/Context Lock fingerprints, evidence and shared-file owner authorization against that main SHA; secure separate Owner go/no-go for the local spike before invoking Codex.
4. Start Codex Desktop LOCAL and execute only the bounded module/Steward tasks. Stop before any remote resources, privileged HTTP endpoint, auth, production or publication if any authority remains missing.

**STOP:** Proposed ADR open, reviewed but unmerged, or canonical gates missing => **NO D1 IMPLEMENTATION OR MIGRATION**. Do not change `.engineering/CHECKPOINT.json`, module completion, status of M02/M03, production cloud settings or main branch protection in the governance candidate.
