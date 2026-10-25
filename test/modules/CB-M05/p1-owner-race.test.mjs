// CB-M05-P1-OWNER-ACCESS-001: Workerd/D1 singleton proof, no remote bindings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { createLocalSession, revokeLocalSession } from '../../../src/modules/CB-M05/p1-owner/passkey-session.mjs';
import { authorizeLocalRead, digestLocalSession } from '../../../src/modules/CB-M05/p1-owner/access-policy.mjs';
import { makeSyntheticAuthenticator, makeRegistrationResponse, makeAuthenticationResponse, SYNTHETIC_ORIGIN, SYNTHETIC_RP_ID } from '../../../src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { Miniflare, convertV4MiniflareOptions, NoOpLog } from 'miniflare';
import { readFileSync } from 'node:fs';
import { claimOwnerOnce, mintLocalTicket } from '../../../src/modules/CB-M05/p1-owner/claim-guard.mjs';

const schema=readFileSync(new URL('./p1-owner-fixtures/schema.sql',import.meta.url),'utf8');
async function isolated() {
  const mf=new Miniflare(convertV4MiniflareOptions({
    name:'cb-m05-p1-owner-'+randomUUID(),
    script:'export default {fetch(){return new Response("LOCAL ONLY",{status:403})}}',
    modules:true,compatibilityDate:'2026-10-13',
    d1Databases:{CMS_D1_LOCAL:'00000000-0000-4000-8000-000000000091'},
    log:new NoOpLog(),
  }));
  try {
    const db=await mf.getD1Database('CMS_D1_LOCAL');
    for(const stmt of schema.split(';').map(s=>s.trim()).filter(Boolean)) await db.prepare(stmt).run();
    return {mf,db};
  }catch(e){await mf.dispose();throw e;}
}
test('P1 SINGLETON: 2/10 contenders admit at most one owner with ticket consumption atomic', {timeout:120000},async()=>{
  for(const n of [2,10]){
    const {mf,db}=await isolated();
    try{
      const nowSeconds=20000;const tokens=Array.from({length:n},()=>randomBytes(32).toString('hex'));
      await Promise.all(tokens.map(token=>mintLocalTicket({db,token,nowSeconds,ttlSeconds:900})));
      const results=await Promise.all(tokens.map((token,i)=>claimOwnerOnce({db,token,nowSeconds,origin:'https://owner.example.test',expectedOrigin:'https://owner.example.test',marker:'m'+i})));
      assert.equal(results.filter(x=>x===true).length,1);
      assert.equal((await db.prepare('SELECT count(*) n FROM p1_owner').first()).n,1);
      assert.equal((await db.prepare('SELECT count(*) n FROM p1_ticket WHERE consumed_at IS NOT NULL').first()).n,1);
    }finally{await mf.dispose();}
  }
});
test('P1 SINGLETON: forged ticket, wrong origin, expired ticket and D1 errors always deny', {timeout:120000},async()=>{
  const {mf,db}=await isolated();
  try{
    assert.equal(await claimOwnerOnce({db,token:'aa'.repeat(32),nowSeconds:20000,origin:'https://evil.example.test',expectedOrigin:'https://owner.example.test',marker:'bad'}),false);
    const token=randomBytes(32).toString('hex');
    await mintLocalTicket({db,token,nowSeconds:20000,ttlSeconds:1});
    assert.equal(await claimOwnerOnce({db,token,nowSeconds:20002,origin:'https://owner.example.test',expectedOrigin:'https://owner.example.test',marker:'late'}),false);
    assert.equal((await db.prepare('SELECT count(*) n FROM p1_owner').first()).n,0);
    assert.equal(await claimOwnerOnce({db:null,token,nowSeconds:20000,origin:'https://owner.example.test',expectedOrigin:'https://owner.example.test',marker:'none'}),false);
  }finally{await mf.dispose();}
});

