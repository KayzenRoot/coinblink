// The /admin route exists in the source tree for the LOCAL proof and the
// production owner workspace. Production fails closed unless the reviewed
// owner environment is present; anonymous requests stay an indistinguishable 404.
import { createLocalAdminRouter } from '../../modules/CB-M05/p1c-local/local-admin-router.mjs';
import {
  authorize, authorizeForm, bootstrapChallenge, bootstrapClaim, bootstrapPage, csrfFromRequest,
  dashboardPage, denied, enrollChallenge, enrollClaim, json, login, loginChallenge, loginPage,
  logout, normalizePath, ownerExists, page, readConfig, readJson, sameOrigin,
} from '../../modules/CB-M05/p1-production/owner-auth.mjs';
import {
  createDraft, draftFormPage, draftMarkdown, draftRevisionsPage, draftsPage, listDrafts,
  listRevisions, readDraft, updateDraft,
} from '../../modules/CB-M05/p1-production/drafts.mjs';
import {
  articlesAdminSection, listArticles, publishDraft, unpublishArticle,
} from '../../modules/CB-M05/p1-production/articles.mjs';
import { revokeCredential, revokeSession, securityPage } from '../../modules/CB-M05/p1-production/security.mjs';
import { analyticsPage, readAnalytics } from '../../modules/CB-M06/pageview.mjs';
import { listSocialAccounts, revokeSocialAccount, socialPage } from '../../modules/CB-M07/token-vault.mjs';
import {
  clearSetting, listSettings, setSetting, settingsPage,
} from '../../modules/CB-M05/p1-production/settings.mjs';
import { sendTestEmail } from '../../modules/CB-M10/resend.mjs';
import { listSubscribers, subscriberCounts, subscribersSection } from '../../modules/CB-M10/newsletter.mjs';
import {
  createEdition, editionsAdminSection, listEditions, sendEdition,
} from '../../modules/CB-M10/editions.mjs';
import {
  billingPage, billingStatus, checkoutForPlan, missingBillingKeys, readBillingConfig,
} from '../../modules/CB-M12/billing.mjs';
import {
  RESEARCH_MODEL, generateResearch, listResearchNotes, readResearchNote, researchListPage,
  researchNotePage, researchUsage, validResearchModel,
} from '../../modules/CB-M08/research.mjs';
import {
  apiKeysPage, createApiKey, listApiKeys, revokeApiKey,
} from '../../modules/CB-M11/api-keys.mjs';
import { launchGates, opsPage, readOps } from '../../modules/CB-M14/ops.mjs';
import {
  alertsSection, buildAlerts, countOpsEvents, keysNearQuota, listOpsEvents, recordOpsEvent,
} from '../../modules/CB-M14/ops-events.mjs';
import { notifyEvent } from '../../modules/CB-M14/alert-email.mjs';
import {
  adsAdminSection, createPlacement, createSponsor, listPlacements, listSponsors, pausePlacement,
} from '../../modules/CB-M13/ads.mjs';
import { evaluateLaunch, launchSection, launchVerdict } from '../../modules/CB-M15/launch.mjs';
import { buildInfo } from '../../lib/build-info';

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
  const path = normalizePath(url.pathname);
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
  if (method === 'GET' && path === '/admin/analytics') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return analyticsPage({ db: config.db, nowMs: Date.now(), csrf: csrfFromRequest(request) });
  }
  if (method === 'GET' && path === '/admin/security') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return securityPage({
      db: config.db, csrf: csrfFromRequest(request), currentDigest: session.digest, now,
      error: url.searchParams.get('error') ?? '',
    });
  }
  if (method === 'POST' && path === '/admin/security/credential/revoke') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await revokeCredential({
      db: config.db, credentialId: String(auth.form.get('credentialId') ?? ''),
      currentCredentialId: auth.session.credentialId, now,
    });
    if (result.status === 'revoked' && result.current) {
      return logout(request, { db: config.db, secret: config.secret, now });
    }
    const error = result.status === 'last' ? 'The last active passkey cannot be revoked.' : '';
    return redirectTo('/admin/security' + (error === '' ? '' : '?error=' + encodeURIComponent(error)));
  }
  if (method === 'POST' && path === '/admin/security/session/revoke') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await revokeSession({
      db: config.db, digest: String(auth.form.get('digest') ?? ''),
      currentDigest: auth.session.digest, now,
    });
    if (result.status === 'current') return logout(request, { db: config.db, secret: config.secret, now });
    return redirectTo('/admin/security');
  }
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
  if (method === 'GET' && path === '/admin/billing') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const billingConfig = await readBillingConfig({ db: config.db, secret: config.secret, env: env.INTEGRATIONS });
    return billingPage({
      status: await billingStatus({ db: config.db }), config: billingConfig,
      csrf: csrfFromRequest(request), error: url.searchParams.get('error') ?? '',
      checkout: url.searchParams.get('checkout') ?? '',
    });
  }
  if (method === 'POST' && path === '/admin/billing/checkout') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await checkoutForPlan({
      db: config.db, secret: config.secret, env: env.INTEGRATIONS,
      plan: String(auth.form.get('plan') ?? ''), origin: url.origin,
    });
    if (result.status === 'redirect') return redirectTo(result.url);
    const billingConfig = await readBillingConfig({ db: config.db, secret: config.secret, env: env.INTEGRATIONS });
    const message = result.status === 'not_configured' ? 'Missing settings: ' + result.missing.join(', ')
      : result.status === 'live_disabled' ? 'Live Stripe keys are disabled. Use a test key.'
        : result.status === 'invalid_plan' ? 'Choose monthly or yearly.'
          : (result.message ?? 'Checkout failed.');
    return billingPage({
      status: await billingStatus({ db: config.db }), config: billingConfig,
      csrf: csrfFromRequest(request), error: message,
    });
  }
  if (method === 'GET' && path === '/admin/ops') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const nowMs = Date.now();
    const ops = await readOps({ db: config.db, nowMs });
    const status = await billingStatus({ db: config.db });
    const billingConfig = await readBillingConfig({ db: config.db, secret: config.secret, env: env.INTEGRATIONS });
    const research = await researchUsage({ db: config.db, nowMs });
    const keys = await listApiKeys({ db: config.db, nowMs });
    return page('Operations', opsPage({
      ops,
      gates: launchGates({
        ops,
        billing: { missing: missingBillingKeys(billingConfig), active: status.active },
        research,
      }),
      build: buildInfo,
      subscription: status.subscription,
      csrf: csrfFromRequest(request),
      alertsHtml: alertsSection({
        alerts: buildAlerts({
          subscription: status.subscription,
          quotaNear: keysNearQuota(keys),
          eventsLastDay: await countOpsEvents({ db: config.db, nowMs }),
          research,
          nowMs,
        }),
        events: await listOpsEvents({ db: config.db }),
      }),
    }));
  }
  if (method === 'GET' && path === '/admin/articles') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return page('Articles', articlesAdminSection({
      articles: await listArticles({ db: config.db, includeAll: true }),
      drafts: await listDrafts(config.db),
      csrf: csrfFromRequest(request),
      message: url.searchParams.get('error') ?? '',
    }));
  }
  if (method === 'POST' && path === '/admin/articles/publish') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await publishDraft({
      db: config.db,
      draftId: String(auth.form.get('draft_id') ?? ''),
      locale: String(auth.form.get('locale') ?? ''),
      tags: String(auth.form.get('tags') ?? ''),
      provenanceNote: String(auth.form.get('provenance_note') ?? ''),
      nowMs: Date.now(),
    });
    if (result.status === 'published') {
      return page('Articles', articlesAdminSection({
        articles: await listArticles({ db: config.db, includeAll: true }),
        drafts: await listDrafts(config.db),
        csrf: csrfFromRequest(request),
        published: result.article,
      }));
    }
    const reason = result.status === 'missing' ? 'Draft not found.'
      : 'Check the locale, the tags and the provenance note (at least 10 characters).';
    return page('Articles', articlesAdminSection({
      articles: await listArticles({ db: config.db, includeAll: true }),
      drafts: await listDrafts(config.db),
      csrf: csrfFromRequest(request),
      message: reason,
    }), 400);
  }
  if (method === 'POST' && path === '/admin/articles/unpublish') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const done = await unpublishArticle({ db: config.db, id: String(auth.form.get('id') ?? ''), nowMs: Date.now() });
    return redirectTo(done ? '/admin/articles' : '/admin/articles?error=' + encodeURIComponent('Could not unpublish that article.'));
  }
  if (method === 'GET' && path === '/admin/launch') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const nowMs = Date.now();
    const ops = await readOps({ db: config.db, nowMs });
    const status = await billingStatus({ db: config.db });
    const billingConfig = await readBillingConfig({ db: config.db, secret: config.secret, env: env.INTEGRATIONS });
    const integrations = env.INTEGRATIONS ?? {};
    const confirmed = await config.db.prepare(
      "SELECT COUNT(*) AS total FROM cms_newsletter_subscribers WHERE status='confirmed'",
    ).first();
    const items = evaluateLaunch({
      ops,
      billing: { active: status.active, missing: missingBillingKeys(billingConfig) },
      email: {
        apiKey: typeof integrations.RESEND_API_KEY === 'string' && integrations.RESEND_API_KEY !== '',
        from: typeof integrations.COINBLINK_EMAIL_FROM === 'string' && integrations.COINBLINK_EMAIL_FROM !== '',
      },
      eventsLastDay: await countOpsEvents({ db: config.db, nowMs }),
      confirmedSubscribers: Number(confirmed?.total ?? 0),
      origin: typeof env.M05_ORIGIN === 'string' ? env.M05_ORIGIN : '',
    });
    return page('Launch gate', launchSection({ items, verdict: launchVerdict(items) }));
  }
  if (method === 'GET' && path === '/admin/newsletter') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return page('Newsletter', subscribersSection({
      subscribers: await listSubscribers({ db: config.db }),
      counts: await subscriberCounts({ db: config.db }),
    }));
  }
  if (method === 'GET' && path === '/admin/ads') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return page('Ads', adsAdminSection({
      placements: await listPlacements({ db: config.db }),
      sponsors: await listSponsors({ db: config.db }),
      csrf: csrfFromRequest(request),
      message: url.searchParams.get('error') ?? '',
    }));
  }
  if (method === 'POST' && path === '/admin/ads/sponsor') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await createSponsor({
      db: config.db,
      name: String(auth.form.get('name') ?? ''),
      url: String(auth.form.get('url') ?? ''),
      contact: String(auth.form.get('contact') ?? ''),
      nowMs: Date.now(),
    });
    return redirectTo(result.status === 'created'
      ? '/admin/ads'
      : '/admin/ads?error=' + encodeURIComponent('Sponsor needs a name and an https URL.'));
  }
  if (method === 'POST' && path === '/admin/ads/placement') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await createPlacement({
      db: config.db,
      sponsorId: String(auth.form.get('sponsor_id') ?? ''),
      slot: String(auth.form.get('slot') ?? ''),
      label: String(auth.form.get('label') ?? ''),
      body: String(auth.form.get('body') ?? ''),
      ctaLabel: String(auth.form.get('cta_label') ?? ''),
      ctaUrl: String(auth.form.get('cta_url') ?? ''),
      rateCents: Number(auth.form.get('rate_cents') ?? 0),
      startAt: Date.parse(String(auth.form.get('start_at') ?? '')),
      endAt: Date.parse(String(auth.form.get('end_at') ?? '')),
      nowMs: Date.now(),
    });
    return redirectTo(result.status === 'created'
      ? '/admin/ads'
      : '/admin/ads?error=' + encodeURIComponent('Check the slot, the copy, the https URLs and the window (end after start).'));
  }
  if (method === 'POST' && path === '/admin/ads/pause') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const done = await pausePlacement({ db: config.db, id: String(auth.form.get('id') ?? '') });
    return redirectTo(done ? '/admin/ads' : '/admin/ads?error=' + encodeURIComponent('Could not pause that placement.'));
  }
  if (method === 'GET' && path === '/admin/editions') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return page('Editions', editionsAdminSection({
      editions: await listEditions({ db: config.db }),
      articles: await listArticles({ db: config.db, limit: 50 }),
      csrf: csrfFromRequest(request),
      message: url.searchParams.get('error') ?? '',
    }));
  }
  if (method === 'POST' && path === '/admin/editions/create') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await createEdition({
      db: config.db,
      locale: String(auth.form.get('locale') ?? ''),
      subject: String(auth.form.get('subject') ?? ''),
      intro: String(auth.form.get('intro') ?? ''),
      articleIds: auth.form.getAll('article_ids').map((value) => String(value)),
      nowMs: Date.now(),
    });
    if (result.status === 'draft') return redirectTo('/admin/editions');
    const reason = result.reason === 'articles'
      ? 'Choose at least one published article in the selected locale.'
      : result.reason === 'subject' ? 'The subject must have 4 to 140 characters.'
        : 'Choose a supported locale.';
    return redirectTo('/admin/editions?error=' + encodeURIComponent(reason));
  }
  if (method === 'POST' && path === '/admin/editions/send') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await sendEdition({
      db: config.db, secret: config.secret, env: env.INTEGRATIONS,
      id: String(auth.form.get('id') ?? ''), nowMs: Date.now(), origin: config.origin,
    });
    const message = result.status === 'sent' ? '' : result.status === 'already_sent'
      ? 'That edition was already sent.' : 'Could not send: ' + result.status + '.';
    return page('Editions', editionsAdminSection({
      editions: await listEditions({ db: config.db }),
      articles: await listArticles({ db: config.db, limit: 50 }),
      csrf: csrfFromRequest(request),
      message,
      result: result.status === 'sent' ? result : null,
    }));
  }
  if (method === 'GET' && path === '/admin/api') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return page('API access', apiKeysPage({
      keys: await listApiKeys({ db: config.db }),
      active: (await billingStatus({ db: config.db })).active,
      csrf: csrfFromRequest(request),
      message: url.searchParams.get('error') ?? '',
    }));
  }
  if (method === 'POST' && path === '/admin/api/create') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const active = (await billingStatus({ db: config.db })).active;
    try {
      const issued = await createApiKey({
        db: config.db, label: String(auth.form.get('label') ?? ''),
        plan: String(auth.form.get('plan') ?? 'sandbox'), active,
      });
      return page('API access', apiKeysPage({
        keys: await listApiKeys({ db: config.db }), active, csrf: csrfFromRequest(request), issued,
      }));
    } catch (error) {
      return page('API access', apiKeysPage({
        keys: await listApiKeys({ db: config.db }), active, csrf: csrfFromRequest(request),
        message: error.message,
      }), 400);
    }
  }
  if (method === 'POST' && path === '/admin/api/revoke') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const revoked = await revokeApiKey({ db: config.db, keyId: String(auth.form.get('key_id') ?? '') });
    return redirectTo(revoked
      ? '/admin/api'
      : '/admin/api?error=' + encodeURIComponent('Could not revoke that key.'));
  }
  if (method === 'GET' && path === '/admin/settings') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return settingsPage({
      entries: await listSettings({ db: config.db, secret: config.secret, env: env.INTEGRATIONS }),
      csrf: csrfFromRequest(request),
      message: url.searchParams.get('saved') ?? '',
    });
  }
  if (method === 'POST' && path === '/admin/settings/save') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const key = String(auth.form.get('key') ?? '');
    try {
      const saved = await setSetting({
        db: config.db, secret: config.secret, key,
        value: String(auth.form.get('value') ?? ''), nowMs: Date.now(),
      });
      return redirectTo('/admin/settings?saved=' + encodeURIComponent(saved ? key + ' saved' : 'Could not save ' + key));
    } catch (error) {
      return redirectTo('/admin/settings?saved=' + encodeURIComponent(error.message));
    }
  }
  if (method === 'POST' && path === '/admin/settings/clear') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const key = String(auth.form.get('key') ?? '');
    const cleared = await clearSetting({ db: config.db, key, nowMs: Date.now() });
    return redirectTo('/admin/settings?saved=' + encodeURIComponent(cleared ? key + ' cleared' : 'Could not clear ' + key));
  }
  if (method === 'POST' && path === '/admin/settings/test-email') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const result = await sendTestEmail({
      db: config.db, secret: config.secret, env: env.INTEGRATIONS,
      to: String(auth.form.get('to') ?? ''), nowMs: Date.now(),
    });
    return settingsPage({
      entries: await listSettings({ db: config.db, secret: config.secret, env: env.INTEGRATIONS }),
      csrf: csrfFromRequest(request), result,
    });
  }
  if (method === 'GET' && path === '/admin/social') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    return socialPage({ accounts: await listSocialAccounts(config.db), csrf: csrfFromRequest(request) });
  }
  if (method === 'POST' && path === '/admin/social/revoke') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    await revokeSocialAccount({
      db: config.db, provider: String(auth.form.get('provider') ?? ''),
      accountId: String(auth.form.get('accountId') ?? ''),
    });
    return redirectTo('/admin/social');
  }
  const researchMatch = /^\/admin\/research\/([0-9a-f-]{36})$/u.exec(path);
  if (method === 'GET' && path === '/admin/research') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const usage = await researchUsage({ db: config.db, nowMs: Date.now() });
    return researchListPage({
      drafts: await listDrafts(config.db), notes: await listResearchNotes(config.db),
      csrf: csrfFromRequest(request), used: usage.used, cap: usage.cap,
    });
  }
  if (method === 'POST' && path === '/admin/research') {
    const auth = await authorizeForm(request, config, now);
    if (auth === null) return denied(404);
    const draft = await readDraft(config.db, String(auth.form.get('draftId') ?? ''));
    if (draft === null) return denied(404);
    const result = await generateResearch({
      db: config.db, ai: env.AI, draft,
      focus: String(auth.form.get('focus') ?? ''),
      language: String(auth.form.get('language') ?? 'en'),
      nowMs: Date.now(),
      model: validResearchModel(env.M08_MODEL) ? env.M08_MODEL : RESEARCH_MODEL,
    });
    if (result.status === 'created') return redirectTo('/admin/research/' + result.note.id);
    // A model or provider failure is worth the owner's attention; a capped or
    // invalid request is not.
    if (result.status === 'unavailable' || result.status === 'invalid_output' || result.status === 'unverified_output') {
      const nowMs = Date.now();
      const detail = 'research ' + result.status;
      await recordOpsEvent({ db: config.db, type: 'research_failed', detail, nowMs });
      await notifyEvent({
        db: config.db, secret: config.secret, env: env.INTEGRATIONS,
        type: 'research_failed', detail, nowMs,
      });
    }
    const messages = {
      capped: 'Daily research limit reached. Try again tomorrow (UTC).',
      unavailable: 'Workers AI is not configured or did not answer.',
      invalid_output: 'The model did not return the required JSON shape. Nothing was saved.',
      unverified_output: 'No quoted evidence matched the draft. Nothing was saved.',
      invalid: 'The request was invalid.',
      missing: 'Draft not found.',
    };
    const usage = await researchUsage({ db: config.db, nowMs: Date.now() });
    return researchListPage({
      drafts: await listDrafts(config.db), notes: await listResearchNotes(config.db),
      csrf: csrfFromRequest(request), used: usage.used, cap: usage.cap,
      error: messages[result.status] ?? 'Could not generate a research note.',
    });
  }
  if (researchMatch !== null && method === 'GET') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const note = await readResearchNote(config.db, researchMatch[1]);
    if (note === null) return denied(404);
    return researchNotePage({ note, csrf: csrfFromRequest(request) });
  }
  if (!sameOrigin(request, config.origin)) return denied(404);

  if (method === 'GET' && path === '/admin') {
    const session = await authorize(request, { db: config.db, secret: config.secret, now });
    if (session === null) return denied(404);
    const nowMs = Date.now();
    const ops = await readOps({ db: config.db, nowMs });
    const status = await billingStatus({ db: config.db });
    const billingConfig = await readBillingConfig({ db: config.db, secret: config.secret, env: env.INTEGRATIONS });
    const research = await researchUsage({ db: config.db, nowMs });
    const keys = await listApiKeys({ db: config.db, nowMs });
    const alerts = buildAlerts({
      subscription: status.subscription,
      quotaNear: keysNearQuota(keys),
      eventsLastDay: await countOpsEvents({ db: config.db, nowMs }),
      research,
      nowMs,
    });
    const confirmedRow = await config.db.prepare(
      "SELECT COUNT(*) AS total FROM cms_newsletter_subscribers WHERE status='confirmed'",
    ).first();
    const gateItems = evaluateLaunch({
      ops,
      billing: { active: status.active, missing: missingBillingKeys(billingConfig) },
      email: {
        apiKey: typeof (env.INTEGRATIONS ?? {}).RESEND_API_KEY === 'string' && (env.INTEGRATIONS ?? {}).RESEND_API_KEY !== '',
        from: typeof (env.INTEGRATIONS ?? {}).COINBLINK_EMAIL_FROM === 'string' && (env.INTEGRATIONS ?? {}).COINBLINK_EMAIL_FROM !== '',
      },
      eventsLastDay: await countOpsEvents({ db: config.db, nowMs }),
      confirmedSubscribers: Number(confirmedRow?.total ?? 0),
      origin: typeof env.M05_ORIGIN === 'string' ? env.M05_ORIGIN : '',
    });
    return dashboardPage({
      db: config.db,
      expiresAt: session.expiresAt,
      stats: {
        ops,
        analytics: await readAnalytics({ db: config.db, nowMs }),
        counts: await subscriberCounts({ db: config.db }),
        status,
        alerts,
        gates: launchVerdict(gateItems),
        events: await listOpsEvents({ db: config.db, limit: 5 }),
      },
    });
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
      AI: runtimeBinding('AI'),
      M08_MODEL: runtimeEnv('M08_MODEL'),
      INTEGRATIONS: Object.fromEntries([
        'RESEND_API_KEY', 'COINBLINK_EMAIL_FROM', 'COINBLINK_TEST_EMAIL',
        'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_YEARLY',
        'X_CLIENT_ID', 'X_CLIENT_SECRET', 'META_APP_ID', 'META_APP_SECRET',
        'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'M08_MODEL',
      ].map((key) => [key, runtimeEnv(key)])),
    });
  }
  // DEV is compile-time false in the Cloudflare production build. Never accept
  // a browser-supplied header or cookie as an opt-in for fixture privileges.
  const env = locals?.runtime?.env;
  if (env?.CB_M05_LOCAL_TEST_ONLY !== 'true' || !env.CMS_D1_LOCAL ||
      typeof env.CMS_TEST_HMAC_KEY !== 'string') return unavailable();
  return createLocalAdminRouter()(request, env);
};
