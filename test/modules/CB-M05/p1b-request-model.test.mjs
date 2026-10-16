import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertSyntheticMutationRequest,
  canRecoverWithTwoSyntheticAuthenticators,
} from '../../../src/modules/CB-M05/p1b-local/request-model.mjs';

const expectedOrigin = 'https://owner.example.test';
const csrfToken = 'TEST-CSRF-TOKEN-ONLY-IN-MEMORY-001';

function request(overrides = {}) {
  return {
    method: 'POST',
    origin: expectedOrigin,
    fetchSite: 'same-origin',
    contentType: 'application/json',
    csrfToken,
    idempotencyKey: 'TEST-IDEMPOTENCY-000001',
    ...overrides,
  };
}

test('P1B MODEL / CSRF-01: same-origin JSON mutation with CSRF and fresh idempotency key passes once', () => {
  const consumed = new Set();
  assert.equal(assertSyntheticMutationRequest(request(), { expectedOrigin, csrfToken, consumedIdempotencyKeys: consumed }), true);
  assert.equal(consumed.size, 1);
  assert.throws(() => assertSyntheticMutationRequest(request(), { expectedOrigin, csrfToken, consumedIdempotencyKeys: consumed }), /already consumed/i);
});

test('P1B MODEL / CSRF-01: method, exact Origin, and Fetch Metadata violations fail closed', () => {
  for (const bad of [
    { method: 'GET' },
    { method: 'PUT' },
    { origin: 'https://attacker.example.test' },
    { origin: 'null' },
    { origin: undefined },
    { fetchSite: 'cross-site' },
    { fetchSite: 'same-site' },
    { fetchSite: undefined },
  ]) assert.throws(() => assertSyntheticMutationRequest(request(bad), { expectedOrigin, csrfToken }));
});

test('P1B MODEL / CSRF-01: missing or invalid CSRF token fails without consuming idempotency key', () => {
  for (const bad of [{ csrfToken: undefined }, { csrfToken: '' }, { csrfToken: 'TEST-INVALID-CSRF' }]) {
    const consumed = new Set();
    assert.throws(() => assertSyntheticMutationRequest(request(bad), { expectedOrigin, csrfToken, consumedIdempotencyKeys: consumed }), /CSRF/i);
    assert.equal(consumed.size, 0);
  }
});

test('P1B MODEL / CSRF-01: JSON content type is exact and cannot be replaced by form or text bodies', () => {
  for (const contentType of ['text/plain', 'application/x-www-form-urlencoded', 'application/jsonp', 'multipart/form-data', undefined]) {
    assert.throws(() => assertSyntheticMutationRequest(request({ contentType }), { expectedOrigin, csrfToken }));
  }
  assert.equal(assertSyntheticMutationRequest(request({ contentType: 'application/json; charset=utf-8' }), { expectedOrigin, csrfToken }), true);
});

test('P1B MODEL / CSRF-01: malformed, absent, or replayed idempotency keys are denied', () => {
  for (const idempotencyKey of [undefined, '', 'short', 'contains spaces 000', 'x'.repeat(65)]) {
    assert.throws(() => assertSyntheticMutationRequest(request({ idempotencyKey }), { expectedOrigin, csrfToken }));
  }
  assert.throws(() => assertSyntheticMutationRequest(request(), { expectedOrigin, csrfToken, consumedIdempotencyKeys: [] }), /Set/i);
});

test('P1B MODEL / REC-01: recovery requires two distinct active authenticators owned by the sole Owner', () => {
  const primary = { credentialId: 'TEST-CREDENTIAL-PRIMARY-A', ownerId: 1, revokedAt: null };
  const recovery = { credentialId: 'TEST-CREDENTIAL-RECOVERY-B', ownerId: 1, revokedAt: null };
  assert.equal(canRecoverWithTwoSyntheticAuthenticators({ ownerId: 1, primary, recovery }), true);
  assert.equal(canRecoverWithTwoSyntheticAuthenticators({ ownerId: 1, primary, recovery: primary }), false);
  assert.equal(canRecoverWithTwoSyntheticAuthenticators({ ownerId: 1, primary, recovery: { ...recovery, revokedAt: 1760486400 } }), false);
  assert.equal(canRecoverWithTwoSyntheticAuthenticators({ ownerId: 2, primary, recovery }), false);
  assert.equal(canRecoverWithTwoSyntheticAuthenticators({ ownerId: 1, primary, recovery: { ...recovery, ownerId: 2 } }), false);
  assert.equal(canRecoverWithTwoSyntheticAuthenticators({ ownerId: 1, primary, recovery: undefined }), false);
});

test('P1B MODEL / REC-01: email-only recovery has no credential proof and fails closed', () => {
  assert.equal(canRecoverWithTwoSyntheticAuthenticators({ ownerId: 1, email: 'owner@example.test' }), false);
});
