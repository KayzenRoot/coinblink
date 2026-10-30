// CB-M08-P1-RESEARCH-001: owner-only AI research notes.
//
// The model sees exactly one private draft. Its answer is stored only after a
// deterministic check: every quoted piece of evidence must appear verbatim in
// the draft. Nothing is published, scheduled or sent to another service.
import { escapeHtml, page } from '../CB-M05/p1-production/owner-auth.mjs';

export const RESEARCH_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';

export const RESEARCH_LIMITS = Object.freeze({
  focusMax: 400,
  sourceMax: 6_000,
  dailyCap: 20,
  evidenceMax: 5,
  quoteMin: 12,
  quoteMax: 400,
  textMax: 1_200,
  questionMax: 240,
});

const LANGUAGES = Object.freeze({ en: 'English', 'pt-br': 'Brazilian Portuguese', es: 'Spanish' });
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/iu;
const MODEL = /^@cf\/[a-z0-9][a-z0-9./-]{2,120}$/u;

export function validResearchId(value) {
  return typeof value === 'string' && UUID.test(value);
}

export function validResearchModel(value) {
  return typeof value === 'string' && MODEL.test(value);
}

export function normalizeLanguage(value) {
  return typeof value === 'string' && Object.hasOwn(LANGUAGES, value) ? value : null;
}

/** Bounded editor focus; empty means a general review. */
export function normalizeFocus(value) {
  const focus = typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
  if (focus.length > RESEARCH_LIMITS.focusMax) throw new TypeError('focus is too long');
  return focus;
}

function truncate(text, max) {
  const value = typeof text === 'string' ? text : '';
  return value.length > max ? value.slice(0, max) : value;
}

/** The only source the model is allowed to use. */
export function sourceForDraft(draft) {
  return truncate([
    typeof draft?.title === 'string' ? draft.title : '',
    typeof draft?.summary === 'string' ? draft.summary : '',
    typeof draft?.body === 'string' ? draft.body : '',
  ].join('\n\n'), RESEARCH_LIMITS.sourceMax);
}

const SYSTEM_RULES = [
  "You are the research assistant inside CoinBlink's owner-only CMS.",
  'Analyse ONE private draft supplied by the editor.',
  'Rules:',
  '- Use only the draft text. Never add facts, names, numbers, dates, links or quotes that are not in the draft.',
  '- Never give investment, legal or financial advice.',
  '- Never suggest publishing; the draft stays private.',
  '- Return ONLY one JSON object, with no prose before or after it, in this exact shape:',
  '  {"summary":"...","impact":"...","questions":["...","...","..."],"evidence":[{"quote":"...","why":"..."}]}',
  '- summary and impact: at most 90 words each.',
  '- questions: exactly 3 short questions for the editor.',
  '- evidence: 2 to 5 items. Every quote must be copied verbatim from the draft, between 12 and 400 characters.',
].join('\n');

export function buildPrompt({ draft, focus, language }) {
  const label = LANGUAGES[language] ?? LANGUAGES.en;
  const editorFocus = typeof focus === 'string' && focus.trim() !== ''
    ? focus.trim()
    : 'General editorial review: clarity, impact and what still needs verification.';
  return Object.freeze({
    system: SYSTEM_RULES + '\n- Write the answer in ' + label + '.',
    user: 'Draft title: ' + (draft?.title ?? '')
      + '\n\nDraft summary: ' + (draft?.summary ?? '')
      + '\n\nDraft body:\n' + truncate(draft?.body ?? '', RESEARCH_LIMITS.sourceMax)
      + '\n\nEditor focus: ' + editorFocus,
  });
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/gu, ' ').trim();
}

function stringWithin(value, max) {
  return typeof value === 'string' && value.trim() !== '' && value.length <= max
    ? value.trim()
    : null;
}

/** Parse a strict JSON answer; tolerate only a fenced or padded wrapper. */
export function parseResearchOutput(text) {
  if (typeof text !== 'string' || text.trim() === '') return null;
  let body = text.trim();
  if (body.startsWith('```')) {
    body = body.replace(/^```(?:json)?\s*/iu, '').replace(/```\s*$/u, '').trim();
  }
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  let parsed;
  try {
    parsed = JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const summary = stringWithin(parsed.summary, RESEARCH_LIMITS.textMax);
  const impact = stringWithin(parsed.impact, RESEARCH_LIMITS.textMax);
  if (summary === null || impact === null) return null;
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) return null;
  const questions = parsed.questions
    .map((entry) => stringWithin(entry, RESEARCH_LIMITS.questionMax))
    .filter((entry) => entry !== null)
    .slice(0, 3);
  if (questions.length === 0) return null;
  if (!Array.isArray(parsed.evidence) || parsed.evidence.length === 0) return null;
  const evidence = [];
  for (const entry of parsed.evidence) {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) return null;
    const quote = stringWithin(entry.quote, RESEARCH_LIMITS.quoteMax);
    const why = stringWithin(entry.why, RESEARCH_LIMITS.quoteMax);
    if (quote === null || why === null) return null;
    if (quote.length < RESEARCH_LIMITS.quoteMin) return null;
    evidence.push(Object.freeze({ quote: normalizeWhitespace(quote), why }));
  }
  return Object.freeze({ summary, impact, questions: Object.freeze(questions), evidence: Object.freeze(evidence) });
}

