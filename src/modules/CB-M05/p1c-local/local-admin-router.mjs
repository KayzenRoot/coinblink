// M05 LOCAL-ONLY admin request adapter. This is not a production authentication endpoint.
// The existing WebAuthn/D1 handler remains the sole server-side security authority.
import { CMS_TEST_ORIGIN, createLocalCmsHandler } from './local-cms.mjs';

const fixed = new Map([
  ['GET /admin', '/local/workspace'],
  ['GET /admin/', '/local/workspace'],
  ['GET /admin/workspace', '/local/workspace'],
  ['GET /admin/login', '/local/ui'],
  ['POST /admin/login', '/local/login'],
  ['POST /admin/challenge', '/local/challenge'],
  ['POST /admin/logout', '/local/logout'],
  ['GET /admin/articles', '/local/articles'],
  ['POST /admin/articles', '/local/articles'],
  ['POST /admin/bootstrap/challenge', '/local/bootstrap/challenge'],
  ['POST /admin/bootstrap/claim', '/local/bootstrap/claim'],
  ['POST /admin/enroll/challenge', '/local/enroll/challenge'],
  ['POST /admin/enroll/claim', '/local/enroll/claim'],
  ['POST /admin/recovery/challenge', '/local/recovery/challenge'],
  ['POST /admin/recovery/complete', '/local/recovery/complete'],
  ['GET /admin/credentials', '/local/credentials'],
  ['POST /admin/credentials/revoke', '/local/credentials/revoke'],
  ['POST /admin/emergency/claim', '/local/emergency/claim'],
]);
const article = /^\/admin\/articles\/([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})(\/(?:revisions|export))?$/i;
const PROTECTED_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
});
function notAvailable() {
  return new Response('Not found', { status: 404, headers: PROTECTED_HEADERS });
}
function localRoute(method, pathname) {
  const exact = fixed.get(method + ' ' + pathname);
  if (exact) return exact;
  const match = pathname.match(article);
  if (!match) return null;
  if (match[2]) return method === 'GET' ? '/local/articles/' + match[1] + match[2] : null;
  return ['GET', 'PATCH'].includes(method) ? '/local/articles/' + match[1] : null;
}

/**
 * Test-origin-only route integration: the incoming host and browser Origin/Fetch-Metadata
 * headers are retained. Never synthesize or override authentication headers.
 * @param {{ now?: () => number }} [options]
 */
export function createLocalAdminRouter(options = {}) {
  const handler = createLocalCmsHandler(options);
  return async (request, env) => {
    if (env?.CB_M05_LOCAL_TEST_ONLY !== 'true' || !env.CMS_D1_LOCAL ||
        !/^[0-9a-f]{64}$/.test(env.CMS_TEST_HMAC_KEY ?? '') ||
        new URL(request.url).origin !== CMS_TEST_ORIGIN) return notAvailable();

    const url = new URL(request.url);
    const target = localRoute(request.method, url.pathname);
    if (!target) return notAvailable();
    url.pathname = target;
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD' && request.body !== null;
    const mappedRequest = new Request(url, {
      method: request.method, headers: request.headers,
      ...(hasBody ? { body: request.body, duplex: 'half' } : {}),
      signal: request.signal,
    });
    const result = await handler(mappedRequest, env);
    if (request.method !== 'GET' || target !== '/local/ui' || result.status !== 200) return result;

    // The already-CSP-nonced UI is the same synthetic harness, with relative API paths
    // switched to this /admin test adapter. Do not expose its local test UI on LIVE.
    const headers = new Headers(result.headers);
    headers.delete('content-length');
    const html = (await result.text()).replaceAll('/local/', '/admin/');
    return new Response(html, { status: result.status, headers });
  };
}
