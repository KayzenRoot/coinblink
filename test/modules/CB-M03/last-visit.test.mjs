import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LIVE_LAST_VISIT_KEY,
  countNewSince,
  isNewSince,
  parseLastVisit,
} from '../../../src/modules/CB-M03/last-visit.mjs';

const client = readFileSync('src/modules/CB-M03/last-visit.client.mjs', 'utf8');
const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');

test('a stored visit is only accepted when it is a valid timestamp', () => {
  assert.equal(LIVE_LAST_VISIT_KEY, 'coinblink.live.last-visit.v1');
  assert.equal(parseLastVisit('2026-10-29T10:00:00.000Z'), Date.parse('2026-10-29T10:00:00.000Z'));
  assert.equal(parseLastVisit(''), null);
  assert.equal(parseLastVisit('not a date'), null);
  assert.equal(parseLastVisit(null), null);
  assert.equal(parseLastVisit(42), null);
});

test('only a headline strictly newer than the visit is marked', () => {
  const visit = Date.parse('2026-10-29T10:00:00.000Z');
  assert.equal(isNewSince('2026-10-29T10:00:01.000Z', visit), true);
  assert.equal(isNewSince('2026-10-29T10:00:00.000Z', visit), false);
  assert.equal(isNewSince('2026-10-29T09:59:59.000Z', visit), false);
  assert.equal(isNewSince('not a date', visit), false);
  assert.equal(isNewSince(null, visit), false);
  assert.equal(isNewSince('2026-10-29T10:00:01.000Z', null), false);
});

test('the status counts only dated headlines newer than the visit', () => {
  const visit = Date.parse('2026-10-29T10:00:00.000Z');
  const items = [
    { publishedAt: '2026-10-29T10:00:01.000Z' },
    { publishedAt: '2026-10-29T09:00:00.000Z' },
    { publishedAt: null },
    null,
    { publishedAt: '2026-10-29T12:00:00.000Z' },
  ];
  assert.equal(countNewSince(items, visit), 2);
  assert.equal(countNewSince([], visit), 0);
  assert.equal(countNewSince(null, visit), 0);
});

test('the client stays local, escapes text and leaves no-JS readers untouched', () => {
  assert.doesNotMatch(client, /fetch\s*\(|XMLHttpRequest|innerHTML|document\.cookie/u);
  assert.match(client, /localStorage/u);
  assert.match(client, /createElement\("span"\)/u);
  assert.match(client, /textContent = label/u);
  assert.match(client, /data-m03-live-list/u);
  assert.match(client, /data-m03-new-template/u);
  assert.match(client, /catch/u, 'storage denials are handled');
});

test('the reader exposes the list, the badge label and the status slot', () => {
  assert.ok(panel.includes('data-m03-live-list data-m03-new-label={copy.newBadge}'));
  assert.ok(panel.includes('data-m03-new-status data-m03-new-template={copy.newStatus}'));
  assert.ok(panel.includes('import "./last-visit.client.mjs"'));
  assert.ok(panel.includes('copy.newNote'));
});
