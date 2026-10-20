// Real local D1 and virtual WebAuthn. Social Studio only formats text in memory.
import test from 'node:test';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { startLocalCmsPreview } from '../CB-M05/p1c-local-preview.mjs';

test('M07 LOCAL three channels use authenticated D1 metadata only; no posts or egress', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page = app.page;
    assert.equal(await page.locator('#m07-social').isVisible(),false);
    assert.equal(await page.locator('#m07-preview').isVisible(),false);
    assert.equal(await page.evaluate(() => fetch('/admin/articles').then(r=>r.status)),401);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    assert.equal(await page.locator('#m07-social').isVisible(),true);
    await page.locator('#m07-generate').click();
    assert.equal(await page.locator('#m07-preview').isVisible(),false);
    await page.locator('[name="title"]').fill('Synthetic social test article');
    await page.locator('[name="summary"]').fill('A made-up scenario for private local social concept testing.');
    await page.locator('[name="body"]').fill('DO_NOT_SHARE_PRIVATE_BODY');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/mock-source');
    await page.locator('[name="authorLabel"]').fill(' ');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    assert.equal(await page.locator('#m07-draft option').count(),2);
    await page.locator('#m07-draft').selectOption({index:1});
    for (const channel of ['x','instagram','tiktok']) {
      await page.locator('#m07-channel').selectOption(channel);
      await page.locator('#m07-generate').click();
      await page.locator('#m07-preview').waitFor({state:'visible'});
      await page.locator('#m07-card').waitFor({state:'visible'});
      assert.equal(await page.locator('#m07-card').getAttribute('data-channel'),channel);
      assert.match(await page.locator('#m07-card-copy').innerText(),/Synthetic social test article/);
      assert.match(await page.locator('#m07-card-labels').innerText(),/NOT_CLEARED/);
      assert.match(await page.locator('#m07-preview-text').innerText(),/Synthetic social test article/);
      assert.match(await page.locator('#m07-preview-text').innerText(),/example\.org\/mock-source/);
      assert.match(await page.locator('#m07-rights').innerText(),/SOURCE_VERIFICATION_PENDING/);
      assert.match(await page.locator('#m07-rights').innerText(),/CREDIT_MISSING/);
      assert.match(await page.locator('#m07-rights').innerText(),/DRAFT_ONLY/);
      assert.doesNotMatch(await page.locator('#m07-preview-text').innerText(),/DO_NOT_SHARE_PRIVATE_BODY/);
      assert.equal(await page.locator('#m07-status').innerText(),'LOCAL synthetic concept · NOT POSTED');
    }
    assert.match(await page.locator('#m07-preview-text').innerText(),/storyboard only/);
    assert.match(await page.locator('#m07-card-format').innerText(),/TikTok-inspired storyboard/);
    await page.locator('#m07-viewport').selectOption('desktop');
    assert.equal(await page.locator('#m07-card').getAttribute('data-viewport'),'desktop');
    await page.locator('#m07-viewport').selectOption('mobile');
    assert.equal(await page.locator('#m07-card').getAttribute('data-viewport'),'mobile');
    for (const width of [390, 768, 1366]) {
      await page.setViewportSize({width,height:850});
      const cardBox = await page.locator('#m07-card').boundingBox();
      assert.ok(cardBox && cardBox.x >= 0 && cardBox.x + cardBox.width <= width + 1,
        'LOCAL card must fit viewport ' + width);
    }
    // Automated WCAG A/AA check of the actual protected visual preview.
    const accessibility = await new AxeBuilder({page}).include('#m07-preview')
      .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    assert.deepEqual(accessibility.violations.map(({id,impact}) => ({id,impact})),[]);
    assert.equal(await page.getByRole('article',{name:'Storyboard text mockup'}).isVisible(),true);
    assert.equal(await page.getByLabel('Illustrative preview size (not a provider specification)').count(),1);
    await page.locator('#m07-clear').click();
    assert.equal(await page.locator('#m07-preview').isVisible(),false);
    assert.equal(await page.locator('#m07-preview-text').textContent(),'');
    assert.equal(await page.locator('#m07-card-copy').textContent(),'');
    assert.equal(await page.locator('#m07-card').isVisible(),false);
    assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
    assert.equal((await app.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n,1);
  } finally {await app.close();}
});

