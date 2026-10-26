// Browser integration: REAL local D1 + REAL WebAuthn virtual authenticator,
// mapped only through the isolated synthetic HTTPS Origin. No public admin deploy.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { parseLocalDraftMarkdown } from '../../../src/modules/CB-M05/local-draft-markdown.mjs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { listSyntheticSources } from '../../../src/modules/CB-M03/source-lab.mjs';
import { createMockSourceTransfer } from '../../../src/modules/CB-M03/source-transfer.mjs';
import { createMockResearchTransfer } from '../../../src/modules/CB-M08/research-transfer.mjs';
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
    assert.equal(await page.locator('#m06-review-list li').count(), 0);
    assert.equal(await page.locator('#m06-insights-status').innerText(), 'MEASURED_LOCAL');
    assert.equal(await page.locator('#m06-insights-scope').innerText(), 'MEASURED_LOCAL');
    assert.equal(await page.locator('#m06-insights-missing').innerText(), '0');
    assert.equal(await page.locator('#m06-insights-older').innerText(), '0');
    assert.equal(await page.locator('#m06-insights-recent').innerText(), '0');
    assert.equal(await page.locator('#m06-insights-trend li').count(), 7);
    await page.locator('#m06-review-filter').selectOption('older-seven-days');
    assert.equal(await page.locator('#m06-review-list li').count(), 0);
    await page.locator('#m06-review-filter').selectOption('all');
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
    assert.equal(await page.locator('#m06-review-list li').count(), 1);
    assert.match(await page.locator('#m06-review-list').innerText(), /SOURCE_VERIFICATION_PENDING/);
    assert.match(await page.locator('#m06-review-list').innerText(), /CREDIT_PRESENT_UNVERIFIED/);
    assert.equal(await page.locator('#m06-insights-missing').innerText(), '0');
    assert.equal(await page.locator('#m06-insights-older').innerText(), '0');
    assert.equal(await page.locator('#m06-insights-recent').innerText(), '1');
    assert.equal(await page.locator('#m06-insights-trend li').count(), 7);
    assert.equal((await page.locator('#m06-insights-trend').innerText()).includes('LOCAL admin test draft'), false);
    await page.locator('#m06-review-filter').selectOption('older-seven-days');
    assert.equal(await page.locator('#m06-review-list li').count(), 0);
    await page.locator('#m06-review-filter').selectOption('all');
    assert.equal(await page.locator('#m06-review-list li').count(), 1);
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
    assert.equal(await page.locator('#m06-review-list li').count(), 0);
    assert.equal(await page.locator('#m06-review-count').textContent(), 'UNAVAILABLE');
    assert.equal(await page.locator('#m06-insights-status').textContent(), 'UNAVAILABLE');
    assert.equal(await page.locator('#m06-insights-scope').textContent(), 'UNAVAILABLE');
    assert.equal(await page.locator('#m06-insights-missing').textContent(), 'Unavailable');
    assert.equal(await page.locator('#m06-insights-older').textContent(), 'Unavailable');
    assert.equal(await page.locator('#m06-insights-recent').textContent(), 'Unavailable');
    assert.equal(await page.locator('#m06-insights-trend li').count(), 0);
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
      assert.equal(await page.locator('#m06-review-list li').count(), 0, 'review queue scrubs after 401');
      assert.equal(await page.locator('#m06-review-count').textContent(), 'UNAVAILABLE');
      assert.equal(await page.locator('#m06-triage-list li').count(), 0, 'private triage must scrub after 401');
      assert.equal(await page.locator('#m06-triage-count').textContent(), 'UNAVAILABLE');
      assert.equal(await page.locator('#m06-triage-filter').inputValue(), 'all');
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

