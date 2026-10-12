const menu = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-primary-nav]");
  menu?.addEventListener("click", () => {
    const expanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", String(!expanded));
    nav?.classList.toggle("is-open", !expanded);
  });
  const navLinks = [...(nav?.querySelectorAll("a") ?? [])];
  navLinks.forEach((link) => link.addEventListener("click", () => {
    if (menu?.getAttribute("aria-expanded") !== "true") return;
    menu.setAttribute("aria-expanded", "false");
    nav?.classList.remove("is-open");
  }));

  let selected = "All";
  const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-category]")];
  const cards = [...document.querySelectorAll<HTMLElement>("[data-news-card]")];
  const search = document.querySelector<HTMLInputElement>("[data-news-search]");
  const count = document.querySelector("[data-result-count]");
  function filterStories() {
    const query = search?.value.trim().toLowerCase() ?? "";
    let visible = 0;
    cards.forEach((card) => {
      const matchesCategory = selected === "All" || card.getAttribute("data-category-value") === selected;
      const searchableText = (card.getAttribute("data-category-value") ?? "") + " " + card.textContent;
      const matchesQuery = !query || searchableText.toLowerCase().includes(query);
      card.hidden = !(matchesCategory && matchesQuery);
      if (!card.hidden) visible += 1;
    });
    if (count) count.textContent = String(visible) + (visible === 1 ? " placeholder" : " placeholders");
  }
  buttons.forEach((button) => button.addEventListener("click", () => {
    selected = button.getAttribute("data-category") ?? "All";
    buttons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    filterStories();
  }));
  search?.addEventListener("input", filterStories);
  document.querySelector("[data-demo-preview]")?.addEventListener("click", () => {
    const status = document.querySelector("[data-form-status]");
    if (status) status.textContent = "Preview only. No email was sent or stored.";
  });
