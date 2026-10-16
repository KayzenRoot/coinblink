// Synthetic WebAuthn protocol fixtures for local tests only. Never import from application code.
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

export const SYNTHETIC_ORIGIN = 'https://owner.example.test';
export const SYNTHETIC_RP_ID = 'owner.example.test';
export const SYNTHETIC_RP_NAME = 'CoinBlink local test';
export const MAX_WEBAUTHN_PAYLOAD_BYTES = 64 * 1024;

function cborHead(major, value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('CBOR length/value must be a non-negative safe integer');
  if (value < 24) return Buffer.from([(major << 5) | value]);
  if (value <= 0xff) return Buffer.from([(major << 5) | 24, value]);
  if (value <= 0xffff) {
    const out = Buffer.alloc(3);
    out[0] = (major << 5) | 25;
    out.writeUInt16BE(value, 1);
    return out;
  }
  if (value <= 0xffffffff) {
    const out = Buffer.alloc(5);
    out[0] = (major << 5) | 26;
    out.writeUInt32BE(value, 1);
    return out;
  }
  throw new RangeError('CBOR integer exceeds fixture encoder limit');
}

export function encodeSyntheticCbor(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    const bytes = Buffer.from(value);
    return Buffer.concat([cborHead(2, bytes.length), bytes]);
  }
  if (typeof value === 'string') {
    const bytes = Buffer.from(value, 'utf8');
    return Buffer.concat([cborHead(3, bytes.length), bytes]);
  }
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return value >= 0 ? cborHead(0, value) : cborHead(1, -1 - value);
  }
  if (Array.isArray(value)) {
    return Buffer.concat([cborHead(4, value.length), ...value.map(encodeSyntheticCbor)]);
  }
  if (value && typeof value === 'object') {
    const entries = value instanceof Map ? [...value.entries()] : Object.entries(value);
    return Buffer.concat([
      cborHead(5, entries.length),
      ...entries.flatMap(([key, item]) => [encodeSyntheticCbor(typeof key === 'string' && /^-?\d+$/.test(key) ? Number(key) : key), encodeSyntheticCbor(item)]),
    ]);
  }
  if (value === null) return Buffer.from([0xf6]);
  throw new TypeError('Unsupported synthetic CBOR fixture value');
}

function cborIntMap(entries) {
  return Buffer.concat([
    cborHead(5, entries.length),
    ...entries.flatMap(([key, value]) => [encodeSyntheticCbor(key), encodeSyntheticCbor(value)]),
  ]);
}

function makeCosePublicKey(publicKey, algorithm = -7) {
  const jwk = publicKey.export({ format: 'jwk' });
  if (!jwk.x || !jwk.y) throw new Error('Synthetic P-256 key did not export EC coordinates');
  return cborIntMap([
    [1, 2],
    [3, algorithm],
    [-1, 1],
    [-2, Buffer.from(jwk.x, 'base64url')],
    [-3, Buffer.from(jwk.y, 'base64url')],
  ]);
}

function encodeClientData({ type, challenge, origin, crossOrigin = false, extra = {} }) {
  return Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin, ...extra }), 'utf8');
}

function authenticatorData({ rpId, flags, counter, trailing = Buffer.alloc(0) }) {
  const out = Buffer.alloc(37 + trailing.length);
  createHash('sha256').update(rpId).digest().copy(out, 0);
  out[32] = flags;
  out.writeUInt32BE(counter, 33);
  Buffer.from(trailing).copy(out, 37);
  return out;
}

export function makeSyntheticAuthenticator(label = 'A') {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const credentialId = randomBytes(32);
  return Object.freeze({
    label,
    id: credentialId.toString('base64url'),
    credentialId,
    privateKey,
    publicKey,
    cosePublicKey: makeCosePublicKey(publicKey),
  });
}

export function makeRegistrationResponse(authenticator, {
  challenge = randomBytes(32).toString('base64url'),
  origin = SYNTHETIC_ORIGIN,
  rpId = SYNTHETIC_RP_ID,
  flags = 0x45,
  algorithm = -7,
  cosePublicKeyOverride = undefined,
  attestation = 'none',
} = {}) {
  const clientDataJSON = encodeClientData({ type: 'webauthn.create', challenge, origin });
  const credentialId = Buffer.from(authenticator.credentialId);
  const cosePublicKey = cosePublicKeyOverride === undefined
    ? makeCosePublicKey(authenticator.publicKey, algorithm)
    : Buffer.from(cosePublicKeyOverride);
  const rpAndFlags = authenticatorData({ rpId, flags, counter: 0 });
  const registrationAuthData = Buffer.concat([
    rpAndFlags,
    Buffer.alloc(16),
    Buffer.from([credentialId.length >> 8, credentialId.length & 0xff]),
    credentialId,
    cosePublicKey,
  ]);
  const attestationObject = encodeSyntheticCbor({
    fmt: attestation,
    attStmt: new Map(),
    authData: registrationAuthData,
  });
  return {
    id: authenticator.id,
    rawId: authenticator.id,
    type: 'public-key',
    response: {
      clientDataJSON: clientDataJSON.toString('base64url'),
      attestationObject: attestationObject.toString('base64url'),
      transports: ['internal'],
    },
    clientExtensionResults: {},
    authenticatorAttachment: 'platform',
  };
}

export function makeAuthenticationResponse(authenticator, {
  challenge = randomBytes(32).toString('base64url'),
  origin = SYNTHETIC_ORIGIN,
  rpId = SYNTHETIC_RP_ID,
  flags = 0x05,
  counter = 0,
  type = 'webauthn.get',
  credentialId = authenticator.id,
  signer = authenticator.privateKey,
  extraClientData = {},
} = {}) {
  const clientDataJSON = encodeClientData({ type, challenge, origin, extra: extraClientData });
  const authData = authenticatorData({ rpId, flags, counter });
  const clientDataHash = createHash('sha256').update(clientDataJSON).digest();
  const signature = sign('sha256', Buffer.concat([authData, clientDataHash]), signer);
  const rawId = credentialId;
  return {
    id: rawId,
    rawId,
    type: 'public-key',
    response: {
      clientDataJSON: clientDataJSON.toString('base64url'),
      authenticatorData: authData.toString('base64url'),
      signature: signature.toString('base64url'),
      userHandle: null,
    },
    clientExtensionResults: {},
    authenticatorAttachment: 'platform',
  };
}

export function tamperBase64Url(value, mutate) {
  const bytes = Buffer.from(value, 'base64url');
  const changed = Buffer.from(mutate(bytes));
  return changed.toString('base64url');
}

export function assertWebAuthnPayloadBudget(value, maxBytes = MAX_WEBAUTHN_PAYLOAD_BYTES) {
  if (typeof value !== 'string') throw new TypeError('WebAuthn synthetic payload must be a string');
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new RangeError('WebAuthn payload limit must be a positive integer');
  if (Buffer.byteLength(value, 'utf8') > maxBytes) throw new RangeError('WebAuthn synthetic payload exceeds the local test limit');
  return true;
}

export function verifyBoundSyntheticAuthentication(options) {
  const { response, credential } = options ?? {};
  if (!response || !credential || typeof credential.id !== 'string') {
    throw new Error('Synthetic authentication requires a response and a bound credential record');
  }
  if (response.id !== credential.id || response.rawId !== credential.id) {
    throw new Error('Authentication credential ID is not bound to the selected Owner credential');
  }
  return verifyAuthenticationResponse(options);
}
