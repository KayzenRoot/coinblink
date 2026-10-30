import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  NOT_FOUND_COPY, NOT_FOUND_LOCALES, getNotFoundCopy, localeFromPathname,
} from '../../../src/modules/CB-M09/not-found-copy.mjs';

const page = readFileSync('src/pages/404.astro', 'utf8');
const REQUIRED = ['lang', 'pageTitle', 'pageDescription', 'eyebrow', 'h1', 'body', 'home', 'news'];

test('every locale carries the same complete 404 copy', () => {
  assert.deepEqual([...NOT_FOUND_LOCALES].sort(), ['en', 'es', 'pt-br']);
  const reference = Object.keys(NOT_FOUND_COPY.en).sort();
  assert.deepEqual(reference, [...REQUIRED].sort());
  for (const locale of NOT_FOUND_LOCALES) {
    assert.deepEqual(Object.keys(NOT_FOUND_COPY[locale]).sort(), reference, locale);
    assert.equal(Object.isFrozen(NOT_FOUND_COPY[locale]), true, locale);
    for (const [key, value] of Object.entries(NOT_FOUND_COPY[locale])) {
      assert.equal(typeof value, 'string', locale + '.' + key);
      assert.ok(value.trim().length > 0, locale + '.' + key);
      assert.doesNotMatch(value, /[<>{}]/u, locale + '.' + key + ' must stay plain text');
    }
  }
  assert.equal(NOT_FOUND_COPY['pt-br'].lang, 'pt-BR');
  assert.equal(NOT_FOUND_COPY.es.lang, 'es');
});

test('the page is actually translated', () => {
  for (const key of ['h1', 'body', 'home', 'news', 'eyebrow']) {
    assert.notEqual(NOT_FOUND_COPY['pt-br'][key], NOT_FOUND_COPY.en[key], key);
    assert.notEqual(NOT_FOUND_COPY.es[key], NOT_FOUND_COPY.en[key], key);
  }
});

test('the locale comes from the first path segment and fails closed', () => {
  assert.equal(localeFromPathname('/pt-br/qualquer-coisa'), 'pt-br');
  assert.equal(localeFromPathname('/es'), 'es');
  assert.equal(localeFromPathname('/en/news/category/unknown'), 'en');
  assert.equal(localeFromPathname('/fr/quelque-chose'), 'en');
  assert.equal(localeFromPathname('/404'), 'en');
  assert.equal(localeFromPathname(''), 'en');
  assert.equal(localeFromPathname(null), 'en');
  assert.equal(getNotFoundCopy('fr'), NOT_FOUND_COPY.en);
  assert.equal(getNotFoundCopy('constructor'), NOT_FOUND_COPY.en);
  assert.equal(getNotFoundCopy('__proto__'), NOT_FOUND_COPY.en);
});

test('the 404 route keeps the status and renders the localized surface', () => {
  assert.match(page, /Astro\.response\.status = 404/u);
  assert.ok(page.includes('getNotFoundCopy'));
  assert.ok(page.includes('localeFromPathname'));
  assert.ok(page.includes('data-m09-not-found={locale}'));
  assert.ok(page.includes('href={"/" + locale}'));
  assert.ok(page.includes('href={"/" + locale + "/news"}'));
  assert.doesNotMatch(page, /set:html|<script|<form/u);
});
