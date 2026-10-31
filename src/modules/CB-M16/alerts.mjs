// CB-M16-P1-ALERTS-001: one daily digest per reader, built from the watchlist.
//
// The digest only links to headlines that the collector already has: title,
// publisher and the original URL. Nothing is copied, and a reader with no match
// receives nothing. A reader gets at most one digest per UTC day.

import { sendEmail } from '../CB-M10/resend.mjs';
import { getSetting } from '../CB-M05/p1-production/settings.mjs';

const KEYWORDS = Object.freeze({
  BTC: Object.freeze(['bitcoin', 'btc']),
  ETH: Object.freeze(['ethereum', 'ether', 'eth']),
  SOL: Object.freeze(['solana']),
  XRP: Object.freeze(['xrp', 'ripple']),
  DOGE: Object.freeze(['dogecoin', 'doge']),
  ADA: Object.freeze(['cardano']),
  BNB: Object.freeze(['bnb', 'binance coin']),
  AVAX: Object.freeze(['avalanche']),
  LINK: Object.freeze(['chainlink']),
  MATIC: Object.freeze(['polygon', 'matic']),
  TON: Object.freeze(['toncoin', 'ton blockchain']),
  LTC: Object.freeze(['litecoin']),
});

export function keywordsFor(symbol) {
  const clean = String(symbol ?? '').toUpperCase();
  return KEYWORDS[clean] ?? Object.freeze([clean.toLowerCase()]);
}

function matches(headline, keywords) {
  const title = String(headline?.title ?? '').toLowerCase();
  return keywords.some((word) => title.includes(word));
}

/** Reader + symbols pairs that have at least one live headline today. */
export async function buildDigests({ db, snapshot, nowMs = Date.now() }) {
  const items = Array.isArray(snapshot?.items) ? snapshot.items : [];
  if (items.length === 0) return Object.freeze([]);
  const rows = await db.prepare(
    "SELECT r.id AS id, r.email AS email, w.symbol AS symbol FROM cms_readers r "
    + "JOIN cms_watchlist w ON w.reader_id = r.id WHERE r.status='active' ORDER BY r.id",
  ).all();
  const byReader = new Map();
  for (const row of rows?.results ?? []) {
    const hits = items.filter((item) => matches(item, keywordsFor(row.symbol))).slice(0, 4);
    if (hits.length === 0) continue;
    const entry = byReader.get(row.id) ?? { readerId: row.id, email: row.email, symbols: [], headlines: [] };
    entry.symbols.push(row.symbol);
    for (const hit of hits) {
      if (!entry.headlines.some((existing) => existing.link === hit.link)) entry.headlines.push(hit);
    }
    byReader.set(row.id, entry);
  }
  return Object.freeze([...byReader.values()].map((entry) => Object.freeze({
    readerId: entry.readerId,
    email: entry.email,
    symbols: Object.freeze(entry.symbols),
    headlines: Object.freeze(entry.headlines),
    nowMs,
  })));
}

function messageFor({ symbols, headlines }) {
  const lines = ['CoinBlink · watchlist digest', '', 'Your symbols: ' + symbols.join(', '), ''];
  for (const headline of headlines) {
    lines.push('• ' + headline.title);
    lines.push('  ' + headline.sourceName + ' · ' + (headline.publishedAt ?? 'undated'));
    lines.push('  ' + headline.link);
    lines.push('');
  }
  lines.push('Headlines are attributed to the original publisher; CoinBlink does not republish article text.');
  lines.push('Manage your watchlist: /reader');
  return lines.join('\n');
}

/**
 * Sends at most one digest per reader per UTC day. Returns counts and never
 * throws; a provider failure is recorded and the other readers continue.
 */
