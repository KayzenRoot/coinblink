/* global document, location */
// CB-M05 owner WebAuthn client. Same-origin only; no third-party script.
const status = document.getElementById('owner-status');
const say = (message) => { if (status) status.textContent = message; };

function toBytes(value) {
  const normalized = String(value).replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function fromBytes(value) {
  let binary = '';
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

async function post(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body ?? {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || ('HTTP ' + response.status));
  return payload;
}

function serialize(credential) {
  const response = credential.response;
  const base = {
    id: credential.id,
    rawId: fromBytes(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults?.() ?? {},
  };
  if (typeof response.attestationObject !== 'undefined') {
    return {
      ...base,
      response: {
        clientDataJSON: fromBytes(response.clientDataJSON),
        attestationObject: fromBytes(response.attestationObject),
        transports: response.getTransports?.() ?? [],
      },
    };
  }
  return {
    ...base,
    response: {
      clientDataJSON: fromBytes(response.clientDataJSON),
      authenticatorData: fromBytes(response.authenticatorData),
      signature: fromBytes(response.signature),
      userHandle: response.userHandle ? fromBytes(response.userHandle) : null,
    },
  };
}

const bootstrapForm = document.getElementById('owner-bootstrap');
if (bootstrapForm) {
  bootstrapForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = bootstrapForm.querySelector('button');
    const ticket = document.getElementById('owner-ticket')?.value.trim() ?? '';
    if (button) button.disabled = true;
    try {
      say('Requesting a registration challenge…');
      const options = await post('/admin/bootstrap/challenge', { ticket });
      const publicKey = {
        ...options,
        challenge: toBytes(options.challenge),
        user: { ...options.user, id: toBytes(options.user.id) },
      };
      say('Waiting for your passkey…');
      const credential = await navigator.credentials.create({ publicKey });
      if (!credential) throw new Error('No passkey was created');
      say('Verifying the registration…');
      await post('/admin/bootstrap/claim', { ticket, challenge: options.challenge, response: serialize(credential) });
      say('Passkey registered. Redirecting to sign in…');
      location.assign('/admin/login');
    } catch (error) {
      say('Could not register: ' + (error?.message ?? 'unknown error'));
      if (button) button.disabled = false;
    }
  });
}

const loginButton = document.getElementById('owner-login');
if (loginButton) {
  loginButton.addEventListener('click', async () => {
    loginButton.disabled = true;
    try {
      say('Requesting a sign-in challenge…');
      const options = await post('/admin/login/challenge', {});
      const publicKey = {
        ...options,
        challenge: toBytes(options.challenge),
        allowCredentials: options.allowCredentials.map((entry) => ({ ...entry, id: toBytes(entry.id) })),
      };
      say('Waiting for your passkey…');
      const credential = await navigator.credentials.get({ publicKey });
      if (!credential) throw new Error('No passkey assertion returned');
      say('Verifying the signature…');
      await post('/admin/login', {
        credentialId: options.allowCredentials[0].id,
        challenge: options.challenge,
        response: serialize(credential),
      });
      location.assign('/admin');
    } catch (error) {
      say('Could not sign in: ' + (error?.message ?? 'unknown error'));
      loginButton.disabled = false;
    }
  });
}
