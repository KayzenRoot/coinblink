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
  const details = root.querySelector("[data-m03-compare-details]");
  const checksFor = row => [...row.querySelectorAll("[data-m03-check-code]")]
    .map(check => ({ code: check.dataset.m03CheckCode, state: check.dataset.m03CheckState }));
  const clearComparison = () => {
    details.hidden = true;
    details.textContent = "";
  };
  const changedSelection = () => {
    clearComparison();
    comparison.textContent = "Selection changed. Compare again. Reuse is still blocked.";
  };
  left.addEventListener("change", changedSelection);
  right.addEventListener("change", changedSelection);
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
    clearComparison();
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
    const firstChecks = checksFor(first);
    const secondChecks = new Map(checksFor(second).map(check => [check.code, check.state]));
    const matching = firstChecks.filter(check => secondChecks.get(check.code) === check.state);
    const differing = firstChecks.filter(check => secondChecks.get(check.code) !== check.state);
    const listChecks = items => items.map(check => check.code + ": " + check.state).join(", ") || "none";
    const differentCheckText = differing.map(check => check.code + ": " + check.state +
      " vs " + (secondChecks.get(check.code) ?? "NOT_AVAILABLE")).join(", ") || "none";
    const inspection = first.dataset.m03State === second.dataset.m03State ? "same" : "different";
    const rights = first.dataset.m03License === second.dataset.m03License ? "same" : "different";
    details.textContent = "Matching fictional checks: " + listChecks(matching) +
      "\nDifferent fictional checks: " + differentCheckText +
      "\nInspection outcomes: " + inspection + " (" + first.dataset.m03State + " / " + second.dataset.m03State + ")" +
      "\nLicense labels: " + rights + " (" + first.dataset.m03License + " / " + second.dataset.m03License + ")" +
      "\nNeither record proves rights, capture, authenticity or permission to publish.";
    details.hidden = false;
  });
}
