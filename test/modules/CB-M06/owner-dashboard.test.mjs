import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLocalOwnerDashboard, createLocalEditorialActivity, createLocalReviewQueue, OWNER_DASHBOARD_MODE, OWNER_DASHBOARD_SOURCE,
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

const editorialRow = (id, revision, updatedAtSeconds, title = 'Private example') => ({
  id: String(id).padStart(36, '0'), title, status: 'draft', revision,
  updated_at: updatedAtSeconds,
  body: 'NEVER_INCLUDE_IN_ACTIVITY', summary: 'PRIVATE_SUMMARY',
});

test('M06-B summarizes LOCAL revisions, UTC Unix seconds and recent order without body or summary', () => {
  const rows = [
    editorialRow(1, 1, 1760870000, 'Initial fictional draft'),
    editorialRow(2, 3, 1760870100, 'Revised fictional draft'),
    editorialRow(3, 2, 1760870050, 'Second revision draft'),
  ];
  const result = createLocalEditorialActivity(rows);
  assert.equal(result.status, 'MEASURED_LOCAL');
  assert.equal(result.listingScope, 'MEASURED_LOCAL');
  assert.equal(result.revisedListedDraftsCount, 2);
  assert.equal(result.lastUpdatedUTC, new Date(1760870100 * 1000).toISOString());
  assert.deepEqual(result.recent.map(row => row.title),
    ['Revised fictional draft', 'Second revision draft', 'Initial fictional draft']);
  assert.equal(result.recent[0].revision, 3);
  assert.equal(result.recent[0].updatedAtUTC, result.lastUpdatedUTC);
  assert.equal(result.mode, 'LOCAL_SYNTHETIC');
  assert.equal(result.source, 'CMS_D1_LOCAL');
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.recent) &&
    Object.isFrozen(result.recent[0]));
  assert.doesNotMatch(JSON.stringify(result), /NEVER_INCLUDE_IN_ACTIVITY|PRIVATE_SUMMARY/);
  const empty = createLocalEditorialActivity([]);
  assert.equal(empty.revisedListedDraftsCount, 0);
  assert.equal(empty.lastUpdatedUTC, null);
  assert.equal(empty.recent.length, 0);
});

test('M06-B never presents a full-table count from the 100-row local listing cap', () => {
  const hundred = Array.from({length:100}, (_, i) => editorialRow(i, i%2 ? 2 : 1, 1760870000 + i));
  const model = createLocalEditorialActivity(hundred);
  assert.equal(model.listingScope, 'UP_TO_100_LISTED');
  assert.equal(model.revisedListedDraftsCount, 50);
  assert.equal(model.recent.length, 5);
  assert.deepEqual(model.recent.map(x=>x.id), hundred.slice(-5).reverse().map(x=>x.id));
});

test('M06-B fails closed on bad D1 metadata, duplicate IDs, wrong status and invalid timestamps', () => {
  const valid = editorialRow(1, 1, 1760870000);
  for (const data of [null, {}, [null], [42], new Array(101).fill(valid),
    [valid,valid], [{...valid,id: 'not-a-uuid'}],
    [{...valid,title:'bad'}], [{...valid,title:'X'.repeat(141)}],
    [{...valid,status:'published'}], [{...valid,revision:0}],
    [{...valid,revision:1.5}], [{...valid,updated_at:undefined}],
    [{...valid,updated_at:NaN}], [{...valid,updated_at:-1}],
    [{...valid,updated_at:1760870000000}], [{...valid,updated_at:'1760870000'}]]) {
    assert.throws(() => createLocalEditorialActivity(data), TypeError);
  }
});

test('M06-B UI is non-public, uses textContent, reuses GET & scrubs and guards responses', () => {
  const html = renderLocalCmsUi('cd'.repeat(32));
  assert.match(html, /id="m06-dashboard"[^>]*hidden/u);
  assert.match(html, /id="m06-activity-status"/u);
  assert.match(html, /id="m06-activity-scope"/u);
  assert.match(html, /id="m06-recent-activity"/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /createLocalEditorialActivity\(drafts\)/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /ui\.recentActivity\.replaceChildren\(\)/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /button\.textContent = row\.title/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /epoch !== sessionEpoch/u);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT, /\/local\/dashboard|\/admin\/dashboard|localStorage|sessionStorage/u);
});

