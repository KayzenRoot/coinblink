import { expect, test } from '@playwright/test';

// M01 P1: the actual public Golden Home now links to the existing offline M05
// editorial workbench. The destination is intentionally a MOCK, never /admin.
for (const [home,copy] of [
  ['/en', 'Open editorial demo'],
  ['/pt-br', 'Abrir demonstração editorial'],
]) {
  test('M01 functional homepage -> M05 safe editorial demo handoff: ' + home, async ({ page }) => {
    const external = [];
    const mutations = [];
    page.on('request', req => {
      if (new URL(req.url()).origin !== 'http://127.0.0.1:4321') external.push(req.url());
      if (!['GET', 'HEAD'].includes(req.method())) mutations.push(req.url());
    });
    const homeResponse = await page.goto(home);
    expect(homeResponse?.status()).toBe(200);
    const link = page.locator('[data-editorial-workspace-link]');
    await expect(link).toBeVisible();
    await expect(link).toHaveText(new RegExp(copy));
    await expect(link).toHaveAttribute('href', '/demo/editorial/articles');
    await expect(page.locator('[data-editorial-workspace-handoff]')).toContainText(
      home === '/en' ? 'No account, storage or publication.' : 'Sem conta, armazenamento ou publicação.'
    );
    await link.click();
    await expect(page).toHaveURL(/\/demo\/editorial\/articles\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Article workspace' })).toBeVisible();
    await expect(page.getByText('MOCK / SECURITY DISABLED', { exact: true })).toBeVisible();
    expect(external).toEqual([]);
    expect(mutations).toEqual([]);
  });
}