test('M07 LOCAL preview scrubs draft options/text on logout and 401 revoked session', {timeout:120_000}, async () => {
  const app=await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page=app.page;
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    async function create() {
      await page.locator('[name="title"]').fill('Private social sample headline');
      await page.locator('[name="summary"]').fill('Fictional private metadata to be removed after revocation.');
      await page.locator('[name="body"]').fill('PRIVATE_NEVER_SHARED');
      await page.locator('[name="sourceUrl"]').fill('https://example.org/private');
      await page.locator('[name="authorLabel"]').fill('Synthetic Owner');
      await page.locator('#save').click();
      await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
      await page.locator('#m07-draft').selectOption({index:1});
      await page.locator('#m07-generate').click();
      await page.locator('#m07-preview').waitFor({state:'visible'});
    }
    await create();
    await page.locator('#logout').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20_000});
    assert.equal(await page.locator('#m07-preview').isVisible(),false);
    assert.equal(await page.locator('#m07-preview-text').textContent(),'');
    assert.equal(await page.locator('#m07-draft option').count(),0);
    assert.equal(await page.locator('#m07-rights').textContent(),'UNAVAILABLE');
    assert.equal(await page.locator('#m07-card-copy').textContent(),'');
    assert.equal(await page.locator('#m07-card').isVisible(),false);
    assert.equal(await page.locator('#m07-viewport').inputValue(),'mobile');
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    assert.equal(await page.locator('#m07-draft option').count(),2);
    await page.locator('#m07-draft').selectOption({index:1});
    await page.locator('#m07-generate').click();
    const revoked=await app.db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE revoked_at IS NULL').bind(Math.floor(Date.now()/1000)).run();
    assert.equal(revoked.meta?.changes,1);
    await page.locator('#refresh').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20_000});
    assert.equal(await page.locator('#m07-preview').isVisible(),false);
    assert.equal(await page.locator('#m07-draft option').count(),0);
    assert.equal(await page.locator('#m07-preview-text').textContent(),'');
    assert.equal(await page.locator('#m07-card-copy').textContent(),'');
    assert.equal(await page.locator('#m07-card').isVisible(),false);
    assert.equal(await page.locator('#m07-status').textContent(),'No LOCAL social preview');
    assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
  } finally {await app.close();}
});

test('M07-B keyboard-selectable viewport and visual card scrub when draft changes', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page=app.page;
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await page.locator('[name="title"]').fill('Private illustrative post');
    await page.locator('[name="summary"]').fill('Fictional social caption visible solely inside an authenticated browser.');
    await page.locator('[name="body"]').fill('LOCAL_BODY_STAYS_PRIVATE');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/fiction');
    await page.locator('[name="authorLabel"]').fill('Test credit');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    await page.locator('#m07-draft').selectOption({index:1});
    await page.locator('#m07-channel').selectOption('instagram');
    await page.locator('#m07-viewport').focus();
    await page.keyboard.press('End');
    assert.equal(await page.locator('#m07-viewport').inputValue(),'desktop');
    await page.locator('#m07-generate').click();
    await page.locator('#m07-card').waitFor({state:'visible'});
    assert.equal(await page.locator('#m07-card').getAttribute('data-viewport'),'desktop');
    assert.match(await page.locator('#m07-card-copy').innerText(),/Private illustrative post/);
    assert.doesNotMatch(await page.locator('#m07-card-copy').innerText(),/LOCAL_BODY_STAYS_PRIVATE/);
    await page.locator('#m07-draft').selectOption('');
    assert.equal(await page.locator('#m07-card').isVisible(),false);
    assert.equal(await page.locator('#m07-card-copy').textContent(),'');
    assert.equal(await page.locator('#m07-card-labels').textContent(),'');
    assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
  } finally {await app.close();}
});


