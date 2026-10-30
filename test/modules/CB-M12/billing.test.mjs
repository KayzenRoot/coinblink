import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  billingPage, billingStatus, checkoutForPlan, createCheckoutSession, handleStripeEvent,
  missingBillingKeys, verifyStripeSignature,
} from '../../../src/modules/CB-M12/billing.mjs';

const SECRET = 'a'.repeat(64);
const NOW = 1_800_000_000_000;
const WEBHOOK_SECRET = ['whsec', 'test', '12345678'].join('_');
const TEST_KEY = ['sk', 'test', '12345678'].join('_');
const LIVE_KEY = ['sk', 'live', '12345678'].join('_');
const OTHER_SECRET = ['whsec', 'other', '12345678'].join('_');
const CONFIG = {
  apiKey: TEST_KEY,
  webhookSecret: WEBHOOK_SECRET,
  monthlyPrice: 'price_monthly1234',
  yearlyPrice: 'price_yearly1234',
  email: 'founder@nexlabs.company',
};
const ENV = {
  STRIPE_SECRET_KEY: TEST_KEY,
  STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  STRIPE_PRICE_MONTHLY: 'price_monthly1234',
  STRIPE_PRICE_YEARLY: 'price_yearly1234',
  COINBLINK_TEST_EMAIL: 'founder@nexlabs.company',
};

