// CB-M10-P1-RESEND-001: minimal Resend adapter for the owner test send.
//
// The API key is read from the owner settings store (or the Worker environment)
// and never logged or rendered. This increment sends one test message; it does
// not collect subscribers, schedule digests or publish anything.
import { getSetting, recordSettingsAudit } from '../CB-M05/p1-production/settings.mjs';

export const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u;

export async function sendEmail({ fetchImpl = globalThis.fetch, apiKey, from, to, subject, text }) {
  if (typeof apiKey !== 'string' || !/^re_[A-Za-z0-9_-]{8,128}$/u.test(apiKey)) throw new TypeError('apiKey is required');
  if (typeof from !== 'string' || from.trim() === '' || from.length > 200) throw new TypeError('from is required');
  if (typeof to !== 'string' || !EMAIL.test(to)) throw new TypeError('to must be an email address');
  if (typeof subject !== 'string' || subject.trim() === '' || subject.length > 200) throw new TypeError('subject is required');
  if (typeof text !== 'string' || text.length > 10_000) throw new TypeError('text is invalid');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  let response;
  try {
    response = await fetchImpl(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ from: from.trim(), to: [to], subject: subject.trim(), text }),
    });
  } catch {
    return Object.freeze({ status: 'failed', statusCode: 0, name: 'network_error', message: 'The provider could not be reached.' });
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    return Object.freeze({
      status: 'failed',
      statusCode: response.status,
      name: typeof payload?.name === 'string' ? payload.name : 'provider_error',
      message: typeof payload?.message === 'string' ? payload.message.slice(0, 500) : 'The provider rejected the message.',
    });
  }
  return Object.freeze({ status: 'sent', id: typeof payload?.id === 'string' ? payload.id : null });
}

export async function sendTestEmail({ db, secret, env, to, nowMs, fetchImpl }) {
  const apiKey = await getSetting({ db, secret, env, key: 'RESEND_API_KEY' });
  const from = await getSetting({ db, secret, env, key: 'COINBLINK_EMAIL_FROM' });
  const configured = await getSetting({ db, secret, env, key: 'COINBLINK_TEST_EMAIL' });
  const recipient = typeof to === 'string' && to.trim() !== '' ? to.trim() : (configured ?? '');
  const missing = [];
  if (apiKey === null) missing.push('RESEND_API_KEY');
  if (from === null) missing.push('COINBLINK_EMAIL_FROM');
  if (recipient === '') missing.push('COINBLINK_TEST_EMAIL');
  if (missing.length > 0) return Object.freeze({ status: 'not_configured', missing: Object.freeze(missing) });
  if (!EMAIL.test(recipient)) return Object.freeze({ status: 'invalid_recipient' });
  const result = await sendEmail({
    fetchImpl, apiKey, from, to: recipient, subject: 'CoinBlink test email',
    text: 'This is a test message from the CoinBlink owner settings panel. No publication or subscriber was created.',
  });
  await recordSettingsAudit({ db, key: 'RESEND_API_KEY', action: 'test_email', nowMs });
  return Object.freeze({ ...result, to: recipient });
}
