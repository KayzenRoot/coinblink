// LOCAL only. Converts already-protected M07-A concepts into an unofficial
// static visual card. No provider API, publication, media, or network requests.
export function createLocalSocialCard(concept) {
  if (!concept || typeof concept !== 'object' || Array.isArray(concept) ||
      concept.mode !== 'LOCAL_SYNTHETIC' || concept.status !== 'DEMO_ONLY' ||
      concept.publishingStatus !== 'DRAFT_ONLY' ||
      concept.sourceStatus !== 'SOURCE_VERIFICATION_PENDING' ||
      concept.rights !== 'NOT_CLEARED' ||
      !['CREDIT_MISSING', 'CREDIT_PRESENT_UNVERIFIED'].includes(concept.creditStatus) ||
      !['x', 'instagram', 'tiktok'].includes(concept.channel) ||
      typeof concept.text !== 'string' ||
      concept.text.length < 8 || concept.text.length > 2000) {
    throw new TypeError('Visual card requires an unapproved, bounded LOCAL social concept');
  }
  const formats = {
    x: { label: 'X-inspired compact text card', heading: 'Text post mockup' },
    instagram: { label: 'Instagram-inspired caption card', heading: 'Caption layout mockup' },
    tiktok: { label: 'TikTok-inspired storyboard card', heading: 'Storyboard text mockup' },
  };
  return Object.freeze({
    channel: concept.channel,
    formatLabel: formats[concept.channel].label,
    heading: formats[concept.channel].heading,
    text: concept.text,
    labels: 'DEMO_ONLY · DRAFT_ONLY · SOURCE_VERIFICATION_PENDING · ' +
      concept.creditStatus + ' · NOT_CLEARED',
  });
}
