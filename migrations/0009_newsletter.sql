-- CB-M10-P1-NEWSLETTER-001: double opt-in subscriber list.
-- A subscriber is only "confirmed" after the token in the confirmation link is
-- presented; the token is stored as a SHA-256 digest.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_newsletter_subscribers (
  email TEXT PRIMARY KEY CHECK (length(email) BETWEEN 3 AND 254),
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en','pt-br','es')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','unsubscribed')),
  token_digest TEXT NOT NULL UNIQUE CHECK (length(token_digest) = 64),
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER
);

CREATE INDEX IF NOT EXISTS cms_newsletter_status ON cms_newsletter_subscribers(status, created_at DESC);

CREATE TRIGGER IF NOT EXISTS cms_newsletter_no_delete
BEFORE DELETE ON cms_newsletter_subscribers
BEGIN
  SELECT RAISE(ABORT, 'newsletter subscribers are never deleted');
END;
