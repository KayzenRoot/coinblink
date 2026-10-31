-- CB-M16-P1-ALERTS-001: one digest per reader per UTC day.
-- The row is the record that the digest for that day was attempted, so a retry
-- cannot send twice.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_reader_alert_sends (
  reader_id TEXT NOT NULL,
  day TEXT NOT NULL CHECK (length(day) = 10),
  items INTEGER NOT NULL DEFAULT 0 CHECK (items >= 0),
  status TEXT NOT NULL CHECK (status IN ('sent','failed','empty')),
  detail TEXT NOT NULL DEFAULT '' CHECK (length(detail) <= 200),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (reader_id, day),
  FOREIGN KEY (reader_id) REFERENCES cms_readers(id)
);