test('M06-C review queue is bounded, sorted, labels credits and never verifies source licensing', () => {
  const rows = [
    {...editorialRow(1,1,1760870000,'First LOCAL draft'),author_label:'',source_url:'https://example.org/source'},
    {...editorialRow(2,3,1760870100,'Second LOCAL draft'),author_label:'   ',source_url:'https://example.org/different'},
    {...editorialRow(3,2,1760870050,'Third LOCAL draft'),author_label:'Named tester',source_url:'https://example.org/source'},
  ];
  const q = createLocalReviewQueue(rows);
  assert.equal(q.mode, 'LOCAL_SYNTHETIC');
  assert.equal(q.source, 'CMS_D1_LOCAL');
  assert.equal(q.status, 'MEASURED_LOCAL');
  assert.equal(q.totalListed, 3);
  assert.equal(q.missingCreditListed, 2);
  assert.deepEqual(q.rows.map(r=>r.title),['Second LOCAL draft','Third LOCAL draft','First LOCAL draft']);
  assert.equal(q.rows[0].creditStatus, 'CREDIT_MISSING');
  assert.equal(q.rows[2].creditStatus, 'CREDIT_MISSING');
  assert.equal(q.rows[1].creditStatus, 'CREDIT_PRESENT_UNVERIFIED');
  for(const row of q.rows) {
    assert.equal(row.sourceStatus,'SOURCE_VERIFICATION_PENDING');
    assert.equal(row.publishingStatus,'DRAFT_ONLY');
  }
  assert.ok(Object.isFrozen(q) && Object.isFrozen(q.rows) && Object.isFrozen(q.rows[0]));
  assert.doesNotMatch(JSON.stringify(q), /PRIVATE_SUMMARY|NEVER_INCLUDE_IN_ACTIVITY|example\.org|Named tester/);
});
test('M06-C rejects bad review metadata and marks 100-row view partial', () => {
  const good = {...editorialRow(1,1,1760870000),author_label:'',source_url:'https://example.org/a'};
  for(const item of [
    {...good,author_label:null},{...good,author_label:5},
    {...good,author_label:'X'.repeat(81)},
    {...good,source_url:null},{...good,source_url:99},
    {...good,source_url:'https://x.test/'+ 'a'.repeat(500)},
    {...good,status:'published'}, {...good,revision:0},
    {...good,updated_at:1760870000000},
  ]) assert.throws(()=>createLocalReviewQueue([item]),TypeError);
  assert.throws(()=>createLocalReviewQueue([good,good]),TypeError);
  assert.throws(()=>createLocalReviewQueue(Array.from({length:101},(_,i)=>({
    ...good,id:String(i).padStart(36,'0')
  }))),TypeError);
  const hundred=Array.from({length:100},(_,i)=>({...good,id:String(i).padStart(36,'0')}));
  const q=createLocalReviewQueue(hundred);
  assert.equal(q.listingScope,'UP_TO_100_LISTED');
  assert.equal(q.rows.length,100);
  assert.equal(q.totalListed,100);
  assert.equal(createLocalReviewQueue([]).totalListed,0);
});
test('M06-C review queue is protected DOM-only and clears on logout or denied refresh', () => {
  const html=renderLocalCmsUi('ee'.repeat(32));
  assert.match(html,/id="m06-dashboard"[^>]*hidden/u);
  assert.match(html,/id="m06-review-filter"/u);
  assert.match(html,/id="m06-review-list"/u);
  assert.match(html,/id="m06-review-count"/u);
  assert.match(html,/SOURCE_VERIFICATION_PENDING|independent verification/u);
  assert.match(LOCAL_CMS_UI_SCRIPT,/createLocalReviewQueue\(drafts\)/u);
  assert.match(LOCAL_CMS_UI_SCRIPT,/ui\.reviewList\.replaceChildren\(\)/u);
  assert.match(LOCAL_CMS_UI_SCRIPT,/labels\.textContent = /u);
  assert.match(LOCAL_CMS_UI_SCRIPT,/readGeneration/u);
  assert.match(LOCAL_CMS_UI_SCRIPT,/epoch !== sessionEpoch \|\| generation !== readGeneration/u);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT,/\/local\/review|\/admin\/review|localStorage|sessionStorage|innerHTML/u);
});