test('M06-C private review queue filters listed drafts and preserves protected editor discard rules', { timeout: 120_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless:true, admin:true });
  try {
    const page=preview.page;
    assert.equal(await page.locator('#m06-dashboard').isVisible(),false);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20_000});
    async function save(title, credit) {
      await page.locator('#new-draft').click();
      await page.locator('[name="title"]').fill(title);
      await page.locator('[name="summary"]').fill('Synthetic editorial review only, never published');
      await page.locator('[name="body"]').fill('LOCAL_PRIVATE_BODY_NEVER_IN_QUEUE');
      await page.locator('[name="sourceUrl"]').fill('https://example.org/mock-source');
      await page.locator('[name="authorLabel"]').fill(credit);
      await page.locator('#save').click();
      await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20_000});
    }
    await save('Queue missing credit article','');
    await save('Queue credited test article','Synthetic Author');
    assert.equal(await page.locator('#m06-review-list li').count(),2);
    assert.match(await page.locator('#m06-review-list').innerText(),/CREDIT_MISSING/);
    assert.match(await page.locator('#m06-review-list').innerText(),/SOURCE_VERIFICATION_PENDING/);
    assert.doesNotMatch(await page.locator('#m06-review-list').innerText(),/LOCAL_PRIVATE_BODY_NEVER_IN_QUEUE/);
    assert.equal(await page.locator('#m06-triage-status').textContent(), 'MEASURED_LOCAL');
    assert.equal(await page.locator('#m06-triage-credit').textContent(), '1');
    assert.equal(await page.locator('#m06-triage-aged').textContent(), '0');
    assert.equal(await page.locator('#m06-triage-both').textContent(), '0');
    assert.equal(await page.locator('#m06-triage-list li').count(), 2);
    assert.match(await page.locator('#m06-triage-list li').first().innerText(), /Queue missing credit article/);
    assert.match(await page.locator('#m06-triage-list').innerText(), /SOURCE_VERIFICATION_PENDING/);
    assert.doesNotMatch(await page.locator('#m06-triage-list').innerText(),/LOCAL_PRIVATE_BODY_NEVER_IN_QUEUE/);
    await page.locator('#m06-triage-filter').selectOption('both');
    assert.equal(await page.locator('#m06-triage-list li').count(), 0);
    await page.locator('#m06-triage-filter').selectOption('missing-credit');
    assert.equal(await page.locator('#m06-triage-list li').count(), 1);
    await page.locator('#m06-triage-list').getByRole('button',{name:/Queue missing credit article/}).click();
    await page.getByText('Loaded draft revision 1').waitFor({timeout:20_000});
    await page.locator('#m06-triage-filter').selectOption('all');
    assert.equal(await page.locator('#m06-triage-list li').count(), 2);
    await page.locator('#m06-review-filter').selectOption('missing-credit');
    assert.equal(await page.locator('#m06-review-list li').count(),1);
    assert.match(await page.locator('#m06-review-list').innerText(),/Queue missing credit article/);
    await page.locator('#m06-review-filter').selectOption('revised');
    assert.equal(await page.locator('#m06-review-list li').count(),0);
    await page.locator('#m06-review-filter').selectOption('all');
    await page.locator('#m06-review-list').getByRole('button',{name:/Queue missing credit article/}).click();
    await page.getByText('Loaded draft revision 1').waitFor({timeout:20_000});
    await page.locator('[name="title"]').fill('Unsaved queue edited title');
    page.once('dialog', async dialog=>{assert.match(dialog.message(),/Discard unsaved changes/);await dialog.dismiss();});
    await page.locator('#m06-review-list').getByRole('button',{name:/Queue credited test article/}).click();
    assert.equal(await page.locator('[name="title"]').inputValue(),'Unsaved queue edited title');
    await page.locator('#logout').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20_000});
    assert.equal(await page.locator('#m06-dashboard').isVisible(),false);
    assert.equal(await page.locator('#m06-review-list li').count(),0);
    assert.equal(await page.locator('#m06-review-count').textContent(),'UNAVAILABLE');
    assert.equal(await page.locator('#m06-review-filter').inputValue(),'all');
    assert.equal(await page.locator('#m06-triage-list li').count(),0);
    assert.equal(await page.locator('#m06-triage-count').textContent(),'UNAVAILABLE');
    assert.equal(await page.locator('#m06-triage-credit').textContent(),'Unavailable');
    assert.equal(await page.locator('#m06-triage-filter').inputValue(),'all');
    assert.equal(preview.networkAttempts.filter(x=>!x.allowed).length,0);
  } finally { await preview.close(); }
});

