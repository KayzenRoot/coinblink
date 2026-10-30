import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { revokeCredential, revokeSession, securityPage } from '../../../src/modules/CB-M05/p1-production/security.mjs';

const HEX = 'a'.repeat(64);
const CREDENTIAL = 'credential-id-1234567890';

test('the security page renders passkeys, sessions and audit without leaking values', async () => {
  const db = {
    prepare: () => ({
      all: async () => ({ results: [] }),
      bind: () => ({ all: async () => ({ results: [] }) }),
    }),
  };
  const response = await securityPage({ db, csrf: 'b'.repeat(64), currentDigest: HEX, now: 1000 });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /Security and audit/u);
  assert.match(body, /Passkeys/u);
  assert.match(body, /Active sessions/u);
  assert.match(body, /Audit events/u);
  assert.doesNotMatch(body, /a{64}/u);
});

test('the last active passkey cannot be revoked', async () => {
  let call = 0;
  const next = async () => {
    call += 1;
    return call === 1 ? { credential_id: CREDENTIAL, device_kind: 'primary' } : { n: 1 };
  };
  const db = {
    prepare: () => ({
      first: next,
      bind: () => ({ first: next }),
    }),
  };
  const result = await revokeCredential({ db, credentialId: CREDENTIAL, currentCredentialId: CREDENTIAL, now: 1000 });
  assert.equal(result.status, 'last');
});

test('revoking the current session is handled by the caller, not silently ignored', async () => {
  const result = await revokeSession({ db: null, digest: HEX, currentDigest: HEX, now: 1000 });
  assert.equal(result.status, 'current');
  const missing = await revokeSession({ db: null, digest: 'bad', currentDigest: HEX, now: 1000 });
  assert.equal(missing.status, 'missing');
});

test('the admin route exposes the security surface and revocation only', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ['/admin/security', 'securityPage', 'revokeCredential', 'revokeSession',
    '/admin/security/credential/revoke', '/admin/security/session/revoke']) {
    assert.ok(route.includes(marker), marker);
  }
  assert.doesNotMatch(route, /publish|schedule/iu);
});
