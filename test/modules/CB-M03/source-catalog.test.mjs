import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSourceCatalog } from '../../../src/modules/CB-M03/source-catalog.mjs';
import { LIVE_NEWS_SOURCES } from '../../../src/modules/CB-M03/rss-sources.mjs';

const catalog = buildSourceCatalog();

test('the catalog lists every whitelisted publisher as metadata', () => {
  assert.equal(catalog.status, 'ok');
  assert.equal(catalog.mode, 'PUBLIC_METADATA');
  assert.equal(catalog.count, LIVE_NEWS_SOURCES.length);
  assert.equal(catalog.sources.length, LIVE_NEWS_SOURCES.length);
  assert.equal(catalog.rights, 'ATTRIBUTION_ONLY');
  assert.equal(Object.isFrozen(catalog), true);
  assert.equal(Object.isFrozen(catalog.sources), true);
  for (const source of catalog.sources) {
    assert.deepEqual(Object.keys(source).sort(), ['feed', 'home', 'id', 'name', 'pages', 'rights']);
    assert.equal(source.rights, 'ATTRIBUTION_ONLY');
    assert.deepEqual(Object.keys(source.pages).sort(), ['en', 'es', 'pt-br']);
    assert.equal(source.pages.en, '/en/news/source/' + source.id);
    assert.equal(source.pages['pt-br'], '/pt-br/news/source/' + source.id);
    assert.equal(source.pages.es, '/es/news/source/' + source.id);
    assert.equal(Object.isFrozen(source), true);
    assert.equal(Object.isFrozen(source.pages), true);
  }
});

test('feed URLs stay on the publisher own host and use https', () => {
  for (const source of catalog.sources) {
    const feed = new URL(source.feed);
    const original = LIVE_NEWS_SOURCES.find((entry) => entry.id === source.id);
    assert.equal(feed.protocol, 'https:', source.id);
    assert.ok(original.hosts.includes(feed.hostname), source.id);
    assert.equal(new URL(source.home).protocol, 'https:', source.id);
  }
});

test('no editorial content is present in the catalog', () => {
  const serialized = JSON.stringify(catalog);
  assert.equal(serialized.includes('"title"'), false);
  assert.equal(serialized.includes('"summary"'), false);
  assert.equal(serialized.includes('"items"'), false);
  assert.equal(serialized.includes('"link"'), false);
});
