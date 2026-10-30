# CB-M08-P1-RESEARCH-001 · owner-only AI research desk

Status: implemented. The owner can ask Workers AI for a structured analysis of
one private draft. The note is stored only when every quoted piece of evidence
appears verbatim in that draft. Nothing is published, scheduled or sent to
another service.

## Flow

| Route | Behaviour |
|---|---|
| `GET /admin/research` | Lists drafts, the daily usage and the latest notes. |
| `POST /admin/research` | Reads the selected draft, calls Workers AI and stores the verified note. |
| `GET /admin/research/{id}` | Shows summary, impact, editor questions and evidence. |

Every route requires the owner session; the POST also requires the form CSRF
value issued at login. An unknown draft or note is an indistinguishable 404.

## Model and limits

- Model: `@cf/meta/llama-3.1-8b-instruct-fp8` through the `AI` binding (checked
  against the account's model catalog). The Worker accepts `M08_MODEL` only
  when it matches `@cf/<vendor>/<model>`.
- At most 20 notes per owner per UTC day. The cap is checked before the model
  is called.
- The prompt contains only title, summary and body (6,000 characters maximum)
  plus an optional 400-character editor focus.
- The answer must be strict JSON: summary, impact, three questions and two to
  five evidence items. Output is capped at 700 tokens and temperature 0.2.

## Evidence guard

`parseResearchOutput` rejects a malformed shape instead of repairing it.
`verifyEvidence` normalizes whitespace and keeps a quote only when it is a
substring of the draft; duplicates and invented quotes are dropped, and a note
with no surviving quote is never written. The stored quote is the verified
draft text, not the model's copy.

## Data

`migrations/0003_research.sql` creates `cms_research_notes` with the draft id and
revision, model, language, focus, input digest, JSON output and creation time.
Update and delete triggers keep the table append-only.

The research desk does not read the web, does not call any provider other than
Workers AI and does not expose a public route. Publishing, billing and customer
data remain disabled.

## Verification

`test/modules/CB-M08/research.test.mjs` covers prompt bounds, strict parsing,
verbatim evidence, the daily cap, fail-closed paths, page rendering, the route
wiring and the reviewed `AI` binding. `/admin/research` is in the anonymous 404
guard.
