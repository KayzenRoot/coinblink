# CB-M10-P1-EDITIONS-001 · newsletter editions from published articles

Status: the owner composes an edition from published articles and sends it once
to confirmed subscribers. Every message carries a fresh unsubscribe link, and
each send is recorded append-only.

## Compose

`/admin/editions` takes a subject (4–140 characters), an optional intro and a
locale, then lists the published articles of that locale. Only articles that are
`published` **and** in the chosen locale can enter the edition; up to eight are
kept, in the order chosen.

A saved edition is a draft. Nothing is sent until the owner presses Send.

## Send

`sendEdition`:

1. Requires `RESEND_API_KEY` and `COINBLINK_EMAIL_FROM`; otherwise it fails
   closed with `not_configured`.
2. Refuses an edition that is already `sent`.
3. Iterates confirmed subscribers only, generating a **fresh unsubscribe token**
   per address and storing its digest, then emails the subject, the intro, each
   article's title, summary and canonical URL, and the unsubscribe link.
4. Records one `cms_newsletter_sends` row per address (`sent`/`failed`) and
   marks the edition `sent` with the delivered count.

A provider error for one address is recorded and the run continues; the edition
still becomes `sent` because a retry would duplicate the addresses that worked.

## Data

`migrations/0011_editions.sql` creates `cms_newsletter_editions` and
`cms_newsletter_sends`; the sends table is append-only through triggers.

## Verification

`test/modules/CB-M10/editions.test.mjs` covers locale/published filtering,
subject and article validation, the send loop with per-address tokens, the
single-send rule, per-address provider failure, the missing-settings path, the
owner screen and the route wiring.
