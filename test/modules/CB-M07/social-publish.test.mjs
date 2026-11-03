import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptToken } from '../../../src/modules/CB-M07/token-vault.mjs';
import {
  DETAIL_LIMIT, IG_DEFAULT_MEDIA_PATH, instagramMediaUrl, isTerminalDetail, parseInFlight,
  publishInstagramPhoto, readTiktokPublish, sendDay, startTiktokPublish, tiktokVideoUrl,
} from '../../../src/modules/CB-M07/social-publish.mjs';

const SECRET = 'a'.repeat(64);
const NOW = 1_800_000_000_000;

async function tokenRow(plaintext = 'page-token-1', expiresAt = null) {
  const sealed = await encryptToken({ secret: SECRET, plaintext });
  const refresh = await encryptToken({ secret: SECRET, plaintext: 'refresh-token-1' });
  return {
    accountId: '17841400000000000', username: 'coinblink',
    accessCiphertext: sealed.ciphertext, accessIv: sealed.iv,
    refreshCiphertext: refresh.ciphertext, refreshIv: refresh.iv, expiresAt,
  };
}

function fakeDb({ account = null, queue = [], sentToday = 0 } = {}) {
  const writes = [];
  return {
    writes,
    prepare(sql) {
      const statement = {
        args: [],
        bind(...args) {
          statement.args = args;
          return statement;
        },
        async first() {
          if (sql.includes('FROM cms_social_accounts')) return account;
          if (sql.includes('FROM cms_settings')) return null;
          if (sql.includes('count(*)')) return { n: sentToday };
          return null;
        },
        async all() {
          if (sql.includes('FROM cms_social_queue')) return { results: queue };
          return { results: [] };
        },
        async run() {
          writes.push({ sql, args: statement.args });
          return { meta: { changes: 1 } };
        },
      };
      return statement;
    },
  };
}

test('the queue markers are parsed without trusting the stored detail', () => {
  assert.equal(parseInFlight('tiktok:publish:publish-1234:PROCESSING_UPLOAD'), 'publish-1234');
  assert.equal(parseInFlight('tiktok:publish:publish-1234'), 'publish-1234');
  assert.equal(parseInFlight('instagram:media:123'), null);
  assert.equal(parseInFlight(''), null);
  assert.equal(isTerminalDetail('instagram:media:123'), true);
  assert.equal(isTerminalDetail('tiktok:error:500:slug'), true);
  assert.equal(isTerminalDetail('tiktok:failed:publish-1'), true);
  assert.equal(isTerminalDetail('tiktok:publish:publish-1:PROCESSING_UPLOAD'), false);
  assert.equal(isTerminalDetail(''), false);
});

test('the media defaults are explicit and the video URL must be https', async () => {
  const db = fakeDb();
  assert.equal(await instagramMediaUrl({ db, secret: SECRET, env: {}, origin: 'https://cb.test/' }),
    'https://cb.test' + IG_DEFAULT_MEDIA_PATH);
  assert.equal(await instagramMediaUrl({ db, secret: SECRET, env: { M07_IG_MEDIA_URL: 'https://cdn.test/a.jpg' }, origin: 'https://cb.test' }),
    'https://cdn.test/a.jpg');
  assert.equal(await instagramMediaUrl({ db, secret: SECRET, env: {}, origin: '' }), '');
  assert.equal(await tiktokVideoUrl({ db, secret: SECRET, env: {} }), '');
  assert.equal(await tiktokVideoUrl({ db, secret: SECRET, env: { M07_TIKTOK_VIDEO_URL: 'http://cdn.test/a.mp4' } }), '');
  assert.equal(await tiktokVideoUrl({ db, secret: SECRET, env: { M07_TIKTOK_VIDEO_URL: 'https://cdn.test/a.mp4' } }),
    'https://cdn.test/a.mp4');
});

