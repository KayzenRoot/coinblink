PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS owner_claims (
  owner_id INTEGER PRIMARY KEY CHECK (owner_id = 1),
  owner_key TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recovery_devices (
  device_id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL CHECK (owner_id = 1),
  device_kind TEXT NOT NULL CHECK (device_kind IN ('primary', 'recovery')),
  revoked_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES owner_claims(owner_id)
);

CREATE TABLE IF NOT EXISTS one_time_challenges (
  challenge_hash TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  rp_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE TABLE IF NOT EXISTS synthetic_sessions (
  token_hash TEXT PRIMARY KEY CHECK (length(token_hash) = 64),
  owner_id INTEGER NOT NULL CHECK (owner_id = 1),
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES owner_claims(owner_id)
);

CREATE TABLE IF NOT EXISTS articles (
  article_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS article_revisions (
  article_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (article_id, revision),
  FOREIGN KEY (article_id) REFERENCES articles(article_id)
);

CREATE TABLE IF NOT EXISTS article_audit (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  action TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (article_id, revision) REFERENCES article_revisions(article_id, revision)
);

CREATE TABLE IF NOT EXISTS audit_failure_switch (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1))
);
INSERT OR IGNORE INTO audit_failure_switch (id, enabled) VALUES (1, 0);

CREATE TRIGGER IF NOT EXISTS reject_synthetic_audit_insert
BEFORE INSERT ON article_audit
WHEN (SELECT enabled FROM audit_failure_switch WHERE id = 1) = 1
BEGIN
  SELECT RAISE(ABORT, 'synthetic audit failure');
END;

CREATE TRIGGER IF NOT EXISTS append_synthetic_article_revision
AFTER UPDATE OF revision, body ON articles
WHEN NEW.revision <> OLD.revision
BEGIN
  INSERT INTO article_revisions (article_id, revision, body)
  VALUES (NEW.article_id, NEW.revision, NEW.body);
  INSERT INTO article_audit (article_id, revision, action, created_at)
  VALUES (NEW.article_id, NEW.revision, 'synthetic-update', 1760486400);
END;