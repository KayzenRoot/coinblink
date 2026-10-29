import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOpenApiDocument } from '../../../src/modules/CB-M11/openapi.mjs';

const doc = buildOpenApiDocument();

function collectRefs(value, refs = new Set()) {
  if (Array.isArray(value)) {
    for (const entry of value) collectRefs(entry, refs);
    return refs;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === '$ref' && typeof child === 'string') refs.add(child);
      else collectRefs(child, refs);
    }
  }
  return refs;
}

function resolveRef(ref) {
  return ref.replace(/^#\//u, '').split('/').reduce((node, part) => node?.[part], doc);
}

test('the document declares every real endpoint and every response the routes use', () => {
  assert.equal(doc.openapi, '3.1.0');
  assert.equal(doc.info.title, 'CoinBlink public metadata API');
  assert.equal(doc.servers[0].url, '/');
  assert.deepEqual(Object.keys(doc.paths).sort(), ['/v1/news/coverage', '/v1/news/status', '/v1/sources']);
  for (const path of Object.values(doc.paths)) {
    assert.deepEqual(Object.keys(path.get.responses).sort(), ['200', '304', '400', '405', '503']);
    assert.deepEqual(path.get.security, []);
    assert.ok(path.get.responses['200'].content['application/json'].schema.$ref);
  }
});

test('every schema reference resolves and the feed schema stays content-free', () => {
  for (const ref of collectRefs(doc)) {
    assert.notEqual(resolveRef(ref), undefined, ref);
  }
  const feed = doc.components.schemas.FeedStatus;
  assert.deepEqual(Object.keys(feed.properties).sort(), ['id', 'itemCount', 'reason', 'status']);
  const serialized = JSON.stringify(feed);
  for (const forbidden of ['title', 'summary', 'link', 'publishedAt', 'body', 'content']) {
    assert.equal(serialized.includes('"' + forbidden + '"'), false, forbidden);
  }
  assert.deepEqual(Object.keys(doc.components.schemas.Source.properties).sort(),
    ['feed', 'home', 'id', 'name', 'pages', 'rights']);
  const coverage = doc.components.schemas.CoverageStatus;
  assert.deepEqual(Object.keys(coverage.properties).sort(),
    ['collectedAt', 'disclaimer', 'headlines', 'mode', 'publishers', 'reason', 'rights', 'status', 'stories']);
  assert.deepEqual(Object.keys(doc.components.schemas.PublisherCoverage.properties).sort(), ['id', 'stories']);
  const serializedCoverage = JSON.stringify(coverage);
  for (const forbidden of ['title', 'summary', 'link', 'publishedAt', 'body', 'content']) {
    assert.equal(serializedCoverage.includes('"' + forbidden + '"'), false, forbidden);
  }
});

test('the document is deeply frozen and describes the cache validators', () => {
  assert.equal(Object.isFrozen(doc), true);
  assert.equal(Object.isFrozen(doc.paths), true);
  assert.equal(Object.isFrozen(doc.components.schemas), true);
  assert.match(doc.info.description, /No article text/u);
  assert.match(doc.paths['/v1/news/status'].get.description, /If-None-Match/u);
  assert.match(doc.paths['/v1/sources'].get.description, /Metadata only/u);
});
