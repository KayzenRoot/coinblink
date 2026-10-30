// CB-M09-P1-LOCALIZED-404-001: a 404 that speaks the language of the address.
//
// The locale is read from the first path segment and validated against the
// copy registry. Unknown segments fall back to English; prototype keys never
// resolve to a locale.
export const NOT_FOUND_LOCALES = Object.freeze(["en", "pt-br", "es"]);

const ROWS = Object.freeze({
  lang: {
    "en": "en",
    "pt-br": "pt-BR",
    "es": "es",
  },
  pageTitle: {
    "en": "Page not found · CoinBlink",
    "pt-br": "Página não encontrada · CoinBlink",
    "es": "Página no encontrada · CoinBlink",
  },
  pageDescription: {
    "en": "This path is not part of CoinBlink.",
    "pt-br": "Este caminho não faz parte do CoinBlink.",
    "es": "Esta ruta no forma parte de CoinBlink.",
  },
  eyebrow: {
    "en": "COINBLINK · NOT FOUND",
    "pt-br": "COINBLINK · NÃO ENCONTRADO",
    "es": "COINBLINK · NO ENCONTRADO",
  },
  h1: {
    "en": "Page not found",
    "pt-br": "Página não encontrada",
    "es": "Página no encontrada",
  },
  body: {
    "en": "The address does not exist or is not available in this demo. Use the links below.",
    "pt-br": "O endereço não existe ou não está disponível nesta demonstração. Use os links abaixo.",
    "es": "La dirección no existe o no está disponible en esta demostración. Usa los enlaces siguientes.",
  },
  home: {
    "en": "Return to home",
    "pt-br": "Voltar para o início",
    "es": "Volver al inicio",
  },
  news: {
    "en": "Go to the news index",
    "pt-br": "Ir para o índice de notícias",
    "es": "Ir al índice de noticias",
  },
});

export const NOT_FOUND_COPY = Object.freeze(Object.fromEntries(
  NOT_FOUND_LOCALES.map((locale) => [locale, Object.freeze(Object.fromEntries(
    Object.entries(ROWS).map(([key, row]) => [key, row[locale]]),
  ))]),
));

/** Copy for a site locale; unknown values fall back to English, never throw. */
export function getNotFoundCopy(locale) {
  return typeof locale === "string" && Object.hasOwn(NOT_FOUND_COPY, locale)
    ? NOT_FOUND_COPY[locale]
    : NOT_FOUND_COPY.en;
}

/** The locale named by the first path segment, or "en" when it is not a site locale. */
export function localeFromPathname(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) return "en";
  const first = pathname.split("/")[1];
  return typeof first === "string" && Object.hasOwn(NOT_FOUND_COPY, first) ? first : "en";
}
