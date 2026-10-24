// Browser-only, no posting or real schedule. Virtual WebAuthn + disposable D1.
import test from 'node:test';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { startLocalCmsPreview } from '../CB-M05/p1c-local-preview.mjs';

test('M07-C LOCAL add/remove/clear, UTC ordering, responsive & axe, no external egress', {timeout:120_000}, async()=>{
  const app=await startLocalCmsPreview({headless:true,admin:true});
  try{
    const page=app.page;
    assert.equal(await page.locator('#m07-calendar').isVisible(),false);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20000});
    await page.locator('[name="title"]').fill('Hypothetical LOCAL headline');
    await page.locator('[name="summary"]').fill('Fictional calendar concepts are never published by this system.');
    await page.locator('[name="body"]').fill('BODY_SHOULD_NEVER_BE_CALENDAR_TEXT');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/example');
    await page.locator('[name="authorLabel"]').fill(' ');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20000});
    await page.locator('#m07-draft').selectOption({index:1});
    await page.locator('#m07-calendar-zone').selectOption('America/Sao_Paulo');
    for(const [index,[channel,time]] of [['x','2026-11-20T16:00'],['instagram','2026-11-20T11:00'],['tiktok','2026-11-20T13:00']].entries()){
      await page.locator('#m07-channel').selectOption(channel);
      await page.locator('#m07-calendar-date').fill(time);
      await page.locator('#m07-calendar-add').click();
      await page.locator('#m07-calendar-list li').nth(index).waitFor();
    }
    assert.equal(await page.locator('#m07-calendar-list li').count(),3);
    assert.match(await page.locator('#m07-calendar-status').innerText(),/3 hypothetical concepts/);
    const content=await page.locator('#m07-calendar-list').innerText();
    assert.ok(content.indexOf('INSTAGRAM') < content.indexOf('TIKTOK') && content.indexOf('TIKTOK') < content.indexOf('X ·'));
    assert.match(content,/PLANNED_CONCEPT_ONLY/);
    assert.match(content,/SOURCE_VERIFICATION_PENDING/);
    assert.match(content,/NOT_CLEARED/);
    assert.doesNotMatch(content,/BODY_SHOULD_NEVER_BE_CALENDAR_TEXT/);
    await page.locator('#m07-calendar-add').click();
    await page.locator('#m07-calendar-status').filter({hasText:/NOTHING SCHEDULED/}).waitFor();
    assert.equal(await page.locator('#m07-calendar-list li').count(),3);
    for(const width of [390,768,1366]){
      await page.setViewportSize({width,height:900});
      const box=await page.locator('#m07-calendar').boundingBox();
      assert.ok(box && box.x >= -1 && box.x+box.width <= width+1);
    }
    const axe=await new AxeBuilder({page}).include('#m07-calendar')
      .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(x=>({id:x.id,impact:x.impact})),[]);
    await page.locator('#m07-calendar-list button').first().click();
    assert.equal(await page.locator('#m07-calendar-list li').count(),2);
    await page.locator('#m07-calendar-clear').click();
    assert.equal(await page.locator('#m07-calendar-list li').count(),0);
    assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
    assert.equal((await app.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n,1);
  }finally{await app.close();}
});

