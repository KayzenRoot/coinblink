/* global document, window */
// Two locally chosen M05 exports: comparison only, not an authoritative corrections ledger.
import { parseLocalArticlePreview } from "./m02-local-article-preview.js";

const FIELDS = Object.freeze(["title", "author", "summary", "body", "source"]);
const LIMITS = Object.freeze({ title: 140, author: 80, summary: 400, body: 12000, source: 500 });
export const LOCAL_REVISION_STATUS = "LOCAL_EXPORT_COMPARISON_ONLY_NOT_PUBLISHED";
const excerpt = value => value.length > 140 ? value.slice(0, 140) + "…" : value;

export function compareLocalDraftExports(before, after) {
  for (const draft of [before, after]) {
    if (!draft || typeof draft !== "object" || draft.ready !== true ||
        FIELDS.some(key => typeof draft[key] !== "string" || draft[key].length > LIMITS[key])) {
      throw new TypeError("Expected two validated local M05 exports");
    }
  }
  const changes = FIELDS.filter(key => before[key] !== after[key]).map(key => Object.freeze({
    field: key,
    beforeExcerpt: excerpt(before[key]),
    afterExcerpt: excerpt(after[key]),
    beforeLength: before[key].length,
    afterLength: after[key].length,
  }));
  return Object.freeze({
    status: LOCAL_REVISION_STATUS,
    changedCount: changes.length,
    identicalContents: changes.length === 0,
    changes: Object.freeze(changes),
  });
}

const root = typeof document === "undefined" ? null : document.querySelector("[data-m02-revision-compare]");
if (root) {
  const pt = root.dataset.locale === "pt-br";
  const inputs = {
    before: root.querySelector("[data-m02-compare-before]"),
    after: root.querySelector("[data-m02-compare-after]"),
  };
  const output = root.querySelector("[data-m02-compare-result]");
  const status = root.querySelector("[data-m02-compare-status]");
  const count = root.querySelector("[data-m02-compare-count]");
  const rows = root.querySelector("[data-m02-compare-changes]");
  const clear = root.querySelector("[data-m02-compare-clear]");
  const drafts = { before: null, after: null };
  const generations = { before: 0, after: 0 };
  const labels = pt
    ? { title: "Título", author: "Autoria", summary: "Resumo", body: "Texto", source: "Fonte" }
    : { title: "Headline", author: "Author", summary: "Summary", body: "Article text", source: "Source" };
  const empty = pt ? "Selecione as duas exportações para comparar." : "Choose both exports to compare.";

  function scrubResult() {
    output.hidden = true;
    count.textContent = "";
    rows.replaceChildren();
  }
  function clearAll() {
    ++generations.before;
    ++generations.after;
    drafts.before = null;
    drafts.after = null;
    inputs.before.value = "";
    inputs.after.value = "";
    scrubResult();
    status.textContent = empty;
  }
  function displayIfReady() {
    scrubResult();
    if (!drafts.before || !drafts.after) {
      status.textContent = pt ? "Uma exportação carregada. Selecione a outra."
        : "One export loaded. Choose the other.";
      return;
    }
    const result = compareLocalDraftExports(drafts.before, drafts.after);
    count.textContent = result.identicalContents
      ? (pt ? "Nenhuma diferença encontrada nos cinco campos. A identidade histórica NÃO foi comprovada."
        : "No differences in five fields. Historical identity is NOT verified.")
      : (pt ? String(result.changedCount) + " campo(s) alterado(s) entre as duas exportações locais."
        : String(result.changedCount) + " field(s) changed between two local exports.");
    for (const change of result.changes) {
      const li = document.createElement("li");
      const name = document.createElement("strong");
      name.textContent = labels[change.field];
      const previous = document.createElement("p");
      const next = document.createElement("p");
      previous.textContent = (pt ? "Antes (trecho): " : "Before (excerpt): ")
        + (change.beforeExcerpt || (pt ? "(vazio)" : "(empty)"));
      next.textContent = (pt ? "Depois (trecho): " : "After (excerpt): ")
        + (change.afterExcerpt || (pt ? "(vazio)" : "(empty)"));
      li.append(name, previous, next);
      rows.append(li);
    }
    output.hidden = false;
    status.textContent = pt
      ? "Comparação local pronta. Sem verificação, histórico oficial ou publicação."
      : "Local comparison ready. No verification, official history or publication.";
  }

  for (const key of ["before", "after"]) {
    inputs[key].addEventListener("change", async () => {
      const file = inputs[key].files?.[0];
      const ticket = ++generations[key];
      inputs[key].value = "";
      drafts[key] = null;
      scrubResult();
      if (!file) {
        status.textContent = empty;
        return;
      }
      try {
        if (file.size < 1 || file.size > 64000 || !file.name.toLowerCase().endsWith(".md")) {
          throw new TypeError("Invalid local file metadata");
        }
        const raw = await file.text();
        if (ticket !== generations[key] || !root.isConnected) return;
        drafts[key] = parseLocalArticlePreview(file.name, file.size, raw);
        displayIfReady();
      } catch {
        if (ticket !== generations[key] || !root.isConnected) return;
        status.textContent = pt
          ? "Exportação inválida ou grande demais. A comparação anterior foi apagada."
          : "Invalid or oversized export. Previous comparison was cleared.";
      }
    });
  }
  clear.addEventListener("click", () => {
    clearAll();
    inputs.before.focus();
  });
  window.addEventListener("pagehide", clearAll);
  window.addEventListener("pageshow", event => { if (event.persisted) clearAll(); });
  clearAll();
}
