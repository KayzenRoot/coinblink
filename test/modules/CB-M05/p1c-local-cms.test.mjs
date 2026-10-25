import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash, createHmac } from 'node:crypto';
import { Script, runInNewContext } from 'node:vm';
import { LOCAL_CMS_UI_SCRIPT } from '../../../src/modules/CB-M05/p1c-local/local-cms-ui.mjs';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { convertV4MiniflareOptions, Miniflare, NoOpLog } from 'miniflare';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { chromium } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { splitLocalSchemaStatements, startLocalCmsPreview } from './p1c-local-preview.mjs';
import { CMS_TEST_ORIGIN, CMS_TEST_RP_ID, createLocalCmsHandler, issueBootstrapTicket, issueEmergencyAuthorization, webauthnChallengeFromHex } from '../../../src/modules/CB-M05/p1c-local/local-cms.mjs';
import { makeSyntheticAuthenticator, makeRegistrationResponse, makeAuthenticationResponse, tamperBase64Url } from '../../../src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

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

test('M05 LOCAL CMS schema splitter preserves trigger bodies under adversarial whitespace', () => {
  const statements = splitLocalSchemaStatements(schema);
  assert.ok(statements.length >= 8, 'all local schema statements must be applied');
  const triggers = statements.filter(statement => /^CREATE TRIGGER\b/iu.test(statement));
  assert.equal(triggers.length, 4, 'revision and audit immutability triggers must all be applied');
  assert.ok(triggers.every(statement => statement.includes('BEGIN') && statement.includes('END')));

  const adversarialSchema = [
    'CREATE TABLE first_table(id INTEGER PRIMARY KEY);',
    ' '.repeat(256_000) + 'CREATE TRIGGER synthetic_guard BEFORE UPDATE ON first_table BEGIN SELECT RAISE(ABORT, \'immutable\'); SELECT 1; END;',
    'CREATE TABLE last_table(id INTEGER PRIMARY KEY);',
  ].join('\n');
  const adversarialStatements = splitLocalSchemaStatements(adversarialSchema);
  assert.equal(adversarialStatements.length, 3);
  assert.match(adversarialStatements[1], /BEGIN[\s\S]*SELECT 1; END$/u);
});

test('M05 LOCAL CMS 13: local D1 preserves immutable triggers and rejects unsupported replace syntax', async () => {
  const ctx = await setup();
  try {
    const before = await ctx.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name"
    ).all();
    assert.deepEqual(before.results.map(row => row.name),
      ['cms_audit_no_delete', 'cms_audit_no_update', 'cms_revision_no_delete', 'cms_revision_no_update']);
    await assert.rejects(
      ctx.db.prepare(`CREATE OR REPLACE TRIGGER cms_revision_no_update BEFORE UPDATE ON cms_draft_revisions
        BEGIN SELECT RAISE(ABORT, 'local CMS revisions are immutable'); END`).run(),
      /syntax error|near "OR"/iu,
    );
    const after = await ctx.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name"
    ).all();
    assert.deepEqual(after.results.map(row => row.name),
      ['cms_audit_no_delete', 'cms_audit_no_update', 'cms_revision_no_delete', 'cms_revision_no_update']);
  } finally {
    await ctx.mf.dispose();
  }
});
function key() { return randomBytes(32).toString('hex'); }
function seedIdempotency() { return randomBytes(24).toString('base64url'); }
function makeRequest(route, method = 'GET', body = undefined, {
  cookie = '', csrf = '', origin = fakeOrigin, fetchSite = 'same-origin',
  contentType = 'application/json', referer = '',
} = {}) {
  const headers = { origin, 'content-type': contentType };
  if (fetchSite) headers['sec-fetch-site'] = fetchSite;
  if (referer) headers.referer = referer;
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
    const statements = splitLocalSchemaStatements(schema);
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
  const response = makeAuthenticationResponse(authenticator, { challenge: webauthnChallengeFromHex(challenge.challenge) });
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
    const response = makeAuthenticationResponse(ctx.primary, { challenge: webauthnChallengeFromHex(challenge) });
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
      response: makeAuthenticationResponse(ctx.primary, { challenge: webauthnChallengeFromHex(expired) }),
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
    const invalidCreate = await ctx.run('/local/articles', 'POST', {
      ...draftInput, sourceUrl: 'not-a-url', idempotencyKey: seedIdempotency(),
    }, loginInfo);
    assert.equal(invalidCreate.status, 400, 'malformed source is a client error, not HTTP 500');
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 0,
      'invalid input does not create an article');
    assert.equal((await ctx.run('/local/articles', 'POST', {
      ...draftInput, sourceUrl: 'http://example.test/insecure', idempotencyKey: seedIdempotency(),
    }, loginInfo)).status, 400, 'insecure source URL is rejected');
    const created = await ctx.run('/local/articles', 'POST', draftInput, loginInfo);
    assert.equal(created.status, 201);
    const info = await created.json();
    assert.equal(info.revision, 1);
    assert.equal(info.status, 'draft');
    assert.equal((await ctx.run('/local/articles/' + info.id, 'PATCH', {
      ...draftInput, expectedRevision: 1, sourceUrl: 'not-a-url',
      idempotencyKey: seedIdempotency(),
    }, loginInfo)).status, 400, 'invalid update must not mutate stored drafts');
    assert.equal((await ctx.db.prepare('SELECT revision FROM cms_drafts WHERE id=?').bind(info.id).first()).revision, 1);
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
    const response = makeAuthenticationResponse(ctx.primary, { challenge: webauthnChallengeFromHex(challenge) });
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
      const response = makeAuthenticationResponse(ctx.primary, { challenge: webauthnChallengeFromHex(challenge), counter });
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


test('M05 LOCAL CMS 06: challenge quota bounds unauthenticated writes, expires and cleans up', async () => {
  const ctx = await setup();
  try {
    const ask = () => ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id });
    const attempts = await Promise.all(Array.from({ length: 10 }, ask));
    assert.equal(attempts.filter(r => r.status === 200).length, 3);
    assert.equal(attempts.filter(r => r.status === 429).length, 7);
    assert.equal((await ctx.db.prepare(
      'SELECT COUNT(*) AS n FROM cms_challenges WHERE credential_id=?'
    ).bind(ctx.primary.id).first()).n, 3);
    ctx.time(Date.now() + 91_000);
    assert.equal((await ask()).status, 200, 'new challenge is permitted after expiry');
    assert.equal((await ctx.db.prepare(
      'SELECT COUNT(*) AS n FROM cms_challenges WHERE credential_id=?'
    ).bind(ctx.primary.id).first()).n, 1, 'expired unconsumed challenges are cleaned up');
    assert.equal((await ctx.run('/local/challenge', 'POST', { credentialId: ctx.recovery.id })).status, 200,
      'recovery credential has an independent challenge budget');
  } finally { await ctx.mf.dispose(); }
});


test('M05 LOCAL CMS 07: isolated test UI serves nonce CSP, no production import and script parses', async () => {
  const ctx = await setup();
  try {
    assert.doesNotThrow(() => new Script(LOCAL_CMS_UI_SCRIPT), 'browser UI source must parse as JavaScript');
    const ui = await ctx.run('/local/ui');
    assert.equal(ui.status, 200);
    assert.match(ui.headers.get('content-type'), /^text\/html/);
    assert.equal(ui.headers.get('cache-control'), 'no-store');
    assert.equal(ui.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
    const csp = ui.headers.get('content-security-policy');
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /form-action 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /connect-src 'self'/);
    const scriptNonce = /script-src 'nonce-([0-9a-f]{64})'/.exec(csp)?.[1];
    assert.ok(scriptNonce);
    const markup = await ui.text();
    assert.ok(markup.includes('<script nonce="' + scriptNonce + '" type="module">'));
    assert.ok(markup.includes('<style nonce="' + scriptNonce + '">'));
    assert.match(markup, /Local CMS Test Workspace/);
    assert.match(markup, /LOCAL TEST ONLY[\s\S]*synthetic/i,
      'the shell must declare that every identity and record is synthetic');
    assert.match(markup, /First Owner bootstrap/);
    assert.doesNotMatch(markup, /CLOUDFLARE_API_TOKEN|PRIVATE KEY-----|CMS_TEST_HMAC_KEY/);
    assert.doesNotMatch(markup, /<script(?! nonce=)/);
    const second = await ctx.run('/local/ui');
    const secondCsp = second.headers.get('content-security-policy');
    assert.notEqual(csp, secondCsp, 'fresh CSP nonce per page request');
    const missingGate = await createLocalCmsHandler()(makeRequest('/local/ui'), {
      ...ctx.env, CB_M05_LOCAL_TEST_ONLY: 'false',
    });
    assert.equal(missingGate.status, 404, 'test UI must not be accessible without local gate');
    const otherOrigin = await createLocalCmsHandler()(new Request('https://public.example.test/local/ui'), ctx.env);
    assert.equal(otherOrigin.status, 404, 'test UI must not be accessible on a public origin');
  } finally { await ctx.mf.dispose(); }
});


test('M05 LOCAL CMS 08: browser UI controller logs in, creates, revises and logs out against D1', async () => {
  const ctx = await setup();
  try {
    const elements = new Map();
    function element(id) {
      if (!elements.has(id)) {
        const item = {
          id, value: '', hidden: false, disabled: false, textContent: '', children: [],
          handlers: {},
          addEventListener(type, fn) { this.handlers[type] = fn; },
          setAttribute() {},
          removeAttribute() {},
          append(child) { this.children.push(child); },
          replaceChildren() { this.children = []; },
          reset() {
            for (const x of ['title','summary','body','sourceUrl','authorLabel']) {
              formFields[x].value = '';
            }
          },
        };
        elements.set(id, item);
      }
      return elements.get(id);
    }
    const formFields = Object.fromEntries(
      ['title','summary','body','sourceUrl','authorLabel'].map(name => [name, { value: '' }])
    );
    element('credential').value = ctx.primary.id;
    element('draft').elements = { namedItem(name) { return formFields[name]; } };
    const browserDocument = {
      getElementById: element,
      addEventListener() {},
      createElement: () => ({
        textContent: '', children: [], handlers: {},
        addEventListener(name, handler) { this.handlers[name] = handler; },
        append(child) { this.children.push(child); },
      }),
    };
    const fetcher = async (url, options) => {
      const method = options?.method || 'GET';
      const body = options?.body ? JSON.parse(options.body) : undefined;
      const headers = options?.headers || {};
      if (url === '/local/logout' && fetcher.failLogout) {
        return new Response(JSON.stringify({ error: 'Injected test-only network denial' }), { status: 503 });
      }
      const res = await ctx.run(url, method, body, {
        cookie: fetcher.cookie,
        csrf: headers['X-CB-CSRF'] || '',
      });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) fetcher.cookie = setCookie.split(';')[0];
      return res;
    };
    fetcher.cookie = '';
    fetcher.failLogout = false;
    const credentialApi = {
      async get({ publicKey }) {
        assert.equal(publicKey.rpId, CMS_TEST_RP_ID);
        assert.equal(publicKey.userVerification, 'required');
        const challenge = Buffer.from(publicKey.challenge).toString('hex');
        const signed = makeAuthenticationResponse(ctx.primary, { challenge: webauthnChallengeFromHex(challenge) });
        const toBuffer = value => Uint8Array.from(Buffer.from(value, 'base64url')).buffer;
        return {
          id: signed.id,
          rawId: toBuffer(signed.rawId),
          type: 'public-key',
          response: {
            clientDataJSON: toBuffer(signed.response.clientDataJSON),
            authenticatorData: toBuffer(signed.response.authenticatorData),
            signature: toBuffer(signed.response.signature),
            userHandle: null,
          },
          getClientExtensionResults() { return {}; },
        };
      },
    };
    class FakeFormData {
      constructor() {
        return Object.entries(formFields).map(([name, field]) => [name, field.value]);
      }
    }
    runInNewContext(LOCAL_CMS_UI_SCRIPT, {
      document: browserDocument,
      window: { PublicKeyCredential: function PublicKeyCredential() {}, addEventListener() {} },
      navigator: { credentials: credentialApi },
      fetch: fetcher,
      FormData: FakeFormData,
      Uint8Array, crypto: globalThis.crypto,
      setTimeout: () => 1, clearTimeout() {},
      atob: value => Buffer.from(value, 'base64').toString('binary'),
      btoa: value => Buffer.from(value, 'binary').toString('base64'),
    });
    await element('login').handlers.click();
    assert.match(element('session-status').textContent, /active/);
    assert.equal(element('draft').hidden, false);
    assert.match(element('message').textContent, /Authenticated/);
    for (const [field, value] of Object.entries(sampleDraft)) formFields[field].value = value;
    await element('draft').handlers.submit({ preventDefault() {} });
    assert.equal(element('items').children.length, 1);
    assert.equal(element('draft-search').hidden, false, 'search is available after local login');
    element('draft-search').value = 'NOT IN ANY TITLE';
    element('draft-search').handlers.input();
    assert.equal(element('items').children.length, 0, 'no matching draft remains visible');
    element('draft-search').value = 'LOCAL cms';
    element('draft-search').handlers.input();
    assert.equal(element('items').children.length, 1, 'search is case-insensitive');
    element('draft-search').value = '';
    element('draft-search').handlers.input();
    assert.equal(element('items').children.length, 1, 'clearing filter restores original list');
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    const button = element('items').children[0].children[0];
    await button.handlers.click();
    assert.equal(element('revision').value, '1');
    formFields.title.value = 'Updated local UI revision, protected by D1';
    await element('draft').handlers.submit({ preventDefault() {} });
    assert.equal(element('revision').value, '2');
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 2);
    await element('history').handlers.click();
    assert.equal(element('history-list').children.length, 2);
    assert.match(element('history-list').children[0].textContent, /Revision 2/);
    fetcher.failLogout = true;
    await element('logout').handlers.click();
    assert.equal(element('draft').hidden, true, 'failed logout must scrub the private local editor');
    assert.equal(element('logout').hidden, true, 'failed logout removes privileged local controls');
    assert.match(element('message').textContent, /Logout not confirmed/);
    assert.match(element('message').textContent, /server session may remain active/);
    assert.equal(formFields.title.value, '', 'unconfirmed logout must still erase private draft text');
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions WHERE revoked_at IS NULL').first()).n, 1,
      'client-only scrubbing is not proof of server-side revocation');
    fetcher.failLogout = false;
    await element('login').handlers.click();
    assert.match(element('message').textContent, /Authenticated/,
      'fresh synthetic passkey authentication is required after local session scrub');
    await element('logout').handlers.click();
    assert.match(element('message').textContent, /Local test session ended/);
    assert.equal(element('draft').hidden, true);
    assert.equal(element('items').children.length, 0);
    assert.equal(element('draft-search').hidden, true, 'draft title filter not available after logout');
    assert.equal(element('draft-search').value, '', 'search term cleared after logout');
    assert.equal(element('session-status').textContent, 'Not authenticated');
    assert.deepEqual(Object.values(formFields).map(field => field.value), ['', '', '', '', ''],
      'successful logout purges local draft text from hidden DOM, not only hides the form');
    assert.equal(element('draft-id').value, '', 'draft identifier must not survive logout');
    assert.equal(element('revision').value, '0', 'revision state resets on confirmed logout');
    assert.equal(element('history-list').children.length, 0);
    assert.equal(element('save').textContent, 'Create draft');
    // Simulate an older tab showing draft text after the server-side session
    // has already been revoked. A denied authenticated refresh must clear it.
    formFields.title.value = 'Private draft must not remain visible on unauthorized refresh';
    formFields.body.value = 'Confidential offline fixture';
    element('draft').hidden = false;
    element('logout').hidden = false;
    element('refresh').hidden = false;
    element('draft-id').value = 'stale-draft-id';
    element('revision').value = '9';
    element('items').children.push({ textContent: 'Stale draft title' });
    await element('refresh').handlers.click();
    assert.equal(element('draft').hidden, true, 'HTTP 401 hides editor');
    assert.equal(element('logout').hidden, true, 'HTTP 401 clears stale privileged UI');
    assert.equal(element('refresh').hidden, true, 'HTTP 401 disables stale reads');
    assert.deepEqual(Object.values(formFields).map(field => field.value), ['', '', '', '', ''],
      'HTTP 401 removes all draft text from visible and hidden DOM');
    assert.equal(element('draft-id').value, '');
    assert.equal(element('revision').value, '0');
    assert.equal(element('items').children.length, 0, 'HTTP 401 removes stale list');
    assert.equal(element('session-status').textContent, 'Not authenticated');
    assert.match(element('message').textContent, /session expired or was revoked/);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS 09: Chromium real page, browser virtual passkey, D1 draft and logout', { timeout: 90_000 }, async () => {
  const ctx = await setup();
  let browser;
  try {
    // Playwright's built-in virtual WebAuthn device signs browser-issued assertions.
    // Private test keys exist in memory only and are never committed or logged.
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.credentials.create(CMS_TEST_RP_ID, {
      id: ctx.primary.id,
      userHandle: randomBytes(16).toString('base64url'),
      privateKey: ctx.primary.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64url'),
      publicKey: ctx.primary.publicKey.export({ type: 'spki', format: 'der' }).toString('base64url'),
      signCount: 0,
    });
    await context.credentials.install();
    const page = await context.newPage();
    const pageErrors = [];
    const browserConsoleErrors = [];
    const routeStatuses = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', entry => { if (entry.type() === 'error') browserConsoleErrors.push(entry.text().slice(0, 280)); });
    const handler = createLocalCmsHandler();
    const allowed = new Set(['/local/ui', '/local/challenge', '/local/login', '/local/logout', '/local/articles']);
    await context.route('https://owner.example.test/**', async route => {
      const browserRequest = route.request();
      const url = new URL(browserRequest.url());
      if (url.origin !== CMS_TEST_ORIGIN || (!allowed.has(url.pathname) &&
          !/^\/local\/articles\/[0-9a-f-]{36}(?:\/revisions)?$/i.test(url.pathname))) {
        await route.abort('blockedbyclient');
        return;
      }
      const browserHeaders = await browserRequest.allHeaders();
      // Playwright's intercepted Request.allHeaders() omits the browser-only
      // Sec-Fetch-Site transport header. The test adapter may reconstruct it
      // ONLY after verifying the initiating frame is our fixed HTTPS test RP.
      // Production code still requires the genuine header: no fallback there.
      if (!browserHeaders['sec-fetch-site'] && !browserRequest.isNavigationRequest()) {
        const initiator = new URL(browserRequest.frame().url());
        assert.equal(initiator.origin, CMS_TEST_ORIGIN, 'cross-origin initiator is not admitted');
        browserHeaders['sec-fetch-site'] = 'same-origin';
      }
      const postData = browserRequest.postDataBuffer();
      const request = new Request(browserRequest.url(), {
        method: browserRequest.method(), headers: browserHeaders,
        ...(postData ? { body: postData } : {}),
      });
      const response = await handler(request, ctx.env);
      routeStatuses.push(browserRequest.method() + ' ' + url.pathname + ': ' + response.status +
        ' origin=' + Boolean(browserHeaders.origin) + ' fetch-site=' + (browserHeaders['sec-fetch-site'] || 'missing'));
      await route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: Buffer.from(await response.arrayBuffer()),
      });
    });
    const navigation = await page.goto(CMS_TEST_ORIGIN + '/local/ui', { waitUntil: 'domcontentloaded' });
    assert.equal(navigation.status(), 200);
    assert.match(await page.title(), /Local CMS Test Workspace/);
    await page.locator('#credential').fill(ctx.primary.id);
    await page.locator('#login').click();
    try {
      await page.getByText('Local test session active').waitFor({ timeout: 10_000 });
    } catch {
      const text = await page.locator('#message').textContent();
      const contextDetails = await page.evaluate(() => ({
        secure: globalThis.isSecureContext,
        credentialApi: typeof globalThis.navigator?.credentials?.get,
      }));
      throw new Error('Chromium test-passkey login did not reach session: ' + JSON.stringify({
        message: text, contextDetails, routes: routeStatuses,
        pageErrors, consoleErrors: browserConsoleErrors,
      }));
    }
    assert.equal(await page.locator('#draft').isVisible(), true);
    await page.locator('[name="title"]').fill(sampleDraft.title);
    await page.locator('[name="summary"]').fill(sampleDraft.summary);
    await page.locator('[name="body"]').fill(sampleDraft.body);
    await page.locator('[name="sourceUrl"]').fill(sampleDraft.sourceUrl);
    await page.locator('[name="authorLabel"]').fill(sampleDraft.authorLabel);
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 10_000 });
    const button = page.locator('#items button').first();
    assert.equal(await button.count(), 1);
    await button.click();
    await page.getByText('Loaded draft revision 1').waitFor({ timeout: 10_000 });
    await page.locator('[name="title"]').fill('New verified browser passkey draft revision');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 2; not published').waitFor({ timeout: 10_000 });
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 2);
    await page.locator('#history').click();
    await page.getByText('Read-only revision history loaded: 2 versions').waitFor({ timeout: 10_000 });
    assert.equal(await page.locator('#history-list li').count(), 2);
    assert.match(await page.locator('#history-list li').first().innerText(), /Revision 2/);
    const { sign_count: signCount } = await ctx.db.prepare(
      'SELECT sign_count FROM cms_credentials WHERE credential_id=?'
    ).bind(ctx.primary.id).first();
    assert.equal(signCount, 1, 'browser credential counter persisted');
    await page.locator('#logout').click();
    await page.getByText('Not authenticated').waitFor();
    assert.equal(await page.locator('#draft').isHidden(), true);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions WHERE revoked_at IS NOT NULL').first()).n, 1);
    assert.deepEqual(pageErrors, []);
    await context.close();
  } finally {
    if (browser) await browser.close();
    await ctx.mf.dispose();
  }
});


