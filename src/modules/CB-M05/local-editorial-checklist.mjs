/* global document, MutationObserver */
// M05 P0 editorial review checklist: in-memory only, no networking, storage, or publishing.
// Completed checks are self-reported workflow preparation, NOT legal or factual verification.
const LIMITS = Object.freeze({ title: 8, summary: 20, body: 40 });

function validHttpsSource(candidate) {
  if (typeof candidate !== "string" || !candidate || candidate.length > 500 || /\s/u.test(candidate)) return false;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && !url.username && !url.password
      && url.hostname.includes(".") && !url.hostname.endsWith(".");
  } catch {
    return false;
  }
}

/**
 * @param {{ title?: unknown, summary?: unknown, body?: unknown, source?: unknown }} draft
 * @param {{ factReview?: boolean, sourceAttribution?: boolean, ownerPacket?: boolean }} [manual]
 */
export function evaluateLocalEditorialChecklist(draft, manual = {}) {
  const value = (key) => typeof draft?.[key] === "string" ? draft[key].trim() : "";
  const items = [
    { id: "title", label: "Headline drafted (8+ characters)", done: value("title").length >= LIMITS.title },
    { id: "summary", label: "Summary drafted (20+ characters)", done: value("summary").length >= LIMITS.summary },
    { id: "body", label: "Article body drafted (40+ characters)", done: value("body").length >= LIMITS.body },
    { id: "source", label: "Original source URL format is HTTPS (not independently verified)", done: validHttpsSource(value("source")) },
    { id: "factReview", label: "I noted claims that require independent fact checking", done: manual.factReview === true },
    { id: "sourceAttribution", label: "I noted the original source and attribution in the draft", done: manual.sourceAttribution === true },
    { id: "ownerPacket", label: "I prepared this working draft for a future owner review", done: manual.ownerPacket === true },
  ];
  const completed = items.filter((item) => item.done).length;
  return Object.freeze({
    completed, total: items.length,
    // A high score cannot grant publication or certify accuracy / rights / approval.
    status: "LOCAL_PREPARATION_ONLY_NOT_VERIFIED_OR_APPROVED",
    items: Object.freeze(items.map((item) => Object.freeze(item))),
  });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-m05-local-editor]");
  const panel = document.querySelector("[data-m05-editorial-checklist]");
  const fields = {
    title: root?.querySelector("[data-m05-draft-title]"),
    summary: root?.querySelector("[data-m05-draft-summary]"),
    body: root?.querySelector("[data-m05-draft-body]"),
    source: root?.querySelector("[data-m05-draft-source]"),
  };
  const manual = {
    factReview: panel?.querySelector("[data-m05-editorial-fact-review]"),
    sourceAttribution: panel?.querySelector("[data-m05-editorial-source-attribution]"),
    ownerPacket: panel?.querySelector("[data-m05-editorial-owner-packet]"),
  };
  const score = panel?.querySelector("[data-m05-editorial-score]");
  const findings = panel?.querySelector("[data-m05-editorial-findings]");
  const note = panel?.querySelector("[data-m05-editorial-note]");
  if (panel && score && findings && note && Object.values(fields).every(Boolean)
      && Object.values(manual).every(Boolean)) {
    const update = () => {
      const data = Object.fromEntries(Object.entries(fields).map(([name, field]) => [name, field.value]));
      const flags = Object.fromEntries(Object.entries(manual).map(([name, input]) => [name, input.checked]));
      const result = evaluateLocalEditorialChecklist(data, flags);
      score.textContent = String(result.completed) + " / " + String(result.total);
      findings.replaceChildren();
      for (const item of result.items) {
        const line = document.createElement("li");
        line.textContent = (item.done ? "Done (self-reported): " : "To review: ") + item.label;
        findings.append(line);
      }
      note.textContent = result.completed === result.total
        ? "Checklist filled locally. Accuracy, source attribution, owner approval and publication are NOT independently verified."
        : "This is a local drafting checklist. Incomplete items require editorial attention.";
    };
    const clearManual = () => {
      for (const input of Object.values(manual)) input.checked = false;
      update();
    };
    Object.values(fields).forEach((input) => input.addEventListener("input", clearManual));
    Object.values(manual).forEach((input) => input.addEventListener("change", update));
    // The existing imported Markdown changes preview DOM instead of firing input events.
    // Clear attestations after any imported draft changes; no stored state crosses drafts.
    const preview = root.querySelector("[data-m05-preview-body]");
    if (preview && typeof MutationObserver !== "undefined") {
      new MutationObserver(clearManual).observe(preview, { childList: true, characterData: true, subtree: true });
    }
    update();
  }
}
