-- CB-M07-P1-TOKEN-CUSTODY-001: encrypted social tokens for the single owner.
--
-- Only the OAuth state digest and AES-GCM ciphertexts are stored. Raw access
-- and refresh tokens never reach a table, a log or a page. Publishing remains
-- disabled until a separate approval flow exists.
CREATE TABLE IF NOT EXISTS cms_social_oauth_states (
  state_digest TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER
);

CREATE INDEX IF NOT EXISTS cms_social_oauth_states_expiry
  ON cms_social_oauth_states(expires_at);

CREATE TABLE IF NOT EXISTS cms_social_accounts (
  provider TEXT NOT NULL,
  account_id TEXT NOT NULL,
  owner_id INTEGER NOT NULL DEFAULT 1,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  scopes TEXT NOT NULL DEFAULT '',
  access_token_ciphertext TEXT NOT NULL,
  access_token_iv TEXT NOT NULL,
  refresh_token_ciphertext TEXT,
  refresh_token_iv TEXT,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (provider, account_id)
);

CREATE INDEX IF NOT EXISTS cms_social_accounts_owner
  ON cms_social_accounts(owner_id, provider);
