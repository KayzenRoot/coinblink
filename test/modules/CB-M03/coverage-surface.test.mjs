import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const LOCALES = ['en', 'pt-br', 'es'];
const pages = LOCALES.map((locale) => ({
  locale,
  source: readFileSync('src/pages/' + locale + '/news/coverage.astro', 'utf8'),
}));
const component = readFileSync('src/modules/CB-M03/CoveragePage.astro', 'utf8');
const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');

test('each locale renders its own coverage page and keeps the reader gated', () => {
  for (const { locale, source } of pages) {
    assert.match(source, /export const prerender = false/u, locale);
    assert.match(source, /readLiveNews\(\{ enabled: import\.meta\.env\.PUBLIC_NEWS_LIVE \}\)/u, locale);
    assert.match(source, new RegExp('getLiveNewsCopy\\("' + locale + '"\\)', 'u'), locale);
    assert.match(source, new RegExp('<CoveragePage snapshot=\\{snapshot\\} locale="' + locale + '" />', 'u'), locale);
    assert.doesNotMatch(source, /set:html|is:inline|client:/u, locale);
  }
});

test('the coverage page groups the same snapshot and adds no request or storage', () => {
  assert.match(component, /clusterLiveHeadlines/u);
  assert.match(component, /coveragePublishers/u);
  assert.match(component, /formatLiveAge/u);
  assert.doesNotMatch(component, /set:html|<script/u);
  assert.doesNotMatch(component, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/u);
  assert.match(component, /data-m03-coverage="disabled"/u);
  assert.match(component, /data-m03-coverage="unavailable"/u);
  assert.match(component, /data-m03-coverage="live"/u);
  assert.match(component, /data-m03-coverage-item/u);
  assert.match(component, /copy\.coverageEmpty/u);
  assert.match(component, /copy\.coverageLiveLink/u);
  assert.match(component, /rel="noreferrer noopener external"/u);
  assert.match(component, /\{"\/" \+ locale \+ "\/news\/live"\}/u);
});

test('the live reader links to the full coverage page', () => {
  assert.ok(panel.includes('"/" + locale + "/news/coverage"'));
  assert.ok(panel.includes('fillLiveNewsCopy(copy.coverageAll, { count: clusters.length })'));
});
