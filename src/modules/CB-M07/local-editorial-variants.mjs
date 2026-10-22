// CB-M07-H-LOCAL-001. Synthetic-only, session-memory editorial variants.
// No storage, API, schedule, publishing, media upload or provider authentication.
import { createLocalSocialPreview } from './social-preview.mjs';

export function containsUnsafeAsciiControl(text) {
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i);
    if (code <= 0x08 || code === 0x0b || code === 0x0c ||
        (code >= 0x0e && code <= 0x1f) || code === 0x7f) return true;
  }
  return false;
}

export function createLocalEditorialVariant(draft, channel, editableText) {
  // Preserve the original ASCII control blacklist without no-control-regex exceptions.
  // TAB, LF and CR remain permitted inside a non-edge-trimmed LOCAL variant.
  const concept = createLocalSocialPreview(draft, channel);
  if (typeof editableText !== 'string' || editableText !== editableText.trim() ||
      editableText.length < 8 || editableText.length > 1600 ||
      containsUnsafeAsciiControl(editableText)) {
    throw new TypeError('LOCAL variant must contain 8..1600 printable characters');
  }
  // Attribution is derived from the validated draft, never editable or optional.
  const sourceLine = 'Source reference (NOT VERIFIED): ' + new URL(draft.source_url).href;
  const fullText = editableText + '\n\n' + sourceLine;
  if (fullText.length > 2000) throw new RangeError('LOCAL variant exceeds preview limit');
  return Object.freeze({
    mode: 'LOCAL_SYNTHETIC', status: 'DEMO_ONLY',
    publishingStatus: 'DRAFT_ONLY', sourceStatus: 'SOURCE_VERIFICATION_PENDING',
    creditStatus: concept.creditStatus, rights: 'NOT_CLEARED',
    draftId: draft.id, draftRevision: draft.revision,
    channel: concept.channel, channelName: concept.channelName,
    editableText, text: fullText,
  });
}

// A frozen row is not necessarily trustworthy. Rebuild from the authorized
// D1 listing and require exact correspondence for source, credit and status.
export function requireCanonicalLocalVariant(row, authorizedDraft) {
  if (!row || typeof row !== 'object' || Array.isArray(row) ||
      Object.getPrototypeOf(row) !== Object.prototype || !Object.isFrozen(row)) {
    throw new TypeError('Invalid LOCAL variant memory');
  }
  let canonical;
  try { canonical = createLocalEditorialVariant(authorizedDraft, row.channel, row.editableText); }
  catch { throw new TypeError('Invalid LOCAL variant memory'); }
  const keys = Object.keys(canonical);
  if (Object.keys(row).length !== keys.length ||
      keys.some(key => !Object.hasOwn(row, key) || row[key] !== canonical[key])) {
    throw new TypeError('Invalid LOCAL variant memory');
  }
  return row;
}

export function getLocalEditorialVariant(variants, draft, channel) {
  createLocalSocialPreview(draft, channel);
  if (!Array.isArray(variants) || variants.length > 60) {
    throw new TypeError('Invalid LOCAL variant memory');
  }
  const saved = variants.find(row => row && row.draftId === draft.id &&
    row.draftRevision === draft.revision && row.channel === channel) ?? null;
  return saved ? requireCanonicalLocalVariant(saved, draft) : null;
}

export function upsertLocalEditorialVariant(variants, draft, channel, editableText, authorizedDrafts = [draft]) {
  if (!Array.isArray(authorizedDrafts) || authorizedDrafts.length > 100) {
    throw new TypeError('Authorized LOCAL draft listing required');
  }
  const current = authorizedDrafts.find(row => row && row.id === draft?.id &&
    row.revision === draft?.revision);
  if (!current) throw new TypeError('Draft missing from authorized LOCAL listing');
  const next = createLocalEditorialVariant(current, channel, editableText);
  if (!Array.isArray(variants) || variants.length > 60) {
    throw new TypeError('Invalid LOCAL variant collection');
  }
  const keys = new Set();
  for (const row of variants) {
    const sourceDraft = authorizedDrafts.find(item => item && item.id === row?.draftId &&
      item.revision === row?.draftRevision);
    requireCanonicalLocalVariant(row, sourceDraft);
    const key = row.draftId + ':' + row.draftRevision + ':' + row.channel;
    if (keys.has(key)) throw new TypeError('Duplicate LOCAL variant');
    keys.add(key);
  }
  const unchanged = variants.filter(row =>
    !(row.draftId === next.draftId && row.channel === next.channel));
  if (unchanged.length >= 60) throw new RangeError('At most 60 LOCAL variants');
  return Object.freeze([...unchanged, next]);
}
