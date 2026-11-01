# CB-M08-P1-ARTICLE-DRAFT-001 · article drafted from the collection

Status: the owner enters a topic, Workers AI writes an **original** article with
citations to the collected headlines, and the result lands as a **draft** that
the owner reviews and publishes. Nothing is published automatically.

## Contract

- The prompt states the rules: original prose, never copy source sentences, do
  not invent numbers/dates/names, answer with a single JSON object.
- The answer must contain `title` (8–140), `summary` (20–400) and `body`
  (≥60 chars) plus `citations`.
- A citation is accepted only when its number exists in the supplied sources and
  the source URL is `https`. No accepted citation → `unverified_output` and
  nothing is saved.
- Malformed JSON or thin fields → `invalid_output`.
- The saved body ends with a `Sources: [n] source — url` line, and the first
  citation URL becomes the draft `sourceUrl`.
- The draft is created through the normal drafts module, so it appears in
  `/admin/articles` for review and publishing.

## Failure modes

`unavailable` (no AI binding or the model did not answer), `no_sources` (the
collection is empty), `invalid` (topic shorter than 3 characters). Each one
returns an explanatory message and saves nothing.

## Verification

`test/modules/CB-M08/article-draft.test.mjs` covers the prompt, a valid answer,
unknown and non-https citations, malformed and thin answers, the three failure
modes and the admin wiring.
