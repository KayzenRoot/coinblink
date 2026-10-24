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
  const gaps = root.querySelector("[data-m04-comparison-gaps]");
  // Compare server-rendered illustrative blockers, never provider values.
  const blockerNames = row => [...row.querySelectorAll(".m04-readiness-detail li")]
    .map(item => item.textContent.trim());
  const resetGaps = () => {
    gaps.hidden = true;
    gaps.textContent = "";
  };
  const selectionChanged = () => {
    resetGaps();
    result.textContent = "Selections changed. Compare again to inspect mock readiness.";
  };
  first.addEventListener("change", selectionChanged);
  second.addEventListener("change", selectionChanged);
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
    // Do not retain a mock comparison outside the filtered visible asset set.
    if (!gaps.hidden && (assets.get(first.value)?.hidden || assets.get(second.value)?.hidden)) {
      resetGaps();
      result.textContent = "A selected offline asset is hidden by current filters. Compare again.";
    }
  };
  search.addEventListener("input", filter);
  freshness.addEventListener("change", filter);
  compare.addEventListener("click", () => {
    resetGaps();
    const left = assets.get(first.value);
    const right = assets.get(second.value);
    if (!left || !right || left === right || left.hidden || right.hidden) {
      result.textContent = "Choose two different offline examples visible under current filters. No market data was fetched.";
      return;
    }
    result.textContent = left.dataset.m04Asset + " (" + left.dataset.m04Freshness +
      ") and " + right.dataset.m04Asset + " (" + right.dataset.m04Freshness +
      ") · BOTH NOT LIVE · NO QUOTES · NO TRADING";
    const leftBlockers = blockerNames(left);
    const rightBlockers = blockerNames(right);
    const leftSet = new Set(leftBlockers);
    const rightSet = new Set(rightBlockers);
    const shared = leftBlockers.filter(blocker => rightSet.has(blocker));
    const onlyLeft = leftBlockers.filter(blocker => !rightSet.has(blocker));
    const onlyRight = rightBlockers.filter(blocker => !leftSet.has(blocker));
    gaps.textContent = "Shared blockers: " + (shared.join(", ") || "none") +
      "\n" + left.dataset.m04Asset + " only: " + (onlyLeft.join(", ") || "none") +
      "\n" + right.dataset.m04Asset + " only: " + (onlyRight.join(", ") || "none") +
      "\nAll blockers are from offline examples; no prices, permission or trading advice.";
    gaps.hidden = false;
  });
}
