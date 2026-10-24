-- CB-M05-P1-OWNER-ACCESS-001: test-only D1. NEVER apply as remote migration.
PRAGMA foreign_keys = ON;
CREATE TABLE p1_owner (
  owner_id INTEGER PRIMARY KEY CHECK(owner_id=1),
  claim_marker TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE TABLE p1_ticket (
  digest TEXT PRIMARY KEY CHECK(length(digest)=64),
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  claim_marker TEXT UNIQUE
);
CREATE TABLE p1_credentials (
  credential_id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL DEFAULT 1 CHECK(owner_id=1),
  public_key BLOB NOT NULL,
  sign_count INTEGER NOT NULL DEFAULT 0,
  revoked_at INTEGER,
  FOREIGN KEY(owner_id) REFERENCES p1_owner(owner_id)
);
CREATE TABLE p1_challenge (
  digest TEXT PRIMARY KEY CHECK(length(digest)=64),
  credential_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose='login'),
  origin TEXT NOT NULL,
  rp_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
);
CREATE TABLE p1_session (
  digest TEXT PRIMARY KEY CHECK(length(digest)=64),
  owner_id INTEGER NOT NULL CHECK(owner_id=1),
  credential_id TEXT NOT NULL,
  challenge_digest TEXT NOT NULL UNIQUE,
  issued_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY(owner_id) REFERENCES p1_owner(owner_id),
  FOREIGN KEY(credential_id) REFERENCES p1_credentials(credential_id)
);
