// Browser integration: REAL local D1 + REAL WebAuthn virtual authenticator,
// mapped only through the isolated synthetic HTTPS Origin. No public admin deploy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startLocalCmsPreview } from './p1c-local-preview.mjs';

test('M05 local /admin lets the synthetic Owner log in, create a D1 draft and revoke session', { timeout: 120_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless: true, admin: true });
  try {
    const page = preview.page;
    assert.equal(new URL(page.url()).pathname, '/admin/login');
    assert.match(await page.title(), /Local CMS Test Workspace/);
    assert.equal(await page.locator('#credential').inputValue(), preview.primaryId);
    const before = await page.evaluate(() => fetch('/admin/articles').then(response => response.status));
    assert.equal(before, 401, 'private draft listing must be denied without an Owner session');
    assert.equal(await page.locator('#m06-dashboard').isVisible(), false, 'M06 hidden before synthetic Owner login');
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    assert.equal(await page.locator('#m06-dashboard').isVisible(), true);
    assert.equal(await page.locator('#m06-listed-drafts').innerText(), '0', 'empty local D1 is legitimately measured');
    assert.match(await page.locator('#m06-measured-at').innerText(), /Z$/);
    assert.equal(await page.locator('#m06-activity-status').innerText(), 'MEASURED_LOCAL');
    assert.equal(await page.locator('#m06-activity-scope').innerText(), 'MEASURED_LOCAL');
    assert.equal(await page.locator('#m06-revised-listed').innerText(), '0');
    assert.equal(await page.locator('#m06-recent-activity li').count(), 0);
    await page.locator('[name="title"]').fill('LOCAL admin test draft');
    await page.locator('[name="summary"]').fill('Synthetic test draft never published');
    await page.locator('[name="body"]').fill('Private test body stored in local D1');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/source');
    await page.locator('[name="authorLabel"]').fill('Synthetic Owner');
    await assert.doesNotReject(async () => {
      assert.equal(await page.locator('#draft-preview').isVisible(), true);
      assert.equal(await page.locator('#draft-preview-title').innerText(), 'LOCAL admin test draft');
      assert.equal(await page.locator('#draft-preview-summary').innerText(), 'Synthetic test draft never published');
    });
    await page.locator('[name="body"]').fill('<img src="https://external.example.test/tracker.png" onerror="alert(1)">');
    assert.equal(await page.locator('#draft-preview-body img').count(), 0, 'preview must not parse draft HTML');
    assert.match(await page.locator('#draft-preview-body').innerText(), /<img src=/);
    await page.locator('[name="body"]').fill('Private test body stored in local D1');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20_000 });
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 1);
    assert.equal(await page.locator('#m06-listed-drafts').innerText(), '1', 'M06 count reflects authenticated local list');
    assert.equal(await page.locator('#m06-recent-activity li').count(), 1);
    assert.match(await page.locator('#m06-recent-activity').innerText(), /LOCAL admin test draft · rev 1/u);
    const response = await page.evaluate(async () => {
      const r = await fetch('/admin/articles', { credentials: 'same-origin' });
      return { status: r.status, body: await r.json() };
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.drafts.length, 1);
    assert.equal(response.body.drafts[0].title, 'LOCAL admin test draft');
    await page.locator('#logout').click();
    await page.getByText('Not authenticated').waitFor({ timeout: 20_000 });
    assert.equal(await page.locator('#draft-preview').isVisible(), false, 'logout must hide private preview');
    assert.equal(await page.locator('#m06-dashboard').isVisible(), false, 'dashboard hidden on logout');
    assert.equal(await page.locator('#m06-listed-drafts').textContent(), 'Unavailable');
    assert.equal(await page.locator('#m06-measured-at').textContent(), 'Unavailable');
    assert.equal(await page.locator('#m06-activity-status').textContent(), 'UNAVAILABLE');
    assert.equal(await page.locator('#m06-revised-listed').textContent(), 'Unavailable');
    assert.equal(await page.locator('#m06-recent-activity li').count(), 0);
    assert.equal(await page.locator('#draft-preview-body').textContent(), '', 'logout must clear draft body');
    assert.equal(await page.evaluate(() => fetch('/admin/articles').then(r => r.status)), 401);
    assert.equal(preview.networkAttempts.filter(event => !event.allowed).length, 0,
      'the synthetic admin workflow never attempts off-origin network egress');
  } finally {
    await preview.close();
  }
});

