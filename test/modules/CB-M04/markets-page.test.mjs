import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIVE_PROVIDER, buildLiveSnapshot, claimProviderCall, isLiveEnabled, readLiveSnapshot } from '../../../src/modules/CB-M04/live-quotes.mjs';

const NOW = Date.UTC(2026, 10, 1, 12, 0, 0);
const PAYLOAD = { bitcoin: { usd: 68234.12 }, ethereum: { usd: 3120.4 }, solana: { usd: 142.7 }, binancecoin: { usd: 605.21 }, ripple: { usd: 0.5243 } };

test('the live path stays off unless the deployment enables it', async () => {
  assert.equal(isLiveEnabled('true'), true);
  assert.equal(isLiveEnabled(''), false);
  assert.equal(isLiveEnabled('yes please'), false);
  const off = await readLiveSnapshot({ enabled: undefined });
  assert.equal(off.status, 'DISABLED');
  assert.deepEqual(off.quotes, []);
});

test('the snapshot carries attribution, delay and the no-order-flow guarantee', () => {
  const snapshot = buildLiveSnapshot(PAYLOAD, { asOfUTC: '2026-11-01T12:00:00.000Z' });
  assert.equal(snapshot.status, 'LIVE_ATTRIBUTED');
  assert.equal(snapshot.side, 'NO_ORDER_FLOW');
  assert.equal(snapshot.commercialUseAllowed, false);
  assert.equal(snapshot.attribution, LIVE_PROVIDER.attribution);
  assert.equal(snapshot.delayedUpToSeconds, LIVE_PROVIDER.cacheSeconds);
  assert.deepEqual(snapshot.quotes.map((quote) => quote.symbol), ['BTC', 'ETH', 'SOL', 'BNB', 'XRP']);
  assert.equal(snapshot.quotes[0].priceUsd, 68234.12);
});

test('a malformed payload fails closed instead of inventing a price', () => {
  assert.throws(() => buildLiveSnapshot({ bitcoin: { usd: 1 } }), /missing ethereum/u);
  assert.throws(() => buildLiveSnapshot({ ...PAYLOAD, solana: { usd: -1 } }), /no usable usd/u);
  assert.throws(() => buildLiveSnapshot({ ...PAYLOAD, ripple: undefined }), /missing ripple/u);
  assert.throws(() => buildLiveSnapshot({ ...PAYLOAD, ethereum: { usd: 'x' } }), /no usable usd/u);
  assert.throws(() => buildLiveSnapshot([], {}), /plain object/u);
});

test('a provider failure becomes UNAVAILABLE with a reason', async () => {
  const cache = { read: () => null, write: () => {} };
  const failed = await readLiveSnapshot({
    enabled: 'true', cache, fetchImpl: async () => new Response('nope', { status: 503 }),
  });
  assert.equal(failed.status, 'UNAVAILABLE');
  const thrown = await readLiveSnapshot({
    enabled: 'true', cache, fetchImpl: async () => { throw new Error('network'); },
  });
  assert.equal(thrown.status, 'UNAVAILABLE');
});

test('the page and the ticker render the attributed quotes', () => {
  const page = readFileSync('src/modules/CB-M04/MarketsPage.astro', 'utf8');
  for (const marker of ['enabled: import.meta.env.PUBLIC_MARKETS_LIVE',
    'LIVE_PROVIDER.attribution', 'snapshot.asOfUTC', 'Not investment advice']) {
    assert.ok(page.includes(marker), marker);
  }
  const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
  assert.match(home, /enabled: import\.meta\.env\.PUBLIC_MARKETS_LIVE/u);
  assert.match(home, /marketQuotes\.map/u);
  const workflow = readFileSync('.github/workflows/cloudflare-production.yml', 'utf8');
  assert.match(workflow, /PUBLIC_MARKETS_LIVE: "true"/u);
});

test('the monthly budget guard stops before the account quota', async () => {
  let calls = 0;
  const db = {
    prepare() {
      return {
        bind: (...args) => ({
          run: async () => {
            const limit = args[3];
            if (calls >= limit) return { meta: { changes: 0 } };
            calls += 1;
            return { meta: { changes: 1 } };
          },
        }),
      };
    },
  };
  assert.equal(await claimProviderCall({ db, nowMs: NOW, limit: 2 }), true);
  assert.equal(await claimProviderCall({ db, nowMs: NOW, limit: 2 }), true);
  assert.equal(await claimProviderCall({ db, nowMs: NOW, limit: 2 }), false);
  assert.equal(await claimProviderCall({ db: null, nowMs: NOW }), true, 'no database means no guard');
  const broken = { prepare() { throw new Error('no such table'); } };
  assert.equal(await claimProviderCall({ db: broken, nowMs: NOW }), true, 'a missing table never blocks the feed');
});

test('the demo key travels in the documented header and never in the URL', async () => {
  const cache = { read: () => null, write: () => {} };
  let seen = null;
  const snapshot = await readLiveSnapshot({
    enabled: 'true', cache, apiKey: 'CG-test-key',
    fetchImpl: async (url, options) => {
      seen = { url, headers: options.headers };
      return new Response(JSON.stringify(PAYLOAD), { status: 200 });
    },
  });
  assert.equal(snapshot.status, 'LIVE_ATTRIBUTED');
  assert.equal(seen.headers['x-cg-demo-api-key'], 'CG-test-key');
  assert.equal(seen.url.includes('CG-test-key'), false);
});
