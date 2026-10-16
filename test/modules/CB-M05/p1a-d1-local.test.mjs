import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { convertV4MiniflareOptions, Miniflare, NoOpLog } from 'miniflare';
import {
  SYNTHETIC_BINDING,
  assertLocalD1Command,
  assertSyntheticD1Config,
  assertSyntheticPayload,
} from '../../../src/modules/CB-M05/p1a-local/guardrails.mjs';

const repositoryRoot = process.cwd();
const configRelative = 'test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc';
const schemaRelative = 'test/modules/CB-M05/p1a-local-fixtures/schema.sql';
const seedRelative = 'test/modules/CB-M05/p1a-local-fixtures/seed.sql';
const config = JSON.parse(readFileSync(path.join(repositoryRoot, configRelative), 'utf8'));
const ignoreText = readFileSync(path.join(repositoryRoot, '.gitignore'), 'utf8');
const runId = new Date().toISOString().replace(/[^0-9TZ]/g, '') + '-' + randomUUID().slice(0, 8);
const stateRoot = '.wrangler/p1a-local-state/' + runId;
const wranglerScript = process.env.P1A_WRANGLER_JS || path.join(repositoryRoot, 'node_modules/wrangler/bin/wrangler.js');
const testTime = 1760486400;
const expectedOrigin = 'https://owner.example.test';
const expectedRpId = 'owner.example.test';

assertSyntheticD1Config(config);
assert.match(ignoreText, /^\.wrangler\/$/m, '.wrangler state must be ignored');
assert.ok(existsSync(wranglerScript), 'Wrangler JS entry point must already be available; no install/network fallback is permitted');

function safeEnvironment() {
  const env = { ...process.env, WRANGLER_SEND_METRICS: 'false', NO_UPDATE_NOTIFIER: '1', CI: '1' };
  for (const key of Object.keys(env)) {
    if (/^(CLOUDFLARE|CF_API_)/i.test(key)) delete env[key];
  }
  return env;
}

function argsFor(stateRelative, inputArgs) {
  return [
    'd1', 'execute', SYNTHETIC_BINDING,
    '--local', '--config', configRelative,
    '--persist-to', stateRelative,
    ...inputArgs, '--json',
  ];
}

function stateFor(caseName) {
  const safeName = caseName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const stateRelative = stateRoot + '/' + safeName;
  const resolved = path.resolve(repositoryRoot, stateRelative);
  const relative = path.relative(repositoryRoot, resolved);
  assert.ok(relative.startsWith(path.join('.wrangler', 'p1a-local-state')), 'state path must remain in ignored P1A-only directory');
  mkdirSync(resolved, { recursive: true });
  return stateRelative;
}

function safeArgs(stateRelative, inputArgs) {
  const args = argsFor(stateRelative, inputArgs);
  assertLocalD1Command(args, { repositoryRoot, configRelative });
  return args;
}

function parseJsonOutput(stdout) {
  const output = stdout.trim();
  const start = output.indexOf('[');
  assert.notEqual(start, -1, 'Wrangler --json output should be a JSON array');
  const parsed = JSON.parse(output.slice(start));
  assert.ok(Array.isArray(parsed), 'Wrangler output must be an array of local D1 results');
  assert.ok(parsed.every((item) => item.success === true), 'Every successful D1 statement must report success');
  return parsed;
}

