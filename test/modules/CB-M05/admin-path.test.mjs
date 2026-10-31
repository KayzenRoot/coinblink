import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizePath } from '../../../src/modules/CB-M05/p1-production/owner-auth.mjs';

test('a trailing slash resolves to the same admin route', () => {
  assert.equal(normalizePath('/admin'), '/admin');
  assert.equal(normalizePath('/admin/'), '/admin');
  assert.equal(normalizePath('/admin/login/'), '/admin/login');
  assert.equal(normalizePath('/admin//'), '/admin');
  assert.equal(normalizePath('/'), '/');
  assert.equal(normalizePath(''), '/');
});

test('the admin router normalizes before matching', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  assert.match(route, /const path = normalizePath\(url\.pathname\);/u);
  assert.match(route, /normalizePath,/u);
});
