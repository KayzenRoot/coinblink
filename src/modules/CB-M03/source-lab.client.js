// Strictly local DOM filtering. No fetch, stateful storage, network, or privileged routes.
const root = document.querySelector("[data-m03-root]");
if (root) {
  const query = root.querySelector("[data-m03-query]");
  const count = root.querySelector("[data-m03-count]");
  const empty = root.querySelector("[data-m03-empty]");
  const rows = [...root.querySelectorAll("[data-m03-entry]")];
  query.addEventListener("input", () => {
    const value = query.value.trim().toLowerCase();
    let visible = 0;
    for (const row of rows) {
      row.hidden = !row.dataset.m03Searchable.includes(value);
      if (!row.hidden) visible++;
    }
    count.textContent = visible + " synthetic source examples";
    empty.hidden = visible !== 0;
  });
}
