// CB-M07-P1-X-OAUTH-001: OAuth 2.0 authorization-code + PKCE for X.
//
// The callback hands the tokens to the owner-only vault (token-vault.mjs),
// which stores only AES-GCM ciphertext. Publishing remains disabled.
export const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
export const X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
export const X_ME_URL = "https://api.twitter.com/2/users/me";
export const X_SCOPES = Object.freeze(["tweet.read", "tweet.write", "users.read", "offline.access"]);
export const X_STATE_COOKIE = "cb_x_state";
export const X_VERIFIER_COOKIE = "cb_x_verifier";
export const X_COOKIE_PATH = "/api/oauth/x";
export const X_COOKIE_MAX_AGE = 600;

/** URL-safe base64 without padding, available in Node and Workers. */
export function base64Url(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError("bytes must be a Uint8Array");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}

/** Cryptographically random bytes; injectable for deterministic tests. */
export function randomBytes(length = 32) {
  if (!Number.isSafeInteger(length) || length < 16 || length > 128) {
    throw new TypeError("length must be between 16 and 128");
  }
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** An opaque URL-safe token for OAuth state. */
export function randomToken(random = randomBytes, length = 24) {
  return base64Url(random(length));
}

/** PKCE S256 pair. The verifier never leaves the server. */
export async function createPkcePair(random = randomBytes) {
  const verifier = base64Url(random(32));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Object.freeze({ verifier, challenge: base64Url(new Uint8Array(digest)) });
}

/** The X authorization URL with scopes, state and the S256 challenge. */
export function buildAuthorizeUrl({ clientId, redirectUri, state, challenge }) {
  for (const [name, value] of Object.entries({ clientId, redirectUri, state, challenge })) {
    if (typeof value !== "string" || value === "") throw new TypeError(name + " is required");
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: X_SCOPES.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return X_AUTHORIZE_URL + "?" + params.toString();
}

/** Normalize the callback query without trusting any value. */
export function readCallback(searchParams) {
  const value = (name) => (typeof searchParams?.get === "function" ? searchParams.get(name) : null);
  const error = value("error");
  return Object.freeze({
    code: value("code"),
    state: value("state"),
    error: typeof error === "string" && error !== "" ? error : null,
    errorDescription: value("error_description"),
  });
}

/** Exchange the code. Errors never include the code, verifier or token. */
export async function exchangeCode({
  fetchImpl = globalThis.fetch, clientId, clientSecret, code, verifier, redirectUri,
}) {
  for (const [name, value] of Object.entries({ clientId, clientSecret, code, verifier, redirectUri })) {
    if (typeof value !== "string" || value === "") throw new TypeError(name + " is required");
  }
  if (typeof fetchImpl !== "function") throw new TypeError("fetch is required");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const response = await fetchImpl(X_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      accept: "application/json",
    },
    body,
  });
  if (!response.ok) throw new Error("X token exchange failed with status " + response.status);
  const payload = await response.json();
  if (payload === null || typeof payload !== "object" || typeof payload.access_token !== "string"
    || payload.access_token === "") {
    throw new Error("X token response had no access token");
  }
  return Object.freeze({
    accessToken: payload.access_token,
    refreshToken: typeof payload.refresh_token === "string" ? payload.refresh_token : null,
    tokenType: typeof payload.token_type === "string" ? payload.token_type : "bearer",
    scope: typeof payload.scope === "string" ? payload.scope : "",
    expiresIn: Number.isFinite(payload.expires_in) ? payload.expires_in : null,
  });
}

/** Read the authenticated account; only the public handle and name leave here. */
export async function fetchViewer({ fetchImpl = globalThis.fetch, accessToken }) {
  if (typeof accessToken !== "string" || accessToken === "") throw new TypeError("accessToken is required");
  if (typeof fetchImpl !== "function") throw new TypeError("fetch is required");
  const response = await fetchImpl(X_ME_URL + "?user.fields=username,name", {
    headers: { authorization: "Bearer " + accessToken, accept: "application/json" },
  });
  if (!response.ok) throw new Error("X viewer request failed with status " + response.status);
  const payload = await response.json();
  const data = payload?.data;
  if (data === null || typeof data !== "object" || typeof data.username !== "string" || data.username === "") {
    throw new Error("X viewer response had no username");
  }
  return Object.freeze({
    id: typeof data.id === "string" ? data.id : "",
    username: data.username,
    name: typeof data.name === "string" ? data.name : "",
  });
}

/** HTML-escape a value before it reaches the callback page. */
export function escapeHtml(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[&<>"']/gu, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}
