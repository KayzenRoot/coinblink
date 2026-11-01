import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync('public/markets-live.js', 'utf8');
const middleware = readFileSync('src/middleware.ts', 'utf8');
const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');

test('the CSP allows exactly the two public price streams', () => {
  assert.match(middleware, /connect-src 'self' wss:\/\/stream\.binance\.com:9443 wss:\/\/ws-feed\.exchange\.coinbase\.com;/u);
  assert.doesNotMatch(middleware, /connect-src[^;]*\*/u);
});

test('the stream script subscribes to the five symbols and falls back', () => {
  for (const marker of ['wss://stream.binance.com:9443/stream?streams=',
    'btcusdt@miniTicker/ethusdt@miniTicker/solustd@miniTicker/bnbusdt@miniTicker/xrpusdt@miniTicker',
    'wss://ws-feed.exchange.coinbase.com', 'data-live-symbol', 'data-live-price', 'data-live-change',
    'attempts > 3']) {
    assert.ok(script.includes(marker), marker);
  }
  assert.doesNotMatch(script, /\beval\b|new Function/u);
});

test('the change is computed from the 24h open, not invented', () => {
  assert.match(script, /\(\(close - open\) \/ open\) \* 100/u);
  assert.match(script, /\(\(price - open\) \/ open\) \* 100/u);
  assert.match(script, /isFinite\(close\)/u);
});

test('the home exposes the hooks and loads the script', () => {
  assert.match(home, /data-live-symbol=\{market\.symbol\}/u);
  assert.match(home, /data-live-change/u);
  assert.match(home, /import\.meta\.env\.PUBLIC_MARKETS_STREAM === "true"/u);
  assert.match(home, /<script is:inline src="\/markets-live\.js" defer><\/script>/u);
  const workflow = readFileSync('.github/workflows/cloudflare-production.yml', 'utf8');
  assert.match(workflow, /PUBLIC_MARKETS_STREAM: "true"/u);
});
