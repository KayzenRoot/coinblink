// CB-M03-P1-SOURCE-POLICY-001: which collectors readers may see.
//
// The policy is display-level on purpose: the collector keeps fetching, so
// hiding a source is reversible and loses no history. A database without the
// migration behaves as "nothing hidden".

export async function listPolicy({ db }) {
  try {
    const rows = await db.prepare('SELECT source_id AS sourceId, hidden, note FROM cms_source_policy ORDER BY source_id').all();
    return Object.freeze((rows?.results ?? []).map((row) => Object.freeze({
      sourceId: row.sourceId,
      hidden: Number(row.hidden) === 1,
      note: row.note ?? '',
    })));
  } catch {
    return Object.freeze([]);
  }
}

export async function hiddenSourceIds({ db }) {
  const policy = await listPolicy({ db });
  return Object.freeze(policy.filter((entry) => entry.hidden).map((entry) => entry.sourceId));
}

export async function setPolicy({ db, sourceId, hidden, note = '', nowMs = Date.now() }) {
  const id = String(sourceId ?? '').trim();
  if (!/^[a-z0-9-]{2,40}$/u.test(id)) return false;
  await db.prepare(
    'INSERT INTO cms_source_policy(source_id,hidden,note,updated_at) VALUES (?,?,?,?) '
    + 'ON CONFLICT(source_id) DO UPDATE SET hidden=excluded.hidden, note=excluded.note, updated_at=excluded.updated_at',
  ).bind(id, hidden ? 1 : 0, String(note ?? '').trim().slice(0, 200), Math.floor(nowMs / 1000)).run();
  return true;
}

/** Removes hidden sources from a snapshot without touching the collection. */
export function filterSnapshot(snapshot, hidden) {
  if (snapshot === null || typeof snapshot !== 'object') return snapshot;
  if (hidden.length === 0 || !Array.isArray(snapshot.items)) return snapshot;
  const blocked = new Set(hidden);
  const items = snapshot.items.filter((item) => !blocked.has(item.sourceId));
  const sources = Array.isArray(snapshot.sources)
    ? snapshot.sources.filter((source) => !blocked.has(source.id ?? source.sourceId))
    : snapshot.sources;
  return Object.freeze({ ...snapshot, items: Object.freeze(items), sources: Object.freeze(sources) });
}

export function sourcesAdminSection({ sources, policy, csrf, message = '' }) {
  const hidden = new Set(policy.filter((entry) => entry.hidden).map((entry) => entry.sourceId));
  const notes = new Map(policy.map((entry) => [entry.sourceId, entry.note]));
  const rows = sources.map((source) => '<tr><td><code>' + source.id + '</code></td><td>'
    + String(source.name).replaceAll('&', '&amp;').replaceAll('<', '&lt;') + '</td><td>'
    + String(source.language) + '</td><td>' + (hidden.has(source.id) ? 'hidden' : 'visible') + '</td><td>'
    + String(notes.get(source.id) ?? '') + '</td><td>'
    + '<form method="post" action="/admin/sources/toggle" class="admin__inline">'
    + '<input type="hidden" name="csrf" value="' + csrf + '">'
    + '<input type="hidden" name="source_id" value="' + source.id + '">'
    + '<input type="hidden" name="hidden" value="' + (hidden.has(source.id) ? '0' : '1') + '">'
    + '<button type="submit">' + (hidden.has(source.id) ? 'Show' : 'Hide') + '</button></form></td></tr>').join('');
  return (message === '' ? '' : '<p class="admin__error" role="alert">' + message + '</p>')
    + '<dl class="admin__facts"><dt>Collectors</dt><dd>' + sources.length + '</dd>'
    + '<dt>Hidden</dt><dd>' + hidden.size + '</dd></dl>'
    + '<table class="admin__table"><thead><tr><th>Id</th><th>Name</th><th>Lang</th><th>State</th>'
    + '<th>Note</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
    + '<p class="admin__note">Hiding removes the source from what readers see; the collector keeps running, '
    + 'so showing it again is instant and nothing is lost.</p>';
}