test('M06 Owner queue shows only current revision process decisions and scrubs after logout', {timeout:120000}, async () => {
  const preview = await startLocalCmsPreview({headless:true,admin:true});
  try {
    const page = preview.page;
    assert.equal(await page.locator('#m06-review-unreviewed').isVisible(),false);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20000});
    await page.locator('[name="title"]').fill('Synthetic Owner queue handoff title');
    await page.locator('[name="summary"]').fill('Private synthetic process review queue never authorizes publishing');
    await page.locator('[name="body"]').fill('PRIVATE_OWNER_BODY_NEVER_IN_QUEUE');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/private-queue');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({timeout:20000});
    await page.waitForFunction(() => globalThis.document.querySelector('#m06-review-unreviewed')?.textContent === '1');
    await page.locator('#m06-review-filter').selectOption('current-unreviewed');
    assert.equal(await page.locator('#m06-review-list li').count(),1);
    await page.locator('#m06-review-filter').selectOption('private-preview-reviewed');
    assert.equal(await page.locator('#m06-review-list li').count(),0);
    await page.locator('#owner-review-note').fill('Local review only; no verified sources, licences or publication.');
    page.once('dialog', dialog=>dialog.accept());
    await page.locator('#owner-review-submit').click();
    await page.waitForFunction(() => globalThis.document.querySelector('#m06-review-previewed')?.textContent === '1');
    assert.equal(await page.locator('#m06-review-unreviewed').textContent(),'0');
    assert.equal(await page.locator('#m06-review-list li').count(),1);
    assert.match(await page.locator('#m06-review-list').innerText(),/PRIVATE_PREVIEW_REVIEWED/u);
    assert.doesNotMatch(await page.locator('#m06-review-list').innerText(),/Local review only|PRIVATE_OWNER_BODY_NEVER_IN_QUEUE/u);
    await page.locator('[name="title"]').fill('Synthetic Owner queue revised title');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 2; not published').waitFor({timeout:20000});
    await page.waitForFunction(() => globalThis.document.querySelector('#m06-review-unreviewed')?.textContent === '1');
    assert.equal(await page.locator('#m06-review-previewed').textContent(),'0');
    assert.equal(await page.locator('#m06-review-list li').count(),0);
    await page.locator('#owner-review-decision').selectOption('CHANGES_REQUESTED');
    await page.locator('#owner-review-note').fill('New revision requires changes and remains strictly private.');
    page.once('dialog', dialog=>dialog.accept());
    await page.locator('#owner-review-submit').click();
    await page.waitForFunction(() => globalThis.document.querySelector('#m06-review-changes')?.textContent === '1');
    await page.locator('#m06-review-filter').selectOption('private-changes-requested');
    assert.equal(await page.locator('#m06-review-list li').count(),1);
    const listing = await page.evaluate(() => fetch('/admin/articles').then(r=>r.json()));
    assert.equal(listing.drafts[0].current_review_decision,'CHANGES_REQUESTED');
    assert.equal(listing.drafts[0].status,'draft');
    assert.ok(!JSON.stringify(listing).includes('New revision requires changes'));
    await page.locator('#logout').click();
    await page.getByText('Not authenticated',{exact:true}).waitFor({timeout:20000});
    assert.equal(await page.locator('#m06-review-unreviewed').textContent(),'UNAVAILABLE');
    assert.equal(await page.locator('#m06-review-previewed').textContent(),'UNAVAILABLE');
    assert.equal(await page.locator('#m06-review-changes').textContent(),'UNAVAILABLE');
    assert.equal(await page.locator('#m06-review-list li').count(),0);
    assert.equal(await page.evaluate(() => fetch('/admin/articles').then(r=>r.status)),401);
    assert.equal(preview.networkAttempts.filter(x=>!x.allowed).length,0);
  } finally { await preview.close(); }
});
test('M03 to M05 local Owner source report is inspected, applied only on explicit click and never auto-saved', { timeout: 120_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless: true, admin: true });
  try {
    const page = preview.page;
    const file = page.locator('#source-transfer-file');
    assert.equal(await file.isVisible(), false, 'unsigned visitor cannot access protected editor');
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 0);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    const source = page.locator('[name="sourceUrl"]');
    const canonical = createMockSourceTransfer(listSyntheticSources().items[0]);
    const payload = JSON.stringify(canonical);
    const upload = async (content, name = 'coinblink-m03-demo-source-alpha.json') => {
      await file.setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(content) });
    };
    await upload(JSON.stringify({ ...canonical, rights: 'APPROVED' }));
    await page.getByText('Rejected: report differs from the three known fictional sources.').waitFor();
    assert.equal(await page.locator('#source-transfer-apply').isDisabled(), true);
    await upload(payload);
    await page.getByText('Inspected only. Click Apply to change the unsaved source field.').waitFor();
    assert.match(await page.locator('#source-transfer-review').innerText(), /NOT_CLEARED.*NOT_CAPTURED.*NO_DIGEST/u);
    assert.equal(await source.inputValue(), '', 'inspecting must not modify editor fields');
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 0,
      'no D1 write occurs on read');
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#source-transfer-apply').click();
    await page.getByText('Application canceled; no form field changed.').waitFor();
    assert.equal(await source.inputValue(), '');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#source-transfer-apply').click();
    await page.getByText(/MOCK source inserted in the form only/).waitFor();
    assert.equal(await source.inputValue(), canonical.originUrl);
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 0,
      'explicit Apply must not issue a D1 write');
    // Full local continuation: Owner chooses to save after the safe Apply, then
    // downloads the already-existing canonical M05 Markdown for M02.
    await page.locator('[name="title"]').fill('Offline M03 to M05 to M02 demonstration');
    await page.locator('[name="summary"]').fill('Unverified synthetic source report, saved only after explicit action.');
    await page.locator('[name="body"]').fill('No rights or verified evidence. Local only.');
    await page.locator('[name="authorLabel"]').fill('Synthetic Owner');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20_000 });
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1,
      'only the explicit Save action persists one synthetic draft');
    const [exported] = await Promise.all([
      page.waitForEvent('download'),
      (async () => {
        page.once('dialog', dialog => dialog.accept());
        await page.locator('#export-draft').click();
      })(),
    ]);
    const markdown = readFileSync(await exported.path(), 'utf8');
    const parsed = parseLocalDraftMarkdown(markdown);
    assert.equal(parsed.source, canonical.originUrl);
    assert.equal(parsed.title, 'Offline M03 to M05 to M02 demonstration');
    assert.equal(parsed.ready, true);
    assert.match(markdown, /WORKING DRAFT ONLY.*Not checked, approved, or published/u);
    await upload(payload);
    await page.getByText('Inspected only. Click Apply to change the unsaved source field.').waitFor();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#new-draft').click();
    assert.equal(await page.locator('#source-transfer-review').isVisible(), false,
      'new draft must scrub previously inspected report');
    assert.equal(await page.locator('#source-transfer-apply').isDisabled(), true);
    assert.equal(await source.inputValue(), '');
    await upload(payload);
    await page.getByText('Inspected only. Click Apply to change the unsaved source field.').waitFor();
    await page.locator('#logout').click();
    await page.getByText('Not authenticated', { exact: true }).waitFor();
    assert.equal(await file.isVisible(), false);
    assert.equal(await file.inputValue(), '');
    assert.equal(await page.locator('#source-transfer-review').textContent(), '');
    assert.equal(await page.locator('#source-transfer-apply').isDisabled(), true);
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n, 1);
    assert.equal(preview.networkAttempts.filter(event => !event.allowed).length, 0);
  } finally { await preview.close(); }
});