test('M07-C LOCAL calendar is scrubbed on refresh/logout and server-side 401 revocation', {timeout:120_000}, async()=>{
  const app=await startLocalCmsPreview({headless:true,admin:true});
  try{
    const page=app.page;
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20000});
    await page.locator('[name="title"]').fill('Hypothetical private storyboard');
    await page.locator('[name="summary"]').fill('Only fictional local concepts and no external scheduling.');
    await page.locator('[name="body"]').fill('NO_CALENDAR_BODY_EXPORT');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/stub');
    await page.locator('[name="authorLabel"]').fill('Synthetic Owner');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20000});
    async function add(){
      await page.locator('#m07-draft').selectOption({index:1});
      await page.locator('#m07-calendar-zone').selectOption('UTC');
      await page.locator('#m07-calendar-date').fill('2026-11-20T12:00');
      await page.locator('#m07-calendar-add').click();
      await page.locator('#m07-calendar-list li').first().waitFor();
      assert.equal(await page.locator('#m07-calendar-list li').count(),1);
    }
    await add();
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor({timeout:20000});
    assert.equal(await page.locator('#m07-calendar-list li').count(),0);
    await add();
    await page.locator('#logout').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20000});
    assert.equal(await page.locator('#m07-calendar-list li').count(),0);
    assert.equal(await page.locator('#m07-calendar-date').inputValue(),'');
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20000});
    await add();
    const result=await app.db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE revoked_at IS NULL').bind(Math.floor(Date.now()/1000)).run();
    assert.equal(result.meta?.changes,1);
    await page.locator('#refresh').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20000});
    assert.equal(await page.locator('#m07-calendar-list li').count(),0);
    assert.equal(await page.locator('#m07-calendar-date').inputValue(),'');
    assert.equal(await page.locator('#m07-calendar-status').textContent(),'0 hypothetical concepts · memory only · NOT SCHEDULED');
    assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
  }finally{await app.close();}
});


test('cross-session Owner review must clear stale M07 calendar on focus', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  try {
    const primary = app.page;
    await primary.locator('#login').click();
    await primary.getByText('Local test session active').waitFor({timeout:20_000});
    const fields = {
      title:'Synthetic cross-session calendar Owner review',
      summary:'The current saved revision receives an Owner decision after a hypothetical idea was created.',
      body:'NEVER_PUBLISH_PRIVATE_SYNTHETIC_BODY',
      sourceUrl:'https://example.org/local-review',
      authorLabel:'Synthetic Owner',
    };
    for (const [name,value] of Object.entries(fields)) {
      await primary.locator('[name="' + name + '"]').fill(value);
    }
    await primary.locator('#save').click();
    await primary.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    await primary.locator('#m07-draft').selectOption({index:1});
    await primary.locator('#m07-calendar-zone').selectOption('UTC');
    await primary.locator('#m07-calendar-date').fill('2026-11-20T12:00');
    await primary.locator('#m07-calendar-add').click();
    await primary.locator('#m07-calendar-list li').first().waitFor();
    assert.equal(await primary.locator('#m07-week-board .m07-week-idea').count(),1);

    // The second tab signs in with a virtual test passkey and records an
    // immutable review in the same disposable D1. Test cookies are shared.
    const previousSessions = await app.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions').first();
    const reviewer = await app.context.newPage();
    await reviewer.goto(app.origin + '/admin/login', {waitUntil:'domcontentloaded'});
    await reviewer.locator('#credential').fill(app.primaryId);
    await reviewer.locator('#login').click();
    await reviewer.getByText('Local test session active').waitFor({timeout:20_000});
    const newSessions = await app.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions').first();
    assert.ok(newSessions.n > previousSessions.n, 'A fresh synthetic Owner session must be recorded');
    await reviewer.locator('#items button').first().click();
    await reviewer.locator('#owner-review').waitFor({state:'visible'});
    await reviewer.locator('#owner-review-decision').selectOption('CHANGES_REQUESTED');
    await reviewer.locator('#owner-review-note').fill('Current revision needs changes; preexisting local ideas are no longer current.');
    reviewer.once('dialog', dialog => dialog.accept());
    await reviewer.locator('#owner-review-submit').click();
    await reviewer.waitForFunction(() =>
      globalThis.document.querySelector('#m06-review-changes')?.textContent === '1');
    const {drafts} = await reviewer.evaluate(() => fetch('/admin/articles').then(r => r.json()));
    assert.equal(drafts[0].current_review_decision,'CHANGES_REQUESTED');

    const authorizedListing = primary.waitForResponse(r => r.url().endsWith('/admin/articles') &&
      r.request().method() === 'GET' && r.status() === 200);
    await primary.evaluate(() => globalThis.window.dispatchEvent(new Event('focus')));
    await authorizedListing;
    await primary.waitForFunction(() =>
      globalThis.document.querySelectorAll('#m07-calendar-list li').length === 0 &&
      globalThis.document.querySelectorAll('#m07-week-board .m07-week-idea').length === 0,
    null,{timeout:6_000});
    assert.equal(await primary.locator('#m07-calendar-list li').count(),0);
    assert.equal(await primary.locator('#m07-week-board .m07-week-idea').count(),0);
    assert.deepEqual(app.networkAttempts.filter(x=>!x.allowed),[]);
  } finally { await app.close(); }
});


