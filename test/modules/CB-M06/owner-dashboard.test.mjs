import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLocalOwnerDashboard, OWNER_DASHBOARD_MODE, OWNER_DASHBOARD_SOURCE,
  OWNER_DASHBOARD_LIST_LIMIT } from '../../../src/modules/CB-M06/owner-dashboard.mjs';
import { renderLocalCmsUi, LOCAL_CMS_UI_SCRIPT } from '../../../src/modules/CB-M05/p1c-local/local-cms-ui.mjs';

const asOf = '2026-10-19T15:00:00.000Z';

test('M06 counts only authenticated list rows, preserving no draft titles or private metadata', () => {
  const rows = [{ id: 'synthetic-1', title: 'private test headline', body: 'private text' }];
  const model = createLocalOwnerDashboard(rows, asOf);
  assert.equal(OWNER_DASHBOARD_MODE, 'LOCAL_SYNTHETIC');
  assert.equal(OWNER_DASHBOARD_SOURCE, 'CMS_D1_LOCAL');
  assert.equal(OWNER_DASHBOARD_LIST_LIMIT, 100);
  assert.deepEqual(model, {
    mode: 'LOCAL_SYNTHETIC', source: 'CMS_D1_LOCAL', asOfUTC: asOf,
    listedDraftsCount: 1, listingLimit: 100, draftsStatus: 'MEASURED_LOCAL',
    newsStatus: 'NOT_CONNECTED', sourcesStatus: 'NOT_CLEARED',
    marketsStatus: 'UNAVAILABLE', publishingStatus: 'DISABLED',
  });
  assert.ok(Object.isFrozen(model));
  assert.doesNotMatch(JSON.stringify(model), /private|headline|synthetic-1|secret|cookie/i);
  assert.equal(createLocalOwnerDashboard([], asOf).listedDraftsCount, 0);
  assert.equal(createLocalOwnerDashboard(Array.from({ length: 100 }, () => ({})), asOf).listedDraftsCount, 100);
});

test('M06 refuses invalid or unbounded data and fabricated observation times', () => {
  for (const value of [null, {}, { drafts: [] }, 7, [null], [false],
    Array.from({ length: 101 }, () => ({}))]) {
    assert.throws(() => createLocalOwnerDashboard(value, asOf), TypeError);
  }
  for (const value of ['', 'NOW', '2026-10-19', '2026-02-30T15:00:00.000Z', null]) {
    assert.throws(() => createLocalOwnerDashboard([], value), TypeError);
  }
});

test('M06 LOCAL panel is hidden before authentication and uses nonce-CSP, existing list and no private endpoint', () => {
  const ui = renderLocalCmsUi('ab'.repeat(32));
  assert.match(ui, /id="m06-dashboard"[^>]*hidden/u);
  assert.match(ui, /id="m06-listed-drafts"/u);
  assert.match(ui, /Listed drafts \(up to 100\)/u);
  assert.match(ui, /MEASURED_LOCAL/u);
  assert.match(ui, /NOT_CONNECTED/u);
  assert.match(ui, /NOT_CLEARED/u);
  assert.match(ui, /UNAVAILABLE/u);
  assert.match(ui, /DISABLED/u);
  assert.match(ui, /script nonce="[a-f0-9]{64}" type="module"/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /createLocalOwnerDashboard\(drafts, new Date\(\)\.toISOString\(\)\)/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /ui\.dashboard\.hidden = true/u);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT, /fetch\(['"]\/(?:local|admin)\/dashboard/u);
  const publicAdmin = readFileSync('src/pages/admin/[...route].js', 'utf8');
  assert.match(publicAdmin, /!import\.meta\.env\.DEV/u);
  const router = readFileSync('src/modules/CB-M05/p1c-local/local-admin-router.mjs', 'utf8');
  assert.doesNotMatch(router, /\/admin\/dashboard/u);
});