test('M05 LOCAL CMS 10: interactive preview bootstrap opens an isolated browser with disposable passkey', { timeout: 90_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless: true });
  try {
    const page = preview.page;
    assert.match(await page.title(), /CoinBlink.*Local CMS Test Workspace/);
    assert.equal(await page.locator('#credential').inputValue(), preview.primaryId);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 15_000 });
    const { drafts } = await page.evaluate(async () => {
      const response = await fetch('/local/articles', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Session-bound D1 draft listing was rejected');
      return response.json();
    });
    assert.deepEqual(drafts, [], 'preview session starts with an empty ephemeral D1');
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions').first()).n, 1);
    await page.locator('#logout').click();
    await page.getByText('Not authenticated').waitFor({ timeout: 15_000 });
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions WHERE revoked_at IS NOT NULL').first()).n, 1);
    const denied = await page.evaluate(async () => {
      const response = await fetch('/local/articles', { credentials: 'same-origin' });
      return response.status;
    });
    assert.equal(denied, 401, 'preview logout invalidates server session');
  } finally { await preview.close(); }
});


test('M05 LOCAL CMS 11: opted-in local D1 keeps drafts across restarts, rotates disposable passkeys, rejects parallel writers', { timeout: 120_000 }, async () => {
  const persistenceRoot = mkdtempSync(path.join(tmpdir(), 'coinblink-m05-persistent-test-'));
  let first, second;
  try {
    first = await startLocalCmsPreview({ headless: true, persistLocal: true, persistenceRoot });
    await first.page.locator('#login').click();
    await first.page.getByText('Local test session active').waitFor({ timeout: 15_000 });
    await first.page.locator('[name="title"]').fill(sampleDraft.title);
    await first.page.locator('[name="summary"]').fill(sampleDraft.summary);
    await first.page.locator('[name="body"]').fill(sampleDraft.body);
    await first.page.locator('[name="sourceUrl"]').fill(sampleDraft.sourceUrl);
    await first.page.locator('[name="authorLabel"]').fill(sampleDraft.authorLabel);
    await first.page.locator('#save').click();
    await first.page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 15_000 });
    const firstCredential = first.primaryId;
    assert.equal((await first.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);

    await assert.rejects(
      startLocalCmsPreview({ headless: true, persistLocal: true, persistenceRoot }),
      /EEXIST|single-writer-lock/,
      'parallel writers cannot open the same local D1'
    );
    await first.close();
    first = null;

    second = await startLocalCmsPreview({ headless: true, persistLocal: true, persistenceRoot });
    assert.notEqual(second.primaryId, firstCredential, 'test passkeys rotate on restart');
    assert.equal((await second.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1,
      'draft rows survive browser and D1 restarts in opted-in mode');
    assert.equal((await second.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 1);
    assert.equal((await second.db.prepare('SELECT COUNT(*) AS n FROM cms_credentials WHERE revoked_at IS NULL').first()).n, 2);
    assert.equal((await second.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions WHERE revoked_at IS NULL').first()).n, 0);
    await second.page.locator('#login').click();
    await second.page.getByText('Local test session active').waitFor({ timeout: 15_000 });
    assert.match(await second.page.locator('#items button').first().innerText(), /Local CMS protects this example draft/);
    await second.page.locator('#logout').click();
    await second.page.getByText('Not authenticated').waitFor({ timeout: 15_000 });
  } finally {
    if (second) await second.close();
    if (first) await first.close();
    rmSync(persistenceRoot, { recursive: true, force: true });
  }
});

test('M05 LOCAL CMS 12: bound streamed JSON when Content-Length is forged or omitted', async () => {
  const ctx = await setup();
  try {
    const handler = createLocalCmsHandler();
    const oversized = JSON.stringify({ credentialId: ctx.primary.id, padding: 'x'.repeat(8192) });
    for (const declaredLength of ['2', null]) {
      const headers = {
        origin: CMS_TEST_ORIGIN,
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
      };
      if (declaredLength !== null) headers['content-length'] = declaredLength;
      const response = await handler(new Request(CMS_TEST_ORIGIN + '/local/challenge', {
        method: 'POST', headers, body: oversized,
      }), ctx.env);
      assert.equal(response.status, 400, 'oversize must fail closed even with missing/false length');
    }
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_challenges').first()).n, 0);
    const valid = await ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id });
    assert.equal(valid.status, 200, 'bounded small JSON must still authenticate a local challenge');
  } finally { await ctx.mf.dispose(); }
});

// First-Owner bootstrap: a fresh schema-only D1 with no cms_owner seed.
async function openEmptySyntheticD1(options = {}) {
  mkdirSync(stateRoot, { recursive: true });
  const persistencePath = options.persistencePath ?? path.join(stateRoot, randomUUID());
  const mf = new Miniflare(convertV4MiniflareOptions({
    name: 'coinblink-m05-p1c-bootstrap-' + randomUUID(),
    script: 'export default { async fetch() { return new Response("LOCAL ONLY") } }',
    modules: true,
    compatibilityDate: '2026-10-13',
    d1Databases: { CMS_D1_LOCAL: '00000000-0000-4000-8000-000000000086' },
    resourcePersistencePath: persistencePath,
    log: new NoOpLog(),
  }));
  try {
    const db = await mf.getD1Database('CMS_D1_LOCAL');
    if (options.applySchema !== false) {
      for (const statement of splitLocalSchemaStatements(schema)) await db.prepare(statement).run();
    }
    const secret = options.secret ?? key();
    const clock = { ms: options.nowMs ?? Date.now() };
    const env = { CB_M05_LOCAL_TEST_ONLY: 'true', CMS_D1_LOCAL: db, CMS_TEST_HMAC_KEY: secret };
    const run = (route, method = 'GET', body = undefined, options = {}) =>
      createLocalCmsHandler({ now: () => clock.ms })(makeRequest(route, method, body, options), env);
    const ticket = () => issueBootstrapTicket(db, secret, Math.floor(clock.ms / 1000));
    return { mf, db, env, secret, clock, run, ticket, persistencePath };
  } catch (error) {
    await mf.dispose();
    throw error;
  }
}
async function countRows(db, table, where = '1=1') {
  return (await db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).first()).n;
}
async function bootstrapChallenge(ctx, ticket) {
  const response = await ctx.run('/local/bootstrap/challenge', 'POST', { ticket });
  assert.equal(response.status, 200);
  return (await response.json()).challenge;
}
function bootstrapClaimBody(ticket, challenge, authenticator, options = {}) {
  return {
    ticket,
    challenge,
    response: makeRegistrationResponse(authenticator, { challenge: webauthnChallengeFromHex(challenge), ...options }),
  };
}
function statusHistogram(statuses) {
  return statuses.reduce((counts, status) => ({ ...counts, [status]: (counts[status] ?? 0) + 1 }), {});
}

// Every claim of a race is launched in the same tick: no waves, queues or semaphores.
async function raceClaims(ctx, contenderSet) {
  return Promise.all(contenderSet.map(c =>
    ctx.run('/local/bootstrap/claim', 'POST', bootstrapClaimBody(c.ticket, c.challenge, c.authenticator))));
}