test('the Instagram card is created and then published', async () => {
  const seen = [];
  const fetchImpl = async (url, options) => {
    seen.push({ url: new URL(url), options });
    return new Response(JSON.stringify({ id: seen.length === 1 ? 'container-1' : 'media-1' }), { status: 200 });
  };
  const mediaId = await publishInstagramPhoto({
    fetchImpl, igUserId: '1784', accessToken: 'page-token-1',
    imageUrl: 'https://cb.test/brand/og-image.jpg', caption: 'Hello',
  });
  assert.equal(mediaId, 'media-1');
  assert.equal(seen.length, 2);
  assert.equal(seen[0].url.pathname, '/v21.0/1784/media');
  const create = new URLSearchParams(seen[0].options.body.toString());
  assert.equal(create.get('image_url'), 'https://cb.test/brand/og-image.jpg');
  assert.equal(create.get('caption'), 'Hello');
  assert.equal(create.get('access_token'), 'page-token-1');
  assert.equal(seen[1].url.pathname, '/v21.0/1784/media_publish');
  assert.equal(new URLSearchParams(seen[1].options.body.toString()).get('creation_id'), 'container-1');
  await assert.rejects(publishInstagramPhoto({
    fetchImpl: async () => new Response('{}', { status: 400 }), igUserId: '1', accessToken: 'secret-page-token',
    imageUrl: 'https://cb.test/a.jpg', caption: 'c',
  }), (error) => error.message.includes('400') && !error.message.includes('secret-page-token'));
});

test('the TikTok publish starts from a URL and its status is readable', async () => {
  const seen = [];
  const fetchImpl = async (url, options) => {
    seen.push({ url, body: JSON.parse(options.body), authorization: options.headers.authorization });
    if (String(url).includes('init')) {
      return new Response(JSON.stringify({ data: { publish_id: 'publish-1', status: 'PROCESSING_UPLOAD' }, error: { code: 'ok' } }), { status: 200 });
    }
    return new Response(JSON.stringify({ data: { status: 'PUBLISH_COMPLETE' }, error: { code: 'ok' } }), { status: 200 });
  };
  const started = await startTiktokPublish({
    fetchImpl, accessToken: 'act.token', videoUrl: 'https://cdn.test/a.mp4', caption: 'Hello',
  });
  assert.equal(started.publishId, 'publish-1');
  assert.equal(started.status, 'PROCESSING_UPLOAD');
  assert.equal(seen[0].authorization, 'Bearer act.token');
  assert.equal(seen[0].body.source_info.source, 'PULL_FROM_URL');
  assert.equal(seen[0].body.source_info.video_url, 'https://cdn.test/a.mp4');
  assert.equal(seen[0].body.post_info.privacy_level, 'SELF_ONLY');
  assert.equal(seen[0].body.post_info.title, 'Hello');
  assert.equal(await readTiktokPublish({ fetchImpl, accessToken: 'act.token', publishId: 'publish-1' }), 'PUBLISH_COMPLETE');
  assert.equal(seen[1].body.publish_id, 'publish-1');
  await assert.rejects(startTiktokPublish({
    fetchImpl: async () => new Response(JSON.stringify({ error: { code: 'url_ownership_unverified' } }), { status: 200 }),
    accessToken: 't', videoUrl: 'https://cdn.test/a.mp4', caption: 'c',
  }), /url_ownership_unverified/u);
});

test('no stored account means not_configured and no external call', async () => {
  let calls = 0;
  const result = await sendDay({
    db: fakeDb(), secret: SECRET, env: {}, nowMs: NOW,
    quota: { instagram: 2, tiktok: 2 },
    fetchImpl: async () => {
      calls += 1;
      return new Response('{}', { status: 500 });
    },
  });
  assert.deepEqual(result.map((row) => row.status), ['not_configured', 'not_configured']);
  assert.equal(calls, 0);
});

test('zero quota keeps the network idle without touching the queue', async () => {
  const db = fakeDb({ account: await tokenRow() });
  const result = await sendDay({
    db, secret: SECRET, env: {}, nowMs: NOW, quota: { instagram: 0, tiktok: 0 },
    fetchImpl: async () => new Response('{}', { status: 500 }),
  });
  assert.deepEqual(result.map((row) => row.status), ['no_quota', 'no_quota']);
  assert.equal(db.writes.length, 0);
});

test('Instagram marks the row sent and TikTok stays in dry-run without a video', async () => {
  const db = fakeDb({
    account: await tokenRow(),
    queue: [
      { id: 'q-1', slug: 'gold-rises', caption: 'Gold rises\nhttps://cb.test/en/article/gold-rises', detail: null },
      { id: 'q-2', slug: 'etf-flows', caption: 'ETF flows\nhttps://cb.test/en/article/etf-flows', detail: null },
    ],
  });
  const result = await sendDay({
    db, secret: SECRET, env: {}, nowMs: NOW, origin: 'https://cb.test',
    quota: { instagram: 2, tiktok: 2 },
    fetchImpl: async (url) => (String(url).includes('media_publish')
      ? new Response(JSON.stringify({ id: 'media-' + Math.random().toString(16).slice(2, 8) }), { status: 200 })
      : new Response(JSON.stringify({ id: 'container-1' }), { status: 200 })),
  });
  const instagram = result.find((row) => row.network === 'instagram');
  const tiktok = result.find((row) => row.network === 'tiktok');
  assert.equal(instagram.status, 'sent');
  assert.equal(instagram.sent, 2);
  assert.equal(tiktok.status, 'no_media');
  const sent = db.writes.filter((write) => write.sql.includes("status='sent'"));
  assert.equal(sent.length, 2);
  assert.ok(String(sent[0].args[1]).startsWith('instagram:media:'));
});

