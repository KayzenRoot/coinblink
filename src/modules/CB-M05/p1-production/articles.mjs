// CB-M05-P1-PUBLISHING-001: publish an owner draft as a public article.
//
// The article is a snapshot of the draft at publish time: title, summary, body,
// author, source URL, tags and the provenance note. Only text the owner wrote
// reaches this table; feed text is never copied. Every publish appends an
// immutable revision, and unpublishing keeps the row so the URL can answer 410.

export const ARTICLE_LOCALES = Object.freeze(['en', 'pt-br', 'es']);
const MAX_TAGS = 6;
const TAG_LIMIT = 24;

export function slugify(value) {
  const slug = String(value ?? '')
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '')
    .slice(0, 80)
    .replaceAll(/-+$/gu, '');
  return slug.length >= 3 ? slug : '';
}

export function validLocale(value) {
  return ARTICLE_LOCALES.includes(value);
}

export function normalizeTags(value) {
  const seen = new Set();
  for (const raw of String(value ?? '').split(',')) {
    const tag = raw.trim().toLowerCase().replaceAll(/\s+/gu, ' ').slice(0, TAG_LIMIT);
    if (tag !== '') seen.add(tag);
  }
  return Object.freeze([...seen].slice(0, MAX_TAGS));
}

function tagsToText(tags) {
  return tags.join(',');
}

function tagsFromText(value) {
  return String(value ?? '').split(',').filter((tag) => tag !== '');
}

async function uniqueSlug({ db, locale, base, articleId }) {
  let candidate = base;
  for (let attempt = 2; attempt < 40; attempt += 1) {
    const row = await db.prepare('SELECT id FROM cms_articles WHERE locale = ? AND slug = ?')
      .bind(locale, candidate).first();
    if (row === null || row === undefined || row.id === articleId) return candidate;
    candidate = base.slice(0, 76) + '-' + attempt;
  }
  return null;
}

/**
 * Publishes or republishes the current revision of a draft.
 * Returns `missing`, `invalid` or `published`.
 */
export async function publishDraft({
  db, draftId, locale, tags = '', provenanceNote = '', nowMs = Date.now(), slug: slugInput,
}) {
  const draft = await db.prepare(
    'SELECT id,title,summary,body,source_url AS sourceUrl,author_label AS authorLabel FROM cms_drafts WHERE id = ? AND owner_id = 1',
  ).bind(String(draftId ?? '')).first() ?? null;
  if (draft === null) return Object.freeze({ status: 'missing' });
  if (!validLocale(locale)) return Object.freeze({ status: 'invalid', reason: 'locale' });
  const note = String(provenanceNote ?? '').trim().slice(0, 400);
  if (note.length < 10) return Object.freeze({ status: 'invalid', reason: 'provenance' });

  const existing = await db.prepare(
    'SELECT id, revision FROM cms_articles WHERE draft_id = ? AND locale = ?',
  ).bind(draft.id, locale).first() ?? null;
  const base = slugify(slugInput ?? draft.title);
  if (base === '') return Object.freeze({ status: 'invalid', reason: 'slug' });
  const slug = await uniqueSlug({ db, locale, base, articleId: existing?.id ?? null });
  if (slug === null) return Object.freeze({ status: 'invalid', reason: 'slug' });

  const now = Math.floor(nowMs / 1000);
  const tagText = tagsToText(normalizeTags(tags));
  if (existing === null) {
    const id = crypto.randomUUID();
    await db.prepare(
      'INSERT INTO cms_articles(id,owner_id,draft_id,locale,slug,title,summary,body,tags,author_label,'
      + 'source_url,provenance_note,revision,status,published_at,updated_at) '
      + "VALUES (?,1,?,?,?,?,?,?,?,?,?,?,1,'published',?,?)",
    ).bind(id, draft.id, locale, slug, draft.title, draft.summary, draft.body, tagText,
      draft.authorLabel ?? '', draft.sourceUrl, note, now, now).run();
    await db.prepare(
      'INSERT INTO cms_article_revisions(article_id,revision,title,summary,body,tags,provenance_note,created_at) '
      + 'VALUES (?,1,?,?,?,?,?,?)',
    ).bind(id, draft.title, draft.summary, draft.body, tagText, note, now).run();
    return Object.freeze({
      status: 'published',
      article: Object.freeze({ id, slug, locale, revision: 1, created: true }),
    });
  }

  const next = Number(existing.revision) + 1;
  await db.prepare(
    'UPDATE cms_articles SET slug=?,title=?,summary=?,body=?,tags=?,author_label=?,source_url=?,'
    + "provenance_note=?,revision=?,status='published',updated_at=? WHERE id=?",
  ).bind(slug, draft.title, draft.summary, draft.body, tagText, draft.authorLabel ?? '',
    draft.sourceUrl, note, next, now, existing.id).run();
  await db.prepare(
    'INSERT INTO cms_article_revisions(article_id,revision,title,summary,body,tags,provenance_note,created_at) '
    + 'VALUES (?,?,?,?,?,?,?,?)',
  ).bind(existing.id, next, draft.title, draft.summary, draft.body, tagText, note, now).run();
  return Object.freeze({
    status: 'published',
    article: Object.freeze({ id: existing.id, slug, locale, revision: next, created: false }),
  });
}

