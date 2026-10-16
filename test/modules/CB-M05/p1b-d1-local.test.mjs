import assert from 'node:assert/strict';
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { convertV4MiniflareOptions, Miniflare, NoOpLog } from 'miniflare';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import {
  P1B_CONFIG_PATH,
  P1B_SCHEMA_PATH,
  P1B_SYNTHETIC_BINDING,
  assertP1BLocalD1Command,
  assertP1BSyntheticD1Config,
  assertP1BSyntheticSql,
} from '../../../src/modules/CB-M05/p1b-local/d1-guardrails.mjs';
import {
  SYNTHETIC_ORIGIN,
  SYNTHETIC_RP_ID,
  makeAuthenticationResponse,
  makeRegistrationResponse,
  makeSyntheticAuthenticator,
  verifyBoundSyntheticAuthentication,
} from '../../../src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs';

const repositoryRoot = process.cwd();
const config = JSON.parse(readFileSync(path.join(repositoryRoot, P1B_CONFIG_PATH), 'utf8'));
const schemaSql = readFileSync(path.join(repositoryRoot, P1B_SCHEMA_PATH), 'utf8');
const schemaStatements = schemaSql.split(/;\s*(?=(?:CREATE|INSERT)\b|$)/iu).map((statement) => statement.trim()).filter(Boolean);
const configRelative = P1B_CONFIG_PATH;
const schemaRelative = P1B_SCHEMA_PATH;
const testTime = 1792022400;
const challengeAction = 'owner-authentication';
const challengeAudience = 'coinblink-owner-local-test';
const ignoredStateRoot = '.wrangler/p1b-local-state';
const runId = new Date().toISOString().replace(/[^0-9TZ]/g, '') + '-' + randomUUID().slice(0, 8);
const wranglerScript = path.join(repositoryRoot, 'node_modules/wrangler/bin/wrangler.js');

assertP1BSyntheticD1Config(config);
assert.match(readFileSync(path.join(repositoryRoot, '.gitignore'), 'utf8'), /^\.wrangler\/$/m);
assert.ok(existsSync(wranglerScript), 'Wrangler must already exist in node_modules; no install fallback is allowed here');

function safeEnvironment() {
  const env = { ...process.env, WRANGLER_SEND_METRICS: 'false', NO_UPDATE_NOTIFIER: '1', CI: '1' };
  for (const key of Object.keys(env)) {
    if (/^(CLOUDFLARE|CF_|WRANGLER)/i.test(key)) delete env[key];
  }
  return env;
}

function stateFor(caseName) {
  const safeName = caseName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const stateRelative = ignoredStateRoot + '/' + runId + '/' + safeName;
  const absolute = path.resolve(repositoryRoot, stateRelative);
  const relative = path.relative(repositoryRoot, absolute);
  assert.ok(relative.startsWith(path.join(ignoredStateRoot, runId)), 'D1 LOCAL state must stay under ignored P1B directory');
  assertP1BLocalD1Command(argsFor(stateRelative, '--file', schemaRelative), { repositoryRoot, configRelative });
  mkdirSync(absolute, { recursive: true });
  return stateRelative;
}

function argsFor(stateRelative, inputFlag, input) {
  return [
    'd1', 'execute', P1B_SYNTHETIC_BINDING,
    '--local', '--config', configRelative,
    '--persist-to', stateRelative,
    inputFlag, input,
    '--json',
  ];
}

function parseJsonOutput(stdout) {
  const start = stdout.indexOf('[');
  assert.notEqual(start, -1, 'Wrangler --json output must contain a JSON result array');
  const parsed = JSON.parse(stdout.slice(start));
  assert.ok(Array.isArray(parsed));
  assert.ok(parsed.every((item) => item.success === true));
  return parsed;
}