// Node-hosted 100-way claim bursts hit Miniflare D1-proxy faults (HTTP 500 from read ECONNRESET, or
// "AssertionError: false == true" while hydrating a D1 batch): 43-99 of 100 claims in 8 trials. 10-way
// bursts stayed clean. The 100-way proof therefore hosts the unchanged handler inside workerd (fixture entry).
const WORKER_DIAGNOSTIC_PATH = '/__test/diagnostics';
const WORKER_RACE_PATH = '/__test/claim-race';
let bootstrapWorkerScript;
async function bootstrapWorkerBundle() {
  bootstrapWorkerScript ??= (await build({
    entryPoints: [fileURLToPath(new URL('./p1c-fixtures/bootstrap-worker-entry.mjs', import.meta.url))],
    bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', write: false, logLevel: 'silent',
    conditions: ['workerd', 'worker', 'browser'], mainFields: ['module', 'main'],
  })).outputFiles[0].text;
  return bootstrapWorkerScript;
}
// The handler runs inside workerd, so the Node-to-Worker D1 proxy is not in the measured path.
// persistencePath lets a caller reopen the same LOCAL D1 after a restart; nowMs installs the
// fixture-only test clock used to prove TTL and cleanup without waiting for wall time.
async function openWorkerHostedBootstrapD1(options = {}) {
  mkdirSync(stateRoot, { recursive: true });
  const secret = options.secret ?? key();
  const persistencePath = options.persistencePath ?? path.join(stateRoot, randomUUID());
  const mf = new Miniflare(convertV4MiniflareOptions({
    name: 'coinblink-m05-p1c-worker-bootstrap-' + randomUUID(),
    script: await bootstrapWorkerBundle(),
    modules: true,
    compatibilityDate: '2026-10-13',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: { CMS_D1_LOCAL: '00000000-0000-4000-8000-000000000086' },
    bindings: {
      CB_M05_LOCAL_TEST_ONLY: 'true',
      CMS_TEST_HMAC_KEY: secret,
      ...(Number.isFinite(options.nowMs) && options.nowMs > 0 ? { CB_M05_LOCAL_TEST_NOW: String(options.nowMs) } : {}),
    },
    resourcePersistencePath: persistencePath,
    log: new NoOpLog(),
  }));
  try {
    const db = await mf.getD1Database('CMS_D1_LOCAL');
    if (options.applySchema !== false) {
      for (const statement of splitLocalSchemaStatements(schema)) await db.prepare(statement).run();
    }
    const seedHandler = createLocalCmsHandler(Number.isFinite(options.nowMs) && options.nowMs > 0
      ? { now: () => options.nowMs } : {});
    const seedEnv = {
      CB_M05_LOCAL_TEST_ONLY: 'true', CMS_D1_LOCAL: db, CMS_TEST_HMAC_KEY: secret,
    };
    // Seed requests use the same local D1 and unchanged handler without adding
    // one TCP dispatch per fixture; the measured claim burst still runs in workerd.
    const seedRequest = (route, method = 'GET', body = undefined) =>
      seedHandler(makeRequest(route, method, body), seedEnv);
    const dispatch = (route, method = 'GET', body = undefined, extraHeaders = {}) => mf.dispatchFetch(CMS_TEST_ORIGIN + route, {
      method,
      headers: {
        origin: CMS_TEST_ORIGIN, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', ...extraHeaders,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const race = async claims => {
      const response = await mf.dispatchFetch(CMS_TEST_ORIGIN + WORKER_RACE_PATH, {
        method: 'POST',
        headers: { origin: CMS_TEST_ORIGIN, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' },
        body: JSON.stringify({ claims }),
      });
      assert.equal(response.status, 200, 'race route must answer');
      return (await response.json()).statuses;
    };
    const ticket = () => issueBootstrapTicket(db, secret, Math.floor(options.nowMs / 1000 || Date.now() / 1000));
    return { mf, db, dispatch, seedRequest, ticket, race, secret, persistencePath };
  } catch (error) {
    await mf.dispose();
    throw error;
  }
}
async function raceWorkerClaims(ctx, contenderSet) {
  return Promise.all(contenderSet.map(c =>
    ctx.dispatch('/local/bootstrap/claim', 'POST', bootstrapClaimBody(c.ticket, c.challenge, c.authenticator))));
}
// Authenticates inside the Worker runtime and returns the cookie and CSRF token to replay.
async function workerLogin(ctx, authenticator) {
  const challengeResponse = await ctx.dispatch('/local/challenge', 'POST', { credentialId: authenticator.id });
  assert.equal(challengeResponse.status, 200);
  const { challenge } = await challengeResponse.json();
  const response = makeAuthenticationResponse(authenticator, { challenge: webauthnChallengeFromHex(challenge) });
  const logged = await ctx.dispatch('/local/login', 'POST',
    { challenge, credentialId: authenticator.id, response });
  assert.equal(logged.status, 200, 'worker-hosted login must succeed');
  return {
    cookie: logged.headers.get('set-cookie').split(';')[0],
    csrf: (await logged.json()).csrf,
  };
}
function authHeaders(session) {
  return { cookie: session.cookie, 'x-cb-csrf': session.csrf };
}
function summarizeDiagnostics(entries) {
  return entries.reduce((summary, entry) => {
    const label = entry.kind + ':' + entry.stage + ':' + entry.name + (entry.causeCode ? ':' + entry.causeCode : '');
    return { ...summary, [label]: (summary[label] ?? 0) + 1 };
  }, {});
}
async function runWorkerBootstrapRace(contenders, trial) {
  const ctx = await openWorkerHostedBootstrapD1();
  try {
    const contenderSet = [];
    for (let i = 0; i < contenders; i++) {
      const ticket = await ctx.ticket();
      const authenticator = makeSyntheticAuthenticator('worker-' + trial + '-' + i);
      const challengeResponse = await ctx.seedRequest('/local/bootstrap/challenge', 'POST', { ticket });
      assert.equal(challengeResponse.status, 200);
      contenderSet.push({ ticket, authenticator, challenge: (await challengeResponse.json()).challenge });
    }
    const outcomes = await raceWorkerClaims(ctx, contenderSet);
    const statuses = outcomes.map(response => response.status);
    const { entries } = await (await ctx.dispatch(WORKER_DIAGNOSTIC_PATH)).json();
    console.log(`BOOT-${contenders}-WORKER trial ${trial} histogram ${JSON.stringify(statusHistogram(statuses))} ` +
      `d1Failures ${JSON.stringify(summarizeDiagnostics(entries))}`);
    // Exclusivity and availability are asserted separately: a fault must never be counted as a denial.
    assert.equal(statuses.filter(status => status === 201).length, 1, 'exclusivity: exactly one HTTP 201');
    assert.equal(statuses.filter(status => status === 403 || status === 409).length, contenders - 1,
      'exclusivity: every loser denied with 403 or 409');
    assert.equal(statuses.filter(status => status === 500).length, 0, 'availability: zero HTTP 500');
    assert.equal(entries.filter(entry => entry.kind === 'transport' || entry.kind === 'other').length, 0,
      'availability: zero unclassified or transport D1 failures inside the Worker');
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
    const credentials = (await ctx.db.prepare('SELECT credential_id,device_kind FROM cms_credentials').all()).results;
    assert.equal(credentials.length, 1, 'losers leave no credential rows');
    assert.equal(credentials[0].credential_id, contenderSet[statuses.indexOf(201)].authenticator.id);
    assert.equal(credentials[0].device_kind, 'primary');
    assert.equal(await countRows(ctx.db, 'cms_sessions'), 0, 'bootstrap issues no session');
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NOT NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NULL'), contenders - 1);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_challenges', 'consumed_at IS NOT NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_challenges', 'consumed_at IS NULL'), contenders - 1);
  } finally {
    await ctx.mf.dispose();
  }
}

async function seedOwnerWithCredentials(db, { nowSeconds = Math.floor(Date.now() / 1000), kinds = ['primary', 'recovery'] } = {}) {
  await db.prepare('INSERT INTO cms_owner(owner_id,created_at) VALUES (1,?)').bind(nowSeconds).run();
  const credentials = [];
  for (const kind of kinds) {
    const credentialId = randomBytes(32).toString('base64url');
    await db.prepare(
      'INSERT INTO cms_credentials(credential_id,owner_id,public_key,sign_count,device_kind) VALUES (?,1,?,0,?)'
    ).bind(credentialId, new Uint8Array(65).fill(9), kind).run();
    credentials.push({ credentialId, kind });
  }
  return credentials;
}

// Starts every claim in ONE tick inside the runtime, so contenders interleave from a shared
// starting point and the batch-level conflict path (409) is exercised, not only the pre-check (403).
async function runWorkerInTickRace(contenders, trial) {
  const ctx = await openWorkerHostedBootstrapD1();
  try {
    const contenderSet = [];
    const claims = [];
    for (let i = 0; i < contenders; i++) {
      const ticket = await ctx.ticket();
      const authenticator = makeSyntheticAuthenticator('tick-' + trial + '-' + i);
      const challengeResponse = await ctx.seedRequest('/local/bootstrap/challenge', 'POST', { ticket });
      assert.equal(challengeResponse.status, 200);
      const { challenge } = await challengeResponse.json();
      contenderSet.push({ authenticator, challenge });
      claims.push(bootstrapClaimBody(ticket, challenge, authenticator));
    }
    const statuses = await ctx.race(claims);
    const { entries } = await (await ctx.dispatch(WORKER_DIAGNOSTIC_PATH)).json();
    console.log(`BOOT-RACE-BATCH trial ${trial} histogram ${JSON.stringify(statusHistogram(statuses))} ` +
      `d1Failures ${JSON.stringify(summarizeDiagnostics(entries))}`);
    assert.equal(statuses.filter(status => status === 201).length, 1, 'exclusivity: exactly one HTTP 201');
    assert.ok(statuses.filter(status => status === 409).length >= 1,
      'the single-winner batch itself denied at least one contender (409): ' + statuses.join(','));
    assert.equal(statuses.filter(status => status !== 201 && status !== 403 && status !== 409).length, 0,
      'only 201, 403 or 409 may be returned: ' + statuses.join(','));
    assert.equal(statuses.filter(status => status === 500).length, 0, 'availability: zero HTTP 500');
    assert.equal(entries.filter(entry => entry.kind === 'transport' || entry.kind === 'other').length, 0,
      'zero unclassified or transport D1 failures inside the Worker');
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
    const credentials = (await ctx.db.prepare('SELECT credential_id,device_kind FROM cms_credentials').all()).results;
    assert.equal(credentials.length, 1, 'losers leave no credential rows');
    assert.equal(credentials[0].credential_id, contenderSet[statuses.indexOf(201)].authenticator.id);
    assert.equal(credentials[0].device_kind, 'primary');
    assert.equal(await countRows(ctx.db, 'cms_sessions'), 0, 'bootstrap issues no session');
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NOT NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NULL'), contenders - 1);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_challenges', 'consumed_at IS NOT NULL'), 1);
  } finally {
    await ctx.mf.dispose();
  }
}

test('M05 LOCAL CMS BOOT-RACE-BATCH: 100 claims start in one tick inside the Worker; one Owner and the batch guard denies the rest', { timeout: 300_000 }, async () => {
  for (let trial = 1; trial <= 3; trial++) await runWorkerInTickRace(100, trial);
});

// Worker-hosted quota proofs: the handler and D1 live in the same runtime, so the answer to
// "did the acknowledged challenge persist?" cannot be distorted by a Node-to-Worker proxy hop.
test('M05 LOCAL CMS QUOTA-WORKER: 100 concurrent challenges, exactly 3 acknowledged and 3 persisted; consumed rows free quota', { timeout: 240_000 }, async () => {
  const ctx = await openWorkerHostedBootstrapD1();
  try {
    const [primary] = await seedOwnerWithCredentials(ctx.db);
    const ask = () => ctx.dispatch('/local/challenge', 'POST', { credentialId: primary.credentialId });
    const outcomes = await Promise.all(Array.from({ length: 100 }, ask));
    const statuses = outcomes.map(response => response.status);
    console.log(`QUOTA-WORKER-100 histogram ${JSON.stringify(statusHistogram(statuses))}`);
    const acknowledged = statuses.filter(status => status === 200).length;
    const refused = statuses.filter(status => status === 429).length;
    assert.equal(acknowledged, 3, 'the per-credential cap admits exactly three active challenges');
    assert.equal(refused, 97, 'every other concurrent request is refused with 429');
    assert.equal(await countRows(ctx.db, 'cms_challenges'), acknowledged,
      'acknowledged challenges must exist as rows: no acknowledged-but-missing and no unacknowledged-but-present rows');
    // Concurrent Worker responses may have already-consumed bodies at the proxy
    // boundary. Preserve the 100-response status/D1 proof above, then inspect a
    // fresh sequential denial while the three-challenge quota remains full.
    const refusal = await ask();
    assert.equal(refusal.status, 429, 'saturated challenge quota denies another attempt');
    assert.match((await refusal.json()).error, /Too many active challenges/);
    await ctx.db.prepare(
      'UPDATE cms_challenges SET consumed_at=? WHERE challenge_digest=(SELECT challenge_digest FROM cms_challenges LIMIT 1)'
    ).bind(Math.floor(Date.now() / 1000)).run();
    assert.equal((await ask()).status, 200, 'consumed challenges no longer count against the cap');
    assert.equal(await countRows(ctx.db, 'cms_challenges', 'consumed_at IS NULL'), 3);
    assert.equal(await countRows(ctx.db, 'cms_challenges', 'consumed_at IS NOT NULL'), 1);
  } finally {
    await ctx.mf.dispose();
  }
});

test('M05 LOCAL CMS QUOTA-WORKER-RESTART: challenges survive a restart, then expire and are cleaned up under the fixture clock', { timeout: 240_000 }, async () => {
  const T0 = Date.now();
  const persistencePath = path.join(stateRoot, 'quota-restart-' + randomUUID());
  const first = await openWorkerHostedBootstrapD1({ nowMs: T0, persistencePath });
  const secret = first.secret;
  let primary;
  try {
    [primary] = await seedOwnerWithCredentials(first.db, { nowSeconds: Math.floor(T0 / 1000) });
    const issued = await first.dispatch('/local/challenge', 'POST', { credentialId: primary.credentialId });
    assert.equal(issued.status, 200);
    assert.equal(await countRows(first.db, 'cms_challenges', 'consumed_at IS NULL'), 1);
  } finally {
    await first.mf.dispose();
  }
  const second = await openWorkerHostedBootstrapD1({
    nowMs: T0 + 91_000, persistencePath, secret, applySchema: false,
  });
  try {
    assert.equal(await countRows(second.db, 'cms_challenges'), 1, 'the challenge row survives a restart');
    const fresh = await second.dispatch('/local/challenge', 'POST', { credentialId: primary.credentialId });
    assert.equal(fresh.status, 200, 'a new challenge is permitted after the TTL passed');
    assert.equal(await countRows(second.db, 'cms_challenges'), 1,
      'the expired unconsumed challenge was cleaned up instead of accumulating');
    const active = (await second.db.prepare(
      'SELECT COUNT(*) AS n FROM cms_challenges WHERE consumed_at IS NULL AND expires_at>?'
    ).bind(Math.floor((T0 + 91_000) / 1000)).first()).n;
    assert.equal(active, 1, 'only the fresh challenge is active');
  } finally {
    await second.mf.dispose();
  }
});

for (const contenders of [2, 10]) {
  test(`M05 LOCAL CMS BOOT-${contenders}: fresh D1, ${contenders} independent tickets race, exactly one Owner`, { timeout: 240_000 }, async () => {
    const ctx = await openEmptySyntheticD1();
    try {
      const contenderSet = [];
      for (let i = 0; i < contenders; i++) {
        const ticket = await ctx.ticket();
        const authenticator = makeSyntheticAuthenticator('boot-' + i);
        contenderSet.push({ ticket, authenticator, challenge: await bootstrapChallenge(ctx, ticket) });
      }
      const outcomes = await raceClaims(ctx, contenderSet);
      const statuses = outcomes.map(response => response.status);
      console.log(`BOOT-${contenders} histogram ${JSON.stringify(statusHistogram(statuses))}`);
      assert.equal(statuses.filter(status => status === 201).length, 1, 'exactly one contender may claim the Owner');
      assert.ok(statuses.every(status => status === 201 || status === 403 || status === 409),
        'every loser must be denied without a server fault: ' + statuses.join(','));
      assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
      const credentials = (await ctx.db.prepare('SELECT credential_id,device_kind FROM cms_credentials').all()).results;
      assert.equal(credentials.length, 1, 'losers must leave no credential rows');
      assert.equal(credentials[0].credential_id, contenderSet[statuses.indexOf(201)].authenticator.id);
      assert.equal(credentials[0].device_kind, 'primary');
      assert.equal(await countRows(ctx.db, 'cms_sessions'), 0, 'bootstrap issues no session');
      assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NOT NULL'), 1);
      assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NULL'), contenders - 1);
      assert.equal(await countRows(ctx.db, 'cms_bootstrap_challenges', 'consumed_at IS NOT NULL'), 1);
    } finally { await ctx.mf.dispose(); }
  });
}

test('M05 LOCAL CMS BOOT-100: 100 simultaneous claims in the Worker runtime admit exactly one Owner with zero HTTP 500, on three fresh D1 databases', { timeout: 300_000 }, async () => {
  for (let trial = 1; trial <= 3; trial++) await runWorkerBootstrapRace(100, trial);
});

test('M05 LOCAL CMS BOOT-WORKER-2-10: dispatch-level races at 2 and 10 contenders admit exactly one Owner', { timeout: 240_000 }, async () => {
  for (const contenders of [2, 10]) await runWorkerBootstrapRace(contenders, 1);
});

