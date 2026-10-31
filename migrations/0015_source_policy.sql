-- CB-M03-P1-SOURCE-POLICY-001: hide a collector from readers without a deploy.
-- The collector keeps running; the policy only removes the source from what the
-- reader shows, so re-enabling is instant and no history is lost.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_source_policy (
  source_id TEXT PRIMARY KEY CHECK (length(source_id) BETWEEN 2 AND 40),
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= 200),
  updated_at INTEGER NOT NULL
);
