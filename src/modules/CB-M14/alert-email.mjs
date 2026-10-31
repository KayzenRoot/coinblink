// CB-M14-P1-ALERTS-001: email delivery for operational events.
//
// The first event of a type inside the window is emailed to the owner address;
// repeats are only recorded. Delivery is best effort: a failure never turns a
// rejected request into a different response.

import { sendEmail } from '../CB-M10/resend.mjs';
import { getSetting } from '../CB-M05/p1-production/settings.mjs';

export const ALERT_WINDOW_SECONDS = 3_600;

const SUBJECTS = Object.freeze({
  webhook_invalid_signature: 'CoinBlink alert · Stripe webhook rejected',
  webhook_invalid_event: 'CoinBlink alert · Stripe webhook payload rejected',
  research_failed: 'CoinBlink alert · research generation failed',
  email_failed: 'CoinBlink alert · email delivery failed',
});

/** True only for the first event of this type inside the window. */
export async function isFirstInWindow({ db, type, nowMs, windowSeconds = ALERT_WINDOW_SECONDS }) {
  const since = Math.floor(nowMs / 1000) - windowSeconds;
  const row = await db.prepare(
    'SELECT COUNT(*) AS total FROM cms_ops_events WHERE type = ? AND created_at >= ?',
  ).bind(type, since).first();
  return Number(row?.total ?? 0) <= 1;
}

/**
 * Emails the owner about an event already recorded. Returns `sent`, `throttled`,
 * `not_configured` or `failed`; never throws.
 */
export async function notifyEvent({
  db, secret, env, type, detail = '', nowMs = Date.now(), fetchImpl = globalThis.fetch,
}) {
  if (!SUBJECTS[type]) return Object.freeze({ status: 'unknown_type' });
  try {
    if (!(await isFirstInWindow({ db, type, nowMs }))) return Object.freeze({ status: 'throttled' });
    const apiKey = await getSetting({ db, secret, env, key: 'RESEND_API_KEY' });
    const from = await getSetting({ db, secret, env, key: 'COINBLINK_EMAIL_FROM' });
    const to = await getSetting({ db, secret, env, key: 'COINBLINK_TEST_EMAIL' });
    if (typeof apiKey !== 'string' || typeof from !== 'string' || typeof to !== 'string') {
      return Object.freeze({ status: 'not_configured' });
    }
    const result = await sendEmail({
      fetchImpl, apiKey, from, to, subject: SUBJECTS[type],
      text: 'Event: ' + type + '\nWhen: ' + new Date(nowMs).toISOString()
        + (detail === '' ? '' : '\nDetail: ' + detail)
        + '\n\nOpen /admin/ops for the measured state.',
    });
    return Object.freeze({ status: result?.status === 'sent' ? 'sent' : 'failed' });
  } catch {
    return Object.freeze({ status: 'failed' });
  }
}
