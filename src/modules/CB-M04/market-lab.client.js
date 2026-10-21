// Synthetic demonstration: filter pre-rendered DOM only, never request market data.
const root = document.querySelector("[data-m04-root]");
if (root) {
  const search = root.querySelector("[data-m04-query]");
  const freshness = root.querySelector("[data-m04-freshness]");
  const rows = [...root.querySelectorAll("[data-m04-entry]")];
  const status = root.querySelector("[data-m04-count]");
  const empty = root.querySelector("[data-m04-empty]");
  const filter = () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    for (const row of rows) {
      const matchesText = row.dataset.m04Searchable.includes(q);
      const matchesFreshness = freshness.value === "all" || row.dataset.m04Freshness === freshness.value;
      row.hidden = !(matchesText && matchesFreshness);
      if (!row.hidden) visible++;
    }
    status.textContent = visible + " unavailable example assets";
    empty.hidden = visible !== 0;
  };
  search.addEventListener("input", filter);
  freshness.addEventListener("change", filter);
}
