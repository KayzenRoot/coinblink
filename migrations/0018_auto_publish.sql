-- CB-M08-P1-AUTO-PUBLISH-001: one row per attempted headline link.
--
-- The digest is the primary key, so the same story is never written twice and a
-- refusal is remembered instead of retried every tick.
CREATE TABLE IF NOT EXISTS cms_auto_publish (
  digest TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
