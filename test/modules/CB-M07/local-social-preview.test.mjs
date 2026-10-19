// Real local D1 and virtual WebAuthn. Social Studio only formats text in memory.
import test from 'node:test';
import assert from 'node:assert/strict';
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
      assert.equal(await page.locator('#m07-preview').isVisible(),true);
      assert.match(await page.locator('#m07-preview-text').innerText(),/Synthetic social test article/);
      assert.match(await page.locator('#m07-preview-text').innerText(),/example\.org\/mock-source/);
      assert.match(await page.locator('#m07-rights').innerText(),/SOURCE_VERIFICATION_PENDING/);
      assert.match(await page.locator('#m07-rights').innerText(),/CREDIT_MISSING/);
      assert.match(await page.locator('#m07-rights').innerText(),/DRAFT_ONLY/);
      assert.doesNotMatch(await page.locator('#m07-preview-text').innerText(),/DO_NOT_SHARE_PRIVATE_BODY/);
      assert.equal(await page.locator('#m07-status').innerText(),'LOCAL synthetic concept · NOT POSTED');
    }
    assert.match(await page.locator('#m07-preview-text').innerText(),/storyboard only/);
    await page.locator('#m07-clear').click();
    assert.equal(await page.locator('#m07-preview').isVisible(),false);
    assert.equal(await page.locator('#m07-preview-text').textContent(),'');
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
      assert.equal(await page.locator('#m07-preview').isVisible(),true);
    }
    await create();
    await page.locator('#logout').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20_000});
    assert.equal(await page.locator('#m07-preview').isVisible(),false);
    assert.equal(await page.locator('#m07-preview-text').textContent(),'');
    assert.equal(await page.locator('#m07-draft option').count(),0);
    assert.equal(await page.locator('#m07-rights').textContent(),'UNAVAILABLE');
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
    assert.equal(await page.locator('#m07-status').textContent(),'No LOCAL social preview');
    assert.equal(app.networkAttempts.filter(x=>!x.allowed).length,0);
  } finally {await app.close();}
});
