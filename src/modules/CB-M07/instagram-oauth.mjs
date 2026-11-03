// CB-M07-P1-SOCIAL-OAUTH-001: Instagram (Meta) OAuth and account discovery.
//
// The owner starts the flow, Meta returns the code to a callback that already
// exists, and the long-lived Page token is handed to the AES-GCM vault. The
// token never leaves this module and is never rendered.
export const IG_AUTHORIZE_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
export const IG_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token';
export const IG_ACCOUNTS_URL = 'https://graph.facebook.com/v21.0/me/accounts';
export const IG_SCOPES = Object.freeze([
  'instagram_basic', 'instagram_content_publish', 'pages_show_list',
]);
export const IG_STATE_COOKIE = 'cb_ig_state';
export const IG_COOKIE_PATH = '/api/oauth/instagram';
export const IG_COOKIE_MAX_AGE = 600;

/** The Meta consent URL with the three publishing scopes. */
export function buildAuthorizeUrl({ appId, redirectUri, state }) {
  for (const [name, value] of Object.entries({ appId, redirectUri, state })) {
    if (typeof value !== 'string' || value === '') throw new TypeError(name + ' is required');
  }
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    response_type: 'code',
    scope: IG_SCOPES.join(','),
  });
  return IG_AUTHORIZE_URL + '?' + params.toString();
}

/** Normalize the callback query without trusting any value. */
export { readCallback } from './oauth-query.mjs';

function tokenError(provider, status) {
  return new Error(provider + ' token exchange failed with status ' + status);
}

/**
 * Exchanges the code for a short-lived user token and immediately upgrades it
 * to the long-lived token. Errors carry the HTTP status only, never the code
 * or the token.
 */
export async function exchangeCode({
  fetchImpl = globalThis.fetch, appId, appSecret, code, redirectUri,
}) {
  for (const [name, value] of Object.entries({ appId, appSecret, code, redirectUri })) {
    if (typeof value !== 'string' || value === '') throw new TypeError(name + ' is required');
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const short = new URL(IG_TOKEN_URL);
  short.searchParams.set('client_id', appId);
  short.searchParams.set('client_secret', appSecret);
  short.searchParams.set('redirect_uri', redirectUri);
  short.searchParams.set('code', code);
  const shortResponse = await fetchImpl(short, { headers: { accept: 'application/json' } });
  if (!shortResponse.ok) throw tokenError('Instagram', shortResponse.status);
  const shortPayload = await shortResponse.json();
  if (typeof shortPayload?.access_token !== 'string' || shortPayload.access_token === '') {
    throw new Error('Instagram token response had no access token');
  }
  const long = new URL(IG_TOKEN_URL);
  long.searchParams.set('grant_type', 'fb_exchange_token');
  long.searchParams.set('client_id', appId);
  long.searchParams.set('client_secret', appSecret);
  long.searchParams.set('fb_exchange_token', shortPayload.access_token);
  const longResponse = await fetchImpl(long, { headers: { accept: 'application/json' } });
  if (!longResponse.ok) throw tokenError('Instagram', longResponse.status);
  const payload = await longResponse.json();
  if (typeof payload?.access_token !== 'string' || payload.access_token === '') {
    throw new Error('Instagram long-lived token response had no access token');
  }
  return Object.freeze({
    accessToken: payload.access_token,
    refreshToken: null,
    tokenType: typeof payload.token_type === 'string' ? payload.token_type : 'bearer',
    scope: IG_SCOPES.join(','),
    expiresIn: Number.isFinite(payload.expires_in) ? payload.expires_in : null,
  });
}

/**
 * Finds the Instagram professional account behind the token. The Page token is
 * the credential Instagram publishing needs, so the caller stores that one, not
 * the user token.
 */
export async function fetchAccount({ fetchImpl = globalThis.fetch, accessToken }) {
  if (typeof accessToken !== 'string' || accessToken === '') throw new TypeError('accessToken is required');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const url = new URL(IG_ACCOUNTS_URL);
  url.searchParams.set('fields', 'name,access_token,instagram_business_account{id,username}');
  url.searchParams.set('access_token', accessToken);
  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('Instagram accounts request failed with status ' + response.status);
  const payload = await response.json();
  const pages = Array.isArray(payload?.data) ? payload.data : [];
  const page = pages.find((row) => typeof row?.instagram_business_account?.id === 'string'
    && row.instagram_business_account.id !== '' && typeof row?.access_token === 'string'
    && row.access_token !== '');
  if (page === undefined) {
    throw new Error('Instagram found no professional account linked to a Page');
  }
  const igUser = page.instagram_business_account;
  const handle = typeof igUser.username === 'string' && igUser.username !== ''
    ? igUser.username
    : (typeof page.name === 'string' && page.name !== '' ? page.name : 'instagram:' + igUser.id);
  return Object.freeze({
    id: igUser.id,
    username: handle,
    name: typeof page.name === 'string' ? page.name : '',
    pageToken: page.access_token,
  });
}