test('P1 SESSION: D1-registered public key, signed challenge, cookie, idle/absolute TTL, replay and logout', {timeout:120000},async()=>{
  const {mf,db}=await isolated();
  const secret='11'.repeat(32),nowSeconds=20000;
  try{
    const ticket=randomBytes(32).toString('hex');
    await mintLocalTicket({db,token:ticket,nowSeconds,ttlSeconds:900});
    assert.equal(await claimOwnerOnce({db,token:ticket,nowSeconds,origin:SYNTHETIC_ORIGIN,expectedOrigin:SYNTHETIC_ORIGIN,marker:'session-claim'}),true);
    const auth=makeSyntheticAuthenticator('session-primary');
    const regChallenge='TEST-P1-REGISTRATION-LOCAL-001';
    const registered=await verifyRegistrationResponse({
      response:makeRegistrationResponse(auth,{challenge:regChallenge}),
      expectedChallenge:regChallenge,expectedOrigin:SYNTHETIC_ORIGIN,expectedRPID:SYNTHETIC_RP_ID,
      requireUserPresence:true,requireUserVerification:true,
    });
    assert.equal(registered.verified,true);
    const publicKey=registered.registrationInfo.credential.publicKey;
    await db.prepare('INSERT INTO p1_credentials(credential_id,owner_id,public_key,sign_count) VALUES (?,1,?,0)')
      .bind(auth.id,publicKey).run();
    const challenge='TEST-P1-LOGIN-CHALLENGE-LOCAL-001';
    const challengeDigest=createHash('sha256').update(challenge).digest('hex');
    await db.prepare('INSERT INTO p1_challenge(digest,credential_id,purpose,origin,rp_id,expires_at) VALUES (?,?,?,?,?,?)')
      .bind(challengeDigest,auth.id,'login',SYNTHETIC_ORIGIN,SYNTHETIC_RP_ID,nowSeconds+90).run();
    const response=makeAuthenticationResponse(auth,{challenge});
    const intruder=makeSyntheticAuthenticator('different-credential');
    const intruderReg=await verifyRegistrationResponse({
      response:makeRegistrationResponse(intruder,{challenge:regChallenge}),
      expectedChallenge:regChallenge,expectedOrigin:SYNTHETIC_ORIGIN,expectedRPID:SYNTHETIC_RP_ID,
      requireUserPresence:true,requireUserVerification:true,
    });
    await db.prepare('UPDATE p1_credentials SET public_key=? WHERE credential_id=?')
      .bind(intruderReg.registrationInfo.credential.publicKey,auth.id).run();
    await assert.rejects(createLocalSession({db,secret,nowSeconds,credentialId:auth.id,expectedChallenge:challenge,response}),
      /rejected/,'the caller cannot authenticate against an unregistered/supplied key');
    assert.equal((await db.prepare('SELECT consumed_at FROM p1_challenge WHERE digest=?').bind(challengeDigest).first()).consumed_at,null);
    await db.prepare('UPDATE p1_credentials SET public_key=? WHERE credential_id=?').bind(publicKey,auth.id).run();
    const issued=await createLocalSession({db,secret,nowSeconds,credentialId:auth.id,expectedChallenge:challenge,response});
    assert.match(issued.cookie,/__Host-cb_p1_owner=[a-f0-9]{64}; Path=\/; Secure; HttpOnly; SameSite=Strict/);
    const req=new Request(SYNTHETIC_ORIGIN+'/local/owner-readonly',{
      headers:{'sec-fetch-site':'same-origin',cookie:issued.cookie.split(';')[0]},
    });
    assert.equal((await authorizeLocalRead({request:req,db,secret,nowSeconds:nowSeconds+10})).allowed,true);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM p1_session').first()).n,1);
    await assert.rejects(createLocalSession({db,secret,nowSeconds:nowSeconds+20,credentialId:auth.id,expectedChallenge:challenge,response}));
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM p1_session').first()).n,1);
    assert.equal((await authorizeLocalRead({request:req,db,secret,nowSeconds:nowSeconds+1811})).allowed,false,'idle >30min denies');
    await db.prepare('UPDATE p1_session SET last_seen_at=?,issued_at=?').bind(nowSeconds+1820,nowSeconds-43200).run();
    assert.equal((await authorizeLocalRead({request:req,db,secret,nowSeconds:nowSeconds+1821})).allowed,false,'absolute >12h denies');
    await db.prepare('UPDATE p1_session SET last_seen_at=?,issued_at=?').bind(nowSeconds+20,nowSeconds).run();
    assert.equal(await revokeLocalSession({db,secret,rawToken:issued.token,nowSeconds:nowSeconds+30}),true);
    assert.equal((await authorizeLocalRead({request:req,db,secret,nowSeconds:nowSeconds+30})).allowed,false);
  }finally{await mf.dispose();}
});


