// Disposable LOCAL CMS interactive preview. No public Astro route, remote D1, or real Owner secrets.
// Run from repo root: node test/modules/CB-M05/p1c-local-preview.mjs --preview
// Requires locally installed Playwright Chromium. Browser test credentials are synthetic/in-memory.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
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
  CMS_TEST_ORIGIN, CMS_TEST_RP_ID, createLocalCmsHandler, issueBootstrapTicket, issueEmergencyAuthorization,
} from '../../../src/modules/CB-M05/p1c-local/local-cms.mjs';
import { createLocalAdminRouter } from '../../../src/modules/CB-M05/p1c-local/local-admin-router.mjs';

const SCHEMA_URL = new URL('./p1c-fixtures/schema.sql', import.meta.url);
const ALLOWED_STATIC = new Set([
  '/local/ui', '/local/workspace', '/local/challenge', '/local/login', '/local/logout', '/local/articles',
  '/local/bootstrap/challenge', '/local/bootstrap/claim',
  '/local/enroll/challenge', '/local/enroll/claim',
  '/local/recovery/challenge', '/local/recovery/complete',
  '/local/credentials', '/local/credentials/revoke', '/local/emergency/claim',
]);
const ARTICLE_ROUTE = /^\/local\/articles\/[0-9a-f-]{36}(?:\/(?:revisions|export))?$/i;
// The alternate /admin interface is an explicit opt-in LOCAL-only test adapter.
// It remains restricted to the synthetic HTTPS origin and disposable authenticators.
const ADMIN_ALLOWED_STATIC = new Set([
  '/admin', '/admin/',
  ...[...ALLOWED_STATIC].map(route => route.replace('/local/', '/admin/')),
]);
const ADMIN_ARTICLE_ROUTE = /^\/admin\/articles\/[0-9a-f-]{36}(?:\/(?:revisions|export))?$/i;

// The checked-in SQLite fixture has two BEGIN/END triggers. Split only
// at statement boundaries, not at the semicolons inside trigger bodies.
// A deterministic pass avoids a backtracking-prone lookahead over whitespace.
export function splitLocalSchemaStatements(schema) {
  const withoutComments = schema.replaceAll('\r', '').split('\n')
    .filter(line => !line.trimStart().startsWith('--')).join('\n');
  const chunks = withoutComments.split(';');
  const statements = [];
  let pending = '';
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    if (pending && (trimmed.startsWith('CREATE ') || trimmed.startsWith('PRAGMA '))) {
      statements.push(pending.trim());
      pending = '';
    }
    pending += (pending ? ';' : '') + chunk;
  }
  if (pending.trim()) statements.push(pending.trim());
  return statements;
}

async function applySchema(db, persistent) {
  const existing = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cms_owner'").first();
  if (existing && persistent) {
    // D1 deliberately rejects PRAGMA user_version writes; use an isolated table
    // owned only by this preview harness to version its persistent schema.
    const version = await db.prepare('SELECT schema_version FROM cms_local_preview_metadata WHERE id=1').first();
    assert.equal(version?.schema_version, 1, 'existing persistent local schema is unsupported; refusing to modify it');
    const requiredTables = ['cms_owner','cms_credentials','cms_challenges','cms_sessions','cms_drafts','cms_draft_revisions'];
    const presentTables = await Promise.all(requiredTables.map(table =>
      db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(table).first()
    ));
    presentTables.forEach((present, index) => {
      assert.equal(present?.name, requiredTables[index], 'local database has missing table ' + requiredTables[index]);
    });
    return false;
  }
  assert.equal(existing, null, 'database must start empty unless explicit persistent preview');
  const schema = readFileSync(SCHEMA_URL, 'utf8');
  const statements = splitLocalSchemaStatements(schema);
  assert.ok(statements.length >= 8);
  // D1 batch retains SQL statement order and applies this dependent DDL as one unit.
  await db.batch(statements.map(statement => db.prepare(statement)));
  if (persistent) {
    await db.prepare(`CREATE TABLE cms_local_preview_metadata (
      id INTEGER PRIMARY KEY CHECK(id=1),
      schema_version INTEGER NOT NULL CHECK(schema_version=1)
    )`).run();
    await db.prepare('INSERT INTO cms_local_preview_metadata(id,schema_version) VALUES(1,1)').run();
  }
  return true;
}

