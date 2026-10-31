import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  activePlacement, adsAdminSection, clickTarget, createPlacement, createSponsor, listPlacements,
  listSponsors, pausePlacement, readPlacement, recordClick, recordImpression, validSlot,
} from '../../../src/modules/CB-M13/ads.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const DAY = 86_400_000;

function fakeDb() {
  const sponsors = [];
  const placements = [];
  const stats = new Map();
  return {
    sponsors,
    placements,
    stats,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_sponsors WHERE id')) {
            return sponsors.find((row) => row.id === args[0]) ?? null;
          }
          if (sql.includes('FROM cms_ad_placements WHERE id=')) {
            return placements.find((row) => row.id === args[0]) ?? null;
          }
          if (sql.includes("p.status='active' AND p.start_at<=?")) {
            return placements.find((row) => row.slot === args[0] && row.status === 'active'
              && row.startAt <= args[1] && row.endAt > args[2]) ?? null;
          }
          return null;
        },
        async run() {
          if (sql.startsWith('INSERT INTO cms_sponsors')) {
            sponsors.push({ id: args[0], name: args[1], url: args[2], contact: args[3] });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO cms_ad_placements')) {
            placements.push({
              id: args[0], sponsorId: args[1], slot: args[2], label: args[3], body: args[4],
              ctaLabel: args[5], ctaUrl: args[6], rateCents: args[7], startAt: args[8], endAt: args[9],
              status: 'active', sponsorName: sponsors.find((row) => row.id === args[1])?.name ?? '',
            });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO cms_ad_stats')) {
            const key = args[0] + ':' + args[1];
            const current = stats.get(key) ?? { impressions: 0, clicks: 0 };
            stats.set(key, { impressions: current.impressions + args[2], clicks: current.clicks + args[3] });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith("UPDATE cms_ad_placements SET status='paused'")) {
            const row = placements.find((entry) => entry.id === args[0]);
            if (!row || row.status !== 'active') return { meta: { changes: 0 } };
            row.status = 'paused';
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async all() {
          if (sql.includes('FROM cms_sponsors')) return { results: sponsors };
          return {
            results: placements.map((row) => {
              const day = [...stats.entries()].filter(([key]) => key.startsWith(row.id + ':'));
              return {
                ...row,
                impressions: day.reduce((sum, [, value]) => sum + value.impressions, 0),
                clicks: day.reduce((sum, [, value]) => sum + value.clicks, 0),
              };
            }),
          };
        },
      });
      return { bind, all: () => bind().all(), first: () => bind().first() };
    },
  };
}

async function seed(db) {
  const sponsor = await createSponsor({ db, name: 'Ledger Labs', url: 'https://ledger.example', nowMs: NOW });
  const placement = await createPlacement({
    db, sponsorId: sponsor.sponsor.id, slot: 'article', label: 'Sponsored by Ledger Labs',
    body: 'Hardware wallet with open firmware.', ctaLabel: 'See the device', ctaUrl: 'https://ledger.example/device',
    rateCents: 25000, startAt: NOW - DAY, endAt: NOW + DAY, nowMs: NOW,
  });
  return { sponsor: sponsor.sponsor, placement: placement.placement };
}

test('sponsors and placements validate their urls and windows', async () => {
  const db = fakeDb();
  assert.equal((await createSponsor({ db, name: 'x', url: 'https://a.example' })).status, 'invalid');
  assert.equal((await createSponsor({ db, name: 'Valid Name', url: 'http://insecure.example' })).status, 'invalid');
  const sponsor = await createSponsor({ db, name: 'Valid Name', url: 'https://a.example' });
  assert.equal(sponsor.status, 'created');
  const base = { db, sponsorId: sponsor.sponsor.id, slot: 'article', label: 'Sponsored by A', ctaUrl: 'https://a.example/x', nowMs: NOW };
  assert.equal((await createPlacement({ ...base, slot: 'sidebar', startAt: NOW, endAt: NOW + DAY })).reason, 'slot');
  assert.equal((await createPlacement({ ...base, startAt: NOW + DAY, endAt: NOW })).reason, 'window');
  assert.equal((await createPlacement({ ...base, ctaUrl: 'javascript:alert(1)', startAt: NOW, endAt: NOW + DAY })).reason, 'cta');
  assert.equal((await createPlacement({ ...base, startAt: NOW, endAt: NOW + DAY })).status, 'created');
  assert.equal(validSlot('newsletter'), true);
});

