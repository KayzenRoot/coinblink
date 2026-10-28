// CB-M03-P1-LIVE-RSS-002: localized chrome for the live headline reader.
//
// One row per string and one column per locale: translations sit side by side,
// so a missing language is visible at a glance and the shape is written once.
// Only the page furniture is translated. Headlines stay in the publisher's
// language and product codes stay identical in every locale.
export const LIVE_NEWS_LOCALES = Object.freeze(["en", "pt-br", "es"]);

const COPY_ROWS = Object.freeze({
  lang: {
    "en": "en",
    "pt-br": "pt-BR",
    "es": "es",
  },
  pageTitle: {
    "en": "CoinBlink · Live headlines from public RSS (DEMO)",
    "pt-br": "CoinBlink · Manchetes ao vivo de RSS público (DEMO)",
    "es": "CoinBlink · Titulares en vivo de RSS público (DEMO)",
  },
  pageDescription: {
    "en": "Keyless public RSS headlines with attribution, shown as a demo and disabled by default.",
    "pt-br": "Manchetes de RSS público sem chave, com atribuição, exibidas como demonstração e desativadas por padrão.",
    "es": "Titulares de RSS público sin clave, con atribución, mostrados como demostración y desactivados por defecto.",
  },
  navigation: {
    "en": "News navigation",
    "pt-br": "Navegação de notícias",
    "es": "Navegación de noticias",
  },
  latestTitle: {
    "en": "Newest headlines",
    "pt-br": "Manchetes mais recentes",
    "es": "Titulares más recientes",
  },
  back: {
    "en": "← News",
    "pt-br": "← Notícias",
    "es": "← Noticias",
  },
  h1: {
    "en": "Live headlines from public feeds",
    "pt-br": "Manchetes ao vivo de feeds públicos",
    "es": "Titulares en vivo de fuentes públicas",
  },
  intro: {
    "en": "This page reads {feeds} public RSS feeds and shows the newest headline, a short excerpt, the publisher and a link to the original article. Headlines stay in the publisher's language. Nothing is stored, no full article is kept, no feed is republished and the reporting is never presented as ours.",
    "pt-br": "Esta página lê {feeds} feeds RSS públicos e mostra a manchete mais recente, um trecho curto, o veículo e um link para a matéria original. As manchetes permanecem no idioma do veículo. Nada é armazenado, nenhum texto completo é mantido, nenhum feed é republicado e a reportagem nunca é apresentada como nossa.",
    "es": "Esta página lee {feeds} fuentes RSS públicas y muestra el titular más reciente, un extracto corto, el medio y un enlace a la nota original. Los titulares permanecen en el idioma del medio. No se almacena nada, no se conserva texto completo, no se republica ninguna fuente y la cobertura nunca se presenta como propia.",
  },
  disabledTitle: {
    "en": "LIVE NEWS DISABLED",
    "pt-br": "NOTÍCIAS AO VIVO DESATIVADAS",
    "es": "NOTICIAS EN VIVO DESACTIVADAS",
  },
  disabledBody: {
    "en": "No request was made. Live headlines are off because this deployment has not enabled them.",
    "pt-br": "Nenhuma requisição foi feita. As manchetes ao vivo estão desligadas porque esta implantação não as habilitou.",
    "es": "No se hizo ninguna solicitud. Los titulares en vivo están apagados porque esta implementación no los habilitó.",
  },
  disabledNote: {
    "en": "The source lab remains synthetic and offline. Enabling this page is a single deployment variable, not a code change.",
    "pt-br": "O laboratório de fontes continua sintético e offline. Habilitar esta página é uma variável de implantação, não uma mudança de código.",
    "es": "El laboratorio de fuentes sigue siendo sintético y sin conexión. Habilitar esta página es una variable de despliegue, no un cambio de código.",
  },
  unavailableTitle: {
    "en": "LIVE NEWS UNAVAILABLE",
    "pt-br": "NOTÍCIAS AO VIVO INDISPONÍVEIS",
    "es": "NOTICIAS EN VIVO NO DISPONIBLES",
  },
  unavailableBody: {
    "en": "Reason: {reason}. No headline is shown rather than a stale or invented one.",
    "pt-br": "Motivo: {reason}. Nenhuma manchete é exibida em vez de uma desatualizada ou inventada.",
    "es": "Motivo: {reason}. No se muestra ningún titular en lugar de uno desactualizado o inventado.",
  },
  unavailableNote: {
    "en": "Each feed fails alone. A timeout, an HTTP error or an empty document is reported here instead of being guessed around.",
    "pt-br": "Cada feed falha sozinho. Um timeout, um erro HTTP ou um documento vazio é reportado aqui em vez de ser contornado por suposição.",
    "es": "Cada fuente falla por separado. Un tiempo de espera agotado, un error HTTP o un documento vacío se informa aquí en vez de suponerse.",
  },
  warning: {
    "en": "THIRD-PARTY HEADLINES · ATTRIBUTION ONLY · NO FULL TEXT · NO REPUBLICATION · NOT AN ENDORSEMENT",
    "pt-br": "MANCHETES DE TERCEIROS · SOMENTE ATRIBUIÇÃO · SEM TEXTO COMPLETO · SEM REPUBLICAÇÃO · NÃO É UM ENDOSSO",
    "es": "TITULARES DE TERCEROS · SOLO ATRIBUCIÓN · SIN TEXTO COMPLETO · SIN REPUBLICACIÓN · NO ES UN RESPALDO",
  },
  meta: {
    "en": "Collected at {time} · {count} headlines from {sources} of {feeds} feeds · refreshed at most every {minutes} minutes.",
    "pt-br": "Coletado em {time} · {count} manchetes de {sources} de {feeds} feeds · atualizado no máximo a cada {minutes} minutos.",
    "es": "Recopilado el {time} · {count} titulares de {sources} de {feeds} fuentes · actualizado como máximo cada {minutes} minutos.",
  },
  filterTitle: {
    "en": "Find a headline",
    "pt-br": "Encontrar uma manchete",
    "es": "Encontrar un titular",
  },
  filterQueryLabel: {
    "en": "Search headlines",
    "pt-br": "Buscar manchetes",
    "es": "Buscar titulares",
  },
  filterQueryHint: {
    "en": "Publisher, topic or word",
    "pt-br": "Veículo, tema ou palavra",
    "es": "Medio, tema o palabra",
  },
  filterSourceLabel: {
    "en": "Publisher",
    "pt-br": "Veículo",
    "es": "Medio",
  },
  filterAllSources: {
    "en": "All publishers",
    "pt-br": "Todos os veículos",
    "es": "Todos los medios",
  },
  filterApply: {
    "en": "Apply filters",
    "pt-br": "Aplicar filtros",
    "es": "Aplicar filtros",
  },
  filterReset: {
    "en": "Clear filters",
    "pt-br": "Limpar filtros",
    "es": "Borrar filtros",
  },
  resultOne: {
    "en": "headline matches",
    "pt-br": "manchete encontrada",
    "es": "titular coincide",
  },
  resultMany: {
    "en": "headlines match",
    "pt-br": "manchetes encontradas",
    "es": "titulares coinciden",
  },
  emptyFiltered: {
    "en": "No headline in this collection matches the filter. Nothing was requested again.",
    "pt-br": "Nenhuma manchete desta coleta corresponde ao filtro. Nada foi solicitado novamente.",
    "es": "Ningún titular de esta recopilación coincide con el filtro. No se solicitó nada de nuevo.",
  },
  filterNote: {
    "en": "The filter only narrows this page; it makes no additional request to any publisher.",
    "pt-br": "O filtro apenas restringe esta página; nenhuma requisição adicional é feita a qualquer veículo.",
    "es": "El filtro solo restringe esta página; no se hace ninguna solicitud adicional a los medios.",
  },
  feedsTitle: {
    "en": "Feed status in this collection",
    "pt-br": "Situação dos feeds nesta coleta",
    "es": "Estado de las fuentes en esta recopilación",
  },
  feedsCaption: {
    "en": "Every whitelisted publisher and what this collection received from it",
    "pt-br": "Cada veículo autorizado e o que esta coleta recebeu dele",
    "es": "Cada medio autorizado y lo que recibió esta recopilación",
  },
  columnPublisher: {
    "en": "Publisher",
    "pt-br": "Veículo",
    "es": "Medio",
  },
  columnStatus: {
    "en": "Status",
    "pt-br": "Situação",
    "es": "Estado",
  },
  columnHeadlines: {
    "en": "Headlines",
    "pt-br": "Manchetes",
    "es": "Titulares",
  },
  columnReason: {
    "en": "Reason",
    "pt-br": "Motivo",
    "es": "Motivo",
  },
  undated: {
    "en": "TIME NOT SUPPLIED BY THE FEED",
    "pt-br": "HORÁRIO NÃO INFORMADO PELO FEED",
    "es": "HORA NO INFORMADA POR LA FUENTE",
  },
  noReason: {
    "en": "—",
    "pt-br": "—",
    "es": "—",
  },
  rightsNote: {
    "en": "Headlines belong to their publishers. CoinBlink links to the original article and shows no more than the feed supplies. Nothing here creates a licence, a subscription or a republication right, and the synthetic newsroom remains the default.",
    "pt-br": "As manchetes pertencem aos seus veículos. O CoinBlink linka a matéria original e não mostra mais do que o feed fornece. Nada aqui cria licença, assinatura ou direito de republicação, e a redação sintética continua sendo o padrão.",
    "es": "Los titulares pertenecen a sus medios. CoinBlink enlaza la nota original y no muestra más de lo que entrega la fuente. Nada aquí crea una licencia, una suscripción ni un derecho de republicación, y la redacción sintética sigue siendo lo predeterminado.",
  },
});

/** Materialize one frozen copy object per locale from the shared rows. */
export const LIVE_NEWS_COPY = Object.freeze(Object.fromEntries(
  LIVE_NEWS_LOCALES.map((locale) => [locale, Object.freeze(Object.fromEntries(
    Object.entries(COPY_ROWS).map(([key, row]) => [key, row[locale]]),
  ))]),
));

/** Copy for a site locale; unknown values fall back to English, never throw. */
export function getLiveNewsCopy(locale) {
  return typeof locale === "string" && Object.hasOwn(LIVE_NEWS_COPY, locale)
    ? LIVE_NEWS_COPY[locale]
    : LIVE_NEWS_COPY.en;
}

/** Fill `{name}` placeholders from a frozen record of string values. */
export function fillLiveNewsCopy(template, values) {
  return template.replace(/\{([a-z]+)\}/gu, (whole, name) =>
    (Object.hasOwn(values, name) ? String(values[name]) : whole));
}
