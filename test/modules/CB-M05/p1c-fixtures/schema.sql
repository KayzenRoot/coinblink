-- LOCAL TEST ONLY. No production binding, credential, or migration.
PRAGMA foreign_keys = ON;

CREATE TABLE cms_owner (
  owner_id INTEGER PRIMARY KEY CHECK (owner_id = 1),
  created_at INTEGER NOT NULL
);

CREATE TABLE cms_credentials (
  credential_id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL CHECK (owner_id = 1),
  public_key BLOB NOT NULL,
  sign_count INTEGER NOT NULL DEFAULT 0 CHECK (sign_count BETWEEN 0 AND 4294967295),
  last_auth_marker TEXT,
  device_kind TEXT NOT NULL CHECK (device_kind IN ('primary','recovery')),
  revoked_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES cms_owner(owner_id)
);
CREATE UNIQUE INDEX cms_one_active_device_kind
  ON cms_credentials(owner_id, device_kind) WHERE revoked_at IS NULL;

CREATE TABLE cms_challenges (
  challenge_digest TEXT PRIMARY KEY CHECK (length(challenge_digest) = 64),
  credential_id TEXT NOT NULL,
  origin TEXT NOT NULL,
  rp_id TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login','recovery')),
  -- Recovery WebAuthn challenges belong to the exact authenticated issuing session;
  -- ordinary login challenges are unauthenticated and retain NULL here.
  session_digest TEXT CHECK (
    (purpose != 'recovery' OR session_digest IS NOT NULL)
    AND (session_digest IS NULL OR length(session_digest) = 64)
  ),
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  consume_marker TEXT UNIQUE,
  FOREIGN KEY (credential_id) REFERENCES cms_credentials(credential_id)
);

CREATE TABLE cms_sessions (
  session_digest TEXT PRIMARY KEY CHECK (length(session_digest) = 64),
  csrf_digest TEXT NOT NULL CHECK (length(csrf_digest) = 64),
  owner_id INTEGER NOT NULL CHECK (owner_id = 1),
  credential_id TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  challenge_digest TEXT NOT NULL UNIQUE,
  FOREIGN KEY (owner_id) REFERENCES cms_owner(owner_id),
  FOREIGN KEY (challenge_digest) REFERENCES cms_challenges(challenge_digest),
  FOREIGN KEY (credential_id) REFERENCES cms_credentials(credential_id)
);

CREATE TABLE cms_drafts (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL CHECK (owner_id = 1),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 8 AND 140),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 20 AND 400),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 40000),
  source_url TEXT NOT NULL,
  author_label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status = 'draft'),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  create_key_digest TEXT NOT NULL UNIQUE,
  write_marker TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES cms_owner(owner_id)
);

CREATE TABLE cms_draft_revisions (
  draft_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  actor_owner_id INTEGER NOT NULL CHECK (actor_owner_id = 1),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  source_url TEXT NOT NULL,
  author_label TEXT NOT NULL,
  write_marker TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (draft_id, revision),
  FOREIGN KEY (draft_id) REFERENCES cms_drafts(id),
  FOREIGN KEY (actor_owner_id) REFERENCES cms_owner(owner_id)
);


-- Additive LOCAL-only review extension; not publication authorization.
CREATE TABLE IF NOT EXISTS cms_owner_reviews (
  draft_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  actor_owner_id INTEGER NOT NULL CHECK (actor_owner_id = 1),
  decision TEXT NOT NULL CHECK (decision IN ('PREVIEW_REVIEWED','CHANGES_REQUESTED')),
  note TEXT NOT NULL CHECK (length(note) BETWEEN 10 AND 500),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (draft_id, revision),
  FOREIGN KEY (draft_id, revision) REFERENCES cms_draft_revisions(draft_id, revision),
  FOREIGN KEY (actor_owner_id) REFERENCES cms_owner(owner_id)
);
CREATE TRIGGER IF NOT EXISTS cms_owner_review_no_update BEFORE UPDATE ON cms_owner_reviews
BEGIN
  SELECT RAISE(ABORT, 'local Owner review is immutable');
