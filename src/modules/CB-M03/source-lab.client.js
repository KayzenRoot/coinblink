// Strictly local DOM filtering. No fetch, stateful storage, network, or privileged routes.
const root = document.querySelector("[data-m03-root]");
if (root) {
  const query = root.querySelector("[data-m03-query]");
  const outcome = root.querySelector("[data-m03-state-filter]");
  const count = root.querySelector("[data-m03-count]");
  const empty = root.querySelector("[data-m03-empty]");
  const rows = [...root.querySelectorAll("[data-m03-entry]")];
  const byId = new Map(rows.map(row => [row.dataset.m03Id, row]));
  const left = root.querySelector("[data-m03-left]");
  const right = root.querySelector("[data-m03-right]");
  const compare = root.querySelector("[data-m03-compare]");
  const comparison = root.querySelector("[data-m03-comparison]");
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
  compare.addEventListener("click", () => {
    const first = byId.get(left.value);
    const second = byId.get(right.value);
    if (!first || !second || first === second) {
      comparison.textContent = "Select two different fictional sources. No evidence was retrieved.";
      return;
    }
    const describe = item => item.querySelector("h2").textContent +
      " · " + item.dataset.m03State + " · licensing " + item.dataset.m03License;
    comparison.textContent = describe(first) + " | " + describe(second) +
      " · BOTH BLOCKED · NO INGESTION · NO PUBLICATION";
  });
}
