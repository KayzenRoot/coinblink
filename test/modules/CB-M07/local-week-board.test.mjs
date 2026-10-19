import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLocalCalendarIdea } from '../../../src/modules/CB-M07/local-calendar.mjs';
import { createLocalWeeklyBoard } from '../../../src/modules/CB-M07/local-week-board.mjs';
import { renderLocalCmsUi, LOCAL_CMS_UI_SCRIPT } from '../../../src/modules/CB-M05/p1c-local/local-cms-ui.mjs';

/** Build an immutable fixture that intentionally includes private fields for leak tests. */
const draft = (number, title = 'Hypothetical private editorial title') => Object.freeze({
  id: '00000000-0000-0000-0000-' + String(number).padStart(12, '0'),
  title, summary: 'Entirely fictional and unlicensed local sample.',
  source_url: 'https://example.org/fiction', author_label: '',
  status: 'draft', revision: 1, updated_at: 1760870000,
  body: 'SECRET_BODY_MUST_NOT_LEAK', secret: 'SECRET_VALUE_MUST_NOT_LEAK',
});
/** Convert a test draft to the exact M07-C synthetic calendar contract. */
const idea = (number, channel, minute, title) =>
  createLocalCalendarIdea(draft(number, title), channel, minute, 'UTC');

test('M07-D week groups weekdays, crosses new year and keeps empty weekdays', () => {
  const first = idea(1, 'x', '2026-12-31T23:00', 'Thursday fictional headline');
  const second = idea(2, 'instagram', '2027-01-01T00:30', 'Friday fictional headline');
  const board = createLocalWeeklyBoard([second, first], 'all', 'UTC');
  assert.equal(board.totalCount, 2);
  assert.equal(board.visibleCount, 2);
  assert.equal(board.collisionSlots, 0);
  assert.equal(board.weeks.length, 1);
  assert.equal(board.weeks[0].startDate, '2026-12-28');
  assert.equal(board.weeks[0].endDate, '2027-01-03');
  assert.equal(board.weeks[0].days.length, 7);
  assert.equal(board.weeks[0].days[3].ideas[0].title, first.title);
  assert.equal(board.weeks[0].days[4].ideas[0].title, second.title);
  assert.equal(board.weeks[0].days[0].ideas.length, 0);
});

test('M07-D week membership follows selected timezone, including local boundary', () => {
  const item = idea(1, 'x', '2026-11-16T00:30', 'Monday UTC hypothetical title');
  const utc = createLocalWeeklyBoard([item], 'all', 'UTC');
  const ny = createLocalWeeklyBoard([item], 'all', 'America/New_York');
  assert.equal(utc.weeks[0].startDate, '2026-11-16');
  assert.equal(utc.weeks[0].days[0].ideas[0].localTime, '00:30');
  assert.equal(ny.weeks[0].startDate, '2026-11-09');
  assert.equal(ny.weeks[0].days[6].ideas[0].localDate, '2026-11-15');
  assert.equal(ny.weeks[0].days[6].ideas[0].localTime, '19:30');
  assert.equal(createLocalWeeklyBoard([item], 'all', 'America/Sao_Paulo')
    .weeks[0].days[6].ideas[0].localTime, '21:30');
});

test('M07-D filter is read-only and collisions require same UTC minute and channel', () => {
  const a = idea(1, 'x', '2026-11-20T12:00', 'Draft one hypothetical title');
  const b = idea(2, 'x', '2026-11-20T12:00', 'Draft two hypothetical title');
  const c = idea(3, 'instagram', '2026-11-20T12:00', 'Distinct channel sample title');
  const d = idea(4, 'x', '2026-11-20T12:01', 'Distinct minute sample title');
  const items = Object.freeze([d, c, a, b]);
  const all = createLocalWeeklyBoard(items, 'all', 'UTC');
  const x = createLocalWeeklyBoard(items, 'x', 'UTC');
  const instagram = createLocalWeeklyBoard(items, 'instagram', 'UTC');
  assert.equal(all.visibleCount, 4);
  assert.equal(all.collisionSlots, 1);
  assert.equal(x.visibleCount, 3);
  assert.equal(x.collisionSlots, 1);
  assert.equal(instagram.visibleCount, 1);
  assert.equal(instagram.collisionSlots, 0);
  const rows = all.weeks[0].days[4].ideas;
  assert.deepEqual(rows.map(row => row.channel), ['instagram','x','x','x']);
  assert.deepEqual(rows.map(row => row.collision), [false,true,true,false]);
  assert.equal(items.length, 4);
  assert.equal(items[0], d);
  assert.ok(Object.isFrozen(all));
  assert.ok(Object.isFrozen(all.weeks));
  assert.ok(Object.isFrozen(all.weeks[0]));
  assert.ok(Object.isFrozen(rows));
  assert.ok(Object.isFrozen(rows[0]));
  assert.ok(Object.isFrozen(all.weeks[0].days[4]));
});