function runD1(stateRelative, inputArgs, { expectedSuccess = true } = {}) {
  const args = safeArgs(stateRelative, inputArgs);
  const result = spawnSync(process.execPath, [wranglerScript, ...args], {
    cwd: repositoryRoot,
    env: safeEnvironment(),
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (!expectedSuccess) return result;
  assert.equal(result.status, 0, 'Local Wrangler failed: ' + String(result.stderr || result.stdout).slice(0, 2000));
  return parseJsonOutput(result.stdout);
}

function prepare(stateRelative) {
  runD1(stateRelative, ['--file', schemaRelative]);
}

function runStatementBatch(stateRelative, statements) {
  const sql = statements.map((statement) => statement.trim()).join(';\n') + ';';
  assertSyntheticPayload(sql);
  return runD1(stateRelative, ['--command', sql]);
}

function rowsAt(output, statementIndex) {
  return output[statementIndex]?.results || [];
}

async function runConcurrentOwnerClaims(stateRelative, contenderCount) {
  const resolvedState = path.resolve(repositoryRoot, stateRelative);
  const workerScript = `
    let arrived = 0;
    let releaseBarrier;
    let barrier = new Promise((resolve) => { releaseBarrier = resolve; });
    export default {
      async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === '/initialize') {
          await env.${SYNTHETIC_BINDING}.exec('CREATE TABLE owner_claims (owner_id INTEGER PRIMARY KEY CHECK (owner_id = 1), owner_key TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL)');
          return Response.json({ ready: true });
        }
        if (url.pathname === '/claim' && request.method === 'POST') {
          const input = await request.json();
          arrived += 1;
          if (arrived === input.expected) releaseBarrier();
          const allArrived = await Promise.race([barrier.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 15000))]);
          if (!allArrived) return Response.json({ kind: 'barrier-timeout', arrived }, { status: 425 });
          try {
            const result = await env.${SYNTHETIC_BINDING}.prepare('INSERT INTO owner_claims (owner_id, owner_key, created_at) VALUES (?, ?, ?) ON CONFLICT(owner_id) DO NOTHING').bind(1, input.key, input.createdAt).run();
            if (result.meta.changes === 1) {
              return Response.json({ kind: 'owner-created', changes: 1 }, { status: 201 });
            }
            if (result.meta.changes === 0) {
              return Response.json({ kind: 'owner-already-claimed', changes: 0 }, { status: 409 });
            }
            return Response.json({ kind: 'unexpected-change-count', changes: result.meta.changes }, { status: 500 });
          } catch (error) {
            const message = String(error);
            if (/SQLITE_BUSY|database is locked/i.test(message)) return Response.json({ kind: 'contention-rejected' }, { status: 409 });
            return Response.json({ kind: 'unexpected-error', message }, { status: 500 });
          }
        }
        if (url.pathname === '/count') {
          const result = await env.${SYNTHETIC_BINDING}.prepare('SELECT owner_id, owner_key FROM owner_claims').all();
          return Response.json({ rows: result.results, count: result.results.length });
        }
        return new Response('not found', { status: 404 });
      }
    };
  `;
  const miniflare = new Miniflare(convertV4MiniflareOptions({
    name: 'coinblink-m05-p1a-concurrency-fixture',
    script: workerScript,
    modules: true,
    compatibilityDate: config.compatibility_date,
    d1Databases: { [SYNTHETIC_BINDING]: config.d1_databases[0].database_id },
    resourcePersistencePath: resolvedState,
    log: new NoOpLog(),
  }));
  try {
    const initialized = await miniflare.dispatchFetch('http://fixture.invalid/initialize');
    assert.equal(initialized.status, 200, 'Local workerd D1 fixture must initialize');
    const attempts = await Promise.all(Array.from({ length: contenderCount }, (_, index) =>
      miniflare.dispatchFetch('http://fixture.invalid/claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          expected: contenderCount,
          key: 'TEST-OWNER-' + contenderCount + '-' + index,
          createdAt: testTime,
        }),
      }).then(async (response) => ({ status: response.status, body: await response.json() }))));
    const barrierTimeouts = attempts.filter((attempt) => attempt.status === 425);
    assert.equal(barrierTimeouts.length, 0, 'All independent local D1 requests must reach the concurrency barrier');
    const unexpected = attempts.filter((attempt) => attempt.status !== 201 && attempt.status !== 409);
    assert.equal(unexpected.length, 0, 'No unexpected D1 request errors: ' + JSON.stringify(unexpected.slice(0, 3)));
    const result = await miniflare.dispatchFetch('http://fixture.invalid/count');
    assert.equal(result.status, 200);
    const { rows, count } = await result.json();
    assert.equal(count, 1, 'The actual local D1 primary key must commit exactly one synthetic Owner');
    assert.equal(rows[0].owner_id, 1);
    return { attempts, persistedOwners: count };
  } finally {
    await miniflare.dispose();
  }
}