async function registerDisposableCredentials(db, persistent) {
  const primary = makeSyntheticAuthenticator('preview-primary');
  const recovery = makeSyntheticAuthenticator('preview-recovery');
  const seconds = Math.floor(Date.now() / 1000);
  if (persistent) {
    // Rotate ephemeral test keys on every start. Previously issued sessions and
    // challenges cannot authenticate after restart, but draft content remains.
    await db.batch([
      db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE revoked_at IS NULL').bind(seconds),
      db.prepare('UPDATE cms_credentials SET revoked_at=? WHERE revoked_at IS NULL').bind(seconds),
      db.prepare('DELETE FROM cms_challenges WHERE consumed_at IS NULL'),
    ]);
    await db.prepare('INSERT OR IGNORE INTO cms_owner(owner_id,created_at) VALUES (1,?)').bind(seconds).run();
  } else {
    await db.prepare('INSERT INTO cms_owner(owner_id,created_at) VALUES (1,?)').bind(seconds).run();
  }
  const registrations = await Promise.all([[primary, 'primary'], [recovery, 'recovery']].map(async ([credential, kind]) => {
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
    return { credentialId: credential.id, publicKey: result.registrationInfo.credential.publicKey, kind };
  }));
  await db.batch(registrations.map(({ credentialId, publicKey, kind }) => db.prepare(
      'INSERT INTO cms_credentials (credential_id,owner_id,public_key,sign_count,device_kind) VALUES (?,1,?,0,?)'
    ).bind(credentialId, publicKey, kind)));
  return { primary, recovery };
}

async function addVirtualAuthenticator(context, authenticator) {
  return context.credentials.create(CMS_TEST_RP_ID, {
    id: authenticator.id,
    userHandle: randomBytes(16).toString('base64url'),
    privateKey: authenticator.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64url'),
    publicKey: authenticator.publicKey.export({ type: 'spki', format: 'der' }).toString('base64url'),
    signCount: 0,
  });
}

