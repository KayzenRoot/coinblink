# CB-M09-P1-ABOUT-001 · how CoinBlink works

Status: implemented. `/{locale}/about` explains, in the three site languages,
what is real, what is synthetic and what is deliberately disconnected.

## Why

The product shows real attributed headlines beside synthetic labs and a closed
editorial gate. A reader, editor or reviewer should be able to read the rules in
one place instead of inferring them from disclaimers. The page states deployment
facts, not marketing copy.

## Routes

```
/en/about
/pt-br/about
/es/about
```

Each page renders the shared `AboutPage.astro` with its locale copy. The live
page and the source directory link to it ("How this works →" / "Como funciona →"
/ "Cómo funciona →").

## Sections

- **Headlines** — five public RSS feeds; headline, short excerpt, time and
  outbound link; publisher language preserved; nothing stored, no full article.
- **Attribution and rights** — every headline names its publisher and links out;
  no republication and no rights reference for any source.
- **Cross-publisher coverage** — mechanical title matching notes the other
  publishers that carried a story; text is never merged and the public API
  exposes counts only.
- **Browser state** — saved searches and the since-your-last-visit marker stay
  in the browser, are not an account and are never sent; the language switch
  keeps the path and filters.
- **Editorial intake** — the private gate evaluates collected headlines and
  denies every candidate because no source has an owner-approved rights
  reference; nothing is queued, approved or published.
- **Synthetic content** — the fictional newsroom, market panels, research desk,
  newsletter, placements and editorial shell use invented examples.
- **What is not connected** — no accounts, payments, audience analytics,
  newsletter delivery or protected admin access; the market preview is off by
  default.
- **Links** — live headlines, source directory, covered stories, intake gate, developer sandbox,
  demo labs and home.

The page carries `noindex, nofollow, noarchive` like every demo surface and
makes no external request.

## Localization

`about-copy.mjs` is key-major with 24 strings per locale. Tests require identical
key sets, non-empty plain text (no `<`, `>` or `{`), translated substantive
sections, correct BCP-47 tags and English fallback without prototype access.

## Contracts

- `test/modules/CB-M09/about.test.mjs` — copy parity, translations, page/component
  wiring, links from the live page and source directory, fallback safety.
- `e2e/m09-about.spec.mjs` — three locales, `lang`, localized `h1`, back/live/
  sources/intake/developers links, robots, Axe, no external request, no page
  error, and a link back from each live page.
- The shared surfaces sweep (desktop and 390px) and the internal link crawl
  include the new routes; the deploy smoke checks `/en/about`.
