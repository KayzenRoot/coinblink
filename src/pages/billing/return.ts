// CB-M12-P1-BILLING-001: same-origin landing after Stripe Checkout.
//
// The owner cookie is SameSite=Strict, so the cross-site navigation coming from
// checkout.stripe.com carries no session. This endpoint is public and does
// nothing but redirect to /admin/billing; the follow-up navigation is
// same-site, so the authenticated page receives the cookie.
import type { APIRoute } from "astro";

export const prerender = false;

const OUTCOMES = new Set(["success", "cancelled"]);

function redirect(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: {
      location,
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

export const GET: APIRoute = ({ url }) => {
  const outcome = url.searchParams.get("status") ?? "";
  return redirect(OUTCOMES.has(outcome) ? "/admin/billing?checkout=" + outcome : "/admin/billing");
};

export const ALL: APIRoute = () => redirect("/admin/billing");
