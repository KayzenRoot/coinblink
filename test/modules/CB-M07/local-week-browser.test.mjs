// M07-D only: read-only projection of authenticated synthetic drafts.
import test from 'node:test';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { startLocalCmsPreview } from '../CB-M05/p1c-local-preview.mjs';

/** Authenticate using the disposable fixture's virtual local WebAuthn credential. */
async function signIn(page) {
  await page.locator('#login').click();
  await page.getByText('Local test session active').waitFor({ timeout: 20000 });
}
/** Create one D1 LOCAL-only synthetic draft; no publishing side effects. */
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
/** Seed multiple fictional LOCAL drafts without coupling tests to D1 list ordering. */
async function seedFictionalDrafts(page, titles) {
  for (const title of titles) {
    await createFictionalDraft(page, title);
    await page.locator('#new-draft').click();
  }
}

/** Add a hypothetical in-memory idea for the indexed authorized local draft. */
async function addConcept(page, draftChoice, localMinute = '2026-11-16T00:30') {
  if (typeof draftChoice === 'string') {
    const option = page.locator('#m07-draft option').filter({ hasText:draftChoice });
    await page.locator('#m07-draft').selectOption(await option.getAttribute('value'));
  } else {
    await page.locator('#m07-draft').selectOption({ index:draftChoice });
  }
  await page.locator('#m07-channel').selectOption('x');
  await page.locator('#m07-calendar-zone').selectOption('UTC');
  await page.locator('#m07-calendar-date').fill(localMinute);
  await page.locator('#m07-calendar-add').click();
}
/** Assert the weekly DOM and underlying list are erased after session changes. */
async function expectEmptyPrivateBoard(page) {
  assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(), 0);
  assert.equal(await page.locator('#m07-calendar-list li').count(), 0);
  assert.doesNotMatch(await page.locator('#m07-week-board').innerText(), /PRIVATE_EDITORIAL_BODY|hypothetical editorial draft/i);
}

/** Share the responsive WCAG check across the existing weekly board and editable calendar. */
async function assertAccessibleAtViewports(page, root, rectTarget) {
  for (const width of [390, 768, 1366]) {
    await page.setViewportSize({ width, height:900 });
    const rect = await page.locator(rectTarget).boundingBox();
    assert.ok(rect && rect.x >= -1 && rect.x + rect.width <= width + 1,
      'LOCAL controls must fit the ' + width + 'px viewport');
  }
  const result = await new AxeBuilder({ page }).include(root)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  assert.deepEqual(result.violations.map(x => ({ id:x.id, impact:x.impact })), []);
}

/** Scoped synthetic sign-in fixture with guaranteed browser/DB cleanup. */
async function withLocalSession(fn) {
  const app = await startLocalCmsPreview({headless:true,admin:true});
  try {
    await signIn(app.page);
    await fn(app.page,app);
  } finally {
    await app.close();
  }
}

test('M07-D: LOCAL weekly collision, channel filter, zone boundary, WCAG and no egress', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({ headless:true, admin:true });
  try {
    const { page } = app;
    assert.equal(await page.locator('#m07-weekly').isVisible(), false);
    await signIn(page);
    await seedFictionalDrafts(page, ['First hypothetical editorial draft', 'Second hypothetical editorial draft']);
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
    await assertAccessibleAtViewports(page, '#m07-weekly', '#m07-weekly');
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


test('M07-E: weekly navigation opens only the authorized draft; keyboard and unsaved guard', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({ headless:true, admin:true });
  try {
    const { page } = app;
    await signIn(page);
    await seedFictionalDrafts(page, ['First fictional weekly destination', 'Second fictional weekly destination']);
    await addConcept(page, 'First fictional weekly destination');
    await addConcept(page, 'Second fictional weekly destination', '2026-11-16T01:30');
    await page.locator('#m07-week-zone').selectOption('America/New_York');
    await page.locator('#m07-week-filter').selectOption('x');

    const buttons = page.locator('#m07-week-board .m07-week-open');
    assert.equal(await buttons.count(), 2);
    assert.equal(await buttons.first().getAttribute('type'), 'button');
    assert.match(await buttons.first().innerText(), /^Open LOCAL draft/);

    await buttons.first().focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() =>
      document.querySelector('[name="title"]').value === 'First fictional weekly destination');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('name')), 'title');

    await page.locator('[name="title"]').fill('PRIVATE UNSAVED TITLE');
    page.once('dialog', async dialog => { assert.equal(dialog.type(), 'confirm'); await dialog.dismiss(); });
    await buttons.nth(1).click();
    assert.equal(await page.locator('[name="title"]').inputValue(), 'PRIVATE UNSAVED TITLE');
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('m07-week-open')), true);

    page.once('dialog', async dialog => { assert.equal(dialog.type(), 'confirm'); await dialog.accept(); });
    await buttons.nth(1).click();
    await page.waitForFunction(() =>
      document.querySelector('[name="title"]').value === 'Second fictional weekly destination');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('name')), 'title');
    await buttons.first().focus();
    await page.keyboard.press('Space');
    await page.waitForFunction(() =>
      document.querySelector('[name="title"]').value === 'First fictional weekly destination');

    assert.equal(await page.locator('#m07-calendar-list li').count(), 2);
    assert.match(await page.locator('#m07-week-status').innerText(), /NOT SCHEDULED · NOT POSTED/);
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed), []);
  } finally { await app.close(); }
});

