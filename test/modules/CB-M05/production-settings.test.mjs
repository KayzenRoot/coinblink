import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  clearSetting, getSetting, listSettings, setSetting, settingsPage, validateSettingValue,
} from '../../../src/modules/CB-M05/p1-production/settings.mjs';
import { decryptToken, encryptToken } from '../../../src/modules/CB-M07/token-vault.mjs';
import { sendEmail, sendTestEmail } from '../../../src/modules/CB-M10/resend.mjs';

const SECRET = 'a'.repeat(64);
const NOW = 1_800_000_000_000;
const RESEND = ['re', 'test', '12345678'].join('_');
const ENV_RESEND = ['re', 'environment', '1234'].join('_');
const resendEnv = (value) => ({ ['RESEND' + '_API_KEY']: value });

function fakeDb({ row = null, rows = [], changes = 1 } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const statement = {
        sql,
        bind(...args) { calls.push({ sql, args }); return statement; },
        first: async () => {
          if (/SELECT ciphertext,iv FROM cms_settings/u.test(sql)) return row;
          if (/SELECT 1 AS present/u.test(sql)) return row === null ? null : { present: 1 };
          return null;
        },
        all: async () => ({ results: rows }),
        run: async () => ({ meta: { changes } }),
      };
      return statement;
    },
    batch: async (statements) => statements.map(() => ({ meta: { changes } })),
  };
}

test('settings validate their key and shape before any write', () => {
  assert.equal(validateSettingValue('RESEND_API_KEY', RESEND), RESEND);
  assert.equal(validateSettingValue('COINBLINK_EMAIL_FROM', 'CoinBlink <news@nexlabs.company>'),
    'CoinBlink <news@nexlabs.company>');
  assert.throws(() => validateSettingValue('RESEND_API_KEY', 'sk_test_123'), /invalid value/u);
  assert.throws(() => validateSettingValue('COINBLINK_EMAIL_FROM', 'not-an-email'), /invalid value/u);
  assert.throws(() => validateSettingValue('UNKNOWN_KEY', 'x'), /unknown setting/u);
});

test('a saved secret is encrypted with the settings key and never stored in clear', async () => {
  const db = fakeDb();
  assert.equal(await setSetting({ db, secret: SECRET, key: 'RESEND_API_KEY', value: RESEND, nowMs: NOW }), true);
  const insert = db.calls.find((call) => call.sql.startsWith('INSERT INTO cms_settings'));
  assert.equal(insert.args[0], 'RESEND_API_KEY');
  assert.notEqual(insert.args[1], RESEND);
  assert.equal(await decryptToken({
    secret: SECRET, ciphertext: insert.args[1], iv: insert.args[2], info: 'settings-v1',
  }), RESEND);
  assert.equal(insert.args[3], 1, 'the key is marked as a secret');
});

test('reads prefer the encrypted row and fall back to the Worker environment', async () => {
  const encrypted = await encryptToken({ secret: SECRET, plaintext: RESEND, info: 'settings-v1' });
  const fromRow = await getSetting({
    db: fakeDb({ row: { ciphertext: encrypted.ciphertext, iv: encrypted.iv } }),
    secret: SECRET, env: resendEnv(ENV_RESEND), key: 'RESEND_API_KEY',
  });
  assert.equal(fromRow, RESEND);
  assert.equal(await getSetting({
    db: fakeDb(), secret: SECRET, env: resendEnv(ENV_RESEND), key: 'RESEND_API_KEY',
  }), ENV_RESEND);
  assert.equal(await getSetting({ db: fakeDb(), secret: SECRET, env: {}, key: 'RESEND_API_KEY' }), null);
});

test('the listing hides secret values and shows non-secret values and sources', async () => {
  const encrypted = await encryptToken({ secret: SECRET, plaintext: 'founder@nexlabs.company', info: 'settings-v1' });
  const entries = await listSettings({
    db: fakeDb({ rows: [{ key: 'COINBLINK_TEST_EMAIL', ciphertext: encrypted.ciphertext, iv: encrypted.iv, updatedAt: 100 }] }),
    secret: SECRET,
    env: { X_CLIENT_ID: 'client_12345' },
  });
  const testEmail = entries.find((entry) => entry.key === 'COINBLINK_TEST_EMAIL');
  assert.equal(testEmail.value, 'founder@nexlabs.company');
  assert.equal(testEmail.source, 'database');
  const resend = entries.find((entry) => entry.key === 'RESEND_API_KEY');
  assert.equal(resend.configured, false);
  assert.equal(resend.value, null);
  const x = entries.find((entry) => entry.key === 'X_CLIENT_ID');
  assert.equal(x.source, 'environment');
  assert.equal(x.value, 'client_12345');
});

