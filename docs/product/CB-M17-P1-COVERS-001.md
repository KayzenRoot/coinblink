# CB-M17-P1-COVERS-001 · deterministic editorial cover

Status: every published article has a branded 1200×630 cover drawn from its own
title, tags and locale. No external image provider, no storage, no claim of
photography.

## Why deterministic

The first M17 slice had to be honest and cheap: generating or licensing imagery
needs a provider decision, so the cover is drawn from data the article already
has. The same article always renders the same image, which keeps caches and
social previews stable.

## Contract

- `GET /article-cover/{locale}/{slug}.svg` reads the published article; an
  unknown or unpublished slug answers **404**.
- Title wrapped into at most three lines of 26 characters, truncated with `…`
  when longer; all text is XML-escaped.
- Brand palette from the home page, `image/svg+xml`, `max-age=86400` and
  `s-maxage=604800`.
- The article page renders it with `width="1200" height="630"`, `alt=""`
  (decorative, since the title is next to it) and eager decoding.

## Not yet

- No photography, illustration or video generation: that needs a provider and a
  rights decision.
- No per-article artwork choice.

## Verification

`test/modules/CB-M17/covers.test.mjs` covers the published-only rule, the
dimensions, the escaping, the truncation, the cache headers and the article
wiring in the three locales.
