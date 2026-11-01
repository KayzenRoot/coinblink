-- CB-M04-P1-MARKETS-001: monthly budget guard for a metered third-party provider.
-- The counter is claimed before the request, so a burst cannot overshoot the cap.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_provider_calls (
  provider TEXT NOT NULL,
  period TEXT NOT NULL CHECK (length(period) = 7),
  calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (provider, period)
);
