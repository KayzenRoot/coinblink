// M07-C: a bounded, synthetic-only, in-memory editorial idea list.
// Absolutely no scheduler, clock callbacks, remote I/O, persistence, publish or provider use.
import { createLocalSocialPreview } from './social-preview.mjs';

export function createLocalCalendarIdea(draft, channel, hypotheticalLocal, timeZone) {
  // This validator checks the existing authorized synthetic draft and rights.
  const concept = createLocalSocialPreview(draft, channel);
  if (typeof hypotheticalLocal !== 'string' ||
      !/^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d$/.test(hypotheticalLocal) ||
      !['UTC','America/Sao_Paulo','America/New_York'].includes(timeZone)) {
    throw new TypeError('A valid hypothetical local minute and approved test time zone are required');
  }
  const [year, month, day, hour, minute] = hypotheticalLocal.match(/\d+/g).map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const calendar = new Date(wall);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() + 1 !== month ||
      calendar.getUTCDate() !== day || calendar.getUTCHours() !== hour ||
      calendar.getUTCMinutes() !== minute) {
    throw new TypeError('Impossible hypothetical calendar date');
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const fieldsAt = timestamp => {
    const parts = formatter.formatToParts(new Date(timestamp));
    const get = type => Number(parts.find(part => part.type === type)?.value);
    return [get('year'), get('month'), get('day'), get('hour'), get('minute')];
  };
  // Offsets on either side of the selected local day cover DST transitions.
  const offsets = new Set();
  for (const delta of [-86400000, 0, 86400000]) {
    const probe = wall + delta;
    const f = fieldsAt(probe);
    offsets.add(Date.UTC(f[0],f[1]-1,f[2],f[3],f[4]) - probe);
  }
  const candidates = [...offsets].map(offset => wall - offset).filter(timestamp =>
    fieldsAt(timestamp).every((value, index) => value === [year,month,day,hour,minute][index]));
  // Missing and repeated DST wall times are rejected instead of silently shifting.
  if (candidates.length !== 1) {
    throw new TypeError('Nonexistent or ambiguous local time; choose another hypothetical minute');
  }
  return Object.freeze({
    mode: 'LOCAL_SYNTHETIC',
    draftId: draft.id,
    title: draft.title,
    channel: concept.channel,
    hypotheticalLocal,
    timeZone,
    utcISO: new Date(candidates[0]).toISOString(),
    status: 'PLANNED_CONCEPT_ONLY',
    publication: 'DRAFT_ONLY',
    sourceStatus: 'SOURCE_VERIFICATION_PENDING',
    creditStatus: concept.creditStatus,
    rights: 'NOT_CLEARED',
  });
}

export function addLocalCalendarIdea(existing, idea) {
  if (!Array.isArray(existing) || existing.length > 20 || !idea ||
      idea.mode !== 'LOCAL_SYNTHETIC' || idea.status !== 'PLANNED_CONCEPT_ONLY' ||
      idea.publication !== 'DRAFT_ONLY' || idea.rights !== 'NOT_CLEARED' ||
      idea.sourceStatus !== 'SOURCE_VERIFICATION_PENDING' ||
      !['CREDIT_MISSING','CREDIT_PRESENT_UNVERIFIED'].includes(idea.creditStatus) ||
      !['x','instagram','tiktok'].includes(idea.channel) ||
      typeof idea.draftId !== 'string' || typeof idea.utcISO !== 'string' ||
      typeof idea.title !== 'string' || !Number.isFinite(Date.parse(idea.utcISO))) {
    throw new TypeError('Invalid LOCAL calendar idea');
  }
  if (existing.length === 20) throw new RangeError('At most 20 LOCAL editorial ideas');
  const key = row => row.draftId + '|' + row.channel + '|' + row.utcISO;
  if (existing.some(row => key(row) === key(idea))) {
    throw new RangeError('Duplicate LOCAL editorial idea');
  }
  return Object.freeze([...existing, idea].sort((a,b) =>
    a.utcISO.localeCompare(b.utcISO) || a.channel.localeCompare(b.channel) ||
    a.draftId.localeCompare(b.draftId)));
}

/**
 * Replace exactly one still-current synthetic idea without changing its draft.
 * Identity guards stale controls; the existing immutable add contract rejects
 * duplicates and keeps the maximum of 20 ideas.
 */
export function replaceLocalCalendarIdea(existing, current, replacement) {
  if (!Array.isArray(existing) || existing.length > 20 ||
      !current || !existing.includes(current) || !replacement ||
      replacement.draftId !== current.draftId) {
    throw new TypeError('LOCAL edit requires a current idea for the same authorized draft');
  }
  return addLocalCalendarIdea(existing.filter(row => row !== current), replacement);
}