for (const contenders of [2, 10, 100]) {
  test('D1_LOCAL OWNER-01: ' + contenders + ' concurrent independent workerd D1 requests create exactly one Owner and deny the rest', async () => {
    const state = stateFor('owner-' + contenders);
    const outcome = await runConcurrentOwnerClaims(state, contenders);
    assert.equal(outcome.persistedOwners, 1);
    const created = outcome.attempts.filter((attempt) =>
      attempt.status === 201 && attempt.body.kind === 'owner-created' && attempt.body.changes === 1);
    const rejected = outcome.attempts.filter((attempt) =>
      attempt.status === 409 && (
        (attempt.body.kind === 'owner-already-claimed' && attempt.body.changes === 0) ||
        attempt.body.kind === 'contention-rejected'
      ));
    assert.equal(created.length, 1, 'Exactly one concurrent request must report a durable Owner creation with changes=1');
    assert.equal(rejected.length, contenders - 1, 'Every other concurrent Owner claim must be explicitly denied');
    assert.equal(created.length + rejected.length, contenders, 'No concurrent claim may have an ambiguous outcome');
  }, { timeout: 120000 });
}

test('D1_LOCAL REC-01: two distinct synthetic devices and recovery-device revocation', () => {
  const state = stateFor('recovery');
  prepare(state);
  const output = runStatementBatch(state, [
    "INSERT INTO owner_claims (owner_id, owner_key, created_at) VALUES (1, 'TEST-OWNER-RECOVERY', " + testTime + ')',
    "INSERT INTO recovery_devices (device_id, owner_id, device_kind) VALUES ('TEST-DEVICE-PRIMARY-A', 1, 'primary')",
    "INSERT INTO recovery_devices (device_id, owner_id, device_kind) VALUES ('TEST-DEVICE-RECOVERY-B', 1, 'recovery')",
    'SELECT device_id, device_kind FROM recovery_devices ORDER BY device_kind',
    "UPDATE recovery_devices SET revoked_at = " + testTime + " WHERE device_id = 'TEST-DEVICE-RECOVERY-B' AND device_kind = 'recovery' AND revoked_at IS NULL",
    "SELECT COUNT(*) AS count FROM recovery_devices WHERE device_kind = 'recovery' AND revoked_at IS NULL",
    "SELECT revoked_at FROM recovery_devices WHERE device_id = 'TEST-DEVICE-RECOVERY-B'",
  ]);
  const devices = rowsAt(output, 3);
  assert.equal(devices.length, 2);
  assert.equal(new Set(devices.map((row) => row.device_id)).size, 2);
  assert.equal(devices.filter((row) => row.device_kind === 'primary').length, 1);
  assert.equal(devices.filter((row) => row.device_kind === 'recovery').length, 1);
  assert.equal(rowsAt(output, 5)[0].count, 0, 'Revoked recovery device must not remain eligible');
  assert.notEqual(rowsAt(output, 6)[0].revoked_at, null);
});

test('D1_LOCAL CHAL-01 MODEL_NO_SIGNATURE: origin, RP, expiry, atomic one-time consume and replay denial', () => {
  const state = stateFor('challenge');
  prepare(state);
  const output = runStatementBatch(state, [
    "INSERT INTO one_time_challenges (challenge_hash, origin, rp_id, expires_at) VALUES ('TEST-NONCE-HASH-001', '" + expectedOrigin + "', '" + expectedRpId + "', " + (testTime + 120) + ')',
    "UPDATE one_time_challenges SET consumed_at = " + (testTime + 1) + " WHERE challenge_hash = 'TEST-NONCE-HASH-001' AND consumed_at IS NULL AND expires_at > " + testTime + " AND origin = 'https://attacker.example.test' AND rp_id = '" + expectedRpId + "'",
    "SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = 'TEST-NONCE-HASH-001'",
    "UPDATE one_time_challenges SET consumed_at = " + (testTime + 1) + " WHERE challenge_hash = 'TEST-NONCE-HASH-001' AND consumed_at IS NULL AND expires_at > " + testTime + " AND origin = '" + expectedOrigin + "' AND rp_id = 'attacker.example.test'",
    "SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = 'TEST-NONCE-HASH-001'",
    "UPDATE one_time_challenges SET consumed_at = " + (testTime + 1) + " WHERE challenge_hash = 'TEST-NONCE-HASH-001' AND consumed_at IS NULL AND expires_at > " + (testTime + 121) + " AND origin = '" + expectedOrigin + "' AND rp_id = '" + expectedRpId + "'",
    "SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = 'TEST-NONCE-HASH-001'",
    "UPDATE one_time_challenges SET consumed_at = " + (testTime + 1) + " WHERE challenge_hash = 'TEST-NONCE-HASH-001' AND consumed_at IS NULL AND expires_at > " + testTime + " AND origin = '" + expectedOrigin + "' AND rp_id = '" + expectedRpId + "'",
    "SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = 'TEST-NONCE-HASH-001'",
    "UPDATE one_time_challenges SET consumed_at = " + (testTime + 2) + " WHERE challenge_hash = 'TEST-NONCE-HASH-001' AND consumed_at IS NULL AND expires_at > " + testTime + " AND origin = '" + expectedOrigin + "' AND rp_id = '" + expectedRpId + "'",
    "SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = 'TEST-NONCE-HASH-001'",
  ]);
  const consumedAt = [rowsAt(output, 2), rowsAt(output, 4), rowsAt(output, 6), rowsAt(output, 8), rowsAt(output, 10)].map((rows) => rows[0].consumed_at);
  assert.deepEqual(consumedAt, [null, null, null, testTime + 1, testTime + 1]);
});

