// M07-D LOCAL: a pure, read-only weekly projection of the existing in-memory ideas.
// No timer, scheduler, storage, provider calls, fetch, publishing or persistence.
/**
 * Create an immutable weekly, read-only view of up to 20 synthetic LOCAL ideas.
 * A conflict marks distinct drafts sharing a channel and exact UTC minute; no
 * scheduling, persistence, publication or remote access occurs.
 * @param {ReadonlyArray<object>} ideas Private M07-C in-memory calendar ideas.
 * @param {'all'|'x'|'instagram'|'tiktok'} channelFilter View-only channel filter.
 * @param {'UTC'|'America/Sao_Paulo'|'America/New_York'} timeZone Display timezone.
 * @returns {Readonly<object>} Frozen week/day DTO and informational conflict count.
 * @throws {TypeError} When an idea or filter violates the LOCAL synthetic contract.
 */
export function createLocalWeeklyBoard(ideas, channelFilter = 'all', timeZone = 'America/Sao_Paulo') {
  const channels = new Set(['x', 'instagram', 'tiktok']);
  const zones = new Set(['UTC', 'America/Sao_Paulo', 'America/New_York']);
  if (!Array.isArray(ideas) || ideas.length > 20 ||
      !(channelFilter === 'all' || channels.has(channelFilter)) || !zones.has(timeZone)) {
    throw new TypeError('Invalid LOCAL weekly board arguments');
  }
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const civilDay = timestamp => {
    const parts = format.formatToParts(new Date(timestamp));
    const number = part => Number(parts.find(row => row.type === part)?.value);
    const [year, month, day, hour, minute] =
      ['year', 'month', 'day', 'hour', 'minute'].map(number);
    if (![year, month, day, hour, minute].every(Number.isInteger)) {
      throw new TypeError('Invalid time zone projection');
    }
    const two = value => String(value).padStart(2, '0');
    return { date: year + '-' + two(month) + '-' + two(day),
      minute: two(hour) + ':' + two(minute) };
  };
  const shiftDay = (iso, delta) => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10);
  };
  const mondayOf = iso => {
    const [year, month, day] = iso.split('-').map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return shiftDay(iso, -((weekday + 6) % 7));
  };

  const known = new Set();
  const safe = [];
  for (const idea of ideas) {
    if (!idea || typeof idea !== 'object' || idea.mode !== 'LOCAL_SYNTHETIC' ||
        idea.status !== 'PLANNED_CONCEPT_ONLY' || idea.publication !== 'DRAFT_ONLY' ||
        idea.sourceStatus !== 'SOURCE_VERIFICATION_PENDING' || idea.rights !== 'NOT_CLEARED' ||
        !['CREDIT_MISSING', 'CREDIT_PRESENT_UNVERIFIED'].includes(idea.creditStatus) ||
        !channels.has(idea.channel) || !zones.has(idea.timeZone) ||
        typeof idea.draftId !== 'string' || !/^[a-f0-9-]{36}$/i.test(idea.draftId) ||
        typeof idea.title !== 'string' || idea.title.length < 1 || idea.title.length > 140 ||
        typeof idea.utcISO !== 'string' || !/^20\d{2}-\d\d-\d\dT\d\d:\d\d:00\.000Z$/.test(idea.utcISO) ||
        !Number.isFinite(Date.parse(idea.utcISO)) ||
        new Date(idea.utcISO).toISOString() !== idea.utcISO) {
      throw new TypeError('Invalid synthetic idea in weekly board');
    }
    const key = idea.draftId + '|' + idea.channel + '|' + idea.utcISO;
    if (known.has(key)) throw new TypeError('Duplicate calendar idea');
    known.add(key);
    if (channelFilter !== 'all' && channelFilter !== idea.channel) continue;
    const civil = civilDay(Date.parse(idea.utcISO));
    safe.push({ title: idea.title, draftId: idea.draftId, channel: idea.channel,
      utcISO: idea.utcISO, localDate: civil.date, localTime: civil.minute,
      status: idea.status, publication: idea.publication,
      sourceStatus: idea.sourceStatus, creditStatus: idea.creditStatus, rights: idea.rights });
  }
  safe.sort((a, b) => a.utcISO.localeCompare(b.utcISO) ||
    a.channel.localeCompare(b.channel) || a.draftId.localeCompare(b.draftId));

  // Collision is informational: same channel and UTC minute, different draft.
  const slots = new Map();
  for (const row of safe) {
    const key = row.channel + '|' + row.utcISO;
    slots.set(key, (slots.get(key) || 0) + 1);
  }
  const collisionSlots = [...slots.values()].filter(size => size > 1).length;
  const weeks = new Map();
  for (const row of safe) {
    const monday = mondayOf(row.localDate);
    if (!weeks.has(monday)) {
      const days = Array.from({length: 7}, (_, index) => ({
        date: shiftDay(monday, index), ideas: [],
      }));
      weeks.set(monday, days);
    }
    const collision = slots.get(row.channel + '|' + row.utcISO) > 1;
    const entry = Object.freeze({ ...row, collision });
    weeks.get(monday).find(day => day.date === row.localDate).ideas.push(entry);
  }
  const frozenWeeks = [...weeks].sort(([a], [b]) => a.localeCompare(b))
    .map(([startDate, days]) => Object.freeze({
      startDate,
      endDate: shiftDay(startDate, 6),
      days: Object.freeze(days.map(day => Object.freeze({
        date: day.date, ideas: Object.freeze(day.ideas),
      }))),
    }));
  return Object.freeze({
    mode: 'LOCAL_SYNTHETIC', timeZone, channelFilter,
    totalCount: ideas.length, visibleCount: safe.length, collisionSlots,
    weeks: Object.freeze(frozenWeeks),
  });
}
