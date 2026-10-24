// CB-M05-P1-OWNER-ACCESS-001: local-only WebAuthn passkey and revocable session adapter.
// No endpoint, public admin route, real identity, Cloudflare secrets or remote D1.
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { digestLocalSession } from './access-policy.mjs';
const ORIGIN='https://owner.example.test';
const RPID='owner.example.test';
const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const validCredential=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{12,512}$/.test(x);
async function digest(x) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x));
  return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verifyLocalPasskey({response,credential,expectedChallenge,origin,rpId}={}) {
  if(!response||!credential||!expectedChallenge||
    origin!==ORIGIN||rpId!==RPID) return false;
  try{
    const result=await verifyAuthenticationResponse({
      response,credential,expectedChallenge,expectedOrigin:ORIGIN,expectedRPID:RPID,
      requireUserPresence:true,requireUserVerification:true,
    });
    return result.verified===true;
  }catch{return false;}
}
function token() {
  const buf=new Uint8Array(32);crypto.getRandomValues(buf);
  return Array.from(buf,x=>x.toString(16).padStart(2,'0')).join('');
}
export async function createLocalSession({
  db,secret,nowSeconds,credentialId,credential,expectedChallenge,response,
  origin=ORIGIN,rpId=RPID,
}={}) {
  if(!db||typeof db.batch!=='function'||!hex64(secret)||!integer(nowSeconds)||
    !validCredential(credentialId)||credential?.id!==credentialId||
    typeof expectedChallenge!=='string'||expectedChallenge.length<16||expectedChallenge.length>256||
    !response)throw new TypeError('Synthetic signed WebAuthn proof required');
  if(!await verifyLocalPasskey({response,credential,expectedChallenge,origin,rpId})){
    throw new Error('WebAuthn proof rejected');
  }
  const raw=token(),sessionDigest=await digestLocalSession(secret,raw),challengeDigest=await digest(expectedChallenge);
  try{
    await db.batch([
      db.prepare(
        'UPDATE p1_challenge SET consumed_at=? WHERE digest=? AND credential_id=? AND origin=? AND rp_id=? AND purpose=? AND consumed_at IS NULL AND expires_at>?'
      ).bind(nowSeconds,challengeDigest,credentialId,ORIGIN,RPID,'login',nowSeconds),
      db.prepare(
        'INSERT INTO p1_session(digest,owner_id,credential_id,challenge_digest,issued_at,last_seen_at,expires_at,revoked_at) SELECT ?,1,c.credential_id,ch.digest,?,?,?,NULL FROM p1_challenge ch JOIN p1_credentials c ON c.credential_id=ch.credential_id JOIN p1_owner o ON o.owner_id=1 WHERE ch.digest=? AND ch.credential_id=? AND ch.consumed_at=? AND ch.expires_at>? AND c.revoked_at IS NULL'
      ).bind(sessionDigest,nowSeconds,nowSeconds,nowSeconds+43200,challengeDigest,credentialId,nowSeconds,nowSeconds),
    ]);
    const found=await db.prepare('SELECT digest FROM p1_session WHERE digest=? AND challenge_digest=? AND revoked_at IS NULL').bind(sessionDigest,challengeDigest).first();
    if(!found)throw new Error('No consumed valid synthetic challenge');
    return Object.freeze({
      cookie:'__Host-cb_p1_owner='+raw+'; Path=/; Secure; HttpOnly; SameSite=Strict',
      token:raw,expiresAt:nowSeconds+43200,ownerId:1,
    });
  }catch{throw new Error('Synthetic session persistence rejected');}
}
export async function revokeLocalSession({db,secret,rawToken,nowSeconds}={}) {
  if(!db||!hex64(secret)||!hex64(rawToken)||!integer(nowSeconds))return false;
  try{
    const sessionDigest=await digestLocalSession(secret,rawToken);
    const change=await db.prepare('UPDATE p1_session SET revoked_at=? WHERE digest=? AND revoked_at IS NULL').bind(nowSeconds,sessionDigest).run();
    return change?.success===true&&change?.meta?.changes===1;
  }catch{return false;}
}
