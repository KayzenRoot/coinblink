import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  API_PLANS, apiKeysPage, authenticateApiKey, consumeQuota, createApiKey, listApiKeys,
  periodResetSeconds, planAllowed, quotaFor, readPresentedKey, revokeApiKey, usagePeriod,
} from '../../../src/modules/CB-M11/api-keys.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);

function fakeDb() {
  const keys = new Map();
  const usage = new Map();
  return {
    keys,
    usage,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_api_keys WHERE secret_digest')) {
            for (const [keyId, row] of keys) if (row.digest === args[0]) return { keyId, plan: row.plan, revokedAt: row.revokedAt };
            return null;
          }
          if (sql.includes('FROM cms_api_usage')) {
            const calls = usage.get(args[0] + ':' + args[1]);
            return calls === undefined ? null : { calls };
          }
          return null;
        },
        async run() {
          if (sql.startsWith('INSERT INTO cms_api_keys')) {
            const [keyId, label, prefix, digest, plan, createdAt] = args;
            keys.set(keyId, { label, prefix, digest, plan, createdAt, revokedAt: null, lastUsedAt: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO cms_api_usage')) {
            const [keyId, period, , limit] = args;
            const id = keyId + ':' + period;
            const calls = usage.get(id) ?? 0;
            if (calls >= limit) return { meta: { changes: 0 } };
            usage.set(id, calls + 1);
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE cms_api_keys SET last_used_at')) {
            const row = keys.get(args[1]);
            if (row) row.lastUsedAt = args[0];
            return { meta: { changes: row ? 1 : 0 } };
          }
          if (sql.startsWith('UPDATE cms_api_keys SET revoked_at')) {
            const row = keys.get(args[1]);
            if (!row || row.revokedAt !== null) return { meta: { changes: 0 } };
            row.revokedAt = args[0];
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
        async all() {
          const results = [...keys].map(([keyId, row]) => ({
            keyId, label: row.label, prefix: row.prefix, plan: row.plan, createdAt: row.createdAt,
            lastUsedAt: row.lastUsedAt, revokedAt: row.revokedAt, calls: usage.get(keyId + ':' + args[0]) ?? 0,
          }));
          return { results };
        },
      });
      return { bind };
    },
  };
}

function request(headers) {
  return { headers: { get: (name) => headers[name.toLowerCase()] ?? null } };
}

test('a key is shown once and only its digest is stored', async () => {
  const db = fakeDb();
  const issued = await createApiKey({ db, label: 'Partner A', plan: 'sandbox', active: false, nowMs: NOW });
  assert.match(issued.key, /^cbk_[0-9a-f]{16}\.[0-9a-f]{64}$/u);
  const stored = db.keys.get(issued.keyId);
  assert.equal(stored.digest.includes(issued.key), false);
  assert.equal(stored.digest.length, 64);
  assert.equal(stored.prefix, issued.key.slice(0, 12));
  assert.equal(stored.prefix.length, 12);
});

test('labels and plans are validated against the entitlement', async () => {
  const db = fakeDb();
  await assert.rejects(createApiKey({ db, label: 'x', plan: 'sandbox', active: false }), /Label/u);
  await assert.rejects(createApiKey({ db, label: 'Partner', plan: 'starter', active: false }), /subscription/u);
  await assert.rejects(createApiKey({ db, label: 'Partner', plan: 'enterprise', active: true }), /subscription/u);
  assert.equal(planAllowed({ plan: 'sandbox', active: false }), true);
  assert.equal(planAllowed({ plan: 'starter', active: false }), false);
  assert.equal(planAllowed({ plan: 'pro', active: true }), true);
  const issued = await createApiKey({ db, label: 'Partner B', plan: 'starter', active: true, nowMs: NOW });
  assert.equal(issued.plan, 'starter');
});

test('authentication separates missing, invalid, revoked and live keys', async () => {
  const db = fakeDb();
  const issued = await createApiKey({ db, label: 'Partner A', plan: 'sandbox', active: false, nowMs: NOW });
  assert.equal((await authenticateApiKey({ db, presented: '' })).status, 'missing');
  assert.equal((await authenticateApiKey({ db, presented: 'cbk_nope' })).status, 'missing');
  assert.equal((await authenticateApiKey({ db, presented: 'cbk_' + 'a'.repeat(16) + '.' + 'b'.repeat(64) })).status, 'invalid');
  assert.equal((await authenticateApiKey({ db, presented: issued.key })).status, 'ok');
  assert.equal(await revokeApiKey({ db, keyId: issued.keyId, nowMs: NOW }), true);
  assert.equal(await revokeApiKey({ db, keyId: issued.keyId, nowMs: NOW }), false);
  const revoked = await authenticateApiKey({ db, presented: issued.key });
  assert.equal(revoked.status, 'revoked');
  assert.equal(revokeApiKey({ db, keyId: '../../etc', nowMs: NOW }) instanceof Promise, true);
  assert.equal(await revokeApiKey({ db, keyId: '../../etc', nowMs: NOW }), false);
});