/**
 * CB-P0-SOCIAL-CALENDAR-INFLIGHT-INTENT-001: hold the real authenticated
 * local D1 read while exercising browser interaction. No fixture shortcuts,
 * remote endpoints, real identities or fabricated server responses.
 */
async function holdNextCalendarD1Read(page, options = {}) {
  // Intercept only the first authenticated UI fetch inside the synthetic
  // Chromium page. The original fetch reaches disposable D1 unchanged.
  // Gate the response seen by the UI, never synthesize any server payload.
  await page.evaluate(({afterRelease}) => {
    const nativeFetch = globalThis.fetch.bind(globalThis);
    const gate = {held:false,delivered:false,status:null,release:null};
    globalThis.__cbIntentTestGate = gate;
    let armed = true;
    globalThis.fetch = async (resource, init) => {
      if (armed && resource === '/admin/articles' &&
          (!init?.method || init.method === 'GET')) {
        armed = false;
        if (afterRelease) {
          gate.held = true;
          await new Promise(resolve => { gate.release = resolve; });
        }
        const actual = await nativeFetch(resource,init);
        gate.status = actual.status;
        if (!afterRelease) {
          gate.held = true;
          await new Promise(resolve => { gate.release = resolve; });
        }
        gate.delivered = true;
        return actual;
      }
      return nativeFetch(resource,init);
    };
  },options);
  return {
    started: () => page.waitForFunction(() => globalThis.__cbIntentTestGate?.held,
      null, {timeout:15_000}),
    completed: () => page.waitForFunction(() => globalThis.__cbIntentTestGate?.delivered,
      null, {timeout:15_000}).then(() => page.evaluate(() => globalThis.__cbIntentTestGate.status)),
    release: () => page.evaluate(() => globalThis.__cbIntentTestGate?.release?.()),
  };
}

async function makeInflightCalendarFixture() {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  const page = app.page;
  await page.locator('#login').click();
  await page.getByText('Local test session active').waitFor({timeout:20_000});
  for (const [name, value] of Object.entries({
    title:'Synthetic in-flight intent draft',
    summary:'Fictional draft used only in disposable D1.',
    body:'PRIVATE_SYNTHETIC_NEVER_EXPORT',
    sourceUrl:'https://example.org/inflight-case',
    authorLabel:'Virtual Owner',
  })) {
    await page.locator('[name="' + name + '"]').fill(value);
  }
  await page.locator('#save').click();
  await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
  await page.locator('#m07-draft').selectOption({index:1});
  await page.locator('#m07-channel').selectOption('x');
  await page.locator('#m07-calendar-zone').selectOption('UTC');
  await page.locator('#m07-calendar-date').fill('2026-11-20T12:00');
  return {app,page};
}

async function flushCalendarResponse(page, held) {
  await held.release();
  const status = await held.completed();
  // Resume browser promise continuations after authentic D1 delivery.
  await page.waitForTimeout(150);
  return status;
}

async function withInflightFixture(run) {
  const {app,page} = await makeInflightCalendarFixture();
  let held;
  try {
    await run({
      app,page,
      hold: async options => {
        held = await holdNextCalendarD1Read(page, options);
        return held;
      },
    });
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed),[]);
  } finally {
    if (held) await held.release();
    await app.close();
  }
}

