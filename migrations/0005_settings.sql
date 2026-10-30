-- CB-M05-P1-SETTINGS-001: owner-managed integration settings.
--
-- Values are encrypted with AES-GCM under a settings-specific HKDF key. The
-- panel never renders a stored secret back. Core Worker secrets (M05 session
-- key, Cloudflare token) are deliberately not part of this table.
CREATE TABLE IF NOT EXISTS cms_settings (
  key TEXT PRIMARY KEY,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  is_secret INTEGER NOT NULL CHECK (is_secret IN (0, 1)),
  updated_at INTEGER NOT NULL,
  updated_by INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cms_settings_audit (
  event_id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('set', 'clear', 'test_email')),
  actor TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS cms_settings_audit_created
  ON cms_settings_audit(created_at DESC);

CREATE TRIGGER IF NOT EXISTS cms_settings_audit_no_update
BEFORE UPDATE ON cms_settings_audit
BEGIN
  SELECT RAISE(ABORT, 'settings audit is append-only');
END;

CREATE TRIGGER IF NOT EXISTS cms_settings_audit_no_delete
BEFORE DELETE ON cms_settings_audit
BEGIN
  SELECT RAISE(ABORT, 'settings audit is append-only');
END;
