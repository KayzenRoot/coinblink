-- CB-M16-P1-READERS-001: reader accounts, magic-link tokens, sessions and watchlists.
-- A reader exists only after consuming a magic link. Tokens and sessions are
-- stored as SHA-256 digests; nothing recoverable is kept.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_readers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE CHECK (length(email) BETWEEN 3 AND 254),
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en','pt-br','es')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active')),
  created_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS cms_reader_tokens (
  token_digest TEXT PRIMARY KEY CHECK (length(token_digest) = 64),
  reader_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login')),
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (reader_id) REFERENCES cms_readers(id)
);

CREATE INDEX IF NOT EXISTS cms_reader_tokens_reader ON cms_reader_tokens(reader_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cms_reader_sessions (
  session_digest TEXT PRIMARY KEY CHECK (length(session_digest) = 64),
  reader_id TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY (reader_id) REFERENCES cms_readers(id)
);

CREATE TABLE IF NOT EXISTS cms_watchlist (
  reader_id TEXT NOT NULL,
  symbol TEXT NOT NULL CHECK (length(symbol) BETWEEN 2 AND 12),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (reader_id, symbol),
  FOREIGN KEY (reader_id) REFERENCES cms_readers(id)
);
