// CB-M03-P1-SOURCE-PAGES-001: localized chrome for one publisher's page.
//
// One row per string and one column per locale. The page itself keeps the
// publisher's language for headlines; only this furniture is translated.
export const SOURCE_PAGE_LOCALES = Object.freeze(["en", "pt-br", "es"]);

const COPY_ROWS = Object.freeze({
  back: {
    en: "← Live headlines",
    "pt-br": "← Manchetes ao vivo",
    es: "← Titulares en vivo",
  },
  title: {
    en: "CoinBlink · {name} headlines (DEMO)",
    "pt-br": "CoinBlink · Manchetes de {name} (DEMO)",
    es: "CoinBlink · Titulares de {name} (DEMO)",
  },
  intro: {
    en: "{name} headlines with attribution. CoinBlink shows the headline, a short excerpt, the publication time and a link to the original article.",
    "pt-br": "Manchetes de {name} com atribuição. O CoinBlink mostra a manchete, um trecho curto, o horário de publicação e um link para a matéria original.",
    es: "Titulares de {name} con atribución. CoinBlink muestra el titular, un extracto corto, la hora de publicación y un enlace a la nota original.",
  },
  statusTitle: {
    en: "Collection status",
    "pt-br": "Situação da coleta",
    es: "Estado de la recopilación",
  },
  statusLive: {
    en: "Last collection at {time} · {count} headlines from this publisher.",
    "pt-br": "Última coleta em {time} · {count} manchetes deste veículo.",
    es: "Última recopilación el {time} · {count} titulares de este medio.",
  },
  statusDisabled: {
    en: "Live reader disabled. No request was made.",
    "pt-br": "Leitor ao vivo desativado. Nenhuma requisição foi feita.",
    es: "Lector en vivo desactivado. No se hizo ninguna solicitud.",
  },
  statusUnavailable: {
    en: "Reader unavailable ({reason}).",
    "pt-br": "Leitor indisponível ({reason}).",
    es: "Lector no disponible ({reason}).",
  },
  statusPending: {
    en: "This publisher has no headline in the current collection.",
    "pt-br": "Este veículo não tem manchete na coleta atual.",
    es: "Este medio no tiene titulares en la recopilación actual.",
  },
  itemsTitle: {
    en: "Latest from {name}",
    "pt-br": "Últimas de {name}",
    es: "Lo último de {name}",
  },
  noItems: {
    en: "No headline from this publisher in the current collection.",
    "pt-br": "Nenhuma manchete deste veículo na coleta atual.",
    es: "Ningún titular de este medio en la recopilación actual.",
  },
  siteLabel: {
    en: "Publisher site",
    "pt-br": "Site do veículo",
    es: "Sitio del medio",
  },
  rightsNote: {
    en: "Headlines belong to {name}. Nothing here is stored, republished or presented as CoinBlink reporting.",
    "pt-br": "As manchetes pertencem a {name}. Nada aqui é armazenado, republicado ou apresentado como reportagem do CoinBlink.",
    es: "Los titulares pertenecen a {name}. Nada aquí se almacena, se republica ni se presenta como reportaje de CoinBlink.",
  },
  allHeadlines: {
    en: "See all live headlines →",
    "pt-br": "Ver todas as manchetes ao vivo →",
    es: "Ver todos los titulares en vivo →",
  },
  notFoundTitle: {
    en: "Publisher not found",
    "pt-br": "Veículo não encontrado",
    es: "Medio no encontrado",
  },
  notFoundBody: {
    en: "This publisher is not in the CoinBlink source list. No request was made.",
    "pt-br": "Este veículo não está na lista de fontes do CoinBlink. Nenhuma requisição foi feita.",
    es: "Este medio no está en la lista de fuentes de CoinBlink. No se hizo ninguna solicitud.",
  },
});

export const SOURCE_PAGE_COPY = Object.freeze(Object.fromEntries(
  SOURCE_PAGE_LOCALES.map((locale) => [locale, Object.freeze(Object.fromEntries(
    Object.entries(COPY_ROWS).map(([key, row]) => [key, row[locale]]),
  ))]),
));

/** Copy for a site locale; unknown values fall back to English, never throw. */
export function getSourcePageCopy(locale) {
  return typeof locale === "string" && Object.hasOwn(SOURCE_PAGE_COPY, locale)
    ? SOURCE_PAGE_COPY[locale]
    : SOURCE_PAGE_COPY.en;
}
