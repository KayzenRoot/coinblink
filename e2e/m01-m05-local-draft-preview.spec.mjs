import { expect, test } from "@playwright/test";
import { draftToMarkdown, prepareLocalDraft } from "../public/m05-draft-preview.js";

const original = prepareLocalDraft({
  title: 'Unverified local draft <img src=x onerror=alert(1)>',
  author: 'Independent demo author',
  source: 'https://example.org/original',
  summary: 'Original editorial preview that still needs independent fact checking.',
  body: 'This is an entirely offline, unapproved local editorial text containing <script>alert(1)</script> and no publication.',
});
if (!original.ready) throw new Error('E2E fixture must be exportable');
const markdown = draftToMarkdown(original);

for (const [locale, heading, status] of [
  ['/en', 'Preview your draft on the Home', 'Nothing uploaded or published'],
  ['/pt-br', 'Visualize seu rascunho na Home', 'Nada foi enviado ou publicado'],
]) {
  test('M01-M05 strict local file preview stays offline and inert ' + locale, async ({ page }) => {
    const offOrigin = [];
    const writes = [];
    page.on('request', req => {
      if (new URL(req.url()).origin !== 'http://127.0.0.1:4321') offOrigin.push(req.url());
      if (!['GET', 'HEAD'].includes(req.method())) writes.push(req.url());
    });
    const response = await page.goto(locale);
    expect(response?.status()).toBe(200);
    const section = page.locator('[data-m01-local-draft-preview]');
    await expect(section.getByRole('heading', { name: heading })).toBeVisible();
    const result = section.locator('[data-m01-draft-result]');
    await expect(result).toBeHidden();
    const input = section.locator('[data-m01-draft-file]');
    await input.setInputFiles({
      name: 'original-editorial-draft.md', mimeType: 'text/markdown',
      buffer: Buffer.from(markdown),
    });
    await expect(section.locator('[data-m01-draft-status]')).toContainText(status);
    await expect(result).toBeVisible();
    await expect(section.locator('[data-m01-draft-title]')).toHaveText(original.title);
    await expect(section.locator('[data-m01-draft-summary]')).toHaveText(original.summary);
    await expect(section.locator('[data-m01-draft-source]')).toHaveText(original.source);
    await expect(section.locator('[data-m01-draft-body]')).toContainText('<script>alert(1)</script>');
    await expect(section.locator('img, script, iframe')).toHaveCount(0);
    await expect(page.locator('a[href="/demo/editorial/articles/new"]')).toHaveCount(1);
    await input.setInputFiles({
      name: 'not-coinblink.md', mimeType: 'text/markdown',
      buffer: Buffer.from('# Invalid file\n<script>bad</script>'),
    });
    await expect(result).toBeVisible();
    await expect(section.locator('[data-m01-draft-title]')).toHaveText(original.title);
    const clear = section.locator('[data-m01-draft-clear]');
    await clear.click();
    await expect(result).toBeHidden();
    await expect(clear).toBeHidden();
    expect(await page.evaluate(() => ({ cookie: document.cookie, local: localStorage.length, session: sessionStorage.length })))
      .toEqual({ cookie: '', local: 0, session: 0 });
    expect(offOrigin).toEqual([]);
    expect(writes).toEqual([]);
  });
}
