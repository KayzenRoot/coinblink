/* global document */
// Accessible, deterministic client-only search over pre-rendered evergreen guides.
// Does not fetch, persist, track, write or alter guide content.
const section = document.querySelector("[data-m01-learning-search]");
if (section) {
  const search = section.querySelector("[data-learning-query]");
  const clear = section.querySelector("[data-learning-clear]");
  const status = section.querySelector("[data-learning-status]");
  const cards = [...document.querySelectorAll("#learn [data-learning-topic]")];
  const pt = section.dataset.locale === "pt-br";
  const normalize = (value) => value.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(pt ? "pt-BR" : "en");
  const indexes = cards.map((card) => normalize(card.textContent ?? ""));

  function formatMatchCount(visible) {
    if (pt) {
      return visible + (visible === 1 ? " guia encontrado." : " guias encontrados.");
    }
    return visible + (visible === 1 ? " guide found." : " guides found.");
  }

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
      status.textContent = pt
        ? "Exibindo todos os " + cards.length + " guias educativos."
        : "Showing all " + cards.length + " educational guides.";
    } else if (visible === 0) {
      status.textContent = pt
        ? "Nenhum guia corresponde à busca. Tente outro termo."
        : "No guides match your search. Try another term.";
    } else {
      status.textContent = formatMatchCount(visible);
    }
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
}
