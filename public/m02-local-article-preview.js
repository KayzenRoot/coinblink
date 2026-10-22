/* global document, window */
// Browser-only M02 article preview. Reuse canonical M05 exported Markdown parser.
import { parseLocalDraftMarkdown } from "./m05-draft-preview.js";
export const MAX_LOCAL_ARTICLE_BYTES = 64000;
export function parseLocalArticlePreview(name, size, raw) {
  if (typeof name !== "string" || !/^[^/\\]+\.md$/iu.test(name) || /\p{Cc}/u.test(name) ||
      !Number.isSafeInteger(size) || size <= 0 || size > MAX_LOCAL_ARTICLE_BYTES ||
      typeof raw !== "string" || raw.length > MAX_LOCAL_ARTICLE_BYTES) {
    throw new TypeError("Invalid local CoinBlink Markdown");
  }
  return parseLocalDraftMarkdown(raw);
}
const root = typeof document === "undefined" ? null : document.querySelector("[data-m02-local-preview]");
if (root) {
  const pt = root.dataset.locale === "pt-br";
  const input = root.querySelector("[data-m02-draft-file]");
  const clear = root.querySelector("[data-m02-draft-clear]");
  const status = root.querySelector("[data-m02-draft-status]");
  const article = root.querySelector("[data-m02-draft-article]");
  const nodes = Object.fromEntries(["title", "author", "summary", "body", "source"].map(
    key => [key, root.querySelector("[data-m02-draft-" + key + "]")]));
  let generation = 0;
  const empty = pt ? "Nenhum rascunho carregado." : "No draft loaded.";
  const invalid = pt ? "Arquivo inválido. Escolha um rascunho CoinBlink .md até 64 KB."
    : "Invalid file. Choose a CoinBlink .md draft up to 64 KB.";
  function scrub(message) {
    for (const node of Object.values(nodes)) node.textContent = "";
    article.hidden = true;
    clear.hidden = true;
    status.textContent = message;
  }
  scrub(empty);
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    const request = ++generation;
    input.value = "";
    scrub(empty);
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith(".md") || file.size <= 0 || file.size > MAX_LOCAL_ARTICLE_BYTES) {
        throw new TypeError("Invalid file metadata");
      }
      const raw = await file.text();
      if (request !== generation || !root.isConnected) return;
      const draft = parseLocalArticlePreview(file.name, file.size, raw);
      // Inert text only: no Markdown-to-HTML conversion, links, network, storage or publication.
      for (const key of ["title", "summary", "body", "source"]) nodes[key].textContent = draft[key];
      nodes.author.textContent = draft.author || (pt ? "Autoria não informada" : "Author not provided");
      article.hidden = false;
      clear.hidden = false;
      status.textContent = pt ? "PRÉVIA LOCAL · NÃO VERIFICADA · NÃO PUBLICADA"
        : "LOCAL PREVIEW · UNVERIFIED · NOT PUBLISHED";
      nodes.title.focus();
    } catch {
      if (request === generation && root.isConnected) scrub(invalid);
    }
  });
  clear.addEventListener("click", () => {
    ++generation;
    input.value = "";
    scrub(pt ? "Prévia descartada." : "Preview cleared.");
    input.focus();
  });
  for (const event of ["pagehide", "pageshow"]) {
    window.addEventListener(event, e => {
      if (event === "pageshow" && !e.persisted) return;
      ++generation;
      input.value = "";
      scrub(empty);
    });
  }
}
