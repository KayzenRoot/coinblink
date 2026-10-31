// CB-M10-P1-NEWSLETTER-001: confirmation landing page.
//
// The token in the link is the only credential; a wrong or reused token gets a
// neutral page instead of an error that would confirm the address exists.
import type { APIRoute } from "astro";
import { confirm, unsubscribe } from "../../modules/CB-M10/newsletter.mjs";
import { runtimeBinding } from "../../lib/runtime-env";

export const prerender = false;

const MESSAGES: Record<string, string> = {
  confirmed: "Subscription confirmed. You will receive the next CoinBlink digest.",
  unsubscribed: "You are off the list. Nothing else will be sent.",
  unknown: "This link is no longer valid. Request a new one from the site.",
  unavailable: "The list is temporarily unavailable. Try again later.",
};

function page(status: string): Response {
  const message = MESSAGES[status] ?? MESSAGES.unknown;
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="robots" content="noindex, nofollow, noarchive">'
    + '<title>CoinBlink · newsletter</title>'
    + '<link rel="stylesheet" href="/admin.css"></head><body><main class="admin">'
    + '<p class="admin__tag">CB-M10 · NEWSLETTER</p>'
    + '<h1>CoinBlink</h1><p>' + message + '</p>'
    + '<p><a href="/en">Back to CoinBlink</a></p></main></body></html>';
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "content-security-policy": "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const db = runtimeBinding("CMS_DB");
  if (db === undefined || db === null) return page("unavailable");
  const token = url.searchParams.get("token") ?? "";
  const action = url.searchParams.get("action") ?? "confirm";
  const result = action === "unsubscribe"
    ? await unsubscribe({ db, token, nowMs: Date.now() })
    : await confirm({ db, token, nowMs: Date.now() });
  return page(result.status);
};

export const ALL: APIRoute = () => page("unknown");