function fakeDb({ sub = null, customer = null } = {}) {
  const calls = [];
  const seen = new Set();
  return {
    calls,
    prepare(sql) {
      const read = async () => {
        if (sql.includes('FROM cms_billing_subscriptions')) return sub;
        if (sql.includes('FROM cms_billing_customers')) return customer;
        return null;
      };
      const statement = {
        sql,
        first: read,
        bind(...args) {
          calls.push({ sql, args });
          return {
            first: read,
            run: async () => {
              if (sql.includes('INSERT OR IGNORE INTO cms_billing_events')) {
                if (seen.has(args[0])) return { meta: { changes: 0 } };
                seen.add(args[0]);
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
      return statement;
    },
  };
}

async function sign(payload, secret, timestamp) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + '.' + payload));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return 't=' + timestamp + ',v1=' + hex;
}

const SUBSCRIPTION = {
  id: 'evt_sub_1',
  type: 'customer.subscription.created',
  data: {
    object: {
      id: 'sub_123', customer: 'cus_123', status: 'active', metadata: { owner_id: '1' },
      current_period_end: 1_800_086_400, cancel_at_period_end: false,
      items: { data: [{ price: { id: 'price_monthly1234' } }] },
    },
  },
};

test('Stripe signatures accept only a fresh, matching HMAC', async () => {
  const payload = JSON.stringify(SUBSCRIPTION);
  const now = Math.floor(NOW / 1000);
  const header = await sign(payload, WEBHOOK_SECRET, now);
  assert.equal(await verifyStripeSignature({ payload, header, secret: WEBHOOK_SECRET, nowMs: NOW }), true);
  assert.equal(await verifyStripeSignature({ payload: payload + ' ', header, secret: WEBHOOK_SECRET, nowMs: NOW }), false);
  assert.equal(await verifyStripeSignature({ payload, header, secret: OTHER_SECRET, nowMs: NOW }), false);
  assert.equal(await verifyStripeSignature({ payload, header, secret: WEBHOOK_SECRET, nowMs: NOW + 301_000 }), false);
  assert.equal(await verifyStripeSignature({ payload, header: 'garbage', secret: WEBHOOK_SECRET, nowMs: NOW }), false);
});

test('subscription events upsert the entitlement and are idempotent', async () => {
  const db = fakeDb();
  assert.equal((await handleStripeEvent({ db, event: SUBSCRIPTION, nowMs: NOW })).status, 'processed');
  const insert = db.calls.find((call) => call.sql.includes('INSERT INTO cms_billing_subscriptions'));
  assert.equal(insert.args[0], 'sub_123');
  assert.equal(insert.args[1], 1);
  assert.equal(insert.args[3], 'active');
  assert.equal(insert.args[4], 'price_monthly1234');
  assert.equal((await handleStripeEvent({ db, event: SUBSCRIPTION, nowMs: NOW })).status, 'duplicate');
});

test('the period end falls back to the subscription item', async () => {
  const db = fakeDb();
  const event = structuredClone(SUBSCRIPTION);
  delete event.data.object.current_period_end;
  event.data.object.items.data[0].current_period_end = 1_800_172_800;
  assert.equal((await handleStripeEvent({ db, event, nowMs: NOW })).status, 'processed');
  const insert = db.calls.find((call) => call.sql.includes('INSERT INTO cms_billing_subscriptions'));
  assert.equal(insert.args[5], 1_800_172_800);
});

test('checkout completion records the Stripe customer without card data', async () => {
  const db = fakeDb();
  const event = {
    id: 'evt_checkout_1', type: 'checkout.session.completed',
    data: { object: { customer: 'cus_123', customer_details: { email: 'founder@nexlabs.company' } } },
  };
  assert.equal((await handleStripeEvent({ db, event, nowMs: NOW })).status, 'processed');
  const insert = db.calls.find((call) => call.sql.includes('INSERT INTO cms_billing_customers'));
  assert.equal(insert.args[0], 'cus_123');
  assert.equal(insert.args[1], 'founder@nexlabs.company');
  assert.equal(db.calls.some((call) => /card|4242/iu.test(call.sql)), false);
});

test('checkout sessions are subscription-mode and carry the owner metadata', async () => {
  let seen = null;
  const session = await createCheckoutSession({
    fetchImpl: async (url, options) => {
      seen = { url, options };
      return new Response(JSON.stringify({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' }), { status: 200 });
    },
    apiKey: ENV.STRIPE_SECRET_KEY,
    priceId: ENV.STRIPE_PRICE_MONTHLY,
    email: 'founder@nexlabs.company',
    successUrl: 'https://example.test/admin/billing?checkout=success',
    cancelUrl: 'https://example.test/admin/billing?checkout=cancelled',
  });
  assert.equal(session.id, 'cs_123');
  assert.equal(seen.url, 'https://api.stripe.com/v1/checkout/sessions');
  const body = new URLSearchParams(seen.options.body.toString());
  assert.equal(body.get('mode'), 'subscription');
  assert.equal(body.get('line_items[0][price]'), ENV.STRIPE_PRICE_MONTHLY);
  assert.equal(body.get('metadata[owner_id]'), '1');
  assert.equal(body.get('customer_email'), 'founder@nexlabs.company');
  await assert.rejects(createCheckoutSession({
    fetchImpl: async () => new Response('{}', { status: 200 }),
    apiKey: LIVE_KEY, priceId: ENV.STRIPE_PRICE_MONTHLY,
    successUrl: 'https://example.test/s', cancelUrl: 'https://example.test/c',
  }), /test key/u);
});

test('checkout refuses missing settings, live keys and unknown plans', async () => {
  const db = fakeDb();
  const base = { db, secret: SECRET, origin: 'https://example.test', nowMs: NOW };
  assert.equal((await checkoutForPlan({ ...base, env: {}, plan: 'monthly' })).status, 'not_configured');
  assert.equal((await checkoutForPlan({ ...base, env: { ...ENV, STRIPE_SECRET_KEY: LIVE_KEY }, plan: 'monthly' })).status, 'live_disabled');
  assert.equal((await checkoutForPlan({ ...base, env: ENV, plan: 'weekly' })).status, 'invalid_plan');
  let body = null;
  const redirect = await checkoutForPlan({
    ...base, env: ENV, plan: 'yearly',
    fetchImpl: async (_url, options) => {
      body = new URLSearchParams(options.body.toString());
      return new Response(JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/x' }), { status: 200 });
    },
  });
  assert.equal(redirect.status, 'redirect');
  assert.equal(redirect.url, 'https://checkout.stripe.com/x');
  // A Strict owner cookie is not sent on the cross-site return, so Stripe lands
  // on the public same-origin hop instead of the authenticated page.
  assert.equal(body.get('success_url'), 'https://example.test/billing/return?status=success');
  assert.equal(body.get('cancel_url'), 'https://example.test/billing/return?status=cancelled');
});

test('the billing page shows the plan, missing keys and the test-mode guard', async () => {
  const missing = billingPage({
    status: { active: false, subscription: null, customer: null },
    config: { apiKey: null, webhookSecret: null, monthlyPrice: null, yearlyPrice: null, email: null },
    csrf: 'c'.repeat(64),
  });
  const missingBody = await missing.text();
  assert.match(missingBody, /Missing settings/u);
  assert.match(missingBody, /Stripe test mode only/u);
  const active = billingPage({
    status: { active: true, subscription: { status: 'active', priceId: 'price_monthly1234', currentPeriodEnd: 1_800_086_400, cancelAtPeriodEnd: 0 }, customer: null },
    config: CONFIG, csrf: 'c'.repeat(64),
  });
  const activeBody = await active.text();
  assert.match(activeBody, /Subscribe monthly/u);
  assert.match(activeBody, /price_monthly1234/u);
  assert.match(activeBody, /4242 4242 4242 4242/u);
  const live = billingPage({
    status: { active: false, subscription: null, customer: null },
    config: { ...CONFIG, apiKey: LIVE_KEY }, csrf: 'c'.repeat(64),
  });
  assert.match(await live.text(), /Live Stripe keys are disabled/u);
  const done = billingPage({
    status: { active: true, subscription: null, customer: null },
    config: CONFIG, csrf: 'c'.repeat(64), checkout: 'success',
  });
  assert.match(await done.text(), /Payment completed/u);
  const cancelled = billingPage({
    status: { active: false, subscription: null, customer: null },
    config: CONFIG, csrf: 'c'.repeat(64), checkout: 'cancelled',
  });
  assert.match(await cancelled.text(), /Checkout cancelled/u);
  assert.deepEqual(missingBillingKeys({ apiKey: null, webhookSecret: null, monthlyPrice: null, yearlyPrice: null }),
    ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_YEARLY']);
});

test('billing status marks only active and trialing subscriptions as entitled', async () => {
  const active = await billingStatus({ db: fakeDb({ sub: { status: 'active', priceId: 'price_monthly1234' } }) });
  assert.equal(active.active, true);
  const pastDue = await billingStatus({ db: fakeDb({ sub: { status: 'past_due', priceId: 'price_monthly1234' } }) });
  assert.equal(pastDue.active, false);
  const none = await billingStatus({ db: fakeDb() });
  assert.equal(none.active, false);
});

test('the admin and webhook routes expose the billing contract', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ['/admin/billing', 'checkoutForPlan', 'billingPage', 'billingStatus', "searchParams.get('checkout')"]) {
    assert.ok(route.includes(marker), marker);
  }
  const webhook = readFileSync('src/pages/api/stripe/webhook.ts', 'utf8');
  for (const marker of ['verifyStripeSignature', 'handleStripeEvent', 'invalid_signature']) {
    assert.ok(webhook.includes(marker), marker);
  }
  assert.doesNotMatch(route, /card number|cvc/iu);
});

test('the public return hop bounces to the authenticated billing page', () => {
  const source = readFileSync('src/pages/billing/return.ts', 'utf8');
  for (const marker of ['OUTCOMES', '"success"', '"cancelled"', '/admin/billing?checkout=', '"cache-control": "no-store"']) {
    assert.ok(source.includes(marker), marker);
  }
  assert.match(source, /status:\s*303/u);
  assert.doesNotMatch(source, /import\s+\{[^}]*authorize/iu);
});
