-- CB-M06-P1-PAGEVIEWS-001: cookieless, aggregate-only pageviews.
-- One row per UTC day, path and locale. No IP, user agent, referrer or user id.
CREATE TABLE cms_pageviews (
  day TEXT NOT NULL CHECK (length(day) = 10),
  path TEXT NOT NULL CHECK (length(path) BETWEEN 1 AND 200),
  locale TEXT NOT NULL CHECK (locale IN ('en', 'pt-br', 'es', 'other')),
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  PRIMARY KEY (day, path, locale)
);
CREATE INDEX cms_pageviews_day ON cms_pageviews(day);
