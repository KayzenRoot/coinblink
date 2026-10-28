/* global document, window */
// Accessible, deterministic client-only search over pre-rendered evergreen guides.
// Does not fetch, persist, track, write or alter guide content.
const section = document.querySelector("[data-m01-learning-search]");
if (section) {
  const search = section.querySelector("[data-learning-query]");
  const clear = section.querySelector("[data-learning-clear]");
  const status = section.querySelector("[data-learning-status]");
  const cards = [...document.querySelectorAll("#learn [data-learning-topic]")];
  const LABELS = {
    en: {
      searchLocale: "en",
      all: (count) => "Showing all " + count + " educational guides.",
      none: "No guides match your search. Try another term.",
      found: (count) => count + (count === 1 ? " guide found." : " guides found."),
      permalink: "Guide link",
      permalinkAria: "Link to guide: ",
    },
    "pt-br": {
      searchLocale: "pt-BR",
      all: (count) => "Exibindo todos os " + count + " guias educativos.",
      none: "Nenhum guia corresponde à busca. Tente outro termo.",
      found: (count) => count + (count === 1 ? " guia encontrado." : " guias encontrados."),
      permalink: "Link do guia",
      permalinkAria: "Link para o guia: ",
    },
    es: {
      searchLocale: "es",
      all: (count) => "Mostrando las " + count + " guías educativas.",
      none: "Ninguna guía coincide con la búsqueda. Prueba otro término.",
      found: (count) => count + (count === 1 ? " guía encontrada." : " guías encontradas."),
      permalink: "Enlace de la guía",
      permalinkAria: "Enlace a la guía: ",
    },
  };
  const locale = section.dataset.locale;
  const labels = Object.hasOwn(LABELS, locale) ? LABELS[locale] : LABELS.en;
  const normalize = (value) => value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(labels.searchLocale);
  const indexes = cards.map((card) => normalize(card.textContent ?? ""));

  function update() {
    const query = normalize(search.value.trim().slice(0, 80));
    let visible = 0;
    cards.forEach((card, i) => {
      const match = !query || indexes[i].includes(query);
      card.hidden = !match;
      if (match) visible++;
    });
    clear.hidden = !query;
    if (!query) {
      status.textContent = labels.all(cards.length);
    } else if (visible === 0) {
      status.textContent = labels.none;
    } else {
      status.textContent = labels.found(visible);
    }
  }


  // Progressive enhancement: a regular, shareable anchor for each SSR guide.
  for (const card of cards) {
    const content = card.querySelector(".learn-card__content");
    const title = card.querySelector("summary strong")?.textContent;
    if (!content || !title || !/^learn-[a-z0-9-]+$/.test(card.id)) continue;
    const link = document.createElement("a");
    link.className = "learn-card__permalink";
    link.href = "#" + card.id;
    link.textContent = labels.permalink;
    link.setAttribute("aria-label", labels.permalinkAria + title);
    content.appendChild(link);
  }

  function revealHashGuide() {
    const target = cards.find((card) => "#" + card.id === window.location.hash);
    if (!target) return;
    if (search.value) {
      search.value = "";
      update();
    }
    target.hidden = false;
    target.open = true;
    target.scrollIntoView({ block: "start" });
  }
  search.addEventListener("input", update);
  search.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !search.value) return;
    event.preventDefault();
    search.value = "";
    update();
  });
  clear.addEventListener("click", () => {
    search.value = "";
    update();
    search.focus();
  });
  section.hidden = false;
  update();
  revealHashGuide();
  window.addEventListener("hashchange", revealHashGuide);
}