test('M07-H LOCAL per-channel variants are memory-only, explicitly saved and scrubbed', {timeout:120_000}, async () => {
  const app=await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page=app.page;
    assert.equal(await page.locator('#m07-variant-composer').isVisible(),false);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await page.locator('[name="title"]').fill('Fictional independent channel editorial sample');
    await page.locator('[name="summary"]').fill('Only a synthetic media scenario for local variant testing.');
    await page.locator('[name="body"]').fill('PRIVATE_BODY_NOT_EXPORTED');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/hypothetical');
    await page.locator('[name="authorLabel"]').fill(' ');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    await page.locator('#m07-draft').selectOption({index:1});
    const preview=async channel=>{
      await page.locator('#m07-channel').selectOption(channel);
      await page.locator('#m07-generate').click();
      await page.locator('#m07-variant-composer').waitFor({state:'visible'});
    };
    await preview('x');
    await page.locator('#m07-variant-text').fill('A fictional X-only message for this LOCAL draft');
    // Typing in the textarea must not silently change the saved preview.
    assert.doesNotMatch(await page.locator('#m07-card-copy').innerText(),/X-only message/);
    await page.locator('#m07-variant-save').click();
    await page.waitForFunction(() => document.getElementById('m07-card-copy').textContent.includes('X-only message'));
    assert.match(await page.locator('#m07-card-copy').innerText(),/NOT VERIFIED/);
    await preview('instagram');
    await page.locator('#m07-variant-text').fill('An independent Instagram caption, purely fictional');
    await page.locator('#m07-variant-save').click();
    await page.waitForFunction(() => document.getElementById('m07-card-copy').textContent.includes('An independent Instagram caption'));
    await preview('tiktok');
    await page.locator('#m07-variant-text').fill('An independent TikTok storyboard, purely fictional');
    await page.locator('#m07-variant-save').click();
    await page.waitForFunction(() => document.getElementById('m07-card-copy').textContent.includes('An independent TikTok storyboard'));
    await preview('x');
    assert.equal(await page.locator('#m07-variant-text').inputValue(),'A fictional X-only message for this LOCAL draft');
    await preview('instagram');
    assert.equal(await page.locator('#m07-variant-text').inputValue(),'An independent Instagram caption, purely fictional');
    await page.locator('#m07-variant-text').fill('bad');
    await page.locator('#m07-variant-save').click();
    await page.waitForFunction(() => /rejected/i.test(document.getElementById('m07-variant-status').textContent));
    assert.match(await page.locator('#m07-card-copy').innerText(),/independent Instagram caption/);
    await page.locator('#m07-variant-reset').click();
    await page.waitForFunction(() => !document.getElementById('m07-variant-composer').hidden &&
      !document.getElementById('m07-card-copy').textContent.includes('independent Instagram caption'));
    assert.doesNotMatch(await page.locator('#m07-card-copy').innerText(),/independent Instagram caption/);
    await preview('x');
    assert.match(await page.locator('#m07-card-copy').innerText(),/X-only message/);
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await page.locator('#m07-draft').selectOption({index:1});
    await preview('x');
    assert.doesNotMatch(await page.locator('#m07-card-copy').innerText(),/X-only message/);
    const axe=await new AxeBuilder({page}).include('#m07-variant-composer')
      .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(({id,impact})=>({id,impact})),[]);
    await page.locator('#logout').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20_000});
    assert.equal(await page.locator('#m07-variant-text').inputValue(),'');
    assert.equal(await page.locator('#m07-variant-composer').isVisible(),false);
    assert.equal(await page.locator('#m07-card-copy').textContent(),'');
    assert.deepEqual(app.networkAttempts.filter(item=>!item.allowed),[]);
  } finally { await app.close(); }
});

test('M07-H revocation denies LOCAL save, reset and generate before any preview mutation', {timeout:240_000}, async () => {
  for (const action of ['save','reset','generate']) {
    const app = await startLocalCmsPreview({headless:true,admin:true});
    try {
      const page = app.page;
      await page.locator('#login').click();
      await page.getByText('Local test session active').waitFor({timeout:20_000});
      await page.locator('[name="title"]').fill('Revoked fictional draft');
      await page.locator('[name="summary"]').fill('Fictional summary that must disappear after revocation.');
      await page.locator('[name="body"]').fill('SENSITIVE_TEST_BODY');
      await page.locator('[name="sourceUrl"]').fill('https://example.org/revoked');
      await page.locator('[name="authorLabel"]').fill(' ');
      await page.locator('#save').click();
      await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
      await page.locator('#m07-draft').selectOption({index:1});
      await page.locator('#m07-generate').click();
      await page.locator('#m07-variant-composer').waitFor({state:'visible'});
      await page.locator('#m07-variant-text').fill('Fictional authorized variant before revocation');
      const revoked=await app.db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE revoked_at IS NULL')
        .bind(Math.floor(Date.now()/1000)).run();
      assert.equal(revoked.meta?.changes,1);
      if (action === 'save') await page.locator('#m07-variant-save').click();
      if (action === 'reset') await page.locator('#m07-variant-reset').click();
      if (action === 'generate') await page.locator('#m07-generate').click();
      await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20_000});
      assert.equal(await page.locator('#m07-variant-text').inputValue(),'');
      assert.equal(await page.locator('#m07-variant-composer').isVisible(),false);
      assert.equal(await page.locator('#m07-card-copy').textContent(),'');
      assert.equal(await page.locator('[name="body"]').inputValue(),'');
      assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
    } finally { await app.close(); }
  }
});

