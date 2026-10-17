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
    status: document.getElementById('session-status'),
    revision: document.getElementById('revision'),
    draftId: document.getElementById('draft-id'),
    save: document.getElementById('save'),
    history: document.getElementById('history'),
    historyList: document.getElementById('history-list'),
  };
  let csrf = null;
  let lastDrafts = [];
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
  function clearLocalSession() {
    csrf = null;
    ui.form.reset();
    ui.draftId.value = '';
    ui.revision.value = '0';
    ui.save.textContent = 'Create draft';
    ui.form.hidden = true;
    ui.logout.hidden = true;
    ui.refresh.hidden = true;
    ui.history.hidden = true;
    ui.historyList.replaceChildren();
    ui.items.replaceChildren();
    lastDrafts = [];
    ui.search.value = '';
    ui.search.hidden = true;
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
      if (response.status === 401 && url.startsWith('/local/articles')) {
        clearLocalSession();
      }
      throw new Error('Local request rejected (' + response.status + ')');
    }
    return data;
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
      const response = {
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
      const logged = await api('/local/login', 'POST', { credentialId, challenge, response });
      csrf = logged.csrf;
      ui.form.hidden = false;
      ui.logout.hidden = false;
      ui.refresh.hidden = false;
      ui.search.hidden = false;
      await refresh();
      message('Authenticated with a pre-enrolled LOCAL test credential');
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
      await refresh();
      message('Saved LOCAL draft revision ' + result.revision + '; not published');
    } catch { message('Save rejected; reload draft to resolve possible revision conflict'); }
    finally { ui.save.disabled = false; }
  });
  document.getElementById('new-draft').addEventListener('click', () => {
    ui.form.reset(); ui.draftId.value = ''; ui.revision.value = '0';
    ui.history.hidden = true;
    ui.historyList.replaceChildren();
    ui.save.textContent = 'Create draft'; message('New unsaved local draft');
  });
  ui.logout.addEventListener('click', async () => {
    ui.logout.disabled = true;
    try {
      await api('/local/logout', 'POST', {});
      clearLocalSession();
      message('Local test session ended');
    } catch {
      // HttpOnly cookies cannot be cleared by JS: never falsely claim server revocation.
      message('Logout not confirmed. Session may remain active; retry sign out or close this disposable browser.');
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
footer{padding:24px 0;color:#b9c8bd}
</style>
</head><body>
<main>
<h1>CoinBlink · Local CMS Test Workspace</h1>
<p class="banner" role="note">LOCAL TEST ONLY. Uses an already enrolled disposable test passkey. No real Owner setup, publishing, cloud save, or production credentials.</p>
<fieldset><legend>Test passkey sign-in</legend>
<label for="credential">Pre-enrolled local test credential ID (base64url)</label>
<input id="credential" autocomplete="off" spellcheck="false" maxlength="256" required>
<button id="login" type="button">Sign in with test passkey</button>
<button id="logout" type="button" hidden>Sign out</button>
<p id="session-status">Not authenticated</p>
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
<button id="history" type="button" hidden>View revision history</button>
<ul id="history-list" aria-label="Read-only draft revision history"></ul>
</fieldset></form></section>
<footer>Test data only · no publication capability · server-side authorization required on every request.</footer>
</main>
<script nonce="${nonce}" type="module">${LOCAL_CMS_UI_SCRIPT}</script>
</body></html>`;
}