test('M05 LOCAL CMS BOOT-SAME: one shared ticket raced by 10 authenticators admits one Owner', { timeout: 240_000 }, async () => {
  const ctx = await openEmptySyntheticD1();
  try {
    const ticket = await ctx.ticket();
    const contenderSet = [];
    for (let i = 0; i < 10; i++) {
      contenderSet.push({ authenticator: makeSyntheticAuthenticator('shared-' + i), challenge: await bootstrapChallenge(ctx, ticket) });
    }
    const outcomes = await Promise.all(contenderSet.map(c =>
      ctx.run('/local/bootstrap/claim', 'POST', bootstrapClaimBody(ticket, c.challenge, c.authenticator))));
    const statuses = outcomes.map(response => response.status);
    console.log(`BOOT-SAME histogram ${JSON.stringify(statusHistogram(statuses))}`);
    assert.equal(statuses.filter(status => status === 201).length, 1);
    assert.ok(statuses.every(status => status === 201 || status === 403 || status === 409), statuses.join(','));
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
    assert.equal(await countRows(ctx.db, 'cms_credentials'), 1);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NOT NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_challenges', 'consumed_at IS NOT NULL'), 1);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS BOOT-FAIL: failure after owner insert rolls back owner, credential and ticket', { timeout: 120_000 }, async () => {
  const ctx = await openEmptySyntheticD1();
  try {
    const ticket = await ctx.ticket();
    const authenticator = makeSyntheticAuthenticator('boot-fail');
    const challenge = await bootstrapChallenge(ctx, ticket);
    const body = bootstrapClaimBody(ticket, challenge, authenticator);
    await ctx.db.prepare(`CREATE TRIGGER cms_test_fail_credential BEFORE INSERT ON cms_credentials
      BEGIN SELECT RAISE(ABORT, 'injected write failure'); END`).run();
    const failed = await ctx.run('/local/bootstrap/claim', 'POST', body);
    assert.equal(failed.status, 500);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 0, 'owner insert must roll back');
    assert.equal(await countRows(ctx.db, 'cms_credentials'), 0);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NOT NULL'), 0, 'ticket must stay unconsumed');
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_challenges', 'consumed_at IS NOT NULL'), 0);
    assert.equal(await countRows(ctx.db, 'cms_sessions'), 0);
    const failureText = await failed.text();
    assert.doesNotMatch(failureText, /injected|SQLITE|cms_/i, 'internal failure must not leak SQL details');
    await ctx.db.prepare('DROP TRIGGER cms_test_fail_credential').run();
    const retried = await ctx.run('/local/bootstrap/claim', 'POST', body);
    assert.equal(retried.status, 201, 'the same ticket and challenge succeed once the fault is gone');
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
    assert.equal(await countRows(ctx.db, 'cms_credentials'), 1);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS BOOT-NEG: wrong origin, RP ID, missing UV, challenge, and cross-origin write nothing', { timeout: 120_000 }, async () => {
  const ctx = await openEmptySyntheticD1();
  try {
    const ticket = await ctx.ticket();
    const challenge = await bootstrapChallenge(ctx, ticket);
    const authenticator = makeSyntheticAuthenticator('boot-neg');
    for (const options of [
      { origin: 'https://evil.example.test' },
      { rpId: 'evil.example.test' },
      { flags: 0x41 },
    ]) {
      const denied = await ctx.run('/local/bootstrap/claim', 'POST', bootstrapClaimBody(ticket, challenge, authenticator, options));
      assert.equal(denied.status, 403, 'rejected registration: ' + JSON.stringify(Object.keys(options)));
    }
    const unknown = await ctx.run('/local/bootstrap/claim', 'POST',
      bootstrapClaimBody(ticket, 'ab'.repeat(32), authenticator));
    assert.equal(unknown.status, 403, 'an unissued challenge must be denied');
    const crossOrigin = await ctx.run('/local/bootstrap/claim', 'POST',
      bootstrapClaimBody(ticket, challenge, authenticator), { origin: 'https://evil.example.test' });
    assert.equal(crossOrigin.status, 403);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 0);
    assert.equal(await countRows(ctx.db, 'cms_credentials'), 0);
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_tickets', 'consumed_at IS NOT NULL'), 0, 'failed attempts must not burn the ticket');
    const valid = await ctx.run('/local/bootstrap/claim', 'POST', bootstrapClaimBody(ticket, challenge, authenticator));
    assert.equal(valid.status, 201);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS BOOT-EXPIRY: challenges expire in 90 seconds and tickets in 900 seconds', { timeout: 120_000 }, async () => {
  const ctx = await openEmptySyntheticD1();
  try {
    const ticket = await ctx.ticket();
    const authenticator = makeSyntheticAuthenticator('boot-expiry');
    const stale = await bootstrapChallenge(ctx, ticket);
    ctx.clock.ms += 91_000;
    const expired = await ctx.run('/local/bootstrap/claim', 'POST', bootstrapClaimBody(ticket, stale, authenticator));
    assert.equal(expired.status, 403, 'expired challenge must be denied');
    const fresh = await bootstrapChallenge(ctx, ticket);
    const claimed = await ctx.run('/local/bootstrap/claim', 'POST', bootstrapClaimBody(ticket, fresh, authenticator));
    assert.equal(claimed.status, 201, 'a fresh challenge on the still-valid ticket succeeds');
  } finally { await ctx.mf.dispose(); }
  const late = await openEmptySyntheticD1();
  try {
    const ticket = await late.ticket();
    late.clock.ms += 901_000;
    const denied = await late.run('/local/bootstrap/challenge', 'POST', { ticket });
    assert.equal(denied.status, 403, 'expired ticket must not issue a challenge');
    assert.equal(await countRows(late.db, 'cms_bootstrap_challenges'), 0);
  } finally { await late.mf.dispose(); }
});

test('M05 LOCAL CMS BOOT-QUOTA: active challenges per ticket are bounded', { timeout: 120_000 }, async () => {
  const ctx = await openEmptySyntheticD1();
  try {
    const ticket = await ctx.ticket();
    for (let i = 0; i < 128; i++) await bootstrapChallenge(ctx, ticket);
    const over = await ctx.run('/local/bootstrap/challenge', 'POST', { ticket });
    assert.equal(over.status, 403, 'the 129th active challenge must be refused');
    assert.equal(await countRows(ctx.db, 'cms_bootstrap_challenges'), 128);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS BOOT-RESTART: after a claim, replayed, new, and stale tickets cannot create a second Owner', { timeout: 120_000 }, async () => {
  const ctx = await openEmptySyntheticD1();
  try {
    const firstTicket = await ctx.ticket();
    const winner = makeSyntheticAuthenticator('boot-winner');
    const challenge = await bootstrapChallenge(ctx, firstTicket);
    const body = bootstrapClaimBody(firstTicket, challenge, winner);
    assert.equal((await ctx.run('/local/bootstrap/claim', 'POST', body)).status, 201);
    // The module keeps no process-local state; a restart is a fresh handler over the same D1.
    const restarted = {
      run: (route, method = 'GET', payloadBody = undefined, options = {}) =>
        createLocalCmsHandler({ now: () => ctx.clock.ms })(makeRequest(route, method, payloadBody, options), ctx.env),
    };
    assert.equal((await restarted.run('/local/bootstrap/challenge', 'POST', { ticket: firstTicket })).status, 403, 'replayed ticket');
    const secondTicket = await ctx.ticket();
    assert.equal((await restarted.run('/local/bootstrap/challenge', 'POST', { ticket: secondTicket })).status, 403, 'second owner ticket');
    const rogue = makeSyntheticAuthenticator('boot-rogue');
    const rogueAttempt = await restarted.run('/local/bootstrap/claim', 'POST', bootstrapClaimBody(secondTicket, 'cd'.repeat(32), rogue));
    assert.equal(rogueAttempt.status, 403);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1, 'exactly one Owner after restart');
    assert.equal(await countRows(ctx.db, 'cms_credentials'), 1);
    const logged = await login(restarted, winner);
    assert.match(logged.cookie, /^__Host-cb_m05_local=[0-9a-f]{64}$/);
  } finally { await ctx.mf.dispose(); }
});

// --- Part B · devices, recovery authorization, revocation and emergency ---

const COUNTED_TABLES = ['cms_owner', 'cms_credentials', 'cms_challenges', 'cms_sessions',
  'cms_enroll_challenges', 'cms_recovery_authorizations', 'cms_emergency_authorizations',
  'cms_audit_events', 'cms_drafts', 'cms_draft_revisions', 'cms_bootstrap_tickets', 'cms_bootstrap_challenges'];
async function tableCounts(db) {
  const entries = await Promise.all(COUNTED_TABLES.map(async table => [
    table, (await db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n,
  ]));
  return Object.fromEntries(entries);
}
async function enrollDevice(ctx, sessionInfo, kind, authenticator, options = {}) {
  const challengeResponse = await ctx.run('/local/enroll/challenge', 'POST', { kind }, { ...sessionInfo, ...options });
  if (challengeResponse.status !== 200) return challengeResponse;
  const { challenge } = await challengeResponse.json();
  const registration = makeRegistrationResponse(authenticator, {
    challenge: webauthnChallengeFromHex(challenge), ...(options.registration ?? {}),
  });
  return ctx.run('/local/enroll/claim', 'POST', { challenge, response: registration },
    { ...sessionInfo, ...options });
}
async function signedAssertion(ctx, authenticator, challengeHex) {
  const row = await ctx.db.prepare('SELECT sign_count FROM cms_credentials WHERE credential_id=?')
    .bind(authenticator.id).first();
  const counter = Number(row?.sign_count ?? 0) + 1;
  return makeAuthenticationResponse(authenticator, {
    challenge: webauthnChallengeFromHex(challengeHex), counter,
  });
}
async function authorizeRecovery(ctx, sessionInfo, authenticator) {
  const challengeResponse = await ctx.run('/local/recovery/challenge', 'POST', {}, sessionInfo);
  assert.equal(challengeResponse.status, 200, 'a recovery session may request a recovery challenge');
  const { challenge } = await challengeResponse.json();
  const response = await signedAssertion(ctx, authenticator, challenge);
  return { challenge, response };
}

test('M05 LOCAL CMS B1: recovery enrollment rotates the recovery device, voids its sessions and leaves an audit trail', async () => {
  const ctx = await setup();
  try {
    const oldRecoverySession = await login(ctx, ctx.recovery);
    const primarySession = await login(ctx);
    const nextRecovery = makeSyntheticAuthenticator('recovery-next');
    const enrolled = await enrollDevice(ctx, primarySession, 'recovery', nextRecovery);
    assert.equal(enrolled.status, 201);
    const body = await enrolled.json();
    assert.equal(body.deviceKind, 'recovery');
    assert.equal(body.replaced, true, 'the previously active recovery device was replaced');
    assert.equal(body.usedRecoveryAuthorization, false, 'routine enrollment needs no recovery authorization');
    const active = (await ctx.db.prepare(
      "SELECT credential_id,device_kind FROM cms_credentials WHERE revoked_at IS NULL ORDER BY device_kind"
    ).all()).results;
    assert.deepEqual(active.map(row => [row.device_kind, row.credential_id]),
      [['primary', ctx.primary.id], ['recovery', nextRecovery.id]]);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1, 'enrollment never creates a second Owner');
    assert.equal((await ctx.run('/local/challenge', 'POST', { credentialId: ctx.recovery.id })).status, 403,
      'the replaced recovery device can no longer obtain a challenge');
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, oldRecoverySession)).status, 401,
      'sessions bound to the replaced device are revoked');
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, primarySession)).status, 200,
      'the primary session is untouched by a recovery rotation');
    const nextRecoverySession = await login(ctx, nextRecovery);
    assert.equal((await ctx.run('/local/credentials', 'GET', undefined, nextRecoverySession)).status, 200);
    const audit = (await ctx.db.prepare('SELECT event,actor,device_kind FROM cms_audit_events').all()).results;
    assert.deepEqual(audit, [{ event: 'device_enrolled', actor: 'owner', device_kind: 'recovery' }]);
    const devices = (await (await ctx.run('/local/credentials', 'GET', undefined, nextRecoverySession)).json()).credentials;
    assert.equal(devices.length, 3, 'revoked devices remain visible for audit');
    const negatives = [
      { csrf: '' },
      { origin: 'https://evil.example.test' },
      { fetchSite: 'cross-site' },
    ];
    for (const options of negatives) {
      const before = await tableCounts(ctx.db);
      const deniedEnroll = await enrollDevice(ctx, { ...primarySession, ...options }, 'recovery',
        makeSyntheticAuthenticator('never'));
      assert.notEqual(deniedEnroll.status, 201);
      assert.deepEqual(await tableCounts(ctx.db), before, 'denied enrollment writes nothing');
    }
    const replayChallenge = await ctx.run('/local/enroll/challenge', 'POST', { kind: 'primary' }, primarySession);
    const replay = await replayChallenge.json();
    const replayedResponse = makeRegistrationResponse(makeSyntheticAuthenticator('replay'), {
      challenge: webauthnChallengeFromHex(replay.challenge),
    });
    assert.equal((await ctx.run('/local/enroll/claim', 'POST',
      { challenge: replay.challenge, response: replayedResponse }, primarySession)).status, 201);
    const afterFirst = await tableCounts(ctx.db);
    assert.equal((await ctx.run('/local/enroll/claim', 'POST',
      { challenge: replay.challenge, response: replayedResponse }, primarySession)).status, 403,
    'a consumed enrollment challenge cannot be replayed');
    assert.deepEqual(await tableCounts(ctx.db), afterFirst, 'a replayed challenge writes nothing');
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS B2: a lost primary is replaced only with a single-use recovery authorization', async () => {
  const ctx = await setup();
  try {
    const recoverySession = await login(ctx, ctx.recovery);
    assert.equal((await ctx.run('/local/credentials/revoke', 'POST',
      { credentialId: ctx.primary.id }, recoverySession)).status, 200);
    assert.equal((await ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id })).status, 403,
      'the revoked primary cannot obtain a challenge');
    assert.equal(await countRows(ctx.db, 'cms_credentials', 'revoked_at IS NULL'), 1);

    const nextPrimary = makeSyntheticAuthenticator('primary-next');
    const pendingChallenge = await ctx.run('/local/enroll/challenge', 'POST', { kind: 'primary' }, recoverySession);
    assert.equal(pendingChallenge.status, 200, 'a session may request an enrollment challenge');
    const pending = await pendingChallenge.json();
    const beforeDenied = await tableCounts(ctx.db);
    const deniedEnroll = await ctx.run('/local/enroll/claim', 'POST', {
      challenge: pending.challenge,
      response: makeRegistrationResponse(nextPrimary, { challenge: webauthnChallengeFromHex(pending.challenge) }),
    }, recoverySession);
    assert.equal(deniedEnroll.status, 403, 'replacing a lost primary without additional proof is denied');
    assert.deepEqual(await tableCounts(ctx.db), beforeDenied,
      'the denial writes nothing: no credential, no audit entry, no consumed authorization');

    const { challenge, response } = await authorizeRecovery(ctx, recoverySession, ctx.recovery);
    const authorization = await ctx.run('/local/recovery/complete', 'POST',
      { challenge, credentialId: ctx.recovery.id, response }, recoverySession);
    assert.equal(authorization.status, 200);
    assert.equal((await authorization.json()).kind, 'rotate-primary');
    assert.equal(await countRows(ctx.db, 'cms_recovery_authorizations', 'used_at IS NULL'), 1);

    const enrolled = await enrollDevice(ctx, recoverySession, 'primary', nextPrimary);
    assert.equal(enrolled.status, 201);
    const body = await enrolled.json();
    assert.equal(body.deviceKind, 'primary');
    assert.equal(body.replaced, false, 'no active primary existed to replace');
    assert.equal(body.usedRecoveryAuthorization, true);
    assert.equal(await countRows(ctx.db, 'cms_recovery_authorizations', 'used_at IS NOT NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
    const activePrimary = (await ctx.db.prepare(
      "SELECT credential_id FROM cms_credentials WHERE device_kind='primary' AND revoked_at IS NULL"
    ).first()).credential_id;
    assert.equal(activePrimary, nextPrimary.id);
    const events = (await ctx.db.prepare('SELECT event FROM cms_audit_events ORDER BY created_at').all()).results
      .map(row => row.event);
    assert.deepEqual(events, ['device_revoked', 'recovery_authorized', 'device_enrolled', 'recovery_used']);

    // Single use: lose the new primary again; the spent authorization cannot replace it.
    assert.equal((await ctx.run('/local/credentials/revoke', 'POST',
      { credentialId: nextPrimary.id }, recoverySession)).status, 200);
    const reuseChallenge = await ctx.run('/local/enroll/challenge', 'POST', { kind: 'primary' }, recoverySession);
    assert.equal(reuseChallenge.status, 200);
    const reusePending = await reuseChallenge.json();
    const beforeReuse = await tableCounts(ctx.db);
    const reuse = await ctx.run('/local/enroll/claim', 'POST', {
      challenge: reusePending.challenge,
      response: makeRegistrationResponse(makeSyntheticAuthenticator('primary-third'),
        { challenge: webauthnChallengeFromHex(reusePending.challenge) }),
    }, recoverySession);
    assert.equal(reuse.status, 403, 'a consumed recovery authorization cannot be reused');
    assert.deepEqual(await tableCounts(ctx.db), beforeReuse);

    // A second authorization is required and must come from a fresh recovery assertion.
    const second = await authorizeRecovery(ctx, recoverySession, ctx.recovery);
    assert.equal((await ctx.run('/local/recovery/complete', 'POST',
      { challenge: second.challenge, credentialId: ctx.recovery.id, response: second.response },
      recoverySession)).status, 200);
    const third = makeSyntheticAuthenticator('primary-third');
    assert.equal((await enrollDevice(ctx, recoverySession, 'primary', third)).status, 201);

    // Replay of a recovery completion challenge is denied without writing.
    const stale = await authorizeRecovery(ctx, recoverySession, ctx.recovery);
    assert.equal((await ctx.run('/local/recovery/complete', 'POST',
      { challenge: stale.challenge, credentialId: ctx.recovery.id, response: stale.response },
      recoverySession)).status, 200);
    const beforeReplay = await tableCounts(ctx.db);
    assert.notEqual((await ctx.run('/local/recovery/complete', 'POST',
      { challenge: stale.challenge, credentialId: ctx.recovery.id, response: stale.response },
      recoverySession)).status, 200);
    assert.deepEqual(await tableCounts(ctx.db), beforeReplay);

    // Device administration guards.
    assert.equal((await ctx.run('/local/credentials/revoke', 'POST',
      { credentialId: third.id }, { ...recoverySession, csrf: '' })).status, 403);
    const selfRevoke = await ctx.run('/local/credentials/revoke', 'POST',
      { credentialId: ctx.recovery.id }, recoverySession);
    assert.equal(selfRevoke.status, 403, 'a session cannot revoke its own authorizing credential');
    assert.equal((await ctx.run('/local/credentials/revoke', 'POST',
      { credentialId: 'does-not-exist' }, recoverySession)).status, 409);
    assert.equal((await ctx.run('/local/credentials', 'GET', undefined,
      { cookie: 'not-a-session', csrf: '' })).status, 401);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
  } finally { await ctx.mf.dispose(); }
});

