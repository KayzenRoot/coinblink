-- CB-M12-P1-BILLING-001: Stripe test-mode customers, subscriptions and events.
--
-- No card data is stored. The Worker keeps only Stripe identifiers, status,
-- price and period end. Live keys are refused by the billing module.
CREATE TABLE IF NOT EXISTS cms_billing_customers (
  owner_id INTEGER PRIMARY KEY,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_billing_subscriptions (
  stripe_subscription_id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL DEFAULT 1,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL,
  price_id TEXT NOT NULL,
  current_period_end INTEGER,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cms_billing_subscriptions_owner
  ON cms_billing_subscriptions(owner_id, status);

CREATE TABLE IF NOT EXISTS cms_billing_events (
  stripe_event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at INTEGER NOT NULL
);

CREATE TRIGGER IF NOT EXISTS cms_billing_events_no_update
BEFORE UPDATE ON cms_billing_events
BEGIN
  SELECT RAISE(ABORT, 'billing events are append-only');
END;

CREATE TRIGGER IF NOT EXISTS cms_billing_events_no_delete
BEFORE DELETE ON cms_billing_events
BEGIN
  SELECT RAISE(ABORT, 'billing events are append-only');
END;
