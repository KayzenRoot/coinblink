// The /admin route exists in the source tree for the LOCAL proof and the
// production owner workspace. Production fails closed unless the reviewed
// owner environment is present; anonymous requests stay an indistinguishable 404.
import { createLocalAdminRouter } from '../../modules/CB-M05/p1c-local/local-admin-router.mjs';
import {
  authorize, authorizeForm, bootstrapChallenge, bootstrapClaim, bootstrapPage, csrfFromRequest,
  dashboardPage, denied, enrollChallenge, enrollClaim, json, login, loginChallenge, loginPage,
  logout, ownerExists, readConfig, readJson, sameOrigin,
} from '../../modules/CB-M05/p1-production/owner-auth.mjs';
import {
  createDraft, draftFormPage, draftMarkdown, draftRevisionsPage, draftsPage, listDrafts,
  listRevisions, readDraft, updateDraft,
} from '../../modules/CB-M05/p1-production/drafts.mjs';

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
  const now = Math.floor(Date.now() / 1000);
  const path = url.pathname;
  const method = request.method;
  // Logout is a same-origin form POST. The strict Origin/Sec-Fetch-Site pair is
  // required for credential-changing endpoints, but a logout only revokes the
  // cookie already presented; URL origin plus SameSite=Strict is sufficient.
  if (method === 'POST' && path === '/admin/logout') {
    if (url.origin !== config.origin) return denied(404);
    return logout(request, { db: config.db, secret: config.secret, now });
  }
  const redirectTo = (target) => Response.redirect(new URL(target, url.origin), 303);
  const formInput = (form) => Object.fromEntries(form.entries());
  const draftMatch = /^\/admin\/drafts\/([0-9a-f-]{36})(?:\/(revisions|export))?$/u.exec(path);
  if (method === 'GET' && path === '/admin/drafts') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return draftsPage({ drafts: await listDrafts(config.db), csrf: csrfFromRequest(request) });
  }
  if (method === 'GET' && path === '/admin/drafts/new') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return draftFormPage({ draft: null, csrf: csrfFromRequest(request), action: '/admin/drafts' });
  }
  if (method === 'POST' && path === '/admin/drafts') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    try {
      const id = await createDraft({ db: config.db, secret: config.secret, input: formInput(auth.form), now });
      if (id === null) return draftFormPage({ draft: null, csrf: csrfFromRequest(request), action: '/admin/drafts', error: 'Could not save the draft.' });
      return redirectTo('/admin/drafts/' + id);
    } catch (error) {
      return draftFormPage({ draft: null, csrf: csrfFromRequest(request), action: '/admin/drafts', error: error.message });
    }
  }
  if (draftMatch !== null && method === 'GET' && draftMatch[2] === undefined) {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const draft = await readDraft(config.db, draftMatch[1]);
    if (draft === null) return denied(404);
    return draftFormPage({ draft, csrf: csrfFromRequest(request), action: '/admin/drafts/' + draft.id });
  }
  if (draftMatch !== null && method === 'POST' && draftMatch[2] === undefined) {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await updateDraft({ db: config.db, input: { ...formInput(auth.form), id: draftMatch[1] }, now });
    if (result.status === 'missing') return denied(404);
    if (result.status === 'conflict') {
      return draftFormPage({ draft: result.draft, csrf: csrfFromRequest(request), action: '/admin/drafts/' + draftMatch[1], error: 'This draft changed. Reload and edit the latest revision.' });
    }
    return redirectTo('/admin/drafts/' + draftMatch[1]);
  }
  if (draftMatch !== null && method === 'GET' && draftMatch[2] === 'revisions') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const draft = await readDraft(config.db, draftMatch[1]);
    if (draft === null) return denied(404);
    return draftRevisionsPage({ draft, revisions: await listRevisions(config.db, draft.id), csrf: csrfFromRequest(request) });
  }
  if (draftMatch !== null && method === 'GET' && draftMatch[2] === 'export') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const draft = await readDraft(config.db, draftMatch[1]);
    if (draft === null) return denied(404);
    return new Response(draftMarkdown(draft), {
      status: 200,
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'content-disposition': 'attachment; filename="draft-' + draft.id + '.md"',
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex',
      },
    });
  }
  if (!sameOrigin(request, config.origin)) return denied(404);

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
    const body = await readJson(request);
    return loginChallenge({ db: config.db, config, now, kind: body?.kind ?? 'primary' });
  }
  if (method === 'POST' && path === '/admin/security/enroll/challenge') {
    const body = await readJson(request);
    return enrollChallenge({ request, config, now, kind: body?.kind ?? 'recovery' });
  }
  if (method === 'POST' && path === '/admin/security/enroll/claim') {
    const body = await readJson(request);
    if (body === null) return json({ error: 'invalid_request' }, 400);
    return enrollClaim({ request, config, now, challenge: body.challenge, response: body.response });
  }
  if (method === 'POST' && path === '/admin/login') {
    const body = await readJson(request);
    if (body === null) return json({ error: 'invalid_request' }, 400);
    return login({
      db: config.db, config, credentialId: body.credentialId, challenge: body.challenge,
      response: body.response, now,
    });
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
