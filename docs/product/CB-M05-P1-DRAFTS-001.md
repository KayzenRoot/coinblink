# CB-M05-P1-DRAFTS-001 · owner draft workspace

Status: implemented. The authenticated owner can create, edit, version and
export private drafts. Nothing is published, scheduled or rights-cleared.

## Routes

| Route | Behaviour |
|---|---|
| `GET /admin/drafts` | Lists the owner's drafts with revision and status. |
| `GET /admin/drafts/new` | New-draft form. |
| `POST /admin/drafts` | Validates, creates the draft and its revision 1 in one batch. |
| `GET /admin/drafts/{id}` | Edit form for the current revision. |
| `POST /admin/drafts/{id}` | Revision-CAS update plus an append-only revision row. |
| `GET /admin/drafts/{id}/revisions` | Immutable revision list. |
| `GET /admin/drafts/{id}/export` | Markdown attachment marked `DRAFT — NOT PUBLISHED`. |

Every route requires the owner session; writes also require the form CSRF value
issued at login. A stale revision returns a conflict instead of overwriting.

## Limits

Title 8–140 characters, summary 20–400, body up to 40,000, author label up to
120, source URL must be HTTPS. The database status is always `draft`; there is
no publish button, public projection or scheduling in this increment.

## Verification

`test/modules/CB-M05/production-drafts.test.mjs` covers validation, Markdown,
the create/update batch contract, revision conflict, page rendering and the
absence of any publish action. The admin e2e adds `/admin/drafts` to the
anonymous 404 guard.
