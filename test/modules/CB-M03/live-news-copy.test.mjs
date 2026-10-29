import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_NEWS_COPY, LIVE_NEWS_LOCALES, fillLiveNewsCopy, getLiveNewsCopy,
} from '../../../src/modules/CB-M03/live-news-copy.mjs';

const REQUIRED = [
  'lang', 'navigation', 'back', 'h1', 'intro', 'pageTitle', 'pageDescription',
  'disabledTitle', 'disabledBody', 'disabledNote', 'unavailableTitle', 'unavailableBody',
  'unavailableNote', 'warning', 'meta', 'latestTitle', 'officialSite', 'stripTitle', 'stripNote', 'stripAll',
  'filterTitle', 'filterQueryLabel',
  'filterQueryHint', 'filterSourceLabel', 'filterAllSources', 'filterApply', 'filterReset',
  'resultOne', 'resultMany', 'emptyFiltered', 'filterNote', 'topicsTitle', 'topicsNote',
  'sinceTitle', 'sinceAny', 'sinceHours', 'sinceNote', 'allSources', 'staleWarning', 'howItWorks',
  'alsoCovered', 'coverageNote', 'topTitle', 'topPublishers', 'topNote',
  'savedTitle', 'savedNote', 'savedSave', 'savedClear', 'savedEmpty', 'savedAll',
  'savedRemove', 'savedFull', 'savedDuplicate', 'savedSaved', 'savedError', 'savedRemoved', 'savedCleared',
  'feedsTitle', 'feedsCaption',
  'columnPublisher', 'columnStatus', 'columnHeadlines', 'columnReason', 'undated', 'noReason',
  'rightsNote',
];

const placeholders = (text) => [...text.matchAll(/\{([a-z]+)\}/gu)].map((match) => match[1]).sort();

test('every locale carries the same complete, plain-text copy', () => {
  assert.deepEqual([...LIVE_NEWS_LOCALES].sort(), ['en', 'es', 'pt-br']);
  const reference = Object.keys(LIVE_NEWS_COPY.en).sort();
  assert.deepEqual(reference, [...REQUIRED].sort());
  for (const locale of LIVE_NEWS_LOCALES) {
    const copy = LIVE_NEWS_COPY[locale];
    assert.deepEqual(Object.keys(copy).sort(), reference, locale);
    assert.equal(Object.isFrozen(copy), true, locale);
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, 'string', locale + '.' + key);
      assert.ok(value.trim().length > 0, locale + '.' + key);
      assert.doesNotMatch(value, /[<>]/u, locale + '.' + key + ' must stay plain text');
    }
  }
});

test('the chrome is actually translated and the BCP-47 tag is correct', () => {
  for (const key of ['back', 'h1', 'disabledTitle', 'unavailableTitle', 'warning', 'feedsTitle',
    'columnPublisher', 'rightsNote', 'filterTitle', 'filterQueryLabel', 'emptyFiltered', 'filterNote',
    'stripTitle', 'stripNote', 'topicsTitle', 'topicsNote', 'officialSite', 'sinceTitle', 'sinceNote', 'allSources', 'staleWarning',
    'savedTitle', 'savedNote', 'savedSave', 'savedClear', 'savedEmpty', 'savedAll', 'savedRemove',
    'alsoCovered', 'coverageNote', 'topTitle', 'topPublishers', 'topNote', 'topTitle', 'topPublishers', 'topNote',
    'savedFull', 'savedDuplicate', 'savedSaved', 'savedError', 'savedRemoved', 'savedCleared']) {
    assert.notEqual(LIVE_NEWS_COPY['pt-br'][key], LIVE_NEWS_COPY.en[key], key);
    assert.notEqual(LIVE_NEWS_COPY.es[key], LIVE_NEWS_COPY.en[key], key);
  }
  assert.equal(LIVE_NEWS_COPY.en.lang, 'en');
  assert.equal(LIVE_NEWS_COPY['pt-br'].lang, 'pt-BR');
  assert.equal(LIVE_NEWS_COPY.es.lang, 'es');
});

test('placeholders agree across locales and fill leaves unknown names untouched', () => {
  const intro = placeholders(LIVE_NEWS_COPY.en.intro);
  const meta = placeholders(LIVE_NEWS_COPY.en.meta);
  const stripAll = placeholders(LIVE_NEWS_COPY.en.stripAll);
  const topPublishers = placeholders(LIVE_NEWS_COPY.en.topPublishers);
  assert.deepEqual(intro, ['feeds']);
  assert.deepEqual(meta, ['count', 'feeds', 'minutes', 'sources', 'time']);
  assert.deepEqual(stripAll, ['count']);
  assert.deepEqual(topPublishers, ['count']);
  assert.deepEqual(placeholders(LIVE_NEWS_COPY.en.sinceHours), ['hours']);
  assert.deepEqual(placeholders(LIVE_NEWS_COPY.en.staleWarning), ['time']);
  assert.deepEqual(placeholders(LIVE_NEWS_COPY.en.savedRemove), ['label']);
  assert.deepEqual(placeholders(LIVE_NEWS_COPY.en.savedFull), ['max']);
  for (const locale of LIVE_NEWS_LOCALES) {
    assert.deepEqual(placeholders(LIVE_NEWS_COPY[locale].intro), intro, locale);
    assert.deepEqual(placeholders(LIVE_NEWS_COPY[locale].meta), meta, locale);
    assert.deepEqual(placeholders(LIVE_NEWS_COPY[locale].stripAll), stripAll, locale);
    assert.deepEqual(placeholders(LIVE_NEWS_COPY[locale].topPublishers), topPublishers, locale);
    assert.deepEqual(placeholders(LIVE_NEWS_COPY[locale].sinceHours), ['hours'], locale);
    assert.deepEqual(placeholders(LIVE_NEWS_COPY[locale].staleWarning), ['time'], locale);
    assert.deepEqual(placeholders(LIVE_NEWS_COPY[locale].savedRemove), ['label'], locale);
    assert.deepEqual(placeholders(LIVE_NEWS_COPY[locale].savedFull), ['max'], locale);
  }
  assert.equal(fillLiveNewsCopy('{a} {b}', { a: 'x', b: 2 }), 'x 2');
  assert.equal(fillLiveNewsCopy('{a} {b}', { a: 'x' }), 'x {b}');
  assert.equal(fillLiveNewsCopy('{constructor}', {}), '{constructor}');
  assert.equal(fillLiveNewsCopy('{a}', { a: 'plain' }), 'plain');
});

test('unknown locales fall back to English without reaching prototype members', () => {
  assert.equal(getLiveNewsCopy('fr'), LIVE_NEWS_COPY.en);
  assert.equal(getLiveNewsCopy('constructor'), LIVE_NEWS_COPY.en);
  assert.equal(getLiveNewsCopy('__proto__'), LIVE_NEWS_COPY.en);
  assert.equal(getLiveNewsCopy(undefined), LIVE_NEWS_COPY.en);
  assert.equal(getLiveNewsCopy('pt-br'), LIVE_NEWS_COPY['pt-br']);
});