test('an expiring TikTok token is refreshed, resealed and used for the publish', async () => {
  const expired = Math.floor(NOW / 1000) - 60;
  const db = fakeDb({
    account: await tokenRow('old-access-token', expired),
    queue: [{ id: 'q-1', slug: 'gold-rises', caption: 'Gold rises', detail: null }],
  });
  const seen = [];
  const result = await sendDay({
    db, secret: SECRET, nowMs: NOW,
    env: {
      M07_TIKTOK_VIDEO_URL: 'https://cdn.test/a.mp4',
      TIKTOK_CLIENT_KEY: 'client-key-1', TIKTOK_CLIENT_SECRET: 'client-secret',
    },
    quota: { instagram: 0, tiktok: 1 },
    fetchImpl: async (url, options = {}) => {
      seen.push({ url: String(url), headers: options.headers ?? {}, body: options.body });
      if (String(url).includes('/v2/oauth/token/')) {
        return new Response(JSON.stringify({ access_token: 'fresh-access-token', refresh_token: 'fresh-refresh-token', expires_in: 86400 }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { publish_id: 'publish-1', status: 'PROCESSING_UPLOAD' }, error: { code: 'ok' } }), { status: 200 });
    },
  });
  const tiktok = result.find((row) => row.network === 'tiktok');
  assert.equal(tiktok.status, 'pending');
  assert.equal(tiktok.skipped, 1);
  assert.match(seen[0].url, /oauth\/token/u);
  assert.equal(seen[0].headers.authorization, undefined);
  assert.equal(seen[1].headers.authorization, 'Bearer fresh-access-token');
  const resealed = db.writes.filter((write) => write.sql.includes('UPDATE cms_social_accounts SET access_token_ciphertext'));
  assert.equal(resealed.length, 1);
  assert.equal(resealed[0].args.includes('fresh-access-token'), false);
  assert.equal(resealed[0].args.at(-2), 'tiktok');
});

test('an expired TikTok token without refresh credentials stops before any publish call', async () => {
  const db = fakeDb({
    account: await tokenRow('old-access-token', Math.floor(NOW / 1000) - 60),
    queue: [{ id: 'q-1', slug: 'gold-rises', caption: 'Gold rises', detail: null }],
  });
  let calls = 0;
  const result = await sendDay({
    db, secret: SECRET, nowMs: NOW,
    env: { M07_TIKTOK_VIDEO_URL: 'https://cdn.test/a.mp4' },
    quota: { instagram: 0, tiktok: 1 },
    fetchImpl: async () => {
      calls += 1;
      return new Response('{}', { status: 200 });
    },
  });
  assert.equal(result.find((row) => row.network === 'tiktok').status, 'expired');
  assert.equal(calls, 0);
  assert.equal(db.writes.length, 0);
});

test('one network failing does not stop the other and the reason is bounded', async () => {
  const db = fakeDb({
    account: await tokenRow(),
    queue: [{ id: 'q-1', slug: 'gold-rises', caption: 'Gold rises', detail: null }],
  });
  const result = await sendDay({
    db, secret: SECRET, env: { M07_TIKTOK_VIDEO_URL: 'https://cdn.test/a.mp4' }, nowMs: NOW,
    origin: 'https://cb.test', quota: { instagram: 1, tiktok: 1 },
    fetchImpl: async () => new Response('{}', { status: 500 }),
  });
  const instagram = result.find((row) => row.network === 'instagram');
  const tiktok = result.find((row) => row.network === 'tiktok');
  assert.equal(instagram.status, 'failed');
  assert.equal(instagram.failed, 1);
  assert.equal(tiktok.status, 'failed');
  const details = db.writes.filter((write) => write.sql.includes('SET detail=?'));
  assert.ok(details.length >= 2);
  for (const write of details) {
    assert.ok(String(write.args[0]).length <= DETAIL_LIMIT);
    assert.match(String(write.args[0]), /^(?:instagram|tiktok):(?:error|publish):/u);
    assert.doesNotMatch(String(write.args[0]), /page-token-1|act\.token/u);
  }
});