test('P1 BOOT SECURITY: consumed ticket and identical marker cannot claim twice in same second', {timeout:120000},async()=>{
  const {mf,db}=await isolated();
  try{
    const token=randomBytes(32).toString('hex'),nowSeconds=20000;
    await mintLocalTicket({db,token,nowSeconds});
    const claim={db,token,nowSeconds,origin:SYNTHETIC_ORIGIN,expectedOrigin:SYNTHETIC_ORIGIN,marker:'exact-replay'};
    assert.equal(await claimOwnerOnce(claim),true,'first legitimate claim succeeds');
    assert.equal(await claimOwnerOnce(claim),false,'same-second replay must be denied, even with identical marker');
    const freshToken=randomBytes(32).toString('hex');
    await mintLocalTicket({db,token:freshToken,nowSeconds});
    assert.equal(await claimOwnerOnce({...claim,token:freshToken}),false,'an existing Owner marker cannot consume a fresh ticket');
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM p1_owner').first()).n,1);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM p1_ticket WHERE consumed_at IS NOT NULL').first()).n,1);
  }finally{await mf.dispose();}
});

test('P1 SESSION SECURITY: credential revocation between SELECT and UPDATE must deny', {timeout:120000},async()=>{
  const {mf,db}=await isolated();
  const secret='11'.repeat(32),rawToken='ab'.repeat(32),nowSeconds=20000;
  const credentialId='synthetic-revocation-race';
  try{
    const digest=await digestLocalSession(secret,rawToken);
    await db.prepare('INSERT INTO p1_owner (owner_id,claim_marker,created_at) VALUES (1,?,?)').bind('race-owner',19000).run();
    await db.prepare('INSERT INTO p1_credentials (credential_id,owner_id,public_key,sign_count) VALUES (?,1,?,0)').bind(credentialId,new Uint8Array([1,2,3])).run();
    await db.prepare('INSERT INTO p1_session (digest,owner_id,credential_id,challenge_digest,issued_at,last_seen_at,expires_at,revoked_at) VALUES (?,1,?,?,?,?,?,NULL)')
      .bind(digest,credentialId,'cd'.repeat(32),19000,19990,30000).run();
    let revoked=0;
    const racedDb={prepare(sql){
      if(!sql.startsWith('SELECT s.owner_id'))return db.prepare(sql);
      return {bind(...params){return {async first(){
        const row=await db.prepare(sql).bind(...params).first();
        assert.equal(row?.owner_id,1,'session initially valid; inject revocation after SELECT');
        const changed=await db.prepare('UPDATE p1_credentials SET revoked_at=? WHERE credential_id=? AND revoked_at IS NULL')
          .bind(nowSeconds-1,credentialId).run();
        assert.equal(changed.meta.changes,1);
        revoked++;
        return row;
      }};}};
    }};
    const request=new Request(SYNTHETIC_ORIGIN+'/local/owner-readonly',{
      headers:{'sec-fetch-site':'same-origin',cookie:'__Host-cb_p1_owner='+rawToken},
    });
    const result=await authorizeLocalRead({request,db:racedDb,secret,nowSeconds});
    assert.equal(revoked,1);
    assert.equal(result.allowed,false,'a revoked credential cannot renew and authorize an Owner read');
    assert.equal(result.status,401);
    assert.equal((await db.prepare('SELECT last_seen_at FROM p1_session WHERE digest=?').bind(digest).first()).last_seen_at,19990,
      'revocation must also prevent renewal of session activity');
  }finally{await mf.dispose();}
});