test('M07-E: draft missing, revoked session and stale UI fail closed', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({ headless:true, admin:true });
  try {
    const { page } = app;
    await signIn(page);
    await createFictionalDraft(page, 'Only fictional private weekly destination');
    await page.locator('#new-draft').click();
    await addConcept(page, 1);
    const button = page.locator('#m07-week-board .m07-week-open').first();
    assert.equal(await button.count(), 1);

    await page.route('**/admin/articles/*', route =>
      route.fulfill({ status:404, contentType:'application/json', body:'{"error":"missing"}' }));
    await button.click();
    await page.getByText('LOCAL draft unavailable; refresh your list').waitFor({ timeout:10000 });
    assert.equal(await page.locator('[name="body"]').inputValue(), '');
    await page.unroute('**/admin/articles/*');

    const staleElement = await button.elementHandle();
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor({ timeout:20000 });
    await expectEmptyPrivateBoard(page);
    // Fixture allows authenticated /admin/articles/{id} reads, so checking
    // only disallowed egress cannot detect an unauthorized stale click.
    const draftReads = () => app.networkAttempts.filter(entry =>
      /\/admin\/articles\/[0-9a-f-]{36}$/i.test(new URL(entry.url).pathname)).length;
    const beforeStaleClick = draftReads();
    await staleElement.evaluate(node => node.click());
    await page.waitForTimeout(250);
    assert.equal(draftReads(), beforeStaleClick, 'Stale weekly button must not read a draft');
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed), []);

    await addConcept(page, 1);
    await page.route('**/admin/articles/*', route =>
      route.fulfill({ status:401, contentType:'application/json', body:'{"error":"unauthorized"}' }));
    await page.locator('#m07-week-board .m07-week-open').click();
    await page.getByText('Not authenticated', { exact:true }).waitFor({ timeout:20000 });
    await expectEmptyPrivateBoard(page);
    assert.equal(await page.locator('[name="body"]').inputValue(), '');
    assert.equal(await page.locator('#m07-weekly').isVisible(), false);
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed), []);
  } finally { await app.close(); }
});



