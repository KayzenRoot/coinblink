import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALERT_WINDOW_SECONDS, isFirstInWindow, notifyEvent } from '../../../src/modules/CB-M14/alert-email.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const ENV = {
  RESEND_API_KEY: ['re', 'test', '12345678'].join('_'),
  COINBLINK_EMAIL_FROM: 'CoinBlink <news@nexlabs.company>',
  COINBLINK_TEST_EMAIL: 'founder@nexlabs.company',
};

function fakeDb(events = []) {
  return {
    events,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_ops_events')) {
            const [type, since] = args;
            return { total: events.filter((row) => row.type === type && row.at >= since).length };
          }
          if (sql.includes('FROM cms_settings')) return null;
          return null;
        },
      });
      return { bind };
    },
  };
}

test('only the first event of a type inside the window notifies', async () => {
  const db = fakeDb([{ type: 'webhook_invalid_signature', at: Math.floor(NOW / 1000) }]);
  assert.equal(await isFirstInWindow({ db, type: 'webhook_invalid_signature', nowMs: NOW }), true);
  db.events.push({ type: 'webhook_invalid_signature', at: Math.floor(NOW / 1000) });
  assert.equal(await isFirstInWindow({ db, type: 'webhook_invalid_signature', nowMs: NOW }), false);
  assert.equal(ALERT_WINDOW_SECONDS, 3600);
});

test('the owner is emailed once, with the event and the detail', async () => {
  const db = fakeDb([{ type: 'webhook_invalid_event', at: Math.floor(NOW / 1000) }]);
  const seen = [];
  const result = await notifyEvent({
    db, secret: 'a'.repeat(64), env: ENV, type: 'webhook_invalid_event',
    detail: 'invalid json', nowMs: NOW,
    fetchImpl: async (url, options) => {
      seen.push({ url, body: JSON.parse(options.body) });
      return new Response(JSON.stringify({ id: 'email_1' }), { status: 200 });
    },
  });
  assert.equal(result.status, 'sent');
  assert.equal(seen[0].url, 'https://api.resend.com/emails');
  assert.equal(seen[0].body.to[0], 'founder@nexlabs.company');
  assert.match(seen[0].body.subject, /Stripe webhook payload rejected/u);
  assert.match(seen[0].body.text, /invalid json/u);
});

test('repeats are throttled and missing settings are not an error', async () => {
  const db = fakeDb([
    { type: 'webhook_invalid_signature', at: Math.floor(NOW / 1000) },
    { type: 'webhook_invalid_signature', at: Math.floor(NOW / 1000) },
  ]);
  const result = await notifyEvent({ db, secret: 'a'.repeat(64), env: ENV, type: 'webhook_invalid_signature', nowMs: NOW });
  assert.equal(result.status, 'throttled');
  const empty = fakeDb([]);
  const notConfigured = await notifyEvent({ db: empty, secret: 'a'.repeat(64), env: {}, type: 'webhook_invalid_signature', nowMs: NOW });
  assert.equal(notConfigured.status, 'not_configured');
  assert.equal((await notifyEvent({ db: empty, secret: 'a'.repeat(64), env: ENV, type: 'nope', nowMs: NOW })).status, 'unknown_type');
});

test('a provider failure is reported as failed and never throws', async () => {
  const db = fakeDb([]);
  const result = await notifyEvent({
    db, secret: 'a'.repeat(64), env: ENV, type: 'email_failed', nowMs: NOW,
    fetchImpl: async () => new Response('nope', { status: 500 }),
  });
  assert.equal(result.status, 'failed');
  const thrown = await notifyEvent({
    db, secret: 'a'.repeat(64), env: ENV, type: 'email_failed', nowMs: NOW,
    fetchImpl: async () => { throw new Error('network'); },
  });
  assert.equal(thrown.status, 'failed');
});

test('the webhook notifies after recording, for both rejection paths', () => {
  const webhook = readFileSync('src/pages/api/stripe/webhook.ts', 'utf8');
  assert.equal((webhook.match(/notifyEvent\(/gu) ?? []).length >= 3, true);
  assert.ok(webhook.includes('RESEND_API_KEY'));
  assert.ok(webhook.includes('COINBLINK_EMAIL_FROM'));
});