/** New correction-delta tests: all WebAuthn credentials and D1 data are disposable. */
async function seededLoginFixture(db,{nowSeconds=20000}={}){
  const authenticator=makeSyntheticAuthenticator('owner-counter-cas-local');
  const registrationChallenge='TEST-P1-COUNTER-REG-LOCAL-002';
  const verified=await verifyRegistrationResponse({
    response:makeRegistrationResponse(authenticator,{challenge:registrationChallenge}),
    expectedChallenge:registrationChallenge,expectedOrigin:SYNTHETIC_ORIGIN,expectedRPID:SYNTHETIC_RP_ID,
    requireUserPresence:true,requireUserVerification:true,
  });
  assert.equal(verified.verified,true);
  await db.prepare('INSERT INTO p1_owner(owner_id,claim_marker,created_at) VALUES (1,?,?)').bind('cas-fixture',nowSeconds-10).run();
  await db.prepare('INSERT INTO p1_credentials(credential_id,owner_id,public_key,sign_count) VALUES (?,1,?,1)')
    .bind(authenticator.id,verified.registrationInfo.credential.publicKey).run();
  const challenge=async(tag)=>{
    const value='TEST-P1-COUNTER-'+tag+'-002';
    const hash=createHash('sha256').update(value).digest('hex');
    await db.prepare('INSERT INTO p1_challenge(digest,credential_id,purpose,origin,rp_id,expires_at) VALUES (?,?,?,?,?,?)')
      .bind(hash,authenticator.id,'login',SYNTHETIC_ORIGIN,SYNTHETIC_RP_ID,nowSeconds+90).run();
    return {value,hash,response:makeAuthenticationResponse(authenticator,{challenge:value,counter:2})};
  };
  return {authenticator,challenge,nowSeconds,secret:'11'.repeat(32)};
}

test('P1 COUNTER CAS SECURITY: two valid signed distinct challenges with same positive count admit only one session', {timeout:120000},async()=>{
  const {mf,db}=await isolated();
  try{
    const fx=await seededLoginFixture(db);
    const [first,second]=await Promise.all([fx.challenge('RACE-ONE'),fx.challenge('RACE-TWO')]);
    let selected=0,release;
    const barrier=new Promise(resolve=>{release=resolve;});
    const coordinated={batch:(statements)=>db.batch(statements),prepare(sql){
      if(!sql.startsWith('SELECT credential_id,public_key,sign_count FROM p1_credentials'))return db.prepare(sql);
      return {bind(...values){return {async first(){
        const row=await db.prepare(sql).bind(...values).first();
        selected++;
        if(selected===2)release();
        await barrier;
        return row;
      }};}};
    }};
    const calls=[first,second].map(item=>createLocalSession({
      db:coordinated,secret:fx.secret,nowSeconds:fx.nowSeconds,credentialId:fx.authenticator.id,
      expectedChallenge:item.value,response:item.response,
    }).then(()=>true,()=>false));
    const outcomes=await Promise.all(calls);
    assert.equal(selected,2,'both assertions read the original sign_count=1 before either batch');
    assert.equal(outcomes.filter(Boolean).length,1,'duplicate positive sign counter cannot authorize two sessions');
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM p1_session').first()).n,1,'only one durable session');
    assert.equal((await db.prepare('SELECT sign_count FROM p1_credentials WHERE credential_id=?').bind(fx.authenticator.id).first()).sign_count,2);
  }finally{await mf.dispose();}
});