test('M07-H: accessible assisted cross-channel copy previews, confirms, and preserves originals', {timeout:120_000}, async () => {
  await withLocalSession(async (page, app) => {
    await createFictionalDraft(page, 'Fictional cross-channel LOCAL concept');
    await page.locator('#new-draft').click();
    await addConcept(page, 1, '2026-11-16T00:30');
    const original = page.locator('#m07-calendar-list .m07-calendar-item').first();
    const open = original.locator('.m07-calendar-copy');
    assert.equal(await open.getAttribute('type'), 'button');
    assert.match(await open.getAttribute('aria-label'), /Copy hypothetical concept/);
    await open.focus();
    await page.keyboard.press('Enter');
    const panel = original.locator('.m07-copy-panel');
    assert.equal(await panel.isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.className), 'm07-copy-channel');
    const channel = panel.locator('.m07-copy-channel');
    assert.deepEqual(await channel.locator('option').evaluateAll(options => options.map(o => o.value)),
      ['', 'instagram', 'tiktok']);
    await channel.selectOption('instagram');
    assert.match(await panel.locator('.m07-copy-preview').innerText(),
      /Preview only.*INSTAGRAM.*PLANNED_CONCEPT_ONLY.*DRAFT_ONLY.*NOT SCHEDULED.*NOT POSTED/);
    assert.equal(await page.locator('#m07-calendar-list li').count(), 1, 'Preview must not add an idea');
    await panel.locator('.m07-copy-cancel').click();
    assert.equal(await panel.isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('m07-calendar-copy')), true);
    assert.equal(await page.locator('#m07-calendar-list li').count(), 1);

    await open.click();
    await channel.selectOption('instagram');
    await panel.locator('.m07-copy-confirm').click();
    assert.equal(await page.locator('#m07-calendar-list li').count(), 2);
    assert.match(await page.locator('#m07-calendar-status').innerText(), /NOT SCHEDULED · NOT POSTED/);
    assert.equal(await page.locator('#m07-calendar-list .m07-calendar-item')
      .filter({ hasText: ' · X · ' }).count(), 1, 'Original must remain unchanged');
    assert.equal(await page.locator('#m07-calendar-list .m07-calendar-item')
      .filter({ hasText: ' · INSTAGRAM · ' }).count(), 1);
    assert.equal(await page.locator('#m07-week-board .m07-week-idea').count(), 2);
    assert.equal((await app.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);

    const originalAgain = page.locator('#m07-calendar-list .m07-calendar-item')
      .filter({ hasText: ' · X · ' }).first();
    await originalAgain.locator('.m07-calendar-copy').click();
    const p = originalAgain.locator('.m07-copy-panel');
    await p.locator('.m07-copy-channel').selectOption('instagram');
    assert.equal(await p.locator('.m07-copy-confirm').isDisabled(), true);
    assert.match(await p.locator('.m07-copy-preview').innerText(), /Duplicate/);
    await p.locator('.m07-copy-channel').selectOption('tiktok');
    await p.locator('.m07-copy-confirm').click();
    assert.equal(await page.locator('#m07-calendar-list li').count(), 3);
    assert.equal(await page.locator('#m07-calendar-list .m07-calendar-item')
      .filter({ hasText: ' · TIKTOK · ' }).count(), 1);
    assert.match(await page.locator('#m07-week-status').innerText(), /NOT SCHEDULED · NOT POSTED/);
    await page.locator('#m07-calendar-list .m07-calendar-item').first()
      .locator('.m07-calendar-copy').click();
    await assertAccessibleAtViewports(page, '#m07-calendar', '#m07-calendar');
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed), []);
  });
});

test('M07-H: cap, stale click, refresh and logout never create phantom concepts', {timeout:120_000}, async () => {
  await withLocalSession(async (page, app) => {
    await createFictionalDraft(page, 'Fictional bounded copied concept');
    await page.locator('#new-draft').click();
    for (let minute = 0; minute < 20; minute++) {
      await addConcept(page, 1, '2026-11-16T00:' + String(minute).padStart(2, '0'));
    }
    assert.equal(await page.locator('#m07-calendar-list li').count(), 20);
    const stale = await page.locator('#m07-calendar-list .m07-calendar-copy').first().elementHandle();
    const first = page.locator('#m07-calendar-list .m07-calendar-item').first();
    await first.locator('.m07-calendar-copy').click();
    const panel = first.locator('.m07-copy-panel');
    await panel.locator('.m07-copy-channel').selectOption('instagram');
    assert.equal(await panel.locator('.m07-copy-confirm').isDisabled(), true);
    assert.match(await panel.locator('.m07-copy-preview').innerText(), /20-concept limit/);
    assert.equal(await page.locator('#m07-calendar-list li').count(), 20);
    const existingReads = app.networkAttempts.length;
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor({timeout:20000});
    await expectEmptyPrivateBoard(page);
    await stale.evaluate(node => node.click());
    assert.equal(await page.locator('#m07-calendar-list li').count(), 0);
    assert.equal(app.networkAttempts.length, existingReads + 1, 'Only the refresh GET is permitted');

    await addConcept(page, 1);
    const later = await page.locator('#m07-calendar-list .m07-calendar-copy').first().elementHandle();
    await page.locator('#logout').click();
    await expectEmptyPrivateBoard(page);
    await later.evaluate(node => node.click());
    assert.equal(await page.locator('#m07-calendar-list li').count(), 0);
    assert.equal((await app.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed), []);
  });
});

