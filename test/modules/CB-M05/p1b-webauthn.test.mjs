import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import {
  MAX_WEBAUTHN_PAYLOAD_BYTES,
  SYNTHETIC_ORIGIN,
  SYNTHETIC_RP_ID,
  assertWebAuthnPayloadBudget,
  encodeSyntheticCbor,
  makeAuthenticationResponse,
  makeRegistrationResponse,
  makeSyntheticAuthenticator,
  tamperBase64Url,
  verifyBoundSyntheticAuthentication,
} from '../../../src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs';

const acceptedRegistration = {
  expectedChallenge: 'TEST-CHALLENGE-REGISTRATION-001',
  expectedOrigin: SYNTHETIC_ORIGIN,
  expectedRPID: SYNTHETIC_RP_ID,
  requireUserPresence: true,
  requireUserVerification: true,
};

async function register(authenticator, options = {}, response = undefined) {
  return verifyRegistrationResponse({
    response: response ?? makeRegistrationResponse(authenticator, { challenge: acceptedRegistration.expectedChallenge, ...options }),
    ...acceptedRegistration,
  });
}

async function verifiedCredential(authenticator) {
  const result = await register(authenticator);
  assert.equal(result.verified, true);
  assert.equal(result.registrationInfo.credential.id, authenticator.id);
  assert.ok(result.registrationInfo.credential.publicKey instanceof Uint8Array);
  assert.equal(result.registrationInfo.credential.counter, 0);
  return result.registrationInfo.credential;
}

async function verifyAssertion(authenticator, response, overrides = {}) {
  const credential = overrides.credential ?? await verifiedCredential(authenticator);
  return verifyBoundSyntheticAuthentication({
    response,
    expectedChallenge: 'TEST-CHALLENGE-AUTHENTICATION-001',
    expectedOrigin: SYNTHETIC_ORIGIN,
    expectedRPID: SYNTHETIC_RP_ID,
    requireUserVerification: true,
    credential,
    ...overrides,
  });
}

async function assertAssertionRejected(authenticator, response, overrides = {}) {
  let result;
  let error;
  try {
    result = await verifyAssertion(authenticator, response, overrides);
  } catch (caught) {
    error = caught;
  }
  assert.ok(error || result?.verified === false, 'verifier must throw or return verified=false');
}

test('P1B CRYPTO / REG-01: generated ephemeral ES256 registration verifies and returns only a credential public key', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const response = makeRegistrationResponse(authenticator, { challenge: acceptedRegistration.expectedChallenge });
  const result = await register(authenticator, {}, response);

  assert.equal(result.verified, true);
  assert.equal(result.registrationInfo.fmt, 'none');
  assert.equal(result.registrationInfo.credential.id, authenticator.id);
  assert.ok(result.registrationInfo.credential.publicKey instanceof Uint8Array);
  assert.equal(result.registrationInfo.credential.counter, 0);
  assert.equal(JSON.stringify(response).includes('PRIVATE KEY'), false);
  assert.equal(JSON.stringify(response).includes('privateKey'), false);
  assert.notEqual(authenticator.privateKey, undefined, 'the ephemeral signing key exists only in this test process');
});

test('P1B CRYPTO / REG-01: two authenticators are cryptographically distinct', async () => {
  const first = makeSyntheticAuthenticator('primary');
  const second = makeSyntheticAuthenticator('recovery');
  const firstCredential = await verifiedCredential(first);
  const secondCredential = await verifiedCredential(second);

  assert.notEqual(firstCredential.id, secondCredential.id);
  assert.notDeepEqual(Buffer.from(firstCredential.publicKey), Buffer.from(secondCredential.publicKey));
  const secondAssertion = makeAuthenticationResponse(second, { challenge: 'TEST-CHALLENGE-AUTHENTICATION-001' });
  await assertAssertionRejected(first, secondAssertion, { credential: firstCredential });
});

test('P1B CRYPTO / WA-01: real generated assertion signature validates at sign counter zero', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const credential = await verifiedCredential(authenticator);
  const response = makeAuthenticationResponse(authenticator, { challenge: 'TEST-CHALLENGE-AUTHENTICATION-001', counter: 0 });
  const result = await verifyAssertion(authenticator, response, { credential });

  assert.equal(result.verified, true);
  assert.equal(result.authenticationInfo.credentialID, authenticator.id);
  assert.equal(result.authenticationInfo.newCounter, 0);
  assert.equal(result.authenticationInfo.userVerified, true);
  assert.equal(result.authenticationInfo.origin, SYNTHETIC_ORIGIN);
  assert.equal(result.authenticationInfo.rpID, SYNTHETIC_RP_ID);
});

