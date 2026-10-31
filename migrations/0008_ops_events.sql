-- CB-M14-P1-ALERTS-001: append-only operational events and the alert feed.
-- Only allowlisted event types are written, and a row is never edited or removed.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_ops_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN (
    'webhook_invalid_signature',
    'webhook_invalid_event',
    'research_failed',
    'email_failed'
  )),
  detail TEXT NOT NULL DEFAULT '' CHECK (length(detail) <= 200),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cms_ops_events_created ON cms_ops_events(created_at DESC);

CREATE TRIGGER IF NOT EXISTS cms_ops_events_no_update
BEFORE UPDATE ON cms_ops_events
BEGIN
  SELECT RAISE(ABORT, 'ops events are append-only');
END;

CREATE TRIGGER IF NOT EXISTS cms_ops_events_no_delete
BEFORE DELETE ON cms_ops_events
BEGIN
  SELECT RAISE(ABORT, 'ops events are append-only');
END;
