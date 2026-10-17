// M03 browser-only filtering; no HTTP, storage, queue or credential access.
for (const root of globalThis.document.querySelectorAll("[data-m03-root]")) {
  const input = root.querySelector("[data-m03-search]");
  const entries = [...root.querySelectorAll("[data-m03-entry]")];
  const count = root.querySelector("[data-m03-count]");
  const empty = root.querySelector("[data-m03-empty]");
  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    let shown = 0;
    for (const entry of entries) {
      entry.hidden = !entry.dataset.m03Searchable.includes(term);
      if (!entry.hidden) shown += 1;
    }
    count.textContent = shown + " invented sources, none licensed";
    empty.hidden = shown > 0;
  });
}