test('M05 LOCAL Owner can inspect immutable per-revision review history; logout scrubs notes', { timeout: 120_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless: true, admin: true });
  try {
    const page = preview.page;
    assert.equal(await page.locator('#owner-review').isVisible(), false);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    await page.locator('[name="title"]').fill('Synthetic first review history title');
    await page.locator('[name="summary"]').fill('Fictional local editorial note history summary');
    await page.locator('[name="body"]').fill('PRIVATE_LOCAL_ARTICLE_BODY');
    await page.locator('[name="sourceUrl"]').fill('https://example.org/history');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20_000 });
    await page.locator('#owner-review').waitFor({ state:'visible', timeout:20_000 });
    await page.locator('#owner-review-note').fill('FIRST_PRIVATE_LOCAL_NOTE <img src=x onerror=alert(1)>');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#owner-review-submit').click();
    await page.getByText('Saved Owner review of LOCAL revision 1').waitFor({ timeout:20_000 });
    await page.locator('#owner-review-history-panel').evaluate(node => { node.open = true; });
    assert.equal(await page.locator('#owner-review-history li').count(), 1);
    assert.match(await page.locator('#owner-review-history').innerText(), /Revision 1 \(current\).*FIRST_PRIVATE_LOCAL_NOTE/u);
    assert.equal(await page.locator('#owner-review-history img').count(), 0, 'private review text is never HTML');

    await page.locator('[name="title"]').fill('Synthetic second review history title');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 2; not published').waitFor({ timeout:20_000 });
    await page.locator('#owner-review-status').getByText('No review for LOCAL revision 2', { exact:false }).waitFor({ timeout:20_000 });
    assert.equal(await page.locator('#owner-review-history li').count(), 1);
    assert.match(await page.locator('#owner-review-history').innerText(), /Revision 1 \(superseded\)/u);
    await page.locator('#owner-review-decision').selectOption('CHANGES_REQUESTED');
    await page.locator('#owner-review-note').fill('SECOND_PRIVATE_LOCAL_NOTE requires edits.');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#owner-review-submit').click();
    await page.getByText('Saved Owner review of LOCAL revision 2').waitFor({ timeout:20_000 });
    assert.equal(await page.locator('#owner-review-history li').count(), 2);
    assert.match(await page.locator('#owner-review-history li').first().innerText(), /Revision 2 \(current\).*CHANGES_REQUESTED/u);
    assert.match(await page.locator('#owner-review-history li').last().innerText(), /Revision 1 \(superseded\)/u);
    assert.equal((await preview.db.prepare('SELECT status FROM cms_drafts').first()).status, 'draft');
    await page.locator('#logout').click();
    await page.getByText('Not authenticated', { exact: true }).waitFor({ timeout:20_000 });
    assert.equal(await page.locator('#owner-review-history li').count(), 0);
    assert.equal(await page.locator('#owner-review').isVisible(), false);
    assert.equal(await page.locator('#owner-review-note').inputValue(), '');
    assert.equal(await page.evaluate(() => fetch('/admin/articles').then(r => r.status)), 401);
    assert.deepEqual(preview.networkAttempts.filter(q => !q.allowed), []);
  } finally {
    await preview.close();
  }
});

