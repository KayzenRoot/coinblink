import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIVE_NEWS_SOURCES } from '../../../src/modules/CB-M03/rss-sources.mjs';
import { buildSourcesOpml, escapeXml } from '../../../src/modules/CB-M03/sources-opml.mjs';

const route = readFileSync('src/pages/sources.opml.ts', 'utf8');
const directory = readFileSync('src/modules/CB-M03/SourceDirectoryPage.astro', 'utf8');

test('the export lists the five reviewed feeds as metadata only', () => {
  const xml = buildSourcesOpml();
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/u);
  assert.match(xml, /<opml version="2.0">/u);
  assert.equal((xml.match(/<outline /gu) ?? []).length, 5);
  for (const source of LIVE_NEWS_SOURCES) {
    assert.ok(xml.includes('text="' + source.name + '"'), source.id);
    assert.ok(xml.includes('xmlUrl="' + source.url + '"'), source.id);
    assert.ok(xml.includes('htmlUrl="' + source.home + '"'), source.id);
  }
  assert.equal(xml.includes('<item'), false);
  assert.doesNotMatch(xml, /"title"|summary|publishedAt/u);
});

test('attribute values are escaped and malformed sources are skipped', () => {
  const xml = buildSourcesOpml([{
    id: 'x', name: 'A & B <C> "D"', url: 'https://x.test/feed?a=1&b=2', home: 'https://x.test',
  }]);
  assert.ok(xml.includes('text="A &amp; B &lt;C&gt; &quot;D&quot;"'));
  assert.ok(xml.includes('xmlUrl="https://x.test/feed?a=1&amp;b=2"'));
  assert.equal(escapeXml(null), '');
  assert.throws(() => buildSourcesOpml(null), TypeError);
  assert.equal((buildSourcesOpml([null, {}]).match(/<outline /gu) ?? []).length, 0);
});

test('the route is read-only, cached, conditional and query-free', () => {
  for (const marker of ['conditionalResponse', 'text/x-opml; charset=utf-8',
    'public, max-age=3600', 'UNSUPPORTED_QUERY', 'export const OPTIONS', 'export const ALL', 'allow: "GET"']) {
    assert.ok(route.includes(marker), marker);
  }
  assert.doesNotMatch(route, /localStorage|sessionStorage|item\.title|fetch\s*\(/u);
});

test('the source directory links to the OPML export', () => {
  assert.ok(directory.includes('href="/sources.opml"'));
  assert.ok(directory.includes('copy.opmlLink'));
});
