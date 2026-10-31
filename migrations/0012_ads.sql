-- CB-M13-P1-ADS-001: sponsors, placements and daily delivery counters.
-- A placement is sold by the owner, has a start and an end, and is rendered
-- only while active. Counters are per placement per UTC day.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS cms_sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  url TEXT NOT NULL CHECK (url LIKE 'https://%'),
  contact TEXT NOT NULL DEFAULT '' CHECK (length(contact) <= 160),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_ad_placements (
  id TEXT PRIMARY KEY,
  sponsor_id TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('home','article','newsletter')),
  label TEXT NOT NULL CHECK (length(label) BETWEEN 2 AND 60),
  body TEXT NOT NULL DEFAULT '' CHECK (length(body) <= 240),
  cta_label TEXT NOT NULL DEFAULT '' CHECK (length(cta_label) <= 40),
  cta_url TEXT NOT NULL CHECK (cta_url LIKE 'https://%'),
  rate_cents INTEGER NOT NULL DEFAULT 0 CHECK (rate_cents >= 0),
  start_at INTEGER NOT NULL,
  end_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (sponsor_id) REFERENCES cms_sponsors(id)
);

CREATE INDEX IF NOT EXISTS cms_ad_placements_slot ON cms_ad_placements(slot, status, start_at, end_at);

CREATE TABLE IF NOT EXISTS cms_ad_stats (
  placement_id TEXT NOT NULL,
  day TEXT NOT NULL CHECK (length(day) = 10),
  impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  PRIMARY KEY (placement_id, day),
  FOREIGN KEY (placement_id) REFERENCES cms_ad_placements(id)
);
