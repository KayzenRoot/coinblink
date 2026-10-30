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
    "en": "Topic or word",
    "pt-br": "Tema ou palavra",
    "es": "Tema o palabra",
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
  stripTitle: {
    "en": "Latest from the industry",
    "pt-br": "Últimas do setor",
    "es": "Lo último del sector",
  },
  stripNote: {
    "en": "Third-party headlines, attribution only. Headlines stay in the publisher's language.",
    "pt-br": "Manchetes de terceiros, somente atribuição. As manchetes permanecem no idioma do veículo.",
    "es": "Titulares de terceros, solo atribución. Los titulares permanecen en el idioma del medio.",
  },
  stripCoverage: {
    "en": "{count} stories covered by several publishers →",
    "pt-br": "{count} histórias cobertas por vários veículos →",
    "es": "{count} historias cubiertas por varios medios →",
  },
  stripAll: {
    "en": "See all {count} live headlines →",
    "pt-br": "Ver todas as {count} manchetes ao vivo →",
    "es": "Ver los {count} titulares en vivo →",
  },
  topicsTitle: {
    "en": "Frequent words in this collection",
    "pt-br": "Palavras frequentes nesta coleta",
    "es": "Palabras frecuentes en esta recopilación",
  },
  topicsNote: {
    "en": "Counted from the headlines above, not an editorial topic model. Select one to filter.",
    "pt-br": "Contadas a partir das manchetes acima, não são um modelo editorial de temas. Selecione uma para filtrar.",
    "es": "Contadas a partir de los titulares anteriores, no son un modelo editorial de temas. Selecciona una para filtrar.",
  },
  alsoCovered: {
    "en": "Also covered by:",
    "pt-br": "Também coberto por:",
    "es": "También cubierto por:",
  },
  coverageNote: {
    "en": "Coverage is detected mechanically from significant title words shared by the headlines. It is a reading aid, not an editorial judgement, and the publishers' text is never merged or rewritten.",
    "pt-br": "A cobertura é detectada mecanicamente por palavras significativas do título compartilhadas entre as manchetes. É um auxílio de leitura, não um julgamento editorial, e o texto dos veículos nunca é fundido nem reescrito.",
    "es": "La cobertura se detecta mecánicamente por palabras significativas del titular compartidas entre los titulares. Es una ayuda de lectura, no un juicio editorial, y el texto de los medios nunca se fusiona ni se reescribe.",
  },
  topTitle: {
    "en": "Most covered now",
    "pt-br": "Mais cobertas agora",
    "es": "Más cubiertas ahora",
  },
  topPublishers: {
    "en": "{count} publishers",
    "pt-br": "{count} veículos",
    "es": "{count} medios",
  },
  topNote: {
    "en": "Stories that more than one publisher carried in this collection, ordered by publisher count and then recency. This highlight uses the same mechanical title matching as the notes under each headline.",
    "pt-br": "Histórias que mais de um veículo publicou nesta coleta, ordenadas pela quantidade de veículos e depois pela recência. Este destaque usa a mesma comparação mecânica de títulos das notas sob cada manchete.",
    "es": "Historias que más de un medio publicó en esta recopilación, ordenadas por cantidad de medios y luego por recencia. Este destaque usa la misma comparación mecánica de titulares que las notas bajo cada titular.",
  },
  coverageAll: {
    "en": "See all {count} covered stories →",
    "pt-br": "Ver as {count} histórias cobertas →",
    "es": "Ver las {count} historias cubiertas →",
  },
  newBadge: {
    "en": "New",
    "pt-br": "Nova",
    "es": "Nuevo",
  },
  newStatus: {
    "en": "{count} new since your last visit",
    "pt-br": "{count} novas desde sua última visita",
    "es": "{count} nuevos desde tu última visita",
  },
  newNote: {
    "en": "The marker is stored only in this browser; it is not an account and sends nothing.",
    "pt-br": "A marcação fica somente neste navegador; não é uma conta e não envia nada.",
    "es": "La marca se guarda solo en este navegador; no es una cuenta y no envía nada.",
  },
  coverageFilterTitle: {
    "en": "Filter covered stories",
    "pt-br": "Filtrar histórias cobertas",
    "es": "Filtrar historias cubiertas",
  },
  coverageFilterNote: {
    "en": "Search and filters narrow the collection before grouping. A publisher filter keeps the whole story, including the other publishers that carried it.",
    "pt-br": "A busca e os filtros restringem a coleta antes do agrupamento. O filtro por veículo mantém a história inteira, incluindo os outros veículos que a publicaram.",
    "es": "La búsqueda y los filtros restringen la recopilación antes del agrupamiento. El filtro por medio mantiene la historia completa, incluidos los otros medios que la publicaron.",
  },
  coverageFilteredEmpty: {
    "en": "No covered story matches these filters.",
    "pt-br": "Nenhuma história coberta corresponde a estes filtros.",
    "es": "Ninguna historia cubierta coincide con estos filtros.",
  },
  coveragePageTitle: {
    "en": "CoinBlink · Stories covered by several publishers (DEMO)",
    "pt-br": "CoinBlink · Histórias cobertas por vários veículos (DEMO)",
    "es": "CoinBlink · Historias cubiertas por varios medios (DEMO)",
  },
  coveragePageDescription: {
    "en": "A mechanical, attributed view of the stories that more than one public RSS publisher carried in the current collection.",
    "pt-br": "Uma visão mecânica e atribuída das histórias que mais de um veículo de RSS público publicou na coleta atual.",
    "es": "Una vista mecánica y atribuida de las historias que más de un medio de RSS público publicó en la recopilación actual.",
  },
  coverageH1: {
    "en": "Stories covered by several publishers",
    "pt-br": "Histórias cobertas por vários veículos",
    "es": "Historias cubiertas por varios medios",
  },
  coverageIntro: {
    "en": "Each group below links every publisher that carried the same story. Matching uses shared significant words in the headlines from {feeds} public feeds: it is a reading aid, not an editorial judgement.",
    "pt-br": "Cada grupo abaixo linka todos os veículos que publicaram a mesma história. A comparação usa palavras significativas compartilhadas nos títulos de {feeds} feeds públicos: é um auxílio de leitura, não um julgamento editorial.",
    "es": "Cada grupo siguiente enlaza todos los medios que publicaron la misma historia. La comparación usa palabras significativas compartidas en los titulares de {feeds} fuentes públicas: es una ayuda de lectura, no un juicio editorial.",
  },
  coverageMeta: {
    "en": "Collected at {time} · {count} covered stories · {sources} publishers read",
    "pt-br": "Coletado em {time} · {count} histórias cobertas · {sources} veículos lidos",
    "es": "Recopilado el {time} · {count} historias cubiertas · {sources} medios leídos",
  },
  coverageEmpty: {
    "en": "No story in this collection is covered by more than one publisher right now.",
    "pt-br": "Nenhuma história desta coleta está coberta por mais de um veículo agora.",
    "es": "Ninguna historia de esta recopilación está cubierta por más de un medio ahora.",
  },
  coverageLiveLink: {
    "en": "Back to live headlines",
    "pt-br": "Voltar para as manchetes ao vivo",
    "es": "Volver a los titulares en vivo",
  },
  officialSite: {
    "en": "official site",
    "pt-br": "site oficial",
    "es": "sitio oficial",
  },
  sinceTitle: {
    "en": "Time window",
    "pt-br": "Janela de tempo",
    "es": "Ventana de tiempo",
  },
  sinceAny: {
    "en": "Any time",
    "pt-br": "Qualquer horário",
    "es": "Cualquier hora",
  },
  sinceHours: {
    "en": "Last {hours}h",
    "pt-br": "Últimas {hours}h",
    "es": "Últimas {hours}h",
  },
  sinceNote: {
    "en": "Headlines without a publication time are hidden inside a time window.",
    "pt-br": "Manchetes sem horário de publicação ficam ocultas em uma janela de tempo.",
    "es": "Los titulares sin hora de publicación se ocultan dentro de una ventana de tiempo.",
  },
  allSources: {
    "en": "All sources →",
    "pt-br": "Todas as fontes →",
    "es": "Todas las fuentes →",
  },
  savedCoverage: {
    "en": "Coverage",
    "pt-br": "Cobertura",
    "es": "Cobertura",
  },
  savedTitle: {
    "en": "Saved searches",
    "pt-br": "Buscas salvas",
    "es": "Búsquedas guardadas",
  },
  savedNote: {
    "en": "Stored in this browser only. No account, no server and no tracking.",
    "pt-br": "Guardadas apenas neste navegador. Sem conta, servidor ou rastreamento.",
    "es": "Guardadas solo en este navegador. Sin cuenta, servidor ni rastreo.",
  },
  savedSave: {
    "en": "Save this search",
    "pt-br": "Salvar esta busca",
    "es": "Guardar esta búsqueda",
  },
  savedClear: {
    "en": "Clear saved searches",
    "pt-br": "Limpar buscas salvas",
    "es": "Borrar búsquedas guardadas",
  },
  savedEmpty: {
    "en": "No saved search yet.",
    "pt-br": "Nenhuma busca salva ainda.",
    "es": "Todavía no hay búsquedas guardadas.",
  },
  savedAll: {
    "en": "All headlines",
    "pt-br": "Todas as manchetes",
    "es": "Todos los titulares",
  },
  savedRemove: {
    "en": "Remove {label}",
    "pt-br": "Remover {label}",
    "es": "Quitar {label}",
  },
  savedFull: {
    "en": "You can save up to {max} searches.",
    "pt-br": "Você pode salvar até {max} buscas.",
    "es": "Puedes guardar hasta {max} búsquedas.",
  },
  savedDuplicate: {
    "en": "This search is already saved.",
    "pt-br": "Esta busca já está salva.",
    "es": "Esta búsqueda ya está guardada.",
  },
  savedSaved: {
    "en": "Search saved in this browser.",
    "pt-br": "Busca salva neste navegador.",
    "es": "Búsqueda guardada en este navegador.",
  },
  savedError: {
    "en": "This browser could not store the search.",
    "pt-br": "Este navegador não conseguiu armazenar a busca.",
    "es": "Este navegador no pudo guardar la búsqueda.",
  },
  savedRemoved: {
    "en": "Saved search removed.",
    "pt-br": "Busca salva removida.",
    "es": "Búsqueda guardada eliminada.",
  },
  savedCleared: {
    "en": "Saved searches cleared.",
    "pt-br": "Buscas salvas limpas.",
    "es": "Búsquedas guardadas borradas.",
  },
  staleWarning: {
    "en": "Refresh failed; showing the last successful collection from {time}.",
    "pt-br": "A atualização falhou; exibindo a última coleta bem-sucedida de {time}.",
    "es": "La actualización falló; se muestra la última recopilación correcta de {time}.",
  },
  howItWorks: {
    "en": "How this works →",
    "pt-br": "Como funciona →",
    "es": "Cómo funciona →",
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
