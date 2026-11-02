-- CB-M07-P1-SOCIAL-QUEUE-001: the daily plan of social posts.
--
-- One row per network and article, so the same article is never queued twice on
-- the same network. The caption is generated here and reviewed before sending.
CREATE TABLE IF NOT EXISTS cms_social_queue (
  id TEXT PRIMARY KEY,
  network TEXT NOT NULL,
  article_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  slug TEXT NOT NULL,
  caption TEXT NOT NULL,
  status TEXT NOT NULL,
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  sent_at INTEGER,
  detail TEXT,
  UNIQUE (network, article_id)
);
