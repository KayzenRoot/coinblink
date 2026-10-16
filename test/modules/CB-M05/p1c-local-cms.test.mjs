import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { convertV4MiniflareOptions, Miniflare, NoOpLog } from 'miniflare';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { CMS_TEST_ORIGIN, CMS_TEST_RP_ID, createLocalCmsHandler } from '../../../src/modules/CB-M05/p1c-local/local-cms.mjs';
import { makeSyntheticAuthenticator, makeRegistrationResponse, makeAuthenticationResponse, tamperBase64Url } from '../../../src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs';

const schema = readFileSync('test/modules/CB-M05/p1c-fixtures/schema.sql', 'utf8');
const stateRoot = path.resolve('.wrangler/p1c-local-state');
const fakeOrigin = CMS_TEST_ORIGIN;
const sampleDraft = Object.freeze({
  title: 'Local CMS protects this example draft',
  summary: 'This is a synthetic local-only article with source attribution and no publication.',
  body: 'Synthetic editorial content never published by CoinBlink.',
  sourceUrl: 'https://example.test/evidence',
  authorLabel: 'Synthetic byline',
});
function key() { return randomBytes(32).toString('hex'); }
function seedIdempotency() { return randomBytes(24).toString('base64url'); }
function makeRequest(route, method = 'GET', body = undefined, {
  cookie = '', csrf = '', origin = fakeOrigin, fetchSite = 'same-origin',
} = {}) {
  const headers = { origin, 'sec-fetch-site': fetchSite, 'content-type': 'application/json' };
  if (cookie) headers.cookie = cookie;
  if (csrf) headers['x-cb-csrf'] = csrf;
  return new Request(fakeOrigin + route, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function setup() {
  // Isolated Workerd/Miniflare D1, with no --remote, credentials or Cloudflare account binding.
  mkdirSync(stateRoot, { recursive: true });
  const mf = new Miniflare(convertV4MiniflareOptions({
    name: 'coinblink-m05-p1c-synthetic-' + randomUUID(),
    script: 'export default { async fetch() { return new Response("LOCAL ONLY") } }',
    modules: true,
    compatibilityDate: '2026-10-13',
    d1Databases: { CMS_D1_LOCAL: '00000000-0000-4000-8000-000000000086' },
    resourcePersistencePath: path.join(stateRoot, randomUUID()),
    log: new NoOpLog(),
  }));
  try {
    const db = await mf.getD1Database('CMS_D1_LOCAL');
    // D1Database.exec() interprets comment-only and multiline SQL as separate lines.
    // Prepare each complete allowlisted migration statement instead of using exec().
    const statements = schema.replace(/\r/g, '').replace(/^\s*--.*$/gm, '')
      .split(/;\s*(?=(?:CREATE|PRAGMA)\b|$)/iu).map(s => s.trim()).filter(Boolean);
    assert.ok(statements.length >= 8, 'all local schema statements must be applied');
    for (const statement of statements) await db.prepare(statement).run();
    const primary = makeSyntheticAuthenticator('primary');
    const recovery = makeSyntheticAuthenticator('recovery');
    await db.prepare('INSERT INTO cms_owner(owner_id,created_at) VALUES (1,1)').run();
    for (const [authenticator, kind] of [[primary, 'primary'], [recovery, 'recovery']]) {
      const challenge = 'TEST-LOCAL-REG-' + randomUUID();
      const outcome = await verifyRegistrationResponse({
        response: makeRegistrationResponse(authenticator, { challenge }),
        expectedChallenge: challenge,
        expectedOrigin: fakeOrigin,
        expectedRPID: CMS_TEST_RP_ID,
        requireUserPresence: true,
        requireUserVerification: true,
      });
      assert.equal(outcome.verified, true);
      await db.prepare(
        'INSERT INTO cms_credentials(credential_id,owner_id,public_key,sign_count,device_kind) VALUES (?,1,?,0,?)'
      ).bind(authenticator.id, outcome.registrationInfo.credential.publicKey, kind).run();
    }
    let time = Date.now();
    const env = {
      CB_M05_LOCAL_TEST_ONLY: 'true',
      CMS_D1_LOCAL: db,
      CMS_TEST_HMAC_KEY: key(),
    };
    const handle = createLocalCmsHandler({ now: () => time });
    const run = async (route, method = 'GET', body = undefined, options = {}) =>
      handle(makeRequest(route, method, body, options), env);
    return { mf, db, env, run, primary, recovery, time: value => { time = value; } };
  } catch (error) {
    await mf.dispose();
    throw error;
  }
}
async function login(ctx, authenticator = ctx.primary) {
  const challengeResult = await ctx.run('/local/challenge', 'POST', { credentialId: authenticator.id });
  assert.equal(challengeResult.status, 200);
  const challenge = await challengeResult.json();
  const response = makeAuthenticationResponse(authenticator, { challenge: challenge.challenge });
  const logged = await ctx.run('/local/login', 'POST', {
    challenge: challenge.challenge, credentialId: authenticator.id, response,
  });
  assert.equal(logged.status, 200);
  const info = await logged.json();
  assert.equal(info.authenticated, true);
  const cookieHeader = logged.headers.get('set-cookie');
  assert.match(cookieHeader, /Secure; HttpOnly; SameSite=Strict/);
  const cookie = cookieHeader.split(';')[0];
  return { cookie, csrf: info.csrf };
}

test('M05 LOCAL CMS 01: hard isolation and two cryptographically enrolled synthetic authenticators', async () => {
  const ctx = await setup();
  try {
    assert.notEqual(ctx.primary.id, ctx.recovery.id);
    const noGate = await createLocalCmsHandler()(makeRequest('/local/articles'), {
      ...ctx.env, CB_M05_LOCAL_TEST_ONLY: 'false',
    });
    assert.equal(noGate.status, 404);
    const wrongHost = await createLocalCmsHandler()(new Request('https://untrusted.example.test/local/articles'), ctx.env);
    assert.equal(wrongHost.status, 404);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_credentials').first()).n, 2);
    const duplicatedOwner = await ctx.db.prepare('INSERT INTO cms_owner(owner_id,created_at) VALUES (1,2)');
    await assert.rejects(duplicatedOwner.run());
    const recovery = await login(ctx, ctx.recovery);
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, recovery)).status, 200);
    await ctx.db.prepare('UPDATE cms_credentials SET revoked_at=5 WHERE credential_id=?')
      .bind(ctx.recovery.id).run();
    assert.equal((await ctx.run('/local/challenge', 'POST', { credentialId: ctx.recovery.id })).status, 403);
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, recovery)).status, 401, 'revoking a credential revokes its live session access');
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS 02: genuine WebAuthn signature, origin, expiry and challenge replay protection', async () => {
  const ctx = await setup();
  try {
    let res = await ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id }, { origin: 'https://attacker.example.test' });
    assert.equal(res.status, 403);
    res = await ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id });
    const challenge = (await res.json()).challenge;
    const response = makeAuthenticationResponse(ctx.primary, { challenge });
    const bad = structuredClone(response);
    bad.response.signature = tamperBase64Url(bad.response.signature, raw => {
      raw[raw.length - 1] ^= 1; return raw;
    });
    assert.equal((await ctx.run('/local/login', 'POST', { credentialId: ctx.primary.id, challenge, response: bad })).status, 403);
    assert.equal((await ctx.run('/local/login', 'POST', { credentialId: ctx.primary.id, challenge, response })).status, 200);
    assert.notEqual((await ctx.run('/local/login', 'POST', { credentialId: ctx.primary.id, challenge, response })).status, 200);
    const rows = await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions').first();
    assert.equal(rows.n, 1);
    res = await ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id });
    const expired = (await res.json()).challenge;
    ctx.time(Date.now() + 100_000);
    assert.notEqual((await ctx.run('/local/login', 'POST', {
      credentialId: ctx.primary.id, challenge: expired,
      response: makeAuthenticationResponse(ctx.primary, { challenge: expired }),
    })).status, 200);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS 03: protected draft write, revision history, optimistic conflict and revocation', async () => {
  const ctx = await setup();
  try {
    const loginInfo = await login(ctx);
    const draftInput = { ...sampleDraft, idempotencyKey: seedIdempotency() };
    assert.equal((await ctx.run('/local/articles', 'POST', draftInput)).status, 403);
    assert.equal((await ctx.run('/local/articles', 'POST', draftInput, { cookie: loginInfo.cookie })).status, 403);
    assert.equal((await ctx.run('/local/articles', 'POST', draftInput, {
      ...loginInfo, fetchSite: 'cross-site',
    })).status, 403);
    const created = await ctx.run('/local/articles', 'POST', draftInput, loginInfo);
    assert.equal(created.status, 201);
    const info = await created.json();
    assert.equal(info.revision, 1);
    assert.equal(info.status, 'draft');
    assert.equal((await ctx.run('/local/articles', 'POST', draftInput, loginInfo)).status, 409);
    const wrongRevision = await ctx.run('/local/articles/' + info.id, 'PATCH', {
      ...draftInput, expectedRevision: 8, idempotencyKey: seedIdempotency(),
    }, loginInfo);
    assert.equal(wrongRevision.status, 409);
    const revisionKey = seedIdempotency();
    const changed = await ctx.run('/local/articles/' + info.id, 'PATCH', {
      ...draftInput, title: 'Second synthetic draft revision title',
      expectedRevision: 1, idempotencyKey: revisionKey,
    }, loginInfo);
    assert.equal(changed.status, 200);
    assert.equal((await changed.json()).revision, 2);
    const repeatedKey = await ctx.run('/local/articles/' + info.id, 'PATCH', {
      ...draftInput, expectedRevision: 2, idempotencyKey: revisionKey,
    }, loginInfo);
    assert.equal(repeatedKey.status, 409, 'a revision key is single-use even at a newer version');
    const history = await ctx.run('/local/articles/' + info.id + '/revisions', 'GET', undefined, loginInfo);
    assert.equal(history.status, 200);
    const revisions = (await history.json()).revisions;
    assert.deepEqual(revisions.map(r => r.revision), [2, 1]);
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, loginInfo)).status, 200);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 2);
    await assert.rejects(ctx.db.prepare('UPDATE cms_draft_revisions SET title=? WHERE draft_id=? AND revision=1')
      .bind('Tampered history', info.id).run(), /immutable/i);
    await assert.rejects(ctx.db.prepare('DELETE FROM cms_draft_revisions WHERE draft_id=? AND revision=1')
      .bind(info.id).run(), /immutable/i);
    assert.equal((await ctx.run('/local/logout', 'POST', {}, loginInfo)).status, 200);
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, loginInfo)).status, 401);
    assert.equal((await ctx.run('/local/articles/' + info.id, 'PATCH', {
      ...draftInput, expectedRevision: 2, idempotencyKey: seedIdempotency(),
    }, loginInfo)).status, 403);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS 04: same signed challenge concurrent login creates at most one session', async () => {
  const ctx = await setup();
  try {
    const challenge = (await (await ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id })).json()).challenge;
    const response = makeAuthenticationResponse(ctx.primary, { challenge });
    const attempts = await Promise.all(Array.from({ length: 10 }, () =>
      ctx.run('/local/login', 'POST', { challenge, credentialId: ctx.primary.id, response })));
    assert.equal(attempts.filter(x => x.status === 200).length, 1);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions').first()).n, 1);
  } finally { await ctx.mf.dispose(); }
});


