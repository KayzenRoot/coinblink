// The /admin route exists in the source tree for the LOCAL proof and the
// production owner workspace. Production fails closed unless the reviewed
// owner environment is present; anonymous requests stay an indistinguishable 404.
import { createLocalAdminRouter } from '../../modules/CB-M05/p1c-local/local-admin-router.mjs';
import {
  authorize, bootstrapChallenge, bootstrapClaim, bootstrapPage, dashboardPage, denied, json,
  login, loginChallenge, loginPage, logout, ownerExists, readConfig, readJson, sameOrigin,
} from '../../modules/CB-M05/p1-production/owner-auth.mjs';

export const prerender = false;

const unavailable = () => new Response('Not found', {
  status: 404,
  headers: {
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex, nofollow, noarchive',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  },
});

async function productionAdmin(request, env) {
  const config = readConfig(env);
  if (config === null) return denied(404);
  const url = new URL(request.url);
  if (!sameOrigin(request, config.origin)) return denied(404);
  const now = Math.floor(Date.now() / 1000);
  const path = url.pathname;
  const method = request.method;

  if (method === 'GET' && path === '/admin') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return dashboardPage({ db: config.db, expiresAt: session.expiresAt });
  }
  if (method === 'GET' && path === '/admin/login') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session !== null) return Response.redirect(new URL('/admin', url.origin), 303);
    return loginPage();
  }
  if (method === 'GET' && path === '/admin/bootstrap') {
    return (await ownerExists(config.db)) ? denied(404) : bootstrapPage();
  }
  if (method === 'POST' && path === '/admin/bootstrap/challenge') {
    const body = await readJson(request);
    if (body === null) return json({ error: 'invalid_request' }, 400);
    return bootstrapChallenge({ db: config.db, config, ticket: body.ticket, now });
  }
  if (method === 'POST' && path === '/admin/bootstrap/claim') {
    const body = await readJson(request);
    if (body === null) return json({ error: 'invalid_request' }, 400);
    return bootstrapClaim({
      db: config.db, config, ticket: body.ticket, challenge: body.challenge, response: body.response, now,
    });
  }
  if (method === 'POST' && path === '/admin/login/challenge') {
    return loginChallenge({ db: config.db, config, now });
  }
  if (method === 'POST' && path === '/admin/login') {
    const body = await readJson(request);
    if (body === null) return json({ error: 'invalid_request' }, 400);
    return login({
      db: config.db, config, credentialId: body.credentialId, challenge: body.challenge,
      response: body.response, now,
    });
  }
  if (method === 'POST' && path === '/admin/logout') {
    return logout(request, { db: config.db, secret: config.secret, now });
  }
  return denied(404);
}

export const ALL = async ({ request, locals }) => {
  if (!import.meta.env.DEV) {
    // Use the same static cloudflare:workers helper that already serves the X
    // OAuth routes; the dynamic module import is not reliable in this bundle.
    const { runtimeBinding, runtimeEnv } = await import('../../lib/runtime-env');
    return productionAdmin(request, {
      CMS_DB: runtimeBinding('CMS_DB'),
      M05_OWNER_ENABLED: runtimeEnv('M05_OWNER_ENABLED'),
      M05_SESSION_SECRET: runtimeEnv('M05_SESSION_SECRET'),
      M05_RP_ID: runtimeEnv('M05_RP_ID'),
      M05_ORIGIN: runtimeEnv('M05_ORIGIN'),
    });
  }
  // DEV is compile-time false in the Cloudflare production build. Never accept
  // a browser-supplied header or cookie as an opt-in for fixture privileges.
  const env = locals?.runtime?.env;
  if (env?.CB_M05_LOCAL_TEST_ONLY !== 'true' || !env.CMS_D1_LOCAL ||
      typeof env.CMS_TEST_HMAC_KEY !== 'string') return unavailable();
  return createLocalAdminRouter()(request, env);
};