function runD1(stateRelative, inputFlag, input, { expectedSuccess = true } = {}) {
  assertP1BLocalD1Command(argsFor(stateRelative, inputFlag, input), { repositoryRoot, configRelative });
  if (inputFlag === '--command') assertP1BSyntheticSql(input);
  const result = spawnSync(process.execPath, [wranglerScript, ...argsFor(stateRelative, inputFlag, input)], {
    cwd: repositoryRoot,
    env: safeEnvironment(),
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (!expectedSuccess) return result;
  assert.equal(result.status, 0, 'D1 LOCAL failed: ' + String(result.stderr || result.stdout).slice(0, 1200));
  return parseJsonOutput(result.stdout);
}

function prepare(stateRelative) {
  return runD1(stateRelative, '--file', schemaRelative);
}

function rowsAt(output, index) {
  return output[index]?.results ?? [];
}

function quoteSql(value) {
  return "'" + String(value).replaceAll("'", "''") + "'";
}

function challengeHash(challenge) {
  return createHash('sha256').update(challenge, 'utf8').digest('hex');
}

async function registeredCredential(authenticator) {
  const challenge = 'TEST-REGISTRATION-' + authenticator.label + '-' + randomUUID();
  const result = await verifyRegistrationResponse({
    response: makeRegistrationResponse(authenticator, { challenge }),
    expectedChallenge: challenge,
    expectedOrigin: SYNTHETIC_ORIGIN,
    expectedRPID: SYNTHETIC_RP_ID,
    requireUserPresence: true,
    requireUserVerification: true,
  });
  assert.equal(result.verified, true);
  return result.registrationInfo.credential;
}

async function verifyActualAssertion(authenticator, credential, challenge) {
  const response = makeAuthenticationResponse(authenticator, { challenge });
  const result = await verifyBoundSyntheticAuthentication({
    response,
    expectedChallenge: challenge,
    expectedOrigin: SYNTHETIC_ORIGIN,
    expectedRPID: SYNTHETIC_RP_ID,
    requireUserVerification: true,
    credential,
  });
  assert.equal(result.verified, true);
  return response;
}

function makeWorkerScript() {
  return `
    const P1B_SCHEMA_STATEMENTS = ${JSON.stringify(schemaStatements)};
    const barriers = new Map();
    const arrivals = new Map();
    async function waitAtBarrier(key, expected) {
      if (expected <= 1) return true;
      if (!barriers.has(key)) {
        let release;
        const promise = new Promise((resolve) => { release = resolve; });
        barriers.set(key, { promise, release });
      }
      const barrier = barriers.get(key);
      const count = (arrivals.get(key) || 0) + 1;
      arrivals.set(key, count);
      if (count === expected) barrier.release(true);
      if (count > expected) return false;
      return await Promise.race([barrier.promise.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 20000))]);
    }
    export default {
      async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === '/health') {
          const result = await env.${P1B_SYNTHETIC_BINDING}.prepare('SELECT COUNT(*) AS owners FROM owner_claims').first();
          return Response.json({ local: true, owners: result.owners });
        }
        if (url.pathname === '/initialize' && request.method === 'POST') {
          for (const statement of P1B_SCHEMA_STATEMENTS) await env.${P1B_SYNTHETIC_BINDING}.prepare(statement).run();
          const result = await env.${P1B_SYNTHETIC_BINDING}.prepare('SELECT COUNT(*) AS owners FROM owner_claims').first();
          return Response.json({ local: true, owners: result.owners });
        }
        if (url.pathname === '/execute-batch' && request.method === 'POST') {
          const input = await request.json();
          if (!Array.isArray(input.statements) || !input.statements.every((statement) => typeof statement === 'string')) {
            return Response.json({ kind: 'invalid-local-test-batch' }, { status: 400 });
          }
          try {
            const results = await env.${P1B_SYNTHETIC_BINDING}.batch(input.statements.map((statement) => env.${P1B_SYNTHETIC_BINDING}.prepare(statement)));
            return Response.json({ results: results.map((result) => ({ results: result.results || [], changes: result.meta?.changes ?? 0 })) });
          } catch (error) {
            return Response.json({ kind: 'local-test-batch-failed', detail: String(error).slice(0, 240) }, { status: 409 });
          }
        }
        if (url.pathname === '/owner-claim' && request.method === 'POST') {
          const input = await request.json();
          const ready = await waitAtBarrier('owner-' + input.expected, input.expected);
          if (!ready) return Response.json({ kind: 'barrier-timeout' }, { status: 425 });
          try {
            const result = await env.${P1B_SYNTHETIC_BINDING}.prepare(
              'INSERT INTO owner_claims (owner_id, owner_key, created_at) VALUES (?, ?, ?) ON CONFLICT(owner_id) DO NOTHING'
            ).bind(1, input.ownerKey, input.createdAt).run();
            if (result.meta.changes === 1) return Response.json({ kind: 'owner-created', changes: 1, ownerKey: input.ownerKey }, { status: 201 });
            if (result.meta.changes === 0) return Response.json({ kind: 'owner-already-exists', changes: 0 }, { status: 409 });
            return Response.json({ kind: 'unexpected-change-count', changes: result.meta?.changes }, { status: 500 });
          } catch (error) {
            if (/SQLITE_BUSY|database is locked|transaction/i.test(String(error))) {
              return Response.json({ kind: 'contention-denied' }, { status: 409 });
            }
            return Response.json({ kind: 'unexpected-error', detail: String(error).slice(0, 240) }, { status: 500 });
          }
        }
        if (url.pathname === '/consume-challenge' && request.method === 'POST') {
          const input = await request.json();
          const ready = await waitAtBarrier('challenge-' + input.expected, input.expected);
          if (!ready) return Response.json({ kind: 'barrier-timeout' }, { status: 425 });
          try {
            const result = await env.${P1B_SYNTHETIC_BINDING}.prepare(
              'UPDATE one_time_challenges SET consumed_at = ? WHERE challenge_hash = ? AND action = ? AND audience = ? AND origin = ? AND rp_id = ? AND consumed_at IS NULL AND expires_at > ?'
            ).bind(input.now, input.challengeHash, input.action, input.audience, input.origin, input.rpId, input.now).run();
            if (result.meta.changes === 1) return Response.json({ kind: 'challenge-consumed', changes: 1 }, { status: 200 });
            if (result.meta.changes === 0) return Response.json({ kind: 'challenge-denied', changes: 0 }, { status: 409 });
            return Response.json({ kind: 'unexpected-change-count', changes: result.meta?.changes }, { status: 500 });
          } catch (error) {
            if (/SQLITE_BUSY|database is locked|transaction/i.test(String(error))) {
              return Response.json({ kind: 'challenge-contention-denied' }, { status: 409 });
            }
            return Response.json({ kind: 'unexpected-error', detail: String(error).slice(0, 240) }, { status: 500 });
          }
        }
        if (url.pathname === '/atomic-session' && request.method === 'POST') {
          const input = await request.json();
          try {
            const result = await env.${P1B_SYNTHETIC_BINDING}.batch([
              env.${P1B_SYNTHETIC_BINDING}.prepare(
                'UPDATE one_time_challenges SET consumed_at = ? WHERE challenge_hash = ? AND action = ? AND audience = ? AND origin = ? AND rp_id = ? AND consumed_at IS NULL AND expires_at > ?'
              ).bind(input.now, input.challengeHash, input.action, input.audience, input.origin, input.rpId, input.now),
              env.${P1B_SYNTHETIC_BINDING}.prepare(
                'INSERT INTO synthetic_sessions (token_digest, csrf_digest, owner_id, created_at, expires_at) VALUES (?, ?, 1, ?, ?)'
              ).bind(input.tokenDigest, input.csrfDigest, input.now, input.expiresAt),
            ]);
            const consumed = result[0]?.meta?.changes === 1;
            if (consumed) return Response.json({ kind: 'session-created', changes: 1 }, { status: 201 });
            return Response.json({ kind: 'challenge-denied', changes: 0 }, { status: 409 });
          } catch (error) {
            return Response.json({
              kind: /synthetic session insert failed/i.test(String(error)) ? 'session-insert-failed' : 'atomic-batch-failed',
              detail: String(error).slice(0, 240),
            }, { status: 409 });
          }
        }
        return new Response('not found', { status: 404 });
      }
    };
  `;
}

async function createLocalD1(stateRelative, name) {
  const resolvedState = path.resolve(repositoryRoot, stateRelative);
  const miniflare = new Miniflare(convertV4MiniflareOptions({
    name: 'coinblink-m05-p1b-' + name,
    script: makeWorkerScript(),
    modules: true,
    compatibilityDate: config.compatibility_date,
    d1Databases: { [P1B_SYNTHETIC_BINDING]: config.d1_databases[0].database_id },
    resourcePersistencePath: resolvedState,
    log: new NoOpLog(),
  }));
  try {
    const response = await miniflare.dispatchFetch('http://p1b.local.test/initialize', { method: 'POST' });
    const body = await response.text();
    assert.equal(response.status, 200, 'Miniflare LOCAL D1 schema must initialize from the allowlisted synthetic fixture: ' + body.slice(0, 400));
    assert.deepEqual(JSON.parse(body), { local: true, owners: 0 });
    return miniflare;
  } catch (error) {
    await miniflare.dispose();
    throw error;
  }
}

async function postJson(miniflare, route, body) {
  const response = await miniflare.dispatchFetch('http://p1b.local.test' + route, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function runLocalSql(miniflare, statements, { expectedSuccess = true } = {}) {
  const outcome = await postJson(miniflare, '/execute-batch', { statements });
  if (!expectedSuccess) return outcome;
  assert.equal(outcome.status, 200, 'D1 LOCAL Workerd batch failed: ' + JSON.stringify(outcome.body));
  return outcome.body.results;
}

for (const contenders of [2, 10, 100]) {
  test('D1_LOCAL OWNER-01: ' + contenders + ' concurrent Workerd requests create exactly one Owner and explicitly reject the rest', async () => {
    const state = stateFor('owner-' + contenders);
    const miniflare = await createLocalD1(state, 'owner-' + contenders);
    try {
      const health = await miniflare.dispatchFetch('http://p1b.local.test/health');
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), { local: true, owners: 0 });
      const attempts = await Promise.all(Array.from({ length: contenders }, (_, index) =>
        postJson(miniflare, '/owner-claim', {
          expected: contenders,
          ownerKey: 'TEST-OWNER-' + contenders + '-' + index,
          createdAt: testTime,
        })));

      assert.equal(attempts.filter((attempt) => attempt.status === 425).length, 0, 'every request must reach the genuine local-D1 barrier');
      const created = attempts.filter((attempt) => attempt.status === 201 && attempt.body.kind === 'owner-created' && attempt.body.changes === 1);
      const rejected = attempts.filter((attempt) => attempt.status === 409 && (
        (attempt.body.kind === 'owner-already-exists' && attempt.body.changes === 0) ||
        attempt.body.kind === 'contention-denied'
      ));
      assert.equal(created.length, 1, 'exactly one independent request must report a committed Owner creation: ' + JSON.stringify(attempts));
      assert.equal(rejected.length, contenders - 1, 'every losing Owner claim must have an explicit conflict result: ' + JSON.stringify(attempts));
      assert.equal(created.length + rejected.length, contenders, 'no request outcome may be ambiguous');

      const output = await runLocalSql(miniflare, ['SELECT owner_id, owner_key FROM owner_claims']);
      const owners = rowsAt(output, 0);
      assert.equal(owners.length, 1, 'the database itself must persist exactly one Owner');
      assert.equal(owners[0].owner_id, 1);
      assert.equal(owners[0].owner_key, created[0].body.ownerKey);
    } finally {
      await miniflare.dispose();
    }
  }, { timeout: 180000 });
}

test('D1_LOCAL + REAL_CRYPTO WA-02/WA-06: a real signed assertion consumes its bound challenge once and concurrent replay is denied', async () => {
  const state = stateFor('real-crypto-challenge-replay');
  const authenticator = makeSyntheticAuthenticator('primary');
  const credential = await registeredCredential(authenticator);
  const challenge = randomBytes(32).toString('base64url');
  const validResponse = await verifyActualAssertion(authenticator, credential, challenge);
  assert.equal(validResponse.response.clientDataJSON.length > 0, true);

  const hash = challengeHash(challenge);
  const miniflare = await createLocalD1(state, 'challenge-replay');
  try {
    await runLocalSql(miniflare, [
    "INSERT INTO one_time_challenges (challenge_hash, action, audience, origin, rp_id, issued_at, expires_at) VALUES (" +
      [hash, challengeAction, challengeAudience, SYNTHETIC_ORIGIN, SYNTHETIC_RP_ID].map(quoteSql).join(', ') + ', ' + testTime + ', ' + (testTime + 120) + ')',
    ]);
    const attempts = await Promise.all(Array.from({ length: 10 }, async () => {
      const verification = await verifyBoundSyntheticAuthentication({
        response: validResponse,
        expectedChallenge: challenge,
        expectedOrigin: SYNTHETIC_ORIGIN,
        expectedRPID: SYNTHETIC_RP_ID,
        requireUserVerification: true,
        credential,
      });
      assert.equal(verification.verified, true);
      return postJson(miniflare, '/consume-challenge', {
        expected: 10,
        challengeHash: hash,
        action: challengeAction,
        audience: challengeAudience,
        origin: SYNTHETIC_ORIGIN,
        rpId: SYNTHETIC_RP_ID,
        now: testTime + 1,
      });
    }));
    const accepted = attempts.filter((attempt) => attempt.status === 200 && attempt.body.kind === 'challenge-consumed' && attempt.body.changes === 1);
    const denied = attempts.filter((attempt) => attempt.status === 409 && (
      (attempt.body.kind === 'challenge-denied' && attempt.body.changes === 0) || attempt.body.kind === 'challenge-contention-denied'
    ));
    assert.equal(accepted.length, 1);
    assert.equal(denied.length, 9);
    assert.equal(accepted.length + denied.length, attempts.length);
    const consumed = rowsAt(await runLocalSql(miniflare, ['SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = ' + quoteSql(hash)]), 0);
    assert.equal(consumed.length, 1);
    assert.equal(consumed[0].consumed_at, testTime + 1);
  } finally {
    await miniflare.dispose();
  }
});

test('D1_LOCAL WA-02: wrong action/audience and expiry cannot consume an otherwise valid challenge', async () => {
  const state = stateFor('bound-action-audience-expiry');
  const hashes = {
    bound: 'a'.repeat(64),
    expired: 'b'.repeat(64),
  };
  const miniflare = await createLocalD1(state, 'challenge-binding');
  await runLocalSql(miniflare, [
    "INSERT INTO one_time_challenges (challenge_hash, action, audience, origin, rp_id, issued_at, expires_at) VALUES (" +
      [hashes.bound, challengeAction, challengeAudience, SYNTHETIC_ORIGIN, SYNTHETIC_RP_ID].map(quoteSql).join(', ') + ', ' + testTime + ', ' + (testTime + 60) + ')',
    "INSERT INTO one_time_challenges (challenge_hash, action, audience, origin, rp_id, issued_at, expires_at) VALUES (" +
      [hashes.expired, challengeAction, challengeAudience, SYNTHETIC_ORIGIN, SYNTHETIC_RP_ID].map(quoteSql).join(', ') + ', ' + (testTime - 300) + ', ' + (testTime - 1) + ')',
  ]);
  const request = (challengeHash, action = challengeAction, audience = challengeAudience, now = testTime + 1) => postJson(miniflare, '/consume-challenge', {
    expected: 1,
    challengeHash,
    action,
    audience,
    origin: SYNTHETIC_ORIGIN,
    rpId: SYNTHETIC_RP_ID,
    now,
  });
  try {
    assert.equal((await request(hashes.bound, 'different-action')).status, 409);
    assert.equal((await request(hashes.bound, challengeAction, 'different-audience')).status, 409);
    assert.equal((await request(hashes.expired, challengeAction, challengeAudience, testTime + 1)).status, 409);
    const valid = await request(hashes.bound);
    assert.equal(valid.status, 200);
    const output = await runLocalSql(miniflare, [
      'SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = ' + quoteSql(hashes.bound),
      'SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = ' + quoteSql(hashes.expired),
    ]);
    assert.equal(rowsAt(output, 0)[0].consumed_at, testTime + 1);
    assert.equal(rowsAt(output, 1)[0].consumed_at, null);
  } finally {
    await miniflare.dispose();
  }
});

test('D1_LOCAL WA-04/WA-05/REC-01: public keys only, distinct Owner devices, duplicate IDs, and revocation fail closed', async () => {
  const state = stateFor('owner-credentials-and-recovery');
  const miniflare = await createLocalD1(state, 'owner-credentials-and-recovery');
  const primary = makeSyntheticAuthenticator('primary');
  const recovery = makeSyntheticAuthenticator('recovery');
  const primaryCredential = await registeredCredential(primary);
  const recoveryCredential = await registeredCredential(recovery);
  try {
    await runLocalSql(miniflare, [
    "INSERT INTO owner_claims (owner_id, owner_key, created_at) VALUES (1, 'TEST-SOLE-OWNER', " + testTime + ')',
    "INSERT INTO owner_credentials (credential_id, owner_id, public_key, sign_count, device_kind, created_at) VALUES (" +
      [primaryCredential.id, '1'].map(quoteSql).join(', ') + ', X\'' + Buffer.from(primaryCredential.publicKey).toString('hex') + "', 0, 'primary', " + testTime + ')',
    "INSERT INTO owner_credentials (credential_id, owner_id, public_key, sign_count, device_kind, created_at) VALUES (" +
      [recoveryCredential.id, '1'].map(quoteSql).join(', ') + ', X\'' + Buffer.from(recoveryCredential.publicKey).toString('hex') + "', 0, 'recovery', " + testTime + ')',
    ]);

    const active = await runLocalSql(miniflare, [
      "SELECT credential_id, owner_id, length(public_key) AS public_key_bytes, sign_count, device_kind, revoked_at FROM owner_credentials WHERE owner_id = 1 AND revoked_at IS NULL ORDER BY device_kind",
      "SELECT COUNT(DISTINCT credential_id) AS distinct_devices FROM owner_credentials WHERE owner_id = 1 AND revoked_at IS NULL",
    ]);
    assert.equal(rowsAt(active, 0).length, 2);
    assert.equal(rowsAt(active, 1)[0].distinct_devices, 2);
    assert.ok(rowsAt(active, 0).every((row) => row.public_key_bytes > 0 && row.sign_count === 0 && row.revoked_at === null));
    assert.equal(rowsAt(active, 0).map((row) => row.device_kind).sort().join(','), 'primary,recovery');
    assert.equal(JSON.stringify(rowsAt(active, 0)).includes(primary.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()), false);

    const duplicateId = await runLocalSql(miniflare, [
      "INSERT INTO owner_credentials (credential_id, owner_id, public_key, sign_count, device_kind, created_at) VALUES (" +
        [primaryCredential.id, '1'].map(quoteSql).join(', ') + ', X\'' + Buffer.from(primaryCredential.publicKey).toString('hex') + "', 0, 'recovery', " + (testTime + 1) + ')',
    ], { expectedSuccess: false });
    assert.equal(duplicateId.status, 409, 'duplicate credential ID must be rejected by the real D1 primary key');
    assert.equal(duplicateId.body.kind, 'local-test-batch-failed');

    const activeRecovery = rowsAt(await runLocalSql(miniflare, [
      "SELECT COUNT(DISTINCT credential_id) AS count FROM owner_credentials WHERE owner_id = 1 AND device_kind IN ('primary', 'recovery') AND revoked_at IS NULL",
    ]), 0)[0].count;
    assert.equal(activeRecovery, 2);
    await runLocalSql(miniflare, ["UPDATE owner_credentials SET revoked_at = " + (testTime + 2) + " WHERE credential_id = " + quoteSql(recoveryCredential.id) + " AND revoked_at IS NULL"]);
    const afterRevocation = rowsAt(await runLocalSql(miniflare, [
      "SELECT COUNT(DISTINCT credential_id) AS count FROM owner_credentials WHERE owner_id = 1 AND device_kind IN ('primary', 'recovery') AND revoked_at IS NULL",
    ]), 0)[0].count;
    assert.equal(afterRevocation, 1, 'revoked second device cannot satisfy the two-device recovery rule');
    const emailOnly = rowsAt(await runLocalSql(miniflare, [
      "SELECT COUNT(*) AS count FROM owner_credentials WHERE owner_id = 1 AND revoked_at IS NULL AND device_kind IN ('primary', 'recovery')",
    ]), 0)[0].count;
    assert.equal(emailOnly, 1, 'an email string alone creates no credential proof and cannot restore access');
  } finally {
    await miniflare.dispose();
  }
});

test('D1_LOCAL SES-01: opaque 256-bit token is stored as HMAC digest only with expiry, revocation, rotation, and fixation denial', async () => {
  const state = stateFor('session-lifecycle');
  const miniflare = await createLocalD1(state, 'session-lifecycle');
  const token = randomBytes(32);
  const csrf = randomBytes(32);
  const hmacKey = randomBytes(32);
  const tokenString = token.toString('base64url');
  const digest = createHmac('sha256', hmacKey).update(token).digest('hex');
  const csrfDigest = createHash('sha256').update(csrf).digest('hex');
  const rotatedToken = randomBytes(32);
  const rotatedDigest = createHmac('sha256', hmacKey).update(rotatedToken).digest('hex');
  try {
    const output = await runLocalSql(miniflare, [
    "INSERT INTO owner_claims (owner_id, owner_key, created_at) VALUES (1, 'TEST-SESSION-OWNER', " + testTime + ')',
    "INSERT INTO synthetic_sessions (token_digest, csrf_digest, owner_id, created_at, expires_at) VALUES (" +
      [digest, csrfDigest, '1'].map(quoteSql).join(', ') + ', ' + testTime + ', ' + (testTime + 60) + ')',
    'SELECT token_digest, csrf_digest, expires_at, revoked_at FROM synthetic_sessions ORDER BY created_at',
    "SELECT COUNT(*) AS count FROM synthetic_sessions WHERE token_digest = " + quoteSql(digest) + ' AND expires_at > ' + (testTime + 59) + ' AND revoked_at IS NULL',
    "SELECT COUNT(*) AS count FROM synthetic_sessions WHERE token_digest = " + quoteSql(digest) + ' AND expires_at > ' + (testTime + 60) + ' AND revoked_at IS NULL',
    "UPDATE synthetic_sessions SET revoked_at = " + (testTime + 10) + " WHERE token_digest = " + quoteSql(digest) + ' AND revoked_at IS NULL',
    "INSERT INTO synthetic_sessions (token_digest, csrf_digest, owner_id, created_at, expires_at, rotated_from) VALUES (" +
      [rotatedDigest, csrfDigest, '1'].map(quoteSql).join(', ') + ', ' + (testTime + 10) + ', ' + (testTime + 70) + ', ' + quoteSql(digest) + ')',
    'SELECT token_digest, rotated_from, revoked_at FROM synthetic_sessions ORDER BY created_at',
    "SELECT COUNT(*) AS count FROM synthetic_sessions WHERE token_digest = " + quoteSql(digest) + ' AND revoked_at IS NULL',
    ]);

    const rows = rowsAt(output, 2);
    assert.equal(rows.length, 1, 'the first read happens before rotation and must see only the original session');
    assert.notEqual(tokenString, rotatedToken.toString('base64url'), 'rotation must issue a fresh opaque value');
    assert.notEqual(digest, rotatedDigest, 'rotated session digest must not reuse a fixed session identifier');
    assert.ok(rows.every((row) => row.token_digest.length === 64 && row.csrf_digest.length === 64));
    assert.equal(JSON.stringify(rows).includes(tokenString), false, 'raw session token must never be written to D1 rows');
    assert.equal(rowsAt(output, 3)[0].count, 1);
    assert.equal(rowsAt(output, 4)[0].count, 0);
    assert.equal(rowsAt(output, 7).length, 2, 'rotation must retain the revoked original and new session audit rows');
    assert.notEqual(rowsAt(output, 7)[0].revoked_at, null, 'the old session must be revoked before rotation is recorded');
    assert.equal(rowsAt(output, 7)[1].rotated_from, digest);
    assert.equal(rowsAt(output, 8)[0].count, 0);
  } finally {
    await miniflare.dispose();
  }
});

test('D1_LOCAL D1-01: challenge consume and session creation roll back together then retry succeeds', async () => {
  const state = stateFor('atomic-session-rollback');
  const challenge = randomBytes(32).toString('base64url');
  const hash = challengeHash(challenge);
  const tokenDigest = createHmac('sha256', randomBytes(32)).update(randomBytes(32)).digest('hex');
  const csrfDigest = createHash('sha256').update(randomBytes(32)).digest('hex');
  const miniflare = await createLocalD1(state, 'atomic-session');
  await runLocalSql(miniflare, [
    "INSERT INTO owner_claims (owner_id, owner_key, created_at) VALUES (1, 'TEST-ATOMIC-OWNER', " + testTime + ')',
    "INSERT INTO one_time_challenges (challenge_hash, action, audience, origin, rp_id, issued_at, expires_at) VALUES (" +
      [hash, challengeAction, challengeAudience, SYNTHETIC_ORIGIN, SYNTHETIC_RP_ID].map(quoteSql).join(', ') + ', ' + testTime + ', ' + (testTime + 90) + ')',
    'UPDATE synthetic_session_failure_switch SET enabled = 1 WHERE id = 1',
  ]);
  const request = () => postJson(miniflare, '/atomic-session', {
    challengeHash: hash,
    action: challengeAction,
    audience: challengeAudience,
    origin: SYNTHETIC_ORIGIN,
    rpId: SYNTHETIC_RP_ID,
    now: testTime + 1,
    expiresAt: testTime + 3600,
    tokenDigest,
    csrfDigest,
  });
  try {
    const failed = await request();
    assert.equal(failed.status, 409);
    assert.equal(failed.body.kind, 'session-insert-failed');
    const afterFailure = await runLocalSql(miniflare, [
      'SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = ' + quoteSql(hash),
      'SELECT COUNT(*) AS count FROM synthetic_sessions WHERE token_digest = ' + quoteSql(tokenDigest),
    ]);
    assert.equal(rowsAt(afterFailure, 0)[0].consumed_at, null);
    assert.equal(rowsAt(afterFailure, 1)[0].count, 0);

    await runLocalSql(miniflare, ['UPDATE synthetic_session_failure_switch SET enabled = 0 WHERE id = 1']);
    const retried = await request();
    assert.equal(retried.status, 201);
    assert.equal(retried.body.kind, 'session-created');
    const afterRetry = await runLocalSql(miniflare, [
      'SELECT consumed_at FROM one_time_challenges WHERE challenge_hash = ' + quoteSql(hash),
      'SELECT COUNT(*) AS count FROM synthetic_sessions WHERE token_digest = ' + quoteSql(tokenDigest),
    ]);
    assert.equal(rowsAt(afterRetry, 0)[0].consumed_at, testTime + 1);
    assert.equal(rowsAt(afterRetry, 1)[0].count, 1);
  } finally {
    await miniflare.dispose();
  }
});

test('D1_LOCAL SEC-01: Wrangler LOCAL smoke uses the exact fixture and the runner strips Cloudflare environment names', () => {
  const state = stateFor('guardrail-smoke');
  const args = argsFor(state, '--file', schemaRelative);
  assert.equal(assertP1BLocalD1Command(args, { repositoryRoot, configRelative }), true);
  const output = prepare(state);
  assert.ok(output.length > 0);
  assert.ok(output.every((result) => result.success === true));
  const environment = safeEnvironment();
  assert.deepEqual(Object.keys(environment).filter((key) => /^(CLOUDFLARE|CF_|WRANGLER)/i.test(key)), []);
  assert.equal(process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || '', '', 'the test process must not carry Cloudflare auth');
});