// --- Part C · authorization, session, cookie and CSRF matrix ---

async function expectDenied(ctx, label, { route, method = 'GET', body, options = {}, status }) {
  const before = await tableCounts(ctx.db);
  const response = await ctx.run(route, method, body, options);
  assert.deepEqual(await tableCounts(ctx.db), before, `${label}: ${method} ${route} must write nothing`);
  assert.equal(response.status, status, `${label}: ${method} ${route} expected ${status}, got ${response.status}`);
  assert.equal(response.headers.get('set-cookie'), null, `${label}: denied responses set no cookie`);
  const text = await response.text();
  assert.doesNotMatch(text, /"drafts"|"credentials"|"revision"|"csrf"|"challenge"/,
    `${label}: denied responses leak no privileged fields`);
  return response;
}

test('M05 LOCAL CMS C1: deny-by-default matrix over privileged routes, identities, origin and CSRF', async () => {
  const ctx = await setup();
  try {
    const session = await login(ctx);
    const created = await ctx.run('/local/articles', 'POST', { ...sampleDraft, idempotencyKey: seedIdempotency() }, session);
    assert.equal(created.status, 201);
    const draftId = (await created.json()).id;
    const draftBody = { ...sampleDraft, idempotencyKey: seedIdempotency() };
    const patchBody = { ...sampleDraft, expectedRevision: 1, idempotencyKey: seedIdempotency() };
    const routes = [
      ['GET', '/local/articles', undefined],
      ['GET', `/local/articles/${draftId}`, undefined],
      ['GET', `/local/articles/${draftId}/revisions`, undefined],
      ['POST', '/local/articles', draftBody],
      ['PATCH', `/local/articles/${draftId}`, patchBody],
      ['GET', '/local/credentials', undefined],
      ['GET', '/local/workspace', undefined],
      ['POST', '/local/credentials/revoke', { credentialId: 'unknown-credential' }],
      ['POST', '/local/enroll/challenge', { kind: 'recovery' }],
      ['POST', '/local/enroll/claim', { challenge: 'aa'.repeat(32), response: {} }],
      ['POST', '/local/recovery/challenge', {}],
      ['POST', '/local/recovery/complete', { challenge: 'aa'.repeat(32), credentialId: ctx.recovery.id, response: {} }],
    ];
    for (const [method, route, body] of routes) {
      const isRead = method === 'GET';
      const unauthorized = isRead ? 401 : 403;
      const rejected = isRead ? 403 : 403;
      const cases = [
        { label: 'anonymous', status: unauthorized, options: {} },
        { label: 'tampered cookie', status: unauthorized,
          options: { cookie: '__Host-cb_m05_local=' + 'ab'.repeat(32) } },
        { label: 'duplicate cookie', status: unauthorized,
          options: { cookie: session.cookie + '; ' + session.cookie } },
        { label: 'wrong origin', status: rejected,
          options: { cookie: session.cookie, csrf: session.csrf, origin: 'https://evil.example.test' } },
        { label: 'cross-site fetch metadata', status: rejected,
          options: { cookie: session.cookie, csrf: session.csrf, fetchSite: 'cross-site' } },
        { label: 'missing fetch metadata', status: rejected,
          options: { cookie: session.cookie, csrf: session.csrf, fetchSite: '' } },
        { label: 'invented bearer', status: isRead ? 401 : 403,
          options: { csrf: session.csrf } },
      ];
      if (!isRead) {
        cases.push(
          { label: 'missing CSRF', status: 403, options: { cookie: session.cookie } },
          { label: 'wrong CSRF', status: 403, options: { cookie: session.cookie, csrf: 'ff'.repeat(32) } },
          { label: 'malformed CSRF', status: 403, options: { cookie: session.cookie, csrf: 'not-hex' } },
        );
      }
      for (const testCase of cases) await expectDenied(ctx, testCase.label,
        { route, method, body, options: testCase.options, status: testCase.status });
    }
    // The matrix must not have consumed the live session or mutated stored data.
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, session)).status, 200);
    assert.equal(await countRows(ctx.db, 'cms_drafts'), 1);
    assert.equal((await ctx.db.prepare('SELECT revision FROM cms_drafts WHERE id=?').bind(draftId).first()).revision, 1);
    assert.equal(await countRows(ctx.db, 'cms_sessions', 'revoked_at IS NULL'), 1);
    // A hostile Referer is not an authorization input: the request still succeeds on its own merits.
    assert.equal((await ctx.run('/local/articles', 'GET', undefined,
      { ...session, referer: 'https://evil.example.test/' })).status, 200);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS C2: unexpected methods, URL shapes and payload forms are refused without writes', async () => {
  const ctx = await setup();
  try {
    const session = await login(ctx);
    const created = await ctx.run('/local/articles', 'POST', { ...sampleDraft, idempotencyKey: seedIdempotency() }, session);
    const draftId = (await created.json()).id;
    const before = await tableCounts(ctx.db);
    const knownPaths = ['/local/articles', `/local/articles/${draftId}`, `/local/articles/${draftId}/revisions`,
      '/local/credentials', '/local/enroll/challenge', '/local/recovery/challenge', '/local/emergency/claim'];
    for (const path of knownPaths) {
      for (const method of ['PUT', 'DELETE', 'OPTIONS', 'HEAD']) {
        const response = await ctx.run(path, method, undefined, session);
        assert.equal(response.status, 405, `${method} ${path} must answer 405`);
        assert.ok(response.headers.get('allow'), `${method} ${path} must advertise allowed methods`);
      }
    }
    const unknown = await ctx.run('/local/unknown-route', 'GET');
    assert.equal(unknown.status, 404);
    const unknowns = ['/local/articles/', '//local/articles',
      '/local/articles/not-a-uuid', '/LOCAL/ARTICLES'];
    for (const path of unknowns) {
      assert.equal((await ctx.run(path, 'GET', undefined, session)).status, 404, `${path} must not resolve`);
    }
    // Encoded traversal is normalized by the URL parser onto a protected route, so
    // authorization is what protects it: anonymous is refused and an owner is served.
    assert.equal((await ctx.run('/local/articles/%2e%2e/articles', 'GET')).status, 401);
    assert.equal((await ctx.run('/local/articles/%2e%2e/articles', 'GET', undefined, session)).status, 200);
    // Normalized traversal still lands on the protected route: authorization is what protects it.
    assert.equal((await ctx.run('/local/../local/articles', 'GET', undefined, session)).status, 200);
    assert.equal((await ctx.run('/local/articles?filter=all', 'GET', undefined, session)).status, 200);
    // Wrong content type and oversized bodies are refused before parsing.
    const wrongType = await ctx.run('/local/articles', 'POST', { ...sampleDraft, idempotencyKey: seedIdempotency() },
      { ...session, contentType: 'text/plain' });
    assert.equal(wrongType.status, 403);
    const oversized = await ctx.run('/local/articles', 'POST',
      { ...sampleDraft, body: 'x'.repeat(70_000), idempotencyKey: seedIdempotency() }, session);
    assert.equal(oversized.status, 400);
    assert.deepEqual(await tableCounts(ctx.db), before, 'no refused request may write');
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS C3: cookie attributes, digest-only storage, expiry, rotation and revocation', async () => {
  const ctx = await setup();
  try {
    const challenge = (await (await ctx.run('/local/challenge', 'POST', { credentialId: ctx.primary.id })).json()).challenge;
    const response = makeAuthenticationResponse(ctx.primary, { challenge: webauthnChallengeFromHex(challenge) });
    const logged = await ctx.run('/local/login', 'POST', { challenge, credentialId: ctx.primary.id, response });
    assert.equal(logged.status, 200);
    const setCookie = logged.headers.get('set-cookie');
    assert.match(setCookie, /^__Host-cb_m05_local=[0-9a-f]{64}; Path=\/; Secure; HttpOnly; SameSite=Strict/);
    assert.doesNotMatch(setCookie, /Domain=/i);
    const cookie = setCookie.split(';')[0];
    const csrf = (await logged.clone().json()).csrf;
    assert.match(csrf, /^[0-9a-f]{64}$/);
    const stored = await ctx.db.prepare('SELECT * FROM cms_sessions').first();
    assert.match(stored.session_digest, /^[0-9a-f]{64}$/);
    assert.match(stored.csrf_digest, /^[0-9a-f]{64}$/);
    assert.notEqual(stored.session_digest, cookie.slice('__Host-cb_m05_local='.length));
    assert.notEqual(stored.csrf_digest, csrf);
    for (const [column, value] of Object.entries(stored)) {
      if (typeof value === 'string') {
        assert.ok(!value.includes(cookie.slice('__Host-cb_m05_local='.length)),
          `raw session token must not be stored (${column})`);
        assert.ok(!value.includes(csrf), `raw CSRF token must not be stored (${column})`);
      }
    }
    const live = { cookie, csrf };
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, live)).status, 200);
    ctx.time(Date.now() + 1_201_000);
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, live)).status, 401,
      'a session past its TTL is refused');
    ctx.time(Date.now());
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, live)).status, 200,
      'expiry is absolute-time based: the harness clock moving back is not a security decision');

    const fresh = await login(ctx);
    assert.equal((await ctx.run('/local/logout', 'POST', {}, fresh)).status, 200);
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, fresh)).status, 401,
      'a revoked session cannot be reused');
    const other = await login(ctx, ctx.recovery);
    const secondLogin = await login(ctx);
    assert.equal((await ctx.run('/local/credentials/revoke', 'POST',
      { credentialId: ctx.recovery.id }, secondLogin)).status, 200);
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, other)).status, 401,
      'revoking a device kills the sessions bound to it');
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, secondLogin)).status, 200);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS B3: offline emergency authorization is single-use, expiring and total', async () => {
  const ctx = await setup();
  try {
    const activeSession = await login(ctx);
    let clockMs = Date.now();
    const issue = () => issueEmergencyAuthorization(ctx.db, ctx.env.CMS_TEST_HMAC_KEY, Math.floor(clockMs / 1000));
    const claimEmergency = (token, authenticator, options = {}) => {
      const registration = makeRegistrationResponse(authenticator, {
        challenge: webauthnChallengeFromHex(token), ...(options.registration ?? {}),
      });
      return ctx.run('/local/emergency/claim', 'POST', { token, response: registration }, options);
    };
    // Wrong proof: a fabricated token or a mismatched challenge writes nothing.
    const realToken = await issue();
    const before = await tableCounts(ctx.db);
    const fabricated = await claimEmergency('ab'.repeat(32), makeSyntheticAuthenticator('fake'));
    assert.equal(fabricated.status, 403);
    const mismatched = await claimEmergency(realToken, makeSyntheticAuthenticator('mismatch'), {
      registration: { challenge: 'cd'.repeat(32) },
    });
    assert.equal(mismatched.status, 403, 'the registration must sign the token challenge itself');
    const wrongOrigin = await claimEmergency(realToken, makeSyntheticAuthenticator('origin'), {
      origin: 'https://evil.example.test',
    });
    assert.equal(wrongOrigin.status, 403);
    assert.deepEqual(await tableCounts(ctx.db), before, 'every denied emergency attempt writes nothing');

    const emergencyCredential = makeSyntheticAuthenticator('emergency-primary');
    const claimed = await claimEmergency(realToken, emergencyCredential);
    assert.equal(claimed.status, 201);
    assert.deepEqual(await claimed.json(), { owner: 1, deviceKind: 'primary', emergency: true });
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1, 'emergency recovery never creates a second Owner');
    assert.equal(await countRows(ctx.db, 'cms_credentials', 'revoked_at IS NULL'), 1);
    assert.equal((await ctx.db.prepare(
      "SELECT credential_id FROM cms_credentials WHERE revoked_at IS NULL"
    ).first()).credential_id, emergencyCredential.id);
    assert.equal(await countRows(ctx.db, 'cms_credentials', 'revoked_at IS NOT NULL'), 2,
      'both existing devices are revoked by the emergency claim');
    assert.equal(await countRows(ctx.db, 'cms_sessions', 'revoked_at IS NULL'), 0,
      'every session is revoked by the emergency claim');
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, activeSession)).status, 401);
    const events = (await ctx.db.prepare('SELECT event,actor FROM cms_audit_events ORDER BY created_at').all()).results;
    assert.deepEqual(events, [
      { event: 'emergency_used', actor: 'operator-emergency-token' },
      { event: 'device_enrolled', actor: 'owner-emergency' },
    ]);

    const afterClaim = await tableCounts(ctx.db);
    const replay = await claimEmergency(realToken, makeSyntheticAuthenticator('replay'));
    assert.equal(replay.status, 403, 'the emergency token is single-use');
    assert.deepEqual(await tableCounts(ctx.db), afterClaim, 'a replayed token writes nothing');

    const expiringToken = await issue();
    clockMs += 901_000;
    ctx.time(clockMs);
    assert.equal((await claimEmergency(expiringToken, makeSyntheticAuthenticator('expired'))).status, 403,
      'an expired emergency token is refused');
    assert.equal((await claimEmergency(realToken, makeSyntheticAuthenticator('old'))).status, 403);

    const fresh = await issue();
    const replacement = makeSyntheticAuthenticator('emergency-second');
    assert.equal((await claimEmergency(fresh, replacement)).status, 201,
      'a fresh authorization still works after recovery');
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
    assert.equal(await countRows(ctx.db, 'cms_credentials', 'revoked_at IS NULL'), 1);
    const session = await login(ctx, replacement);
    assert.equal((await ctx.run('/local/articles', 'GET', undefined, session)).status, 200);
  } finally { await ctx.mf.dispose(); }
});

