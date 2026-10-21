// Strictly local DOM filtering. No fetch, stateful storage, network, or privileged routes.
const root = document.querySelector("[data-m03-root]");
if (root) {
  const query = root.querySelector("[data-m03-query]");
  const outcome = root.querySelector("[data-m03-state-filter]");
  const count = root.querySelector("[data-m03-count]");
  const empty = root.querySelector("[data-m03-empty]");
  const rows = [...root.querySelectorAll("[data-m03-entry]")];
  const filter = () => {
    const value = query.value.trim().toLowerCase();
    let visible = 0;
    for (const row of rows) {
      const matchesText = row.dataset.m03Searchable.includes(value);
      const matchesOutcome = outcome.value === "all" || row.dataset.m03State === outcome.value;
      row.hidden = !(matchesText && matchesOutcome);
      if (!row.hidden) visible++;
    }
    count.textContent = visible + " synthetic source examples";
    empty.hidden = visible !== 0;
  };
  query.addEventListener("input", filter);
  outcome.addEventListener("change", filter);
}
