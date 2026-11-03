// CB-M07-P1-SOCIAL-OAUTH-001: the shared start of an owner-initiated flow.
//
// A network differences are only the credential, the cookie scope and the
// consent URL. Everything that protects the flow lives here, so a new network
// cannot quietly ship without the owner session check or the one-use state.
import { authorize } from '../CB-M05/p1-production/owner-auth.mjs';
import { randomToken } from './x-oauth.mjs';
import { oauthNotFound, oauthNotConfigured, oauthPage } from './oauth-page.mjs';
import { createOauthState, isVaultSecret } from './token-vault.mjs';

export const OAUTH_COOKIE_MAX_AGE = 600;

/**
 * @param {{request: Request, url: URL, cookies: any, db: any,
 *   secret: string|null|undefined, ownerEnabled: string|null|undefined,
 *   clientId: string|null|undefined, provider: string,
 *   missing: string, cookieName: string, cookiePath: string, callbackPath: string,
 *   authorizeUrl: (input: {redirectUri: string, state: string}) => string,
 *   authorizeSession?: (request: Request, options: object) => Promise<object|null>}} options
 */
export async function startSocialOAuth({
  request, url, cookies, db, secret, ownerEnabled, clientId, provider, missing,
  cookieName, cookiePath, callbackPath, authorizeUrl, authorizeSession = authorize,
}) {
  if (db === undefined || db === null || !isVaultSecret(secret) || ownerEnabled !== 'true'
    || typeof clientId !== 'string' || clientId === '') {
    return oauthNotConfigured(provider, missing);
  }
  const session = await authorizeSession(request, { db, secret, now: Math.floor(Date.now() / 1000) });
  if (session === null) return oauthNotFound();
  const state = randomToken();
  if (!(await createOauthState({ db, state, nowMs: Date.now() }))) {
    return oauthPage(503, 'Owner storage is not ready for OAuth',
      '<p>The one-use state could not be stored. Start again in a moment.</p>');
  }
  cookies.set(cookieName, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: cookiePath,
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });
  return Response.redirect(authorizeUrl({
    redirectUri: new URL(callbackPath, url.origin).toString(),
    state,
  }), 302);
}
