// CB-M02 local-only filter. DOM-only, no storage, fetch, navigation or publication.
// Fold accents consistently across EN and PT-BR so unaccented search matches localized labels.
const normalizeSearch = value => value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLocaleLowerCase("en");
for (const root of globalThis.document.querySelectorAll("[data-m02-root]")) {
  const search = root.querySelector("[data-m02-search]");
  const category = root.querySelector("[data-m02-category-select]");
  const reset = root.querySelector("[data-m02-reset]");
  const count = root.querySelector("[data-m02-result-count]");
  const empty = root.querySelector("[data-m02-empty]");
  const entries = [...root.querySelectorAll("[data-m02-entry]")];
  const filter = () => {
    const query = normalizeSearch(search.value.trim());
    let visible = 0;
    for (const article of entries) {
      const match = (category.value === "all" || article.dataset.m02Category === category.value)
        && normalizeSearch(article.dataset.m02Searchable).includes(query);
      article.hidden = !match;
      if (match) visible += 1;
    }
    count.textContent = visible + " " + count.dataset.m02CountLabel;
    empty.hidden = visible !== 0;
  };
  search.addEventListener("input", filter);
  category.addEventListener("change", filter);
  reset.addEventListener("click", () => {
    search.value = "";
    category.value = "all";
    filter();
    search.focus();
  });
}
