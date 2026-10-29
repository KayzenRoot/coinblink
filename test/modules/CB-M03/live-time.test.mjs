import test from 'node:test';
import assert from 'node:assert/strict';
import { exactLiveTime, formatLiveAge } from '../../../src/modules/CB-M03/live-time.mjs';

const NOW = Date.parse('2026-10-29T12:00:00Z');

test('relative ages are localized and deterministic', () => {
  assert.equal(formatLiveAge('2026-10-29T11:59:30Z', NOW, 'en'), 'just now');
  assert.equal(formatLiveAge('2026-10-29T11:55:00Z', NOW, 'en'), '5 minutes ago');
  assert.equal(formatLiveAge('2026-10-29T10:00:00Z', NOW, 'en'), '2 hours ago');
  assert.equal(formatLiveAge('2026-10-28T12:00:00Z', NOW, 'en'), 'yesterday');
  assert.equal(formatLiveAge('2026-10-26T12:00:00Z', NOW, 'en'), '3 days ago');
  assert.equal(formatLiveAge('2026-10-29T11:55:00Z', NOW, 'pt-br'), 'há 5 minutos');
  assert.equal(formatLiveAge('2026-10-29T10:00:00Z', NOW, 'es'), 'hace 2 horas');
  assert.equal(formatLiveAge('2026-10-28T12:00:00Z', NOW, 'pt-br'), 'ontem');
  assert.equal(formatLiveAge('2026-10-28T12:00:00Z', NOW, 'es'), 'ayer');
});

test('future and unusable timestamps never invent an age', () => {
  assert.equal(formatLiveAge('2026-10-29T12:00:30Z', NOW, 'en'), 'just now');
  assert.equal(formatLiveAge(null, NOW, 'en'), null);
  assert.equal(formatLiveAge(undefined, NOW, 'en'), null);
  assert.equal(formatLiveAge('not a date', NOW, 'en'), null);
  assert.equal(formatLiveAge('2026-10-29T11:55:00Z', NOW, 'fr'), '5 minutes ago');
});

test('the exact UTC label stays available for the tooltip', () => {
  assert.equal(exactLiveTime('2026-10-29T12:34:56.789Z'), '2026-10-29 12:34 UTC');
  assert.equal(exactLiveTime(null), '');
  assert.equal(exactLiveTime('nope'), '');
});