test('M08 to M05 LOCAL Owner explicitly appends offline blockers to an unsaved body only', { timeout: 120_000 }, async () => {
  const preview = await startLocalCmsPreview({ headless:true, admin:true });
  try {
    const page = preview.page;
    const input = page.locator('#research-transfer-file');
    const apply = page.locator('#research-transfer-apply');
    assert.equal(await input.isVisible(), false, 'protected M08 handoff hidden before synthetic login');
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({timeout:20000});
    const body = page.locator('[name="body"]');
    await body.fill('PRIVATE_OWNER_ORIGINAL_COPY');
    const packet = createMockResearchTransfer('demo-source-alpha','BTC');
    const upload = content => input.setInputFiles({
      name:'coinblink-m08-demo-source-alpha-btc.json',
      mimeType:'application/json',
      buffer:Buffer.from(content,'utf8'),
    });
    await upload(JSON.stringify({...packet,rights:'CLEARED'}));
    await page.getByText('Rejected: report is not an exact canonical M08 offline brief.').waitFor();
    assert.equal(await apply.isDisabled(),true);
    assert.equal(await body.inputValue(),'PRIVATE_OWNER_ORIGINAL_COPY');
    await upload(JSON.stringify(packet));
    await page.getByText(/Inspected M08 MOCK brief only/).waitFor();
    assert.match(await page.locator('#research-transfer-review').innerText(),/8 blocked checks.*NOT_CLEARED/u);
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n,0);
    page.once('dialog', dialog => dialog.dismiss());
    await apply.click();
    await page.getByText('Application canceled; no draft field changed.').waitFor();
    assert.equal(await body.inputValue(),'PRIVATE_OWNER_ORIGINAL_COPY');
    page.once('dialog', dialog => dialog.accept());
    await apply.click();
    await page.getByText(/M08 MOCK blockers appended to the unsaved article body only/).waitFor();
    const text = await body.inputValue();
    assert.match(text,/^PRIVATE_OWNER_ORIGINAL_COPY\n\n\[COINBLINK M08 OFFLINE MOCK RESEARCH/u);
    assert.match(text,/SOURCE\/URL=/u);
    assert.match(text,/MARKET\/RIGHTS_NOT_CLEARED=/u);
    assert.equal((await preview.db.prepare('SELECT COUNT(*) AS n FROM cms_drafts').first()).n,0,
      'Only the separate pre-existing Save action can write local D1');
    await upload(JSON.stringify(packet));
    await page.getByText(/Inspected M08 MOCK brief only/).waitFor();
    await apply.click();
    await page.getByText(/M08 note is duplicated, exceeds body limit or is invalid/).waitFor();
    assert.equal((await body.inputValue()).split('[COINBLINK M08 OFFLINE MOCK RESEARCH').length,2);
    await upload(JSON.stringify(packet));
    await page.getByText(/Inspected M08 MOCK brief only/).waitFor();
    await page.locator('#refresh').click();
    await page.getByText('Local test session active').waitFor();
    await apply.click();
    await page.getByText(/Stale M08 brief selection/).waitFor();
    await upload(JSON.stringify(packet));
    await page.getByText(/Inspected M08 MOCK brief only/).waitFor();
    await page.locator('#logout').click();
    await page.getByText('Not authenticated', {exact:true}).waitFor();
    assert.equal(await input.isVisible(),false);
    assert.equal(await input.inputValue(),'');
    assert.equal(await apply.isDisabled(),true);
    assert.equal(await page.locator('#research-transfer-review').textContent(),'');
    assert.equal(await body.inputValue(),'');
    assert.deepEqual(preview.networkAttempts.filter(x=>!x.allowed),[]);
  } finally {
    await preview.close();
  }
});

