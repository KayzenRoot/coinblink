// CB-M05-P1-OWNER-ACCESS-001: Workerd/D1 singleton proof, no remote bindings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
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