test('P1 D1 ATOMIC ROLLBACK: failing ticket update and session insert leave no partial authority', {timeout:120000},async()=>{
  const {mf,db}=await isolated();
  try{
    const nowSeconds=20000,token=randomBytes(32).toString('hex');
    await mintLocalTicket({db,token,nowSeconds});
    await db.prepare("CREATE TRIGGER synthetic_abort_owner BEFORE UPDATE ON p1_ticket BEGIN SELECT RAISE(ABORT,'synthetic-ticket-error'); END").run();
    assert.equal(await claimOwnerOnce({db,token,nowSeconds,origin:SYNTHETIC_ORIGIN,expectedOrigin:SYNTHETIC_ORIGIN,marker:'atomic-rollback'}),false);
    assert.equal((await db.prepare('SELECT count(*) n FROM p1_owner').first()).n,0,'failed transactional ticket must roll back owner INSERT');
    assert.equal((await db.prepare('SELECT count(*) n FROM p1_ticket WHERE consumed_at IS NOT NULL').first()).n,0);
    await db.prepare('DROP TRIGGER synthetic_abort_owner').run();
    const fx=await seededLoginFixture(db);
    const item=await fx.challenge('ROLLBACK');
    await db.prepare("CREATE TRIGGER synthetic_abort_session BEFORE INSERT ON p1_session BEGIN SELECT RAISE(ABORT,'synthetic-session-error'); END").run();
    await assert.rejects(createLocalSession({db,secret:fx.secret,nowSeconds,credentialId:fx.authenticator.id,
      expectedChallenge:item.value,response:item.response}),/rejected/);
    assert.equal((await db.prepare('SELECT count(*) n FROM p1_session').first()).n,0);
    assert.equal((await db.prepare('SELECT consumed_at FROM p1_challenge WHERE digest=?').bind(item.hash).first()).consumed_at,null,'failed batch must roll back challenge consumption');
    assert.equal((await db.prepare('SELECT sign_count FROM p1_credentials WHERE credential_id=?').bind(fx.authenticator.id).first()).sign_count,1,'failed batch must roll back counter write');
  }finally{await mf.dispose();}
});

test('P1 SESSION ROTATION: second successful signed login invalidates old opaque Owner cookie', {timeout:120000},async()=>{
  const {mf,db}=await isolated();
  try{
    const fx=await seededLoginFixture(db);
    const first=await fx.challenge('ROTATE-ONE');
    const issued=await createLocalSession({db,secret:fx.secret,nowSeconds:fx.nowSeconds,credentialId:fx.authenticator.id,
      expectedChallenge:first.value,response:first.response});
    const oldRequest=new Request(SYNTHETIC_ORIGIN+'/local/owner-readonly',{
      headers:{'sec-fetch-site':'same-origin',cookie:issued.cookie.split(';')[0]},
    });
    assert.equal((await authorizeLocalRead({request:oldRequest,db,secret:fx.secret,nowSeconds:fx.nowSeconds+1})).allowed,true);
    const second=await fx.challenge('ROTATE-TWO');
    const refreshed=await createLocalSession({db,secret:fx.secret,nowSeconds:fx.nowSeconds+2,credentialId:fx.authenticator.id,
      expectedChallenge:second.value,response:makeAuthenticationResponse(fx.authenticator,{challenge:second.value,counter:3})});
    const newRequest=new Request(SYNTHETIC_ORIGIN+'/local/owner-readonly',{
      headers:{'sec-fetch-site':'same-origin',cookie:refreshed.cookie.split(';')[0]},
    });
    assert.notEqual(refreshed.token,issued.token);
    assert.equal((await authorizeLocalRead({request:oldRequest,db,secret:fx.secret,nowSeconds:fx.nowSeconds+3})).allowed,false,
      'rotation must revoke old Owner session on second signed login');
    assert.equal((await authorizeLocalRead({request:newRequest,db,secret:fx.secret,nowSeconds:fx.nowSeconds+3})).allowed,true);
    assert.equal((await db.prepare('SELECT count(*) n FROM p1_session WHERE revoked_at IS NULL').first()).n,1);
  }finally{await mf.dispose();}
});
