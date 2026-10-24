// CB-NEWS-P0-SOURCE-GATE-001: pure pre-ingestion policy, NOT a publishing permission.
// Supply the source registry from a trusted server-held configuration, never from
// an RSS item, browser input or news provider. This module performs no I/O.
const DENIED = Object.freeze({
  status: 'DENIED', mode: 'PRIVATE_REVIEW_INTAKE',
  publiclyUsable: false, canPublish: false, canPostToX: false,
});
const CANDIDATE_KEYS = Object.freeze(['sourceId', 'externalId', 'originUrl', 'title', 'publishedAt']);
const SOURCE_KEYS = Object.freeze(['id', 'origin', 'pathPrefix', 'active', 'intakePermission', 'rightsRef']);
const SOURCE_ID = /^[a-z][a-z0-9-]{1,63}$/u;
const EXTERNAL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u;
const RIGHTS_REF = /^[A-Z][A-Z0-9-]{11,63}$/u;
const PATH_PREFIX = /^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\/$/u;
const UTC_SECONDS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u;
const FORBIDDEN_HOST_ENDINGS = ['.test', '.invalid', '.local', '.localhost', '.internal', '.example'];

function plainDataRecord(value, exactKeys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  try {
    if (Object.getPrototypeOf(value) !== Object.prototype) return false;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors);
    return keys.length === exactKeys.length &&
      exactKeys.every(key => Object.hasOwn(descriptors, key) && Object.hasOwn(descriptors[key], 'value')) &&
      keys.every(key => exactKeys.includes(key));
  } catch {
    return false;
  }
}

function safeHost(host) {
  if (typeof host !== 'string' || host.length > 253 ||
    !/^[a-z0-9.-]+$/u.test(host) || !host.includes('.') ||
    host.endsWith('.') || host.startsWith('.') || host.includes('..') ||
    host === 'localhost' || host.includes(':') ||
    /^\d+(?:\.\d+){3}$/u.test(host) ||
    FORBIDDEN_HOST_ENDINGS.some(suffix => host.endsWith(suffix))) return false;
  return host.split('.').every(label => label.length >= 1 && label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/u.test(label));
}

function trustedSource(source) {
  if (!plainDataRecord(source, SOURCE_KEYS) ||
    !SOURCE_ID.test(source.id) || source.active !== true ||
    source.intakePermission !== 'PRIVATE_REVIEW_INTAKE' ||
    typeof source.rightsRef !== 'string' || !RIGHTS_REF.test(source.rightsRef) ||
    typeof source.origin !== 'string' || typeof source.pathPrefix !== 'string' ||
    !PATH_PREFIX.test(source.pathPrefix)) return false;
  try {
    const url = new URL(source.origin);
    return url.protocol === 'https:' && safeHost(url.hostname) &&
      !url.username && !url.password && !url.port &&
      !url.search && !url.hash && url.pathname === '/' &&
      url.origin === source.origin;
  } catch {
    return false;
  }
}

function timestampValid(value) {
  if (typeof value !== 'string' || !UTC_SECONDS.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) &&
    date.toISOString() === value.slice(0, -1) + '.000Z';
}

function printableTitle(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 240 ||
    value !== value.trim() || value.includes('<') || value.includes('>')) return false;
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code < 32 || code === 127) return false;
  }
  return true;
}

function canonicalArticleUrl(value, source) {
  if (typeof value !== 'string' || value.length < 16 || value.length > 2048 ||
    value !== value.trim() || /[\s\\#]/u.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !safeHost(url.hostname) ||
      url.username || url.password || url.port || url.hash ||
      url.origin !== source.origin || !url.pathname.startsWith(source.pathPrefix) ||
      /%(?:2e|2f|5c)/iu.test(url.pathname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Pure gate for admission to PRIVATE editorial review, never to publication.
 * Registry items must be provisioned by trusted server configuration.
 * @param {unknown} candidate - Strict untrusted provider metadata (no rights fields).
 * @param {unknown} trustedRegistry - Server-controlled allowlisted source descriptors.
 * @returns {Readonly<object>} Frozen denial or PRIVATE_REVIEW_ONLY candidate.
 */
export function evaluateSourceEligibility(candidate, trustedRegistry) {
  if (!plainDataRecord(candidate, CANDIDATE_KEYS) ||
    !Array.isArray(trustedRegistry) || trustedRegistry.length < 1 || trustedRegistry.length > 32 ||
    !SOURCE_ID.test(candidate.sourceId) ||
    typeof candidate.externalId !== 'string' || !EXTERNAL_ID.test(candidate.externalId) ||
    !printableTitle(candidate.title) || !timestampValid(candidate.publishedAt)) return DENIED;

  const seen = new Set();
  let source = null;
  for (const row of trustedRegistry) {
    if (!trustedSource(row) || seen.has(row.id)) return DENIED;
    seen.add(row.id);
    if (row.id === candidate.sourceId) source = row;
  }
  if (!source) return DENIED;
  const canonicalUrl = canonicalArticleUrl(candidate.originUrl, source);
  if (!canonicalUrl) return DENIED;

  return Object.freeze({
    status: 'PRIVATE_REVIEW_ONLY',
    mode: 'PRIVATE_REVIEW_INTAKE',
    publiclyUsable: false,
    canPublish: false,
    canPostToX: false,
    sourceId: source.id,
    externalId: candidate.externalId,
    identityKey: source.id + ':' + encodeURIComponent(candidate.externalId),
    originUrl: canonicalUrl,
    title: candidate.title,
    publishedAt: candidate.publishedAt,
    rightsRef: source.rightsRef,
  });
}
