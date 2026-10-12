/* global document, window */
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

const isPortuguese = document.querySelector(".cb-home")?.getAttribute("data-locale") === "pt-br";
const localizedCategories = {
  All: "Todas",
  Regulation: "Regulação",
};
const displayCategory = (id) => isPortuguese ? (localizedCategories[id] ?? id) : id;
const placeholderCount = (n) => isPortuguese
  ? String(n) + (n === 1 ? " exemplo" : " exemplos")
  : String(n) + (n === 1 ? " placeholder" : " placeholders");

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
const allowedCategories = new Set(buttons.map((button) => button.getAttribute("data-category")));
const MAX_QUERY_LENGTH = 80;
const languageSwitch = document.querySelector("[data-language-switch]");
const shareButton = document.querySelector("[data-copy-filter-link]");
const shareStatus = document.querySelector("[data-share-status]");
const manualShare = document.querySelector("[data-share-manual]");
const shareURLInput = document.querySelector("[data-share-url]");
// Never reflect arbitrary fragments into href attributes: only constant anchors
// that exist in the local document are permitted in share/language URLs.
function validatedSectionHash() {
  switch (window.location.hash) {
    case "#top": return "#top";
    case "#main": return "#main";
    case "#market-overview": return "#market-overview";
    case "#radar-24h": return "#radar-24h";
    case "#categories": return "#categories";
    case "#latest-news": return "#latest-news";
    case "#learn": return "#learn";
    case "#official-sources": return "#official-sources";
    case "#chain-lookup": return "#chain-lookup";
    case "#newsletter": return "#newsletter";
    case "#demo-data": return "#demo-data";
    case "#footer": return "#footer";
    default: return "";
  }
}

function buildViewURL(pathname = isPortuguese ? "/pt-br" : "/en") {
  // Only our two first-party routes may become link targets.
  // Never derive a destination path or origin from untrusted URL parameters.
  const safePath = pathname === "/pt-br" ? "/pt-br" : "/en";
  const view = new URL(safePath, window.location.origin);
  if (selected !== "All" && allowedCategories.has(selected)) {
    view.searchParams.set("category", selected);
  }
  const query = searchText.trim().slice(0, MAX_QUERY_LENGTH);
  if (query) view.searchParams.set("q", query);
  view.hash = validatedSectionHash();
  return view;
}

function updateLanguageSwitch() {
  if (!languageSwitch) return;
  const url = buildViewURL(isPortuguese ? "/en" : "/pt-br");
  languageSwitch.setAttribute("href", url.pathname + url.search + url.hash);
}

function showManualShare(url) {
  if (manualShare && shareURLInput) {
    manualShare.hidden = false;
    shareURLInput.value = url;
    shareURLInput.focus();
    shareURLInput.select();
  }
  if (shareStatus) shareStatus.textContent = isPortuguese
    ? "Cópia automática indisponível. Selecione e copie o link abaixo."
    : "Automatic copying is unavailable. Select and copy the link below.";
}

// Keep the demonstration view reproducible through a URL, without cookies,
// remote requests, browser storage or untrusted category values.
function readFilterURL() {
  const params = new URL(window.location.href).searchParams;
  const category = params.get("category");
  return {
    category: allowedCategories.has(category) ? category : "All",
    query: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
  };
}

function writeFilterURL(mode = "push") {
  const next = buildViewURL();
  if (next.href !== window.location.href) {
    const action = mode === "replace" ? "replaceState" : "pushState";
    window.history[action](null, "", next.pathname + next.search + next.hash);
  }
  updateLanguageSwitch();
}

function restoreFilterURL() {
  const next = readFilterURL();
  selected = next.category;
  searchText = next.query;
  searches.forEach((input) => { input.value = searchText; });
  buttons.forEach((button) => {
    const active = button.getAttribute("data-category") === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  filterStories();
}


function filterStories() {
  updateLanguageSwitch();
  if (shareStatus) shareStatus.textContent = "";
  if (manualShare) manualShare.hidden = true;
  const query = searchText.trim().toLocaleLowerCase("en");
  let visible = 0;
  cards.forEach((card) => {
    const matchesCategory = selected === "All" || card.getAttribute("data-category-value") === selected;
    const searchableText = (card.getAttribute("data-category-value") ?? "") + " " + card.textContent;
    const matchesQuery = !query || searchableText.toLocaleLowerCase("en").includes(query);
    card.hidden = !(matchesCategory && matchesQuery);
    if (!card.hidden) visible += 1;
  });
  if (count) count.textContent = placeholderCount(visible);
  if (empty) empty.hidden = visible !== 0;
  const filtered = selected !== "All" || query !== "";
  if (clearButton) clearButton.hidden = !filtered;
  if (summary) {
    summary.textContent = isPortuguese
      ? (filtered
        ? "Exibindo " + placeholderCount(visible) +
          (selected === "All" ? "" : " em " + displayCategory(selected)) +
          (query ? " correspondentes à busca." : ".")
        : "Exibindo todos os exemplos.")
      : (filtered
        ? "Showing " + visible + " demo placeholder" + (visible === 1 ? "" : "s") +
          (selected === "All" ? "" : " in " + selected) +
          (query ? " matching your search." : ".")
        : "Showing all demo placeholders.");
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
  writeFilterURL();
}

buttons.forEach((button) => button.addEventListener("click", () => {
  selectCategory(button.getAttribute("data-category") ?? "All");
  writeFilterURL();
  document.getElementById("latest-news")?.scrollIntoView({ block: "start" });
}));

searches.forEach((search) => search.addEventListener("input", () => {
  searchText = search.value;
  searches.forEach((other) => {
    if (other !== search) other.value = searchText;
  });
  filterStories();
  writeFilterURL("replace");
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

window.addEventListener("popstate", restoreFilterURL);
window.addEventListener("hashchange", updateLanguageSwitch);
restoreFilterURL();

shareButton?.addEventListener("click", async () => {
  const url = buildViewURL().href;
  if (!window.navigator.clipboard?.writeText) {
    showManualShare(url);
    return;
  }
  try {
    await window.navigator.clipboard.writeText(url);
    if (manualShare) manualShare.hidden = true;
    if (shareStatus) shareStatus.textContent = isPortuguese
      ? "Link da seleção copiado."
      : "View link copied.";
  } catch {
    showManualShare(url);
  }
});

document.querySelector("[data-demo-preview]")?.addEventListener("click", () => {
  const status = document.querySelector("[data-form-status]");
  if (status) status.textContent = isPortuguese
    ? "Apenas prévia. Nenhum e-mail foi enviado ou armazenado."
    : "Preview only. No email was sent or stored.";
});
