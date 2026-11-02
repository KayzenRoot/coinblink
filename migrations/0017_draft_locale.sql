-- CB-M08-P1-ARTICLE-DRAFT-001: a draft remembers the language it was written in.
--
-- Additive: every existing draft defaults to English, which is what the publish
-- form assumed before. The column never rewrites an existing row.
ALTER TABLE cms_drafts ADD COLUMN locale TEXT NOT NULL DEFAULT 'en';
