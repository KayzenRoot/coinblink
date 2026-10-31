-- CB-M10-P1-EDITIONS-001: newsletter editions built from published articles.
-- An edition is composed by the owner, sent once and recorded; sends are
-- append-only so the audience of an edition cannot be rewritten.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_newsletter_editions (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL CHECK (locale IN ('en','pt-br','es')),
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 4 AND 140),
  intro TEXT NOT NULL DEFAULT '' CHECK (length(intro) <= 600),
  article_ids TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent')),
  recipients INTEGER NOT NULL DEFAULT 0 CHECK (recipients >= 0),
  created_at INTEGER NOT NULL,
  sent_at INTEGER
);

CREATE INDEX IF NOT EXISTS cms_newsletter_editions_state
  ON cms_newsletter_editions(status, created_at DESC);

CREATE TABLE IF NOT EXISTS cms_newsletter_sends (
  edition_id TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent','failed')),
  detail TEXT NOT NULL DEFAULT '' CHECK (length(detail) <= 200),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (edition_id, email),
  FOREIGN KEY (edition_id) REFERENCES cms_newsletter_editions(id)
);

CREATE TRIGGER IF NOT EXISTS cms_newsletter_sends_no_update
BEFORE UPDATE ON cms_newsletter_sends
BEGIN
  SELECT RAISE(ABORT, 'newsletter sends are append-only');
END;

CREATE TRIGGER IF NOT EXISTS cms_newsletter_sends_no_delete
BEFORE DELETE ON cms_newsletter_sends
BEGIN
  SELECT RAISE(ABORT, 'newsletter sends are append-only');
END;
