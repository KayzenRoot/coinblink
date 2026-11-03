// CB-M07-P1-SOCIAL-OAUTH-001: the shared answer page of an OAuth callback.
//
// Every provider callback renders the same minimal, no-store page. Keeping it
// here means a new network cannot accidentally widen the markup or lose the
// noindex header.
import { escapeHtml } from './x-oauth.mjs';

const HEADERS = Object.freeze({
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
});

export function oauthPage(status, title, body) {
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="robots" content="noindex, nofollow">'
    + '<title>' + escapeHtml(title) + ' · CoinBlink</title></head><body><main>'
    + '<h1>' + escapeHtml(title) + '</h1>' + body
    + '<p><a href="/admin/social">Social accounts</a> · <a href="/status">Service status</a></p>'
    + '</main></body></html>';
  return new Response(html, { status, headers: HEADERS });
}

/** The anonymous request must not learn that the route exists. */
export function oauthNotFound() {
  return new Response('Not found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

/** The app or the vault is absent: nothing was exchanged. */
export function oauthNotConfigured(provider, missing) {
  return oauthPage(503, provider + ' OAuth is not configured',
    '<p>This deployment has no ' + escapeHtml(missing) + '. Nothing was exchanged.</p>');
}

/** The provider returned an error instead of a code. */
export function oauthCancelled(provider, error) {
  return oauthPage(400, 'Authorization cancelled',
    '<p>' + escapeHtml(provider) + ' returned <code>' + escapeHtml(error)
    + '</code>. Start the connection again.</p>');
}

/** The state did not match the cookie or was already consumed. */
export function oauthInvalidState(reason) {
  return oauthPage(400, 'Invalid callback', '<p>' + reason + '</p>');
}

export function oauthStorageUnavailable() {
  return oauthPage(503, 'Owner storage is not configured',
    '<p>The owner vault is unavailable. Nothing was exchanged.</p>');
}

export function oauthStoreFailed() {
  return oauthPage(502, 'Could not store the connection',
    '<p>The account was authorized but the encrypted token could not be stored. Nothing was kept.</p>');
}

export function oauthConnected(provider, { username, name, note }) {
  const display = name === '' ? '' : ' (' + escapeHtml(name) + ')';
  return oauthPage(200, provider + ' connected',
    '<p>Authenticated as <strong>' + escapeHtml(username) + '</strong>' + display + '.</p>'
    + '<p>' + note + '</p>');
}
