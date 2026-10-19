// Synthetic demonstration: filter pre-rendered DOM only, never request market data.
const root = document.querySelector("[data-m04-root]");
if (root) {
  const search = root.querySelector("[data-m04-query]");
  const rows = [...root.querySelectorAll("[data-m04-entry]")];
  const status = root.querySelector("[data-m04-count]");
  const empty = root.querySelector("[data-m04-empty]");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    for (const row of rows) {
      row.hidden = !row.dataset.m04Searchable.includes(q);
      if (!row.hidden) visible++;
    }
    status.textContent = visible + " unavailable example assets";
    empty.hidden = visible !== 0;
  });
}