test('D1_LOCAL SESSION-01 MODEL_ONLY: synthetic sessions store only hashes and enforce expiry/revocation', () => {
  const state = stateFor('session');
  prepare(state);
  const fakeToken = 'TEST-SESSION-TOKEN-ONLY-IN-MEMORY-001';
  const tokenHash = createHash('sha256').update(fakeToken).digest('hex');
  const output = runStatementBatch(state, [
    "INSERT INTO owner_claims (owner_id, owner_key, created_at) VALUES (1, 'TEST-OWNER-SESSION', " + testTime + ')',
    "INSERT INTO synthetic_sessions (token_hash, owner_id, expires_at) VALUES ('" + tokenHash + "', 1, " + (testTime + 10) + ')',
    'SELECT token_hash FROM synthetic_sessions',
    "SELECT COUNT(*) AS count FROM synthetic_sessions WHERE token_hash = '" + tokenHash + "' AND expires_at > " + (testTime + 9) + ' AND revoked_at IS NULL',
    "SELECT COUNT(*) AS count FROM synthetic_sessions WHERE token_hash = '" + tokenHash + "' AND expires_at > " + (testTime + 10) + ' AND revoked_at IS NULL',
    "UPDATE synthetic_sessions SET revoked_at = " + testTime + " WHERE token_hash = '" + tokenHash + "'",
    "SELECT COUNT(*) AS count FROM synthetic_sessions WHERE token_hash = '" + tokenHash + "' AND expires_at > " + (testTime + 1) + ' AND revoked_at IS NULL',
  ]);
  const rows = rowsAt(output, 2);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].token_hash, tokenHash);
  assert.equal(JSON.stringify(rows).includes(fakeToken), false, 'Raw synthetic token must not appear in persisted rows');
  assert.equal(rowsAt(output, 3)[0].count, 1);
  assert.equal(rowsAt(output, 4)[0].count, 0);
  assert.equal(rowsAt(output, 6)[0].count, 0);
});

test('D1_LOCAL ARTICLE-01: revision compare-and-swap accepts one writer and rejects stale writer', () => {
  const state = stateFor('article-cas');
  prepare(state);
  const output = runStatementBatch(state, [
    "INSERT INTO articles (article_id, revision, body) VALUES ('article-synthetic-cas', 1, 'synthetic-revision-one')",
    "UPDATE articles SET revision = 2, body = 'synthetic-revision-two' WHERE article_id = 'article-synthetic-cas' AND revision = 1",
    "SELECT revision, body FROM articles WHERE article_id = 'article-synthetic-cas'",
    "UPDATE articles SET revision = 3, body = 'stale-writer-must-not-commit' WHERE article_id = 'article-synthetic-cas' AND revision = 1",
    "SELECT revision, body FROM articles WHERE article_id = 'article-synthetic-cas'",
    "SELECT COUNT(*) AS count FROM article_revisions WHERE article_id = 'article-synthetic-cas'",
  ]);
  assert.equal(rowsAt(output, 2)[0].revision, 2);
  const article = rowsAt(output, 4)[0];
  assert.equal(article.revision, 2);
  assert.equal(article.body, 'synthetic-revision-two');
  assert.equal(rowsAt(output, 5)[0].count, 1);
});

