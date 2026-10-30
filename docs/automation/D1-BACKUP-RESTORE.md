# D1 backup and restore drill

Status: operational scripts and a real drill. The backup is local-only; the
restore is local-only.

## What a backup contains

`npm run d1:backup` exports the remote `coinblink-cms` database to
`.backups/coinblink-cms-<UTC>.sql` and writes a sibling manifest with the byte
size, SHA-256, table list and row counts for the owner, credentials, drafts,
revisions, pageviews, research notes and audit events.

The dump is sensitive even though it holds no secret: it contains WebAuthn
public keys, session and CSRF digests, private draft text, research notes and
aggregate pageviews. `.backups/` is gitignored. Never commit, paste or upload a
dump to public storage; encrypt it at rest if it leaves the owner's machine.

Wrangler prints a temporary signed download URL while exporting. The script
suppresses that output; do not run the raw export command in a shared terminal.

## Restore drill

`npm run d1:drill` takes the newest dump, verifies its SHA-256 against the
manifest, restores it into an isolated local D1 under
`.wrangler/d1-drill/<name>`, compares every counted table and proves that the
append-only triggers still abort an `UPDATE` on `cms_draft_revisions` and a
`DELETE` on `cms_research_notes`. It writes `<dump>.drill.json` with the result
and removes the temporary database.

The drill never connects to the remote database. A production restore is a
separate, approved operation: create or select the target D1, confirm it is the
intended database, restore during a maintenance window and re-run the owner
smoke checks. Never point a dump at the live database without that approval.

## Rotation

Keep at least one recent dump per week and one before every migration that
changes data. Delete older copies according to the owner's retention decision.
The manifest is enough to prove which dump was verified; it is not a backup by
itself.

## Verification

`test/scripts/d1-backup.test.mjs` covers the dump parser, the shape check, the
manifest hash, count comparison, path selection and the manifest check. The
first real drill matched all seven counted tables and both triggers.
