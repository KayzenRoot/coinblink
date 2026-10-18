// M05 LOCAL-only editor loss-prevention: browser confirmation never bypasses
// server authorization. No real identities or external network are used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startLocalCmsPreview } from './p1c-local-preview.mjs';

for (const admin of [false, true]) {
  test('M05 LOCAL editor refuses accidental draft discard in ' + (admin ? '/admin' : '/local'), { timeout: 120_000 }, async () => {
    const preview = await startLocalCmsPreview({ headless: true, admin });
    try {
      const page = preview.page;
      await page.locator('#login').click();
      await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
      const title = page.locator('[name="title"]');
      const status = page.locator('#unsaved-draft-status');
      // Synthetic cancelable beforeunload checks the actual browser handler
      // deterministically without opening/flaking a navigation confirmation.
      const guardTriggered = () => page.evaluate(() => {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      });
      assert.equal(await guardTriggered(), false, 'clean new draft should allow reload');
      await title.fill('Important unsaved synthetic draft');
      assert.equal(await guardTriggered(), true, 'unsaved form edits should guard reload');
      assert.equal(await status.isVisible(), true);
      page.once('dialog', async dialog => {
        assert.match(dialog.message(), /Discard unsaved changes/);
        await dialog.dismiss();
      });
      await page.locator('#new-draft').click();
      assert.equal(await title.inputValue(), 'Important unsaved synthetic draft');
      assert.equal(await status.isVisible(), true);
      page.once('dialog', async dialog => { await dialog.accept(); });
      await page.locator('#new-draft').click();
      assert.equal(await title.inputValue(), '');
      assert.equal(await status.isVisible(), false);
      assert.equal(await guardTriggered(), false, 'confirmed reset should release reload guard');

      await title.fill('Saved title first revision');
      await page.locator('[name="summary"]').fill('Article summary is private and synthetic only');
      await page.locator('[name="body"]').fill('Private LOCAL article body');
      await page.locator('[name="sourceUrl"]').fill('https://example.org/source');
      await page.locator('[name="authorLabel"]').fill('Disposable Owner');
      assert.equal(await status.isVisible(), true);
      await page.locator('#save').click();
      await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20_000 });
      assert.equal(await status.isVisible(), false, 'successful D1 write resets dirty state');
      assert.equal(await guardTriggered(), false, 'successful save allows reload');

      await title.fill('Unsaved replacement title');
      assert.equal(await guardTriggered(), true, 'editing a saved article guards reload');
      assert.equal(await status.isVisible(), true);
      page.once('dialog', async dialog => { await dialog.dismiss(); });
      await page.getByRole('button', { name: /Saved title first revision/ }).click();
      assert.equal(await title.inputValue(), 'Unsaved replacement title',
        'cancelled switch must not replace current private form');
      page.once('dialog', async dialog => { await dialog.accept(); });
      await page.getByRole('button', { name: /Saved title first revision/ }).click();
      await page.getByText('Loaded draft revision 1').waitFor({ timeout: 20_000 });
      assert.equal(await title.inputValue(), 'Saved title first revision');
      assert.equal(await status.isVisible(), false);
      assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 1,
        'discard prompts never create a new revision');
      await title.fill('Sensitive unsaved on sign-out');
      await page.locator('#logout').click();
      await page.getByText('Not authenticated').waitFor({ timeout: 20_000 });
      assert.equal(await status.isVisible(), false);
      assert.equal(await title.inputValue(), '', 'logout must clear private form unconditionally');
      assert.equal(await guardTriggered(), false, 'sign-out must never trap user in private draft');
      assert.equal(preview.networkAttempts.filter(event => !event.allowed).length, 0);
    } finally {
      await preview.close();
    }
  });
}