for (const admin of [false, true]) {
  test('M05 revoked synthetic Owner session scrubs private draft on 401 ' + (admin ? '/admin' : '/local'), { timeout: 120_000 }, async () => {
    const preview = await startLocalCmsPreview({ headless: true, admin });
    try {
      const page = preview.page;
      await page.locator('#login').click();
      await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
      assert.equal(await page.locator('#m06-dashboard').isVisible(), true);
      await page.locator('[name="title"]').fill('Sensitive never-published local draft');
      await page.locator('[name="summary"]').fill('Draft content should vanish after a revoked session');
      await page.locator('[name="body"]').fill('PRIVATE_SYNTHETIC_DRAFT_BODY_DO_NOT_EXPOSE');
      assert.equal(await page.locator('#draft-preview').isVisible(), true);
      assert.match(await page.locator('#draft-preview-body').innerText(), /PRIVATE_SYNTHETIC_DRAFT_BODY/);

      const revoked = await preview.db.prepare(
        'UPDATE cms_sessions SET revoked_at=? WHERE revoked_at IS NULL'
      ).bind(Math.floor(Date.now() / 1000)).run();
      assert.equal(revoked.meta?.changes, 1, 'exactly one synthetic Owner session is revoked');
      await page.locator('#refresh').click();
      await page.getByText('Not authenticated', { exact: true }).waitFor({ timeout: 20_000 });
      assert.equal(await page.locator('#draft-preview').isVisible(), false,
        'private preview must be hidden after a server-side 401');
      assert.equal(await page.locator('#draft-preview-body').textContent(), '',
        'private draft body must be scrubbed after a server-side 401');
      assert.equal(await page.locator('#m06-dashboard').isVisible(), false, 'dashboard must hide after 401 revocation');
      assert.equal(await page.locator('#m06-listed-drafts').textContent(), 'Unavailable');
      assert.equal(await page.locator('#m06-activity-status').textContent(), 'UNAVAILABLE');
      assert.equal(await page.locator('#m06-recent-activity li').count(), 0);
      assert.equal(await page.locator('[name="body"]').inputValue(), '',
        'stale editable private draft must not remain in the form');
      assert.equal(await page.locator('#refresh').isVisible(), false,
        'privileged control is unavailable after revocation');
      assert.equal(preview.networkAttempts.filter(x => !x.allowed).length, 0);
    } finally {
      await preview.close();
    }
  });
}

