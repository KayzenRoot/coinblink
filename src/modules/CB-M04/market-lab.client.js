// Synthetic demonstration: filter pre-rendered DOM only, never request market data.
const root = document.querySelector("[data-m04-root]");
if (root) {
  const search = root.querySelector("[data-m04-query]");
  const freshness = root.querySelector("[data-m04-freshness]");
  const rows = [...root.querySelectorAll("[data-m04-entry]")];
  const status = root.querySelector("[data-m04-count]");
  const empty = root.querySelector("[data-m04-empty]");
  const first = root.querySelector("[data-m04-first]");
  const second = root.querySelector("[data-m04-second]");
  const compare = root.querySelector("[data-m04-compare]");
  const result = root.querySelector("[data-m04-comparison]");
  const assets = new Map(rows.map(row => [row.dataset.m04Asset, row]));
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
  compare.addEventListener("click", () => {
    const left = assets.get(first.value);
    const right = assets.get(second.value);
    if (!left || !right || left === right) {
      result.textContent = "Choose two different offline examples. No market data was fetched.";
      return;
    }
    result.textContent = left.dataset.m04Asset + " (" + left.dataset.m04Freshness +
      ") and " + right.dataset.m04Asset + " (" + right.dataset.m04Freshness +
      ") · BOTH NOT LIVE · NO QUOTES · NO TRADING";
  });
}
