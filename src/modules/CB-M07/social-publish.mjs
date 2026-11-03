// CB-M07-P1-SOCIAL-PUBLISH-001: send the reviewed plan to Instagram and TikTok.
//
// The token is decrypted inside one request and never logged or rendered. A
// network without an approved app, a stored token or a publishable media URL
// answers `not_configured`/`no_media` and makes no external call, so the queue
// stays a dry-run and nothing breaks.
import { getSetting } from '../CB-M05/p1-production/settings.mjs';
import { readSocialToken, updateSocialToken } from './token-vault.mjs';
import { refreshToken } from './tiktok-oauth.mjs';
import { SOCIAL_NETWORKS, utcDay } from './social-queue.mjs';

export const IG_GRAPH_URL = 'https://graph.facebook.com/v21.0';
export const TT_PUBLISH_INIT_URL = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
export const TT_PUBLISH_STATUS_URL = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
export const IG_DEFAULT_MEDIA_PATH = '/brand/og-image.jpg';
export const DETAIL_LIMIT = 240;
// An app that has not passed TikTok's audit can only publish as private.
export const TT_PRIVACY = 'SELF_ONLY';
const TERMINAL = /^(?:instagram|tiktok):(?:failed|error|sent|media|published):/u;

function clip(value) {
  const text = String(value ?? '');
  return text.length <= DETAIL_LIMIT ? text : text.slice(0, DETAIL_LIMIT - 1) + '…';
}

function errorCode(payload) {
  const code = payload?.error?.code ?? payload?.error?.type ?? payload?.error?.error_code;
  return typeof code === 'string' && /^[A-Za-z0-9_.:-]{1,40}$/u.test(code) ? code : 'unknown';
}

/** A row that already reached a terminal state for the day is not retried. */
export function isTerminalDetail(detail) {
  return TERMINAL.test(String(detail ?? ''));
}

/** `network:publish:<id>:<status>` keeps an in-flight TikTok publish resumable. */
export function parseInFlight(detail) {
  const match = /^tiktok:publish:([A-Za-z0-9_-]{4,64})(?::|$)/u.exec(String(detail ?? ''));
  return match === null ? null : match[1];
}

/**
 * Instagram publishing needs a public JPEG. The brand card is the reviewed
 * default; the owner can point at another asset in Settings.
 */
export async function instagramMediaUrl({ db, secret, env, origin }) {
  const configured = await getSetting({ db, secret, env, key: 'M07_IG_MEDIA_URL' });
  const value = typeof configured === 'string' ? configured.trim() : '';
  if (value !== '') return value;
  const base = String(origin ?? '').replace(/\/$/u, '');
  return base === '' ? '' : base + IG_DEFAULT_MEDIA_PATH;
}

/** TikTok publishing needs a public video. Without one the network stays idle. */
export async function tiktokVideoUrl({ db, secret, env }) {
  const configured = await getSetting({ db, secret, env, key: 'M07_TIKTOK_VIDEO_URL' });
  const value = typeof configured === 'string' ? configured.trim() : '';
  return /^https:\/\/[^\s<>"]{4,400}$/u.test(value) ? value : '';
}

/**
 * Refreshes an expiring TikTok token and seals the new pair. Returns the access
 * token to use, or null when the account has to be connected again.
 */
export async function refreshTiktokAccess({ db, secret, env = {}, token, fetchImpl, nowMs = Date.now() }) {
  if (typeof token?.refreshToken !== 'string' || token.refreshToken === '') return null;
  const clientKey = await getSetting({ db, secret, env, key: 'TIKTOK_CLIENT_KEY' });
  const clientSecret = await getSetting({ db, secret, env, key: 'TIKTOK_CLIENT_SECRET' });
  if (typeof clientKey !== 'string' || typeof clientSecret !== 'string') return null;
  try {
    const next = await refreshToken({ fetchImpl, clientKey, clientSecret, refreshToken: token.refreshToken });
    await updateSocialToken({
      db, secret, provider: 'tiktok', accountId: token.accountId, token: next, nowMs,
    });
    return next.accessToken;
  } catch {
    return null;
  }
}

/** Creates the media container and publishes it. Returns the media id. */
export async function publishInstagramPhoto({
  fetchImpl = globalThis.fetch, igUserId, accessToken, imageUrl, caption,
}) {
  for (const [name, value] of Object.entries({ igUserId, accessToken, imageUrl })) {
    if (typeof value !== 'string' || value === '') throw new TypeError(name + ' is required');
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const create = await fetchImpl(IG_GRAPH_URL + '/' + igUserId + '/media', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({ image_url: imageUrl, caption: String(caption ?? ''), access_token: accessToken }),
  });
  if (!create.ok) throw new Error('Instagram container failed with status ' + create.status);
  const container = await create.json();
  if (typeof container?.id !== 'string' || container.id === '') {
    throw new Error('Instagram container response had no id');
  }
  const publish = await fetchImpl(IG_GRAPH_URL + '/' + igUserId + '/media_publish', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({ creation_id: container.id, access_token: accessToken }),
  });
  if (!publish.ok) throw new Error('Instagram publish failed with status ' + publish.status);
  const payload = await publish.json();
  if (typeof payload?.id !== 'string' || payload.id === '') {
    throw new Error('Instagram publish response had no id');
  }
  return payload.id;
}

