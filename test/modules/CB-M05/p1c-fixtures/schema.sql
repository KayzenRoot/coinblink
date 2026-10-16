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
  sign_count INTEGER NOT NULL DEFAULT 0,
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

-- Revision snapshots are append-only, including against accidental direct SQL mutation.
CREATE TRIGGER cms_revision_no_update BEFORE UPDATE ON cms_draft_revisions
BEGIN
  SELECT RAISE(ABORT, 'local CMS revisions are immutable');
END;
CREATE TRIGGER cms_revision_no_delete BEFORE DELETE ON cms_draft_revisions
BEGIN
  SELECT RAISE(ABORT, 'local CMS revisions are immutable');
END;
