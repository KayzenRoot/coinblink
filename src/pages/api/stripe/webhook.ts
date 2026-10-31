// CB-M12-P1-BILLING-001: Stripe webhook with signature verification.
//
// The route is public but authenticated by the Stripe-Signature HMAC. Only
// test-mode keys are accepted by the billing module. No card data is stored.
import type { APIRoute } from "astro";
import { handleStripeEvent, readBillingConfig, verifyStripeSignature } from "../../../modules/CB-M12/billing.mjs";
import { recordOpsEvent } from "../../../modules/CB-M14/ops-events.mjs";
import { notifyEvent } from "../../../modules/CB-M14/alert-email.mjs";
import { runtimeBinding, runtimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

const KEYS = [
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_MONTHLY",
  "STRIPE_PRICE_YEARLY", "COINBLINK_TEST_EMAIL", "RESEND_API_KEY",
  "COINBLINK_EMAIL_FROM",
];

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  if (db === undefined || db === null || typeof secret !== "string") return json(503, { error: "not_configured" });
  const env = Object.fromEntries(KEYS.map((key) => [key, runtimeEnv(key)]));
  const config = await readBillingConfig({ db, secret, env });
  if (config.webhookSecret === null) return json(503, { error: "not_configured" });
  const payload = await request.text();
  if (payload.length === 0 || payload.length > 256_000) return json(413, { error: "payload" });
  const valid = await verifyStripeSignature({
    payload, header: request.headers.get("stripe-signature") ?? "",
    secret: config.webhookSecret, nowMs: Date.now(),
  });
  if (!valid) {
    const nowMs = Date.now();
    await recordOpsEvent({ db, type: "webhook_invalid_signature", detail: "rejected by signature check", nowMs });
    await notifyEvent({ db, secret, env, type: "webhook_invalid_signature", detail: "rejected by signature check", nowMs });
    return json(400, { error: "invalid_signature" });
  }
  let event: unknown;
  try {
    event = JSON.parse(payload);
  } catch {
    const nowMs = Date.now();
    await recordOpsEvent({ db, type: "webhook_invalid_event", detail: "invalid json", nowMs });
    await notifyEvent({ db, secret, env, type: "webhook_invalid_event", detail: "invalid json", nowMs });
    return json(400, { error: "invalid_json" });
  }
  const result = await handleStripeEvent({ db, event, nowMs: Date.now() });
  if (result.status === "invalid") {
    const nowMs = Date.now();
    await recordOpsEvent({ db, type: "webhook_invalid_event", detail: "unknown or malformed event", nowMs });
    await notifyEvent({ db, secret, env, type: "webhook_invalid_event", detail: "unknown or malformed event", nowMs });
    return json(400, { error: "invalid_event" });
  }
  return json(200, { received: true, duplicate: result.status === "duplicate" });
};

export const ALL: APIRoute = () => json(405, { error: "method_not_allowed" });
