import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AUTO_PROVENANCE, autoPublishTick, autoSettingsFrom, linkDigest,
} from '../../../src/modules/CB-M08/auto-publish.mjs';

function db({ publishedLastHour = 0, seen = [], articles = [] } = {}) {
  return {
    articles,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_articles')) return { n: publishedLastHour };
          if (sql.includes('FROM cms_auto_publish')) {
            return seen.includes(args[0]) ? { digest: args[0] } : null;
          }
          return null;
        },
        async run() { return { meta: { changes: 1 } }; },
      });
      return { bind, first: () => bind().first(), run: () => bind().run() };
    },
  };
}

const ITEMS = [
  { title: 'Bitcoin ETF inflows hit a record', link: 'https://a.example/1', sourceName: 'CoinDesk' },
];

test('the switch is off by default and the numbers are bounded', () => {
  assert.deepEqual(autoSettingsFrom({}), { enabled: false, perHour: 6, locale: 'en' });
  assert.equal(autoSettingsFrom({ M08_AUTO_PUBLISH: 'on' }).enabled, true);
  assert.equal(autoSettingsFrom({ M08_AUTO_PUBLISH: 'ON' }).enabled, true);
  assert.equal(autoSettingsFrom({ M08_AUTO_PUBLISH_PER_HOUR: '500' }).perHour, 60);
  assert.equal(autoSettingsFrom({ M08_AUTO_PUBLISH_PER_HOUR: '0' }).perHour, 6);
  assert.equal(autoSettingsFrom({ M08_AUTO_PUBLISH_LOCALE: 'fr' }).locale, 'en');
  assert.equal(autoSettingsFrom({ M08_AUTO_PUBLISH_LOCALE: 'pt-br' }).locale, 'pt-br');
});

test('the digest is stable and differs per link', async () => {
  assert.equal(await linkDigest('https://a.example/1'), await linkDigest('https://a.example/1'));
  assert.notEqual(await linkDigest('https://a.example/1'), await linkDigest('https://a.example/2'));
  assert.match(await linkDigest('x'), /^[0-9a-f]{64}$/u);
});

test('off does nothing and never touches the database', async () => {
  const broken = { prepare() { throw new Error('should not be queried'); } };
  const result = await autoPublishTick({ db: broken, secret: 's', env: {}, items: ITEMS });
  assert.equal(result.status, 'off');
});

test('the hourly limit stops before choosing a headline', async () => {
  const result = await autoPublishTick({
    db: db({ publishedLastHour: 6 }), secret: 's', env: { M08_AUTO_PUBLISH: 'on' }, items: ITEMS,
  });
  assert.equal(result.status, 'throttled');
  assert.equal(result.publishedLastHour, 6);
});

test('a dry run reports the chosen headline without writing', async () => {
  const result = await autoPublishTick({
    db: db(), secret: 's', env: { M08_AUTO_PUBLISH: 'on' }, items: ITEMS, dryRun: true,
  });
  assert.equal(result.status, 'dry_run');
  assert.equal(result.link, 'https://a.example/1');
  assert.equal(result.locale, 'en');
});

test('an already attempted link is skipped', async () => {
  const digest = await linkDigest('https://a.example/1');
  const result = await autoPublishTick({
    db: db({ seen: [digest] }), secret: 's', env: { M08_AUTO_PUBLISH: 'on' }, items: ITEMS, dryRun: true,
  });
  assert.equal(result.status, 'nothing_new');
});

test('the provenance note states what was checked', () => {
  assert.match(AUTO_PROVENANCE, /citations, copying and unsourced numbers/u);
  const sql = readFileSync('migrations/0018_auto_publish.sql', 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS cms_auto_publish/u);
  assert.match(sql, /digest TEXT PRIMARY KEY/u);
});

test('the owner screen and the route expose the dry run and the manual tick', () => {
  const section = readFileSync('src/modules/CB-M05/p1-production/articles.mjs', 'utf8');
  assert.match(section, /action="\/admin\/auto-publish"/u);
  assert.match(section, /Preview automatic publishing/u);
  assert.match(section, /Run automatic publishing now/u);
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  assert.match(route, /autoPublishTick\(\{/u);
  assert.match(route, /dryRun: String\(auth\.form\.get\('mode'\) \?\? ''\) === 'dry'/u);
  const ops = readFileSync('src/modules/CB-M14/ops-events.mjs', 'utf8');
  assert.match(ops, /article_auto_published/u);
});

test('rate limits and outages stay eligible, a 404 does not', async () => {
  const { MAX_TRANSIENT_ATTEMPTS, isEligible, isTransient } = await import('../../../src/modules/CB-M08/auto-publish.mjs');
  assert.equal(isTransient('HTTP_429'), true);
  assert.equal(isTransient('HTTP_503'), true);
  assert.equal(isTransient('HTTP_500'), true);
  assert.equal(isTransient('timeout'), true);
  assert.equal(isTransient('network'), true);
  assert.equal(isTransient('HTTP_404'), false);
  assert.equal(isTransient('empty'), false);
  assert.equal(isEligible(null), true);
  assert.equal(isEligible({ status: 'published', attempts: 1 }), false);
  assert.equal(isEligible({ status: 'no_source:HTTP_404', attempts: 1 }), false);
  assert.equal(isEligible({ status: 'transient:HTTP_429', attempts: 1 }), true);
  assert.equal(isEligible({ status: 'transient:HTTP_429', attempts: MAX_TRANSIENT_ATTEMPTS }), false);
});

test('a rate-limited publisher is recorded as transient and retried', async () => {
  const { autoPublishTick } = await import('../../../src/modules/CB-M08/auto-publish.mjs');
  const writes = [];
  const database = {
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_articles')) return { n: 0 };
          if (sql.includes('FROM cms_auto_publish')) return null;
          return null;
        },
        async run() { writes.push({ sql, args }); return { meta: { changes: 1 } }; },
      });
      return { bind, first: () => bind().first(), run: () => bind().run() };
    },
  };
  const result = await autoPublishTick({
    db: database, secret: 's', env: { M08_AUTO_PUBLISH: 'on' }, items: ITEMS,
    fetchImpl: async () => new Response('slow down', { status: 429 }),
  });
  assert.equal(result.status, 'no_source');
  assert.equal(result.reason, 'HTTP_429');
  assert.equal(result.transient, true);
  assert.match(writes[0].args[1], /^transient:HTTP_429$/u);
  assert.match(writes[0].sql, /ON CONFLICT\(digest\) DO UPDATE/u);
});