export async function unpublishArticle({ db, id, nowMs = Date.now() }) {
  const result = await db.prepare(
    "UPDATE cms_articles SET status='unpublished', updated_at=? WHERE id=? AND status='published'",
  ).bind(Math.floor(nowMs / 1000), String(id ?? '')).run();
  return result?.meta?.changes === 1;
}

function mapArticle(row) {
  return Object.freeze({
    id: row.id,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    tags: Object.freeze(tagsFromText(row.tags)),
    authorLabel: row.authorLabel ?? '',
    sourceUrl: row.sourceUrl,
    provenanceNote: row.provenanceNote ?? '',
    revision: Number(row.revision),
    status: row.status,
    publishedAt: Number(row.publishedAt),
    updatedAt: Number(row.updatedAt),
  });
}

const COLUMNS = 'id,locale,slug,title,summary,body,tags,author_label AS authorLabel,'
  + 'source_url AS sourceUrl,provenance_note AS provenanceNote,revision,status,'
  + 'published_at AS publishedAt,updated_at AS updatedAt';

/**
 * @param {{db: any, locale?: string | null, limit?: number, includeAll?: boolean}} options
 */
export async function listArticles({ db, locale = null, limit = 50, includeAll = false }) {
  const bounded = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const state = includeAll ? "status IN ('published','unpublished')" : "status='published'";
  const rows = locale === null
    ? await db.prepare('SELECT ' + COLUMNS + ' FROM cms_articles WHERE ' + state + ' ORDER BY published_at DESC LIMIT ?')
      .bind(bounded).all()
    : await db.prepare('SELECT ' + COLUMNS + ' FROM cms_articles WHERE ' + state + ' AND locale=? ORDER BY published_at DESC LIMIT ?')
      .bind(locale, bounded).all();
  return Object.freeze((rows?.results ?? []).map(mapArticle));
}

export async function readArticle({ db, locale, slug }) {
  if (!validLocale(locale) || typeof slug !== 'string' || slug === '') return null;
  const row = await db.prepare('SELECT ' + COLUMNS + ' FROM cms_articles WHERE locale=? AND slug=?')
    .bind(locale, slug).first() ?? null;
  return row === null ? null : mapArticle(row);
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

/** Owner screen: publish a draft, see what is live, unpublish. */
export function articlesAdminSection({ articles, drafts, csrf, message = '', published = null }) {
  const notice = published === null ? '' : '<p class="admin__ok" role="status">Published /'
    + escapeHtml(published.locale) + '/article/' + escapeHtml(published.slug) + '</p>';
  const draftOptions = drafts.length === 0
    ? '<option value="">No drafts available</option>'
    : drafts.map((draft) => '<option value="' + escapeHtml(draft.id) + '">'
      + escapeHtml(draft.title.slice(0, 70)) + ' · r' + Number(draft.revision) + '</option>').join('');
  const rows = articles.length === 0
    ? '<p>Nothing published yet.</p>'
    : '<table class="admin__table"><thead><tr><th>Title</th><th>Locale</th><th>Slug</th>'
      + '<th>Rev</th><th>Published</th><th>State</th><th></th></tr></thead><tbody>'
      + articles.map((article) => '<tr><td>' + escapeHtml(article.title) + '</td><td>'
        + escapeHtml(article.locale) + '</td><td><code>' + escapeHtml(article.slug) + '</code></td><td>'
        + article.revision + '</td><td>' + escapeHtml(new Date(article.publishedAt * 1000).toISOString())
        + '</td><td>' + escapeHtml(article.status) + '</td><td>'
        + (article.status === 'published'
          ? '<a href="/' + escapeHtml(article.locale) + '/article/' + escapeHtml(article.slug) + '">Open</a>'
            + ' · <form method="post" action="/admin/articles/unpublish" class="admin__inline">'
            + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
            + '<input type="hidden" name="id" value="' + escapeHtml(article.id) + '">'
            + '<button type="submit">Unpublish</button></form>'
          : '')
        + '</td></tr>').join('') + '</tbody></table>';
  return (message === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(message) + '</p>')
    + notice
    + '<form method="post" action="/admin/articles/publish" class="admin__draft-form">'
    + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
    + '<label>Draft<select name="draft_id" required>' + draftOptions + '</select></label>'
    + '<label>Locale<select name="locale"><option value="en">English</option>'
    + '<option value="pt-br">Português (BR)</option><option value="es">Español</option></select></label>'
    + '<label>Tags<input name="tags" maxlength="160" placeholder="bitcoin, regulation"></label>'
    + '<label>Provenance note<input name="provenance_note" required minlength="10" maxlength="400" '
    + 'placeholder="Owner-authored summary; sources checked on 2026-10-31"></label>'
    + '<button type="submit">Publish</button></form>'
    + rows
    + '<p class="admin__note">Publishing copies the draft as it is now, with its revision, and appends an '
    + 'immutable revision record. Unpublishing keeps the URL answering 410.</p>';
}

export async function listArticleRevisions({ db, id, limit = 20 }) {
  const rows = await db.prepare(
    'SELECT revision,title,created_at AS createdAt FROM cms_article_revisions WHERE article_id=? ORDER BY revision DESC LIMIT ?',
  ).bind(String(id ?? ''), Math.min(Math.max(Number(limit) || 20, 1), 100)).all();
  return Object.freeze(rows?.results ?? []);
}
