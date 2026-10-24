// CB-M07-FOCUS-SELECTION-INTENT-001 · TEST-ONLY RED gate.
// Actual Chromium + disposable LOCAL D1 + synthetic WebAuthn, no real credentials.
// Gate only UI delivery of an authentic authenticated D1 response.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startLocalCmsPreview } from '../CB-M05/p1c-local-preview.mjs';

async function makeFixture() {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  const page = app.page;
  await page.locator('#login').click();
  await page.getByText('Local test session active').waitFor({timeout:20_000});
  for(const [name,value] of Object.entries({
    title:'Synthetic focus/selection decision draft',
    summary:'Private hypothetical calendar; never scheduled.',
    body:'PRIVATE_SYNTHETIC_NEVER_POST',
    sourceUrl:'https://example.org/focus-selection',
    authorLabel:'Virtual Owner',
  })) await page.locator('[name="' + name + '"]').fill(value);
  await page.locator('#save').click();
  await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
  await page.locator('#m07-draft').selectOption({index:1});
  await page.locator('#m07-calendar-zone').selectOption('UTC');
  await page.locator('#m07-calendar-date').fill('2026-11-20T12:00');
  await page.locator('#m07-calendar-add').click();
  await page.locator('#m07-calendar-list li').first().waitFor({timeout:20_000});
  assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(),1);
  // Real second synthetic passkey session with the same disposable LOCAL D1.
  const reviewer=await app.context.newPage();
  await reviewer.goto(app.origin+'/admin/login',{waitUntil:'domcontentloaded'});
  await reviewer.locator('#credential').fill(app.primaryId);
  await reviewer.locator('#login').click();
  await reviewer.getByText('Local test session active').waitFor({timeout:20_000});
  await reviewer.locator('#items button').first().click();
  return {app,page,reviewer};
}

async function setOwnerDecision(reviewer) {
  await reviewer.locator('#owner-review').waitFor({state:'visible'});
  await reviewer.locator('#owner-review-decision').selectOption('CHANGES_REQUESTED');
  await reviewer.locator('#owner-review-note').fill('Synthetic Owner decision revokes the old hypothetical calendar idea.');
  reviewer.once('dialog',d=>d.accept());
  await reviewer.locator('#owner-review-submit').click();
  await reviewer.waitForFunction(()=>document.querySelector('#m06-review-changes')?.textContent==='1',null,{timeout:20_000});
  const result=await reviewer.evaluate(()=>fetch('/admin/articles').then(r=>r.json()));
  assert.equal(result.drafts[0].current_review_decision,'CHANGES_REQUESTED');
}

async function changeRevision(reviewer) {
  await reviewer.locator('[name="body"]').fill('UPDATED_SYNTHETIC_REVISION_2_NEVER_PUBLISHED');
  await reviewer.locator('#save').click();
  await reviewer.getByText('Saved LOCAL draft revision 2; not published').waitFor({timeout:20_000});
  const result=await reviewer.evaluate(()=>fetch('/admin/articles').then(r=>r.json()));
  assert.equal(result.drafts[0].revision,2);
}

async function gateRealD1FocusRead(page) {
  await page.evaluate(()=>{
    const original=globalThis.fetch.bind(globalThis);
    let armed=true;
    const gate={started:false,delivered:false,release:null,status:null};
    globalThis.__cbFocusSelectionGate=gate;
    globalThis.fetch=async(input,init)=>{
      if(armed&&input==='/admin/articles'&&(!init?.method||init.method==='GET')){
        armed=false;
        const response=await original(input,init); // Actual D1, no fake body/status.
        gate.status=response.status;
        gate.started=true;
        await new Promise(resolve=>{gate.release=resolve;});
        gate.delivered=true;
        return response;
      }
      return original(input,init);
    };
  });
  return {
    started:()=>page.waitForFunction(()=>globalThis.__cbFocusSelectionGate?.started,null,{timeout:15_000}),
    release:()=>page.evaluate(()=>globalThis.__cbFocusSelectionGate?.release?.()),
    done:()=>page.waitForFunction(()=>globalThis.__cbFocusSelectionGate?.delivered,null,{timeout:15_000}),
  };
}
async function focus(page) {
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
}

async function noStaleCalendar(page,app,context) {
  const count=await page.locator('#m07-calendar-list li').count();
  const week=await page.locator('#m07-week-board .m07-week-idea').count();
  assert.equal(count,0,context+': revoked/draft-revised idea must not linger after authenticated focus check');
  assert.equal(week,0,context+': week board must also scrub the revoked/revised idea');
  assert.deepEqual(app.networkAttempts.filter(x=>!x.allowed),[]);
}

for(const cause of ['CHANGES_REQUESTED','REVISION_CHANGED']) {
  test('FOCUS RED: '+cause+' response with simultaneous selector change must scrub old ideas',
    {timeout:120_000},async()=>{
      const {app,page,reviewer}=await makeFixture();
      let gate;
      try {
        if(cause==='CHANGES_REQUESTED') await setOwnerDecision(reviewer);
        else await changeRevision(reviewer);
        gate=await gateRealD1FocusRead(page);
        await focus(page);
        await gate.started();
        await page.locator('#m07-draft').selectOption('');
        assert.equal(await page.locator('#m07-calendar-list li').count(),1,
          'Selection changes alone do not silently clear a calendar idea');
        await gate.release();
        await gate.done();
        await page.waitForTimeout(200);
        await noStaleCalendar(page,app,cause);
      } finally {
        if(gate) await gate.release();
        await app.close();
      }
    });
}

test('FOCUS: obsolete out-of-order focus validation cannot reintroduce a revoked idea',
  {timeout:120_000},async()=>{
    const {app,page,reviewer}=await makeFixture();
    let gate;
    try {
      await setOwnerDecision(reviewer);
      gate=await gateRealD1FocusRead(page);
      await focus(page);
      await gate.started(); // Old read paused with authentic D1 response.
      await page.locator('#m07-draft').selectOption('');
      await focus(page); // Newest authenticated read must scrub.
      await page.waitForFunction(()=>
        document.querySelectorAll('#m07-calendar-list li').length===0 &&
        document.querySelectorAll('#m07-week-board .m07-week-idea').length===0,
        null,{timeout:12_000});
      await gate.release();
      await gate.done();
      await noStaleCalendar(page,app,'out-of-order');
    } finally {
      if(gate) await gate.release();
      await app.close();
    }
  });
