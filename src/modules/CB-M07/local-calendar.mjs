// M07-C: a bounded, synthetic-only, in-memory editorial idea list.
// Absolutely no scheduler, clock callbacks, remote I/O, persistence, publish or provider use.
import { createLocalSocialPreview } from './social-preview.mjs';
import { createLocalWeeklyBoard } from './local-week-board.mjs';

/**
 * Shared LOCAL civil-minute formatter. No locale parsing, clock callbacks or IO.
 * Used by both the canonical edit validator and conflict suggestion projection.
 */
export function localCalendarMinuteFormatter(timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
}
export function localCalendarMinuteParts(formatter, timestamp) {
  const parts = formatter.formatToParts(new Date(timestamp));
  return ['year', 'month', 'day', 'hour', 'minute'].map(type =>
    Number(parts.find(row => row.type === type)?.value));
}

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
  const formatter = localCalendarMinuteFormatter(timeZone);
  const fieldsAt = timestamp => localCalendarMinuteParts(formatter, timestamp);
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


/**
 * Return at most three immutable, hypothetical suggestions for a genuine
 * same-channel/UTC-minute collision across distinct LOCAL drafts.
 * This pure helper never changes state; the caller must explicitly confirm.
 */
export function suggestLocalConflictAlternatives(ideas, current, draft) {
  if (!Array.isArray(ideas) || !ideas.includes(current) || !draft ||
      draft.id !== current.draftId) {
    throw new TypeError('Suggestions require a current authorized LOCAL draft');
  }
  // Full DTO validation prevents malformed/private data from bypassing the contract.
  createLocalWeeklyBoard(ideas, 'all', 'UTC');
  const overlaps = row => row !== current && row.draftId !== current.draftId &&
    row.channel === current.channel && row.utcISO === current.utcISO;
  if (!ideas.some(overlaps)) return Object.freeze([]);
  const formatter = localCalendarMinuteFormatter(current.timeZone);
  const alternatives = [];
  const base = Date.parse(current.utcISO);
  for (let step = 1; step <= 12 && alternatives.length < 3; step++) {
    const utc = new Date(base + step * 15 * 60_000);
    const [year, month, day, hour, minute] = localCalendarMinuteParts(formatter, utc);
    if (![year, month, day, hour, minute].every(Number.isInteger)) continue;
    const two = value => String(value).padStart(2, '0');
    const local = year + '-' + two(month) + '-' + two(day) +
      'T' + two(hour) + ':' + two(minute);
    try {
      // The canonical validator rejects ambiguous/nonexistent DST wall times.
      const candidate = createLocalCalendarIdea(draft, current.channel, local, current.timeZone);
      if (candidate.utcISO !== utc.toISOString() ||
          ideas.some(row => row !== current && row.channel === candidate.channel &&
            row.utcISO === candidate.utcISO)) continue;
      replaceLocalCalendarIdea(ideas, current, candidate);
      alternatives.push(Object.freeze({
        draftId: current.draftId, channel: candidate.channel,
        hypotheticalLocal: candidate.hypotheticalLocal,
        timeZone: candidate.timeZone, utcISO: candidate.utcISO,
      }));
    } catch {
      // An invalid or unavailable time is never suggested or applied.
    }
  }
  return Object.freeze(alternatives);
}