test('P1B CRYPTO / WA-01: changed signature is rejected by the pinned verifier', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const credential = await verifiedCredential(authenticator);
  const response = makeAuthenticationResponse(authenticator, { challenge: 'TEST-CHALLENGE-AUTHENTICATION-001' });
  response.response.signature = tamperBase64Url(response.response.signature, (signature) => {
    signature[signature.length - 1] ^= 0x01;
    return signature;
  });

  await assertAssertionRejected(authenticator, response, { credential });
});

test('P1B CRYPTO / WA-01: authenticator data altered after signing is rejected', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const credential = await verifiedCredential(authenticator);
  const response = makeAuthenticationResponse(authenticator, { challenge: 'TEST-CHALLENGE-AUTHENTICATION-001' });
  response.response.authenticatorData = tamperBase64Url(response.response.authenticatorData, (authData) => {
    authData[36] ^= 0x01;
    return authData;
  });

  await assertAssertionRejected(authenticator, response, { credential });
});

test('P1B CRYPTO / WA-01: changed clientDataJSON after signing is rejected', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const credential = await verifiedCredential(authenticator);
  const response = makeAuthenticationResponse(authenticator, { challenge: 'TEST-CHALLENGE-AUTHENTICATION-001' });
  response.response.clientDataJSON = tamperBase64Url(response.response.clientDataJSON, (clientData) => {
    const parsed = JSON.parse(clientData.toString('utf8'));
    parsed.crossOrigin = true;
    return Buffer.from(JSON.stringify(parsed));
  });

  await assertAssertionRejected(authenticator, response, { credential });
});

test('P1B CRYPTO / WA-01: a different registered COSE key cannot verify the assertion', async () => {
  const primary = makeSyntheticAuthenticator('primary');
  const second = makeSyntheticAuthenticator('recovery');
  const primaryCredential = await verifiedCredential(primary);
  const secondCredential = await verifiedCredential(second);
  const response = makeAuthenticationResponse(primary, { challenge: 'TEST-CHALLENGE-AUTHENTICATION-001' });

  await assertAssertionRejected(primary, response, {
    credential: { ...primaryCredential, publicKey: secondCredential.publicKey },
  });
});

test('P1B CRYPTO / WA-02: stale or action-mismatched challenge is denied', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const response = makeAuthenticationResponse(authenticator, { challenge: 'TEST-CHALLENGE-AUTHENTICATION-001' });

  await assertAssertionRejected(authenticator, response, { expectedChallenge: 'TEST-STALE-CHALLENGE' });
  await assertAssertionRejected(authenticator, response, { expectedChallenge: 'TEST-OTHER-ACTION-CHALLENGE' });
});

test('P1B CRYPTO / WA-03: malicious origin is denied even with a valid signature', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const response = makeAuthenticationResponse(authenticator, {
    challenge: 'TEST-CHALLENGE-AUTHENTICATION-001',
    origin: 'https://attacker.example.test',
  });

  await assertAssertionRejected(authenticator, response);
});

test('P1B CRYPTO / WA-03: an authenticator signing the wrong RP ID hash is denied', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const response = makeAuthenticationResponse(authenticator, {
    challenge: 'TEST-CHALLENGE-AUTHENTICATION-001',
    rpId: 'attacker.example.test',
  });

  await assertAssertionRejected(authenticator, response);
});

test('P1B CRYPTO / WA-03: user presence and verification flags are independently required', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const noPresence = makeAuthenticationResponse(authenticator, {
    challenge: 'TEST-CHALLENGE-AUTHENTICATION-001',
    flags: 0x04,
  });
  const noVerification = makeAuthenticationResponse(authenticator, {
    challenge: 'TEST-CHALLENGE-AUTHENTICATION-001',
    flags: 0x01,
  });

  await assertAssertionRejected(authenticator, noPresence);
  await assertAssertionRejected(authenticator, noVerification);
});