test('M07-D invalid contracts, limits and duplicates fail closed', () => {
  const valid = idea(1, 'tiktok', '2026-11-20T12:00', 'Approved fictional editorial title');
  for (const bad of [null, {}, [...Array(21)].map(() => valid)]) {
    assert.throws(() => createLocalWeeklyBoard(bad), TypeError);
  }
  for (const filter of ['linkedin', '', null]) {
    assert.throws(() => createLocalWeeklyBoard([valid], filter), TypeError);
  }
  for (const zone of ['Europe/Paris', '', null]) {
    assert.throws(() => createLocalWeeklyBoard([valid], 'all', zone), TypeError);
  }
  for (const replacement of [
    { rights: 'CLEARED' }, { status: 'SCHEDULED' }, { publication: 'PUBLISHED' },
    { sourceStatus: 'VERIFIED' }, { mode: 'LIVE' }, { channel: 'provider' },
    { creditStatus: 'APPROVED' }, { utcISO: 'not-a-date' }, { draftId: 'invalid' },
  ]) {
    assert.throws(() => createLocalWeeklyBoard([{ ...valid, ...replacement }]), TypeError);
  }
  // All input contracts must be validated before the view-only channel filter.
  assert.throws(() => createLocalWeeklyBoard([{
    ...valid, channel: 'instagram', timeZone: 'Europe/Paris',
  }], 'x', 'UTC'), TypeError);
  assert.throws(() => createLocalWeeklyBoard([{
    ...valid, channel: 'linkedin',
  }], 'tiktok', 'UTC'), TypeError);
  assert.throws(() => createLocalWeeklyBoard([valid, valid]), TypeError);
  const many = Array.from({length: 20}, (_, n) =>
    idea(1, 'x', '2026-11-20T12:' + String(n).padStart(2, '0'), 'Bounded local title'));
  assert.equal(createLocalWeeklyBoard(many).visibleCount, 20);
  assert.equal(createLocalWeeklyBoard([]).weeks.length, 0);
});

test('M07-D DTO does not copy private body, source, summary, tokens or arbitrary properties', () => {
  const valid = idea(1, 'x', '2026-11-20T12:00', 'Safe hypothetical editorial title');
  const contaminated = { ...valid, body: 'SECRET_BODY_MUST_NOT_LEAK',
    summary: 'SECRET_SUMMARY_MUST_NOT_LEAK',
    source_url: 'https://example.org/secret',
    token: 'SECRET_VALUE_MUST_NOT_LEAK' };
  const serialized = JSON.stringify(createLocalWeeklyBoard([contaminated]));
  assert.doesNotMatch(serialized, /SECRET_|example\.org|source_url|summary|body|token/);
  assert.match(serialized, /NOT_CLEARED|DRAFT_ONLY|SOURCE_VERIFICATION_PENDING|PLANNED_CONCEPT_ONLY/);
});

test('M07-D private CSP UI exposes labeled accessible filters; sessions scrub weekly DOM', () => {
  const html = renderLocalCmsUi('ab'.repeat(32));
  for (const id of ['m07-weekly', 'm07-week-zone', 'm07-week-filter',
    'm07-week-status', 'm07-week-board']) assert.match(html, new RegExp('id="' + id + '"'));
  assert.match(html, /for="m07-week-zone"/);
  assert.match(html, /for="m07-week-filter"/);
  assert.match(html, /MEMORY ONLY · NOT SCHEDULED · NOT POSTED/);
  assert.match(html, /script nonce="[a-f0-9]{64}" type="module"/);
  assert.match(LOCAL_CMS_UI_SCRIPT, /ui\.weekBoard\.replaceChildren\(\)/);
  assert.match(LOCAL_CMS_UI_SCRIPT, /item\.textContent = idea\.localTime/);
  assert.match(LOCAL_CMS_UI_SCRIPT, /renderLocalWeekBoard\(\)/);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT, /localStorage|sessionStorage|indexedDB|\.innerHTML|\/local\/week|\/admin\/week/);
  assert.match(readFileSync('src/pages/admin/[...route].js', 'utf8'), /!import\.meta\.env\.DEV/);
});
