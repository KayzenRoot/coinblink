// CB-M12-P1-BILLING-001: Stripe test-mode checkout, webhook and entitlements.
//
// Only test keys are accepted in this increment. No card data is stored; the
// Worker keeps Stripe identifiers, status, price and period end.
import { escapeHtml, page } from '../CB-M05/p1-production/owner-auth.mjs';
import { getSetting } from '../CB-M05/p1-production/settings.mjs';

export const STRIPE_API = 'https://api.stripe.com/v1';
const TEST_KEY = /^sk_test_[A-Za-z0-9]{8,200}$/u;
const PRICE = /^price_[A-Za-z0-9]{8,200}$/u;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u;
const ACTIVE = new Set(['active', 'trialing']);
const SUBSCRIPTION_EVENTS = new Set([
  'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
]);

export async function readBillingConfig({ db, secret, env }) {
  const [apiKey, webhookSecret, monthlyPrice, yearlyPrice, email] = await Promise.all([
    getSetting({ db, secret, env, key: 'STRIPE_SECRET_KEY' }),
    getSetting({ db, secret, env, key: 'STRIPE_WEBHOOK_SECRET' }),
    getSetting({ db, secret, env, key: 'STRIPE_PRICE_MONTHLY' }),
    getSetting({ db, secret, env, key: 'STRIPE_PRICE_YEARLY' }),
    getSetting({ db, secret, env, key: 'COINBLINK_TEST_EMAIL' }),
  ]);
  return Object.freeze({ apiKey, webhookSecret, monthlyPrice, yearlyPrice, email });
}

export function missingBillingKeys(config) {
  const missing = [];
  if (config?.apiKey === null || config?.apiKey === undefined) missing.push('STRIPE_SECRET_KEY');
  if (config?.webhookSecret === null || config?.webhookSecret === undefined) missing.push('STRIPE_WEBHOOK_SECRET');
  if (!PRICE.test(config?.monthlyPrice ?? '')) missing.push('STRIPE_PRICE_MONTHLY');
  if (!PRICE.test(config?.yearlyPrice ?? '')) missing.push('STRIPE_PRICE_YEARLY');
  return missing;
}

async function stripeRequest({ fetchImpl = globalThis.fetch, apiKey, method = 'GET', path, params }) {
  if (typeof apiKey !== 'string' || !TEST_KEY.test(apiKey)) throw new Error('a Stripe test key is required');
  if (typeof fetchImpl !== 'function') throw new Error('fetch is required');
  const body = params === undefined ? undefined : new URLSearchParams(params).toString();
  let response;
  try {
    response = await fetchImpl(STRIPE_API + path, {
      method,
      headers: {
        authorization: 'Bearer ' + apiKey,
        ...(body === undefined ? {} : { 'content-type': 'application/x-www-form-urlencoded' }),
      },
      body,
    });
  } catch {
    throw new Error('Stripe could not be reached');
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) throw new Error(payload?.error?.message ?? 'Stripe rejected the request');
  return payload;
}

export async function createCheckoutSession({
  fetchImpl, apiKey, priceId, email, successUrl, cancelUrl, ownerId = 1,
}) {
  if (typeof priceId !== 'string' || !PRICE.test(priceId)) throw new Error('price id is required');
  if (typeof successUrl !== 'string' || typeof cancelUrl !== 'string') throw new Error('redirect URLs are required');
  const params = {
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: String(ownerId),
    'metadata[owner_id]': String(ownerId),
    'subscription_data[metadata][owner_id]': String(ownerId),
  };
  if (typeof email === 'string' && EMAIL.test(email)) params.customer_email = email;
  const session = await stripeRequest({ fetchImpl, apiKey, method: 'POST', path: '/checkout/sessions', params });
  if (typeof session?.url !== 'string' || session.url === '') throw new Error('Stripe did not return a checkout URL');
  return Object.freeze({ id: String(session.id ?? ''), url: session.url });
}