/**
 * Keep only evidence that exists in the draft. The comparison ignores repeated
 * whitespace so a quote split across lines still matches, but it never rewrites
 * the stored quote. Returns null when nothing can be verified.
 */
export function verifyEvidence({ output, source }) {
  if (output === null || typeof output !== 'object') return { output: null, kept: 0, dropped: 0 };
  const haystack = normalizeWhitespace(source ?? '');
  const seen = new Set();
  const kept = [];
  let dropped = 0;
  for (const entry of output.evidence ?? []) {
    const quote = normalizeWhitespace(entry?.quote ?? '');
    if (quote.length < RESEARCH_LIMITS.quoteMin || seen.has(quote) || !haystack.includes(quote)) {
      dropped += 1;
      continue;
    }
    seen.add(quote);
    kept.push(Object.freeze({ quote, why: entry.why }));
    if (kept.length === RESEARCH_LIMITS.evidenceMax) break;
  }
  if (kept.length === 0) return { output: null, kept: 0, dropped };
  return Object.freeze({
    output: Object.freeze({ ...output, evidence: Object.freeze(kept) }),
    kept: kept.length,
    dropped,
  });
}

async function digestInput({ draft, focus, language }) {
  const input = [draft?.id ?? '', draft?.revision ?? '', sourceForDraft(draft), focus, language].join('\u0000');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, '0')).join('');
}

function utcDayStartSeconds(nowMs) {
  return Math.floor(nowMs / 86_400_000) * 86_400;
}

async function usedToday(db, nowMs) {
  const row = await db.prepare('SELECT COUNT(*) AS used FROM cms_research_notes WHERE owner_id=1 AND created_at>=?')
    .bind(utcDayStartSeconds(nowMs)).first();
  return Number(row?.used ?? 0);
}

export async function researchUsage({ db, nowMs, cap = RESEARCH_LIMITS.dailyCap }) {
  return Object.freeze({ used: await usedToday(db, nowMs), cap });
}

export async function generateResearch({ db, ai, draft, focus, language, nowMs, model = RESEARCH_MODEL }) {
  if (draft === null || typeof draft !== 'object' || typeof draft.id !== 'string') return { status: 'missing' };
  let normalizedFocus;
  try {
    normalizedFocus = normalizeFocus(focus);
  } catch {
    return { status: 'invalid' };
  }
  const normalizedLanguage = normalizeLanguage(language);
  if (normalizedLanguage === null) return { status: 'invalid' };
  if (ai === null || typeof ai?.run !== 'function') return { status: 'unavailable' };
  if (!validResearchModel(model)) return { status: 'unavailable' };
  const used = await usedToday(db, nowMs);
  if (used >= RESEARCH_LIMITS.dailyCap) return { status: 'capped', used };
  const prompt = buildPrompt({ draft, focus: normalizedFocus, language: normalizedLanguage });
  let raw;
  try {
    const result = await ai.run(model, {
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      max_tokens: 700,
      temperature: 0.2,
    });
    raw = typeof result?.response === 'string' ? result.response : '';
  } catch {
    return { status: 'unavailable' };
  }
  const parsed = parseResearchOutput(raw);
  if (parsed === null) return { status: 'invalid_output' };
  const verified = verifyEvidence({ output: parsed, source: sourceForDraft(draft) });
  if (verified.output === null) return { status: 'unverified_output' };
  const createdAt = Math.floor(nowMs / 1000);
  const note = Object.freeze({
    id: crypto.randomUUID(),
    draftId: draft.id,
    draftRevision: Number(draft.revision),
    model,
    language: normalizedLanguage,
    focus: normalizedFocus,
    summary: verified.output.summary,
    impact: verified.output.impact,
    questions: verified.output.questions,
    evidence: verified.output.evidence,
    createdAt,
  });
  const inserted = await db.prepare(
    'INSERT INTO cms_research_notes(id,owner_id,draft_id,draft_revision,model,language,focus,input_digest,output_json,created_at) VALUES (?,1,?,?,?,?,?,?,?,?)',
  ).bind(
    note.id, note.draftId, note.draftRevision, note.model, note.language, note.focus,
    await digestInput({ draft, focus: normalizedFocus, language: normalizedLanguage }),
    JSON.stringify({
      summary: note.summary, impact: note.impact, questions: note.questions, evidence: note.evidence,
    }),
    note.createdAt,
  ).run();
  if (inserted?.meta?.changes !== 1) return { status: 'unavailable' };
  return Object.freeze({ status: 'created', note, dropped: verified.dropped, used: used + 1 });
}

export async function listResearchNotes(db) {
  const result = await db.prepare('SELECT id,draft_id AS draftId,draft_revision AS draftRevision,model,language,created_at AS createdAt FROM cms_research_notes WHERE owner_id=1 ORDER BY created_at DESC LIMIT 20').all();
  return result?.results ?? [];
}

