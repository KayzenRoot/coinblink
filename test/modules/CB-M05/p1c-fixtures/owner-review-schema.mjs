// Additive LOCAL D1 extension. Never imported by public routes or production bindings.
// SQLite/D1 does not support CREATE OR REPLACE TRIGGER. IF NOT EXISTS is idempotent.
export const OWNER_REVIEW_DDL = Object.freeze([
  `CREATE TABLE IF NOT EXISTS cms_owner_reviews (
    draft_id TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK (revision >= 1),
    actor_owner_id INTEGER NOT NULL CHECK (actor_owner_id = 1),
    decision TEXT NOT NULL CHECK (decision IN ('PREVIEW_REVIEWED','CHANGES_REQUESTED')),
    note TEXT NOT NULL CHECK (length(note) BETWEEN 10 AND 500),
    created_at INTEGER NOT NULL,
    PRIMARY KEY (draft_id, revision),
    FOREIGN KEY (draft_id, revision) REFERENCES cms_draft_revisions(draft_id, revision),
    FOREIGN KEY (actor_owner_id) REFERENCES cms_owner(owner_id)
  )`,
  `CREATE TRIGGER IF NOT EXISTS cms_owner_review_no_update
    BEFORE UPDATE ON cms_owner_reviews
    BEGIN SELECT RAISE(ABORT, 'local Owner review is immutable'); END`,
  `CREATE TRIGGER IF NOT EXISTS cms_owner_review_no_delete
    BEFORE DELETE ON cms_owner_reviews
    BEGIN SELECT RAISE(ABORT, 'local Owner review is immutable'); END`,
]);

export async function installLocalOwnerReviewSchema(db) {
  // A single D1 batch is the compatibility boundary for fresh and existing v1 LOCAL D1.
  await db.batch(OWNER_REVIEW_DDL.map(statement => db.prepare(statement)));
  const installed = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='cms_owner_reviews'",
  ).first();
  if (installed?.name !== 'cms_owner_reviews') {
    throw new Error('Local Owner review extension is missing');
  }
}