// --- Part D · D1 LOCAL schema, CAS, failure injection and restore ---

const DUMP_TABLES = ['cms_owner', 'cms_credentials', 'cms_drafts', 'cms_draft_revisions',
  'cms_challenges', 'cms_sessions', 'cms_bootstrap_tickets', 'cms_bootstrap_challenges',
  'cms_enroll_challenges', 'cms_recovery_authorizations', 'cms_emergency_authorizations', 'cms_audit_events'];

function normalizeBlob(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return value;
}
function tableDigest(rows) {
  const canonical = rows
    .map(row => JSON.stringify(Object.fromEntries(Object.entries(row).sort())))
    .sort()
    .join('\n');
  return createHash('sha256').update(canonical).digest('hex');
}
async function dumpLocalDatabase(db) {
  const dump = {};
  for (const table of DUMP_TABLES) {
    const { results } = await db.prepare(`SELECT * FROM ${table}`).all();
    dump[table] = results;
  }
  return dump;
}
async function dumpTable(db, table) {
  return (await db.prepare(`SELECT * FROM ${table}`).all()).results;
}
async function restoreLocalDatabase(db, dump) {
  // One batch == one transaction: a corrupted or incompatible backup restores nothing at all.
  const statements = [];
  for (const table of DUMP_TABLES) {
    for (const row of dump[table]) {
      const columns = Object.keys(row);
      statements.push(db.prepare(
        `INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`
      ).bind(...columns.map(column => normalizeBlob(row[column]))));
    }
  }
  if (statements.length === 0) return;
  await db.batch(statements);
}