test('M05 /admin persistent LOCAL D1 retains draft but expires synthetic Owner session across restart', { timeout: 150_000 }, async () => {
  const persistenceRoot = mkdtempSync(path.join(tmpdir(), 'coinblink-m05-admin-persist-'));
  let first, second;
  try {
    first = await startLocalCmsPreview({ headless: true, persistLocal: true, persistenceRoot, admin: true });
    await first.page.locator('#login').click();
    await first.page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    const submitted = await first.page.evaluate(async () => {
      const response = await fetch('/admin/articles', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Should be denied', body: 'Unsafe CSRF write' }),
      });
      return response.status;
    });
    assert.equal(submitted, 403, 'no authenticated write without CSRF');
    await first.page.locator('[name="title"]').fill('Restart-safe synthetic draft');
    await first.page.locator('[name="summary"]').fill('Local only, never published');
    await first.page.locator('[name="body"]').fill('Persistent test body');
    await first.page.locator('[name="sourceUrl"]').fill('https://example.org/research');
    await first.page.locator('[name="authorLabel"]').fill('Synthetic Owner');
    await first.page.locator('#save').click();
    await first.page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20_000 });
    const firstCredential = first.primaryId;
    await first.close(); first = null;

    second = await startLocalCmsPreview({ headless: true, persistLocal: true, persistenceRoot, admin: true });
    assert.notEqual(second.primaryId, firstCredential);
    assert.equal((await second.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    assert.equal((await second.db.prepare('SELECT COUNT(*) AS n FROM cms_sessions WHERE revoked_at IS NULL').first()).n, 0);
    assert.equal(await second.page.evaluate(() => fetch('/admin/articles').then(r => r.status)), 401);
    await second.page.locator('#login').click();
    await second.page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    assert.match(await second.page.locator('#items').innerText(), /Restart-safe synthetic draft/);
    await second.page.locator('#items').getByRole('button', { name: /Restart-safe synthetic draft/ }).click();
    await second.page.getByText('Loaded draft revision 1').waitFor({ timeout: 20_000 });
    assert.equal(await second.page.locator('#draft-preview-title').innerText(), 'Restart-safe synthetic draft');
    assert.equal(await second.page.locator('#save').innerText(), 'Save new revision');
    await second.page.locator('[name="title"]').fill('Restart-safe edited draft');
    await second.page.locator('[name="summary"]').fill('Edited safely after local D1 restart');
    await second.page.locator('#save').click();
    await second.page.getByText('Saved LOCAL draft revision 2; not published').waitFor({ timeout: 20_000 });
    assert.equal((await second.db.prepare('SELECT COUNT(*) AS n FROM cms_draft_revisions').first()).n, 2);
    assert.equal(await second.page.locator('#m06-revised-listed').innerText(), '1');
    assert.match(await second.page.locator('#m06-recent-activity').innerText(), /Restart-safe edited draft · rev 2/u);
    await second.page.locator('#m06-recent-activity button').click();
    await second.page.getByText('Loaded draft revision 2').waitFor({ timeout: 20_000 });
    await second.page.locator('#history').click();
    await second.page.getByText('Read-only revision history loaded: 2 versions').waitFor({ timeout: 20_000 });
    assert.match(await second.page.locator('#history-list').innerText(), /Revision 1/);
    assert.match(await second.page.locator('#history-list').innerText(), /Revision 2/);
  } finally {
    if (second) await second.close();
    if (first) await first.close();
    rmSync(persistenceRoot, { recursive: true, force: true });
  }
});


test('M06-B recent activity derives only from two authenticated LOCAL drafts and is scrubbed on sign-out', { timeout: 120_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless: true, admin: true });
  try {
    const page = preview.page;
    assert.equal(await page.locator('#m06-dashboard').isVisible(), false);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    async function save(title) {
      await page.locator('#new-draft').click();
      await page.locator('[name="title"]').fill(title);
      await page.locator('[name="summary"]').fill('Local synthetic summary never published');
      await page.locator('[name="body"]').fill('PRIVATE_BODIES_NOT_IN_ACTIVITY');
      await page.locator('[name="sourceUrl"]').fill('https://example.org/demo');
      await page.locator('[name="authorLabel"]').fill('Synthetic Owner');
      await page.locator('#save').click();
      await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20_000 });
    }
    await save('Recent activity synthetic one');
    await save('Recent activity synthetic two');
    assert.equal(await page.locator('#m06-listed-drafts').innerText(), '2');
    assert.equal(await page.locator('#m06-revised-listed').innerText(), '0');
    assert.equal(await page.locator('#m06-recent-activity li').count(), 2);
    assert.doesNotMatch(await page.locator('#m06-recent-activity').innerText(), /PRIVATE_BODIES_NOT_IN_ACTIVITY/);
    await page.locator('#m06-recent-activity button').first().click();
    await page.getByText('Loaded draft revision 1').waitFor({ timeout: 20_000 });
    await page.locator('#logout').click();
    await page.getByText('Not authenticated').waitFor({ timeout: 20_000 });
    assert.equal(await page.locator('#m06-dashboard').isVisible(), false);
    assert.equal(await page.locator('#m06-activity-scope').textContent(), 'UNAVAILABLE');
    assert.equal(await page.locator('#m06-recent-activity li').count(), 0);
    assert.equal(preview.networkAttempts.filter(event => !event.allowed).length, 0);
  } finally {
    await preview.close();
  }
});