test('D1_LOCAL ARTICLE-02: failed audit trigger rolls back article revision and trigger rows', () => {
  const state = stateFor('article-rollback');
  prepare(state);
  runStatementBatch(state, [
    "INSERT INTO articles (article_id, revision, body) VALUES ('article-synthetic-rollback', 1, 'before-failure')",
    'UPDATE audit_failure_switch SET enabled = 1 WHERE id = 1',
  ]);
  const failed = runD1(state, ['--command', "UPDATE articles SET revision = 2, body = 'must-rollback' WHERE article_id = 'article-synthetic-rollback' AND revision = 1"], { expectedSuccess: false });
  assert.notEqual(failed.status, 0, 'Injected downstream audit failure must reject the SQL statement');
  assert.match(String(failed.stderr || failed.stdout), /synthetic audit failure/i);
  const verify = runStatementBatch(state, [
    "SELECT revision, body FROM articles WHERE article_id = 'article-synthetic-rollback'",
    "SELECT COUNT(*) AS count FROM article_revisions WHERE article_id = 'article-synthetic-rollback'",
    "SELECT COUNT(*) AS count FROM article_audit WHERE article_id = 'article-synthetic-rollback'",
  ]);
  assert.equal(rowsAt(verify, 0)[0].revision, 1);
  assert.equal(rowsAt(verify, 1)[0].count, 0);
  assert.equal(rowsAt(verify, 2)[0].count, 0);
});

test('D1_LOCAL RESTORE-01: synthetic fixture reset and restore recover only fake records', () => {
  const state = stateFor('restore');
  prepare(state);
  const seedSql = readFileSync(path.join(repositoryRoot, seedRelative), 'utf8');
  assertSyntheticPayload(seedSql);
  const baseline = { owners: 1, devices: 2, challenges: 1, sessions: 1, articles: 1 };
  const countStatements = [
    'SELECT COUNT(*) AS count FROM owner_claims',
    'SELECT COUNT(*) AS count FROM recovery_devices',
    'SELECT COUNT(*) AS count FROM one_time_challenges',
    'SELECT COUNT(*) AS count FROM synthetic_sessions',
    'SELECT COUNT(*) AS count FROM articles',
  ];
  const selectCounts = (output, firstIndex) => Object.fromEntries(
    ['owners', 'devices', 'challenges', 'sessions', 'articles'].map((key, offset) => [key, rowsAt(output, firstIndex + offset)[0].count]),
  );
  const output = runStatementBatch(state, [
    seedSql,
    ...countStatements,
    'DELETE FROM article_audit; DELETE FROM article_revisions; DELETE FROM articles; DELETE FROM synthetic_sessions; DELETE FROM one_time_challenges; DELETE FROM recovery_devices; DELETE FROM owner_claims',
    ...countStatements,
    seedSql,
    ...countStatements,
  ]);
  assert.deepEqual(selectCounts(output, 7), baseline);
  assert.deepEqual(selectCounts(output, 19), { owners: 0, devices: 0, challenges: 0, sessions: 0, articles: 0 });
  assert.deepEqual(selectCounts(output, 31), baseline);
  assert.equal(seedSql.includes('TEST-SESSION-TOKEN-ONLY-IN-MEMORY'), false, 'Fixture contains only a fake digest, never raw token');
});

test('D1_LOCAL FAIL-01: preflight fails closed before invalid or oversized input reaches Wrangler', () => {
  const invalid = { ...config, d1_databases: [] };
  assert.throws(() => assertSyntheticD1Config(invalid), /binding/i);
  assert.throws(() => assertLocalD1Command(['d1', 'execute', SYNTHETIC_BINDING, '--remote', '--config', configRelative, '--persist-to', stateRoot + '/fail', '--command', 'SELECT 1'], { repositoryRoot, configRelative }), /remote/i);
  assert.throws(() => assertSyntheticPayload('x'.repeat(64 * 1024 + 1)), /payload/i);
  assert.equal(process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '', '', 'No Cloudflare token may enter the test process');
});