function timingSafeEqualHex(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function verifyStripeSignature({ payload, header, secret, nowMs, tolerance = 300 }) {
  if (typeof payload !== 'string' || typeof header !== 'string' || typeof secret !== 'string' || secret === '') return false;
  const parts = header.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) ?? '';
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!/^\d+$/u.test(timestamp) || signatures.length === 0) return false;
  const now = Math.floor(nowMs / 1000);
  if (Math.abs(now - Number(timestamp)) > tolerance) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(timestamp + '.' + payload));
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some((signature) => timingSafeEqualHex(signature, expected));
}

// Stripe moved the period end from the subscription to its first item; the
// subscription-level field is still read first for older API versions.
function periodEnd(data, item) {
  for (const candidate of [data.current_period_end, item?.current_period_end]) {
    if (Number.isFinite(candidate)) return Number(candidate);
  }
  return null;
}

function subscriptionRow(event, now) {
  const data = event.data?.object;
  if (data === null || typeof data !== 'object') return null;
  const customerId = typeof data.customer === 'string' ? data.customer : '';
  const item = data.items?.data?.[0];
  const priceId = item?.price?.id;
  if (typeof data.id !== 'string' || customerId === '' || !PRICE.test(priceId ?? '')) return null;
  return {
    id: data.id,
    ownerId: Number.isSafeInteger(Number(data.metadata?.owner_id)) ? Number(data.metadata.owner_id) : 1,
    customerId,
    status: typeof data.status === 'string' ? data.status : 'unknown',
    priceId,
    currentPeriodEnd: periodEnd(data, item),
    cancelAtPeriodEnd: data.cancel_at_period_end === true ? 1 : 0,
    updatedAt: now,
  };
}

export async function handleStripeEvent({ db, event, nowMs }) {
  if (event === null || typeof event !== 'object' || typeof event.id !== 'string' || event.id === ''
    || typeof event.type !== 'string' || event.type === '') return { status: 'invalid' };
  const now = Math.floor(nowMs / 1000);
  const data = event.data?.object;
  if (SUBSCRIPTION_EVENTS.has(event.type)) {
    const row = subscriptionRow(event, now);
    if (row === null) return { status: 'invalid' };
    await db.prepare(
      'INSERT INTO cms_billing_subscriptions(stripe_subscription_id,owner_id,stripe_customer_id,status,price_id,'
      + 'current_period_end,cancel_at_period_end,updated_at) VALUES (?,?,?,?,?,?,?,?) '
      + 'ON CONFLICT(stripe_subscription_id) DO UPDATE SET status=excluded.status,price_id=excluded.price_id,'
      + 'current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,'
      + 'updated_at=excluded.updated_at',
    ).bind(row.id, row.ownerId, row.customerId, row.status, row.priceId, row.currentPeriodEnd, row.cancelAtPeriodEnd, now).run();
  }
  if (event.type === 'checkout.session.completed' && data !== null && typeof data === 'object') {
    const customerId = typeof data.customer === 'string' ? data.customer : '';
    if (customerId !== '') {
      const email = typeof data.customer_details?.email === 'string'
        ? data.customer_details.email
        : (typeof data.customer_email === 'string' ? data.customer_email : '');
      await db.prepare(
        'INSERT INTO cms_billing_customers(owner_id,stripe_customer_id,email,created_at,updated_at) VALUES (1,?,?,?,?) '
        + 'ON CONFLICT(owner_id) DO UPDATE SET stripe_customer_id=excluded.stripe_customer_id,'
        + 'email=excluded.email,updated_at=excluded.updated_at',
      ).bind(customerId, email, now, now).run();
    }
  }
  const inserted = await db.prepare('INSERT OR IGNORE INTO cms_billing_events(stripe_event_id,type,processed_at) VALUES (?,?,?)')
    .bind(event.id, event.type, now).run();
  return { status: inserted?.meta?.changes === 1 ? 'processed' : 'duplicate' };
}

export async function billingStatus({ db }) {
  let subscription;
  let customer;
  try {
    subscription = await db.prepare(
      'SELECT stripe_subscription_id AS subscriptionId,status,price_id AS priceId,'
      + 'current_period_end AS currentPeriodEnd,cancel_at_period_end AS cancelAtPeriodEnd,updated_at AS updatedAt '
      + 'FROM cms_billing_subscriptions WHERE owner_id=1 ORDER BY updated_at DESC LIMIT 1',
    ).first() ?? null;
    customer = await db.prepare('SELECT stripe_customer_id AS customerId,email FROM cms_billing_customers WHERE owner_id=1')
      .first() ?? null;
  } catch {
    subscription = null;
    customer = null;
  }
  return Object.freeze({
    active: subscription !== null && ACTIVE.has(subscription.status),
    subscription,
    customer,
  });
}

