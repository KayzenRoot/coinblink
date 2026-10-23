// CB-P0-SOURCE-TO-DRAFT-001: deterministic, offline, non-authoritative source handoff.
// Neither parsing nor transfer grants source rights, capture, ingestion or publication.
export const MAX_MOCK_SOURCE_TRANSFER_BYTES = 2048;
export function createMockSourceTransfer(row) {
  if (!row || !/^demo-source-(?:alpha|beta|gamma)$/.test(row.id) ||
      !['NOT_CLEARED', 'UNKNOWN'].includes(row.licensing) ||
      !['DENIED_RIGHTS', 'UNAVAILABLE'].includes(row.status) ||
      row.mode !== 'MOCK' || row.fetchedAt !== null ||
      row.evidenceDigest !== null) {
    throw new TypeError('Only canonical unlicensed M03 mock specimens can be transferred');
  }
  return Object.freeze({
    kind: 'CB-M03-MOCK-SOURCE-REPORT',
    version: 1,
    id: row.id,
    label: row.label,
    originUrl: row.originUrl,
    licensing: row.licensing,
    status: row.status,
    mode: 'MOCK',
    rights: 'NOT_CLEARED',
    capture: 'NOT_CAPTURED',
    digest: 'NO_DIGEST',
    publiclyUsable: false,
  });
}

// Self-contained by design: injected into the existing local-only CMS script.
// The catalog is compiled from canonical M03 code, never from uploaded bytes.
export function parseMockSourceTransfer(raw, catalog) {
  if (typeof raw !== 'string' ||
      new TextEncoder().encode(raw).byteLength > 2048 ||
      !Array.isArray(catalog) || catalog.length !== 3) return null;
  let value;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const keys = ['kind','version','id','label','originUrl','licensing','status',
    'mode','rights','capture','digest','publiclyUsable'];
  if (Object.keys(value).length !== keys.length ||
      !keys.every(key => Object.hasOwn(value, key))) return null;
  if (value.kind !== 'CB-M03-MOCK-SOURCE-REPORT' || value.version !== 1 ||
      value.mode !== 'MOCK' || value.rights !== 'NOT_CLEARED' ||
      value.capture !== 'NOT_CAPTURED' || value.digest !== 'NO_DIGEST' ||
      value.publiclyUsable !== false ||
      !/^demo-source-(?:alpha|beta|gamma)$/.test(value.id)) return null;
  const specimen = catalog.find(row => row.id === value.id);
  if (!specimen || specimen.mode !== 'MOCK' ||
      !['NOT_CLEARED','UNKNOWN'].includes(specimen.licensing) ||
      !['DENIED_RIGHTS','UNAVAILABLE'].includes(specimen.status) ||
      specimen.fetchedAt !== null || specimen.evidenceDigest !== null) return null;
  const url = specimen.originUrl;
  if (typeof url !== 'string' || url.length > 512) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password ||
      parsed.port || parsed.hash || parsed.search ||
      (parsed.hostname !== 'example.test' && !parsed.hostname.endsWith('.example.test'))) return null;
  if (value.label !== specimen.label || value.originUrl !== url ||
      value.licensing !== specimen.licensing || value.status !== specimen.status) return null;
  return Object.freeze({
    id: specimen.id, label: specimen.label, sourceUrl: url,
    licensing: specimen.licensing, status: specimen.status,
    rights: 'NOT_CLEARED', publiclyUsable: false,
  });
}
