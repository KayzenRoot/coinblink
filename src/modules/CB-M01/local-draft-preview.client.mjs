// Strictly local M01 reader preview for a never-published M05 Markdown export.
// No upload, fetch, persistence, live story ingestion, HTML insertion or URL navigation.
/* global document */
import { parseLocalDraftMarkdown } from "../CB-M05/local-draft-markdown.mjs";

const root = document.querySelector("[data-m01-local-draft-preview]");
if (root) {
  const pt = root.dataset.locale === "pt-br";
  const fileInput = root.querySelector("[data-m01-draft-file]");
  const status = root.querySelector("[data-m01-draft-status]");
  const clear = root.querySelector("[data-m01-draft-clear]");
  const result = root.querySelector("[data-m01-draft-result]");
  const title = root.querySelector("[data-m01-draft-title]");
  const author = root.querySelector("[data-m01-draft-author]");
  const summary = root.querySelector("[data-m01-draft-summary]");
  const body = root.querySelector("[data-m01-draft-body]");
  const source = root.querySelector("[data-m01-draft-source]");

  function resetPreview() {
    fileInput.value = "";
    for (const field of [title, author, summary, body, source]) field.textContent = "";
    result.hidden = true;
    clear.hidden = true;
    status.textContent = pt ? "Prévia limpa. Nenhum conteúdo foi salvo." : "Preview cleared. Nothing was saved.";
  }

  clear.addEventListener("click", resetPreview);
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    if (!/\.md$/iu.test(file.name) || file.size === 0 || file.size > 64000) {
      status.textContent = pt ? "Escolha um arquivo .md CoinBlink com até 64 KB. A prévia atual foi preservada."
        : "Choose a CoinBlink .md file up to 64 KB. The current preview was preserved.";
      return;
    }
    try {
      const draft = parseLocalDraftMarkdown(await file.text());
      // textContent, never innerHTML. Source URLs are displayed as inert text,
      // never fetched, followed or treated as fact-checked references.
      title.textContent = draft.title;
      author.textContent = draft.author;
      summary.textContent = draft.summary;
      body.textContent = draft.body;
      source.textContent = draft.source;
      result.hidden = false;
      clear.hidden = false;
      status.textContent = pt ? "Prévia gerada somente neste navegador. Nada foi enviado ou publicado."
        : "Preview generated in this browser only. Nothing uploaded or published.";
      title.focus();
    } catch {
      status.textContent = pt ? "Arquivo inválido ou incompatível. A prévia atual foi preservada."
        : "Invalid or incompatible CoinBlink draft. The current preview was preserved.";
    }
  });
}
