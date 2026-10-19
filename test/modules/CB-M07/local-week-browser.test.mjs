// M07-D only: read-only projection of authenticated synthetic drafts.
import test from 'node:test';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { startLocalCmsPreview } from '../CB-M05/p1c-local-preview.mjs';

async function signIn(page) {
  await page.locator('#login').click();
  await page.getByText('Local test session active').waitFor({ timeout: 20000 });
}
async function createFictionalDraft(page, title) {
  const values = {
    title,
    summary: 'Entirely fictional local copy with no rights cleared for public use.',
    body: 'PRIVATE_EDITORIAL_BODY_MUST_NOT_APPEAR',
    sourceUrl: 'https://example.org/fiction',
    authorLabel: '',
  };
  for (const [name, value] of Object.entries(values)) {
    await page.locator('[name="' + name + '"]').fill(value);
  }
  await page.locator('#save').click();
  await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20000 });
}
async function addConcept(page, index, localMinute = '2026-11-16T00:30') {
  await page.locator('#m07-draft').selectOption({ index });
  await page.locator('#m07-channel').selectOption('x');
  await page.locator('#m07-calendar-zone').selectOption('UTC');
  await page.locator('#m07-calendar-date').fill(localMinute);
  await page.locator('#m07-calendar-add').click();
}
async function expectEmptyPrivateBoard(page) {
  assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(), 0);
  assert.equal(await page.locator('#m07-calendar-list li').count(), 0);
  assert.doesNotMatch(await page.locator('#m07-week-board').innerText(), /PRIVATE_EDITORIAL_BODY|hypothetical editorial draft/i);
}

test('M07-D: LOCAL weekly collision, channel filter, zone boundary, WCAG and no egress', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({ headless:true, admin:true });
  try {
    const { page } = app;
    assert.equal(await page.locator('#m07-weekly').isVisible(), false);
    await signIn(page);
    for (const title of ['First hypothetical editorial draft', 'Second hypothetical editorial draft']) {
      await createFictionalDraft(page, title);
      await page.locator('#new-draft').click();
    }
    assert.equal(await page.locator('#m07-draft option').count(), 3);
    await addConcept(page, 1);
    await addConcept(page, 2);
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
    assert.doesNotMatch(await page.locator('#m07-week-board').innerText(), /PRIVATE_EDITORIAL_BODY|example\.org/);
    await page.locator('#m07-week-filter').focus();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'm07-week-filter');
    for (const width of [390, 768, 1366]) {
      await page.setViewportSize({ width, height:900 });
      const rect = await page.locator('#m07-weekly').boundingBox();
      assert.ok(rect && rect.x >= -1 && rect.x + rect.width <= width + 1);
    }
    const accessibility = await new AxeBuilder({ page }).include('#m07-weekly')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    assert.deepEqual(accessibility.violations.map(x => ({ id:x.id, impact:x.impact })), []);
    await page.locator('#m07-calendar-list button').first().click();
    assert.equal(await page.locator('.m07-week-conflict').count(), 0);
    await page.locator('#m07-calendar-clear').click();
    await expectEmptyPrivateBoard(page);
    assert.equal(await page.locator('#m07-week-filter').inputValue(), 'all');
    assert.equal(await page.locator('#m07-week-zone').inputValue(), 'America/Sao_Paulo');
    assert.equal((await app.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 2);
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed), []);
  } finally { await app.close(); }
});

test('M07-D: refresh, sign-out and revoked passkey erase private week data', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({ headless:true, admin:true });
  try {
    const { page } = app;
    await signIn(page);
    await createFictionalDraft(page, 'Private ephemeral hypothetical editorial draft');
    const add = () => addConcept(page, 1, '2026-11-20T12:00');
    await add();
    assert.equal(await page.locator('.m07-week-idea').count(), 1);
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor({ timeout:20000 });
    await expectEmptyPrivateBoard(page);
    await add();
    await page.locator('#logout').click();
    await page.getByText('Not authenticated', { exact:true }).waitFor({ timeout:20000 });
    await expectEmptyPrivateBoard(page);
    assert.equal(await page.locator('#m07-week-status').textContent(), '0 shown · 0 conflicts · NOT SCHEDULED');
    await signIn(page);
    await add();
    const revoke = await app.db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE revoked_at IS NULL')
      .bind(Math.floor(Date.now()/1000)).run();
    assert.equal(revoke.meta?.changes, 1);
    await page.locator('#refresh').click();
    await page.getByText('Not authenticated', { exact:true }).waitFor({ timeout:20000 });
    await expectEmptyPrivateBoard(page);
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed), []);
  } finally { await app.close(); }
});
