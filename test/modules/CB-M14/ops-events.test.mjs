import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EVENT_TYPES, alertsSection, buildAlerts, countOpsEvents, keysNearQuota, listOpsEvents,
  recordOpsEvent,
} from '../../../src/modules/CB-M14/ops-events.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);

function fakeDb() {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      const bind = (...args) => ({
        async run() {
          if (sql.startsWith('INSERT INTO cms_ops_events')) {
            rows.push({ type: args[0], detail: args[1], createdAt: args[2] });
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
        async first() {
          const since = args[0];
          return { total: rows.filter((row) => row.createdAt >= since).length };
        },
        async all() {
          return { results: [...rows].reverse().slice(0, args[0]) };
        },
      });
      return { bind };
    },
  };
}

test('only allowlisted event types are written and details are flattened', async () => {
  const db = fakeDb();
  assert.equal(await recordOpsEvent({ db, type: 'webhook_invalid_signature', detail: 'a\nb', nowMs: NOW }), true);
  assert.equal(db.rows[0].detail, 'a b');
  assert.equal(await recordOpsEvent({ db, type: 'made_up', nowMs: NOW }), false);
  assert.equal(db.rows.length, 1);
  const long = 'x'.repeat(500);
  await recordOpsEvent({ db, type: 'email_failed', detail: long, nowMs: NOW });
  assert.equal(db.rows[1].detail.length, 200);
  assert.deepEqual(EVENT_TYPES.includes('research_failed'), true);
});

test('events are listed newest first and counted inside the window', async () => {
  const db = fakeDb();
  await recordOpsEvent({ db, type: 'webhook_invalid_signature', detail: 'old', nowMs: NOW - 2 * 86_400_000 });
  await recordOpsEvent({ db, type: 'webhook_invalid_event', detail: 'new', nowMs: NOW });
  const events = await listOpsEvents({ db });
  assert.equal(events[0].detail, 'new');
  assert.equal(await countOpsEvents({ db, nowMs: NOW }), 1);
  assert.equal(await countOpsEvents({ db, nowMs: NOW, windowSeconds: 3 * 86_400 }), 2);
});

test('alerts carry the measurement that raised them', () => {
  const alerts = buildAlerts({
    subscription: { status: 'past_due' },
    quotaNear: [{ keyId: 'a'.repeat(16), label: 'Partner', calls: 1000, limit: 1000 }],
    eventsLastDay: 2,
    research: { used: 20, cap: 20 },
    nowMs: NOW,
  });
  const ids = alerts.map((alert) => alert.id);
  assert.deepEqual(ids, ['billing-status', 'ops-events', 'quota-' + 'a'.repeat(16), 'research-cap']);
  assert.equal(alerts[0].severity, 'critical');
  assert.match(alerts[0].text, /past_due/u);
  assert.equal(alerts[2].severity, 'critical');
  assert.equal(buildAlerts({
    subscription: { status: 'active' }, quotaNear: [], eventsLastDay: 0, research: { used: 0, cap: 20 }, nowMs: NOW,
  }).length, 0);
  assert.equal(buildAlerts({
    subscription: null, quotaNear: [], eventsLastDay: 0, research: { used: 0, cap: 20 }, nowMs: NOW,
  })[0].id, 'billing-missing');
});

test('only live keys at 90% or more are near quota, worst first', () => {
  const keys = [
    { keyId: 'a'.repeat(16), label: 'A', calls: 900, limit: 1000, revokedAt: null },
    { keyId: 'b'.repeat(16), label: 'B', calls: 1000, limit: 1000, revokedAt: null },
    { keyId: 'c'.repeat(16), label: 'C', calls: 100, limit: 1000, revokedAt: null },
    { keyId: 'd'.repeat(16), label: 'D', calls: 990, limit: 1000, revokedAt: 1 },
  ];
  const near = keysNearQuota(keys);
  assert.deepEqual(near.map((key) => key.label), ['B', 'A']);
});

test('the alerts section renders both states without scripts', () => {
  const empty = alertsSection({ alerts: [], events: [] });
  assert.match(empty, /No alerts/u);
  assert.match(empty, /No operational events recorded/u);
  const filled = alertsSection({
    alerts: [{ severity: 'critical', text: 'Subscription status is past_due.' }],
    events: [{ type: 'webhook_invalid_signature', detail: 'rejected', createdAt: 1_800_000_000 }],
  });
  assert.match(filled, /admin__alert--critical/u);
  assert.match(filled, /webhook_invalid_signature/u);
  assert.doesNotMatch(filled, /<script/iu);
});

test('the webhook records the failures it already rejects', () => {
  const webhook = readFileSync('src/pages/api/stripe/webhook.ts', 'utf8');
  for (const marker of ['webhook_invalid_signature', 'webhook_invalid_event', 'recordOpsEvent']) {
    assert.ok(webhook.includes(marker), marker);
  }
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ['alertsSection', 'buildAlerts', 'keysNearQuota', 'countOpsEvents']) {
    assert.ok(route.includes(marker), marker);
  }
});
