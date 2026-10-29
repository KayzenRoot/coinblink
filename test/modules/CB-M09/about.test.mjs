import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ABOUT_COPY, ABOUT_LOCALES, getAboutCopy } from '../../../src/modules/CB-M09/about-copy.mjs';

const REQUIRED = [
  'lang', 'pageTitle', 'pageDescription', 'back', 'h1', 'tag', 'intro', 'headlinesTitle',
  'headlinesBody', 'attributionTitle', 'attributionBody', 'coverageTitle', 'coverageBody',
  'localTitle', 'localBody', 'intakeTitle', 'intakeBody',
  'syntheticTitle', 'syntheticBody', 'notConnectedTitle', 'notConnectedBody', 'linksTitle',
  'liveLink', 'sourcesLink', 'coverageLink', 'intakeLink', 'developersLink', 'labsLink', 'homeLink', 'note',
];
const pages = ABOUT_LOCALES.map((locale) => ({
  locale,
  source: readFileSync('src/pages/' + locale + '/about.astro', 'utf8'),
}));
const component = readFileSync('src/modules/CB-M09/AboutPage.astro', 'utf8');
const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');
const directory = readFileSync('src/modules/CB-M03/SourceDirectoryPage.astro', 'utf8');

test('every locale carries the same complete about copy', () => {
  assert.deepEqual([...ABOUT_LOCALES].sort(), ['en', 'es', 'pt-br']);
  const reference = Object.keys(ABOUT_COPY.en).sort();
  assert.deepEqual(reference, [...REQUIRED].sort());
  for (const locale of ABOUT_LOCALES) {
    assert.deepEqual(Object.keys(ABOUT_COPY[locale]).sort(), reference, locale);
    assert.equal(Object.isFrozen(ABOUT_COPY[locale]), true, locale);
    for (const [key, value] of Object.entries(ABOUT_COPY[locale])) {
      assert.equal(typeof value, 'string', locale + '.' + key);
      assert.ok(value.trim().length > 0, locale + '.' + key);
      assert.doesNotMatch(value, /[<>{}]/u, locale + '.' + key + ' must stay plain text');
    }
  }
  assert.equal(ABOUT_COPY['pt-br'].lang, 'pt-BR');
  assert.equal(ABOUT_COPY.es.lang, 'es');
  assert.equal(ABOUT_COPY.en.lang, 'en');
});

test('the substantive sections are translated, not left in English', () => {
  for (const key of ['h1', 'intro', 'headlinesBody', 'attributionBody', 'coverageTitle',
    'coverageBody', 'localTitle', 'localBody', 'intakeBody', 'syntheticBody',
    'notConnectedBody', 'coverageLink', 'note']) {
    assert.notEqual(ABOUT_COPY['pt-br'][key], ABOUT_COPY.en[key], key);
    assert.notEqual(ABOUT_COPY.es[key], ABOUT_COPY.en[key], key);
  }
});

test('the three locale pages render the shared component with their locale', () => {
  for (const { locale, source } of pages) {
    assert.match(source, /export const prerender = false/u, locale);
    assert.ok(source.includes('<AboutPage locale="' + locale + '" />'), locale);
    assert.doesNotMatch(source, /set:html|is:inline|client:/u, locale);
  }
  assert.ok(component.includes('getAboutCopy'));
  assert.ok(component.includes('<BaseLayout lang={copy.lang}'));
  assert.doesNotMatch(component, /set:html|<script|<form/u);
  for (const path of ['/news/live', '/news/sources', '/news/coverage', '/demo/intake', '/developers', '/demo']) {
    assert.ok(component.includes(path), path);
  }
});

test('the live page and source directory link to the explanation', () => {
  assert.ok(panel.includes('"/" + locale + "/about"'));
  assert.ok(panel.includes('copy.howItWorks'));
  assert.ok(directory.includes('"/" + locale + "/about"'));
  assert.ok(directory.includes('copy.howItWorks'));
});

test('unknown locales fall back to English without prototype access', () => {
  assert.equal(getAboutCopy('fr'), ABOUT_COPY.en);
  assert.equal(getAboutCopy('constructor'), ABOUT_COPY.en);
  assert.equal(getAboutCopy('__proto__'), ABOUT_COPY.en);
  assert.equal(getAboutCopy(undefined), ABOUT_COPY.en);
  assert.equal(getAboutCopy('es'), ABOUT_COPY.es);
});