export async function sendDigests({ db, secret, env, snapshot, nowMs = Date.now(), fetchImpl = globalThis.fetch }) {
  const apiKey = await getSetting({ db, secret, env, key: 'RESEND_API_KEY' });
  const from = await getSetting({ db, secret, env, key: 'COINBLINK_EMAIL_FROM' });
  if (typeof apiKey !== 'string' || typeof from !== 'string') {
    return Object.freeze({ status: 'not_configured', sent: 0, failed: 0, skipped: 0, empty: 0 });
  }
  const digests = await buildDigests({ db, snapshot, nowMs });
  const day = new Date(nowMs).toISOString().slice(0, 10);
  const now = Math.floor(nowMs / 1000);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const digest of digests) {
    const claimed = await db.prepare(
      'INSERT OR IGNORE INTO cms_reader_alert_sends(reader_id,day,items,status,created_at) VALUES (?,?,?,?,?)',
    ).bind(digest.readerId, day, digest.headlines.length, 'empty', now).run();
    if (claimed?.meta?.changes !== 1) {
      skipped += 1;
      continue;
    }
    let status = 'sent';
    let detail = '';
    try {
      const result = await sendEmail({
        fetchImpl, apiKey, from, to: digest.email, subject: 'CoinBlink · your watchlist digest',
        text: messageFor(digest),
      });
      if (result?.status !== 'sent') {
        status = 'failed';
        detail = String(result?.name ?? 'provider_error').slice(0, 200);
      }
    } catch {
      status = 'failed';
      detail = 'exception';
    }
    await db.prepare('UPDATE cms_reader_alert_sends SET status=?, detail=? WHERE reader_id=? AND day=?')
      .bind(status, detail, digest.readerId, day).run();
    if (status === 'sent') sent += 1;
    else failed += 1;
  }
  return Object.freeze({ status: 'done', sent, failed, skipped, empty: 0, readers: digests.length, day });
}

/** Owner preview: how many readers would receive what, without sending. */
export async function previewDigests({ db, snapshot, nowMs = Date.now() }) {
  const digests = await buildDigests({ db, snapshot, nowMs });
  const day = new Date(nowMs).toISOString().slice(0, 10);
  let alreadySent;
  try {
    const rows = await db.prepare('SELECT reader_id AS readerId FROM cms_reader_alert_sends WHERE day=?').bind(day).all();
    alreadySent = (rows?.results ?? []).length;
  } catch {
    alreadySent = 0;
  }
  return Object.freeze({
    day,
    readers: digests.length,
    headlines: digests.reduce((total, digest) => total + digest.headlines.length, 0),
    alreadySent,
    sample: digests.slice(0, 3).map((digest) => Object.freeze({
      email: digest.email, symbols: digest.symbols, headlines: digest.headlines.map((hit) => hit.title),
    })),
  });
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function alertsAdminSection({ preview, csrf, result = null, message = '' }) {
  const outcome = result === null ? '' : '<p class="admin__ok" role="status">Digest '
    + escapeHtml(result.day) + ': ' + result.sent + ' sent, ' + result.failed + ' failed, '
    + result.skipped + ' already sent today.</p>';
  const sample = preview.sample.length === 0
    ? '<p>No reader has a match in the current collection.</p>'
    : '<ul class="admin__credentials">' + preview.sample.map((entry) => '<li><code>'
      + escapeHtml(entry.email) + '</code> · ' + escapeHtml(entry.symbols.join(', ')) + ' · '
      + entry.headlines.length + ' headline(s)<br><small>' + escapeHtml(entry.headlines[0] ?? '')
      + '</small></li>').join('') + '</ul>';
  return (message === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(message) + '</p>')
    + outcome
    + '<dl class="admin__facts"><dt>Day (UTC)</dt><dd>' + escapeHtml(preview.day) + '</dd>'
    + '<dt>Readers with a match</dt><dd>' + preview.readers + '</dd>'
    + '<dt>Headlines matched</dt><dd>' + preview.headlines + '</dd>'
    + '<dt>Already sent today</dt><dd>' + preview.alreadySent + '</dd></dl>'
    + sample
    + '<form method="post" action="/admin/alerts/send" class="admin__draft-form">'
    + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
    + '<button type="submit">Send today\'s digest</button></form>'
    + '<p class="admin__note">One digest per reader per UTC day, built only from the current collection. '
    + 'A reader with no matching headline receives nothing.</p>';
}
