// CB-M03-P1-SOURCE-DIRECTORY-001: localized chrome for the public source index.
export const SOURCE_DIRECTORY_LOCALES = Object.freeze(["en", "pt-br", "es"]);

const COPY_ROWS = Object.freeze({
  back: {
    en: "← Live headlines",
    "pt-br": "← Manchetes ao vivo",
    es: "← Titulares en vivo",
  },
  pageTitle: {
    en: "CoinBlink · Attributed news sources (DEMO)",
    "pt-br": "CoinBlink · Fontes de notícias com atribuição (DEMO)",
    es: "CoinBlink · Fuentes de noticias con atribución (DEMO)",
  },
  pageDescription: {
    en: "The five public RSS publishers CoinBlink reads, what it shows and what it never does.",
    "pt-br": "Os cinco veículos públicos de RSS que o CoinBlink lê, o que mostra e o que nunca faz.",
    es: "Los cinco medios públicos de RSS que lee CoinBlink, lo que muestra y lo que nunca hace.",
  },
  h1: {
    en: "News sources",
    "pt-br": "Fontes de notícias",
    es: "Fuentes de noticias",
  },
  intro: {
    en: "CoinBlink reads five public RSS feeds. For each headline it shows the title, a short excerpt, the publication time and a link to the original article. It stores nothing, republishes nothing and never presents the reporting as its own.",
    "pt-br": "O CoinBlink lê cinco feeds RSS públicos. De cada manchete, mostra o título, um trecho curto, o horário de publicação e um link para a matéria original. Não armazena nada, não republica nada e nunca apresenta a reportagem como sua.",
    es: "CoinBlink lee cinco fuentes RSS públicas. De cada titular muestra el título, un extracto corto, la hora de publicación y un enlace a la nota original. No almacena nada, no republica nada y nunca presenta la cobertura como propia.",
  },
  statusTitle: {
    en: "Collection status",
    "pt-br": "Situação da coleta",
    es: "Estado de la recopilación",
  },
  liveStatus: {
    en: "Last collection at {time} · {ok} of {total} feeds responded.",
    "pt-br": "Última coleta em {time} · {ok} de {total} feeds responderam.",
    es: "Última recopilación el {time} · {ok} de {total} fuentes respondieron.",
  },
  disabledStatus: {
    en: "Live reader disabled. No request was made.",
    "pt-br": "Leitor ao vivo desativado. Nenhuma requisição foi feita.",
    es: "Lector en vivo desactivado. No se hizo ninguna solicitud.",
  },
  unavailableStatus: {
    en: "Reader unavailable ({reason}).",
    "pt-br": "Leitor indisponível ({reason}).",
    es: "Lector no disponible ({reason}).",
  },
  publishers: {
    en: "Publishers",
    "pt-br": "Veículos",
    es: "Medios",
  },
  officialSite: {
    en: "Official site",
    "pt-br": "Site oficial",
    es: "Sitio oficial",
  },
  feedLine: {
    en: "{status} · {count} headlines in the current collection",
    "pt-br": "{status} · {count} manchetes na coleta atual",
    es: "{status} · {count} titulares en la recopilación actual",
  },
  rightsNote: {
    en: "Headlines belong to their publishers. A source appearing here is not an endorsement, a licence or a republication right.",
    "pt-br": "As manchetes pertencem aos seus veículos. Um veículo nesta lista não é endosso, licença ou direito de republicação.",
    es: "Los titulares pertenecen a sus medios. Un medio en esta lista no es un respaldo, una licencia ni un derecho de republicación.",
  },
  allSources: {
    "en": "All sources →",
    "pt-br": "Todas as fontes →",
    "es": "Todas las fuentes →",
  },
  howItWorks: {
    "en": "How this works →",
    "pt-br": "Como funciona →",
    "es": "Cómo funciona →",
  },
  opmlLink: {
    en: "Subscribe to all feeds (OPML)",
    "pt-br": "Assinar todos os feeds (OPML)",
    es: "Suscribirse a todas las fuentes (OPML)",
  },
  liveLink: {
    en: "All live headlines →",
    "pt-br": "Todas as manchetes ao vivo →",
    es: "Todos los titulares en vivo →",
  },
});

export const SOURCE_DIRECTORY_COPY = Object.freeze(Object.fromEntries(
  SOURCE_DIRECTORY_LOCALES.map((locale) => [locale, Object.freeze(Object.fromEntries(
    Object.entries(COPY_ROWS).map(([key, row]) => [key, row[locale]]),
  ))]),
));

/** Copy for a site locale; unknown values fall back to English, never throw. */
export function getSourceDirectoryCopy(locale) {
  return typeof locale === "string" && Object.hasOwn(SOURCE_DIRECTORY_COPY, locale)
    ? SOURCE_DIRECTORY_COPY[locale]
    : SOURCE_DIRECTORY_COPY.en;
}
