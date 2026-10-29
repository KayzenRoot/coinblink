# CB-M03-P1-PRIVATE-INTAKE-001 · private intake gate

Status: implemented. The gate measures the real collection and admits nothing,
because no publisher has an owner-approved rights reference yet.

## What this closes

The public reader shows attributed headlines. The editorial CMS can hold
drafts. Between them there was no auditable decision about whether a collected
headline may even begin a private review. This slice adds that decision, using
the canonical gate that already existed in
`src/modules/CB-M03/ingestion/source-eligibility.mjs`.

It is deliberately **not** an ingestion pipeline: nothing is stored, queued,
approved or published. `buildLiveIntakeReview` projects the current collection
through the gate and reports the outcome.

## The registry is empty on purpose

`LIVE_INTAKE_REGISTRY` is `Object.freeze([])`. A source may only be admitted to
private review when the trusted registry contains:

- its exact HTTPS origin and an allowed path prefix;
- `active: true`;
- `intakePermission: "PRIVATE_REVIEW_INTAKE"`;
- an owner-approved rights reference matching the canonical pattern.

None of the five public RSS publishers has such a reference, so every candidate
is denied. The page shows that plainly instead of simulating a licence. Unit
contracts exercise the admitting path with a fixture registry, so the model is
proven without granting anything in production.

## Model contract

`buildLiveIntakeReview(snapshot, { registry })` requires a
`LIVE_HEADLINES` snapshot and returns a frozen review:

| Field | Meaning |
| --- | --- |
| `registrySize` | trusted sources currently registered (0 today) |
| `evaluated` | dated headlines sent through the gate |
| `admitted` | decisions of `PRIVATE_REVIEW_ONLY` |
| `denied` | decisions of `DENIED` |
| `skippedUndated` | headlines without a publication time, not evaluated |
| `publicationAllowed` / `storageAllowed` | always `false` |
| `rightsStatus` | `NO_RIGHTS_REFERENCE_APPROVED` |
| `items[]` | title, link, publisher, decision, reason, granted rights reference |
| `sources[]` | per-publisher registered flag and admitted/denied counts |

Reason codes are `NO_TRUSTED_SOURCE_REGISTERED` when the registry is empty and
`GATE_DENIED` when a registry exists but the item fails a canonical check (wrong
path, invalid title, bad timestamp, non-canonical URL). The gate itself remains
the single authority; the model only labels the empty-registry case.

The external identifier is derived from the publisher's URL path, sanitized to
the gate's allowed character set. Headlines without a parseable publication
time are skipped rather than stamped with the collection time.

## Page

`/demo/intake` (linked from the demo index and the editorial demo):

- **Reader off** — says no request was made and evaluates nothing.
- **Reader unavailable** — shows the machine reason, evaluates nothing.
- **Live** — shows registered sources, evaluated/admitted/denied counts, a
  per-publisher table, and every evaluated headline with its decision and
  reason. Titles link to the publisher; nothing is written.

Verified with the production reader enabled on 2026-10-29: 0 of 5 sources
registered, 60 dated headlines evaluated, 0 admitted, 60 denied
(`NO_TRUSTED_SOURCE_REGISTERED`), zero Axe violations.

## Contracts

- `test/modules/CB-M03/live-intake.test.mjs` — empty registry denies every
  dated item, undated items are skipped, frozen output, flags false, a fixture
  rights reference admits only to `PRIVATE_REVIEW_ONLY`, a wrong path prefix is
  denied, and invalid snapshots/registries throw.
- `test/modules/CB-M03/live-intake-surface.test.mjs` — the page is gated by
  `PUBLIC_NEWS_LIVE`, escaped, has no form/script, and the model imports the
  canonical gate with no fetch or storage.
- `e2e/m03-live-news.spec.mjs` — with the reader off the page shows the closed
  state, makes no external request, has no item rows and passes Axe.
- `e2e/site-surfaces.spec.mjs` — the route keeps the shared demo invariants.

## What comes next

The next increment is a storage-backed private queue: persist admitted
candidates with their rights reference, expose them to the editorial CMS, and
record who admitted what and when. That requires an owner-approved rights
reference per source first; until then the gate must keep denying.
