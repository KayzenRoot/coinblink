import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  COUNTED_TABLES, REQUIRED_TABLES, assertBackupShape, backupPaths, buildManifest, compareCounts,
  parseCounts, sha256, tableNamesFromDump,
} from '../../scripts/d1-backup.mjs';
import { latestBackup, verifyManifest } from '../../scripts/d1-restore-drill.mjs';

const schema = REQUIRED_TABLES.map((name) => 'CREATE TABLE IF NOT EXISTS "' + name + '" (id INTEGER);').join('\n');
const data = COUNTED_TABLES.map((name) => 'INSERT INTO "' + name + '" VALUES (1);').join('\n');
const counts = Object.fromEntries(COUNTED_TABLES.map((name) => [name, 1]));

test('the dump parser reads quoted, unquoted and IF NOT EXISTS table names', () => {
  const names = tableNamesFromDump(schema);
  assert.deepEqual(names, [...REQUIRED_TABLES].sort());
  assert.deepEqual(tableNamesFromDump('CREATE TABLE plain (id INTEGER);'), ['plain']);
  assert.deepEqual(tableNamesFromDump(''), []);
});

test('the shape check requires every table and rows for every non-empty table', () => {
  assert.equal(assertBackupShape(schema + '\n' + data, counts), true);
  assert.throws(() => assertBackupShape('', counts), /empty/u);
  assert.throws(() => assertBackupShape(schema.replace(/CREATE TABLE IF NOT EXISTS "cms_owner".*\n/u, ''), counts),
    /missing tables: cms_owner/u);
  assert.throws(() => assertBackupShape(schema, counts), /missing rows/u);
  const emptyCounts = Object.fromEntries(COUNTED_TABLES.map((name) => [name, 0]));
  assert.equal(assertBackupShape(schema, emptyCounts), true, 'an all-empty database is a valid backup');
});

test('the manifest pins the bytes, hash, tables and counts', () => {
  const sql = schema + '\n' + data;
  const manifest = buildManifest({ sql, counts, createdAt: '2026-10-30T00:00:00.000Z' });
  assert.equal(manifest.database, 'coinblink-cms');
  assert.equal(manifest.bytes, Buffer.byteLength(sql));
  assert.equal(manifest.sha256, sha256(sql));
  assert.deepEqual(manifest.counts, counts);
  assert.ok(manifest.tables.includes('cms_research_notes'));
});

test('count parsing and comparison reject malformed wrangler output', () => {
  const row = { ...counts };
  assert.deepEqual(parseCounts(JSON.stringify([{ results: [row] }])), counts);
  assert.throws(() => parseCounts('not json'), /JSON/u);
  assert.throws(() => parseCounts(JSON.stringify([{ results: [{ ...row, cms_owner: -1 }] }])), /invalid count/u);
  assert.deepEqual(compareCounts(counts, { ...counts }), []);
  assert.deepEqual(compareCounts(counts, { ...counts, cms_drafts: 2 }),
    [{ table: 'cms_drafts', expected: 1, actual: 2 }]);
});

test('backup paths are deterministic and the latest dump is selected by name', () => {
  const paths = backupPaths(new Date('2026-10-30T20:34:42.000Z'));
  assert.match(paths.sql, /coinblink-cms-2026-10-30T20-34-42-000Z\.sql$/u);
  assert.match(paths.manifest, /\.manifest\.json$/u);
  const directory = mkdtempSync(path.join(tmpdir(), 'cb-backup-'));
  try {
    assert.equal(latestBackup(directory), null);
    writeFileSync(path.join(directory, 'coinblink-cms-a.sql'), 'one');
    writeFileSync(path.join(directory, 'coinblink-cms-b.sql'), 'two');
    assert.equal(path.basename(latestBackup(directory)), 'coinblink-cms-b.sql');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('the drill refuses a dump whose hash does not match its manifest', () => {
  const sql = schema + '\n' + data;
  assert.equal(verifyManifest({ sql, manifest: { sha256: sha256(sql) } }), true);
  assert.throws(() => verifyManifest({ sql, manifest: { sha256: '0'.repeat(64) } }), /hash/u);
});
