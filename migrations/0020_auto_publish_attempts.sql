-- CB-M08-P1-AUTO-PUBLISH-001: transient failures are retried, permanent ones are not.
--
-- attempts counts how many times a headline was tried; a rate-limited or
-- offline publisher stays eligible until three attempts, while a refusal or a
-- 404 is remembered for good.
ALTER TABLE cms_auto_publish ADD COLUMN attempts INTEGER NOT NULL DEFAULT 1;