test('M07-H client expiry timer erases private DOM even without another API request', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page=app.page;
    await page.clock.install({time:Date.now()});
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await page.locator('[name="title"]').fill('Session expiry fictional title');
    await page.locator('[name="summary"]').fill('Fictional source summary for an expiring browser session.');
    await page.locator('[name="body"]').fill('PRIVATE_SESSION_EXPIRY_BODY');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/expiry');
    await page.locator('[name="authorLabel"]').fill(' ');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    await page.locator('#m07-draft').selectOption({index:1});
    await page.locator('#m07-generate').click();
    await page.locator('#m07-variant-composer').waitFor({state:'visible'});
    await page.clock.fastForward(1_200_500);
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20_000});
    assert.equal(await page.locator('#m07-variant-text').inputValue(),'');
    assert.equal(await page.locator('#m07-card-copy').textContent(),'');
    assert.equal(await page.locator('[name="body"]').inputValue(),'');
    assert.equal(await page.locator('#m07-variant-composer').isVisible(),false);
    assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
  } finally { await app.close(); }
});

test('M07-H Reset with delayed authorized GET preserves later user input and saved preview', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page = app.page;
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await page.locator('[name="title"]').fill('Fictional Reset race article');
    await page.locator('[name="summary"]').fill('Synthetic local scenario for asynchronous editing safety.');
    await page.locator('[name="body"]').fill('PRIVATE_RESET_RACE_BODY');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/reset-race');
    await page.locator('[name="authorLabel"]').fill(' ');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    await page.locator('#m07-draft').selectOption({index:1});
    await page.locator('#m07-generate').click();
    await page.locator('#m07-variant-composer').waitFor({state:'visible'});
    const savedCaption = 'A saved fictional version that must survive a canceled Reset';
    const newerCaption = 'An unsaved newer edit made while Reset is awaiting the server';
    await page.locator('#m07-variant-text').fill(savedCaption);
    await page.locator('#m07-variant-save').click();
    await page.waitForFunction(value =>
      document.getElementById('m07-card-copy').textContent.includes(value), savedCaption);

    // Hold the authenticated GET after the Reset click. Page-level routing
    // falls back to the existing network-isolated LOCAL D1 fixture route.
    // The second iteration exercises edit-then-revert (the ABA race).
    for (const reverted of [false, true]) {
      let notifyBlocked;
      let allowResponse;
      const blocked = new Promise(resolve => { notifyBlocked = resolve; });
      const gate = new Promise(resolve => { allowResponse = resolve; });
      const endpoint = '**/admin/articles';
      const handler = async route => {
        if (route.request().method() !== 'GET') return route.fallback();
        notifyBlocked();
        await gate;
        await route.fallback();
      };
      await page.route(endpoint, handler);
      try {
        const responseReady = page.waitForResponse(response =>
          new URL(response.url()).pathname === '/admin/articles' &&
          response.request().method() === 'GET');
        await page.locator('#m07-variant-reset').click();
        await blocked;
        await page.locator('#m07-variant-text').fill(newerCaption);
        if (reverted) await page.locator('#m07-variant-text').fill(savedCaption);
        allowResponse();
        assert.equal((await responseReady).status(), 200);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(
          () => requestAnimationFrame(resolve))));
        assert.equal(await page.locator('#m07-variant-text').inputValue(),
          reverted ? savedCaption : newerCaption);
        assert.match(await page.locator('#m07-card-copy').innerText(), /saved fictional version/);
        assert.equal(await page.locator('#m07-variant-composer').isVisible(), true);
      } finally {
        allowResponse();
        await page.unroute(endpoint, handler);
      }
    }
    // The saved version was not deleted by either canceled Reset.
    await page.locator('#m07-generate').click();
    await page.waitForFunction(value =>
      document.getElementById('m07-variant-text').value === value, savedCaption);
    assert.match(await page.locator('#m07-card-copy').innerText(), /saved fictional version/);
    assert.equal(app.networkAttempts.filter(item => !item.allowed).length, 0);
  } finally {await app.close();}
});
