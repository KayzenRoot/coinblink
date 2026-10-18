// Dedicated LOCAL D1 fixture UI. Never imported by public Astro routes.
// A browser-side test passkey must be pre-enrolled for owner.example.test.
// No real Owner provisioning or production secrets are supported here.
export const LOCAL_CMS_UI_SCRIPT = String.raw`
  const ui = {
    id: document.getElementById('credential'),
    login: document.getElementById('login'),
    logout: document.getElementById('logout'),
    refresh: document.getElementById('refresh'),
    form: document.getElementById('draft'),
    items: document.getElementById('items'),
    search: document.getElementById('draft-search'),
    message: document.getElementById('message'),
    preview: document.getElementById('draft-preview'),
    previewTitle: document.getElementById('draft-preview-title'),
    previewSummary: document.getElementById('draft-preview-summary'),
    previewBody: document.getElementById('draft-preview-body'),
    previewSource: document.getElementById('draft-preview-source'),
    unsaved: document.getElementById('unsaved-draft-status'),
    status: document.getElementById('session-status'),
    revision: document.getElementById('revision'),
    draftId: document.getElementById('draft-id'),
    save: document.getElementById('save'),
    history: document.getElementById('history'),
    historyList: document.getElementById('history-list'),
    bootstrap: document.getElementById('bootstrap'),
    ticket: document.getElementById('ticket'),
    devices: document.getElementById('devices'),
    enrollRecovery: document.getElementById('enroll-recovery'),
    enrollPrimary: document.getElementById('enroll-primary'),
    authorizeRecovery: document.getElementById('authorize-recovery'),
    deviceId: document.getElementById('device-id'),
    revokeDevice: document.getElementById('revoke-device'),
    deviceList: document.getElementById('device-list'),
    emergency: document.getElementById('emergency'),
    emergencyToken: document.getElementById('emergency-token'),
  };
  let csrf = null;
  let lastDrafts = [];
  let savedSnapshot = null;
  const draftFields = ['title', 'summary', 'body', 'sourceUrl', 'authorLabel'];
  function draftSnapshot() {
    return JSON.stringify(draftFields.map(name => ui.form.elements.namedItem(name).value));
  }
  function hasUnsavedChanges() {
    return !!csrf && !ui.form.hidden && savedSnapshot !== null && draftSnapshot() !== savedSnapshot;
  }
  function showUnsavedChanges() {
    ui.unsaved.hidden = !hasUnsavedChanges();
  }
  function acceptSavedDraft() {
    savedSnapshot = draftSnapshot();
    showUnsavedChanges();
  }
  function confirmDraftDiscard() {
    return !hasUnsavedChanges() || window.confirm('Discard unsaved changes in this LOCAL draft?');
  }
  // Native browser navigation/refresh guard. Never persist text in browser storage.
  // Revoked sessions and explicit sign-out still clear data without a prompt.
  window.addEventListener?.('beforeunload', (event) => {
    if (!hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = '';
  });
  const decode = (s) => {
    const t = s.replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(t + '='.repeat((4 - t.length % 4) % 4));
    return Uint8Array.from(raw, x => x.charCodeAt(0));
  };
  const encode = (buffer) => {
    let raw = '';
    for (const b of new Uint8Array(buffer)) raw += String.fromCharCode(b);
    return btoa(raw).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
  const message = (value) => { ui.message.textContent = value; };
  // Preview is a private, client-side text-only DOM projection. No publication,
  // raw HTML, additional request or external source fetching is permitted.
  function renderDraftPreview() {
    const authorized = !!csrf && !ui.form.hidden;
    const title = authorized ? ui.form.elements.namedItem('title').value.trim() : '';
    const summary = authorized ? ui.form.elements.namedItem('summary').value.trim() : '';
    const body = authorized ? ui.form.elements.namedItem('body').value.trim() : '';
    const source = authorized ? ui.form.elements.namedItem('sourceUrl').value.trim() : '';
    ui.preview.hidden = !authorized || !(title || summary || body);
    ui.previewTitle.textContent = title;
    ui.previewSummary.textContent = summary;
    ui.previewBody.textContent = body;
    ui.previewSource.textContent = source;
  }
  function clearLocalSession() {
    csrf = null;
    savedSnapshot = null;
    ui.form.reset();
    ui.draftId.value = '';
    ui.revision.value = '0';
    ui.save.textContent = 'Create draft';
    ui.form.hidden = true;
    renderDraftPreview();
    showUnsavedChanges();
    ui.logout.hidden = true;
    ui.refresh.hidden = true;
    ui.history.hidden = true;
    ui.historyList.replaceChildren();
    ui.items.replaceChildren();
    lastDrafts = [];
    ui.search.value = '';
    ui.search.hidden = true;
    ui.devices.hidden = true;
    ui.deviceList.replaceChildren();
    ui.deviceId.value = '';
    ui.emergencyToken.value = '';
    ui.status.textContent = 'Not authenticated';
  }
  async function api(url, method = 'GET', body) {
    const headers = {};
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      if (csrf) headers['X-CB-CSRF'] = csrf;
    }
    const response = await fetch(url, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (!response.ok) {
      // Fail closed on expired/revoked sessions: do not leave private draft text
      // readable in an old visible form after a denied authenticated read.
      if (response.status === 401 && (csrf ||
          /^\/(?:local|admin)\/articles(?:\/|\?|$)/.test(url))) {
        // Denied article reads must erase stale drafts even if the local CSRF state
        // was already cleared. After sign-in, deny from any protected route
        // also revokes this browser editor's local authenticated state.
        clearLocalSession();
      }
      const error = new Error('Local request rejected (' + response.status + ')');
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function registrationJson(credential) {
    return {
      id: credential.id,
      rawId: encode(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: encode(credential.response.clientDataJSON),
        attestationObject: encode(credential.response.attestationObject),
        transports: credential.response.getTransports ? credential.response.getTransports() : [],
      },
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment: credential.authenticatorAttachment,
    };
  }
  function assertionJson(assertion) {
    return {
      id: assertion.id,
      rawId: encode(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: encode(assertion.response.clientDataJSON),
        authenticatorData: encode(assertion.response.authenticatorData),
        signature: encode(assertion.response.signature),
        userHandle: assertion.response.userHandle ? encode(assertion.response.userHandle) : null,
      },
      clientExtensionResults: assertion.getClientExtensionResults(),
    };
  }
  async function createPasskey(challengeHex, rpId) {
    if (!window.PublicKeyCredential || !navigator.credentials?.create) {
      throw new Error('Browser passkey creation is unavailable in this secure test origin');
    }
    const credential = await navigator.credentials.create({ publicKey: {
      challenge: Uint8Array.from(challengeHex.match(/.{2}/g), x => parseInt(x, 16)),
      rp: { id: rpId, name: 'CoinBlink local test' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'local-owner', displayName: 'Local Owner' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { userVerification: 'required', residentKey: 'required' },
      attestation: 'none', timeout: 60000,
    } });
    if (!credential) throw new Error('Passkey was not created');
    return registrationJson(credential);
  }
  async function refreshDevices() {
    const { credentials } = await api('/local/credentials');
    ui.deviceList.replaceChildren();
    for (const device of credentials) {
      const item = document.createElement('li');
      item.textContent = device.device_kind + ' · ' + device.credential_id.slice(0, 10) + '…' +
        (device.credential_id === ui.id.value.trim() ? ' (this sign-in)' : '') +
        (device.revoked_at ? ' (revoked)' : ' (active)');
      ui.deviceList.append(item);
    }
  }
  function editDraft(draft) {
    ui.form.elements.namedItem('title').value = draft.title;
    ui.form.elements.namedItem('summary').value = draft.summary;
    ui.form.elements.namedItem('body').value = draft.body;
    ui.form.elements.namedItem('sourceUrl').value = draft.source_url;
    ui.form.elements.namedItem('authorLabel').value = draft.author_label;
    ui.draftId.value = draft.id;
    ui.revision.value = String(draft.revision);
    ui.save.textContent = 'Save new revision';
    ui.history.hidden = false;
    ui.historyList.replaceChildren();
    renderDraftPreview();
    acceptSavedDraft();
  }
  function renderDraftList() {
    ui.items.replaceChildren();
    const query = ui.search.value.trim().toLowerCase();
    for (const draft of lastDrafts) {
      if (query && !draft.title.toLowerCase().includes(query)) continue;
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = draft.title + ' · rev ' + draft.revision;
      button.addEventListener('click', async () => {
        if (!confirmDraftDiscard()) return;
        try {
          const result = await api('/local/articles/' + encodeURIComponent(draft.id));
          editDraft(result.draft);
          message('Loaded draft revision ' + result.draft.revision);
        } catch { message('Could not open draft'); }
      });
      li.append(button);
      ui.items.append(li);
    }
  }
  async function refresh() {
    const { drafts } = await api('/local/articles');
    lastDrafts = drafts;
    renderDraftList();
    ui.status.textContent = 'Local test session active';
  }
  ui.search.addEventListener('input', renderDraftList);
  ui.form.addEventListener('input', () => {
    renderDraftPreview();
    showUnsavedChanges();
  });
  ui.login.addEventListener('click', async () => {
    ui.login.disabled = true;
    try {
      if (!window.PublicKeyCredential || !navigator.credentials?.get) {
        throw new Error('Browser passkey APIs are unavailable in this secure test origin');
      }
      const credentialId = ui.id.value.trim();
      const { challenge, rpId } = await api('/local/challenge', 'POST', { credentialId });
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: Uint8Array.from(challenge.match(/.{2}/g), x => parseInt(x, 16)),
          rpId,
          allowCredentials: [{ type: 'public-key', id: decode(credentialId) }],
          userVerification: 'required',
          timeout: 60000,
        },
      });
      if (!assertion) throw new Error('Passkey was not selected');
      const response = assertionJson(assertion);
      const logged = await api('/local/login', 'POST', { credentialId, challenge, response });
      csrf = logged.csrf;
      ui.form.hidden = false;
      renderDraftPreview();
      acceptSavedDraft();
      ui.logout.hidden = false;
      ui.refresh.hidden = false;
      ui.search.hidden = false;
      ui.devices.hidden = false;
      await refresh();
      await refreshDevices();
      message('Authenticated with a LOCAL test passkey');
    } catch (error) {
      message(error instanceof Error ? error.message : 'Local test login failed');
    } finally { ui.login.disabled = false; }
  });
  ui.refresh.addEventListener('click', () => refresh().catch(() => message('Could not refresh local drafts')));
  ui.history.addEventListener('click', async () => {
    const id = ui.draftId.value;
    if (!id) return;
    try {
      const { revisions } = await api('/local/articles/' + encodeURIComponent(id) + '/revisions');
      ui.historyList.replaceChildren();
      for (const revision of revisions) {
        const item = document.createElement('li');
        item.textContent = 'Revision ' + revision.revision + ' · ' + revision.title;
        ui.historyList.append(item);
      }
      message('Read-only revision history loaded: ' + revisions.length + ' versions');
    } catch { message('Could not load revision history'); }
  });
  ui.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    ui.save.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(ui.form));
      const id = ui.draftId.value;
      const version = Number(ui.revision.value);
      const idempotencyKey = encode(crypto.getRandomValues(new Uint8Array(24)));
      const result = await api(id ? '/local/articles/' + encodeURIComponent(id) : '/local/articles',
        id ? 'PATCH' : 'POST',
        { ...data, idempotencyKey, ...(id ? { expectedRevision: version } : {}) });
      ui.draftId.value = result.id;
      ui.revision.value = String(result.revision);
      ui.save.textContent = 'Save new revision';
      acceptSavedDraft();
      await refresh();
      message('Saved LOCAL draft revision ' + result.revision + '; not published');
    } catch { message('Save rejected; reload draft to resolve possible revision conflict'); }
    finally { ui.save.disabled = false; }
  });
  document.getElementById('new-draft').addEventListener('click', () => {
    if (!confirmDraftDiscard()) return;
    ui.form.reset(); ui.draftId.value = ''; ui.revision.value = '0';
    ui.history.hidden = true;
    ui.historyList.replaceChildren();
    ui.save.textContent = 'Create draft'; renderDraftPreview(); acceptSavedDraft(); message('New unsaved local draft');
  });
  ui.bootstrap.addEventListener('click', async () => {
    ui.bootstrap.disabled = true;
    try {
      const ticket = ui.ticket.value.trim();
      if (!ticket) throw new Error('An operator ticket is required');
      const { challenge, rpId } = await api('/local/bootstrap/challenge', 'POST', { ticket });
      const response = await createPasskey(challenge, rpId);
      const claimed = await api('/local/bootstrap/claim', 'POST', { ticket, challenge, response });
      if (claimed.claimed) {
        ui.id.value = response.id;
        message('First passkey registered locally. Sign in to continue.');
      }
    } catch (error) { message(error instanceof Error ? error.message : 'Local bootstrap failed'); }
    finally { ui.bootstrap.disabled = false; }
  });
  async function enrollDevice(kind, label) {
    const { challenge, rpId } = await api('/local/enroll/challenge', 'POST', { kind });
    const response = await createPasskey(challenge, rpId);
    const result = await api('/local/enroll/claim', 'POST', { challenge, response });
    ui.deviceId.value = result.credentialId;
    message(label + ' registered locally (' + result.deviceKind + ').');
    try {
      await refreshDevices();
    } catch (error) {
      if (error && error.status === 401) {
        clearLocalSession();
        message(label + ' registered. The rotation ended this session; sign in again.');
        return;
      }
      throw error;
    }
  }
  ui.enrollRecovery.addEventListener('click', async () => {
    ui.enrollRecovery.disabled = true;
    try { await enrollDevice('recovery', 'Recovery passkey'); }
    catch (error) { message(error instanceof Error ? error.message : 'Recovery enrollment failed'); }
    finally { ui.enrollRecovery.disabled = false; }
  });
  ui.enrollPrimary.addEventListener('click', async () => {
    ui.enrollPrimary.disabled = true;
    try { await enrollDevice('primary', 'Primary passkey'); }
    catch (error) {
      message(error && error.status === 403
        ? 'Recovery authorization required before replacing a lost primary'
        : error instanceof Error ? error.message : 'Primary enrollment failed');
    } finally { ui.enrollPrimary.disabled = false; }
  });
  ui.authorizeRecovery.addEventListener('click', async () => {
    ui.authorizeRecovery.disabled = true;
    try {
      const credentialId = ui.id.value.trim();
      const { challenge, rpId } = await api('/local/recovery/challenge', 'POST', {});
      const assertion = await navigator.credentials.get({ publicKey: {
        challenge: Uint8Array.from(challenge.match(/.{2}/g), x => parseInt(x, 16)),
        rpId, allowCredentials: [{ type: 'public-key', id: decode(credentialId) }],
        userVerification: 'required', timeout: 60000,
      } });
      if (!assertion) throw new Error('Passkey was not selected');
      await api('/local/recovery/complete', 'POST',
        { challenge, credentialId, response: assertionJson(assertion) });
      message('Recovery authorized for one primary replacement');
    } catch (error) {
      message(error && error.status === 403
        ? 'Recovery authorization requires signing in with the recovery passkey'
        : error instanceof Error ? error.message : 'Recovery authorization failed');
    } finally { ui.authorizeRecovery.disabled = false; }
  });
  ui.revokeDevice.addEventListener('click', async () => {
    ui.revokeDevice.disabled = true;
    try {
      const credentialId = ui.deviceId.value.trim();
      await api('/local/credentials/revoke', 'POST', { credentialId });
      message('Device revoked locally');
      await refreshDevices();
    } catch (error) { message(error instanceof Error ? error.message : 'Device revocation failed'); }
    finally { ui.revokeDevice.disabled = false; }
  });
  ui.emergency.addEventListener('click', async () => {
    ui.emergency.disabled = true;
    try {
      const token = ui.emergencyToken.value.trim();
      const response = await createPasskey(token, location.hostname);
      await api('/local/emergency/claim', 'POST', { token, response });
      clearLocalSession();
      ui.id.value = response.id;
      message('Emergency recovery complete. Sign in with the new primary passkey.');
    } catch (error) { message(error instanceof Error ? error.message : 'Emergency recovery failed'); }
    finally { ui.emergency.disabled = false; }
  });
  ui.logout.addEventListener('click', async () => {
    ui.logout.disabled = true;
    try {
      await api('/local/logout', 'POST', {});
      clearLocalSession();
      message('Local test session ended');
    } catch {
      // Always remove private DOM/unsaved state even if the server refuses logout.
      // HttpOnly cookies cannot be cleared by JS; do not claim server revocation.
      clearLocalSession();
      message('Logout not confirmed. Browser editor cleared; server session may remain active. Close this disposable browser or sign in again.');
    } finally { ui.logout.disabled = false; }
  });
`;