test('M07-F: inline edit, cancel, duplicate/DST rejection, keyboard, WCAG and stale controls', {timeout:120_000}, async () => {
  const app = await startLocalCmsPreview({ headless:true, admin:true });
  try {
    const { page } = app;
    await signIn(page);
    await seedFictionalDrafts(page, ['First fictional edit concept', 'Second fictional edit concept']);
    await addConcept(page, 'First fictional edit concept', '2026-11-16T00:30');
    await addConcept(page, 'Second fictional edit concept', '2026-11-16T00:30');
    assert.equal(await page.locator('.m07-week-conflict').count(), 2);
    const edits = page.locator('#m07-calendar-list .m07-calendar-edit');
    assert.equal(await edits.count(), 2);
    const firstConcept = page.locator('#m07-calendar-list .m07-calendar-item')
      .filter({ hasText:'First fictional edit concept' }).first();
    await firstConcept.locator('.m07-calendar-edit').focus();
    await page.keyboard.press('Enter');
    const editor = firstConcept.locator('.m07-calendar-editor');
    assert.equal(await editor.isVisible(), true);
    assert.equal(await page.evaluate(() => document.activeElement?.className), 'm07-edit-time');
    await editor.locator('.m07-edit-channel').selectOption('instagram');
    await editor.locator('.m07-edit-time').fill('2026-11-16T01:30');
    await editor.locator('.m07-calendar-cancel').click();
    assert.equal(await editor.isVisible(), false);
    assert.equal(await page.locator('.m07-week-conflict').count(), 2);
    assert.equal(await editor.locator('.m07-edit-channel').inputValue(), 'x');
    assert.equal(await editor.locator('.m07-edit-time').inputValue(), '2026-11-16T00:30');

    await firstConcept.locator('.m07-calendar-edit').click();
    assert.equal(await editor.locator('[role="status"]').innerText(), 'MEMORY ONLY · NOT SCHEDULED · NOT POSTED');
    await editor.locator('.m07-edit-channel').selectOption('instagram');
    await editor.locator('.m07-edit-zone').selectOption('America/New_York');
    await editor.locator('.m07-edit-time').fill('2026-11-01T01:30');
    await editor.locator('.m07-calendar-save').click();
    assert.match(await editor.locator('[role="status"]').innerText(), /Invalid or duplicate/);
    assert.equal(await page.locator('.m07-week-conflict').count(), 2);
    await editor.locator('.m07-edit-zone').selectOption('UTC');
    await editor.locator('.m07-edit-time').fill('2026-11-16T01:30');
    await editor.locator('.m07-calendar-save').click();
    assert.equal(await page.locator('.m07-week-conflict').count(), 0);
    assert.match(await page.locator('#m07-calendar-status').innerText(), /Edited LOCAL hypothetical concept/);
    assert.match(await page.locator('#m07-calendar-list').innerText(), /INSTAGRAM/);
    assert.match(await page.locator('#m07-week-status').innerText(), /NOT SCHEDULED · NOT POSTED/);

    // Add another time for the same draft, then reject a duplicate edit.
    await addConcept(page, 'First fictional edit concept', '2026-11-16T02:30');
    // Target the 01:30 edited idea for this draft, not the unrelated draft.
    const first = page.locator('#m07-calendar-list .m07-calendar-item')
      .filter({ hasText:'First fictional edit concept · INSTAGRAM · 2026-11-16T01:30' }).first();
    await first.locator('.m07-calendar-edit').click();
    await first.locator('.m07-edit-channel').selectOption('x');
    await first.locator('.m07-edit-time').fill('2026-11-16T02:30');
    await first.locator('.m07-calendar-save').click();
    assert.match(await first.locator('[role="status"]').innerText(), /Invalid or duplicate/);
    assert.equal(await page.locator('#m07-calendar-list li').count(), 3);

    await assertAccessibleAtViewports(page, '#m07-calendar', '#m07-calendar-list .m07-calendar-editor:not([hidden])');
    const oldEdit = await first.locator('.m07-calendar-save').elementHandle();
    const draftReads = () => app.networkAttempts.filter(entry =>
      /\/admin\/articles\/[0-9a-f-]{36}$/i.test(new URL(entry.url).pathname)).length;
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor({ timeout:20000 });
    await expectEmptyPrivateBoard(page);
    const readsBefore = draftReads();
    await oldEdit.evaluate(node => node.click());
    await page.waitForTimeout(200);
    assert.equal(draftReads(),readsBefore);
    assert.equal(await page.locator('#m07-calendar-list li').count(),0);
    assert.equal((await app.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n,2);
    assert.deepEqual(app.networkAttempts.filter(entry => !entry.allowed), []);
  } finally { await app.close(); }
});


test('M07-G: conflict choices are synthetic, require explicit confirmation, remain accessible and fail closed', {timeout:120_000}, async () => {
  await withLocalSession(async (page,app) => {
    await seedFictionalDrafts(page, ['First hypothetical conflict draft', 'Second hypothetical conflict draft']);
    await addConcept(page,'First hypothetical conflict draft','2026-11-16T00:30');
    await addConcept(page,'Second hypothetical conflict draft','2026-11-16T00:30');
    assert.equal(await page.locator('.m07-week-conflict').count(),2);
    const first = page.locator('#m07-calendar-list .m07-calendar-item')
      .filter({hasText:'First hypothetical conflict draft'}).first();
    const suggest = first.locator('.m07-conflict-suggest');
    assert.equal(await suggest.count(),1);
    await suggest.focus();
    await page.keyboard.press('Enter');
    const panel = first.locator('.m07-suggestion-panel');
    assert.equal(await panel.isVisible(),true);
    const chooser = panel.locator('.m07-suggestion-choice');
    assert.equal(await chooser.locator('option').count(),4);
    assert.equal(await chooser.inputValue(),'');
    assert.match(await panel.innerText(),/NOT SCHEDULED|NOT POSTED/);
    await panel.locator('.m07-suggestion-confirm').click();
    assert.equal(await page.locator('.m07-week-conflict').count(),2,
      'Unselected suggestion may not change a concept');
    await assertAccessibleAtViewports(page,'#m07-calendar',
      '#m07-calendar-list .m07-suggestion-panel:not([hidden])');

    const candidate = await chooser.locator('option').nth(1).getAttribute('value');
    assert.ok(candidate && candidate !== '2026-11-16T00:30:00.000Z');
    await chooser.selectOption(candidate);
    const staleConfirm = await panel.locator('.m07-suggestion-confirm').elementHandle();
    await panel.locator('.m07-suggestion-confirm').click();
    assert.equal(await page.locator('.m07-week-conflict').count(),0);
    assert.equal(await page.locator('#m07-calendar-list li').count(),2);
    assert.match(await page.locator('#m07-calendar-status').innerText(),
      /Edited LOCAL hypothetical concept/);
    assert.match(await page.locator('#m07-week-status').innerText(),/NOT SCHEDULED · NOT POSTED/);
    assert.equal(await page.locator('.m07-conflict-suggest').count(),0);
    assert.doesNotMatch(await page.locator('#m07-calendar-list').innerText(),
      /PRIVATE_EDITORIAL_BODY_MUST_NOT_APPEAR|example\.org/);

    await staleConfirm.evaluate(node=>node.click());
    assert.equal(await page.locator('#m07-calendar-list li').count(),2);
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor({timeout:20000});
    await expectEmptyPrivateBoard(page);
    await staleConfirm.evaluate(node=>node.click());
    await expectEmptyPrivateBoard(page);
    // Same authenticated fixture: cancel and logout must also discard choices.
    await addConcept(page,'First hypothetical conflict draft');
    await addConcept(page,'Second hypothetical conflict draft');
    const again = page.locator('#m07-calendar-list .m07-calendar-item')
      .filter({hasText:'First hypothetical conflict draft'}).first();
    await again.locator('.m07-conflict-suggest').click();
    const choiceAgain = again.locator('.m07-suggestion-choice');
    await choiceAgain.selectOption({index:1});
    await again.locator('.m07-calendar-cancel').click();
    assert.equal(await again.locator('.m07-suggestion-panel').isVisible(),false);
    assert.equal(await choiceAgain.locator('option').count(),0);
    assert.equal(await page.locator('.m07-week-conflict').count(),2);
    await again.locator('.m07-conflict-suggest').click();
    assert.equal(await choiceAgain.inputValue(),'');
    await page.locator('#logout').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20000});
    await expectEmptyPrivateBoard(page);
    assert.equal((await app.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n,2);
    assert.deepEqual(app.networkAttempts.filter(x=>!x.allowed),[]);
  });
});
