// CB-M05-P1-OWNER-ACCESS-001: LOCAL-only WebAuthn and revocable session adapter.
// Not exposed by /admin or by any public route. All credentials are synthetic.
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { digestLocalSession } from './access-policy.mjs';
const ORIGIN='https://owner.example.test';
const RPID='owner.example.test';
const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const validCredential=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{12,512}$/.test(x);
async function digest(text) {
  const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');
}
async function validatedAssertion({response,credential,expectedChallenge,origin,rpId}) {
  if(!response||!credential||!expectedChallenge||origin!==ORIGIN||rpId!==RPID)return null;
  try{
    const result=await verifyAuthenticationResponse({
      response,credential,expectedChallenge,expectedOrigin:ORIGIN,expectedRPID:RPID,
      requireUserPresence:true,requireUserVerification:true,
    });
    return result.verified===true?result:null;
  }catch{return null;}
}
// Diagnostic verifier reused by the LOCAL tests. This function is not a session authority.
export async function verifyLocalPasskey(input={}) {
  return (await validatedAssertion(input))!==null;
}
function token() {
  const buf=new Uint8Array(32);crypto.getRandomValues(buf);
  return Array.from(buf,x=>x.toString(16).padStart(2,'0')).join('');
}
function blob(value) {
  if(value instanceof Uint8Array)return value;
  if(value instanceof ArrayBuffer||Array.isArray(value))return new Uint8Array(value);
  return null;
}
export async function createLocalSession({
  db,secret,nowSeconds,credentialId,expectedChallenge,response,
  origin=ORIGIN,rpId=RPID,
}={}) {
  if(!db||typeof db.batch!=='function'||!hex64(secret)||!integer(nowSeconds)||
    !validCredential(credentialId)||typeof expectedChallenge!=='string'||
    expectedChallenge.length<16||expectedChallenge.length>256||!response){
    throw new TypeError('Synthetic signed WebAuthn proof required');
  }
  // IMPORTANT: never trust a public key/counter supplied by a request or caller.
  const stored=await db.prepare('SELECT credential_id,public_key,sign_count FROM p1_credentials WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL').bind(credentialId).first();
  const publicKey=blob(stored?.public_key);
  if(!publicKey||!Number.isSafeInteger(stored?.sign_count)||stored.sign_count<0){
    throw new Error('Registered LOCAL credential required');
  }
  const verification=await validatedAssertion({
    response,expectedChallenge,origin,rpId,
    credential:{id:stored.credential_id,publicKey,counter:stored.sign_count},
  });
  if(!verification)throw new Error('WebAuthn proof rejected');
  const newCounter=verification.authenticationInfo?.newCounter;
  if(!Number.isSafeInteger(newCounter)||newCounter<0||newCounter>4294967295){
    throw new Error('Invalid authenticator counter');
  }
  const raw=token(),sessionDigest=await digestLocalSession(secret,raw),challengeDigest=await digest(expectedChallenge);
  try{
    const transaction=await db.batch([
      db.prepare(
        'UPDATE p1_challenge SET consumed_at=? WHERE digest=? AND credential_id=? AND origin=? AND rp_id=? AND purpose=? AND consumed_at IS NULL AND expires_at>?'
      ).bind(nowSeconds,challengeDigest,credentialId,ORIGIN,RPID,'login',nowSeconds),
      db.prepare(
        'UPDATE p1_credentials SET sign_count=? WHERE credential_id=? AND sign_count=? AND revoked_at IS NULL AND changes()=1'
      ).bind(newCounter,credentialId,stored.sign_count),
      db.prepare(
        'INSERT INTO p1_session(digest,owner_id,credential_id,challenge_digest,issued_at,last_seen_at,expires_at,revoked_at) SELECT ?,1,c.credential_id,ch.digest,?,?,?,NULL FROM p1_challenge ch JOIN p1_credentials c ON c.credential_id=ch.credential_id JOIN p1_owner o ON o.owner_id=1 WHERE ch.digest=? AND ch.credential_id=? AND ch.consumed_at=? AND ch.expires_at>? AND c.sign_count=? AND c.revoked_at IS NULL AND changes()=1'
      ).bind(sessionDigest,nowSeconds,nowSeconds,nowSeconds+43200,challengeDigest,credentialId,nowSeconds,nowSeconds,newCounter),
      // Rotate all earlier LOCAL Owner sessions only after this signed login inserts its session.
      // A failed CAS or challenge consumption cannot revoke an unrelated valid session.
      db.prepare(
        'UPDATE p1_session SET revoked_at=? WHERE owner_id=1 AND digest<>? AND revoked_at IS NULL AND EXISTS (SELECT 1 FROM p1_session active WHERE active.digest=? AND active.owner_id=1 AND active.revoked_at IS NULL)'
      ).bind(nowSeconds,sessionDigest,sessionDigest),
    ]);
    // D1.batch is transactional; zero-row conditional steps must never grant a session.
    if(transaction?.slice(0,3).length!==3||transaction.slice(0,3).some(x=>x?.success!==true||x?.meta?.changes!==1)||
      transaction[3]?.success!==true)throw new Error('Counter or challenge CAS rejected');
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
    const sd=await digestLocalSession(secret,rawToken);
    const change=await db.prepare('UPDATE p1_session SET revoked_at=? WHERE digest=? AND revoked_at IS NULL').bind(nowSeconds,sd).run();
    return change?.success===true&&change?.meta?.changes===1;
  }catch{return false;}
}