test('M02 P1 Owner article presentation is private, inert, saved-revision-only and scrubbed', { timeout: 120_000 }, async () => {
  const cms = await startLocalCmsPreview({ headless: true, admin: true });
  try {
    const page = cms.page;
    const trigger = page.locator('#m02-owner-article-trigger');
    const article = page.locator('#m02-owner-article');
    assert.equal(await trigger.isVisible(), false, 'anonymous visitor has no preview action');
    assert.equal(await article.isVisible(), false);
    await page.locator('#login').click();
    await page.getByText('Local test session active').waitFor({ timeout: 20_000 });
    await page.locator('[name="title"]').fill('LOCAL article <script>alert(1)</script>');
    await page.locator('[name="summary"]').fill('Synthetic summary about a never-published draft.');
    await page.locator('[name="body"]').fill('Long synthetic body with <img src=x onerror=alert(1)> safely represented as text in the article.');
    await page.locator('[name="sourceUrl"]').fill('https://example.test/fictional');
    await page.locator('[name="authorLabel"]').fill('Synthetic Owner');
    assert.equal(await trigger.isVisible(), false, 'unsaved draft cannot be presented');
    await page.locator('#save').click();
    await page.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20_000 });
    assert.equal(await trigger.isEnabled(), true);
    const dbBefore = await cms.db.prepare('SELECT id,revision,body FROM cms_drafts').all();
    await trigger.click();
    await article.waitFor({ state: 'visible', timeout: 15_000 });
    assert.equal(await article.locator('#m02-owner-title').textContent(), 'LOCAL article <script>alert(1)</script>');
    assert.match(await article.locator('#m02-owner-body').textContent(), /<img src=x onerror=alert\(1\)>/u);
    assert.equal(await article.locator('script,img,iframe').count(), 0, 'draft markup never becomes DOM');
    assert.match(await article.innerText(), /NOT VERIFIED.*NOT PUBLISHED/u);
    assert.deepEqual((await cms.db.prepare('SELECT id,revision,body FROM cms_drafts').all()).results, dbBefore.results, 'preview never writes D1');
    await page.locator('[name="body"]').fill('Unsaved change should remove prior preview at once');
    assert.equal(await article.isVisible(), false, 'unsaved form invalidates private preview');
    assert.equal(await trigger.isDisabled(), true);
    await page.locator('#logout').click();
    await page.getByText('Not authenticated', { exact: true }).waitFor();
    assert.equal(await article.isVisible(), false);
    assert.equal(await article.locator('#m02-owner-body').textContent(), '', 'logout scrubs private body');
    assert.equal(await trigger.isVisible(), false);
    assert.deepEqual(cms.networkAttempts.filter(event => !event.allowed), [], 'no off-origin egress');
  } finally {
    await cms.close();
  }
});
