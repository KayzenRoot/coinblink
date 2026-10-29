# CB-M03-P1-CROSS-COVERAGE-001 · which publishers carry the same story

Status: implemented. The live reader now shows, under a headline, the other
publishers that carried the same story.

## Why

A reader looking at one feed cannot tell whether a story is isolated or
covered everywhere. The reader already collects five keyless RSS feeds in one
snapshot; comparing their titles costs nothing and adds information that no
single feed has. The result is a reading aid, not an editorial product: no
classification, no model, no ranking of importance.

## Contract

`src/modules/CB-M03/live-clusters.mjs` is pure and offline:

- `tokenizeLiveTitle(title)` — folds accents, lowercases, drops function words
  from the shared `live-news-topics.mjs` list and removes a plain trailing
  plural `s`. Words ending in `ss`, `us`, `is` or `ies` keep their surface form,
  so the pass never invents a stem.
- `clusterLiveHeadlines(items, options)` — links two headlines when they share
  at least 4 significant title words **and** the overlap is at least half of
  the shorter title. Items without a usable `id`, `title`, `link` or `sourceId`,
  or with fewer than 4 significant words, are skipped. A cluster is emitted
  only when at least two distinct publishers are present. Output is frozen,
  ordered by publisher count, then recency, then id, and capped at 8 clusters.
- `buildCoverageIndex(clusters)` — headline id → cluster.
- `coverageOthers(cluster, itemId, limit)` — the other publishers in the same
  cluster, one link per publisher, newest first, capped at 4.

No network, no storage, no clock. The keywords are visible in the page copy:
coverage is mechanical and the publishers' text is never merged or rewritten.

## Rendering

`LiveNewsPanel.astro` clusters the **whole** snapshot, before the reader's
filters, so narrowing by query, publisher or window never changes what a
headline's coverage says. Each visible headline in a cluster gains one line:

```text
Also covered by: The Block, Decrypt
```

Every name links to that publisher's article. The list stays server-rendered;
no client JavaScript is added and no extra request is made. The explanatory
note appears only when at least one visible headline has coverage.

Localization lives in `live-news-copy.mjs` as two key-major rows
(`alsoCovered`, `coverageNote`) in en, pt-br and es.

## Most covered now

The same clusters feed a highlight section above the list: up to three stories
carried by at least two publishers, ordered by publisher count and then
recency. Each shows the newest headline linked to its article and one link per
publisher. The section is computed from the whole collection, so it does not
shrink when the reader filters the list, and it is absent when no story has
more than one publisher.

`topCoverageClusters(clusters, limit)` and `coveragePublishers(cluster)` live in
the same pure module; the highlight uses no additional data or request.

## Coverage page

`/{locale}/news/coverage` is the shareable home of the feature. It reads the
same gated snapshot, clusters it with the same module and lists every group
(capped at 8) with the newest headline, the publisher count, the relative time
and one link per publisher. When the collection has no multi-source story it
renders an explicit empty state; when live news is disabled it makes no
request and explains the gate, exactly like the reader. The live page's
highlight links here with the number of covered stories.

Routes: `src/pages/{en,pt-br,es}/news/coverage.astro`, each a thin wrapper over
`CoveragePage.astro`. Copy lives in the same key-major table
(`coveragePageTitle`, `coveragePageDescription`, `coverageH1`, `coverageIntro`,
`coverageMeta`, `coverageEmpty`, `coverageAll`, `coverageLiveLink`,
`coverageFilterTitle`, `coverageFilterNote`, `coverageFilteredEmpty`).

The page accepts two server-rendered filters: `?since=<reviewed window>` narrows
the pool before clustering, and `?source=<reviewed publisher>` keeps the whole
story while showing only groups that include that publisher. Selecting a
publisher therefore never hides the other publishers that carried the same
story. Filter state is linkable and shareable, and a filtered empty result has
its own message. The publisher page links here with `?source=<id>`.

## Publisher pages

`/{locale}/news/source/{id}` clusters the same snapshot before narrowing to
that publisher, then annotates each listed headline with the other publishers
that carried it, using the same `alsoCovered` copy row. The section also links
to the full coverage page with the cluster count. The publisher's own list is
unchanged: only items from the chosen publisher appear, and the annotation
adds links to the other publishers' articles.

## Boundaries

- Coverage is computed from titles only. Excerpts are ignored so publisher
  boilerplate cannot create matches.
- A story covered by a single publisher produces no annotation, and a
  same-publisher duplicate never counts as coverage.
- Clustering is single-linkage inside one 15-minute snapshot, so a third
  headline similar to either side of a pair can join the same cluster. The
  conservative thresholds and the 8-cluster cap bound the result.
- Nothing is persisted and nothing is attributed to CoinBlink; every link goes
  to the publisher's original article.

## Verification

- `test/modules/CB-M03/live-clusters.test.mjs` — tokenization, matching,
  publisher separation, ordering, caps, malformed input, frozen output and
  input-order independence.
- `test/modules/CB-M03/live-news-surface.test.mjs` — the panel clusters before
  filtering, renders `data-m03-live-coverage`, links each publisher and keeps
  the module offline.
- `test/modules/CB-M03/live-news-copy.test.mjs` — both new rows exist and are
  translated in all three locales.
