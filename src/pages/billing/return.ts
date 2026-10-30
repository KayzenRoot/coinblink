// CB-M12-P1-BILLING-001: same-origin landing after Stripe Checkout.
//
// The owner cookie is SameSite=Strict. A redirect chain that starts at
// checkout.stripe.com stays cross-site for the whole chain, so a 303 back to
// /admin/billing would arrive without the session and 404. This endpoint
// answers with a tiny document instead; the meta refresh and the visible link
// are new navigations started by our own origin, which do carry the cookie.
import type { APIRoute } from "astro";

export const prerender = false;

const OUTCOMES = new Map([
  ["success", "Payment completed. Stripe confirms the subscription through the webhook."],
  ["cancelled", "Checkout cancelled. Nothing was charged."],
]);

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function landing(message: string, target: string): Response {
  const href = escapeHtml(target);
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="robots" content="noindex, nofollow, noarchive">'
    + '<meta http-equiv="refresh" content="0;url=' + href + '">'
    + '<title>CoinBlink · billing</title>'
    + '<link rel="stylesheet" href="/admin.css"></head><body><main class="admin">'
    + '<p class="admin__tag">CB-M12 · STRIPE TEST MODE</p>'
    + '<h1>Billing</h1>'
    + '<p>' + escapeHtml(message) + '</p>'
    + '<p><a href="' + href + '">Continue to the billing page</a></p>'
    + '</main></body></html>';
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

export const GET: APIRoute = ({ url }) => {
  const outcome = url.searchParams.get("status") ?? "";
  const message = OUTCOMES.get(outcome) ?? "Return to the billing page.";
  const target = OUTCOMES.has(outcome) ? "/admin/billing?checkout=" + outcome : "/admin/billing";
  return landing(message, target);
};

export const ALL: APIRoute = () => landing("Return to the billing page.", "/admin/billing");
