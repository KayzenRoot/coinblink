import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { launchGates, opsPage, readOps } from '../../../src/modules/CB-M14/ops.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const BUILD = { sha: 'abcdef1234567890', environment: 'production' };

function fakeDb(values) {
  return {
    prepare(sql) {
      const read = async () => {
        if (sql.includes('cms_drafts WHERE owner_id=1) AS drafts')) return values.counts;
        if (sql.includes('FROM cms_api_keys')) return values.api;
        if (sql.includes('FROM cms_api_usage')) return values.usage;
        if (sql.includes('FROM cms_pageviews')) return values.views;
        return null;
      };
      return { bind: () => ({ first: read }), first: read };
    },
  };
}

test('readOps reports measured counts for the current month', async () => {
  const db = fakeDb({
    counts: { drafts: 1, passkeys: 2, notes: 3 },
    api: { keys: 2, active: 1 },
    usage: { calls: 42 },
    views: { total: 130 },
  });
  const ops = await readOps({ db, nowMs: NOW });
  assert.deepEqual(ops, {
    drafts: 1, passkeys: 2, notes: 3, apiKeys: 2, apiKeysActive: 1, apiCalls: 42, pageviews: 130,
  });
});

test('a gate passes only when the measured state allows it', () => {
  const ops = { passkeys: 2, apiKeys: 2, apiKeysActive: 1 };
  const gates = launchGates({
    ops,
    billing: { missing: [], active: true },
    research: { used: 1, cap: 20 },
  });
  assert.equal(gates.every((gate) => gate.pass), true);

  const blocked = launchGates({
    ops: { passkeys: 1, apiKeys: 1, apiKeysActive: 0 },
    billing: { missing: ['STRIPE_WEBHOOK_SECRET'], active: false },
    research: { used: 20, cap: 20 },
  });
  assert.equal(blocked.every((gate) => gate.pass === false), true);
  assert.match(blocked[1].detail, /missing: STRIPE_WEBHOOK_SECRET/u);
  assert.equal(blocked[2].detail, '0 active of 1');
  assert.equal(blocked[3].detail, '20 / 20 notes today');
});

test('the page renders the facts and never claims an unmeasured pass', () => {
  const ops = { drafts: 1, passkeys: 1, notes: 2, apiKeys: 1, apiKeysActive: 0, apiCalls: 0, pageviews: 7 };
  const gates = launchGates({
    ops,
    billing: { missing: [], active: false },
    research: { used: 2, cap: 20 },
  });
  const html = opsPage({
    ops, gates, build: BUILD,
    subscription: { status: 'active', priceId: 'price_1UWOjTRtfVHyZXkv4WOpeT25' },
    csrf: 'c'.repeat(64),
  });
  assert.match(html, /abcdef1234567890/u);
  assert.match(html, /0 active of 1 · 0 calls this month/u);
  assert.match(html, /BLOCKED/u);
  assert.match(html, /<strong>PASS<\/strong>/u);
  assert.match(html, /1 active passkey\(s\)/u);
  assert.doesNotMatch(html, /<script/iu);
});

test('the admin route serves the operations page behind the owner session', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ["path === '/admin/ops'", 'readOps', 'launchGates', 'opsPage', 'buildInfo']) {
    assert.ok(route.includes(marker), marker);
  }
  const dashboard = readFileSync('src/modules/CB-M05/p1-production/owner-auth.mjs', 'utf8');
  assert.match(dashboard, /'\/admin\/ops'/u);
});
