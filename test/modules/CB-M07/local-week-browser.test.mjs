// M07-D: browser-only private weekly projection; no scheduler or external egress.
import test from 'node:test';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { startLocalCmsPreview } from '../CB-M05/p1c-local-preview.mjs';

test('M07-D LOCAL: two separate drafts collide in one channel/minute; filters, timezones, WCAG', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page = app.page;
    assert.equal(await page.locator('#m07-weekly').isVisible(), false);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    for (const [title, source] of [
      ['First private hypothetical editorial draft', 'https://example.org/one'],
      ['Second private hypothetical editorial draft', 'https://example.org/two'],
    ]) {
      await page.locator('[name="title"]').fill(title);
      await page.locator('[name="summary"]').fill('Entirely fictional and not cleared for publishing or external use.');
      await page.locator('[name="body"]').fill('PRIVATE_ARTICLE_BODY_DO_NOT_COPY');
      await page.locator('[name="sourceUrl"]').fill(source);
      await page.locator('[name="authorLabel"]').fill(' ');
      await page.locator('#save').click();
      await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
      await page.locator('#new-draft').click();
    }
    assert.equal(await page.locator('#m07-draft option').count(), 3);
    await page.locator('#m07-channel').selectOption('x');
    await page.locator('#m07-calendar-zone').selectOption('UTC');
    for (const option of [1, 2]) {
      await page.locator('#m07-draft').selectOption({index:option});
      await page.locator('#m07-calendar-date').fill('2026-11-16T00:30');
      await page.locator('#m07-calendar-add').click();
    }
    assert.equal(await page.locator('#m07-calendar-list li').count(), 2);
    assert.equal(await page.locator('.m07-week-conflict').count(), 2);
    assert.match(await page.locator('#m07-week-status').innerText(), /2 of 2 hypothetical concepts shown · 1 conflict slots/);
    assert.match(await page.locator('#m07-week-board').innerText(), /HYPOTHETICAL TIME CONFLICT \(NOT BLOCKING\)/);
    await page.locator('#m07-week-filter').selectOption('instagram');
    assert.match(await page.locator('#m07-week-status').innerText(), /0 of 2 hypothetical concepts shown/);
    assert.equal(await page.locator('#m07-calendar-list li').count(), 2);
    await page.locator('#m07-week-filter').selectOption('x');
    await page.locator('#m07-week-zone').selectOption('America/New_York');
    assert.match(await page.locator('#m07-week-board').innerText(), /Hypothetical week 2026-11-09 to 2026-11-15/);
    assert.match(await page.locator('#m07-week-board').innerText(), /Sunday · 2026-11-15/);
    assert.match(await page.locator('#m07-week-board').innerText(), /19:30/);
    assert.doesNotMatch(await page.locator('#m07-week-board').innerText(), /PRIVATE_ARTICLE_BODY_DO_NOT_COPY|example\.org/);
    await page.locator('#m07-week-filter').focus();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'm07-week-filter');
    for (const width of [390, 768, 1366]) {
      await page.setViewportSize({width,height:900});
      const weekly = await page.locator('#m07-weekly').boundingBox();
      assert.ok(weekly && weekly.x >= -1 && weekly.x + weekly.width <= width + 1);
    }
    const axe = await new AxeBuilder({page}).include('#m07-weekly')
      .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(row => ({id:row.id,impact:row.impact})), []);
    await page.locator('#m07-calendar-list button').first().click();
    assert.equal(await page.locator('.m07-week-conflict').count(), 0);
    assert.equal(await page.locator('#m07-calendar-list li').count(), 1);
    await page.locator('#m07-calendar-clear').click();
    assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(), 0);
    assert.equal(await page.locator('#m07-week-filter').inputValue(), 'all');
    assert.equal(await page.locator('#m07-week-zone').inputValue(), 'America/Sao_Paulo');
    assert.equal(app.networkAttempts.filter(entry => !entry.allowed).length, 0);
    assert.equal((await app.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 2);
  } finally { await app.close(); }
});

test('M07-D weekly DOM and conflicts are erased on refresh, logout and 401 revocation', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page = app.page;
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await page.locator('[name="title"]').fill('Ephemeral week draft example');
    await page.locator('[name="summary"]').fill('Fictional local text without any provider accounts.');
    await page.locator('[name="body"]').fill('SECRET_WEEK_BODY_NOT_IN_WEEK');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/stub');
    await page.locator('[name="authorLabel"]').fill('Fictional');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    const add = async () => {
      await page.locator('#m07-draft').selectOption({index:1});
      await page.locator('#m07-channel').selectOption('x');
      await page.locator('#m07-calendar-zone').selectOption('UTC');
      await page.locator('#m07-calendar-date').fill('2026-11-20T12:00');
      await page.locator('#m07-calendar-add').click();
      assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(), 1);
    };
    const empty = async () => {
      assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(), 0);
      assert.equal(await page.locator('#m07-calendar-list li').count(), 0);
      assert.doesNotMatch(await page.locator('#m07-week-board').innerText(), /Ephemeral week draft|SECRET_WEEK_BODY/);
    };
    await add();
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await empty();
    await add();
    await page.locator('#logout').click();
    await page.getByText('Not authenticated', {exact:true}).waitFor({timeout:20_000});
    await empty();
    assert.equal(await page.locator('#m07-week-status').textContent(), '0 shown · 0 conflicts · NOT SCHEDULED');
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    await add();
    const revoked = await app.db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE revoked_at IS NULL')
      .bind(Math.floor(Date.now()/1000)).run();
    assert.equal(revoked.meta?.changes, 1);
    await page.locator('#refresh').click();
    await page.getByText('Not authenticated', {exact:true}).waitFor({timeout:20_000});
    await empty();
    assert.equal(app.networkAttempts.filter(entry => !entry.allowed).length, 0);
  } finally { await app.close(); }
});
