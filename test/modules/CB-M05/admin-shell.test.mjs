import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardPage, loginPage, page } from '../../../src/modules/CB-M05/p1-production/owner-auth.mjs';

const fakeDb = () => ({
  prepare(sql) {
    const read = async () => {
      if (sql.includes('COUNT(*) AS drafts')) return { drafts: 2 };
      return null;
    };
    const all = async () => ({
      results: [
        { credential_id: 'a'.repeat(24), device_kind: 'primary' },
        { credential_id: 'b'.repeat(24), device_kind: 'recovery' },
      ],
    });
    return { first: read, all, bind: () => ({ first: read, all, run: async () => ({ meta: { changes: 0 } }) }) };
  },
});

const STATS = {
  ops: { apiCalls: 12, notes: 3 },
  analytics: {
    total: 40,
    daily: [
      { day: '2026-10-31', views: 10 },
      { day: '2026-10-30', views: 5 },
    ],
  },
  counts: { confirmed: 1, pending: 0, unsubscribed: 0 },
  status: { subscription: { status: 'active' } },
  alerts: [{ severity: 'critical', text: 'Subscription status is past_due.' }],
  gates: { pass: 5, blocked: 2, manual: 3, ready: false },
  events: [{ type: 'webhook_invalid_signature', detail: 'rejected by signature check', createdAt: 1_800_000_000 }],
};

test('every admin page renders inside the persistent sidebar shell', async () => {
  const html = await page('Settings', '<p>body</p>').text();
  assert.match(html, /class="admin-shell"/u);
  assert.match(html, /class="admin-nav"/u);
  assert.match(html, /class="admin-main"/u);
  for (const href of ['/admin', '/admin/drafts', '/admin/analytics', '/admin/research', '/admin/newsletter',
    '/admin/social', '/admin/billing', '/admin/api', '/admin/ops', '/admin/launch', '/admin/settings', '/admin/security']) {
    assert.ok(html.includes('href="' + href + '"'), href);
  }
  assert.match(html, /action="\/admin\/logout"/u);
});

test('the current page is marked in the navigation', async () => {
  const html = await page('Operations', '<p>x</p>').text();
  assert.match(html, /href="\/admin\/ops"[^>]*aria-current="page"/u);
  const settings = await page('Settings', '<p>x</p>').text();
  assert.match(settings, /href="\/admin\/settings"[^>]*aria-current="page"/u);
  assert.doesNotMatch(settings, /href="\/admin\/ops"[^>]*aria-current="page"/u);
});

test('the sign-in and bootstrap pages stay chrome-free', async () => {
  const login = await loginPage().text();
  assert.doesNotMatch(login, /admin-shell/u);
  assert.doesNotMatch(login, /admin-nav/u);
  assert.match(login, /Sign in with primary passkey/u);
});

test('the dashboard is a control panel with measured cards and a chart', async () => {
  const html = await (await dashboardPage({ db: fakeDb(), expiresAt: 1_800_000_000, stats: STATS })).text();
  assert.match(html, /class="kpis"/u);
  for (const label of ['Drafts', 'Pageviews · 7d', 'API calls · month', 'Research notes', 'Subscribers', 'Plan']) {
    assert.ok(html.includes(label), label);
  }
  assert.match(html, /class="kpi__value">2</u);
  assert.match(html, /class="kpi__value">40</u);
  assert.match(html, /class="kpi__value">12</u);
  assert.match(html, /class="kpi__value">active</u);
  assert.match(html, /class="chart__bars"/u);
  assert.equal((html.match(/chart__bar chart__bar--h/gu) ?? []).length, 2);
  assert.match(html, /recovery/u);
  assert.match(html, /<h2>Attention<\/h2>/u);
  assert.match(html, /Subscription status is past_due/u);
  assert.match(html, /5 passing · 2 blocked · 3 manual/u);
  assert.match(html, /Recent activity/u);
  assert.match(html, /webhook_invalid_signature/u);
});

test('the dashboard survives without stats', async () => {
  const html = await (await dashboardPage({ db: fakeDb(), expiresAt: 1_800_000_000 })).text();
  assert.match(html, /class="kpis"/u);
  assert.doesNotMatch(html, /chart__bars/u);
  assert.match(html, /No alerts/u);
  assert.match(html, /No operational events recorded/u);
});
