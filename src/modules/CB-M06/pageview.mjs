// CB-M06-P1-PAGEVIEWS-001: cookieless aggregate pageviews.
//
// Only the path, locale and UTC day are stored. No IP, user agent, referrer,
// cookie or account is read or written.
import { escapeHtml, page } from '../CB-M05/p1-production/owner-auth.mjs';

const PATH = /^\/[A-Za-z0-9/_.-]{0,199}$/u;
const DAY = /^\d{4}-\d{2}-\d{2}$/u;
const LOCALES = new Set(['en', 'pt-br', 'es']);

/** Accept only a bounded same-site path; never store queries or private trees. */
export function normalizePageviewPath(value) {
  if (typeof value !== 'string' || !PATH.test(value) || value.includes('//')) return null;
  if (value === '/admin' || value.startsWith('/admin/')) return null;
  if (value === '/api' || value.startsWith('/api/')) return null;
  if (value === '/v1' || value.startsWith('/v1/')) return null;
  if (value === '/health' || value === '/preview-status') return null;
  return value;
}

export function localeForPath(path, requested) {
  if (typeof requested === 'string' && LOCALES.has(requested)) return requested;
  const first = typeof path === 'string' ? path.split('/')[1] : '';
  return LOCALES.has(first) ? first : 'other';
}

export async function recordPageview({ db, path, locale, day }) {
  const normalized = normalizePageviewPath(path);
  if (normalized === null || typeof day !== 'string' || !DAY.test(day)) return false;
  try {
    const result = await db.prepare('INSERT INTO cms_pageviews(day,path,locale,views) VALUES (?,?,?,1) ON CONFLICT(day,path,locale) DO UPDATE SET views=views+1')
      .bind(day, normalized, localeForPath(normalized, locale)).run();
    return result?.meta?.changes === 1;
  } catch {
    return false;
  }
}

function utcDay(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 10);
}

function daysAgo(nowMs, days) {
  return utcDay(nowMs - days * 24 * 60 * 60 * 1000);
}

export async function readAnalytics({ db, nowMs }) {
  const today = utcDay(nowMs);
  const since = daysAgo(nowMs, 6);
  const total = await db.prepare('SELECT COALESCE(SUM(views),0) AS total FROM cms_pageviews WHERE day>=?').bind(since).first();
  const todayTotal = await db.prepare('SELECT COALESCE(SUM(views),0) AS total FROM cms_pageviews WHERE day=?').bind(today).first();
  const top = await db.prepare('SELECT path,SUM(views) AS views FROM cms_pageviews WHERE day>=? GROUP BY path ORDER BY views DESC,path LIMIT 10').bind(since).all();
  const daily = await db.prepare('SELECT day,SUM(views) AS views FROM cms_pageviews WHERE day>=? GROUP BY day ORDER BY day DESC').bind(since).all();
  return Object.freeze({
    today,
    total: Number(total?.total ?? 0),
    todayTotal: Number(todayTotal?.total ?? 0),
    top: Object.freeze(top?.results ?? []),
    daily: Object.freeze(daily?.results ?? []),
  });
}

export async function analyticsPage({ db, nowMs, csrf }) {
  const data = await readAnalytics({ db, nowMs });
  const topRows = data.top.map((row) => '<tr><td><code>' + escapeHtml(row.path) + '</code></td><td>'
    + escapeHtml(String(row.views)) + '</td></tr>').join('');
  const dailyRows = data.daily.map((row) => '<tr><td>' + escapeHtml(row.day) + '</td><td>'
    + escapeHtml(String(row.views)) + '</td></tr>').join('');
  return page('Analytics', '<p><a href="/admin">Owner workspace</a> · <a href="/admin/drafts">Drafts</a>'
    + ' · <a href="/admin/security">Security and audit</a></p>'
    + '<dl class="admin__facts"><dt>Views today</dt><dd>' + data.todayTotal + '</dd>'
    + '<dt>Views, last 7 days</dt><dd>' + data.total + '</dd>'
    + '<dt>UTC day</dt><dd>' + escapeHtml(data.today) + '</dd></dl>'
    + '<h2>Top pages (7 days)</h2><table class="admin__table"><thead><tr><th>Path</th><th>Views</th></tr></thead><tbody>'
    + topRows + '</tbody></table>'
    + '<h2>Daily views</h2><table class="admin__table"><thead><tr><th>Day</th><th>Views</th></tr></thead><tbody>'
    + dailyRows + '</tbody></table>'
    + '<p class="admin__note">Aggregate only: no cookie, IP, user agent, referrer or account is stored.</p>'
    + '<form method="post" action="/admin/logout"><input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
    + '<button type="submit">Sign out</button></form>');
}
