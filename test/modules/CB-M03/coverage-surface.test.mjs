import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const LOCALES = ['en', 'pt-br', 'es'];
const pageOf = (locale) => readFileSync('src/pages/' + locale + '/news/coverage.astro', 'utf8');
const component = readFileSync('src/modules/CB-M03/CoveragePage.astro', 'utf8');
const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');

test('the three coverage routes are thin, gated wrappers with their own locale', () => {
  const sources = Object.fromEntries(LOCALES.map((locale) => [locale, pageOf(locale)]));
  assert.deepEqual(Object.keys(sources), LOCALES);
  const joined = LOCALES.map((locale) => sources[locale]).join('\n');
  assert.equal(joined.match(/export const prerender = false/gu)?.length, 3);
  assert.equal(joined.match(/readLiveNews\(/gu)?.length, 3);
  assert.doesNotMatch(joined, /set:html|is:inline|client:/u);
  for (const locale of LOCALES) {
    assert.ok(sources[locale].includes('<CoveragePage snapshot={snapshot} locale="' + locale + '" />'), locale);
    assert.ok(sources[locale].includes('getLiveNewsCopy("' + locale + '")'), locale);
    assert.ok(sources[locale].includes('readLiveNews({ enabled: import.meta.env.PUBLIC_NEWS_LIVE })'), locale);
  }
  assert.ok(sources['pt-br'].includes('<BaseLayout lang="pt-BR"'), 'the BCP-47 tag is canonical');
});

test('the coverage component renders the groups offline', () => {
  for (const marker of ['clusterLiveHeadlines', 'coveragePublishers', 'formatLiveAge',
    'data-m03-coverage-item', 'lang={cluster.members[0].language ?? undefined}', 'publisherAge(member.publishedAt)', 'copy.coverageEmpty', 'copy.coverageLiveLink',
    '<SavedSearches locale={locale} surface="coverage"',
    'rel="noreferrer noopener external"', 'data-m03-coverage="disabled"']) {
    assert.ok(component.includes(marker), marker);
  }
  assert.doesNotMatch(component,
    /set:html|<script|fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/u);
});

test('the coverage page narrows the collection without breaking a story apart', () => {
  for (const marker of ['clampLiveSince', 'clampLiveSource', 'withinLiveSince', 'clustersForSource',
    'clampLiveSearchQuery', 'searchCoverageClusters', 'data-m03-coverage-query',
    'data-m03-coverage-filter', 'data-m03-coverage-since', 'copy.coverageFilterNote',
    'copy.coverageFilteredEmpty', 'copy.coverageEmpty', 'ReaderLocaleSwitch']) {
    assert.ok(component.includes(marker), marker);
  }
  assert.ok(component.includes('source === LIVE_NEWS_ALL_SOURCES ? matched : clustersForSource(matched, source)'));
  assert.ok(component.includes('viewHref(source, 0)'));
});

test('the live highlight exposes the full page with the covered-story count', () => {
  assert.ok(panel.includes('"/" + locale + "/news/coverage"'));
  assert.ok(panel.includes('fillLiveNewsCopy(copy.coverageAll, { count: clusters.length })'));
});
