-- CB-M08-P1-RESEARCH-001: owner-only AI research notes.
--
-- A note is an immutable analysis of one private draft revision. It is never
-- published, scheduled or attached to a public route.
CREATE TABLE IF NOT EXISTS cms_research_notes (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL DEFAULT 1,
  draft_id TEXT NOT NULL,
  draft_revision INTEGER NOT NULL,
  model TEXT NOT NULL,
  language TEXT NOT NULL,
  focus TEXT NOT NULL DEFAULT '',
  input_digest TEXT NOT NULL,
  output_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cms_research_notes_owner_created
  ON cms_research_notes(owner_id, created_at DESC);

CREATE TRIGGER IF NOT EXISTS cms_research_notes_no_update
BEFORE UPDATE ON cms_research_notes
BEGIN
  SELECT RAISE(ABORT, 'research notes are append-only');
END;

CREATE TRIGGER IF NOT EXISTS cms_research_notes_no_delete
BEFORE DELETE ON cms_research_notes
BEGIN
  SELECT RAISE(ABORT, 'research notes are append-only');
END;
