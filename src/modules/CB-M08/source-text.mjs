// CB-M08-P1-RESEARCH-001: read the publisher page behind a collected headline.
//
// The text is evidence for the writer, never content we publish: it is stripped
// of markup, capped and passed to the model with the rule that no long run of
// its words may appear in the article. One fetch, one timeout, fail closed.

export const SOURCE_TIMEOUT_MS = 8_000;
export const SOURCE_MAX_BYTES = 300_000;
export const SOURCE_EXCERPT_CHARS = 3_500;
export const SOURCE_USER_AGENT = 'CoinBlinkBot/1.0 (+https://coinblink-production.kayzendev.workers.dev/editorial)';

const ENTITIES = Object.freeze({
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
});

export function decodeEntities(value) {
  return String(value ?? '').replaceAll(/&(#x?[0-9a-f]+|[a-z]+);/giu, (whole, code) => {
    const lower = String(code).toLowerCase();
    if (Object.hasOwn(ENTITIES, lower)) return ENTITIES[lower];
    if (lower.startsWith('#x')) {
      const point = Number.parseInt(lower.slice(2), 16);
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ' ';
    }
    if (lower.startsWith('#')) {
      const point = Number.parseInt(lower.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ' ';
    }
    return whole;
  });
}

/** Visible text of an HTML document, capped to the evidence budget. */
export function htmlToText(html) {
  const withoutHead = String(html ?? '')
    .replaceAll(/<!--[\s\S]*?-->/gu, ' ')
    .replaceAll(/<(script|style|noscript|svg|iframe|template)[\s\S]*?<\/\1>/giu, ' ');
  const text = decodeEntities(withoutHead.replaceAll(/<[^>]+>/gu, ' '))
    .replaceAll(/\s+/gu, ' ')
    .trim();
  return text.length > SOURCE_EXCERPT_CHARS ? text.slice(0, SOURCE_EXCERPT_CHARS) : text;
}

/**
 * Fetches the publisher page and returns its readable text. Never throws.
 * @param {{url?: string, fetchImpl?: typeof fetch, timeoutMs?: number}} [options]
 */
export async function fetchSourceText({ url, fetchImpl = globalThis.fetch, timeoutMs = SOURCE_TIMEOUT_MS } = {}) {
  if (typeof url !== 'string' || !/^https:\/\/[^\s]+$/u.test(url)) return Object.freeze({ status: 'error', reason: 'url' });
  if (typeof fetchImpl !== 'function') return Object.freeze({ status: 'error', reason: 'no_fetch' });
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller === null ? null : setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || SOURCE_TIMEOUT_MS));
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': SOURCE_USER_AGENT },
      redirect: 'follow',
      signal: controller?.signal,
    });
    if (!response.ok) return Object.freeze({ status: 'error', reason: 'HTTP_' + response.status });
    const type = String(response.headers?.get?.('content-type') ?? '');
    if (type !== '' && !/text\/html|application\/xhtml/iu.test(type)) return Object.freeze({ status: 'error', reason: 'not_html' });
    const declared = Number(response.headers?.get?.('content-length') ?? '0');
    if (Number.isFinite(declared) && declared > SOURCE_MAX_BYTES) return Object.freeze({ status: 'error', reason: 'too_large' });
    const body = await response.text();
    if (body.length > SOURCE_MAX_BYTES) return Object.freeze({ status: 'error', reason: 'too_large' });
    const text = htmlToText(body);
    if (text.length < 200) return Object.freeze({ status: 'error', reason: 'empty' });
    return Object.freeze({ status: 'ok', text });
  } catch (error) {
    return Object.freeze({ status: 'error', reason: error?.name === 'AbortError' ? 'timeout' : 'network' });
  } finally {
    if (timer !== null) clearTimeout(timer);
  }
}
