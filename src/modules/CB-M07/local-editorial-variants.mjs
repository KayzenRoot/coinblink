// CB-M07-H-LOCAL-001. Synthetic-only, session-memory editorial variants.
// No storage, API, schedule, publishing, media upload or provider authentication.
import { createLocalSocialPreview } from './social-preview.mjs';

export function createLocalEditorialVariant(draft, channel, editableText) {
  const concept = createLocalSocialPreview(draft, channel);
  if (typeof editableText !== 'string' || editableText !== editableText.trim() ||
      editableText.length < 8 || editableText.length > 1600 ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(editableText)) {
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

export function getLocalEditorialVariant(variants, draft, channel) {
  createLocalSocialPreview(draft, channel);
  if (!Array.isArray(variants) || variants.length > 60) {
    throw new TypeError('Invalid LOCAL variant memory');
  }
  const saved = variants.find(row => row && row.draftId === draft.id &&
    row.draftRevision === draft.revision && row.channel === channel) ?? null;
  if (saved && (!Object.isFrozen(saved) ||
      !['CREDIT_MISSING', 'CREDIT_PRESENT_UNVERIFIED'].includes(saved.creditStatus))) {
    throw new TypeError('Invalid LOCAL variant memory');
  }
  return saved;
}

export function upsertLocalEditorialVariant(variants, draft, channel, editableText) {
  const next = createLocalEditorialVariant(draft, channel, editableText);
  if (!Array.isArray(variants) || variants.length > 60 ||
      variants.some(row => !row || !Object.isFrozen(row) ||
        row.mode !== 'LOCAL_SYNTHETIC' || row.status !== 'DEMO_ONLY' ||
        row.publishingStatus !== 'DRAFT_ONLY' ||
        row.sourceStatus !== 'SOURCE_VERIFICATION_PENDING' ||
        !['CREDIT_MISSING', 'CREDIT_PRESENT_UNVERIFIED'].includes(row.creditStatus) ||
        row.rights !== 'NOT_CLEARED' || !['x','instagram','tiktok'].includes(row.channel) ||
        typeof row.draftId !== 'string' || !Number.isSafeInteger(row.draftRevision) ||
        row.draftRevision < 1 || typeof row.editableText !== 'string')) {
    throw new TypeError('Invalid LOCAL variant collection');
  }
  const unchanged = variants.filter(row =>
    !(row.draftId === next.draftId && row.channel === next.channel));
  if (unchanged.length >= 60) throw new RangeError('At most 60 LOCAL variants');
  return Object.freeze([...unchanged, next]);
}
