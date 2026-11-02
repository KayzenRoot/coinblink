// CB-M07-P1-SOCIAL-QUEUE-001: plan the social posts of the day.
//
// The owner sets how many posts each network gets per day. The planner takes
// the newest published articles that were never queued on that network, writes
// a short caption from our own summary and keeps the article link. Nothing is
// sent here: this is the reviewed plan.

export const SOCIAL_NETWORKS = Object.freeze(['instagram', 'tiktok']);
export const MAX_PER_DAY = 20;
export const CAPTION_LIMIT = 220;

export function dailyQuota(values) {
  const read = (key) => {
    const value = Number(values?.[key]);
    if (!Number.isFinite(value) || value < 0) return 0;
    return Math.min(Math.floor(value), MAX_PER_DAY);
  };
  return Object.freeze({ instagram: read('M07_IG_PER_DAY'), tiktok: read('M07_TIKTOK_PER_DAY') });
}

export function utcDay(nowMs = Date.now()) {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/** A short caption from our own summary, always ending with the article link. */
export function buildCaption({ summary, title, href }) {
  const link = String(href ?? '');
  const text = String(summary ?? '').trim() === '' ? String(title ?? '').trim() : String(summary).trim();
  const room = Math.max(CAPTION_LIMIT - link.length - 1, 40);
  const body = text.length <= room ? text : text.slice(0, room - 1).replace(/\s+\S*$/u, '') + '…';
  return (body + '\n' + link).slice(0, CAPTION_LIMIT + link.length + 1);
}

/**
 * Builds the plan for the day. `dryRun` returns the plan without writing.
 * @param {{db: any, nowMs?: number, quota?: {instagram: number, tiktok: number},
 *   origin?: string, dryRun?: boolean}} options
 */
export async function planDay({ db, nowMs = Date.now(), quota, origin = '', dryRun = false }) {
  const limits = quota ?? Object.freeze({ instagram: 0, tiktok: 0 });
  const day = utcDay(nowMs);
  const base = String(origin ?? '').replace(/\/$/u, '');
  const planned = [];
  for (const network of SOCIAL_NETWORKS) {
    const wanted = Math.min(Math.max(Number(limits[network]) || 0, 0), MAX_PER_DAY);
    if (wanted === 0) continue;
    const existing = await db.prepare('SELECT count(*) AS n FROM cms_social_queue WHERE network=? AND day=?')
      .bind(network, day).first();
    const remaining = wanted - Number(existing?.n ?? 0);
    if (remaining <= 0) continue;
    const articles = await db.prepare(
      'SELECT id, locale, slug, title, summary FROM cms_articles WHERE status=\'published\' '
      + 'AND id NOT IN (SELECT article_id FROM cms_social_queue WHERE network=?) '
      + 'ORDER BY published_at DESC LIMIT ?',
    ).bind(network, remaining).all();
    for (const article of articles?.results ?? []) {
      const href = base + '/' + article.locale + '/article/' + article.slug;
      const row = Object.freeze({
        network,
        articleId: article.id,
        locale: article.locale,
        slug: article.slug,
        caption: buildCaption({ summary: article.summary, title: article.title, href }),
        day,
      });
      if (!dryRun) {
        await db.prepare(
          "INSERT OR IGNORE INTO cms_social_queue(id,network,article_id,locale,slug,caption,status,day,created_at) VALUES (?,?,?,?,?,?,'planned',?,?)",
        ).bind(crypto.randomUUID(), network, article.id, article.locale, article.slug, row.caption, day,
          Math.floor(nowMs / 1000)).run();
      }
      planned.push(row);
    }
  }
  return Object.freeze(planned);
}

export async function listQueue({ db, day = utcDay(), limit = 40 }) {
  try {
    const rows = await db.prepare(
      'SELECT network, slug, locale, caption, status, day FROM cms_social_queue WHERE day=? ORDER BY network, created_at DESC LIMIT ?',
    ).bind(day, Math.min(Math.max(Number(limit) || 40, 1), 100)).all();
    return Object.freeze((rows?.results ?? []).map((row) => Object.freeze({
      network: row.network, slug: row.slug, locale: row.locale,
      caption: row.caption, status: row.status, day: row.day,
    })));
  } catch {
    return Object.freeze([]);
  }
}