export function renderLocalCmsUi(nonce) {
  if (typeof nonce !== 'string' || !/^[0-9a-f]{64}$/.test(nonce)) {
    throw new TypeError('Local UI requires a fresh 256-bit CSP nonce');
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>CoinBlink · Local CMS Test Workspace</title>
<style nonce="${nonce}">
:root{color-scheme:dark;font-family:system-ui,sans-serif}
body{margin:0;background:#0d1815;color:#eaf3e8;line-height:1.5}
main{max-width:980px;margin:auto;padding:28px 18px}
h1{font-size:1.7rem;margin:0}h2{font-size:1.2rem}
p{color:#b9c8bd}.banner{background:#222f26;border:1px solid #536b4c;padding:12px;margin:18px 0}
fieldset{border:1px solid #536b4c;border-radius:9px;padding:18px;margin:16px 0}
label{display:block;margin:12px 0;font-weight:600}
input,textarea{display:block;width:100%;box-sizing:border-box;margin-top:5px;background:#13211a;border:1px solid #768977;border-radius:5px;padding:10px;color:#fff;font:inherit}
textarea{min-height:145px}
button{background:#bde874;color:#14210d;border:0;border-radius:5px;padding:10px 15px;margin:5px 5px 5px 0;cursor:pointer;font:inherit}
button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid #f7f6a5}
button:disabled{opacity:.45}
ul{padding-left:20px}li{margin:6px 0}
.draft-preview{margin-top:18px;padding:14px;border:1px solid #768977;border-radius:9px;background:#172820}
.draft-preview p{white-space:pre-wrap;overflow-wrap:anywhere}
footer{padding:24px 0;color:#b9c8bd}
</style>
</head><body>
<main>
<h1>CoinBlink · Local CMS Test Workspace</h1>
<p class="banner" role="note">LOCAL TEST ONLY. Bootstrap, devices, recovery and drafts are synthetic and stored only in a disposable LOCAL D1. No real Owner setup, publishing, cloud save, or production credentials.</p>
<fieldset id="bootstrap-panel"><legend>First Owner bootstrap (local test)</legend>
<label for="ticket">Offline operator ticket (one use)</label>
<input id="ticket" autocomplete="off" spellcheck="false" maxlength="64">
<button id="bootstrap" type="button">Create first passkey</button>
</fieldset>
<fieldset><legend>Test passkey sign-in</legend>
<label for="credential">Local test credential ID (base64url)</label>
<input id="credential" autocomplete="off" spellcheck="false" maxlength="256" required>
<button id="login" type="button">Sign in with test passkey</button>
<button id="logout" type="button" hidden>Sign out</button>
<p id="session-status">Not authenticated</p>
</fieldset>
<fieldset id="devices" hidden><legend>Test devices and recovery</legend>
<button id="enroll-recovery" type="button">Add recovery passkey</button>
<button id="enroll-primary" type="button">Add replacement primary passkey</button>
<button id="authorize-recovery" type="button">Authorize recovery with this passkey</button>
<label for="device-id">Device credential ID</label>
<input id="device-id" autocomplete="off" spellcheck="false" maxlength="256">
<button id="revoke-device" type="button">Revoke device</button>
<ul id="device-list" aria-label="Owner devices"></ul>
<p><a id="workspace-link" href="/local/workspace">Open the protected local workspace page</a></p>
</fieldset>
<fieldset id="emergency-panel"><legend>Emergency recovery (both devices lost)</legend>
<label for="emergency-token">Offline operator authorization token</label>
<input id="emergency-token" autocomplete="off" spellcheck="false" maxlength="64">
<button id="emergency" type="button">Recover with emergency authorization</button>
</fieldset>
<p id="message" role="status" aria-live="polite">Only disposable local data is permitted.</p>
<section aria-label="Draft editor">
<h2>Drafts</h2><button id="refresh" type="button" hidden>Refresh drafts</button>
<label for="draft-search">Filter local drafts by headline
<input id="draft-search" type="search" maxlength="100" autocomplete="off" placeholder="Search local draft titles" hidden></label>
<ul id="items" aria-label="Saved local drafts"></ul>
<form id="draft" hidden>
<fieldset><legend>Create or revise a local draft</legend>
<input id="draft-id" name="draftId" type="hidden"><input id="revision" type="hidden" value="0">
<label>Headline<input name="title" minlength="8" maxlength="140" required></label>
<label>Summary<textarea name="summary" minlength="20" maxlength="400" required></textarea></label>
<label>Article body<textarea name="body" maxlength="40000" required></textarea></label>
<label>HTTPS original source<input name="sourceUrl" type="url" maxlength="500" required></label>
<label>Author credit<input name="authorLabel" maxlength="80"></label>
<button id="save" type="submit">Create draft</button>
<button id="new-draft" type="button">New draft</button>
<p id="unsaved-draft-status" role="status" aria-live="polite" hidden>Unsaved changes in this LOCAL draft.</p>
<button id="history" type="button" hidden>View revision history</button>
<ul id="history-list" aria-label="Read-only draft revision history"></ul>
<section id="draft-preview" class="draft-preview" aria-labelledby="draft-preview-label" hidden>
<h3 id="draft-preview-label">Private draft preview · LOCAL only, not published</h3>
<h4 id="draft-preview-title"></h4>
<p id="draft-preview-summary"></p>
<p id="draft-preview-body"></p>
<p id="draft-preview-source"></p>
</section>
</fieldset></form></section>
<footer>Test data only · no publication capability · server-side authorization required on every request.</footer>
</main>
<script nonce="${nonce}" type="module">${LOCAL_CMS_UI_SCRIPT}</script>
</body></html>`;
}
