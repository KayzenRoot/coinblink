// CB-M05-P1-DRAFTS-001: owner-only draft workspace.
//
// Drafts only. There is no publish, schedule, rights-clearance or public route
// in this module; every write requires an owner session and a form CSRF value.
import { escapeHtml, keyedDigest, page } from './owner-auth.mjs';

export const DRAFT_LIMITS = Object.freeze({
  titleMin: 8, titleMax: 140, summaryMin: 20, summaryMax: 400,
  bodyMax: 40_000, authorMax: 120,
});
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu;

export function validDraftId(value) {
  return typeof value === 'string' && UUID.test(value);
}

/** Validate and normalize one draft form. Throws a bounded TypeError. */
export function validateDraft(input) {
  const text = (name) => (typeof input?.[name] === 'string' ? input[name].trim() : '');
  const title = text('title');
  const summary = text('summary');
  const body = typeof input?.body === 'string' ? input.body : '';
  const sourceUrl = text('sourceUrl');
  const authorLabel = text('authorLabel');
  if (title.length < DRAFT_LIMITS.titleMin || title.length > DRAFT_LIMITS.titleMax) {
    throw new TypeError('title must be between ' + DRAFT_LIMITS.titleMin + ' and ' + DRAFT_LIMITS.titleMax + ' characters');
  }
  if (summary.length < DRAFT_LIMITS.summaryMin || summary.length > DRAFT_LIMITS.summaryMax) {
    throw new TypeError('summary must be between ' + DRAFT_LIMITS.summaryMin + ' and ' + DRAFT_LIMITS.summaryMax + ' characters');
  }
  if (body.trim() === '' || body.length > DRAFT_LIMITS.bodyMax) throw new TypeError('body is out of bounds');
  if (authorLabel.length > DRAFT_LIMITS.authorMax) throw new TypeError('author label is too long');
  let parsed;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new TypeError('source URL must be a valid HTTPS URL');
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
    throw new TypeError('source URL must be a valid HTTPS URL');
  }
  return Object.freeze({ title, summary, body, sourceUrl: parsed.href, authorLabel });
}

export async function listDrafts(db) {
  const result = await db.prepare('SELECT id,title,revision,status,updated_at AS updatedAt FROM cms_drafts WHERE owner_id=1 ORDER BY updated_at DESC LIMIT 50').all();
  return result?.results ?? [];
}

export async function readDraft(db, id) {
  if (!validDraftId(id)) return null;
  return (await db.prepare('SELECT id,title,summary,body,source_url AS sourceUrl,author_label AS authorLabel,status,revision,created_at AS createdAt,updated_at AS updatedAt FROM cms_drafts WHERE id=? AND owner_id=1').bind(id).first()) ?? null;
}

export async function listRevisions(db, id) {
  if (!validDraftId(id)) return [];
  const result = await db.prepare('SELECT revision,title,created_at AS createdAt FROM cms_draft_revisions WHERE draft_id=? ORDER BY revision DESC LIMIT 50').bind(id).all();
  return result?.results ?? [];
}

export async function createDraft({ db, secret, input, now }) {
  const values = validateDraft(input);
  const id = crypto.randomUUID();
  const marker = crypto.randomUUID();
  const createKey = await keyedDigest(secret, 'draft:' + id);
  const results = await db.batch([
    db.prepare("INSERT INTO cms_drafts(id,owner_id,title,summary,body,source_url,author_label,status,revision,create_key_digest,write_marker,created_at,updated_at) VALUES (?,1,?,?,?,?,?,'draft',1,?,?,?,?)")
      .bind(id, values.title, values.summary, values.body, values.sourceUrl, values.authorLabel, createKey, marker, now, now),
    db.prepare('INSERT INTO cms_draft_revisions(draft_id,revision,actor_owner_id,title,summary,body,source_url,author_label,write_marker,created_at) VALUES (?,1,1,?,?,?,?,?,?,?)')
      .bind(id, values.title, values.summary, values.body, values.sourceUrl, values.authorLabel, marker, now),
  ]);
  if (results.some((result) => result?.meta?.changes !== 1)) return null;
  return id;
}

