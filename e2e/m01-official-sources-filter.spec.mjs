import { expect, test } from '@playwright/test';

// M01 P2: existing first-party, allowlisted directory becomes searchable without
// a new feed, remote fetch, user tracking, persistence or editor publication.
for (const [route,expectedLabel,noResults,clearLabel] of [
  ['/en', 'Search official publishers', 'No official publishers match this search.', 'Clear search'],
  ['/pt-br', 'Pesquisar fontes oficiais', 'Nenhuma fonte oficial corresponde à busca.', 'Limpar busca'],
]) {
  test('M01 official publisher local search stays offline and accessible ' + route, async ({ page }) => {
    const external = [];
    const writes = [];
    page.on('request', request => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4321') external.push(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
    });
    const result = await page.goto(route);
    expect(result?.status()).toBe(200);
    const cards = page.locator('[data-official-source]');
    const visibleCards = page.locator('[data-official-source]:visible');
    await expect(cards).toHaveCount(6);
    await expect(visibleCards).toHaveCount(6);
    const search = page.getByRole('searchbox', { name: expectedLabel });
    await expect(search).toBeVisible();
    await search.fill('Ethereum');
    await expect(visibleCards).toHaveCount(1);
    await expect(visibleCards.first()).toContainText('Ethereum Foundation');
    await search.fill('a-nonexistent-publisher-name');
    await expect(visibleCards).toHaveCount(0);
    await expect(page.locator('[data-official-source-status]')).toHaveText(noResults);
    await page.getByRole('button', { name: clearLabel }).click();
    await expect(visibleCards).toHaveCount(6);
    await search.fill('CFTC');
    await expect(visibleCards).toHaveCount(1);
    await search.press('Escape');
    await expect(visibleCards).toHaveCount(6);
    expect(external).toEqual([]);
    expect(writes).toEqual([]);
  });
}
