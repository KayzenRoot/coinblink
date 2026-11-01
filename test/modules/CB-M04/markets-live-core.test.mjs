import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { changePercent, money, parseBinance, parseCoinbase } from '../../../public/markets-live-core.js';

test('money formats by magnitude', () => {
  assert.equal(money(77952.38), '$77,952');
  assert.equal(money(2265.4), '$2,265.40');
  assert.equal(money(1.2534), '$1.25');
});

test('the change is computed from the open and never divided by zero', () => {
  assert.equal(changePercent(110, 100), 10);
  assert.equal(changePercent(90, 100), -10);
  assert.equal(changePercent(100, 0), null);
  assert.equal(changePercent(Number.NaN, 100), null);
});

test('a Binance frame yields the symbol, price and 24h change', () => {
  const frame = JSON.stringify({ data: { s: 'BTCUSDT', c: '77952.38000000', o: '77602.01000000' } });
  const parsed = parseBinance(frame);
  assert.equal(parsed.symbol, 'BTC');
  assert.equal(parsed.price, 77952.38);
  assert.ok(parsed.change > 0.4 && parsed.change < 0.5);
  assert.equal(parseBinance(JSON.stringify({ result: null, id: 1 })), null);
  assert.equal(parseBinance(JSON.stringify({ data: { s: 'BTCUSDT', c: '0' } })), null);
});

test('a Coinbase frame yields the same shape', () => {
  const frame = JSON.stringify({ type: 'ticker', product_id: 'ETH-USD', price: '2265.4', open_24h: '2200' });
  const parsed = parseCoinbase(frame);
  assert.equal(parsed.symbol, 'ETH');
  assert.equal(parsed.price, 2265.4);
  assert.ok(parsed.change > 2.9 && parsed.change < 3.1);
  assert.equal(parseCoinbase(JSON.stringify({ type: 'subscriptions' })), null);
});

test('the stream subscribes to all five symbols and resets its retry budget', () => {
  const script = readFileSync('public/markets-live.js', 'utf8');
  for (const pair of ['btcusdt@miniTicker', 'ethusdt@miniTicker', 'solusdt@miniTicker', 'bnbusdt@miniTicker', 'xrpusdt@miniTicker']) {
    assert.ok(script.includes(pair), pair);
  }
  assert.match(script, /attempts = 0;/u);
  assert.doesNotMatch(script, /eval|new Function|innerHTML/u);
});

test('the CSP allows only the two stream origins and the home gates the script', () => {
  const middleware = readFileSync('src/middleware.ts', 'utf8');
  assert.ok(middleware.includes("connect-src 'self' wss://stream.binance.com:9443 wss://ws-feed.exchange.coinbase.com;"));
  const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
  assert.ok(home.includes('import.meta.env.PUBLIC_MARKETS_STREAM === "true"'));
  assert.ok(home.includes('<script src="/markets-live.js" type="module"></script>'));
  assert.ok(home.includes('data-live-symbol={market.symbol}'));
  assert.ok(home.includes('data-live-change'));
});