test('M05 LOCAL CMS C4: the privileged HTML workspace requires a session and escapes owner content', async () => {
  const ctx = await setup();
  try {
    const anonymous = await ctx.run('/local/workspace', 'GET');
    assert.equal(anonymous.status, 401, 'the privileged HTML page denies anonymous visitors');
    const anonymousHtml = await anonymous.text();
    assert.match(anonymousHtml, /Sign in required/);
    assert.doesNotMatch(anonymousHtml, /primary|recovery|rev \d/i, 'no Owner device or draft data is embedded');
    const session = await login(ctx);
    const hostileTitle = 'Escaped <script>alert(1)</script> title';
    const created = await ctx.run('/local/articles', 'POST', {
      ...sampleDraft, title: hostileTitle, idempotencyKey: seedIdempotency(),
    }, session);
    assert.equal(created.status, 201);
    const authorized = await ctx.run('/local/workspace', 'GET', undefined, session);
    assert.equal(authorized.status, 200);
    const workspaceCsp = authorized.headers.get('content-security-policy');
    assert.match(workspaceCsp, /style-src 'nonce-[0-9a-f]{64}'/, 'workspace CSP limits inline styles to its nonce');
    const html = await authorized.text();
    const styleNonce = /style-src 'nonce-([0-9a-f]{64})'/.exec(workspaceCsp)[1];
    assert.ok(html.includes('<style nonce="' + styleNonce + '">'), 'CSP and stylesheet nonces match');
    assert.match(html, /Local Owner Workspace/);
    assert.match(html, /primary · [A-Za-z0-9_-]{10}… · active/);
    assert.match(html, /recovery · [A-Za-z0-9_-]{10}… · active/);
    assert.ok(html.includes('Escaped &lt;script&gt;alert(1)&lt;/script&gt; title'), 'owner content is escaped');
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
    assert.doesNotMatch(html, /session_digest|csrf|__Host-cb_m05_local/i, 'no session secret is rendered');
    const wrongOrigin = await ctx.run('/local/workspace', 'GET', undefined,
      { ...session, origin: 'https://evil.example.test' });
    assert.equal(wrongOrigin.status, 403, 'a hostile origin gets a denial page, not owner data');
    assert.doesNotMatch(await wrongOrigin.text(), /primary · /);
    await ctx.run('/local/logout', 'POST', {}, session);
    assert.equal((await ctx.run('/local/workspace', 'GET', undefined, session)).status, 401,
      'the page is denied again after logout');
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS B4: concurrent recovery and emergency claims admit exactly one winner', async () => {
  const ctx = await setup();
  try {
    // One single-use emergency authorization, two simultaneous claims.
    const token = await issueEmergencyAuthorization(ctx.db, ctx.env.CMS_TEST_HMAC_KEY, Math.floor(Date.now() / 1000));
    const claim = authenticator => ctx.run('/local/emergency/claim', 'POST', {
      token,
      response: makeRegistrationResponse(authenticator, { challenge: webauthnChallengeFromHex(token) }),
    });
    const [first, second] = await Promise.all([
      claim(makeSyntheticAuthenticator('race-emergency-a')),
      claim(makeSyntheticAuthenticator('race-emergency-b')),
    ]);
    const statuses = [first.status, second.status];
    assert.equal(statuses.filter(status => status === 201).length, 1, 'exactly one emergency claim wins');
    assert.equal(statuses.filter(status => status === 403 || status === 409).length, 1, 'the loser is denied');
    assert.equal(await countRows(ctx.db, 'cms_emergency_authorizations', 'used_at IS NOT NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
    assert.equal(await countRows(ctx.db, 'cms_credentials', 'revoked_at IS NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_audit_events', "event='emergency_used'"), 1,
      'the audit trail records exactly one emergency use');

    // One recovery authorization, two simultaneous primary enrollments.
    const fresh = await setup();
    try {
      const session = await login(fresh, fresh.recovery);
      assert.equal((await fresh.run('/local/credentials/revoke', 'POST',
        { credentialId: fresh.primary.id }, session)).status, 200);
      const { challenge, response } = await authorizeRecovery(fresh, session, fresh.recovery);
      assert.equal((await fresh.run('/local/recovery/complete', 'POST',
        { challenge, credentialId: fresh.recovery.id, response }, session)).status, 200);
      const contenders = [];
      for (const label of ['race-primary-a', 'race-primary-b']) {
        const pending = await fresh.run('/local/enroll/challenge', 'POST', { kind: 'primary' }, session);
        const { challenge: enrollChallenge } = await pending.json();
        contenders.push({ challenge: enrollChallenge, authenticator: makeSyntheticAuthenticator(label) });
      }
      const enroll = contender => fresh.run('/local/enroll/claim', 'POST', {
        challenge: contender.challenge,
        response: makeRegistrationResponse(contender.authenticator,
          { challenge: webauthnChallengeFromHex(contender.challenge) }),
      }, session);
      const outcomes = await Promise.all(contenders.map(enroll));
      const enrollStatuses = outcomes.map(outcome => outcome.status);
      const enrollBodies = await Promise.all(outcomes.map(outcome =>
        outcome.clone().json().catch(() => ({}))));
      assert.equal(enrollStatuses.filter(status => status === 201).length, 1,
        'one lost-primary recovery authorization permits exactly one successful enrollment');
      assert.equal(enrollStatuses.filter(status => status === 403 || status === 409).length, 1,
        'the second lost-primary contender is denied, not recast as ordinary rotation');
      const survivingPrimary = (await fresh.db.prepare(
        "SELECT credential_id FROM cms_credentials WHERE device_kind='primary' AND revoked_at IS NULL"
      ).first()).credential_id;
      assert.equal(survivingPrimary, contenders[enrollStatuses.indexOf(201)].authenticator.id,
        'the first winning primary cannot be displaced by the losing claimant');
      assert.equal(enrollBodies.filter(body => body.usedRecoveryAuthorization === true).length, 1,
        'exactly one claim consumes the single-use recovery authorization');
      assert.equal(await countRows(fresh.db, 'cms_credentials', "device_kind='primary' AND revoked_at IS NULL"), 1,
        'exactly one primary device remains active');
      assert.equal(await countRows(fresh.db, 'cms_recovery_authorizations', 'used_at IS NOT NULL'), 1);
      assert.equal(await countRows(fresh.db, 'cms_audit_events', "event='recovery_used'"), 1,
        'the audit trail records exactly one recovery use');
      assert.equal(await countRows(fresh.db, 'cms_audit_events', "event='device_enrolled'"), 1,
        'a lost-primary recovery may enroll only one new primary');
      assert.equal(await countRows(fresh.db, 'cms_enroll_challenges', 'consumed_at IS NOT NULL'), 1,
        'the denied recovery contender must not consume its enrollment challenge');
      assert.equal(await countRows(fresh.db, 'cms_enroll_challenges', 'consumed_at IS NULL'), 1,
        'the losing recovery challenge remains unconsumed and writes no audit entry');
      assert.equal(await countRows(fresh.db, 'cms_owner'), 1);
    } finally { await fresh.mf.dispose(); }
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS B5: lost-primary recovery binds claim and authorization to one authenticated session', async () => {
  const ctx = await setup();
  try {
    const authorizedSession = await login(ctx, ctx.recovery);
    const secondSession = await login(ctx, ctx.recovery);
    assert.notEqual(authorizedSession.cookie, secondSession.cookie, 'both sessions are independent');

    // A normal-rotation challenge issued before the primary is lost cannot be
    // converted into a recovery bypass after that primary is revoked.
    const oldChallengeResponse = await ctx.run('/local/enroll/challenge', 'POST',
      { kind: 'primary' }, authorizedSession);
    assert.equal(oldChallengeResponse.status, 200);
    const { challenge: oldChallenge } = await oldChallengeResponse.json();
    assert.equal((await ctx.run('/local/credentials/revoke', 'POST',
      { credentialId: ctx.primary.id }, authorizedSession)).status, 200);
    const oldAttemptAuthenticator = makeSyntheticAuthenticator('b5-stale-normal-rotation');
    const beforeOld = await tableCounts(ctx.db);
    const deniedOld = await ctx.run('/local/enroll/claim', 'POST', {
      challenge: oldChallenge,
      response: makeRegistrationResponse(oldAttemptAuthenticator,
        { challenge: webauthnChallengeFromHex(oldChallenge) }),
    }, authorizedSession);
    assert.equal(deniedOld.status, 409, 'a pre-loss normal-rotation challenge must fail closed');
    assert.deepEqual(await tableCounts(ctx.db), beforeOld, 'the stale challenge denial writes nothing');

    const { challenge, response } = await authorizeRecovery(ctx, authorizedSession, ctx.recovery);
    assert.equal((await ctx.run('/local/recovery/complete', 'POST',
      { challenge, credentialId: ctx.recovery.id, response }, authorizedSession)).status, 200);

    const ownIssued = await ctx.run('/local/enroll/challenge', 'POST',
      { kind: 'primary' }, authorizedSession);
    assert.equal(ownIssued.status, 200);
    const { challenge: ownChallenge } = await ownIssued.json();
    const replacement = makeSyntheticAuthenticator('b5-approved-primary');
    const ownClaim = {
      challenge: ownChallenge,
      response: makeRegistrationResponse(replacement,
        { challenge: webauthnChallengeFromHex(ownChallenge) }),
    };
    const beforeBorrowed = await tableCounts(ctx.db);
    assert.equal((await ctx.run('/local/enroll/claim', 'POST', ownClaim, secondSession)).status, 403,
      'a different session cannot claim a challenge bound to the authorized session');
    assert.deepEqual(await tableCounts(ctx.db), beforeBorrowed,
      'cross-session challenge replay writes nothing');

    const otherIssued = await ctx.run('/local/enroll/challenge', 'POST',
      { kind: 'primary' }, secondSession);
    assert.equal(otherIssued.status, 200);
    const { challenge: otherChallenge } = await otherIssued.json();
    const otherAuthenticator = makeSyntheticAuthenticator('b5-unauthorized-primary');
    const beforeOther = await tableCounts(ctx.db);
    assert.equal((await ctx.run('/local/enroll/claim', 'POST', {
      challenge: otherChallenge,
      response: makeRegistrationResponse(otherAuthenticator,
        { challenge: webauthnChallengeFromHex(otherChallenge) }),
    }, secondSession)).status, 403, 'another session cannot borrow the one-use recovery authorization');
    assert.deepEqual(await tableCounts(ctx.db), beforeOther,
      'an unauthorized session consumes no challenge, recovery authorization or audit event');

    const accepted = await ctx.run('/local/enroll/claim', 'POST', ownClaim, authorizedSession);
    assert.equal(accepted.status, 201, 'the issuing recovery session may claim its own challenge');
    const active = (await ctx.db.prepare(
      "SELECT credential_id FROM cms_credentials WHERE device_kind='primary' AND revoked_at IS NULL"
    ).first()).credential_id;
    assert.equal(active, replacement.id);
    assert.equal(await countRows(ctx.db, 'cms_recovery_authorizations', 'used_at IS NOT NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_enroll_challenges', 'consumed_at IS NOT NULL'), 1);
    assert.equal(await countRows(ctx.db, 'cms_audit_events', "event='device_enrolled'"), 1);
  } finally { await ctx.mf.dispose(); }
});


test('M05 LOCAL CMS B6 / R102: recovery challenge is bound to the issuing session, not just the passkey', async () => {
  const ctx = await setup();
  try {
    const sessionA = await login(ctx, ctx.recovery);
    const sessionB = await login(ctx, ctx.recovery);
    assert.notEqual(sessionA.cookie, sessionB.cookie, 'the recovery passkey may back distinct sessions');

    const { challenge, response } = await authorizeRecovery(ctx, sessionA, ctx.recovery);
    const challengeDigest = createHash('sha256').update(challenge).digest('hex');
    const digestSession = current => createHmac('sha256', Buffer.from(ctx.env.CMS_TEST_HMAC_KEY, 'hex'))
      .update(current.cookie.split('=')[1]).digest('hex');
    const persisted = await ctx.db.prepare(
      'SELECT purpose,session_digest,consumed_at FROM cms_challenges WHERE challenge_digest=?'
    ).bind(challengeDigest).first();
    assert.equal(persisted.purpose, 'recovery');
    assert.equal(persisted.session_digest, digestSession(sessionA),
      'the challenge carries the digest of the exact session that requested it');
    assert.notEqual(persisted.session_digest, digestSession(sessionB));

    const claim = current => ctx.run('/local/recovery/complete', 'POST',
      { challenge, credentialId: ctx.recovery.id, response }, current);
    const beforeCounts = await tableCounts(ctx.db);
    const beforeCounter = (await ctx.db.prepare(
      'SELECT sign_count FROM cms_credentials WHERE credential_id=?'
    ).bind(ctx.recovery.id).first()).sign_count;

    assert.equal((await claim(sessionB)).status, 403,
      'another authenticated session cannot consume an assertion signed for session A');
    assert.deepEqual(await tableCounts(ctx.db), beforeCounts,
      'cross-session denial must not consume the challenge or write an authorization/audit');
    assert.equal((await ctx.db.prepare(
      'SELECT sign_count FROM cms_credentials WHERE credential_id=?'
    ).bind(ctx.recovery.id).first()).sign_count, beforeCounter,
    'denial does not advance the authenticator sign counter');
    assert.equal((await ctx.db.prepare(
      'SELECT consumed_at FROM cms_challenges WHERE challenge_digest=?'
    ).bind(challengeDigest).first()).consumed_at, null, 'denied challenge stays unconsumed');

    assert.equal((await claim(sessionA)).status, 200,
      'the actual challenge-issuing session can complete recovery once');
    assert.equal(await countRows(ctx.db, 'cms_recovery_authorizations'), 1);
    assert.equal(await countRows(ctx.db, 'cms_audit_events', "event='recovery_authorized'"), 1);
    const issued = await ctx.db.prepare(
      "SELECT credential_id,session_digest FROM cms_recovery_authorizations WHERE kind='rotate-primary'"
    ).first();
    assert.equal(issued.credential_id, ctx.recovery.id);
    assert.equal(issued.session_digest, digestSession(sessionA),
      'one-use recovery authorization remains bound to the issuing session');

    const afterSuccess = await tableCounts(ctx.db);
    assert.equal((await claim(sessionA)).status, 403, 'replay by the original session is denied');
    assert.equal((await claim(sessionB)).status, 403, 'replay by the other session is denied');
    assert.deepEqual(await tableCounts(ctx.db), afterSuccess, 'replays do not mutate any table');
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS D1: schema replay is explicit and referential integrity is enforced by local D1', async () => {
  const ctx = await setup();
  try {
    const before = await tableCounts(ctx.db);
    await assert.rejects(
      (async () => {
        for (const statement of splitLocalSchemaStatements(schema)) await ctx.db.prepare(statement).run();
      })(),
      /already exists/i,
      'replaying the schema on an existing database fails explicitly instead of silently diverging',
    );
    assert.deepEqual(await tableCounts(ctx.db), before, 'a refused replay leaves the database intact');
    const fkEnforced = await ctx.db.prepare("SELECT COUNT(*) AS n FROM pragma_foreign_key_list('cms_sessions')").first();
    assert.ok(fkEnforced.n >= 3, 'sessions reference owner, credential and challenge');
    await assert.rejects(
      ctx.db.prepare(`INSERT INTO cms_sessions(session_digest,csrf_digest,owner_id,issued_at,expires_at,challenge_digest,credential_id)
        VALUES (?,?,1,1,2,?,?)`).bind('a'.repeat(64), 'b'.repeat(64), 'c'.repeat(64), 'unknown-credential').run(),
      /FOREIGN KEY|constraint/i,
    );
    await assert.rejects(
      ctx.db.prepare(`INSERT INTO cms_credentials(credential_id,owner_id,public_key,sign_count,device_kind)
        VALUES ('x',1,?,0,'tertiary')`).bind(new Uint8Array(65)).run(),
      /CHECK constraint/i,
    );
    assert.equal(await countRows(ctx.db, 'cms_owner'), 1);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS D2: concurrent revisions resolve to exactly one winning writer inside the Worker', { timeout: 240_000 }, async () => {
  const ctx = await openWorkerHostedBootstrapD1();
  try {
    const ticket = await ctx.ticket();
    const ownerDevice = makeSyntheticAuthenticator('cas-owner');
    const challengeResponse = await ctx.dispatch('/local/bootstrap/challenge', 'POST', { ticket });
    assert.equal(challengeResponse.status, 200,
      'bootstrap challenge must be issued: ' + await challengeResponse.clone().text());
    const { challenge } = await challengeResponse.json();
    const claimResponse = await ctx.dispatch('/local/bootstrap/claim', 'POST', bootstrapClaimBody(ticket, challenge, ownerDevice));
    assert.equal(claimResponse.status, 201, 'bootstrap claim must succeed: ' + await claimResponse.clone().text());
    const session = await workerLogin(ctx, ownerDevice);
    const created = await ctx.dispatch('/local/articles', 'POST',
      { ...sampleDraft, idempotencyKey: seedIdempotency() }, authHeaders(session));
    assert.equal(created.status, 201);
    const draftId = (await created.json()).id;
    const contenders = await Promise.all(Array.from({ length: 10 }, (_, index) =>
      ctx.dispatch(`/local/articles/${draftId}`, 'PATCH', {
        ...sampleDraft, title: 'Concurrent CAS contender number ' + index,
        expectedRevision: 1, idempotencyKey: seedIdempotency(),
      }, authHeaders(session))));
    const statuses = contenders.map(response => response.status);
    console.log(`CAS-10 histogram ${JSON.stringify(statusHistogram(statuses))}`);
    assert.equal(statuses.filter(status => status === 200).length, 1, 'exactly one writer may win the revision race');
    assert.equal(statuses.filter(status => status === 409).length, 9, 'every other writer gets a revision conflict');
    assert.equal(statuses.filter(status => status === 500).length, 0, 'no server fault under revision contention');
    const draft = await ctx.db.prepare('SELECT revision,title FROM cms_drafts WHERE id=?').bind(draftId).first();
    assert.equal(draft.revision, 2, 'the winning revision is exactly one step ahead');
    assert.match(draft.title, /^Concurrent CAS contender number \d+$/);
    assert.equal(await countRows(ctx.db, 'cms_draft_revisions', `draft_id='${draftId}'`), 2,
      'no orphan or duplicated revision rows');
    assert.equal((await ctx.db.prepare(
      'SELECT COUNT(*) AS n FROM cms_draft_revisions WHERE draft_id=? AND revision=2'
    ).bind(draftId).first()).n, 1);
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS D3: injected mid-transaction failures roll back completely and the retry is safe', async () => {
  const ctx = await setup();
  try {
    const session = await login(ctx);
    const created = await ctx.run('/local/articles', 'POST', { ...sampleDraft, idempotencyKey: seedIdempotency() }, session);
    const draftId = (await created.json()).id;
    const revisionInput = (key) => ({
      ...sampleDraft, title: 'Retried revision after injected failure',
      expectedRevision: 1, idempotencyKey: key,
    });
    const revisionKey = seedIdempotency();
    await ctx.db.prepare(`CREATE TRIGGER cms_probe_fail_revision BEFORE INSERT ON cms_draft_revisions
      BEGIN SELECT RAISE(ABORT, 'injected revision failure'); END`).run();
    const failed = await ctx.run(`/local/articles/${draftId}`, 'PATCH', revisionInput(revisionKey), session);
    assert.equal(failed.status, 500);
    const draftAfterFailure = await ctx.db.prepare('SELECT revision,title FROM cms_drafts WHERE id=?').bind(draftId).first();
    assert.equal(draftAfterFailure.revision, 1, 'the draft update rolled back with the failed revision insert');
    assert.equal(await countRows(ctx.db, 'cms_draft_revisions'), 1, 'no partial revision was written');
    await ctx.db.prepare('DROP TRIGGER cms_probe_fail_revision').run();
    const retried = await ctx.run(`/local/articles/${draftId}`, 'PATCH', revisionInput(revisionKey), session);
    assert.equal(retried.status, 200, 'the same idempotency key succeeds once the fault is gone');
    assert.equal((await retried.json()).revision, 2);

    // Device enrollment: a failing credential insert must not consume the challenge.
    await ctx.db.prepare(`CREATE TRIGGER cms_probe_fail_credential BEFORE INSERT ON cms_credentials
      BEGIN SELECT RAISE(ABORT, 'injected credential failure'); END`).run();
    const pendingChallenge = await ctx.run('/local/enroll/challenge', 'POST', { kind: 'recovery' }, session);
    const pending = await pendingChallenge.json();
    const candidate = makeSyntheticAuthenticator('rollback-device');
    const registration = makeRegistrationResponse(candidate, { challenge: webauthnChallengeFromHex(pending.challenge) });
    const beforeEnroll = await tableCounts(ctx.db);
    const enrollFailed = await ctx.run('/local/enroll/claim', 'POST',
      { challenge: pending.challenge, response: registration }, session);
    assert.equal(enrollFailed.status, 500);
    assert.deepEqual(await tableCounts(ctx.db), beforeEnroll,
      'a failed enrollment rolls back the challenge consumption, the credential and the audit');
    await ctx.db.prepare('DROP TRIGGER cms_probe_fail_credential').run();
    const enrollRetried = await ctx.run('/local/enroll/claim', 'POST',
      { challenge: pending.challenge, response: registration }, session);
    assert.equal(enrollRetried.status, 201, 'the same challenge succeeds after the fault is removed');

    // Emergency: a failing credential insert must not burn the one-use authorization.
    const emergencyCredential = makeSyntheticAuthenticator('rollback-emergency');
    const token = await issueEmergencyAuthorization(ctx.db, ctx.env.CMS_TEST_HMAC_KEY, Math.floor(Date.now() / 1000));
    await ctx.db.prepare(`CREATE TRIGGER cms_probe_fail_emergency BEFORE INSERT ON cms_credentials
      BEGIN SELECT RAISE(ABORT, 'injected emergency failure'); END`).run();
    const beforeEmergency = await tableCounts(ctx.db);
    const emergencyRegistration = makeRegistrationResponse(emergencyCredential, {
      challenge: webauthnChallengeFromHex(token),
    });
    const emergencyFailed = await ctx.run('/local/emergency/claim', 'POST',
      { token, response: emergencyRegistration });
    assert.equal(emergencyFailed.status, 500);
    assert.deepEqual(await tableCounts(ctx.db), beforeEmergency,
      'a failed emergency claim revokes nothing and keeps the token unconsumed');
    assert.equal(await countRows(ctx.db, 'cms_emergency_authorizations', 'used_at IS NULL'), 1,
      'the one-use authorization is still unused after the rolled-back attempt');
    await ctx.db.prepare('DROP TRIGGER cms_probe_fail_emergency').run();
    const emergencyRetried = await ctx.run('/local/emergency/claim', 'POST',
      { token, response: emergencyRegistration });
    assert.equal(emergencyRetried.status, 201, 'the same token succeeds after the fault is removed');
    // State survives a fresh handler instance over the same LOCAL D1.
    const restarted = createLocalCmsHandler();
    const afterRestart = await restarted(makeRequest('/local/emergency/claim', 'POST',
      { token, response: emergencyRegistration }), ctx.env);
    assert.equal(afterRestart.status, 403, 'the consumed token stays consumed after a handler restart');
  } finally { await ctx.mf.dispose(); }
});

test('M05 LOCAL CMS D4: LOCAL backup restores into an isolated D1 with identical invariants and dead sessions stay dead', async () => {
  const source = await setup();
  let target;
  try {
    const liveSession = await login(source);
    const created = await source.run('/local/articles', 'POST', { ...sampleDraft, idempotencyKey: seedIdempotency() }, liveSession);
    const draftId = (await created.json()).id;
    await source.run(`/local/articles/${draftId}`, 'PATCH', {
      ...sampleDraft, title: 'Second revision for the restore comparison',
      expectedRevision: 1, idempotencyKey: seedIdempotency(),
    }, liveSession);
    const revokedSession = await login(source, source.recovery);
    assert.equal((await source.run('/local/logout', 'POST', {}, revokedSession)).status, 200);
    await source.run('/local/challenge', 'POST', { credentialId: source.primary.id });

    const dump = await dumpLocalDatabase(source.db);
    const sourceCounts = Object.fromEntries(DUMP_TABLES.map(table => [table, dump[table].length]));
    const sourceDigests = Object.fromEntries(DUMP_TABLES.map(table => [table, tableDigest(dump[table])]));

    target = await openEmptySyntheticD1({ secret: source.env.CMS_TEST_HMAC_KEY, nowMs: Date.now() });
    await restoreLocalDatabase(target.db, dump);
    const targetCounts = {};
    for (const table of DUMP_TABLES) {
      targetCounts[table] = (await target.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first()).n;
    }
    assert.deepEqual(targetCounts, sourceCounts, 'every table restores with identical row counts');
    const targetDigests = {};
    for (const table of DUMP_TABLES) targetDigests[table] = tableDigest(await dumpTable(target.db, table));
    assert.deepEqual(targetDigests, sourceDigests, 'restored content matches the backup byte for byte');

    assert.equal((await target.run('/local/articles', 'GET', undefined, liveSession)).status, 200,
      'a live session restored from the backup still authorizes its own Owner');
    assert.equal((await target.run('/local/articles', 'GET', undefined, revokedSession)).status, 401,
      'a session revoked before the backup stays dead after the restore');
    assert.equal((await target.run('/local/challenge', 'POST',
      { credentialId: 'unknown-credential' })).status, 403);
    target.clock.ms += 1_201_000;
    assert.equal((await target.run('/local/articles', 'GET', undefined, liveSession)).status, 401,
      'session TTL is preserved by the restore');
    assert.equal(await countRows(target.db, 'cms_owner'), 1);
  } finally {
    if (target) await target.mf.dispose();
    await source.mf.dispose();
  }
});

test('M05 LOCAL CMS D5: corrupted or incompatible backups restore nothing, and revocation survives a restart', async () => {
  const source = await setup();
  let target;
  try {
    const live = await login(source);
    assert.equal((await source.run('/local/articles', 'POST',
      { ...sampleDraft, idempotencyKey: seedIdempotency() }, live)).status, 201);
    const revoked = await login(source, source.recovery);
    assert.equal((await source.run('/local/logout', 'POST', {}, revoked)).status, 200);
    const dump = await dumpLocalDatabase(source.db);
    const emptyCounts = Object.fromEntries(COUNTED_TABLES.map(table => [table, 0]));

    // Corrupted backup: dependent rows without the Owner row must fail and write nothing at all.
    const corrupted = structuredClone(dump);
    corrupted.cms_owner = [];
    target = await openEmptySyntheticD1({ secret: source.env.CMS_TEST_HMAC_KEY });
    await assert.rejects(restoreLocalDatabase(target.db, corrupted), /FOREIGN KEY|constraint/i,
      'a backup that violates referential integrity is refused');
    assert.deepEqual(await tableCounts(target.db), emptyCounts,
      'the failed restore leaves the target database empty (one transaction)');

    // Incompatible backup: an unknown column must also fail closed.
    const incompatible = structuredClone(dump);
    incompatible.cms_owner = incompatible.cms_owner.map(row => ({ ...row, legacy_secret: 'x' }));
    await assert.rejects(restoreLocalDatabase(target.db, incompatible), /no column|no such|table/i,
      'a backup from an incompatible schema is refused');
    assert.deepEqual(await tableCounts(target.db), emptyCounts,
      'the incompatible restore also leaves the target database empty');

    // A valid restore followed by a restart keeps revocation and session semantics.
    await restoreLocalDatabase(target.db, dump);
    const persistencePath = target.persistencePath;
    const nowMs = Date.now();
    assert.equal((await target.run('/local/articles', 'GET', undefined, live)).status, 200);
    assert.equal((await target.run('/local/articles', 'GET', undefined, revoked)).status, 401);
    await target.mf.dispose();
    target = null;
    const reopened = await openEmptySyntheticD1({
      secret: source.env.CMS_TEST_HMAC_KEY, persistencePath, applySchema: false, nowMs,
    });
    try {
      assert.equal(await countRows(reopened.db, 'cms_owner'), 1);
      assert.equal(await countRows(reopened.db, 'cms_credentials'), 2);
      assert.equal(await countRows(reopened.db, 'cms_draft_revisions'), 1);
      assert.equal(await countRows(reopened.db, 'cms_sessions', 'revoked_at IS NOT NULL'), 1,
        'the revoked session stays revoked after a restart');
      assert.equal((await reopened.run('/local/articles', 'GET', undefined, live)).status, 200,
        'the live session still authorizes after a restart');
      assert.equal((await reopened.run('/local/articles', 'GET', undefined, revoked)).status, 401,
        'the revoked session stays dead after a restart');
    } finally { await reopened.mf.dispose(); }
  } finally {
    if (target) await target.mf.dispose();
    await source.mf.dispose();
  }
});

// --- Part E · real Chromium, virtual authenticators, accessibility and zero egress ---

test('M05 LOCAL CMS E1: first-Owner bootstrap, recovery device and lost-primary recovery in real Chromium', { timeout: 240_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless: true, bootstrap: true });
  const page = preview.page;
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message.slice(0, 240)));
  page.on('console', entry => { if (entry.type() === 'error') consoleErrors.push(entry.text().slice(0, 240)); });
  const waitForMessage = text => page.getByText(text).waitFor({ timeout: 20_000 });
  try {
    assert.match(await page.title(), /CoinBlink.*Local CMS Test Workspace/);
    assert.equal(await page.locator('#devices').isVisible(), false, 'devices stay hidden before sign-in');

    // 1. First-Owner bootstrap: ticket -> registration ceremony -> atomic claim.
    await page.locator('#ticket').fill(await preview.issueTicket());
    await page.locator('#bootstrap').click();
    await waitForMessage('First passkey registered locally. Sign in to continue.');
    assert.equal(await countRows(preview.db, 'cms_owner'), 1);
    assert.equal(await countRows(preview.db, 'cms_credentials', 'revoked_at IS NULL'), 1);
    assert.deepEqual((await preview.db.prepare('SELECT event FROM cms_audit_events').all()).results,
      [{ event: 'owner_claimed' }]);
    const primaryId = (await preview.db.prepare(
      "SELECT credential_id FROM cms_credentials WHERE device_kind='primary' AND revoked_at IS NULL"
    ).first()).credential_id;
    assert.equal(await page.locator('#credential').inputValue(), primaryId,
      'the freshly registered credential is offered for sign-in');

    // 2. Sign in with the new primary passkey and enroll an independent recovery passkey.
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    assert.equal(await page.locator('#devices').isVisible(), true);
    await page.waitForFunction(() => globalThis.document.querySelectorAll('#device-list li').length === 1);
    assert.equal(await page.locator('#device-list li').count(), 1, 'the primary device is listed');
    // The privileged server-rendered HTML page answers an authenticated browser session.
    const workspaceTab = await preview.context.newPage();
    try {
      const workspaceResponse = await workspaceTab.goto(preview.origin + '/local/workspace', { waitUntil: 'domcontentloaded' });
      assert.equal(workspaceResponse.status(), 200, 'the privileged HTML page serves the authenticated Owner');
      assert.match(await workspaceTab.locator('#workspace-devices').innerText(), /primary .* active/);
      assert.match(await workspaceTab.title(), /Local Owner Workspace/);
      assert.equal(await workspaceTab.evaluate(() => globalThis.getComputedStyle(globalThis.document.body).backgroundColor),
        'rgb(13, 24, 21)', 'the privileged workspace stylesheet is applied under CSP');
    } finally { await workspaceTab.close(); }
    await page.locator('#enroll-recovery').click();
    await waitForMessage('Recovery passkey registered locally (recovery).');
    const activeAfterRecovery = (await preview.db.prepare(
      'SELECT credential_id,device_kind FROM cms_credentials WHERE revoked_at IS NULL ORDER BY device_kind'
    ).all()).results;
    assert.deepEqual(activeAfterRecovery.map(row => row.device_kind), ['primary', 'recovery']);
    assert.equal(activeAfterRecovery[0].credential_id, primaryId);
    const recoveryId = activeAfterRecovery[1].credential_id;
    assert.notEqual(recoveryId, primaryId, 'the recovery device is cryptographically independent');
    await page.waitForFunction(() => globalThis.document.querySelectorAll('#device-list li').length === 2);
    assert.equal(await page.locator('#device-list li').count(), 2);
    // The accepted bootstrap, sign-in and enrollment journey must be free of console and page errors.
    assert.deepEqual(consoleErrors, [], 'no console errors during the accepted bootstrap and enrollment journey');
    assert.deepEqual(pageErrors, [], 'no page errors during the accepted journey');

    // 3. Sign out: anonymous API access and the public shell leak nothing privileged.
    await page.locator('#logout').click();
    await page.getByText('Not authenticated').waitFor({ timeout: 20_000 });
    assert.equal(await page.locator('#devices').isVisible(), false);
    assert.equal(await page.evaluate(async () => (await fetch('/local/articles')).status), 401);
    assert.equal(await page.evaluate(async () => (await fetch('/local/credentials')).status), 401);
    assert.doesNotMatch(await page.locator('body').innerText(), /Local CMS protects this example draft/);

    // 4. Recover the lost primary using the recovery passkey plus a fresh assertion.
    await page.locator('#credential').fill(recoveryId);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    await page.locator('#device-id').fill(primaryId);
    await page.locator('#revoke-device').click();
    await waitForMessage('Device revoked locally');
    assert.notEqual((await preview.db.prepare(
      "SELECT revoked_at FROM cms_credentials WHERE credential_id=?"
    ).bind(primaryId).first()).revoked_at, null, 'the lost primary is revoked');
    await page.locator('#enroll-primary').click();
    await waitForMessage('Recovery authorization required before replacing a lost primary');
    assert.equal(await countRows(preview.db, 'cms_credentials', "device_kind='primary' AND revoked_at IS NULL"), 0,
      'no replacement primary exists without additional proof');
    await page.locator('#authorize-recovery').click();
    await waitForMessage('Recovery authorized for one primary replacement');
    assert.equal(await countRows(preview.db, 'cms_recovery_authorizations', 'used_at IS NULL'), 1);
    await page.locator('#enroll-primary').click();
    await waitForMessage('Primary passkey registered locally (primary).');
    const newPrimary = (await preview.db.prepare(
      "SELECT credential_id FROM cms_credentials WHERE device_kind='primary' AND revoked_at IS NULL"
    ).first()).credential_id;
    assert.notEqual(newPrimary, primaryId);
    assert.equal(await countRows(preview.db, 'cms_recovery_authorizations', 'used_at IS NOT NULL'), 1,
      'the single-use recovery authorization was consumed');
    assert.equal(await countRows(preview.db, 'cms_owner'), 1, 'no second Owner was ever created');

    // 5. Sign out and back in with the replacement primary.
    await page.locator('#logout').click();
    await page.getByText('Not authenticated').waitFor({ timeout: 20_000 });
    await page.locator('#credential').fill(newPrimary);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    await page.waitForFunction(() => globalThis.document.querySelectorAll('#device-list li').length >= 3);
    assert.equal(await page.locator('#device-list li', { hasText: 'primary' }).filter({ hasText: 'active' }).count(), 1);

    // 6. Browser-level negatives: second Owner, wrong CSRF and cross-origin egress.
    const secondTicket = await preview.issueTicket();
    assert.equal(await page.evaluate(async ticket => (await fetch('/local/bootstrap/challenge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }),
    })).status, secondTicket), 403, 'a second Owner cannot be advertised once one exists');
    assert.equal(await page.evaluate(async () => (await fetch('/local/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CB-CSRF': '00'.repeat(32) },
      body: JSON.stringify({
        title: 'Tampered CSRF must never write', summary: 'Synthetic summary that is long enough to pass.',
        body: 'Synthetic body', sourceUrl: 'https://example.test/evidence', authorLabel: 'Probe',
        idempotencyKey: 'tampered-csrf-probe-0001',
      }),
    })).status), 403, 'a tampered CSRF token is refused');
    const blocked = await page.evaluate(async () => {
      try {
        await fetch('https://evil.example.test/steal');
        return 'reached';
      } catch { return 'blocked'; }
    });
    assert.equal(blocked, 'blocked', 'cross-origin requests are blocked by the fixture network policy');

    // 7. Accessibility: axe and keyboard focus order on the signed-in workspace.
    const axe = await new AxeBuilder({ page }).analyze();
    const serious = axe.violations.filter(violation => ['critical', 'serious'].includes(violation.impact));
    console.log('AXE violations ' + JSON.stringify(serious.map(violation => violation.id + ':' + violation.impact)));
    assert.deepEqual(serious, [], 'no critical or serious accessibility violations');
    const focusTrail = [];
    for (let index = 0; index < 14; index++) {
      await page.keyboard.press('Tab');
      focusTrail.push(await page.evaluate(() => {
        const element = globalThis.document.activeElement;
        if (!element || element === globalThis.document.body) return null;
        const style = globalThis.getComputedStyle(element);
        return {
          id: element.id || element.tagName.toLowerCase(),
          indicator: style.outlineStyle !== 'none' && style.outlineWidth !== '0px',
          hidden: element.closest('[hidden]') !== null,
        };
      }));
    }
    const visibleFocus = focusTrail.filter(entry => entry && !entry.hidden);
    assert.ok(visibleFocus.length >= 6, 'keyboard traversal reaches the interactive controls');
    assert.ok(visibleFocus.every(entry => entry.indicator), 'every focused control shows a visible focus indicator');
    // Basic responsiveness: the LOCAL workspace fits a narrow viewport without horizontal overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    const overflow = await page.evaluate(() =>
      globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth);
    assert.ok(overflow <= 1, 'the LOCAL workspace fits a 390px viewport, overflow=' + overflow);
    await page.setViewportSize({ width: 1280, height: 900 });

    // 8. Zero unauthorized egress, in two layers: CSP blocks external fetches before the
    //    network, and the fixture route blocks a top-level navigation at the network layer.
    const cspBlocked = await page.evaluate(async () => {
      try {
        await fetch('https://evil.example.test/steal');
        return 'reached';
      } catch { return 'blocked'; }
    });
    assert.equal(cspBlocked, 'blocked', 'CSP connect-src blocks cross-origin fetches');
    const unexpectedConsole = consoleErrors.filter(entry =>
      !/Failed to load resource/.test(entry) && !/Content Security Policy/.test(entry));
    assert.deepEqual(unexpectedConsole, [], 'only the deliberate negative probes logged console errors');
    const navigation = await page.goto('https://evil.example.test/steal')
      .then(() => 'reached', () => 'blocked');
    assert.equal(navigation, 'blocked', 'the fixture network policy blocks external navigation');
    const external = preview.networkAttempts.filter(attempt => !attempt.allowed);
    assert.equal(external.length, 1, 'exactly one deliberate external attempt reached the network layer');
    assert.equal(new URL(external[0].url).hostname, 'evil.example.test');
    const fixtureAttempts = preview.networkAttempts.filter(attempt => attempt.allowed);
    assert.ok(fixtureAttempts.length >= 12, 'the journey exercised the fixture endpoints');
    assert.ok(fixtureAttempts.every(attempt => new URL(attempt.url).origin === CMS_TEST_ORIGIN),
      'every allowed attempt stayed on the synthetic fixture origin');
    const events = (await preview.db.prepare('SELECT event FROM cms_audit_events ORDER BY created_at, rowid').all())
      .results.map(row => row.event);
    assert.deepEqual(events, ['owner_claimed', 'device_enrolled', 'device_revoked',
      'recovery_authorized', 'device_enrolled', 'recovery_used']);
  } finally {
    await preview.close();
  }
});

