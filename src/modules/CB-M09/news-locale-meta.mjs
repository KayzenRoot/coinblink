// M09 demo-only locale labels. Production SEO and editorial rights remain unconfigured.
export const NEWS_LOCALE_META = Object.freeze({
  en: Object.freeze({ navigation: "Navigation", search: "en", chooser: "Demo language" }),
  "pt-br": Object.freeze({ navigation: "Navegação", search: "pt-BR", chooser: "Idioma desta demonstração" }),
  es: Object.freeze({ navigation: "Navegación", search: "es", chooser: "Idioma de esta demostración" }),
});
export function getNewsLocaleMeta(locale) {
  return NEWS_LOCALE_META[locale] ?? NEWS_LOCALE_META.en;
}
