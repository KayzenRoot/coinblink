import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/pages/developers.astro', 'utf8');

test('the developer page documents the metered endpoint a partner calls', () => {
  for (const marker of [
    'id="m11-metered"', 'GET /v1/status', 'Authorization: Bearer',
    'x-api-key', 'Retry-After', 'QUOTA_EXCEEDED', 'API_KEY_REVOKED',
    'INVALID_API_KEY', 'API_KEY_REQUIRED', 'no-store', 'redistribution',
  ]) {
    assert.ok(page.includes(marker), marker);
  }
});

test('the plans and the entitlement rule are stated', () => {
  assert.match(page, /Sandbox \(1&nbsp;000 calls per UTC month/u);
  assert.match(page, /Starter \(25&nbsp;000\)/u);
  assert.match(page, /Pro \(250&nbsp;000\)/u);
  assert.match(page, /paid plans require an entitling\s+subscription/u);
  assert.match(page, /cannot pass the limit/u);
});

test('the page no longer claims there are no API keys', () => {
  assert.doesNotMatch(page, /No signup, API keys/u);
  assert.match(page, /There is no self-serve signup/u);
  assert.match(page, /issued by the owner/u);
});
