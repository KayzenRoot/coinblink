import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCE_PAGE_COPY, SOURCE_PAGE_LOCALES, getSourcePageCopy,
} from '../../../src/modules/CB-M03/source-page-copy.mjs';
import { fillLiveNewsCopy } from '../../../src/modules/CB-M03/live-news-copy.mjs';

const REQUIRED = [
  'back', 'title', 'intro', 'statusTitle', 'statusLive', 'statusDisabled', 'statusUnavailable',
  'statusPending', 'itemsTitle', 'noItems', 'siteLabel', 'rightsNote', 'allHeadlines',
  'notFoundTitle', 'notFoundBody',
];
const placeholders = (text) => [...text.matchAll(/\{([a-z]+)\}/gu)].map((match) => match[1]).sort();

test('every locale carries the same complete, plain-text source copy', () => {
  assert.deepEqual([...SOURCE_PAGE_LOCALES].sort(), ['en', 'es', 'pt-br']);
  const reference = Object.keys(SOURCE_PAGE_COPY.en).sort();
  assert.deepEqual(reference, [...REQUIRED].sort());
  for (const locale of SOURCE_PAGE_LOCALES) {
    assert.deepEqual(Object.keys(SOURCE_PAGE_COPY[locale]).sort(), reference, locale);
    assert.equal(Object.isFrozen(SOURCE_PAGE_COPY[locale]), true, locale);
    for (const [key, value] of Object.entries(SOURCE_PAGE_COPY[locale])) {
      assert.equal(typeof value, 'string', locale + '.' + key);
      assert.ok(value.trim().length > 0, locale + '.' + key);
      assert.doesNotMatch(value, /[<>]/u, locale + '.' + key + ' must stay plain text');
    }
  }
});

test('the chrome is translated and placeholders agree across locales', () => {
  for (const key of ['back', 'title', 'intro', 'statusTitle', 'statusLive', 'statusDisabled',
    'statusUnavailable', 'statusPending', 'itemsTitle', 'noItems', 'siteLabel', 'rightsNote',
    'allHeadlines', 'notFoundTitle', 'notFoundBody']) {
    assert.notEqual(SOURCE_PAGE_COPY['pt-br'][key], SOURCE_PAGE_COPY.en[key], key);
    assert.notEqual(SOURCE_PAGE_COPY.es[key], SOURCE_PAGE_COPY.en[key], key);
  }
  const expected = {
    title: ['name'], intro: ['name'], statusLive: ['count', 'time'],
    statusUnavailable: ['reason'], itemsTitle: ['name'], rightsNote: ['name'],
  };
  for (const [key, names] of Object.entries(expected)) {
    assert.deepEqual(placeholders(SOURCE_PAGE_COPY.en[key]), names, key);
    for (const locale of SOURCE_PAGE_LOCALES) {
      assert.deepEqual(placeholders(SOURCE_PAGE_COPY[locale][key]), names, locale + '.' + key);
    }
  }
  assert.equal(fillLiveNewsCopy(SOURCE_PAGE_COPY.es.title, { name: 'CoinDesk' }),
    'CoinBlink · Titulares de CoinDesk (DEMO)');
});

test('unknown locales fall back to English without reaching prototype members', () => {
  assert.equal(getSourcePageCopy('fr'), SOURCE_PAGE_COPY.en);
  assert.equal(getSourcePageCopy('constructor'), SOURCE_PAGE_COPY.en);
  assert.equal(getSourcePageCopy('__proto__'), SOURCE_PAGE_COPY.en);
  assert.equal(getSourcePageCopy(undefined), SOURCE_PAGE_COPY.en);
  assert.equal(getSourcePageCopy('pt-br'), SOURCE_PAGE_COPY['pt-br']);
});
