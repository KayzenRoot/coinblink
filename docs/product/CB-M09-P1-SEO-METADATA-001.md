# CB-M09-P1-SEO-METADATA-001 | Locale registry and demo-safe metadata

## Scope, authority and frozen base
- One bounded increment of the **M09 P1** scope, which the roadmap describes as "en/pt-br/es and SEO metadata". Issue #16 and the wider M09 work stay PLANNED / NOT ADMITTED beyond this slice.
- Main base `f96ad375d7e71beff0372d12eb63fcacada0a9dd`. Isolated branch `feat/cb-m09-p1-seo-metadata-001`.
- Owned files: the M09 locale model, `src/layouts/BaseLayout.astro`, Node contracts, a browser spec, a read-only workflow, this document and the Evidence Bundle.

## Why this slice needs no external input
- It is the only P1 item whose scope is pure server rendering: no market data, no feeds, no media provider, no billing, no real accounts and no deployment. Every module that needs a live provider is left for a decision that belongs to the owner.

## What it adds
- **A single locale registry** (`site-locales.mjs`): `en`, `pt-br`, `es`, with explicit mappings between the layout's BCP-47 prop (`pt-BR`), the site locale slug (`pt-br`) and the Open Graph locale (`pt_BR`).
- **Language alternates derived from the current path.** `localeSiblings` returns one path per locale for localized routes and `null` for everything else, so a demo lab never claims hreflang alternates that do not exist. Trailing-slash and unknown-prefix paths are refused.
- **Absolute metadata only when a real origin exists.** With `PUBLIC_SITE_ORIGIN` unset the build emits no `canonical`, no `hreflang`, no `og:url`; a malformed origin (`http://`, trailing slash, wrong shape) throws instead of silently producing a wrong URL. This is what keeps a DEMO build from inventing a production URL.
- **Open Graph and Twitter card metadata** on every page that uses the layout, with `og:title` exactly the document title and `og:locale` per language.
- `robots` gains a single source of truth (`noindex, nofollow, noarchive`) instead of a literal in the layout.

## Boundaries that do not change
- The site stays **noindex** and unpublished. This increment adds metadata correctness, not indexability, and it does not deploy anything.
- The demo labs stay English-only by design, as the journey documentation already states; they are correctly reported as non-localized so they never advertise alternates.
- `src/pages/layouts` behaviour for existing pages is unchanged: the layout prop signature and the rendered content stay the same, with additional `head` metadata only.

## Mandatory proof and STOP
- Local proof: Node contracts for the model and the shipped layout, `npm run lint`, `npm run typecheck`, `npm run build`, the M09 browser spec plus the existing Spanish news regression, and the full browser suite because the layout is shared by 22 files.
- STOP: PR remains Draft. Never Ready, merge, deploy, publish, index, or configure a production origin inside this increment.
