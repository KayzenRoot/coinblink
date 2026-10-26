// M09 demo-only locale labels. Production SEO and editorial rights remain unconfigured.
export const NEWS_LOCALE_META = Object.freeze({
  en: Object.freeze({ navigation: "Navigation", search: "en", chooser: "Demo language" }),
  "pt-br": Object.freeze({ navigation: "Navegação", search: "pt-BR", chooser: "Idioma desta demonstração" }),
  es: Object.freeze({ navigation: "Navegación", search: "es", chooser: "Idioma de esta demostración" }),
});
export function getNewsLocaleMeta(locale) {
  return NEWS_LOCALE_META[locale] ?? NEWS_LOCALE_META.en;
}

// Return only a known same-origin public demo entry. Never derive a route
// from untrusted locale text or fall through Object.prototype properties.
const NEWS_HOME_ROUTES = Object.freeze({
  en: "/en",
  "pt-br": "/pt-br",
  es: "/es",
});
export function getNewsHomeHref(locale) {
  return typeof locale === "string" && Object.hasOwn(NEWS_HOME_ROUTES, locale)
    ? NEWS_HOME_ROUTES[locale] : NEWS_HOME_ROUTES.en;
}
