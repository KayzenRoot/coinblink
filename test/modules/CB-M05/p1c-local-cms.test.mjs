import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { Script, runInNewContext } from 'node:vm';
import { LOCAL_CMS_UI_SCRIPT } from '../../../src/modules/CB-M05/p1c-local/local-cms-ui.mjs';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { convertV4MiniflareOptions, Miniflare, NoOpLog } from 'miniflare';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { chromium } from '@playwright/test';
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
    assert.match(markup, /Already enrolled disposable test passkey|already enrolled disposable test passkey/i);
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
      const res = await ctx.run(url, method, body, {
        cookie: fetcher.cookie,
        csrf: headers['X-CB-CSRF'] || '',
      });
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) fetcher.cookie = setCookie.split(';')[0];
      return res;
    };
    fetcher.cookie = '';
    const credentialApi = {
      async get({ publicKey }) {
        assert.equal(publicKey.rpId, CMS_TEST_RP_ID);
        assert.equal(publicKey.userVerification, 'required');
        const challenge = Buffer.from(publicKey.challenge).toString('hex');
        const signed = makeAuthenticationResponse(ctx.primary, { challenge });
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
      window: { PublicKeyCredential: function PublicKeyCredential() {} },
      navigator: { credentials: credentialApi },
      fetch: fetcher,
      FormData: FakeFormData,
      Uint8Array, crypto: globalThis.crypto,
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
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    const button = element('items').children[0].children[0];
    await button.handlers.click();
    assert.equal(element('revision').value, '1');
    formFields.title.value = 'Updated local UI revision, protected by D1';
    await element('draft').handlers.submit({ preventDefault() {} });
    assert.equal(element('revision').value, '2');
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 2);
    await element('logout').handlers.click();
    assert.equal(element('draft').hidden, true);
    assert.equal(element('items').children.length, 0);
    assert.equal(element('session-status').textContent, 'Not authenticated');
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
        secure: window.isSecureContext,
        credentialApi: typeof navigator.credentials?.get,
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
    await page.locator('[name="title"]').fill('New verified browser passkey draft revision');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 2; not published').waitFor({ timeout: 10_000 });
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    assert.equal((await ctx.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 2);
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
