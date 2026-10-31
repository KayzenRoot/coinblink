import test from 'node:test';
import assert from 'node:assert/strict';
import {
  costQuery, formatReport, readProviderCosts, summarizeCosts, windowDays,
} from '../../../src/modules/CB-M14/cost.mjs';

const ACCOUNT = '91aeaffe2456eff6bb9ce76ce177bb3f';
const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const PAYLOAD = {
  data: {
    viewer: {
      accounts: [{
        workersInvocationsAdaptive: [
          { dimensions: { scriptName: 'coinblink-production' }, sum: { requests: 1293, errors: 0 } },
          { dimensions: { scriptName: 'coinblink-m00-preview' }, sum: { requests: 13, errors: 2 } },
        ],
        d1AnalyticsAdaptiveGroups: [
          { dimensions: { databaseId: 'd47ec576-cec4-470e-966f-bc05b8cfcdc1' }, sum: { rowsRead: 1642, rowsWritten: 352 } },
        ],
      }],
    },
  },
  errors: null,
};

test('the GraphQL envelope becomes plain measured numbers', () => {
  const costs = summarizeCosts(PAYLOAD);
  assert.equal(costs.workers.requests, 1306);
  assert.equal(costs.workers.errors, 2);
  assert.equal(costs.d1.rowsRead, 1642);
  assert.equal(costs.d1.rowsWritten, 352);
  assert.deepEqual(costs.workers.scripts.map((row) => row.script), ['coinblink-production', 'coinblink-m00-preview']);
});

test('an API error is surfaced instead of a silent zero', () => {
  assert.throws(() => summarizeCosts({ errors: [{ message: 'unknown field "neurons"' }] }), /unknown field/u);
  assert.throws(() => summarizeCosts(null), /payload/u);
});

test('the query carries the account, the window and the filters', () => {
  const range = windowDays(NOW, 7);
  const query = costQuery({ accountId: ACCOUNT, from: range.from, to: range.to, scriptName: 'coinblink-production' });
  assert.match(query, new RegExp(ACCOUNT, 'u'));
  assert.match(query, /datetime_geq: "2026-10-24T12:00:00.000Z"/u);
  assert.match(query, /datetime_leq: "2026-10-31T12:00:00.000Z"/u);
  assert.match(query, /scriptName: "coinblink-production"/u);
  assert.throws(() => costQuery({ accountId: 'short', from: range.from, to: range.to }), /accountId/u);
  assert.throws(() => costQuery({ accountId: ACCOUNT, from: 'nope', to: range.to }), /ISO dates/u);
});

test('readProviderCosts posts to GraphQL and rejects a bad token or HTTP status', async () => {
  const seen = [];
  const costs = await readProviderCosts({
    token: 'x'.repeat(30), accountId: ACCOUNT, from: windowDays(NOW).from, to: windowDays(NOW).to,
    fetchImpl: async (url, options) => {
      seen.push({ url, auth: options.headers.authorization });
      return new Response(JSON.stringify(PAYLOAD), { status: 200 });
    },
  });
  assert.equal(seen[0].url, 'https://api.cloudflare.com/client/v4/graphql');
  assert.equal(seen[0].auth, 'Bearer ' + 'x'.repeat(30));
  assert.equal(costs.workers.requests, 1306);
  await assert.rejects(readProviderCosts({ token: 'short', accountId: ACCOUNT, from: windowDays(NOW).from, to: windowDays(NOW).to }), /token/u);
  await assert.rejects(readProviderCosts({
    token: 'x'.repeat(30), accountId: ACCOUNT, from: windowDays(NOW).from, to: windowDays(NOW).to,
    fetchImpl: async () => new Response('{}', { status: 403 }),
  }), /HTTP 403/u);
});

test('the report states the window and every measured counter', () => {
  const range = windowDays(NOW, 7);
  const text = formatReport(summarizeCosts(PAYLOAD), range);
  assert.match(text, /window: 2026-10-24T12:00:00\.000Z → 2026-10-31T12:00:00\.000Z/u);
  assert.match(text, /Workers requests: 1306/u);
  assert.match(text, /D1 rows written: {2}352/u);
  assert.match(text, /script coinblink-production: 1293 requests, 0 errors/u);
});
