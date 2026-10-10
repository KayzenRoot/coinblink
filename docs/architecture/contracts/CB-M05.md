# CB-M05 · Sole-Owner CMS producer contract candidate

**Status:** PROPOSED / NOT_APPROVED / NOT_ADMITTED / NON_EXECUTABLE.
**Contract owner if admitted:** CB-M05. **Consumers:** M02 article read model, M03 source ingestion, M07/M08/M09/M10/M11/M13/M17 as admitted by actual dependency DAG.
**Source base:** `842fc5a0e54bdaed37066abd830fd1b346368b2b`, M00 COMPLETE/5%. The staged global source/ADR PR #53 is still not in main at drafting time. This document freezes **no** auth implementation vendor or Cloudflare resource.

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

Global #53 (staged Scope/Architecture/DoD + adopted parallel ADR) must merge and #6 resolve, security/data/provider selection reviewed for privileged components, own `CB-M05-WO-001` with latest main Context Lock/contract ownership and separate GEF admission in checkpoint. Until then this is a **producer draft only**, not code or actual Codex agent authorization.
