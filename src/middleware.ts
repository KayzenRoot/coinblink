import { defineMiddleware } from "astro:middleware";

const securityHeaders: ReadonlyArray<readonly [string, string]> = [
  // form-action also governs the redirect target of a form POST, so the Stripe
  // Checkout origin has to be allowed for /admin/billing/checkout to hand the
  // owner to Stripe. It is the only external origin in the policy.
  ["Content-Security-Policy", "default-src 'self'; base-uri 'self'; form-action 'self' https://checkout.stripe.com; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'self'; frame-src 'none'; worker-src 'none'"],
  ["Permissions-Policy", "accelerometer=(), browsing-topics=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"],
  ["Referrer-Policy", "no-referrer"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["X-Robots-Tag", "noindex, nofollow, noarchive"],
];

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);

  for (const [name, value] of securityHeaders) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
