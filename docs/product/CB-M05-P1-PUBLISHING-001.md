# CB-M05-P1-PUBLISHING-001 · publish an owner draft as a public article

Status: owner drafts can be published to `/{locale}/article/{slug}`, listed in
`/admin/articles` and served as metadata by `/v1/articles`. Only text the owner
wrote is published; feed text never enters this table.

## Publish

`publishDraft` snapshots the draft's current revision into `cms_articles`:

- `locale` must be `en`, `pt-br` or `es`.
- The slug is derived from the title (ascii, 3–80 chars) and made unique per
  locale by suffixing `-2`, `-3`, … on collision.
- A provenance note of at least 10 characters is required; it renders on the
  article page.
- Tags are normalized to at most six lowercase tags.
- Publishing the same draft again updates the row, bumps `revision` and appends
  a new immutable row to `cms_article_revisions` (triggers refuse update and
  delete).

## Unpublish

`unpublishArticle` flips `status` to `unpublished` and keeps the row, so the
public page answers **410** instead of silently becoming a 404. The owner can
publish again from the same draft.

## Public page

`/{locale}/article/{slug}` renders title, summary, body paragraphs, tags, the
provenance note and the source link. The page is `noindex` like the rest of the
site until the launch gate opens. Unknown slugs answer 404.

## API

`GET /v1/articles` (API key, metered, same plans as `/v1/status`) returns
metadata only: `id`, `locale`, `slug`, `title`, `summary`, `tags`, `author`,
`publishedAt`, `updatedAt`, `canonical`, `sourceUrl`. The body is never served,
and the contract states `redistribution: false`.

## Data

`migrations/0010_articles.sql` creates `cms_articles` and
`cms_article_revisions`.

## Verification

`test/modules/CB-M05/articles.test.mjs` covers slug and tag normalization, the
publish snapshot, refusals (missing draft, bad locale, thin provenance),
republishing with a revision bump, unpublish keeping the row for 410, the owner
screen and the public page plus API contract.
