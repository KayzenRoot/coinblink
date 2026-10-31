// CB-M10-P1-NEWSLETTER-001: public subscribe endpoint.
//
// Always answers the same way for a well-formed address, so the response never
// reveals whether the address was already on the list. The confirmation token
// travels only by email.
import type { APIRoute } from "astro";
import { subscribe } from "../../../modules/CB-M10/newsletter.mjs";
import { sendEmail } from "../../../modules/CB-M10/resend.mjs";
import { recordOpsEvent } from "../../../modules/CB-M14/ops-events.mjs";
import { notifyEvent } from "../../../modules/CB-M14/alert-email.mjs";
import { getSetting } from "../../../modules/CB-M05/p1-production/settings.mjs";
import { runtimeBinding, runtimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-robots-tag": "noindex",
};

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

async function readInput(request: Request): Promise<{ email: string; locale: string }> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    return { email: String(body?.email ?? ""), locale: String(body?.locale ?? "") };
  }
  const form = await request.formData().catch(() => null);
  return { email: String(form?.get("email") ?? ""), locale: String(form?.get("locale") ?? "") };
}

export const POST: APIRoute = async ({ request, url }) => {
  const db = runtimeBinding("CMS_DB");
  const secret = runtimeEnv("M05_SESSION_SECRET");
  if (db === undefined || db === null || typeof secret !== "string") return reply(503, { status: "unavailable" });
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 4096) return reply(413, { status: "too_large" });
  const input = await readInput(request);
  const result = await subscribe({ db, email: input.email, locale: input.locale, nowMs: Date.now() });
  if (result.status === "invalid") return reply(400, { status: "invalid_email" });
  if (result.status === "created") {
    const integrations = Object.fromEntries(
      ["RESEND_API_KEY", "COINBLINK_EMAIL_FROM"].map((key) => [key, runtimeEnv(key)]),
    );
    const apiKey = await getSetting({ db, secret, env: integrations, key: "RESEND_API_KEY" });
    const from = await getSetting({ db, secret, env: integrations, key: "COINBLINK_EMAIL_FROM" });
    if (typeof apiKey === "string" && typeof from === "string") {
      const link = new URL("/newsletter/confirm?token=" + result.token, url.origin).toString();
      try {
        await sendEmail({
          apiKey, from, to: result.email, subject: "Confirm your CoinBlink subscription",
          text: "Open this link to confirm your subscription:\n\n" + link
            + "\n\nIf you did not ask for this, ignore the message.",
        });
      } catch {
        const nowMs = Date.now();
        await recordOpsEvent({ db, type: "email_failed", detail: "newsletter confirmation", nowMs });
        await notifyEvent({
          db, secret, env: integrations, type: "email_failed",
          detail: "newsletter confirmation", nowMs,
        });
      }
    }
  }
  return reply(202, { status: "accepted" });
};

export const ALL: APIRoute = () => reply(405, { status: "method_not_allowed" });