export async function readResearchNote(db, id) {
  if (!validResearchId(id)) return null;
  const row = await db.prepare('SELECT id,draft_id AS draftId,draft_revision AS draftRevision,model,language,focus,output_json AS outputJson,created_at AS createdAt FROM cms_research_notes WHERE id=? AND owner_id=1').bind(id).first();
  if (row === null || row === undefined) return null;
  let output;
  try {
    output = JSON.parse(row.outputJson);
  } catch {
    return null;
  }
  return Object.freeze({ ...row, ...output });
}

/** Accept both the stored seconds and a legacy millisecond value. */
function isoFromEpoch(value) {
  const numeric = Number(value);
  const seconds = numeric > 1e12 ? Math.floor(numeric / 1000) : numeric;
  return new Date(seconds * 1000).toISOString();
}

function csrfField(csrf) {
  return '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">';
}

function signOut(csrf) {
  return '<form method="post" action="/admin/logout">' + csrfField(csrf) + '<button type="submit">Sign out</button></form>';
}

export function researchListPage({ drafts, notes, csrf, used, cap = RESEARCH_LIMITS.dailyCap, error = '' }) {
  const options = drafts.map((draft) => '<option value="' + escapeHtml(draft.id) + '">'
    + escapeHtml(draft.title) + ' · revision ' + escapeHtml(String(draft.revision)) + '</option>').join('');
  const items = notes.map((note) => '<li><a href="/admin/research/' + escapeHtml(note.id) + '">'
    + escapeHtml(isoFromEpoch(note.createdAt)) + '</a> <span class="admin__note">· '
    + escapeHtml(note.model) + ' · ' + escapeHtml(note.language) + '</span></li>').join('');
  const form = drafts.length === 0
    ? '<p>Create a draft first. The research desk only analyses your own private drafts.</p>'
    : '<form method="post" action="/admin/research" class="admin__draft-form">'
      + csrfField(csrf)
      + '<label>Draft<select name="draftId" required>' + options + '</select></label>'
      + '<label>Editor focus (optional)<textarea name="focus" maxlength="' + RESEARCH_LIMITS.focusMax + '" rows="3" placeholder="What should the analysis stress?"></textarea></label>'
      + '<label>Language<select name="language"><option value="en">English</option><option value="pt-br">Português (Brasil)</option><option value="es">Español</option></select></label>'
      + '<button type="submit">Generate research note</button></form>';
  return page('Research desk', '<p><a href="/admin">Owner workspace</a> · <a href="/admin/drafts">Drafts</a>'
    + ' · <a href="/admin/analytics">Analytics</a> · <a href="/admin/security">Security and audit</a></p>'
    + (error === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(error) + '</p>')
    + '<dl class="admin__facts"><dt>Notes today</dt><dd>' + escapeHtml(String(used)) + ' of ' + escapeHtml(String(cap)) + '</dd>'
    + '<dt>Model</dt><dd><code>' + escapeHtml(RESEARCH_MODEL) + '</code></dd></dl>'
    + form
    + '<h2>Recent notes</h2>'
    + (notes.length === 0 ? '<p>No research notes yet.</p>' : '<ul class="admin__drafts">' + items + '</ul>')
    + '<p class="admin__note">The model sees only the selected draft. Every quote is checked against that draft before a note is saved. Nothing is published or scheduled.</p>'
    + signOut(csrf));
}

export function researchNotePage({ note, csrf }) {
  const questions = (note.questions ?? []).map((entry) => '<li>' + escapeHtml(entry) + '</li>').join('');
  const evidence = (note.evidence ?? []).map((entry) => '<li><blockquote>' + escapeHtml(entry.quote)
    + '</blockquote><p class="admin__note">' + escapeHtml(entry.why) + '</p></li>').join('');
  return page('Research note', '<p><a href="/admin/research">Research desk</a> · <a href="/admin/drafts/'
    + escapeHtml(note.draftId) + '">Open draft</a> · <a href="/admin">Owner workspace</a></p>'
    + '<dl class="admin__facts"><dt>Draft revision</dt><dd>' + escapeHtml(String(note.draftRevision)) + '</dd>'
    + '<dt>Model</dt><dd><code>' + escapeHtml(note.model) + '</code></dd>'
    + '<dt>Language</dt><dd>' + escapeHtml(note.language) + '</dd>'
    + '<dt>Created</dt><dd>' + escapeHtml(isoFromEpoch(note.createdAt)) + '</dd>'
    + (note.focus === '' ? '' : '<dt>Focus</dt><dd>' + escapeHtml(note.focus) + '</dd>') + '</dl>'
    + '<h2>Summary</h2><p>' + escapeHtml(note.summary) + '</p>'
    + '<h2>Impact</h2><p>' + escapeHtml(note.impact) + '</p>'
    + '<h2>Questions for the editor</h2><ul>' + questions + '</ul>'
    + '<h2>Evidence from the draft</h2><ul class="admin__evidence">' + evidence + '</ul>'
    + '<p class="admin__note">AI-assisted analysis of a private draft. Not published, not scheduled and not externally fact-checked. Verify each quote against the draft.</p>'
    + signOut(csrf));
}
