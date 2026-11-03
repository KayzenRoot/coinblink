// CB-M07-P1-SOCIAL-OAUTH-001: TikTok Login Kit OAuth and profile discovery.
//
// The owner starts the flow, TikTok returns the code to a callback that already
// exists, and the token pair is handed to the AES-GCM vault. The tokens never
// leave this module and are never rendered.
export const TT_AUTHORIZE_URL = 'https://www.tiktok.com/v2/auth/authorize/';
export const TT_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
export const TT_USER_URL = 'https://open.tiktokapis.com/v2/user/info/';
export const TT_SCOPES = Object.freeze(['video.publish', 'video.upload', 'user.info.basic']);
export const TT_STATE_COOKIE = 'cb_tt_state';
export const TT_COOKIE_PATH = '/api/oauth/tiktok';

/** The TikTok consent URL. Scopes are comma separated, as TikTok requires. */
export function buildAuthorizeUrl({ clientKey, redirectUri, state }) {
  for (const [name, value] of Object.entries({ clientKey, redirectUri, state })) {
    if (typeof value !== 'string' || value === '') throw new TypeError(name + ' is required');
  }
  const params = new URLSearchParams({
    client_key: clientKey,
    response_type: 'code',
    scope: TT_SCOPES.join(','),
    redirect_uri: redirectUri,
    state,
  });
  return TT_AUTHORIZE_URL + '?' + params.toString();
}

/** Normalize the callback query without trusting any value. */
export { readCallback } from './oauth-query.mjs';

/** Exchange the code for the token pair. Errors carry the status only. */
export async function exchangeCode({
  fetchImpl = globalThis.fetch, clientKey, clientSecret, code, redirectUri,
}) {
  for (const [name, value] of Object.entries({ clientKey, clientSecret, code, redirectUri })) {
    if (typeof value !== 'string' || value === '') throw new TypeError(name + ' is required');
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const response = await fetchImpl(TT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  if (!response.ok) throw new Error('TikTok token exchange failed with status ' + response.status);
  const payload = await response.json();
  if (typeof payload?.access_token !== 'string' || payload.access_token === '') {
    const detail = typeof payload?.error_description === 'string' ? payload.error_description : '';
    throw new Error('TikTok token response had no access token' + (detail === '' ? '' : ' (' + detail + ')'));
  }
  if (typeof payload?.open_id !== 'string' || payload.open_id === '') {
    throw new Error('TikTok token response had no open id');
  }
  return Object.freeze({
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === 'string' ? payload.refresh_token : null,
    tokenType: typeof payload.token_type === 'string' ? payload.token_type : 'bearer',
    scope: typeof payload.scope === 'string' ? payload.scope : TT_SCOPES.join(','),
    expiresIn: Number.isFinite(payload.expires_in) ? payload.expires_in : null,
    openId: payload.open_id,
  });
}

/**
 * Exchanges the refresh token for a new pair. TikTok access tokens live 24
 * hours, so publishing without this would stop working the next day.
 */
export async function refreshToken({
  fetchImpl = globalThis.fetch, clientKey, clientSecret, refreshToken,
}) {
  for (const [name, value] of Object.entries({ clientKey, clientSecret, refreshToken })) {
    if (typeof value !== 'string' || value === '') throw new TypeError(name + ' is required');
  }
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const response = await fetchImpl(TT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) throw new Error('TikTok token refresh failed with status ' + response.status);
  const payload = await response.json();
  if (typeof payload?.access_token !== 'string' || payload.access_token === '') {
    throw new Error('TikTok token refresh had no access token');
  }
  return Object.freeze({
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === 'string' ? payload.refresh_token : refreshToken,
    scope: typeof payload.scope === 'string' ? payload.scope : TT_SCOPES.join(','),
    expiresIn: Number.isFinite(payload.expires_in) ? payload.expires_in : null,
  });
}

/**
 * Reads the creator profile behind the token. An unaudited app may hide the
 * username, so the display name and the open id keep the row identifiable.
 */
export async function fetchAccount({ fetchImpl = globalThis.fetch, accessToken, openId }) {
  if (typeof accessToken !== 'string' || accessToken === '') throw new TypeError('accessToken is required');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  const url = new URL(TT_USER_URL);
  url.searchParams.set('fields', 'open_id,username,display_name');
  const response = await fetchImpl(url, {
    headers: { authorization: 'Bearer ' + accessToken, accept: 'application/json' },
  });
  if (!response.ok) throw new Error('TikTok profile request failed with status ' + response.status);
  const payload = await response.json();
  const user = payload?.data?.user;
  if (user === null || typeof user !== 'object') {
    throw new Error('TikTok profile response had no user');
  }
  let id = typeof openId === 'string' ? openId : '';
  if (typeof user.open_id === 'string' && user.open_id !== '') id = user.open_id;
  if (id === '') throw new Error('TikTok profile response had no open id');
  let handle = 'tiktok:' + id.slice(0, 12);
  if (typeof user.username === 'string' && user.username !== '') handle = user.username;
  else if (typeof user.display_name === 'string' && user.display_name !== '') handle = user.display_name;
  return Object.freeze({
    id,
    username: String(handle),
    name: typeof user.display_name === 'string' ? user.display_name : '',
  });
}