export async function startLocalCmsPreview({ headless = false, persistLocal = false, persistenceRoot, bootstrap = false, admin = false } = {}) {
  if (persistenceRoot && !persistLocal) throw new Error('persistenceRoot requires explicit persistLocal');
  const stateDir = persistLocal
    ? path.resolve(persistenceRoot || '.wrangler/coinblink-m05-drafts-local')
    : mkdtempSync(path.join(tmpdir(), 'coinblink-m05-preview-'));
  let ownsLock = false;
  const lockDir = path.join(stateDir, '.single-writer-lock');
  if (persistLocal) {
    mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    if (lstatSync(stateDir).isSymbolicLink()) throw new Error('Local preview store cannot be a symbolic link');
    // No simultaneous instances may touch the same D1. Stale locks require manual inspection.
    mkdirSync(lockDir, { mode: 0o700 });
    ownsLock = true;
  }
  let mf, browser;
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    try { if (browser) await browser.close(); } finally {
      try { if (mf) await mf.dispose(); } finally {
        if (!persistLocal) rmSync(stateDir, { recursive: true, force: true });
        if (ownsLock) rmSync(lockDir, { recursive: true, force: true });
      }
    }
  };
  try {
    // No Cloudflare account or remote network is used. Local D1 is temporary.
    mf = new Miniflare(convertV4MiniflareOptions({
      name: 'cb-m05-preview-' + (persistLocal ? 'persistent' : randomUUID()),
      script: 'export default { async fetch() { return new Response("LOCAL ONLY") } }',
      modules: true,
      compatibilityDate: '2026-10-13',
      d1Databases: { CMS_D1_LOCAL: '00000000-0000-4000-8000-000000000086' },
      resourcePersistencePath: stateDir,
      log: new NoOpLog(),
    }));
    const db = await mf.getD1Database('CMS_D1_LOCAL');
    await applySchema(db, persistLocal);
    const credentials = bootstrap ? null : await registerDisposableCredentials(db, persistLocal);
    const secret = randomBytes(32).toString('hex');
    const env = {
      CB_M05_LOCAL_TEST_ONLY: 'true',
      CMS_D1_LOCAL: db,
      CMS_TEST_HMAC_KEY: secret,
    };
    const handler = admin ? createLocalAdminRouter() : createLocalCmsHandler();

    browser = await chromium.launch({ headless });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    // The Playwright virtual authenticators are disposable; no biometric or personal key.
    // This order is intentional because both calls mutate the same browser context.
    if (credentials) {
      await addVirtualAuthenticator(context, credentials.primary);
      await addVirtualAuthenticator(context, credentials.recovery);
    }
    await context.credentials.install();

    // Every network attempt is counted. Only the synthetic fixture origin may ever be reached.
    const networkAttempts = [];
    // The browser is network-isolated: ONLY the fixed test origin is intercepted.
    await context.route('**/*', route => {
      networkAttempts.push({ url: route.request().url(), allowed: false, reason: 'external' });
      return route.abort('blockedbyclient');
    });
    await context.route(CMS_TEST_ORIGIN + '/**', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const allowedPath = admin
        ? (ADMIN_ALLOWED_STATIC.has(url.pathname) || ADMIN_ARTICLE_ROUTE.test(url.pathname))
        : (ALLOWED_STATIC.has(url.pathname) || ARTICLE_ROUTE.test(url.pathname));
      if (url.origin !== CMS_TEST_ORIGIN || !allowedPath) {
        networkAttempts.push({ url: request.url(), allowed: false, reason: 'unlisted-fixture-path' });
        await route.abort('blockedbyclient');
        return;
      }
      networkAttempts.push({ url: request.url(), allowed: true, reason: 'fixture' });
      const headers = await request.allHeaders();
      // Intercepted Playwright requests omit this Fetch Metadata transport field.
      // Reconstruct ONLY after validating the original initiating HTTPS frame.
      if (!headers['sec-fetch-site']) {
        const frameUrl = request.frame().url();
        const frameOrigin = frameUrl === 'about:blank' ? CMS_TEST_ORIGIN : new URL(frameUrl).origin;
        if (frameOrigin !== CMS_TEST_ORIGIN) {
          await route.abort('blockedbyclient');
          return;
        }
        headers['sec-fetch-site'] = request.isNavigationRequest() ? 'none' : 'same-origin';
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
    const opened = await page.goto(CMS_TEST_ORIGIN + (admin ? '/admin/login' : '/local/ui'), { waitUntil: 'domcontentloaded' });
    assert.equal(opened?.status(), 200);
    if (credentials) await page.locator('#credential').fill(credentials.primary.id);
    return {
      browser, context, page, db, close, networkAttempts,
      // Test-only reference; never disclose the private key to UI or logs.
      primaryId: credentials?.primary.id ?? null,
      origin: CMS_TEST_ORIGIN,
      persistent: persistLocal,
      issueTicket: () => issueBootstrapTicket(db, secret, Math.floor(Date.now() / 1000)),
      issueEmergencyToken: () => issueEmergencyAuthorization(db, secret, Math.floor(Date.now() / 1000)),
    };
  } catch (error) {
    await close();
    throw error;
  }
}

async function main() {
  const smoke = process.argv.includes('--smoke');
  const persistLocal = process.argv.includes('--persist-local');
  const admin = process.argv.includes('--admin');
  if (smoke && persistLocal) throw new Error('--smoke never persists user drafts');
  const preview = await startLocalCmsPreview({ headless: smoke, persistLocal, admin });
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
      'CoinBlink LOCAL CMS ' + (admin ? '/admin' : '/local') + ' preview opened in Chromium.\n' +
      'Only disposable virtual test credentials are used.\n' +
      'Click "Sign in with test passkey" in the opened window.\n' +
      (persistLocal ? 'Local D1 drafts will remain in .wrangler/coinblink-m05-drafts-local after browser exit.\n' :
        'Close the browser to delete the temporary D1 store.\n')
    );
    // Keep this local process alive only while the headed Chromium window is open.
    await new Promise(resolve => preview.browser.once('disconnected', resolve));
  } finally {
    await preview.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) &&
    (process.argv.includes('--preview') || process.argv.includes('--smoke'))) {
  try {
    await main();
  } catch (error) {
    process.stderr.write('LOCAL CMS preview rejected: ' + (error?.message || 'unknown error') + '\n');
    process.exitCode = 1;
  }
}
