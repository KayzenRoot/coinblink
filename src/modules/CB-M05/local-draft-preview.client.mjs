/* global document, window */
import {
  MAX_MARKDOWN_BYTES,
  draftToMarkdown,
  parseLocalDraftMarkdown,
  prepareLocalDraft,
  safeDraftFilename,
} from './local-draft-markdown.mjs';

const root = document.querySelector('[data-m05-local-editor]');
if (root) {
  const fields = {
    title: root.querySelector('[data-m05-draft-title]'),
    author: root.querySelector('[data-m05-draft-author]'),
    summary: root.querySelector('[data-m05-draft-summary]'),
    body: root.querySelector('[data-m05-draft-body]'),
    source: root.querySelector('[data-m05-draft-source]'),
  };
  const preview = {
    title: root.querySelector('[data-m05-preview-title]'),
    author: root.querySelector('[data-m05-preview-author]'),
    summary: root.querySelector('[data-m05-preview-summary]'),
    body: root.querySelector('[data-m05-preview-body]'),
    source: root.querySelector('[data-m05-preview-source]'),
    status: root.querySelector('[data-m05-preview-status]'),
  };
  const importInput = root.querySelector('[data-m05-import]');
  const importStatus = root.querySelector('[data-m05-import-status]');
  const exportButton = root.querySelector('[data-m05-export]');
  const newDraftButton = root.querySelector('[data-m05-new]');
  const saveState = root.querySelector('[data-m05-save-state]');
  const hint = root.querySelector('[data-m05-draft-hint]');
  const snapshot = () => JSON.stringify(Object.values(fields).map(field => field.value));
  let lastExportedOrImported = snapshot();
  const hasUnexportedEdits = () => snapshot() !== lastExportedOrImported;
  const replaceFields = draft => {
    for (const [key, field] of Object.entries(fields)) {
      field.value = draft[key] ?? '';
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  const read = () => prepareLocalDraft(Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.value]),
  ));
  const refresh = () => {
    const draft = read();
    preview.title.textContent = draft.title || 'Untitled local draft';
    preview.author.textContent = draft.author || 'Unassigned author label';
    preview.summary.textContent = draft.summary || 'Summary preview';
    preview.body.textContent = draft.body || 'Draft body preview';
    preview.source.textContent = draft.source || 'No verified HTTPS source URL';
    preview.status.textContent = draft.ready
      ? 'Ready to export locally, NOT fact-checked or approved.'
      : 'Complete title, summary (20+), body (40+) and a valid HTTPS source URL to export.';
    hint.textContent = draft.ready ? 'Export creates a local file. No server receives your draft.' : '';
    exportButton.disabled = !draft.ready;
    newDraftButton.disabled = Object.values(fields).every(field => field.value === '');
    saveState.textContent = hasUnexportedEdits()
      ? 'Unexported changes. Export Markdown before leaving this page.'
      : 'No edits since last import or export request.';
  };
  Object.values(fields).forEach(field => field.addEventListener('input', refresh));
  window.addEventListener('beforeunload', event => {
    if (!hasUnexportedEdits()) return;
    event.preventDefault();
  });
  newDraftButton.addEventListener('click', () => {
    if (hasUnexportedEdits() && !window.confirm('Discard unexported changes and start a new local draft?')) return;
    replaceFields({ title: '', author: '', summary: '', body: '', source: '' });
    lastExportedOrImported = snapshot();
    importStatus.textContent = '';
    hint.textContent = 'New empty local draft. Nothing was stored or published.';
    refresh();
    fields.title.focus();
  });
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;
    if (!/\.md$/iu.test(file.name) || file.size > MAX_MARKDOWN_BYTES || file.size === 0) {
      importStatus.textContent = 'Choose a CoinBlink .md draft smaller than 64 KB.';
      return;
    }
    try {
      const restored = parseLocalDraftMarkdown(await file.text());
      if (hasUnexportedEdits() && !window.confirm('Replace unexported changes with the imported local draft?')) {
        importStatus.textContent = 'Import canceled. Your current unexported text was kept.';
        return;
      }
      replaceFields(restored);
      lastExportedOrImported = snapshot();
      refresh();
      importStatus.textContent = 'Draft restored from this file in your browser only. Nothing was uploaded.';
      fields.title.focus();
    } catch {
      importStatus.textContent = 'This file is not a valid CoinBlink working draft. Current text was kept.';
    }
  });
  exportButton.addEventListener('click', () => {
    const draft = read();
    if (!draft.ready) return;
    const file = new Blob([draftToMarkdown(draft)], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const download = document.createElement('a');
    download.href = url;
    download.download = safeDraftFilename(draft.title);
    document.body.append(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    lastExportedOrImported = snapshot();
    refresh();
    hint.textContent = 'Local Markdown export requested. Nothing was published or saved online.';
  });
  refresh();
}
