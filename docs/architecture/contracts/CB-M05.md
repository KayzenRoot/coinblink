# CB-M05 · Sole-Owner CMS producer contract candidate

**Admission candidate status:** REVIEW_REQUIRED / NON_EXECUTABLE_UNTIL_THIS_PR_MERGED; after merge only P0 fixture-based non-privileged CMS UI is authorized. Real identity/sessions/vault/database/P1 remain BLOCKED until a separate approved security/data ADR.
**Contract owner upon approved limited-P0 admission:** CB-M05. **Consumers:** M02 article read model, M03 source ingestion, M07/M08/M09/M10/M11/M13/M17 as admitted by actual dependency DAG.
**Source base:** `d8233772a80b613015284309a30657ba576a1b4f`, M00 COMPLETE/5%. The staged global source/ADR PR #53 is merged into main; Issue #6 is closed. On pre-merge canonical main, M05 remains NOT_ADMITTED. This PR proposes an individual GEF Work Order and Context Lock; only after a reviewed, Owner-authorized merge will the P0 MOCK-only admission be effective. M05 P1 authentication/security implementation choices remain gated. This document freezes **no** auth implementation vendor or Cloudflare resource.

## Security boundary (P0 is not working auth)

Exactly **one permanent human Owner**. Service principals and editorial `authorLabel` metadata must never create a second human privileged identity. No public signup, magic "dev bypass", client-only authorization, browser-side vault key or production Cloudflare account admin token in Settings.

**P0 after separate admission:** accessible static Admin shell with offline deterministic fixtures **visibly labeled MOCK / SECURITY DISABLED** and no accessible privileged mutation API. Route intents: `/admin/login`, `/admin/setup`, `/admin/recovery`, `/admin/articles`, `/admin/articles/new`, `/admin/articles/[id]/edit`, `/admin/settings`, `/admin/settings/integrations`. Public route creation and middleware require Integration Steward ownership. P0 screens do not assert real security, real session or persisted user data.

**P1 only after separate Owner-approved security/data ADR and authorized provider setup:** unique owner claim with atomic compare-and-set, out-of-band one-use setup, verified email, strong one-way credential hashing, mandatory MFA or passkeys, HttpOnly Secure SameSite sessions, CSRF/rate limiting, trusted device/session revocation, audited recovery requiring stronger proof than access to email. All privileged actions require server-side authorization checks.

**Vault P1:** write-only secret POST/PUT input over HTTPS, masked readback, encrypted secret envelope + independent root key outside the same persistence, rotation/revocation, redacted audit, test-connection result separate from saved/active. No plaintext in GET responses, client bundles, cookies, browser logs, GitHub, telemetry, screenshots, source fixtures or database dumps. Actual DB/provider/KEK must be chosen in reviewed ADR with apply/rollback evidence and allowed Free plan.

## Proposed article state machine (draft contract, no running endpoint)

```ts
export type EditorialState =
  | 'draft' | 'source-check' | 'fact-check' | 'owner-review'
  | 'approved' | 'scheduled' | 'published'
  | 'corrected' | 'withdrawn';
export type SourceProvenance = {
  sourceId: string;
  licenseRef: string;
  retrievedAt: string;
  attribution: string;
  evidenceIds: string[];
};
export type EditorialRecord = {
  id: string;
  revision: number;
  locale: 'en' | 'pt-br' | 'es';
  state: EditorialState;
  title: string;
  authorLabel: string;
  sources: SourceProvenance[];
  reviewedByOwnerAt?: string;
  publishedAt?: string;
  corrections: string[];
  mode: 'MOCK' | 'LIVE';
};
```

- `draft → source-check → fact-check → owner-review → approved → scheduled|published → corrected|withdrawn` is a proposal, not necessarily the final accepted state machine. Bypass from draft/source-check directly to published is always denied.
- Publish requires immutable source evidence and licensed use, an explicitly authenticated Owner approval, auditable revision and idempotency key. `MOCK` cannot transition to actual publication.
- Source/Article/Claim/Correction/Translation identifiers and error envelopes require producer/consumer review with M02/M03 before runtime schemas; no source claims are manufactured for a placeholder news article.
- Multiple `authorLabel` values may exist as metadata on articles, but no multi-human admin login in V1.

## Ownership and integration boundaries

- CB-M05 agent after GEF admission: proposed `src/modules/CB-M05/**`, `test/modules/CB-M05/**`, module-local fixtures and evidence. No shared router/middleware, global package or DB migration edits.
- Integration Steward only: `src/pages/**`, global Astro middleware/session hooks, `package.json`, `astro.config.*`, centralized auth types, migration manifest, Docker/Cloudflare configuration, workflow gates. One serialized owner for session boundaries.
- Secret and cloud provider choices are blocked until distinct Owner security/go-live review, not decided by this draft. All tests for disabled/mock mode must ensure no unauthorized real API actions.

## Required negative/positive evidence for real P1/P2

Atomic concurrent first-Owner claim yields one winner; second Owner never created; unauthenticated forbidden at HTML+API; CSRF on every mutation; expired/revoked/MFA-bypassed sessions denied; recovery replay rejected; `draft` publication denied; unauthorized approval denied; mock `LIVE` claims rejected; secret GET/log/db dump/client leak tests; root KEK outside DB; key-rotation/rollback and provider binding isolation verified. Full accessibility/browser/Docker/Ubuntu/Windows/GEF/SonarCloud/Socket/CodeRabbit on exact PR HEAD.

## Required next authority

Global #53 and Issue #6 are already merged/closed. This candidate contains own `CB-M05-WO-001`, current-main Context Lock and proposed checkpoint admission. **While this PR is open, it remains NON_EXECUTABLE**. Only after all exact-head checks, independent review, explicit Owner go/no-go and canonical merge may a Codex Desktop local M05 agent implement **P0 MOCK / SECURITY DISABLED UI only**. Authentication, sessions, MFA/recovery, persistent Owner identity, database and provider vault remain P1 BLOCKED until their separate approved security/data/provider ADR, regardless of P0 admission.


## Proposed local-only D1 draft persistence addendum (NOT EXECUTABLE)

[ADR-CB-0003](../ADR-CB-0003-M05-LOCAL-D1-DATA-BOUNDARY.md) and the [proposed Scope Delta](../../../.engineering/proposals/CB-M05-D1-LOCAL-SCOPE-DELTA.md) propose a future `LOCAL_D1_SPIKE` limited to synthetic draft CRUD, revision integrity and restart persistence in a disposable **Windows-local Wrangler D1 state directory**. D1 `--remote`, Cloudflare resource creation, Worker preview/production bindings, exposed privileged mutations, login and publish remain excluded. Local simulation is not an authorized Owner CMS session or a LIVE content feed.

Data producer draft contract for later design: source-backed fields `id,title,summary,body,authorLabel,sourceUrl,locale,revision,createdAt,updatedAt`, fixed `state=draft`, fixed `mode=LOCAL_TEST`; every update needs a revision precondition and historical snapshot. All source URLs must be validated HTTPS and independent attribution/rights remain pending verification. The public M05 P0 demo must keep its existing Markdown import/export and not auto-save remotely.

**Integration Steward is sole owner** of central migrations and binding/router/configuration changes. M05 owns module-local contract and tests only. A reviewed governance merge, regenerated canonical-main execution lock and separate Owner go/no-go are required before any local D1 migration. This addendum does not adopt P1 security/data or supersede the blocked auth, MFA, vault, publish or provider decisions above.
