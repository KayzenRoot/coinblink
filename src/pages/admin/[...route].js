// The /admin route exists in the source tree solely for the LOCAL synthetic proof.
// Production builds and non-DEV requests fail closed before accessing a CMS binding.
import { createLocalAdminRouter } from '../../modules/CB-M05/p1c-local/local-admin-router.mjs';

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

export const ALL = async ({ request, locals }) => {
  // DEV is compile-time false in the Cloudflare production build. Never accept
  // a browser-supplied header or cookie as an opt-in for fixture privileges.
  if (!import.meta.env.DEV) return unavailable();
  const env = locals?.runtime?.env;
  if (env?.CB_M05_LOCAL_TEST_ONLY !== 'true' || !env.CMS_D1_LOCAL ||
      typeof env.CMS_TEST_HMAC_KEY !== 'string') return unavailable();
  return createLocalAdminRouter()(request, env);
};