/** Starts a PULL_FROM_URL publish. Returns the TikTok publish id. */
export async function startTiktokPublish({
  fetchImpl = globalThis.fetch, accessToken, videoUrl, caption,
}) {
  for (const [name, value] of Object.entries({ accessToken, videoUrl })) {
    if (typeof value !== 'string' || value === '') throw new TypeError(name + ' is required');
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const response = await fetchImpl(TT_PUBLISH_INIT_URL, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + accessToken,
      'content-type': 'application/json; charset=UTF-8',
      accept: 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: String(caption ?? '').slice(0, 2200),
        privacy_level: TT_PRIVACY,
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      source_info: { source: 'PULL_FROM_URL', video_url: videoUrl },
    }),
  });
  if (!response.ok) throw new Error('TikTok publish init failed with status ' + response.status);
  const payload = await response.json();
  const publishId = payload?.data?.publish_id;
  if (typeof publishId !== 'string' || publishId === '') {
    throw new Error('TikTok publish init failed with ' + errorCode(payload));
  }
  return Object.freeze({
    publishId,
    status: typeof payload?.data?.status === 'string' ? payload.data.status : 'PROCESSING_UPLOAD',
  });
}

/** Reads the publish status. Returns the provider status string. */
export async function readTiktokPublish({ fetchImpl = globalThis.fetch, accessToken, publishId }) {
  for (const [name, value] of Object.entries({ accessToken, publishId })) {
    if (typeof value !== 'string' || value === '') throw new TypeError(name + ' is required');
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const response = await fetchImpl(TT_PUBLISH_STATUS_URL, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + accessToken,
      'content-type': 'application/json; charset=UTF-8',
      accept: 'application/json',
    },
    body: JSON.stringify({ publish_id: publishId }),
  });
  if (!response.ok) throw new Error('TikTok publish status failed with status ' + response.status);
  const payload = await response.json();
  const status = payload?.data?.status;
  if (typeof status !== 'string' || status === '') {
    throw new Error('TikTok publish status failed with ' + errorCode(payload));
  }
  return status;
}

async function markSent({ db, id, nowMs, detail }) {
  const result = await db.prepare(
    "UPDATE cms_social_queue SET status='sent',sent_at=?,detail=? WHERE id=? AND status='planned'",
  ).bind(Math.floor(nowMs / 1000), clip(detail), id).run();
  return result?.meta?.changes === 1;
}

async function markDetail({ db, id, detail }) {
  try {
    await db.prepare('UPDATE cms_social_queue SET detail=? WHERE id=?').bind(clip(detail), id).run();
  } catch {
    // The reason is diagnostic; a failed write must not stop the other network.
  }
}

function emptyResult(network) {
  return { network, status: 'idle', sent: 0, failed: 0, skipped: 0 };
}

/**
 * Sends today's planned posts for one network. `idle` means there was nothing
 * to send, `not_configured`/`no_media` mean no external call was made.
 */
