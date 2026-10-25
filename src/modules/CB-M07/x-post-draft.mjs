// CB-M07-P0-X-DRAFT-001: deterministic LOCAL SYNTHETIC X text preview only.
// Neither this module nor its result confers source rights, Owner approval,
// authorization to publish, an X API contract, or a LIVE feed integration.
import { createHash } from 'node:crypto';

const INPUT_KEYS = Object.freeze([
  'id', 'revision', 'title', 'summary', 'articleUrl', 'sourceUrl',
  'mode', 'status', 'rights',
]);
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u;
const MOCK_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const MAX_PREVIEW_CODEPOINTS = 240; // Conservative LOCAL cap, not the X platform count.

function exactPlainData(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) return false;
    const fields = Object.getOwnPropertyDescriptors(value);
    const keys = Reflect.ownKeys(fields);
    return keys.length === INPUT_KEYS.length &&
      INPUT_KEYS.every(key => Object.hasOwn(fields, key) &&
        Object.hasOwn(fields[key], 'value') && fields[key].enumerable === true) &&
      keys.every(key => INPUT_KEYS.includes(key));
  } catch {
    return false;
  }
}

function safeText(text, min, max) {
  if (typeof text !== 'string' || text !== text.trim() ||
    text !== text.normalize('NFC') || text.includes('<') || text.includes('>')) return false;
  const count = [...text].length;
  if (count < min || count > max) return false;
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp <= 31 || cp === 127 ||
      (cp >= 0x200b && cp <= 0x200f) ||
      (cp >= 0x202a && cp <= 0x202e) ||
      (cp >= 0x2066 && cp <= 0x2069) || cp === 0xfeff) return false;
  }
  return true;
}

function canonicalMockUrl(value, hostname, prefix) {
  if (typeof value !== 'string' || value.length > 220 || value.length < 30) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== hostname || url.port ||
      url.username || url.password || url.search || url.hash || url.href !== value) return false;
    if (!url.pathname.startsWith('/' + prefix + '/')) return false;
    const slug = url.pathname.slice(prefix.length + 2);
    return slug.length >= 1 && slug.length <= 96 && MOCK_SLUG.test(slug);
  } catch {
    return false;
  }
}

/**
 * Compose a local-only, non-publishable X text draft for a synthetic article.
 * The input is an exact-key demo snapshot, not a trusted Owner approval.
 * @param {unknown} article
 */
export function createSyntheticXPostDraft(article) {
  if (!exactPlainData(article) ||
    !UUID.test(article.id) || !Number.isSafeInteger(article.revision) || article.revision < 1 ||
    article.mode !== 'LOCAL_SYNTHETIC' || article.status !== 'draft' || article.rights !== 'NOT_CLEARED' ||
    !safeText(article.title, 8, 100) || !safeText(article.summary, 20, 130) ||
    !canonicalMockUrl(article.articleUrl, 'coinblink.example.test', 'news') ||
    !canonicalMockUrl(article.sourceUrl, 'publisher.example.test', 'articles')) {
    throw new TypeError('Only an exact, bounded LOCAL_SYNTHETIC article is accepted');
  }
  const text = article.title + '\n\n' + article.summary + '\n\n' + article.articleUrl;
  if ([...text].length > MAX_PREVIEW_CODEPOINTS) {
    throw new RangeError('LOCAL synthetic X preview exceeds conservative codepoint budget');
  }
  const identityPayload = JSON.stringify([
    'cb-m07-x-v1', article.id, article.revision, article.title, article.summary,
    article.articleUrl, article.sourceUrl,
  ]);
  const identityKey = 'cb-m07-x-v1:' + createHash('sha256').update(identityPayload, 'utf8').digest('hex');
  const reference = Object.freeze({
    articleId: article.id, articleRevision: article.revision,
    articleUrl: article.articleUrl, originalSourceUrl: article.sourceUrl,
  });
  return Object.freeze({
    channel: 'x', mode: 'LOCAL_SYNTHETIC', status: 'DRAFT_ONLY',
    publishingStatus: 'DISABLED', rights: 'NOT_CLEARED', approval: 'NOT_GRANTED',
    canPublish: false, canPostToX: false, publiclyUsable: false,
    identityKey, text, reference,
  });
}