test('M05 LOCAL CMS E2: total-loss emergency recovery in Chromium, with browser-level RP ID and replay denials', { timeout: 240_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless: true, bootstrap: true });
  const page = preview.page;
  const waitForMessage = text => page.getByText(text).waitFor({ timeout: 20_000 });
  try {
    await page.locator('#ticket').fill(await preview.issueTicket());
    await page.locator('#bootstrap').click();
    await waitForMessage('First passkey registered locally. Sign in to continue.');
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    await page.locator('#enroll-recovery').click();
    await waitForMessage('Recovery passkey registered locally (recovery).');
    const credentialsBefore = (await preview.db.prepare(
      'SELECT credential_id FROM cms_credentials WHERE revoked_at IS NULL'
    ).all()).results.map(row => row.credential_id);
    assert.equal(credentialsBefore.length, 2);

    // The virtual authenticator does not enforce RP ID vs origin, so the server must. A
    // registration for a foreign RP ID is rejected before any write and the token stays unused.
    const foreignRpToken = await preview.issueEmergencyToken();
    const foreignRp = await page.evaluate(async token => {
      const encode = buffer => {
        let raw = '';
        for (const byte of new Uint8Array(buffer)) raw += String.fromCharCode(byte);
        return btoa(raw).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      };
      const credential = await navigator.credentials.create({ publicKey: {
        challenge: Uint8Array.from(token.match(/.{2}/g), x => parseInt(x, 16)),
        rp: { id: 'evil.example.test', name: 'Not this origin' },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'x', displayName: 'x' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: { userVerification: 'required', residentKey: 'required' },
        attestation: 'none', timeout: 20000,
      } });
      const response = {
        id: credential.id, rawId: encode(credential.rawId), type: credential.type,
        response: {
          clientDataJSON: encode(credential.response.clientDataJSON),
          attestationObject: encode(credential.response.attestationObject),
          transports: [],
        },
        clientExtensionResults: {}, authenticatorAttachment: credential.authenticatorAttachment,
      };
      return (await fetch('/local/emergency/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, response }),
      })).status;
    }, foreignRpToken);
    assert.equal(foreignRp, 403, 'the server rejects a registration whose RP ID does not match');
    assert.equal(await countRows(preview.db, 'cms_credentials', 'revoked_at IS NULL'), 2,
      'the rejected registration wrote nothing');
    assert.equal(await countRows(preview.db, 'cms_emergency_authorizations', 'used_at IS NULL'), 1,
      'the rejected registration did not consume its authorization');

    // A consumed bootstrap ticket cannot be replayed.
    const replayTicket = await preview.issueTicket();
    await page.evaluate(async ticket => fetch('/local/bootstrap/challenge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }),
    }), replayTicket);
    const claimReplay = await page.evaluate(async ({ ticket }) => (await fetch('/local/bootstrap/claim', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, challenge: 'aa'.repeat(32), response: {} }),
    })).status, { ticket: replayTicket });
    assert.equal(claimReplay, 403, 'a bootstrap replay is denied once an Owner exists');

    // Emergency recovery with an offline operator token and a fresh UV registration.
    const token = await preview.issueEmergencyToken();
    await page.locator('#emergency-token').fill(token);
    await page.locator('#emergency').click();
    await waitForMessage('Emergency recovery complete. Sign in with the new primary passkey.');
    assert.equal(await countRows(preview.db, 'cms_credentials', 'revoked_at IS NULL'), 1);
    assert.equal(await countRows(preview.db, 'cms_credentials', 'revoked_at IS NOT NULL'), 2,
      'both previous devices are revoked');
    assert.equal(await countRows(preview.db, 'cms_sessions', 'revoked_at IS NULL'), 0,
      'every session is revoked by the emergency claim');
    assert.equal(await page.locator('#session-status').textContent(), 'Not authenticated');
    assert.equal(await page.locator('#devices').isVisible(), false);
    const emergencyCredential = (await preview.db.prepare(
      'SELECT credential_id FROM cms_credentials WHERE revoked_at IS NULL'
    ).first()).credential_id;
    assert.equal(await page.locator('#credential').inputValue(), emergencyCredential);

    // Replaying the same emergency token is denied and writes nothing.
    const beforeReplay = (await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_audit_events').first()).n;
    await page.locator('#emergency-token').fill(token);
    await page.locator('#emergency').click();
    await waitForMessage('Local request rejected (403)');
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_audit_events').first()).n, beforeReplay);

    // The replacement primary signs in and the audit trail records the emergency.
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    const events = (await preview.db.prepare('SELECT event FROM cms_audit_events ORDER BY created_at, rowid').all())
      .results.map(row => row.event);
    assert.deepEqual(events, ['owner_claimed', 'device_enrolled', 'emergency_used', 'device_enrolled']);
    assert.equal(await countRows(preview.db, 'cms_owner'), 1);
    const axe = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(axe.violations.filter(violation => ['critical', 'serious'].includes(violation.impact)), []);
  } finally {
    await preview.close();
  }
});