async function openInflightEditor(page) {
  await page.locator('#m07-calendar-add').click();
  await page.locator('#m07-calendar-list li').first().waitFor();
  const row = page.locator('#m07-calendar-list .m07-calendar-item').first();
  await row.locator('.m07-calendar-edit').click();
  return row.locator('.m07-calendar-editor');
}

test('INFLIGHT RED: ADD after Clear and restored fields must not resurrect calendar', {timeout:120_000}, async () => {
  await withInflightFixture(async ({page,hold}) => {
    const pending = await hold();
    await page.locator('#m07-calendar-add').click();
    await pending.started();
    await page.locator('#m07-calendar-clear').click();
    assert.equal(await page.locator('#m07-calendar-list li').count(),0);
    await page.locator('#m07-calendar-date').fill('2026-11-20T12:00');
    await flushCalendarResponse(page,pending);
    assert.equal(await page.locator('#m07-calendar-list li').count(),0,
      'Clear is final: a pending ADD cannot reappear after fields are restored');
    assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(),0);
  });
});

test('INFLIGHT RED: EDIT changed inputs during authorized GET restores Save', {timeout:120_000}, async () => {
  await withInflightFixture(async ({page,hold}) => {
    const editor = await openInflightEditor(page);
    await editor.locator('.m07-edit-channel').selectOption('instagram');
    const pending = await hold();
    const save = editor.locator('.m07-calendar-save');
    await save.click();
    await pending.started();
    assert.equal(await save.isDisabled(),true);
    await editor.locator('.m07-edit-time').fill('2026-11-20T14:00');
    await flushCalendarResponse(page,pending);
    assert.equal(await save.isEnabled(),true,
      'A stale edit must restore the current Save button');
    assert.equal(await page.locator('#m07-calendar-list li').count(),1);
  });
});

test('INFLIGHT RED: Cancel before late EDIT response prevents any edit commit', {timeout:120_000}, async () => {
  await withInflightFixture(async ({page,hold}) => {
    const editor = await openInflightEditor(page);
    const pending = await hold();
    await editor.locator('.m07-calendar-save').click();
    await pending.started();
    await editor.locator('.m07-calendar-cancel').click();
    assert.equal(await editor.isVisible(),false);
    await flushCalendarResponse(page,pending);
    assert.doesNotMatch(await page.locator('#m07-calendar-status').innerText(),
      /Edited LOCAL hypothetical concept/, 'Cancelled edits cannot commit after a late response');
    assert.equal(await page.locator('#m07-calendar-list li').count(),1);
  });
});

test('INFLIGHT: out-of-order ADD responses reject obsolete channel selection', {timeout:120_000}, async () => {
  await withInflightFixture(async ({page,hold}) => {
    const pending = await hold();
    await page.locator('#m07-calendar-add').click();
    await pending.started();
    await page.locator('#m07-channel').selectOption('instagram');
    await page.locator('#m07-calendar-add').click();
    await page.locator('#m07-calendar-list li').first().waitFor({timeout:20_000});
    await flushCalendarResponse(page,pending);
    assert.equal(await page.locator('#m07-calendar-list li').count(),1);
    assert.match(await page.locator('#m07-calendar-list').innerText(),/INSTAGRAM/);
    assert.doesNotMatch(await page.locator('#m07-calendar-list').innerText(),/ · X · /);
  });
});

test('INFLIGHT: pending ADD after logout or 401 leaves no private calendar', {timeout:120_000}, async () => {
  for (const mode of ['logout','401']) {
    await withInflightFixture(async ({app,page,hold}) => {
      const pending = await hold({afterRelease:mode === '401'});
      await page.locator('#m07-calendar-add').click();
      await pending.started();
      if (mode === 'logout') {
        await page.locator('#logout').click();
      } else {
        const result = await app.db.prepare(
          'UPDATE cms_sessions SET revoked_at=? WHERE revoked_at IS NULL'
        ).bind(Math.floor(Date.now()/1000)).run();
        assert.equal(result.meta?.changes,1);
      }
      await flushCalendarResponse(page,pending);
      await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20_000});
      assert.equal(await page.locator('#m07-calendar-list li').count(),0);
      assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(),0);
    });
  }
});


