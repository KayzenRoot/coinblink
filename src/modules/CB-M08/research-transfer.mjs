// M08 → M05 LOCAL-only: a canonical offline brief, NEVER verified or authorized to publish.
import { buildMockResearchBrief, listMockResearchOptions } from './research-desk.mjs';

export const MAX_MOCK_RESEARCH_BYTES = 4096;

export function createMockResearchTransfer(sourceId, asset) {
  const result = buildMockResearchBrief(sourceId, asset);
  if (result.status !== 'MOCK_RESEARCH_REVIEW_REQUIRED' || !result.brief) {
    throw new TypeError('M08 requires a canonical fictional source and market');
  }
  const b = result.brief;
  return Object.freeze({
    kind: 'CB-M08-MOCK-RESEARCH-BRIEF', version: 1,
    sourceId: b.sourceId, asset: b.asset, sourceLabel: b.sourceLabel,
    sourceStatus: b.sourceStatus, pair: b.pair, freshness: b.freshness,
    blockers: Object.freeze(b.blockers.map(row => Object.freeze({
      domain: row.domain, code: row.code, state: row.state,
    }))),
    blockerCount: b.blockerCount, quote: null, mode: 'MOCK',
    rights: 'NOT_CLEARED', marketLive: false, publiclyUsable: false,
    verified: false, generatedByAI: false, published: false,
  });
}

export function canonicalMockResearchTransfers() {
  const opts = listMockResearchOptions();
  return Object.freeze(opts.sources.flatMap(source => opts.markets.map(market =>
    createMockResearchTransfer(source.id, market.asset))));
}

// Self-contained; injected by toString into the local synthetic Owner UI.
// Reject untrusted JSON unless byte-size, fields and blocker codes reproduce
// one of the nine server-compiled canonical M03+M04 sample packets exactly.
export function parseMockResearchTransfer(raw, catalog) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).byteLength > 4096 ||
      !Array.isArray(catalog) || catalog.length !== 9) return null;
  let packet;
  try { packet = JSON.parse(raw); } catch { return null; }
  // Exact canonical equality below rejects every forged rights, mode, quote,
  // blocker, verification and publication field. Redundant per-field checks
  // would create divergent validation rules without adding authorization.
  if (!packet || typeof packet !== 'object' || Array.isArray(packet) ||
      typeof packet.sourceId !== 'string' || typeof packet.asset !== 'string') return null;
  const expected = catalog.find(row =>
    row.sourceId === packet.sourceId && row.asset === packet.asset);
  if (!expected || JSON.stringify(packet) !== JSON.stringify(expected)) return null;
  return Object.freeze({ ...expected,
    blockers: Object.freeze(expected.blockers.map(row => Object.freeze({...row}))) });
}

// Self-contained: only updates an UNSAVED editor field after human confirmation.
export function formatMockResearchNote(packet, body) {
  if (!packet || packet.kind !== 'CB-M08-MOCK-RESEARCH-BRIEF' ||
      packet.mode !== 'MOCK' || packet.rights !== 'NOT_CLEARED' ||
      packet.marketLive !== false || packet.publiclyUsable !== false ||
      packet.verified !== false || packet.published !== false ||
      packet.blockerCount !== 8 || !Array.isArray(packet.blockers) ||
      packet.blockers.length !== 8 || typeof body !== 'string') return null;
  const marker = '[COINBLINK M08 OFFLINE MOCK RESEARCH | NOT VERIFIED]';
  if (body.includes(marker)) return null;
  const note = [
    marker,
    'Fictional source: ' + packet.sourceLabel + ' (' + packet.sourceId + ')',
    'Unavailable market example: ' + packet.pair + ' (' + packet.asset + ')',
    'Source status: ' + packet.sourceStatus + '; market freshness: ' + packet.freshness,
    'Unresolved blockers: ' + packet.blockers.map(row =>
      row.domain + '/' + row.code + '=' + row.state).join(', '),
    'SOURCE RIGHTS NOT CLEARED. NO FACT CHECK, LIVE QUOTES, AI OR PUBLICATION.',
    '[END COINBLINK M08 MOCK RESEARCH]',
  ].join('\n');
  const combined = body.trim() ? body + '\n\n' + note : note;
  return combined.length <= 40000 ? combined : null;
}
