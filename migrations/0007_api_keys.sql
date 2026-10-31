-- CB-M11-P1-API-KEYS-001: hashed API keys, monthly metering and plans.
-- The presented key is never stored; only its SHA-256 digest and a short prefix.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_api_keys (
  key_id TEXT PRIMARY KEY CHECK (length(key_id) = 16),
  owner_id INTEGER NOT NULL DEFAULT 1 CHECK (owner_id = 1),
  label TEXT NOT NULL CHECK (length(label) BETWEEN 2 AND 60),
  prefix TEXT NOT NULL CHECK (length(prefix) = 12),
  secret_digest TEXT NOT NULL UNIQUE CHECK (length(secret_digest) = 64),
  plan TEXT NOT NULL CHECK (plan IN ('sandbox','starter','pro')),
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS cms_api_keys_owner ON cms_api_keys(owner_id, revoked_at);

CREATE TABLE IF NOT EXISTS cms_api_usage (
  key_id TEXT NOT NULL,
  period TEXT NOT NULL CHECK (length(period) = 7),
  calls INTEGER NOT NULL DEFAULT 0 CHECK (calls >= 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (key_id, period),
  FOREIGN KEY (key_id) REFERENCES cms_api_keys(key_id)
);

-- Revocation is terminal: a key row is never deleted and a revoked key cannot
-- be revived, so usage history keeps pointing at a real record.
CREATE TRIGGER IF NOT EXISTS cms_api_keys_no_delete
BEFORE DELETE ON cms_api_keys
BEGIN
  SELECT RAISE(ABORT, 'api keys are never deleted');
END;
