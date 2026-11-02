// CB-M08-P1-AUTO-PUBLISH-001: publish a guarded draft without the owner.
//
// The switch is off by default. When it is on, one tick takes the newest
// collected headline that was never attempted, writes the article through the
// same guarded pipeline, publishes it and records the outcome. A headline is
// attempted once: a refusal is remembered so the next tick cannot loop on it.

import { generateArticleDraft } from './article-draft.mjs';
import { fetchSourceText } from './source-text.mjs';
import { readLiveNews } from '../CB-M03/live-news.mjs';
import { publishDraft } from '../CB-M05/p1-production/articles.mjs';
import { createDraft } from '../CB-M05/p1-production/drafts.mjs';
import { getSetting } from '../CB-M05/p1-production/settings.mjs';
import { recordOpsEvent } from '../CB-M14/ops-events.mjs';

export const AUTO_PUBLISH_LOCALES = Object.freeze(['en', 'pt-br', 'es']);
export const DEFAULT_PER_HOUR = 6;
export const AUTO_PROVENANCE = 'Automatic draft from the collected headline, checked for citations, copying and unsourced numbers before publishing.';

/** A stable digest of the headline link, so the same story is attempted once. */
export async function linkDigest(link) {
  const data = new TextEncoder().encode(String(link ?? ''));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function autoSettingsFrom(values) {
  const enabled = String(values?.M08_AUTO_PUBLISH ?? 'off').trim().toLowerCase() === 'on';
  const perHour = Math.min(Math.max(Number(values?.M08_AUTO_PUBLISH_PER_HOUR) || DEFAULT_PER_HOUR, 1), 60);
  const locale = AUTO_PUBLISH_LOCALES.includes(String(values?.M08_AUTO_PUBLISH_LOCALE))
    ? String(values.M08_AUTO_PUBLISH_LOCALE) : 'en';
  return Object.freeze({ enabled, perHour, locale });
}

async function remember(db, digest, status, nowSeconds) {
  await db.prepare('INSERT OR IGNORE INTO cms_auto_publish(digest,status,created_at) VALUES (?,?,?)')
    .bind(digest, status, nowSeconds).run();
}

/**
 * One tick. `dryRun` reports what would happen without writing anything.
 * @param {{db: any, secret: string, env?: object, nowMs?: number, ai?: any,
 *   provider?: object | null, fetchImpl?: typeof fetch, dryRun?: boolean,
 *   liveEnabled?: string}} options
 */
export async function autoPublishTick({
  db, secret, env = {}, nowMs = Date.now(), ai = null, provider = null,
  fetchImpl = globalThis.fetch, dryRun = false, liveEnabled = 'true', items = null,
}) {
  const read = async (key) => {
    const value = await getSetting({ db, secret, env, key });
    return typeof value === 'string' ? value.trim() : '';
  };
  const settings = autoSettingsFrom({
    M08_AUTO_PUBLISH: await read('M08_AUTO_PUBLISH'),
    M08_AUTO_PUBLISH_PER_HOUR: await read('M08_AUTO_PUBLISH_PER_HOUR'),
    M08_AUTO_PUBLISH_LOCALE: await read('M08_AUTO_PUBLISH_LOCALE'),
  });
  if (!settings.enabled) return Object.freeze({ status: 'off' });

  const nowSeconds = Math.floor(nowMs / 1000);
  const recent = await db.prepare(
    "SELECT count(*) AS n FROM cms_articles WHERE status='published' AND published_at > ?",
  ).bind(nowSeconds - 3600).first();
  const publishedLastHour = Number(recent?.n ?? 0);
  if (publishedLastHour >= settings.perHour) {
    return Object.freeze({ status: 'throttled', publishedLastHour, perHour: settings.perHour });
  }

  const collected = items === null
    ? (await readLiveNews({ enabled: liveEnabled }))
    : { status: 'LIVE_HEADLINES', items };
  const headlines = collected.status === 'LIVE_HEADLINES' ? collected.items : [];
  let candidate = null;
  for (const item of headlines) {
    const link = String(item?.link ?? '');
    if (link === '') continue;
    const digest = await linkDigest(link);
    const seen = await db.prepare('SELECT digest FROM cms_auto_publish WHERE digest=?').bind(digest).first();
    if (seen === null || seen === undefined) { candidate = { item, digest }; break; }
  }
  if (candidate === null) return Object.freeze({ status: 'nothing_new' });

  if (dryRun) {
    return Object.freeze({
      status: 'dry_run', title: String(candidate.item.title ?? ''),
      link: String(candidate.item.link ?? ''), locale: settings.locale,
    });
  }

  const researched = await fetchSourceText({ url: String(candidate.item.link), fetchImpl });
  if (researched.status !== 'ok') {
    await remember(db, candidate.digest, 'no_source:' + researched.reason, nowSeconds);
    return Object.freeze({ status: 'no_source', reason: researched.reason });
  }

  const draft = await generateArticleDraft({
    ai, topic: String(candidate.item.title ?? ''), items: headlines, language: settings.locale,
    provider, researchExcerpt: researched.text,
  });
  if (draft.status !== 'drafted') {
    await remember(db, candidate.digest, 'refused:' + draft.status, nowSeconds);
    try {
      await recordOpsEvent({ db, type: 'ai_draft_refused', detail: 'auto:' + draft.status, nowMs });
    } catch {
      // logging never blocks the tick
    }
    return Object.freeze({ status: 'refused', reason: draft.status });
  }

  const draftId = await createDraft({
    db, secret, now: nowSeconds,
    input: {
      title: draft.draft.title, summary: draft.draft.summary, body: draft.draft.body,
      sourceUrl: draft.draft.primaryUrl, authorLabel: 'CoinBlink AI draft', locale: settings.locale,
    },
  });
  if (typeof draftId !== 'string' || draftId === '') {
    await remember(db, candidate.digest, 'draft_failed', nowSeconds);
    return Object.freeze({ status: 'draft_failed' });
  }

  const published = await publishDraft({
    db, locale: settings.locale, tags: '', provenanceNote: AUTO_PROVENANCE,
    draftId, nowMs,
  });
  if (published.status !== 'published') {
    await remember(db, candidate.digest, 'publish_failed:' + published.status, nowSeconds);
    return Object.freeze({ status: 'publish_failed', reason: published.status });
  }
  await remember(db, candidate.digest, 'published', nowSeconds);
  try {
    await recordOpsEvent({ db, type: 'article_auto_published', detail: settings.locale + ':' + published.article.slug, nowMs });
  } catch {
    // logging never blocks the tick
  }
  return Object.freeze({
    status: 'published', locale: settings.locale,
    slug: published.article.slug, title: published.article.title,
  });
}
