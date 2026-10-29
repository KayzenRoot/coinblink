import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const LOCALES = ['en', 'pt-br', 'es'];
const pages = LOCALES.map((locale) => ({
  locale,
  source: readFileSync('src/pages/' + locale + '/news/sources.astro', 'utf8'),
}));
const component = readFileSync('src/modules/CB-M03/SourceDirectoryPage.astro', 'utf8');
const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');
const sourcePage = readFileSync('src/pages/[locale]/news/source/[source].astro', 'utf8');

test('each locale renders the shared directory with its own locale', () => {
  for (const { locale, source } of pages) {
    assert.match(source, /export const prerender = false/u, locale);
    assert.ok(source.includes('<SourceDirectoryPage locale="' + locale + '" />'), locale);
    assert.doesNotMatch(source, /set:html|is:inline|client:/u, locale);
  }
});

test('the directory is gated, escaped and lists every whitelisted publisher', () => {
  assert.match(component, /readLiveNews\(\{ enabled: import\.meta\.env\.PUBLIC_NEWS_LIVE \}\)/u);
  assert.ok(component.includes('LIVE_NEWS_SOURCES.map'));
  assert.ok(component.includes('data-m03-sources-page'));
  assert.ok(component.includes('<ReaderLocaleSwitch locale={locale} />'));
  assert.ok(component.includes('data-m03-sources-state={snapshot.status}'));
  assert.ok(component.includes('data-m03-sources-item={source.id}'));
  assert.ok(component.includes('rel="noreferrer noopener external"'));
  assert.doesNotMatch(component, /set:html|<script|<form/u);
});

test('the reader and the publisher page link to the directory', () => {
  assert.ok(panel.includes('"/" + locale + "/news/sources"'));
  assert.ok(sourcePage.includes('"/" + localeKey + "/news/sources"'));
});
