import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveRobotsDirective,
  publicIndexingEnabled,
  buildRobotsText,
} from '../../../src/modules/CB-M09/seo-policy.mjs';

const ready = Object.freeze({
  environment: 'production',
  enabled: 'true',
  origin: 'https://coinblink.example',
  requestOrigin: 'https://coinblink.example',
});

test('SEO remains non-indexable by default even when a route requests indexing', () => {
  for (const override of [
    { enabled: undefined }, { enabled: 'TRUE' }, { environment: 'preview' },
    { origin: undefined }, { origin: 'http://coinblink.example' },
    { origin: 'https://coinblink.example/' },
    { requestOrigin: 'https://coinblink-m00-preview.workers.dev' },
  ]) {
    const config = { ...ready, ...override };
    assert.equal(publicIndexingEnabled(config), false, JSON.stringify(override));
    assert.equal(resolveRobotsDirective({ ...config, pathname: '/en/editorial', requested: 'index, follow', status: 200 }),
      'noindex, nofollow, noarchive');
    assert.equal(buildRobotsText(config), 'User-agent: *\nDisallow: /\n');
  }
});

test('explicit production opt-in only indexes public approved route classes with 200 responses', () => {
  assert.equal(publicIndexingEnabled(ready), true);
  for (const pathname of ['/en/editorial', '/pt-br/editorial', '/es/editorial',
    '/en/article/verified-story', '/es/article/story-10']) {
    assert.equal(resolveRobotsDirective({ ...ready, pathname, requested: 'index, follow', status: 200 }),
      'index, follow', pathname);
  }
  for (const pathname of ['/en', '/en/news', '/en/news/live', '/admin', '/api/health',
    '/en/search', '/en/article', '/en/article/abc/more', '/demo/preview',
    '/en/article/invalid?slug=1', '/en/article/%2fadmin', '/EN/editorial']) {
    assert.equal(resolveRobotsDirective({ ...ready, pathname, requested: 'index, follow', status: 200 }),
      'noindex, nofollow, noarchive', pathname);
  }
  for (const status of [301, 302, 404, 410, 500]) {
    assert.equal(resolveRobotsDirective({ ...ready, pathname: '/en/article/verified-story', requested: 'index, follow', status }),
      'noindex, nofollow, noarchive', String(status));
  }
  assert.equal(resolveRobotsDirective({ ...ready, pathname: '/en/article/verified-story', requested: undefined, status: 200 }),
    'noindex, nofollow, noarchive');
  assert.equal(resolveRobotsDirective({ ...ready, pathname: '/en/article/verified-story', requested: 'noindex, follow', status: 200 }),
    'noindex, nofollow, noarchive');
});

test('only verified production origin exposes a sitemap in robots.txt', () => {
  assert.equal(buildRobotsText(ready),
    'User-agent: *\nAllow: /\nSitemap: https://coinblink.example/sitemap.xml\n');
});