test('only an active placement inside its window is served', async () => {
  const db = fakeDb();
  const { placement } = await seed(db);
  assert.equal((await activePlacement({ db, slot: 'article', nowMs: NOW })).id, placement.id);
  assert.equal(await activePlacement({ db, slot: 'article', nowMs: NOW + 2 * DAY }), null);
  assert.equal(await activePlacement({ db, slot: 'home', nowMs: NOW }), null);
  assert.equal(await pausePlacement({ db, id: placement.id }), true);
  assert.equal(await activePlacement({ db, slot: 'article', nowMs: NOW }), null);
});

test('impressions and clicks accumulate per placement and day', async () => {
  const db = fakeDb();
  const { placement } = await seed(db);
  await recordImpression({ db, placementId: placement.id, nowMs: NOW });
  await recordImpression({ db, placementId: placement.id, nowMs: NOW });
  await recordClick({ db, placementId: placement.id, nowMs: NOW });
  const rows = await listPlacements({ db, nowMs: NOW });
  assert.equal(rows[0].impressions, 2);
  assert.equal(rows[0].clicks, 1);
  assert.equal(rows[0].live, true);
  assert.equal(rows[0].rateCents, 25000);
});

test('the click target refuses a paused or expired placement', async () => {
  const db = fakeDb();
  const { placement } = await seed(db);
  const row = await readPlacement({ db, id: placement.id });
  assert.equal(clickTarget(row, { nowMs: NOW }), 'https://ledger.example/device');
  assert.equal(clickTarget(row, { nowMs: NOW + 2 * DAY }), null);
  assert.equal(clickTarget({ ...row, ctaUrl: 'http://plain.example' }, { nowMs: NOW }), null);
});

test('a database without the migration renders no slot and no rows', async () => {
  const broken = { prepare() { throw new Error('no such table: cms_ad_placements'); } };
  assert.equal(await activePlacement({ db: broken, slot: 'article', nowMs: NOW }), null);
  assert.deepEqual(await listPlacements({ db: broken }), []);
  assert.deepEqual(await listSponsors({ db: broken }), []);
});

test('the owner screen shows contracted value, counters and the pause action', async () => {
  const db = fakeDb();
  await seed(db);
  const html = adsAdminSection({
    placements: await listPlacements({ db, nowMs: NOW }),
    sponsors: await listSponsors({ db }),
    csrf: 'c'.repeat(64),
  });
  assert.match(html, /Live contracted value<\/dt><dd>\$250\.00/u);
  assert.match(html, /action="\/admin\/ads\/placement"/u);
  assert.match(html, /action="\/admin\/ads\/pause"/u);
  assert.match(html, /rel="sponsored"/u);
  assert.doesNotMatch(html, /<script/iu);
});

test('the site renders the slot and counts the click through the redirect', () => {
  const slot = readFileSync('src/modules/CB-M13/SponsoredSlot.astro', 'utf8');
  for (const marker of ['activePlacement', 'recordImpression', 'rel="sponsored noopener"', '/ad/click?id=']) {
    assert.ok(slot.includes(marker), marker);
  }
  const route = readFileSync('src/pages/ad/click.ts', 'utf8');
  for (const marker of ['readPlacement', 'recordClick', 'clickTarget', '303', 'no-store']) {
    assert.ok(route.includes(marker), marker);
  }
  const article = readFileSync('src/modules/CB-M05/ArticlePage.astro', 'utf8');
  assert.match(article, /<SponsoredSlot slot="article" \/>/u);
});