test('the bearer header wins and x-api-key is the fallback', () => {
  assert.equal(readPresentedKey(request({ authorization: 'Bearer abc' })), 'abc');
  assert.equal(readPresentedKey(request({ 'x-api-key': 'def' })), 'def');
  assert.equal(readPresentedKey(request({ authorization: 'Basic abc', 'x-api-key': 'def' })), 'def');
  assert.equal(readPresentedKey(request({})), '');
});

test('quota consumption is atomic and stops exactly at the limit', async () => {
  const db = fakeDb();
  const issued = await createApiKey({ db, label: 'Partner A', plan: 'sandbox', active: false, nowMs: NOW });
  const limit = quotaFor('sandbox');
  assert.equal(limit, API_PLANS.sandbox.limit);
  const first = await consumeQuota({ db, keyId: issued.keyId, plan: 'sandbox', nowMs: NOW });
  assert.equal(first.allowed, true);
  assert.equal(first.used, 1);
  assert.equal(first.remaining, limit - 1);
  db.usage.set(issued.keyId + ':' + usagePeriod(NOW), limit);
  const blocked = await consumeQuota({ db, keyId: issued.keyId, plan: 'sandbox', nowMs: NOW });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.used, limit);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.resetsInSeconds, periodResetSeconds(NOW));
});

test('the period bucket and the reset window are UTC calendar months', () => {
  assert.equal(usagePeriod(Date.UTC(2026, 9, 31, 23, 59, 59)), '2026-10');
  assert.equal(usagePeriod(Date.UTC(2026, 10, 1, 0, 0, 0)), '2026-11');
  assert.equal(periodResetSeconds(Date.UTC(2026, 9, 31, 23, 0, 0)), 3600);
  assert.equal(periodResetSeconds(Date.UTC(2026, 11, 31, 23, 59, 59)), 1);
});

test('the listing reports usage without exposing the secret', async () => {
  const db = fakeDb();
  const issued = await createApiKey({ db, label: 'Partner A', plan: 'sandbox', active: false, nowMs: NOW });
  await consumeQuota({ db, keyId: issued.keyId, plan: 'sandbox', nowMs: NOW });
  const rows = await listApiKeys({ db, nowMs: NOW });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].calls, 1);
  assert.equal(rows[0].limit, 1000);
  assert.equal(JSON.stringify(rows).includes(issued.key), false);
});

test('the owner screen shows a new key once and revokes without leaking it', () => {
  const issued = { keyId: 'a'.repeat(16), key: 'cbk_' + 'a'.repeat(16) + '.' + 'b'.repeat(64), plan: 'sandbox', label: 'Partner A' };
  const page = apiKeysPage({ keys: [], active: false, csrf: 'c'.repeat(64), issued });
  assert.match(page, /Copy it now/u);
  assert.ok(page.includes(issued.key));
  const list = apiKeysPage({
    keys: [{
      keyId: issued.keyId, label: 'Partner A', prefix: 'cbk_aaaaaaaa', plan: 'sandbox',
      createdAt: 1, lastUsedAt: null, revokedAt: null, calls: 3, limit: 1000, period: '2026-10',
    }],
    active: false, csrf: 'c'.repeat(64),
  });
  assert.equal(list.includes(issued.key), false);
  assert.match(list, /3 \/ 1000/u);
  assert.match(list, /Revoke/u);
  assert.match(list, /only Sandbox keys are available/u);
  const revoked = apiKeysPage({
    keys: [{
      keyId: issued.keyId, label: 'Partner A', prefix: 'cbk_aaaaaaaa', plan: 'sandbox',
      createdAt: 1, lastUsedAt: null, revokedAt: 1_800_000_000, calls: 0, limit: 1000, period: '2026-10',
    }],
    active: true, csrf: 'c'.repeat(64),
  });
  assert.match(revoked, /revoked 2027-01-15/u);
  assert.doesNotMatch(revoked, /action="\/admin\/api\/revoke"/u);
});

test('the admin routes and the metered endpoint expose the contract', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ['/admin/api', '/admin/api/create', '/admin/api/revoke', 'apiKeysPage', 'createApiKey']) {
    assert.ok(route.includes(marker), marker);
  }
  const endpoint = readFileSync('src/pages/v1/status.ts', 'utf8');
  for (const marker of ['API_KEY_REQUIRED', 'INVALID_API_KEY', 'API_KEY_REVOKED', 'QUOTA_EXCEEDED', 'retry-after', 'consumeQuota']) {
    assert.ok(endpoint.includes(marker), marker);
  }
  assert.doesNotMatch(endpoint, /console\.|process\.env/u);
});