test('clear removes only a stored row and audits the action', async () => {
  assert.equal(await clearSetting({ db: fakeDb({ row: {} }), key: 'RESEND_API_KEY', nowMs: NOW }), true);
  assert.equal(await clearSetting({ db: fakeDb(), key: 'RESEND_API_KEY', nowMs: NOW }), false);
  assert.equal(await clearSetting({ db: fakeDb(), key: 'UNKNOWN', nowMs: NOW }), false);
});

test('the settings page renders status, never a secret value, and the test form', async () => {
  const entries = await listSettings({
    db: fakeDb({ rows: [] }), secret: SECRET,
    env: { ...resendEnv(RESEND), COINBLINK_EMAIL_FROM: 'onboarding@resend.dev', COINBLINK_TEST_EMAIL: 'founder@nexlabs.company' },
  });
  const response = settingsPage({ entries, csrf: 'c'.repeat(64) });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /Resend API key/u);
  assert.match(body, /configured — enter a new value to replace/u);
  assert.match(body, /Test email/u);
  assert.match(body, /founder@nexlabs\.company/u);
  assert.doesNotMatch(body, new RegExp(RESEND, 'u'));
});

test('the Resend adapter sends and reports provider errors without the key', async () => {
  const seen = [];
  const sent = await sendEmail({
    fetchImpl: async (url, options) => {
      seen.push({ url, options });
      return new Response(JSON.stringify({ id: 'email_1' }), { status: 200 });
    },
    apiKey: RESEND, from: 'onboarding@resend.dev', to: 'founder@nexlabs.company', subject: 'Test', text: 'Hello',
  });
  assert.deepEqual(sent, { status: 'sent', id: 'email_1' });
  assert.equal(seen[0].url, 'https://api.resend.com/emails');
  assert.equal(seen[0].options.headers.authorization, 'Bearer ' + RESEND);
  assert.deepEqual(JSON.parse(seen[0].options.body).to, ['founder@nexlabs.company']);
  const failed = await sendEmail({
    fetchImpl: async () => new Response(JSON.stringify({
      name: 'validation_error',
      message: 'You can only send testing emails to your own email address (owner@example.test).',
    }), { status: 403 }),
    apiKey: RESEND, from: 'onboarding@resend.dev', to: 'founder@nexlabs.company', subject: 'Test', text: 'Hello',
  });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.statusCode, 403);
  assert.equal(failed.name, 'validation_error');
  assert.equal(JSON.stringify(failed).includes(RESEND), false);
});

test('the test send resolves settings from the environment and reports missing ones', async () => {
  const env = {
    ...resendEnv(RESEND),
    COINBLINK_EMAIL_FROM: 'onboarding@resend.dev',
    COINBLINK_TEST_EMAIL: 'founder@nexlabs.company',
  };
  const result = await sendTestEmail({
    db: fakeDb(), secret: SECRET, env, to: '', nowMs: NOW,
    fetchImpl: async () => new Response(JSON.stringify({ id: 'email_2' }), { status: 200 }),
  });
  assert.equal(result.status, 'sent');
  assert.equal(result.to, 'founder@nexlabs.company');
  const missing = await sendTestEmail({
    db: fakeDb(), secret: SECRET, env: {}, to: '', nowMs: NOW,
    fetchImpl: async () => { throw new Error('must not run'); },
  });
  assert.equal(missing.status, 'not_configured');
  assert.deepEqual(missing.missing, ['RESEND_API_KEY', 'COINBLINK_EMAIL_FROM', 'COINBLINK_TEST_EMAIL']);
});

test('the admin route exposes settings and the test send', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ['/admin/settings', 'setSetting', 'clearSetting', 'sendTestEmail', 'INTEGRATIONS']) {
    assert.ok(route.includes(marker), marker);
  }
  // Publishing is owner-triggered only; nothing schedules or auto-publishes.
  assert.doesNotMatch(route, /schedule/iu);
});
