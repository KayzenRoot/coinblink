// CB-M10-P1-EDITIONS-001: newsletter editions composed from published articles.
//
// An edition is a subject, an intro and an ordered list of published articles.
// Sending happens once, to confirmed subscribers only, and every send is
// recorded append-only. Each message carries a fresh unsubscribe token, so the
// link works without storing any recoverable secret.

import { sendEmail } from './resend.mjs';
import { getSetting } from '../CB-M05/p1-production/settings.mjs';

export const EDITION_LOCALES = Object.freeze(['en', 'pt-br', 'es']);
const MAX_ARTICLES = 8;

function hex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function digestOf(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return hex(new Uint8Array(digest));
}

export function validLocale(value) {
  return EDITION_LOCALES.includes(value);
}

/** Keeps only the ids of articles that exist, are published and match the locale. */
export async function resolveArticles({ db, locale, articleIds }) {
  const ids = [...new Set((Array.isArray(articleIds) ? articleIds : [])
    .map((id) => String(id)).filter((id) => id !== ''))].slice(0, MAX_ARTICLES);
  if (ids.length === 0) return Object.freeze([]);
  const rows = await db.prepare(
    'SELECT id, locale, slug, title, summary FROM cms_articles WHERE status=\'published\' AND locale=?',
  ).bind(locale).all();
  const byId = new Map((rows?.results ?? []).map((row) => [row.id, row]));
  return Object.freeze(ids.filter((id) => byId.has(id)).map((id) => Object.freeze(byId.get(id))));
}

export async function createEdition({ db, locale, subject, intro = '', articleIds, nowMs = Date.now() }) {
  if (!validLocale(locale)) return Object.freeze({ status: 'invalid', reason: 'locale' });
  const cleanSubject = String(subject ?? '').trim();
  if (cleanSubject.length < 4 || cleanSubject.length > 140) {
    return Object.freeze({ status: 'invalid', reason: 'subject' });
  }
  const cleanIntro = String(intro ?? '').trim().slice(0, 600);
  const articles = await resolveArticles({ db, locale, articleIds });
  if (articles.length === 0) return Object.freeze({ status: 'invalid', reason: 'articles' });
  const id = crypto.randomUUID();
  const now = Math.floor(nowMs / 1000);
  await db.prepare(
    'INSERT INTO cms_newsletter_editions(id,locale,subject,intro,article_ids,status,recipients,created_at) '
    + "VALUES (?,?,?,?,?,'draft',0,?)",
  ).bind(id, locale, cleanSubject, cleanIntro, articles.map((article) => article.id).join(','), now).run();
  return Object.freeze({ status: 'draft', edition: Object.freeze({ id, locale, subject: cleanSubject, articles }) });
}

export async function listEditions({ db, limit = 20 }) {
  const rows = await db.prepare(
    'SELECT id, locale, subject, status, recipients, created_at AS createdAt, sent_at AS sentAt '
    + 'FROM cms_newsletter_editions ORDER BY created_at DESC LIMIT ?',
  ).bind(Math.min(Math.max(Number(limit) || 20, 1), 100)).all();
  return Object.freeze((rows?.results ?? []).map((row) => Object.freeze({
    id: row.id,
    locale: row.locale,
    subject: row.subject,
    status: row.status,
    recipients: Number(row.recipients),
    createdAt: Number(row.createdAt),
    sentAt: row.sentAt === null ? null : Number(row.sentAt),
  })));
}

export async function readEdition({ db, id }) {
  const row = await db.prepare(
    'SELECT id, locale, subject, intro, article_ids AS articleIds, status, recipients, '
    + 'created_at AS createdAt, sent_at AS sentAt FROM cms_newsletter_editions WHERE id=?',
  ).bind(String(id ?? '')).first() ?? null;
  if (row === null) return null;
  return Object.freeze({
    id: row.id,
    locale: row.locale,
    subject: row.subject,
    intro: row.intro,
    articleIds: Object.freeze(String(row.articleIds).split(',').filter((value) => value !== '')),
    status: row.status,
    recipients: Number(row.recipients),
    createdAt: Number(row.createdAt),
    sentAt: row.sentAt === null ? null : Number(row.sentAt),
  });
}

function messageFor({ edition, articles, origin, unsubscribeUrl }) {
  const lines = [edition.subject, ''];
  if (edition.intro !== '') lines.push(edition.intro, '');
  for (const article of articles) {
    lines.push('• ' + article.title);
    lines.push('  ' + article.summary);
    lines.push('  ' + new URL('/' + edition.locale + '/article/' + article.slug, origin).toString());
    lines.push('');
  }
  lines.push('You are receiving this because you confirmed your address on CoinBlink.');
  lines.push('Unsubscribe: ' + unsubscribeUrl);
  return lines.join('\n');
}

/**
 * Sends a draft edition to every confirmed subscriber once. A provider failure
 * is recorded per address and does not stop the rest of the run.
 */
