import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/middleware.ts', 'utf8');

test('every response carries the reviewed security header set', () => {
  for (const [name, value] of [
    ['Content-Security-Policy', "default-src 'self'"],
    ['Permissions-Policy', 'accelerometer=()'],
    ['Referrer-Policy', '"no-referrer"'],
    ['Cross-Origin-Opener-Policy', '"same-origin"'],
    ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
    ['X-Content-Type-Options', '"nosniff"'],
    ['X-Frame-Options', '"DENY"'],
    ['X-Robots-Tag', 'noindex, nofollow, noarchive'],
  ]) {
    assert.ok(source.includes(name), name);
    assert.ok(source.includes(value), name + ' value');
  }
});

test('the CSP stays self-only and forbids framing, plugins, workers and inline code', () => {
  for (const directive of [
    "default-src 'self'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
    "object-src 'none'", "script-src 'self'", "style-src 'self'", "connect-src 'self'",
    "manifest-src 'self'", "frame-src 'none'", "worker-src 'none'",
  ]) {
    assert.ok(source.includes(directive), directive);
  }
  assert.doesNotMatch(source, /unsafe-inline|unsafe-eval|unsafe-hashes/u);
});

test('sensors, payments and browser topics are denied by default', () => {
  for (const feature of ['accelerometer=()', 'browsing-topics=()', 'camera=()', 'geolocation=()',
    'gyroscope=()', 'magnetometer=()', 'microphone=()', 'payment=()', 'usb=()']) {
    assert.ok(source.includes(feature), feature);
  }
});
