CREATE TABLE IF NOT EXISTS owner_claims (
  owner_id INTEGER PRIMARY KEY CHECK (owner_id = 1),
  owner_key TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS owner_credentials (
  credential_id TEXT PRIMARY KEY CHECK (length(credential_id) BETWEEN 16 AND 256),
  owner_id INTEGER NOT NULL CHECK (owner_id = 1),
  public_key BLOB NOT NULL CHECK (length(public_key) > 0),
  sign_count INTEGER NOT NULL DEFAULT 0 CHECK (sign_count >= 0),
  device_kind TEXT NOT NULL CHECK (device_kind IN ('primary', 'recovery')),
  created_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES owner_claims(owner_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_primary_credential
ON owner_credentials(owner_id, device_kind)
WHERE device_kind = 'primary' AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS one_active_recovery_credential
ON owner_credentials(owner_id, device_kind)
WHERE device_kind = 'recovery' AND revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS one_time_challenges (
  challenge_hash TEXT PRIMARY KEY CHECK (length(challenge_hash) = 64),
  action TEXT NOT NULL,
  audience TEXT NOT NULL,
  origin TEXT NOT NULL,
  rp_id TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE TABLE IF NOT EXISTS synthetic_sessions (
  token_digest TEXT PRIMARY KEY CHECK (length(token_digest) = 64),
  csrf_digest TEXT NOT NULL CHECK (length(csrf_digest) = 64),
  owner_id INTEGER NOT NULL CHECK (owner_id = 1),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  rotated_from TEXT,
  FOREIGN KEY (owner_id) REFERENCES owner_claims(owner_id),
  FOREIGN KEY (rotated_from) REFERENCES synthetic_sessions(token_digest)
);

CREATE TABLE IF NOT EXISTS synthetic_session_failure_switch (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1))
);
INSERT OR IGNORE INTO synthetic_session_failure_switch (id, enabled) VALUES (1, 0);

CREATE TRIGGER IF NOT EXISTS reject_synthetic_session_insert
BEFORE INSERT ON synthetic_sessions
WHEN (SELECT enabled FROM synthetic_session_failure_switch WHERE id = 1) = 1
BEGIN
  SELECT RAISE(ABORT, 'synthetic session insert failed by local fault fixture');
END;
