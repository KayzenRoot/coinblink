INSERT INTO owner_claims (owner_id, owner_key, created_at)
VALUES (1, 'TEST-OWNER-RESTORE', 1760486400);
INSERT INTO recovery_devices (device_id, owner_id, device_kind, revoked_at)
VALUES ('TEST-DEVICE-PRIMARY', 1, 'primary', NULL);
INSERT INTO recovery_devices (device_id, owner_id, device_kind, revoked_at)
VALUES ('TEST-DEVICE-RECOVERY', 1, 'recovery', NULL);
INSERT INTO one_time_challenges (challenge_hash, origin, rp_id, expires_at, consumed_at)
VALUES ('TEST-CHALLENGE-RESTORE-HASH', 'https://owner.example.test', 'owner.example.test', 1760486520, NULL);
INSERT INTO synthetic_sessions (token_hash, owner_id, expires_at, revoked_at)
VALUES ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 1, 1760486520, NULL);
INSERT INTO articles (article_id, revision, body)
VALUES ('article-synthetic-restore', 1, 'synthetic-restore-body');
INSERT INTO article_revisions (article_id, revision, body)
VALUES ('article-synthetic-restore', 1, 'synthetic-restore-body');