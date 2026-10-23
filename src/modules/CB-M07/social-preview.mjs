import { createLocalReviewQueue } from '../CB-M06/owner-dashboard.mjs';

// Pure, test-only Social Studio composition. No API, SDK, OAuth, scheduler,
// publishing, URL navigation or credential use. Never a production message.
export const SOCIAL_LOCAL_CHANNELS = Object.freeze(['x', 'instagram', 'tiktok']);

export function createLocalSocialPreview(draft, channel) {
  if (!['x','instagram','tiktok'].includes(channel) || !draft ||
      typeof draft !== 'object' || Array.isArray(draft)) {
    throw new TypeError('Valid LOCAL draft and synthetic channel are required');
  }
  // An existing Owner-guarded M05 D1 listing is the sole permitted source.
  // The M06 validator checks ID, title, status, revision, author and source types.
  const review = createLocalReviewQueue([draft]).rows[0];
  if (typeof draft.summary !== 'string' ||
      draft.summary.trim().length < 20 || draft.summary.length > 400) {
    throw new TypeError('A bounded, nonempty LOCAL summary is required');
  }
  let source;
  try { source = new URL(draft.source_url); }
  catch { throw new TypeError('Invalid LOCAL source URL'); }
  if (source.protocol !== 'https:' || !source.hostname ||
      source.username || source.password) {
    throw new TypeError('A non-credential HTTPS source reference is required');
  }
  const channelNames = { x: 'X', instagram: 'Instagram', tiktok: 'TikTok' };
  const channelName = channelNames[channel];
  const headline = draft.title.trim();
  const summary = draft.summary.trim();
  const sourceLine = 'Source reference (NOT VERIFIED): ' + source.href;
  let text;
  if (channel === 'x') {
    text = headline + '\n\n' + summary + '\n\n' + sourceLine;
  } else if (channel === 'instagram') {
    text = 'LOCAL editorial concept: ' + headline + '\n\n' + summary + '\n\n' + sourceLine;
  } else {
    text = 'Opening (storyboard only): ' + headline +
      '\nNarration concept (not a video): ' + summary + '\n' + sourceLine;
  }
  return Object.freeze({
    mode: 'LOCAL_SYNTHETIC',
    channel,
    channelName,
    status: 'DEMO_ONLY',
    publishingStatus: 'DRAFT_ONLY',
    sourceStatus: 'SOURCE_VERIFICATION_PENDING',
    creditStatus: review.creditStatus,
    rights: 'NOT_CLEARED',
    text,
  });
}