export async function updateDraft({ db, input, now }) {
  if (!validDraftId(input?.id)) return { status: 'missing' };
  const values = validateDraft(input);
  const current = await readDraft(db, input.id);
  if (current === null) return { status: 'missing' };
  const revision = Number(input.revision);
  if (!Number.isSafeInteger(revision) || revision !== current.revision) return { status: 'conflict', draft: current };
  const next = revision + 1;
  const marker = crypto.randomUUID();
  const results = await db.batch([
    db.prepare('UPDATE cms_drafts SET title=?,summary=?,body=?,source_url=?,author_label=?,revision=?,write_marker=?,updated_at=? WHERE id=? AND owner_id=1 AND revision=?')
      .bind(values.title, values.summary, values.body, values.sourceUrl, values.authorLabel, next, marker, now, input.id, revision),
    db.prepare('INSERT INTO cms_draft_revisions(draft_id,revision,actor_owner_id,title,summary,body,source_url,author_label,write_marker,created_at) SELECT ?,?,1,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM cms_drafts WHERE id=? AND revision=?)')
      .bind(input.id, next, values.title, values.summary, values.body, values.sourceUrl, values.authorLabel, marker, now, input.id, next),
  ]);
  if (results.some((result) => result?.meta?.changes !== 1)) return { status: 'conflict', draft: current };
  return { status: 'saved', draft: { ...current, ...values, revision: next, updatedAt: now } };
}

export function draftMarkdown(draft) {
  return ['# ' + draft.title, '', draft.summary, '',
    'Source: ' + draft.sourceUrl, 'Author: ' + (draft.authorLabel || '—'),
    'Revision: ' + draft.revision, 'Status: DRAFT — NOT PUBLISHED', '', draft.body, ''].join('\n');
}

function csrfField(csrf) {
  return '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">';
}

export function draftsPage({ drafts, csrf }) {
  const items = drafts.map((draft) => '<li><a href="/admin/drafts/' + escapeHtml(draft.id) + '">'
    + escapeHtml(draft.title) + '</a> <span class="admin__note">· revision ' + escapeHtml(String(draft.revision))
    + ' · ' + escapeHtml(draft.status) + '</span></li>').join('');
  return page('Drafts', '<p><a href="/admin/drafts/new">Create a draft</a> · <a href="/admin">Owner workspace</a></p>'
    + (drafts.length === 0 ? '<p>No drafts yet.</p>' : '<ul class="admin__drafts">' + items + '</ul>')
    + '<p class="admin__note">Every item is a private draft. Nothing is published, scheduled or rights-cleared.</p>'
    + '<form method="post" action="/admin/logout">' + csrfField(csrf) + '<button type="submit">Sign out</button></form>');
}

export function draftFormPage({ draft, csrf, action, error = '' }) {
  const editing = draft !== null;
  const value = (name) => escapeHtml(draft?.[name] ?? '');
  return page(editing ? 'Edit draft' : 'New draft',
    (error === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(error) + '</p>')
    + '<form method="post" action="' + escapeHtml(action) + '" class="admin__draft-form">'
    + csrfField(csrf)
    + (editing ? '<input type="hidden" name="revision" value="' + escapeHtml(String(draft.revision)) + '">' : '')
    + '<label>Title<input name="title" required minlength="8" maxlength="140" value="' + value('title') + '"></label>'
    + '<label>Summary<textarea name="summary" required minlength="20" maxlength="400" rows="3">' + value('summary') + '</textarea></label>'
    + '<label>Body<textarea name="body" required maxlength="40000" rows="12">' + value('body') + '</textarea></label>'
    + '<label>Source URL<input name="sourceUrl" type="url" required value="' + value('sourceUrl') + '"></label>'
    + '<label>Author label<input name="authorLabel" maxlength="120" value="' + value('authorLabel') + '"></label>'
    + '<button type="submit">' + (editing ? 'Save revision' : 'Create draft') + '</button></form>'
    + (editing ? '<p class="admin__note"><a href="/admin/drafts/' + escapeHtml(draft.id) + '/revisions">Revisions</a>'
      + ' · <a href="/admin/drafts/' + escapeHtml(draft.id) + '/export">Export Markdown</a></p>' : '')
    + '<p class="admin__note"><a href="/admin/drafts">Back to drafts</a></p>');
}

export function draftRevisionsPage({ draft, revisions, csrf }) {
  const items = revisions.map((entry) => '<li>Revision ' + escapeHtml(String(entry.revision)) + ' · '
    + escapeHtml(entry.title ?? '') + ' <span class="admin__note">· ' + escapeHtml(String(entry.createdAt)) + '</span></li>').join('');
  return page('Draft revisions', '<p>' + escapeHtml(draft.title) + '</p>'
    + '<ul class="admin__drafts">' + items + '</ul>'
    + '<p class="admin__note"><a href="/admin/drafts/' + escapeHtml(draft.id) + '">Edit current revision</a>'
    + ' · <a href="/admin/drafts">Back to drafts</a></p>'
    + '<form method="post" action="/admin/logout">' + csrfField(csrf) + '<button type="submit">Sign out</button></form>');
}
