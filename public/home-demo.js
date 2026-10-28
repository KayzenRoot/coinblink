/* global document, window */
// CoinBlink M01: demonstration-only interactions. No network calls, storage or submission.
const menu = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-primary-nav]");

// R25: switch from the original vector fallback only after the local Blender
// preview has decoded. A missing or corrupt asset leaves the existing demo art.
const cinematicImage = document.querySelector(".hero-cinematic-preview img");
const cinematicScene = cinematicImage?.closest(".hero-scene");
const revealCinematicPreview = () => {
  if (cinematicImage?.naturalWidth > 0) cinematicScene?.classList.add("has-cinematic-preview");
};
if (cinematicImage?.complete) revealCinematicPreview();
else cinematicImage?.addEventListener("load", revealCinematicPreview, { once: true });

function closeMenu({ returnFocus = false } = {}) {
  if (menu?.getAttribute("aria-expanded") !== "true") return;
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

// One row per message, one value per locale: a missing translation is visible
// in review and the table shape is written once.
const MESSAGE_ROWS = {
  searchLocale: ["en", "pt-BR", "es"],
  countOne: [" placeholder", " exemplo", " ejemplo"],
  countMany: [" placeholders", " exemplos", " ejemplos"],
  all: [
    "Showing all demo placeholders.",
    "Exibindo todos os exemplos.",
    "Mostrando todos los ejemplos de demostración.",
  ],
  summary: [
    (n, category, hasQuery) => "Showing " + n + (n === 1 ? " demo placeholder" : " demo placeholders")
      + category + (hasQuery ? " matching your search." : "."),
    (n, category, hasQuery) => "Exibindo " + n + (n === 1 ? " exemplo" : " exemplos")
      + category + (hasQuery ? " correspondentes à busca." : "."),
    (n, category, hasQuery) => "Mostrando " + n + (n === 1 ? " ejemplo de demostración" : " ejemplos de demostración")
      + category + (hasQuery ? " que coinciden con la búsqueda." : "."),
  ],
  copyFailed: [
    "Automatic copying is unavailable. Select and copy the link below.",
    "Cópia automática indisponível. Selecione e copie o link abaixo.",
    "La copia automática no está disponible. Selecciona y copia el enlace de abajo.",
  ],
  copied: ["View link copied.", "Link da seleção copiado.", "Enlace de la vista copiado."],
  preview: [
    "Preview only. No email was sent or stored.",
    "Apenas prévia. Nenhum e-mail foi enviado ou armazenado.",
    "Solo vista previa. No se envió ni almacenó ningún correo.",
  ],
  filterAria: ["Filter official publishers", "Filtrar fontes oficiais", "Filtrar fuentes oficiales"],
  filterLabel: ["Search official publishers", "Pesquisar fontes oficiais", "Buscar fuentes oficiales"],
  filterPlaceholder: ["Name, topic or domain", "Nome, assunto ou domínio", "Nombre, tema o dominio"],
  filterClear: ["Clear search", "Limpar busca", "Borrar búsqueda"],
  filterNone: [
    "No official publishers match this search.",
    "Nenhuma fonte oficial corresponde à busca.",
    "Ninguna fuente oficial coincide con esta búsqueda.",
  ],
  filterCount: [
    (visible, total) => visible + " of " + total + " official publishers shown.",
    (visible, total) => visible + " de " + total + " fontes oficiais exibidas.",
    (visible, total) => "Mostrando " + visible + " de " + total + " fuentes oficiales.",
  ],
  categoryPrefix: [" in ", " em ", " en "],
};
const homeLocale = document.querySelector(".cb-home")?.dataset.locale;
const LOCALE_INDEX = Object.freeze({ en: 0, "pt-br": 1, es: 2 });
const localeIndex = Object.hasOwn(LOCALE_INDEX, homeLocale) ? LOCALE_INDEX[homeLocale] : 0;
const pick = (key) => MESSAGE_ROWS[key][localeIndex];
const messages = {
  searchLocale: pick("searchLocale"),
  count: (n) => String(n) + pick(n === 1 ? "countOne" : "countMany"),
  all: pick("all"),
  summary: (...args) => pick("summary")(...args),
  copyFailed: pick("copyFailed"),
  copied: pick("copied"),
  preview: pick("preview"),
  filterAria: pick("filterAria"),
  filterLabel: pick("filterLabel"),
  filterPlaceholder: pick("filterPlaceholder"),
  filterClear: pick("filterClear"),
  filterNone: pick("filterNone"),
  filterCount: (...args) => pick("filterCount")(...args),
  categoryPrefix: pick("categoryPrefix"),
};
const isEnglish = localeIndex === 0;
const HOME_PATHS = Object.freeze(["/en", "/pt-br", "/es"]);
const defaultPath = HOME_PATHS[localeIndex];
const placeholderCount = messages.count;

let selected = "All";
let searchText = "";
const buttons = [...document.querySelectorAll("[data-category]")];
// Read the translation once from the server-rendered chip; URL IDs remain canonical.
const localizedCategories = new Map(buttons.map((button) => [
  button.dataset.category,
  button.dataset.categoryLabel ?? button.dataset.category,
]));
const displayCategory = (id) => localizedCategories.get(id) ?? id;
const cards = [...document.querySelectorAll("[data-news-card]")];
const searches = [
  document.querySelector("[data-news-search]"),
  document.querySelector("[data-news-search-mobile]"),
].filter(Boolean);
const count = document.querySelector("[data-result-count]");
const summary = document.querySelector("[data-news-filter-summary]");
const empty = document.querySelector("[data-news-empty]");
const clearButton = document.querySelector("[data-clear-filters]");
const allowedCategories = new Set(buttons.map((button) => button.dataset.category));
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

function buildViewURL(pathname = defaultPath) {
  // Only our first-party locale routes may become link targets.
  // Never derive a destination path or origin from untrusted URL parameters.
  const safePath = HOME_PATHS.includes(pathname) ? pathname : HOME_PATHS[0];
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
  const url = buildViewURL(isEnglish ? "/pt-br" : "/en");
  languageSwitch.setAttribute("href", url.pathname + url.search + url.hash);
}

function showManualShare(url) {
  if (manualShare && shareURLInput) {
    manualShare.hidden = false;
    shareURLInput.value = url;
    shareURLInput.focus();
    shareURLInput.select();
  }
  if (shareStatus) shareStatus.textContent = messages.copyFailed;
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
    const active = button.dataset.category === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  filterStories();
}


function buildFilterSummary(visible, filtered, query) {
  if (!filtered) return messages.all;
  const category = selected === "All" ? "" : messages.categoryPrefix + displayCategory(selected);
  return messages.summary(visible, category, query !== "");
}

function filterStories() {
  updateLanguageSwitch();
  if (shareStatus) shareStatus.textContent = "";
  if (manualShare) manualShare.hidden = true;
  const query = searchText.trim().toLocaleLowerCase(messages.searchLocale);
  let visible = 0;
  cards.forEach((card) => {
    const matchesCategory = selected === "All" || card.dataset.categoryValue === selected;
    const category = card.dataset.categoryValue ?? "";
    const searchableText = category + " " + displayCategory(category) + " " + card.textContent;
    const matchesQuery = !query || searchableText.toLocaleLowerCase(messages.searchLocale).includes(query);
    card.hidden = !(matchesCategory && matchesQuery);
    if (!card.hidden) visible += 1;
  });
  if (count) count.textContent = placeholderCount(visible);
  if (empty) empty.hidden = visible !== 0;
  const filtered = selected !== "All" || query !== "";
  if (clearButton) clearButton.hidden = !filtered;
  if (summary) summary.textContent = buildFilterSummary(visible, filtered, query);
}

function selectCategory(value) {
  selected = value;
  buttons.forEach((button) => {
    const active = button.dataset.category === selected;
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
  selectCategory(button.dataset.category ?? "All");
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
  if (active?.matches("input, textarea, select, button, a[href], [role=button], [role=link]") || active?.isContentEditable) return;
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
    if (shareStatus) shareStatus.textContent = messages.copied;
  } catch {
    showManualShare(url);
  }
});

document.querySelector("[data-demo-preview]")?.addEventListener("click", () => {
  const status = document.querySelector("[data-form-status]");
  if (status) status.textContent = messages.preview;
});


// M01 P2: progressive-enhancement directory search. It never imports publisher
// content, makes network requests, stores a query or treats a publisher as a LIVE feed.
// On no-JS browsers the original allowlisted publisher links remain visible.
const sourceDesk = document.querySelector(".official-sources");
const sourceCards = [...(sourceDesk?.querySelectorAll("[data-official-source]") ?? [])];
const sourceHeading = sourceDesk?.querySelector(".official-sources__heading");
if (sourceHeading && sourceCards.length) {
  const controls = document.createElement("div");
  controls.className = "official-sources__filter";
  controls.setAttribute("role", "search");
  controls.setAttribute("aria-label", messages.filterAria);

  const label = document.createElement("label");
  label.setAttribute("for", "m01-official-source-query");
  label.textContent = messages.filterLabel;
  const search = document.createElement("input");
  search.id = "m01-official-source-query";
  search.type = "search";
  search.autocomplete = "off";
  search.maxLength = 80;
  search.placeholder = messages.filterPlaceholder;
  search.dataset.officialSourceQuery = "";
  label.append(search);

  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = messages.filterClear;
  clear.dataset.officialSourceReset = "";
  clear.hidden = true;

  const status = document.createElement("p");
  status.className = "official-sources__filter-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.dataset.officialSourceStatus = "";

  function describeCount(visibleCount) {
    if (visibleCount === 0) return messages.filterNone;
    return messages.filterCount(visibleCount, sourceCards.length);
  }
  const refresh = () => {
    const query = search.value.trim().toLocaleLowerCase(messages.searchLocale);
    let visibleCount = 0;
    for (const card of sourceCards) {
      const match = !query || (card.textContent || "").toLocaleLowerCase(messages.searchLocale).includes(query);
      card.hidden = !match;
      if (match) visibleCount++;
    }
    clear.hidden = !query;
    status.textContent = describeCount(visibleCount);
  };
  clear.addEventListener("click", () => {
    search.value = "";
    refresh();
    search.focus();
  });
  search.addEventListener("input", refresh);
  search.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !search.value) return;
    event.preventDefault();
    search.value = "";
    refresh();
  });
  controls.append(label, clear, status);
  sourceHeading.after(controls);
  refresh();
}
