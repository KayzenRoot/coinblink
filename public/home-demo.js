/* global document */
// CoinBlink M01: demonstration-only interactions. No network calls, storage or submission.
const menu = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-primary-nav]");

function closeMenu({ returnFocus = false } = {}) {
  if (!menu || menu.getAttribute("aria-expanded") !== "true") return;
  menu.setAttribute("aria-expanded", "false");
  nav?.classList.remove("is-open");
  if (returnFocus) menu.focus();
}

menu?.addEventListener("click", () => {
  const expanded = menu.getAttribute("aria-expanded") === "true";
  menu.setAttribute("aria-expanded", String(!expanded));
  nav?.classList.toggle("is-open", !expanded);
});
const navLinks = [...(nav?.querySelectorAll("a") ?? [])];
navLinks.forEach((link) => link.addEventListener("click", () => closeMenu()));
document.addEventListener("pointerdown", (event) => {
  if (menu?.contains(event.target) || nav?.contains(event.target)) return;
  closeMenu();
});

let selected = "All";
let searchText = "";
const buttons = [...document.querySelectorAll("[data-category]")];
const cards = [...document.querySelectorAll("[data-news-card]")];
const searches = [
  document.querySelector("[data-news-search]"),
  document.querySelector("[data-news-search-mobile]"),
].filter(Boolean);
const count = document.querySelector("[data-result-count]");
const summary = document.querySelector("[data-news-filter-summary]");
const empty = document.querySelector("[data-news-empty]");
const clearButton = document.querySelector("[data-clear-filters]");

function filterStories() {
  const query = searchText.trim().toLocaleLowerCase("en");
  let visible = 0;
  cards.forEach((card) => {
    const matchesCategory = selected === "All" || card.getAttribute("data-category-value") === selected;
    const searchableText = (card.getAttribute("data-category-value") ?? "") + " " + card.textContent;
    const matchesQuery = !query || searchableText.toLocaleLowerCase("en").includes(query);
    card.hidden = !(matchesCategory && matchesQuery);
    if (!card.hidden) visible += 1;
  });
  if (count) count.textContent = String(visible) + (visible === 1 ? " placeholder" : " placeholders");
  if (empty) empty.hidden = visible !== 0;
  const filtered = selected !== "All" || query !== "";
  if (clearButton) clearButton.hidden = !filtered;
  if (summary) {
    summary.textContent = filtered
      ? "Showing " + visible + " demo placeholder" + (visible === 1 ? "" : "s") +
        (selected === "All" ? "" : " in " + selected) +
        (query ? " matching your search." : ".")
      : "Showing all demo placeholders.";
  }
}

function selectCategory(value) {
  selected = value;
  buttons.forEach((button) => {
    const active = button.getAttribute("data-category") === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  filterStories();
}

function resetFilters() {
  searchText = "";
  searches.forEach((search) => { search.value = ""; });
  selectCategory("All");
}

buttons.forEach((button) => button.addEventListener("click", () => {
  selectCategory(button.getAttribute("data-category") ?? "All");
  document.getElementById("latest-news")?.scrollIntoView({ block: "start" });
}));

searches.forEach((search) => search.addEventListener("input", () => {
  searchText = search.value;
  searches.forEach((other) => {
    if (other !== search) other.value = searchText;
  });
  filterStories();
}));

clearButton?.addEventListener("click", resetFilters);
document.querySelector("[data-reset-filters]")?.addEventListener("click", () => {
  resetFilters();
  document.querySelector("[data-category='All']")?.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (menu?.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      closeMenu({ returnFocus: true });
      return;
    }
    if (searches.includes(document.activeElement) && searchText) {
      event.preventDefault();
      resetFilters();
    }
    return;
  }
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
  const active = document.activeElement;
  if (active?.matches("input, textarea, select") || active?.isContentEditable) return;
  const visibleSearch = searches.find((search) => search.getClientRects().length > 0);
  if (!visibleSearch) return;
  event.preventDefault();
  visibleSearch.focus();
});

document.querySelector("[data-demo-preview]")?.addEventListener("click", () => {
  const status = document.querySelector("[data-form-status]");
  if (status) status.textContent = "Preview only. No email was sent or stored.";
});