test('P1B CRYPTO / WA-03: a response with the wrong WebAuthn type is denied', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const response = makeAuthenticationResponse(authenticator, {
    challenge: 'TEST-CHALLENGE-AUTHENTICATION-001',
    type: 'webauthn.create',
  });

  await assertAssertionRejected(authenticator, response);
});

test('P1B CRYPTO / WA-03: credential ID substitution and non-base64url credential IDs are denied', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const credential = await verifiedCredential(authenticator);
  const substituted = makeAuthenticationResponse(authenticator, {
    challenge: 'TEST-CHALLENGE-AUTHENTICATION-001',
    credentialId: 'TEST-ALIEN-CREDENTIAL',
  });
  const malformed = makeAuthenticationResponse(authenticator, { challenge: 'TEST-CHALLENGE-AUTHENTICATION-001' });
  malformed.rawId = 'not base64 url!';
  malformed.id = 'TEST-CREDENTIAL';

  await assertAssertionRejected(authenticator, substituted, { credential });
  await assertAssertionRejected(authenticator, malformed, { credential });
});

test('P1B CRYPTO / WA-04: registration rejects a stale challenge and malicious origin', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');

  await assert.rejects(register(authenticator, { challenge: 'TEST-STALE-REGISTRATION-CHALLENGE' }));
  await assert.rejects(register(authenticator, { origin: 'https://attacker.example.test' }));
});

test('P1B CRYPTO / WA-04: registration rejects wrong RP hash, missing UP, and missing UV', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');

  await assert.rejects(register(authenticator, { rpId: 'attacker.example.test' }));
  await assert.rejects(register(authenticator, { flags: 0x44 }));
  await assert.rejects(register(authenticator, { flags: 0x41 }));
});

test('P1B CRYPTO / WA-04: registration rejects wrong response type and unsupported COSE algorithm', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const wrongType = makeRegistrationResponse(authenticator, { challenge: acceptedRegistration.expectedChallenge });
  wrongType.type = 'webauthn.get';

  await assert.rejects(register(authenticator, {}, wrongType));
  await assert.rejects(register(authenticator, { algorithm: -999 }));
});

test('P1B CRYPTO / WA-04: malformed JSON and CBOR are rejected before credential acceptance', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const malformedJson = makeRegistrationResponse(authenticator, { challenge: acceptedRegistration.expectedChallenge });
  malformedJson.response.clientDataJSON = Buffer.from('{').toString('base64url');
  const malformedCbor = makeRegistrationResponse(authenticator, { challenge: acceptedRegistration.expectedChallenge });
  malformedCbor.response.attestationObject = Buffer.from([0xff, 0x00, 0x80]).toString('base64url');

  await assert.rejects(register(authenticator, {}, malformedJson));
  await assert.rejects(register(authenticator, {}, malformedCbor));
});

test('P1B CRYPTO / WA-04: malformed COSE public key is rejected', async () => {
  const authenticator = makeSyntheticAuthenticator('primary');
  const response = makeRegistrationResponse(authenticator, { challenge: acceptedRegistration.expectedChallenge });
  const authData = Buffer.alloc(37);
  createHash('sha256').update(SYNTHETIC_RP_ID).digest().copy(authData, 0);
  authData[32] = 0x45;
  authData.writeUInt32BE(0, 33);
  const credentialId = Buffer.from(authenticator.credentialId);
  const credentialLength = Buffer.from([credentialId.length >> 8, credentialId.length & 0xff]);
  const malformedCose = Buffer.from([0xff]);
  const completeAuthData = Buffer.concat([authData, Buffer.alloc(16), credentialLength, credentialId, malformedCose]);
  response.response.attestationObject = encodeSyntheticCbor({
    fmt: 'none',
    attStmt: new Map(),
    authData: completeAuthData,
  }).toString('base64url');

  await assert.rejects(register(authenticator, {}, response));
});

test('P1B HARNESS / WA-04: oversize response payload is rejected by the local test boundary', () => {
  assert.equal(assertWebAuthnPayloadBudget('x'.repeat(MAX_WEBAUTHN_PAYLOAD_BYTES)), true);
  assert.throws(() => assertWebAuthnPayloadBudget('x'.repeat(MAX_WEBAUTHN_PAYLOAD_BYTES + 1)), /limit/i);
  assert.throws(() => assertWebAuthnPayloadBudget(Buffer.from('not text')), /string/i);
  assert.throws(() => assertWebAuthnPayloadBudget('x', 0), /positive/i);
});