/**
 * CB-M07-FOCUS-SELECTION-INTENT-001
 * Focus revalidation must prune revoked/revised memory-only ideas even when
 * a user switches the Social Studio selector during the genuine D1 response.
 * All requests remain authenticated against disposable LOCAL D1 + virtual WebAuthn.
 */
async function prepareFocusSelectionOwnerUpdate(app, page, kind) {
  await page.locator('#m07-calendar-add').click();
  await page.locator('#m07-calendar-list li').first().waitFor({timeout:20_000});
  assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(),1);
  const reviewer=await app.context.newPage();
  await reviewer.goto(app.origin+'/admin/login',{waitUntil:'domcontentloaded'});
  await reviewer.locator('#credential').fill(app.primaryId);
  await reviewer.locator('#login').click();
  await reviewer.getByText('Local test session active').waitFor({timeout:20_000});
  await reviewer.locator('#items button').first().click();
  if(kind==='CHANGES_REQUESTED'){
    await reviewer.locator('#owner-review').waitFor({state:'visible'});
    await reviewer.locator('#owner-review-decision').selectOption('CHANGES_REQUESTED');
    await reviewer.locator('#owner-review-note').fill('Synthetic Owner revoked this revision for private preview.');
    reviewer.once('dialog',dialog=>dialog.accept());
    await reviewer.locator('#owner-review-submit').click();
    await reviewer.waitForFunction(()=>
      document.querySelector('#m06-review-changes')?.textContent==='1',null,{timeout:20_000});
  }else{
    await reviewer.locator('[name="body"]').fill('SYNTHETIC_REVISION_2_NOT_PUBLISHED');
    await reviewer.locator('#save').click();
    await reviewer.getByText('Saved LOCAL draft revision 2; not published').waitFor({timeout:20_000});
  }
  const auth=await reviewer.evaluate(()=>fetch('/admin/articles').then(r=>r.json()));
  if(kind==='CHANGES_REQUESTED') assert.equal(auth.drafts[0].current_review_decision,'CHANGES_REQUESTED');
  else assert.equal(auth.drafts[0].revision,2);
}

async function assertFocusSelectionScrubbed(page,label) {
  assert.equal(await page.locator('#m07-calendar-list li').count(),0,
    label+': stale idea must not survive authenticated focus and selector change');
  assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(),0,
    label+': stale weekly projection must be scrubbed');
}

for(const kind of ['CHANGES_REQUESTED','REVISION_CHANGED']){
  test('FOCUS RED: '+kind+' with concurrent selector change scrubs stale calendar',
    {timeout:120_000},async()=>{
      await withInflightFixture(async({app,page,hold})=>{
        await prepareFocusSelectionOwnerUpdate(app,page,kind);
        const pending=await hold();
        await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
        await pending.started();
        await page.locator('#m07-draft').selectOption('');
        assert.equal(await page.locator('#m07-calendar-list li').count(),1);
        await flushCalendarResponse(page,pending);
        await assertFocusSelectionScrubbed(page,kind);
      });
    });
}

test('FOCUS: two out-of-order authorized responses never restore revoked ideas',
  {timeout:120_000},async()=>{
    await withInflightFixture(async({app,page,hold})=>{
      await prepareFocusSelectionOwnerUpdate(app,page,'CHANGES_REQUESTED');
      const pending=await hold();
      await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
      await pending.started();
      await page.locator('#m07-draft').selectOption('');
      await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
      await page.waitForFunction(()=>
        document.querySelectorAll('#m07-calendar-list li').length===0 &&
        document.querySelectorAll('#m07-week-board .m07-week-idea').length===0,
        null,{timeout:12_000});
      await flushCalendarResponse(page,pending);
      await assertFocusSelectionScrubbed(page,'out-of-order focus');
    });
  });
