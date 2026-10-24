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
    for(const [channel,time] of [['x','2026-11-20T16:00'],['instagram','2026-11-20T11:00'],['tiktok','2026-11-20T13:00']]){
      await page.locator('#m07-channel').selectOption(channel);
      await page.locator('#m07-calendar-date').fill(time);
      await page.locator('#m07-calendar-add').click();
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
    assert.equal(await page.locator('#m07-calendar-list li').count(),3);
    assert.match(await page.locator('#m07-calendar-status').innerText(),/NOTHING SCHEDULED/);
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
    const page = app.page;
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await page.locator('[name="title"]').fill('Synthetic cross-session calendar Owner review');
    await page.locator('[name="summary"]').fill('The current exact revision can be rejected after a hypothetical idea was created.');
    await page.locator('[name="body"]').fill('NEVER_PUBLISH_PRIVATE_SYNTHETIC_BODY');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/local-review');
    await page.locator('[name="authorLabel"]').fill('Synthetic Owner');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    await page.locator('#m07-draft').selectOption({index:1});
    await page.locator('#m07-calendar-zone').selectOption('UTC');
    await page.locator('#m07-calendar-date').fill('2026-11-20T12:00');
    await page.locator('#m07-calendar-add').click();
    assert.equal(await page.locator('#m07-calendar-list li').count(),1);
    assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(),1);

    // A second tab performs a fresh synthetic WebAuthn sign-in and records an
    // immutable decision in the same disposable LOCAL D1, without refreshing
    // the original tab. The browser shares the test Owner's cookie jar.
    const reviewer = await app.context.newPage();
    await reviewer.goto(app.origin + '/admin/login', {waitUntil:'domcontentloaded'});
    await reviewer.locator('#credential').fill(app.primaryId);
    await reviewer.locator('#login').click();
    await reviewer.getByText('Local test session active').waitFor({timeout:20_000});
    await reviewer.locator('#items button').first().click();
    await reviewer.locator('#owner-review').waitFor({state:'visible'});
    await reviewer.locator('#owner-review-decision').selectOption('CHANGES_REQUESTED');
    await reviewer.locator('#owner-review-note').fill('Review changed after the other tab built a hypothetical calendar concept.');
    reviewer.once('dialog', dialog => dialog.accept());
    await reviewer.locator('#owner-review-submit').click();
    await reviewer.waitForFunction(() => document.querySelector('#m06-review-changes')?.textContent === '1');
    const latest = await reviewer.evaluate(() => fetch('/admin/articles').then(r => r.json()));
    assert.equal(latest.drafts[0].current_review_decision,'CHANGES_REQUESTED');

    const verified = page.waitForResponse(r => r.url().endsWith('/admin/articles') &&
      r.request().method() === 'GET' && r.status() === 200);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await verified;
    // The old hypothetical entry cannot survive authenticated reconciliation.
    await page.waitForFunction(() =>
      document.querySelectorAll('#m07-calendar-list li').length === 0 &&
      document.querySelectorAll('#m07-week-board .m07-week-idea').length === 0,
    null,{timeout:6_000});
    assert.equal(await page.locator('#m07-calendar-list li').count(),0);
    assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(),0);
    assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
  } finally {await app.close();}
});