test('M05 LOCAL CMS 05: WebAuthn sign counter persists, rejects replay with fresh challenge, and advances', async () => {
  const ctx = await setup();
  try {
    async function signWithCounter(counter) {
      const challengeResponse = await ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id });
      assert.equal(challengeResponse.status, 200);
      const { challenge } = await challengeResponse.json();
      const response = makeAuthenticationResponse(ctx.primary, { challenge, counter });
      return ctx.run('/local/login', 'POST', { challenge, credentialId: ctx.primary.id, response });
    }
    assert.equal((await signWithCounter(1)).status, 200);
    assert.equal((await ctx.db.prepare('SELECT sign_count FROM cms_credentials WHERE credential_id=?')
      .bind(ctx.primary.id).first()).sign_count, 1);
    const replayedCounter = await signWithCounter(1);
    assert.notEqual(replayedCounter.status, 200);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions').first()).n, 1);
    assert.equal((await ctx.db.prepare('SELECT sign_count FROM cms_credentials WHERE credential_id=?')
      .bind(ctx.primary.id).first()).sign_count, 1);
    assert.equal((await signWithCounter(2)).status, 200);
    assert.equal((await ctx.db.prepare('SELECT sign_count FROM cms_credentials WHERE credential_id=?')
      .bind(ctx.primary.id).first()).sign_count, 2);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions').first()).n, 2);
    const zeroAfterIncrement = await signWithCounter(0);
    assert.notEqual(zeroAfterIncrement.status, 200, 'counter rollback to zero is rejected');
  } finally { await ctx.mf.dispose(); }
});
