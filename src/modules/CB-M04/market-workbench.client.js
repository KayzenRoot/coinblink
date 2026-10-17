// M04 filter stays in the browser, no requests, storage or trading calls.
for (const root of globalThis.document.querySelectorAll("[data-m04-root]")) {
  const search = root.querySelector("[data-m04-search]");
  const cards = [...root.querySelectorAll("[data-m04-entry]")];
  const count = root.querySelector("[data-m04-count]");
  const empty = root.querySelector("[data-m04-empty]");
  search.addEventListener("input", () => {
    const term = search.value.trim().toUpperCase();
    let visible = 0;
    for (const card of cards) {
      card.hidden = !card.dataset.m04Searchable.includes(term);
      if (!card.hidden) visible += 1;
    }
    count.textContent = visible + " fictional, stale examples";
    empty.hidden = visible !== 0;
  });
}
