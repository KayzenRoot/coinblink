import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCE_DIRECTORY_COPY, SOURCE_DIRECTORY_LOCALES, getSourceDirectoryCopy,
} from '../../../src/modules/CB-M03/source-directory-copy.mjs';
import { fillLiveNewsCopy } from '../../../src/modules/CB-M03/live-news-copy.mjs';

const REQUIRED = [
  'back', 'pageTitle', 'pageDescription', 'h1', 'intro', 'statusTitle', 'liveStatus',
  'disabledStatus', 'unavailableStatus', 'publishers', 'officialSite', 'feedLine',
  'rightsNote', 'liveLink', 'allSources', 'howItWorks',
];
const placeholders = (text) => [...text.matchAll(/\{([a-z]+)\}/gu)].map((match) => match[1]).sort();

test('every locale carries the same complete, plain-text directory copy', () => {
  assert.deepEqual([...SOURCE_DIRECTORY_LOCALES].sort(), ['en', 'es', 'pt-br']);
  const reference = Object.keys(SOURCE_DIRECTORY_COPY.en).sort();
  assert.deepEqual(reference, [...REQUIRED].sort());
  for (const locale of SOURCE_DIRECTORY_LOCALES) {
    assert.deepEqual(Object.keys(SOURCE_DIRECTORY_COPY[locale]).sort(), reference, locale);
    assert.equal(Object.isFrozen(SOURCE_DIRECTORY_COPY[locale]), true, locale);
    for (const [key, value] of Object.entries(SOURCE_DIRECTORY_COPY[locale])) {
      assert.equal(typeof value, 'string', locale + '.' + key);
      assert.ok(value.trim().length > 0, locale + '.' + key);
      assert.doesNotMatch(value, /[<>]/u, locale + '.' + key + ' must stay plain text');
    }
  }
});

test('the chrome is translated and placeholders agree across locales', () => {
  for (const key of ['back', 'pageTitle', 'h1', 'intro', 'statusTitle', 'liveStatus',
    'disabledStatus', 'unavailableStatus', 'publishers', 'officialSite', 'feedLine',
    'rightsNote', 'liveLink', 'allSources', 'howItWorks']) {
    assert.notEqual(SOURCE_DIRECTORY_COPY['pt-br'][key], SOURCE_DIRECTORY_COPY.en[key], key);
    assert.notEqual(SOURCE_DIRECTORY_COPY.es[key], SOURCE_DIRECTORY_COPY.en[key], key);
  }
  const expected = {
    liveStatus: ['ok', 'time', 'total'], unavailableStatus: ['reason'], feedLine: ['count', 'status'],
  };
  for (const [key, names] of Object.entries(expected)) {
    assert.deepEqual(placeholders(SOURCE_DIRECTORY_COPY.en[key]), names, key);
    for (const locale of SOURCE_DIRECTORY_LOCALES) {
      assert.deepEqual(placeholders(SOURCE_DIRECTORY_COPY[locale][key]), names, locale + '.' + key);
    }
  }
  assert.equal(fillLiveNewsCopy(SOURCE_DIRECTORY_COPY.es.feedLine, { status: 'OK', count: 12 }),
    'OK · 12 titulares en la recopilación actual');
});

test('unknown locales fall back to English without reaching prototype members', () => {
  assert.equal(getSourceDirectoryCopy('fr'), SOURCE_DIRECTORY_COPY.en);
  assert.equal(getSourceDirectoryCopy('constructor'), SOURCE_DIRECTORY_COPY.en);
  assert.equal(getSourceDirectoryCopy('__proto__'), SOURCE_DIRECTORY_COPY.en);
  assert.equal(getSourceDirectoryCopy(undefined), SOURCE_DIRECTORY_COPY.en);
  assert.equal(getSourceDirectoryCopy('pt-br'), SOURCE_DIRECTORY_COPY['pt-br']);
});