export async function checkoutForPlan({ db, secret, env, plan, origin, fetchImpl }) {
  const config = await readBillingConfig({ db, secret, env });
  const missing = missingBillingKeys(config);
  if (missing.length > 0) return Object.freeze({ status: 'not_configured', missing });
  if (!TEST_KEY.test(config.apiKey)) return Object.freeze({ status: 'live_disabled' });
  if (plan !== 'monthly' && plan !== 'yearly') return Object.freeze({ status: 'invalid_plan' });
  const priceId = plan === 'yearly' ? config.yearlyPrice : config.monthlyPrice;
  try {
    const session = await createCheckoutSession({
      fetchImpl, apiKey: config.apiKey, priceId, email: config.email,
      successUrl: new URL('/billing/return?status=success', origin).toString(),
      cancelUrl: new URL('/billing/return?status=cancelled', origin).toString(),
      ownerId: 1,
    });
    return Object.freeze({ status: 'redirect', url: session.url });
  } catch (error) {
    return Object.freeze({ status: 'failed', message: error.message });
  }
}

function csrfField(csrf) {
  return '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">';
}

export function billingPage({ status, config, csrf, error = '', checkout = '' }) {
  const missing = missingBillingKeys(config);
  const live = config?.apiKey !== null && config?.apiKey !== undefined && !TEST_KEY.test(config.apiKey);
  const plan = status.subscription;
  const facts = plan === null
    ? '<p>No active subscription.</p>'
    : '<dl class="admin__facts"><dt>Status</dt><dd>' + escapeHtml(plan.status) + '</dd>'
      + '<dt>Price</dt><dd><code>' + escapeHtml(plan.priceId) + '</code></dd>'
      + '<dt>Renews / ends</dt><dd>' + escapeHtml(plan.currentPeriodEnd === null ? '—' : new Date(plan.currentPeriodEnd * 1000).toISOString()) + '</dd>'
      + '<dt>Cancel at period end</dt><dd>' + (plan.cancelAtPeriodEnd === 1 ? 'yes' : 'no') + '</dd></dl>';
  const buttons = missing.length > 0 || live
    ? ''
    : '<form method="post" action="/admin/billing/checkout" class="admin__inline">' + csrfField(csrf)
      + '<input type="hidden" name="plan" value="monthly"><button type="submit">Subscribe monthly</button></form>'
      + '<form method="post" action="/admin/billing/checkout" class="admin__inline">' + csrfField(csrf)
      + '<input type="hidden" name="plan" value="yearly"><button type="submit">Subscribe yearly</button></form>';
  return page('Billing', '<p><a href="/admin">Owner workspace</a> · <a href="/admin/settings">Settings</a>'
    + ' · <a href="/admin/social">Social accounts</a></p>'
    + (error === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(error) + '</p>')
    + (checkout === 'success'
      ? '<p class="admin__ok" role="status">Payment completed. Stripe confirms the subscription through the webhook.</p>'
      : checkout === 'cancelled'
        ? '<p class="admin__note" role="status">Checkout cancelled. Nothing was charged.</p>'
        : '')
    + '<p class="admin__note">Stripe test mode only. No card data reaches CoinBlink; Stripe hosts the checkout.</p>'
    + facts
    + (missing.length === 0 ? '' : '<p class="admin__error" role="alert">Missing settings: ' + escapeHtml(missing.join(', ')) + '.</p>')
    + (live ? '<p class="admin__error" role="alert">Live Stripe keys are disabled in this increment. Use a test key.</p>' : '')
    + buttons
    + '<p class="admin__note">Test card: 4242 4242 4242 4242, any future date and any CVC.</p>'
    + '<form method="post" action="/admin/logout">' + csrfField(csrf) + '<button type="submit">Sign out</button></form>');
}
