// Disposable LOCAL CMS interactive preview. No public Astro route, remote D1, or real Owner secrets.
// Run from repo root: node test/modules/CB-M05/p1c-local-preview.mjs
// Requires locally installed Playwright Chromium. Browser test credentials are synthetic/in-memory.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { convertV4MiniflareOptions, Miniflare, NoOpLog } from 'miniflare';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import {
  makeSyntheticAuthenticator, makeRegistrationResponse,
} from '../../../src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs';
import {
  CMS_TEST_ORIGIN, CMS_TEST_RP_ID, createLocalCmsHandler,
} from '../../../src/modules/CB-M05/p1c-local/local-cms.mjs';

const SCHEMA_URL = new URL('./p1c-fixtures/schema.sql', import.meta.url);
const ALLOWED_STATIC = new Set([
  '/local/ui', '/local/challenge', '/local/login', '/local/logout', '/local/articles',
]);
const ARTICLE_ROUTE = /^\/local\/articles\/[0-9a-f-]{36}(?:\/revisions)?$/i;

async function applySchema(db) {
  const schema = readFileSync(SCHEMA_URL, 'utf8');
  const statements = schema.replace(/\r/g, '').replace(/^\s*--.*$/gm, '')
    .split(/;\s*(?=(?:CREATE|PRAGMA)\b|$)/iu)
    .map(statement => statement.trim()).filter(Boolean);
  assert.ok(statements.length >= 8);
  for (const statement of statements) await db.prepare(statement).run();
}

async function registerDisposableCredentials(db) {
  const primary = makeSyntheticAuthenticator('preview-primary');
  const recovery = makeSyntheticAuthenticator('preview-recovery');
  await db.prepare('INSERT INTO cms_owner(owner_id,created_at) VALUES (1,?)')
    .bind(Math.floor(Date.now() / 1000)).run();
  for (const [credential, kind] of [[primary, 'primary'], [recovery, 'recovery']]) {
    const challenge = 'LOCAL-PREVIEW-REG-' + randomUUID();
    const result = await verifyRegistrationResponse({
      response: makeRegistrationResponse(credential, { challenge }),
      expectedChallenge: challenge,
      expectedOrigin: CMS_TEST_ORIGIN,
      expectedRPID: CMS_TEST_RP_ID,
      requireUserPresence: true,
      requireUserVerification: true,
    });
    assert.equal(result.verified, true);
    await db.prepare(
      'INSERT INTO cms_credentials (credential_id,owner_id,public_key,sign_count,device_kind) VALUES (?,1,?,0,?)'
    ).bind(credential.id, result.registrationInfo.credential.publicKey, kind).run();
  }
  return { primary, recovery };
}

export async function startLocalCmsPreview({ headless = false } = {}) {
  const stateDir = mkdtempSync(path.join(tmpdir(), 'coinblink-m05-preview-'));
  let mf, browser;
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    try { if (browser) await browser.close(); } finally {
      try { if (mf) await mf.dispose(); } finally {
        rmSync(stateDir, { recursive: true, force: true });
      }
    }
  };
  try {
    // No Cloudflare account or remote network is used. Local D1 is temporary.
    mf = new Miniflare(convertV4MiniflareOptions({
      name: 'cb-m05-preview-' + randomUUID(),
      script: 'export default { async fetch() { return new Response("LOCAL ONLY") } }',
      modules: true,
      compatibilityDate: '2026-10-13',
      d1Databases: { CMS_D1_LOCAL: '00000000-0000-4000-8000-000000000086' },
      resourcePersistencePath: stateDir,
      log: new NoOpLog(),
    }));
    const db = await mf.getD1Database('CMS_D1_LOCAL');
    await applySchema(db);
    const credentials = await registerDisposableCredentials(db);
    const env = {
      CB_M05_LOCAL_TEST_ONLY: 'true',
      CMS_D1_LOCAL: db,
      CMS_TEST_HMAC_KEY: randomBytes(32).toString('hex'),
    };
    const handler = createLocalCmsHandler();

    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    // The Playwright virtual authenticators are disposable; no biometric or personal key.
    for (const authenticator of [credentials.primary, credentials.recovery]) {
      await context.credentials.create(CMS_TEST_RP_ID, {
        id: authenticator.id,
        userHandle: randomBytes(16).toString('base64url'),
        privateKey: authenticator.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64url'),
        publicKey: authenticator.publicKey.export({ type: 'spki', format: 'der' }).toString('base64url'),
        signCount: 0,
      });
    }
    await context.credentials.install();

    // The browser is network-isolated: ONLY the fixed test origin is intercepted.
    await context.route('**/*', route => route.abort('blockedbyclient'));
    await context.route(CMS_TEST_ORIGIN + '/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== CMS_TEST_ORIGIN ||
        (!ALLOWED_STATIC.has(url.pathname) && !ARTICLE_ROUTE.test(url.pathname))) {
        await route.abort('blockedbyclient');
        return;
      }
      const headers = await request.allHeaders();
      // Intercepted Playwright requests omit this Fetch Metadata transport field.
      // Reconstruct ONLY after validating the original initiating HTTPS frame.
      if (!headers['sec-fetch-site'] && !request.isNavigationRequest()) {
        if (new URL(request.frame().url()).origin !== CMS_TEST_ORIGIN) {
          await route.abort('blockedbyclient');
          return;
        }
        headers['sec-fetch-site'] = 'same-origin';
      }
      const body = request.postDataBuffer();
      const response = await handler(new Request(url.href, {
        method: request.method(), headers,
        ...(body ? { body } : {}),
      }), env);
      await route.fulfill({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: Buffer.from(await response.arrayBuffer()),
      });
    });
    const page = await context.newPage();
    const opened = await page.goto(CMS_TEST_ORIGIN + '/local/ui', { waitUntil: 'domcontentloaded' });
    assert.equal(opened?.status(), 200);
    await page.locator('#credential').fill(credentials.primary.id);
    return {
      browser, context, page, db, close,
      // Test-only reference; never disclose the private key to UI or logs.
      primaryId: credentials.primary.id,
      origin: CMS_TEST_ORIGIN,
    };
  } catch (error) {
    await close();
    throw error;
  }
}

async function main() {
  const smoke = process.argv.includes('--smoke');
  const preview = await startLocalCmsPreview({ headless: smoke });
  try {
    const page = preview.page;
    if (smoke) {
      await page.locator('#login').click();
      await page.getByText('Local test session active').waitFor({ timeout: 15_000 });
      assert.equal(await page.locator('#draft').isVisible(), true);
      await page.locator('#logout').click();
      await page.getByText('Not authenticated').waitFor({ timeout: 15_000 });
      process.stdout.write('M05 local browser preview smoke PASS (disposable credentials and D1)\n');
      return;
    }
    process.stdout.write(
      'CoinBlink LOCAL CMS preview opened in Chromium.\n' +
      'Only disposable virtual test credentials are used.\n' +
      'Click "Sign in with test passkey" in the opened window.\n' +
      'Close the browser to delete the temporary D1 store.\n'
    );
    // Keep this local process alive only while the headed Chromium window is open.
    await new Promise(resolve => preview.browser.once('disconnected', resolve));
  } finally {
    await preview.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    process.stderr.write('LOCAL CMS preview rejected: ' + (error?.message || 'unknown error') + '\n');
    process.exitCode = 1;
  });
}
