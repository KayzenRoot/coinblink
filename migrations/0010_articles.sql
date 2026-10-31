-- CB-M05-P1-PUBLISHING-001: owner-authored articles and their revisions.
-- Only text the owner wrote is published; third-party feed text never enters
-- this table. Unpublishing keeps the row so the URL answers 410, not 404.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_articles (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL DEFAULT 1 CHECK (owner_id = 1),
  draft_id TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('en','pt-br','es')),
  slug TEXT NOT NULL CHECK (length(slug) BETWEEN 3 AND 80),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 8 AND 140),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 20 AND 400),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 40000),
  tags TEXT NOT NULL DEFAULT '',
  author_label TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  provenance_note TEXT NOT NULL DEFAULT '' CHECK (length(provenance_note) <= 400),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','unpublished')),
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES cms_drafts(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS cms_articles_locale_slug
  ON cms_articles(locale, slug);
CREATE INDEX IF NOT EXISTS cms_articles_status ON cms_articles(status, locale, published_at DESC);

CREATE TABLE IF NOT EXISTS cms_article_revisions (
  article_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT NOT NULL,
  provenance_note TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (article_id, revision),
  FOREIGN KEY (article_id) REFERENCES cms_articles(id)
);

CREATE TRIGGER IF NOT EXISTS cms_article_revisions_no_update
BEFORE UPDATE ON cms_article_revisions
BEGIN
  SELECT RAISE(ABORT, 'article revisions are append-only');
END;

CREATE TRIGGER IF NOT EXISTS cms_article_revisions_no_delete
BEFORE DELETE ON cms_article_revisions
BEGIN
  SELECT RAISE(ABORT, 'article revisions are append-only');
END;