async function sendNetwork({
  db, secret, env, network, quota, nowMs, origin, fetchImpl,
}) {
  const day = utcDay(nowMs);
  const wanted = Math.max(Number(quota?.[network]) || 0, 0);
  if (wanted === 0) return Object.freeze({ ...emptyResult(network), status: 'no_quota' });
  const token = await readSocialToken({ db, secret, provider: network });
  if (token.status === 'missing') return Object.freeze({ ...emptyResult(network), status: 'not_configured' });
  if (token.status !== 'ok') return Object.freeze({ ...emptyResult(network), status: 'unavailable' });
  const mediaUrl = network === 'instagram'
    ? await instagramMediaUrl({ db, secret, env, origin })
    : await tiktokVideoUrl({ db, secret, env });
  if (mediaUrl === '') return Object.freeze({ ...emptyResult(network), status: 'no_media' });
  let sentToday;
  try {
    sentToday = await db.prepare("SELECT count(*) AS n FROM cms_social_queue WHERE network=? AND day=? AND status='sent'")
      .bind(network, day).first();
  } catch {
    return Object.freeze({ ...emptyResult(network), status: 'unavailable' });
  }
  const remaining = wanted - Number(sentToday?.n ?? 0);
  if (remaining <= 0) return Object.freeze({ ...emptyResult(network), status: 'quota_reached' });
  const nowSeconds = Math.floor(nowMs / 1000);
  let accessToken = token.accessToken;
  if (network === 'tiktok' && token.expiresAt !== null && token.expiresAt <= nowSeconds + 120) {
    const refreshed = await refreshTiktokAccess({ db, secret, env, token, fetchImpl, nowMs });
    if (refreshed === null) return Object.freeze({ ...emptyResult(network), status: 'expired' });
    accessToken = refreshed;
  }
  let rows;
  try {
    const result = await db.prepare(
      "SELECT id,slug,caption,detail FROM cms_social_queue WHERE network=? AND day=? AND status='planned' "
      + 'ORDER BY created_at LIMIT ?',
    ).bind(network, day, remaining * 3).all();
    rows = result?.results ?? [];
  } catch {
    return Object.freeze({ ...emptyResult(network), status: 'unavailable' });
  }
  const summary = emptyResult(network);
  let sent = 0;
  for (const row of rows) {
    if (sent >= remaining) break;
    if (isTerminalDetail(row.detail)) {
      summary.skipped += 1;
      continue;
    }
    if (network === 'instagram') {
      try {
        const mediaId = await publishInstagramPhoto({
          fetchImpl, igUserId: token.accountId, accessToken,
          imageUrl: mediaUrl, caption: row.caption,
        });
        if (await markSent({ db, id: row.id, nowMs, detail: 'instagram:media:' + mediaId })) {
          sent += 1;
          summary.sent += 1;
        }
      } catch (error) {
        const reason = /status (\d{3})/u.exec(error?.message ?? '');
        await markDetail({ db, id: row.id, detail: 'instagram:error:' + (reason?.[1] ?? 'network') + ':' + row.slug });
        summary.failed += 1;
      }
      continue;
    }
    const inFlight = parseInFlight(row.detail);
    try {
      if (inFlight !== null) {
        const status = await readTiktokPublish({ fetchImpl, accessToken, publishId: inFlight });
        if (status === 'PUBLISH_COMPLETE') {
          if (await markSent({ db, id: row.id, nowMs, detail: 'tiktok:sent:' + inFlight })) {
            sent += 1;
            summary.sent += 1;
          }
        } else if (status === 'FAILED') {
          await markDetail({ db, id: row.id, detail: 'tiktok:failed:' + inFlight });
          summary.failed += 1;
        } else {
          await markDetail({ db, id: row.id, detail: 'tiktok:publish:' + inFlight + ':' + clip(status) });
          summary.skipped += 1;
        }
        continue;
      }
      const started = await startTiktokPublish({
        fetchImpl, accessToken, videoUrl: mediaUrl, caption: row.caption,
      });
      await markDetail({ db, id: row.id, detail: 'tiktok:publish:' + started.publishId + ':' + clip(started.status) });
      summary.skipped += 1;
    } catch (error) {
      const reason = /status (\d{3})/u.exec(error?.message ?? '');
      await markDetail({ db, id: row.id, detail: 'tiktok:error:' + (reason?.[1] ?? 'network') + ':' + row.slug });
      summary.failed += 1;
    }
  }
  if (summary.sent > 0) summary.status = 'sent';
  else if (summary.failed > 0) summary.status = 'failed';
  else if (summary.skipped > 0) summary.status = 'pending';
  else summary.status = 'idle';
  return Object.freeze(summary);
}

/**
 * One send pass. Each network is isolated: a failure or a missing app in one
 * never stops the other.
 */
export async function sendDay({
  db, secret, env = {}, nowMs = Date.now(), origin = '', quota, fetchImpl,
}) {
  const results = [];
  for (const network of SOCIAL_NETWORKS) {
    try {
      results.push(await sendNetwork({ db, secret, env, network, quota, nowMs, origin, fetchImpl }));
    } catch {
      results.push(Object.freeze({ ...emptyResult(network), status: 'unavailable' }));
    }
  }
  return Object.freeze(results);
}
