// CB-M02 local-only filter. DOM-only, no storage, fetch, navigation or publication.
for (const root of document.querySelectorAll("[data-m02-root]")) {
  const search = root.querySelector("[data-m02-search]");
  const category = root.querySelector("[data-m02-category]");
  const count = root.querySelector("[data-m02-result-count]");
  const empty = root.querySelector("[data-m02-empty]");
  const entries = [...root.querySelectorAll("[data-m02-entry]")];
  const filter = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const article of entries) {
      const match = (category.value === "all" || article.dataset.m02Category === category.value)
        && article.dataset.m02Searchable.includes(query);
      article.hidden = !match;
      if (match) visible += 1;
    }
    count.textContent = visible + " fictional examples";
    empty.hidden = visible !== 0;
  };
  search.addEventListener("input", filter);
  category.addEventListener("change", filter);
}
