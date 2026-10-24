// CB-M05-P1-OWNER-ACCESS-001: contract-first RED. LOCAL synthetic proof only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizeLocalRead } from '../../../src/modules/CB-M05/p1-owner/access-policy.mjs';
import { renderOwnerReadOnly } from '../../../src/modules/CB-M05/p1-owner/readonly-view.mjs';
import { createLocalSession, verifyLocalPasskey, revokeLocalSession } from '../../../src/modules/CB-M05/p1-owner/passkey-session.mjs';
import { makeSyntheticAuthenticator, makeAuthenticationResponse, makeRegistrationResponse, SYNTHETIC_ORIGIN, SYNTHETIC_RP_ID } from '../../../src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

const secret = '11'.repeat(32);
function req(cookie = '', extras = {}) {
  return new Request(SYNTHETIC_ORIGIN + '/local/owner-readonly', {
    method:'GET',headers:{'sec-fetch-site':'same-origin',...(cookie?{cookie}:{}),...extras},
  });
}
function fakeDb(record=null, onRead=()=>{}) {
  return {prepare(sql) { onRead(sql);return {bind() { return {async first() {return record}, async run(){return {success:true}}};}};}};
}
test('P1 OWNER POLICY: anonymous, forged role, wrong origin and missing D1 fail closed without private DB reads', async()=>{
  let reads=0; const db=fakeDb(null,()=>{reads++});
  for(const bad of [req(),req('',{'x-owner-role':'owner'}),new Request('https://evil.example.test/local/owner-readonly',{headers:{'sec-fetch-site':'same-origin'}}),req('',{'sec-fetch-site':'cross-site'})]){
    const r=await authorizeLocalRead({request:bad,db,secret,nowSeconds:20000});
    assert.equal(r.allowed,false);
  }
  assert.equal(reads,0);
  assert.equal((await authorizeLocalRead({request:req(''),db:null,secret,nowSeconds:20000})).allowed,false);
});
test('P1 OWNER POLICY: malformed, duplicated and forged cookies fail closed',async()=>{
  let queried=0;const db=fakeDb(null,()=>{queried++});
  for(const c of ['__Host-cb_p1_owner=x','__Host-cb_p1_owner='+ 'aa'.repeat(32)+'; __Host-cb_p1_owner='+ 'bb'.repeat(32),'__Host-cb_p1_owner='+ 'aa'.repeat(32)]){
    assert.equal((await authorizeLocalRead({request:req(c),db,secret,nowSeconds:20000})).allowed,false);
  }
  assert.ok(queried<=1,'invalid cookies never create more than one lookup');
});
test('P1 READONLY: no auth yields 401, authorized view discloses no secrets and cannot publish',async()=>{
  assert.equal((await renderOwnerReadOnly({authorized:false})).status,401);
  const r=await renderOwnerReadOnly({authorized:true,ownerId:1});
  assert.equal(r.status,200);
  assert.match(r.headers.get('cache-control')||'',/no-store/);
  const text=await r.text();assert.match(text,/LOCAL/i);assert.doesNotMatch(text,/privateKey|CMS_TEST_HMAC_KEY|secret|published.*true/i);
});
test('P1 WEBAUTHN: reuse pinned verifier on disposable ES256, reject origin/RPID tampering',async()=>{
  const key=makeSyntheticAuthenticator('P1-owner');
  const challenge='TEST-P1-REGISTRATION-LOCAL';
  const registration=await verifyRegistrationResponse({response:makeRegistrationResponse(key,{challenge}),expectedChallenge:challenge,expectedOrigin:SYNTHETIC_ORIGIN,expectedRPID:SYNTHETIC_RP_ID,requireUserPresence:true,requireUserVerification:true});
  assert.equal(registration.verified,true);
  const assertion=makeAuthenticationResponse(key,{challenge:'TEST-P1-LOGIN-LOCAL'});
  const ok=await verifyLocalPasskey({response:assertion,credential:registration.registrationInfo.credential,expectedChallenge:'TEST-P1-LOGIN-LOCAL',origin:SYNTHETIC_ORIGIN,rpId:SYNTHETIC_RP_ID});
  assert.equal(ok,true);
  const wrong=await verifyLocalPasskey({response:assertion,credential:registration.registrationInfo.credential,expectedChallenge:'TEST-P1-LOGIN-LOCAL',origin:'https://evil.example.test',rpId:SYNTHETIC_RP_ID});
  assert.equal(wrong,false);
});
test('P1 SESSIONS: no verified assertion, DB or valid secret never creates a session',async()=>{
  for(const opts of [{db:null,verified:true},{db:fakeDb(),verified:false},{db:fakeDb(),verified:true,secret:'bad'}]){
    await assert.rejects(createLocalSession({secret,nowSeconds:20000,credentialId:'test-id',...opts}));
  }
  assert.equal(typeof revokeLocalSession,'function');
});