export async function sendEdition({
  db, secret, env, id, nowMs = Date.now(), origin, fetchImpl = globalThis.fetch,
}) {
  const edition = await readEdition({ db, id });
  if (edition === null) return Object.freeze({ status: 'missing' });
  if (edition.status === 'sent') return Object.freeze({ status: 'already_sent' });
  const apiKey = await getSetting({ db, secret, env, key: 'RESEND_API_KEY' });
  const from = await getSetting({ db, secret, env, key: 'COINBLINK_EMAIL_FROM' });
  if (typeof apiKey !== 'string' || typeof from !== 'string') {
    return Object.freeze({ status: 'not_configured', missing: Object.freeze(['RESEND_API_KEY', 'COINBLINK_EMAIL_FROM']) });
  }
  const articles = await resolveArticles({ db, locale: edition.locale, articleIds: edition.articleIds });
  if (articles.length === 0) return Object.freeze({ status: 'empty' });

  const subscribers = await db.prepare(
    "SELECT email FROM cms_newsletter_subscribers WHERE status='confirmed' ORDER BY confirmed_at",
  ).all();
  const now = Math.floor(nowMs / 1000);
  let sent = 0;
  let failed = 0;
  for (const row of subscribers?.results ?? []) {
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    await db.prepare('UPDATE cms_newsletter_subscribers SET token_digest=? WHERE email=?')
      .bind(await digestOf(token), row.email).run();
    const unsubscribeUrl = new URL('/newsletter/confirm?action=unsubscribe&token=' + token, origin).toString();
    let outcome = 'sent';
    let detail = '';
    try {
      const result = await sendEmail({
        fetchImpl, apiKey, from, to: row.email, subject: edition.subject,
        text: messageFor({ edition, articles, origin, unsubscribeUrl }),
      });
      if (result?.status !== 'sent') {
        outcome = 'failed';
        detail = String(result?.name ?? 'provider_error').slice(0, 200);
      }
    } catch {
      outcome = 'failed';
      detail = 'exception';
    }
    if (outcome === 'sent') sent += 1;
    else failed += 1;
    await db.prepare(
      'INSERT OR IGNORE INTO cms_newsletter_sends(edition_id,email,status,detail,created_at) VALUES (?,?,?,?,?)',
    ).bind(edition.id, row.email, outcome, detail, now).run();
  }
  await db.prepare("UPDATE cms_newsletter_editions SET status='sent', recipients=?, sent_at=? WHERE id=?")
    .bind(sent, now, edition.id).run();
  return Object.freeze({ status: 'sent', sent, failed });
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function editionsAdminSection({ editions, articles, csrf, message = '', result = null }) {
  const notice = result === null ? '' : '<p class="admin__ok" role="status">Edition sent to '
    + result.sent + ' subscriber(s)' + (result.failed > 0 ? ', ' + result.failed + ' failed' : '') + '.</p>';
  const articleOptions = articles.length === 0
    ? '<p class="admin__note">Publish an article first: editions are built from published articles.</p>'
    : articles.map((article) => '<label class="admin__check"><input type="checkbox" name="article_ids" value="'
      + escapeHtml(article.id) + '"> ' + escapeHtml(article.title) + ' <small>('
      + escapeHtml(article.locale) + ')</small></label>').join('');
  const rows = editions.length === 0
    ? '<p>No editions yet.</p>'
    : '<table class="admin__table"><thead><tr><th>Subject</th><th>Locale</th><th>State</th>'
      + '<th>Recipients</th><th>Created</th><th></th></tr></thead><tbody>'
      + editions.map((edition) => '<tr><td>' + escapeHtml(edition.subject) + '</td><td>'
        + escapeHtml(edition.locale) + '</td><td>' + escapeHtml(edition.status) + '</td><td>'
        + edition.recipients + '</td><td>' + escapeHtml(new Date(edition.createdAt * 1000).toISOString())
        + '</td><td>' + (edition.status === 'draft'
          ? '<form method="post" action="/admin/editions/send" class="admin__inline">'
            + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
            + '<input type="hidden" name="id" value="' + escapeHtml(edition.id) + '">'
            + '<button type="submit">Send</button></form>'
          : '')
        + '</td></tr>').join('') + '</tbody></table>';
  return (message === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(message) + '</p>')
    + notice
    + '<form method="post" action="/admin/editions/create" class="admin__draft-form">'
    + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
    + '<label>Subject<input name="subject" required minlength="4" maxlength="140"></label>'
    + '<label>Intro<input name="intro" maxlength="600" placeholder="One paragraph, no promises"></label>'
    + '<label>Locale<select name="locale"><option value="en">English</option>'
    + '<option value="pt-br">Português (BR)</option><option value="es">Español</option></select></label>'
    + '<fieldset class="admin__checklist"><legend>Articles</legend>' + articleOptions + '</fieldset>'
    + '<button type="submit">Save draft</button></form>'
    + rows
    + '<p class="admin__note">A draft sends once, to confirmed subscribers only, and every message carries '
    + 'a fresh unsubscribe link. Each send is recorded and cannot be rewritten.</p>';
}