END;
CREATE TRIGGER IF NOT EXISTS cms_owner_review_no_delete BEFORE DELETE ON cms_owner_reviews
BEGIN
  SELECT RAISE(ABORT, 'local Owner review is immutable');
END;

CREATE TABLE cms_bootstrap_tickets (
  ticket_digest TEXT PRIMARY KEY CHECK (length(ticket_digest) = 64),
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  consume_marker TEXT UNIQUE
);

CREATE TABLE cms_bootstrap_challenges (
  challenge_digest TEXT PRIMARY KEY CHECK (length(challenge_digest) = 64),
  ticket_digest TEXT NOT NULL,
  origin TEXT NOT NULL,
  rp_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  FOREIGN KEY (ticket_digest) REFERENCES cms_bootstrap_tickets(ticket_digest)
);

-- Post-bootstrap device enrollment (only reachable with an authorized session and CSRF).
CREATE TABLE cms_enroll_challenges (
  challenge_digest TEXT PRIMARY KEY CHECK (length(challenge_digest) = 64),
  credential_kind TEXT NOT NULL CHECK (credential_kind IN ('primary','recovery')),
  -- Immutable challenge intent: a lost-primary recovery must not turn into a regular rotation.
  requires_recovery INTEGER NOT NULL DEFAULT 0 CHECK (requires_recovery IN (0,1)),
  session_digest TEXT NOT NULL CHECK (length(session_digest) = 64),
  issuer_credential_id TEXT NOT NULL,
  origin TEXT NOT NULL,
  rp_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  consume_marker TEXT UNIQUE
);

-- Additional proof required to replace a primary credential that is lost or revoked.
-- Issued only by a fresh user-verified assertion from the recovery credential.
CREATE TABLE cms_recovery_authorizations (
  auth_id TEXT PRIMARY KEY CHECK (length(auth_id) >= 16),
  kind TEXT NOT NULL CHECK (kind = 'rotate-primary'),
  credential_id TEXT NOT NULL,
  session_digest TEXT NOT NULL CHECK (length(session_digest) = 64),
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  use_marker TEXT UNIQUE,
  FOREIGN KEY (credential_id) REFERENCES cms_credentials(credential_id)
);

-- Offline, one-use, operator-issued authorization for the total-loss case. Only a keyed
-- digest is stored; the token itself is never persisted and doubles as the WebAuthn challenge.
CREATE TABLE cms_emergency_authorizations (
  token_digest TEXT PRIMARY KEY CHECK (length(token_digest) = 64),
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  use_marker TEXT UNIQUE
);

CREATE TABLE cms_audit_events (
  event_id TEXT PRIMARY KEY,
  event TEXT NOT NULL CHECK (event IN ('owner_claimed','device_enrolled','device_revoked','recovery_authorized','recovery_used','emergency_used')),
  actor TEXT NOT NULL,
  subject TEXT,
  device_kind TEXT CHECK (device_kind IN ('primary','recovery')),
  created_at INTEGER NOT NULL
);

-- Revision snapshots are append-only, including against accidental direct SQL mutation.
CREATE TRIGGER cms_revision_no_update BEFORE UPDATE ON cms_draft_revisions
BEGIN
  SELECT RAISE(ABORT, 'local CMS revisions are immutable');
END;
CREATE TRIGGER cms_revision_no_delete BEFORE DELETE ON cms_draft_revisions
BEGIN
  SELECT RAISE(ABORT, 'local CMS revisions are immutable');
END;
-- The audit trail is append-only as well.
CREATE TRIGGER cms_audit_no_update BEFORE UPDATE ON cms_audit_events
BEGIN
  SELECT RAISE(ABORT, 'local CMS audit is append-only');
END;
CREATE TRIGGER cms_audit_no_delete BEFORE DELETE ON cms_audit_events
BEGIN
  SELECT RAISE(ABORT, 'local CMS audit is append-only');
END;
