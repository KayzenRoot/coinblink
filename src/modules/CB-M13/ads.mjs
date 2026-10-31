// CB-M13-P1-ADS-001: sponsors, placements and measured delivery.
//
// A placement is only rendered while it is active and inside its window. Clicks
// go through /ad/click so they are counted without JavaScript, and every link
// carries rel="sponsored" so search engines do not treat it as editorial.

export const AD_SLOTS = Object.freeze(['home', 'article', 'newsletter']);
const MAX_LABEL = 60;
const MAX_BODY = 240;
const MAX_CTA = 40;

export function validSlot(value) {
  return AD_SLOTS.includes(value);
}

function httpsUrl(value) {
  try {
    const url = new URL(String(value ?? ''));
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function utcDay(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export async function createSponsor({ db, name, url, contact = '', nowMs = Date.now() }) {
  const cleanName = String(name ?? '').trim();
  const cleanUrl = httpsUrl(url);
  if (cleanName.length < 2 || cleanName.length > 80 || cleanUrl === null) {
    return Object.freeze({ status: 'invalid', reason: 'sponsor' });
  }
  const id = crypto.randomUUID();
  await db.prepare('INSERT INTO cms_sponsors(id,name,url,contact,created_at) VALUES (?,?,?,?,?)')
    .bind(id, cleanName, cleanUrl, String(contact ?? '').trim().slice(0, 160), Math.floor(nowMs / 1000)).run();
  return Object.freeze({ status: 'created', sponsor: Object.freeze({ id, name: cleanName, url: cleanUrl }) });
}

export async function createPlacement({
  db, sponsorId, slot, label, body = '', ctaLabel = '', ctaUrl, rateCents = 0,
  startAt, endAt, nowMs = Date.now(),
}) {
  const sponsor = await db.prepare('SELECT id FROM cms_sponsors WHERE id=?').bind(String(sponsorId ?? '')).first() ?? null;
  if (sponsor === null) return Object.freeze({ status: 'invalid', reason: 'sponsor' });
  if (!validSlot(slot)) return Object.freeze({ status: 'invalid', reason: 'slot' });
  const cleanLabel = String(label ?? '').trim();
  const cleanBody = String(body ?? '').trim();
  const cleanCta = String(ctaLabel ?? '').trim();
  const cleanCtaUrl = httpsUrl(ctaUrl);
  if (cleanLabel.length < 2 || cleanLabel.length > MAX_LABEL) return Object.freeze({ status: 'invalid', reason: 'label' });
  if (cleanBody.length > MAX_BODY || cleanCta.length > MAX_CTA) return Object.freeze({ status: 'invalid', reason: 'copy' });
  if (cleanCtaUrl === null) return Object.freeze({ status: 'invalid', reason: 'cta' });
  const start = Math.floor(Number(startAt) / 1000);
  const end = Math.floor(Number(endAt) / 1000);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end <= start) {
    return Object.freeze({ status: 'invalid', reason: 'window' });
  }
  const rate = Math.max(0, Math.floor(Number(rateCents) || 0));
  const id = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO cms_ad_placements(id,sponsor_id,slot,label,body,cta_label,cta_url,rate_cents,start_at,end_at,status,created_at) '
    + "VALUES (?,?,?,?,?,?,?,?,?,?,'active',?)",
  ).bind(id, sponsor.id, slot, cleanLabel, cleanBody, cleanCta, cleanCtaUrl, rate, start, end, Math.floor(nowMs / 1000)).run();
  return Object.freeze({ status: 'created', placement: Object.freeze({ id, slot, label: cleanLabel }) });
}

/** The placement that may render in a slot right now, or null. */
export async function activePlacement({ db, slot, nowMs = Date.now() }) {
  if (!validSlot(slot)) return null;
  const now = Math.floor(nowMs / 1000);
  try {
    const row = await db.prepare(
      'SELECT p.id, p.label, p.body, p.cta_label AS ctaLabel, p.cta_url AS ctaUrl, p.rate_cents AS rateCents, '
      + 'p.start_at AS startAt, p.end_at AS endAt, s.name AS sponsorName, s.url AS sponsorUrl '
      + "FROM cms_ad_placements p JOIN cms_sponsors s ON s.id = p.sponsor_id "
      + "WHERE p.slot=? AND p.status='active' AND p.start_at<=? AND p.end_at>? "
      + 'ORDER BY p.created_at DESC LIMIT 1',
    ).bind(slot, now, now).first() ?? null;
    return row === null ? null : Object.freeze({
      id: row.id,
      label: row.label,
      body: row.body,
      ctaLabel: row.ctaLabel,
      ctaUrl: row.ctaUrl,
      rateCents: Number(row.rateCents),
      startAt: Number(row.startAt),
      endAt: Number(row.endAt),
      sponsorName: row.sponsorName,
      sponsorUrl: row.sponsorUrl,
    });
  } catch {
    return null;
  }
}

/** Reads a placement by id, including paused ones, for the click route. */
export async function readPlacement({ db, id }) {
  try {
    const row = await db.prepare(
      'SELECT id, slot, cta_url AS ctaUrl, status, start_at AS startAt, end_at AS endAt '
      + 'FROM cms_ad_placements WHERE id=?',
    ).bind(String(id ?? '')).first() ?? null;
    return row === null ? null : Object.freeze({
      id: row.id,
      slot: row.slot,
      ctaUrl: row.ctaUrl,
      status: row.status,
      startAt: Number(row.startAt),
      endAt: Number(row.endAt),
    });
  } catch {
    return null;
  }
}

export async function recordImpression({ db, placementId, nowMs = Date.now() }) {
  return bump({ db, placementId, column: 'impressions', nowMs });
}

export async function recordClick({ db, placementId, nowMs = Date.now() }) {
  return bump({ db, placementId, column: 'clicks', nowMs });
}

async function bump({ db, placementId, column, nowMs }) {
  const id = String(placementId ?? '');
  if (id === '') return false;
  const day = utcDay(nowMs);
  try {
    await db.prepare(
      'INSERT INTO cms_ad_stats(placement_id,day,impressions,clicks) VALUES (?,?,?,?) '
      + 'ON CONFLICT(placement_id,day) DO UPDATE SET ' + column + '=' + column + '+1',
    ).bind(id, day, column === 'impressions' ? 1 : 0, column === 'clicks' ? 1 : 0).run();
    return true;
  } catch {
    return false;
  }
}

export async function listSponsors({ db }) {
  try {
    const rows = await db.prepare('SELECT id, name, url FROM cms_sponsors ORDER BY name').all();
    return Object.freeze((rows?.results ?? []).map((row) => Object.freeze({ id: row.id, name: row.name, url: row.url })));
  } catch {
    return Object.freeze([]);
  }
}

/** Delivery and contracted value per placement, for the owner screen. */
export async function listPlacements({ db, nowMs = Date.now() }) {
  try {
    const rows = await db.prepare(
      'SELECT p.id, p.slot, p.label, p.rate_cents AS rateCents, p.start_at AS startAt, p.end_at AS endAt, '
      + 'p.status, s.name AS sponsorName, '
      + 'COALESCE(SUM(st.impressions),0) AS impressions, COALESCE(SUM(st.clicks),0) AS clicks '
      + 'FROM cms_ad_placements p JOIN cms_sponsors s ON s.id = p.sponsor_id '
      + 'LEFT JOIN cms_ad_stats st ON st.placement_id = p.id '
      + 'GROUP BY p.id ORDER BY p.created_at DESC',
    ).all();
    const now = Math.floor(nowMs / 1000);
    return Object.freeze((rows?.results ?? []).map((row) => Object.freeze({
      id: row.id,
      slot: row.slot,
      label: row.label,
      sponsorName: row.sponsorName,
      status: row.status,
      rateCents: Number(row.rateCents),
      startAt: Number(row.startAt),
      endAt: Number(row.endAt),
      impressions: Number(row.impressions),
      clicks: Number(row.clicks),
      live: row.status === 'active' && Number(row.startAt) <= now && Number(row.endAt) > now,
    })));
  } catch {
    return Object.freeze([]);
  }
}

export async function pausePlacement({ db, id }) {
  const result = await db.prepare("UPDATE cms_ad_placements SET status='paused' WHERE id=? AND status='active'")
    .bind(String(id ?? '')).run();
  return result?.meta?.changes === 1;
}

export function clickTarget(placement, { nowMs = Date.now() } = {}) {
  if (placement === null) return null;
  const now = Math.floor(nowMs / 1000);
  if (placement.startAt > now || placement.endAt <= now) return null;
  return httpsUrl(placement.ctaUrl);
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function adsAdminSection({ placements, sponsors, csrf, message = '' }) {
  const totalCents = placements.filter((row) => row.live).reduce((sum, row) => sum + row.rateCents, 0);
  const rows = placements.length === 0
    ? '<p>No placements yet.</p>'
    : '<table class="admin__table"><thead><tr><th>Sponsor</th><th>Slot</th><th>Label</th><th>Window</th>'
      + '<th>Impressions</th><th>Clicks</th><th>Rate</th><th>State</th><th></th></tr></thead><tbody>'
      + placements.map((row) => '<tr><td>' + escapeHtml(row.sponsorName) + '</td><td>' + escapeHtml(row.slot)
        + '</td><td>' + escapeHtml(row.label) + '</td><td>'
        + escapeHtml(new Date(row.startAt * 1000).toISOString().slice(0, 10)) + ' → '
        + escapeHtml(new Date(row.endAt * 1000).toISOString().slice(0, 10)) + '</td><td>' + row.impressions
        + '</td><td>' + row.clicks + '</td><td>$' + (row.rateCents / 100).toFixed(2) + '</td><td>'
        + (row.live ? 'live' : escapeHtml(row.status)) + '</td><td>'
        + (row.status === 'active'
          ? '<form method="post" action="/admin/ads/pause" class="admin__inline">'
            + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
            + '<input type="hidden" name="id" value="' + escapeHtml(row.id) + '">'
            + '<button type="submit">Pause</button></form>'
          : '')
        + '</td></tr>').join('') + '</tbody></table>';
  const sponsorOptions = sponsors.length === 0
    ? '<option value="">Create a sponsor first</option>'
    : sponsors.map((sponsor) => '<option value="' + escapeHtml(sponsor.id) + '">'
      + escapeHtml(sponsor.name) + '</option>').join('');
  return (message === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(message) + '</p>')
    + '<dl class="admin__facts"><dt>Live contracted value</dt><dd>$' + (totalCents / 100).toFixed(2) + '</dd>'
    + '<dt>Placements</dt><dd>' + placements.length + '</dd></dl>'
    + '<form method="post" action="/admin/ads/sponsor" class="admin__draft-form">'
    + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
    + '<label>Sponsor name<input name="name" required minlength="2" maxlength="80"></label>'
    + '<label>Sponsor site (https)<input name="url" type="url" required placeholder="https://"></label>'
    + '<label>Contact<input name="contact" maxlength="160"></label>'
    + '<button type="submit">Add sponsor</button></form>'
    + '<form method="post" action="/admin/ads/placement" class="admin__draft-form">'
    + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
    + '<label>Sponsor<select name="sponsor_id" required>' + sponsorOptions + '</select></label>'
    + '<label>Slot<select name="slot"><option value="home">Home</option><option value="article">Article</option>'
    + '<option value="newsletter">Newsletter</option></select></label>'
    + '<label>Label<input name="label" required maxlength="60" placeholder="Sponsored by"></label>'
    + '<label>Body<input name="body" maxlength="240"></label>'
    + '<label>CTA label<input name="cta_label" maxlength="40"></label>'
    + '<label>CTA URL (https)<input name="cta_url" type="url" required placeholder="https://"></label>'
    + '<label>Rate in cents<input name="rate_cents" type="number" min="0" step="1" value="0"></label>'
    + '<label>Start (UTC)<input name="start_at" type="datetime-local" required></label>'
    + '<label>End (UTC)<input name="end_at" type="datetime-local" required></label>'
    + '<button type="submit">Add placement</button></form>'
    + rows
    + '<p class="admin__note">Only an active placement inside its window renders. Clicks are counted by '
    + '/ad/click and every link carries rel="sponsored".</p>';
}
