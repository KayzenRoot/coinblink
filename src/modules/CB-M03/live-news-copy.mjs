// CB-M03-P1-LIVE-RSS-002: localized chrome for the live headline reader.
//
// Only the page furniture is translated. Headlines stay in the publisher's own
// language, and the product codes stay identical everywhere so a reader can
// quote them in any locale.
export const LIVE_NEWS_COPY = Object.freeze({
  en: Object.freeze({
    lang: "en",
    pageTitle: "CoinBlink · Live headlines from public RSS (DEMO)",
    pageDescription: "Keyless public RSS headlines with attribution, shown as a demo and disabled by default.",
    navigation: "News navigation",
    latestTitle: "Newest headlines",
    back: "← News",
    h1: "Live headlines from public feeds",
    intro: "This page reads {feeds} public RSS feeds and shows the newest headline, a short excerpt, the publisher and a link to the original article. Headlines stay in the publisher's language. Nothing is stored, no full article is kept, no feed is republished and the reporting is never presented as ours.",
    disabledTitle: "LIVE NEWS DISABLED",
    disabledBody: "No request was made. Live headlines are off because this deployment has not enabled them.",
    disabledNote: "The source lab remains synthetic and offline. Enabling this page is a single deployment variable, not a code change.",
    unavailableTitle: "LIVE NEWS UNAVAILABLE",
    unavailableBody: "Reason: {reason}. No headline is shown rather than a stale or invented one.",
    unavailableNote: "Each feed fails alone. A timeout, an HTTP error or an empty document is reported here instead of being guessed around.",
    warning: "THIRD-PARTY HEADLINES · ATTRIBUTION ONLY · NO FULL TEXT · NO REPUBLICATION · NOT AN ENDORSEMENT",
    meta: "Collected at {time} · {count} headlines from {sources} of {feeds} feeds · refreshed at most every {minutes} minutes.",
    feedsTitle: "Feed status in this collection",
    feedsCaption: "Every whitelisted publisher and what this collection received from it",
    columnPublisher: "Publisher",
    columnStatus: "Status",
    columnHeadlines: "Headlines",
    columnReason: "Reason",
    undated: "TIME NOT SUPPLIED BY THE FEED",
    noReason: "—",
    rightsNote: "Headlines belong to their publishers. CoinBlink links to the original article and shows no more than the feed supplies. Nothing here creates a licence, a subscription or a republication right, and the synthetic newsroom remains the default.",
  }),
  "pt-br": Object.freeze({
    lang: "pt-BR",
    pageTitle: "CoinBlink · Manchetes ao vivo de RSS público (DEMO)",
    pageDescription: "Manchetes de RSS público sem chave, com atribuição, exibidas como demonstração e desativadas por padrão.",
    navigation: "Navegação de notícias",
    latestTitle: "Manchetes mais recentes",
    back: "← Notícias",
    h1: "Manchetes ao vivo de feeds públicos",
    intro: "Esta página lê {feeds} feeds RSS públicos e mostra a manchete mais recente, um trecho curto, o veículo e um link para a matéria original. As manchetes permanecem no idioma do veículo. Nada é armazenado, nenhum texto completo é mantido, nenhum feed é republicado e a reportagem nunca é apresentada como nossa.",
    disabledTitle: "NOTÍCIAS AO VIVO DESATIVADAS",
    disabledBody: "Nenhuma requisição foi feita. As manchetes ao vivo estão desligadas porque esta implantação não as habilitou.",
    disabledNote: "O laboratório de fontes continua sintético e offline. Habilitar esta página é uma variável de implantação, não uma mudança de código.",
    unavailableTitle: "NOTÍCIAS AO VIVO INDISPONÍVEIS",
    unavailableBody: "Motivo: {reason}. Nenhuma manchete é exibida em vez de uma desatualizada ou inventada.",
    unavailableNote: "Cada feed falha sozinho. Um timeout, um erro HTTP ou um documento vazio é reportado aqui em vez de ser contornado por suposição.",
    warning: "MANCHETES DE TERCEIROS · SOMENTE ATRIBUIÇÃO · SEM TEXTO COMPLETO · SEM REPUBLICAÇÃO · NÃO É UM ENDOSSO",
    meta: "Coletado em {time} · {count} manchetes de {sources} de {feeds} feeds · atualizado no máximo a cada {minutes} minutos.",
    feedsTitle: "Situação dos feeds nesta coleta",
    feedsCaption: "Cada veículo autorizado e o que esta coleta recebeu dele",
    columnPublisher: "Veículo",
    columnStatus: "Situação",
    columnHeadlines: "Manchetes",
    columnReason: "Motivo",
    undated: "HORÁRIO NÃO INFORMADO PELO FEED",
    noReason: "—",
    rightsNote: "As manchetes pertencem aos seus veículos. O CoinBlink linka a matéria original e não mostra mais do que o feed fornece. Nada aqui cria licença, assinatura ou direito de republicação, e a redação sintética continua sendo o padrão.",
  }),
  es: Object.freeze({
    lang: "es",
    pageTitle: "CoinBlink · Titulares en vivo de RSS público (DEMO)",
    pageDescription: "Titulares de RSS público sin clave, con atribución, mostrados como demostración y desactivados por defecto.",
    navigation: "Navegación de noticias",
    latestTitle: "Titulares más recientes",
    back: "← Noticias",
    h1: "Titulares en vivo de fuentes públicas",
    intro: "Esta página lee {feeds} fuentes RSS públicas y muestra el titular más reciente, un extracto corto, el medio y un enlace a la nota original. Los titulares permanecen en el idioma del medio. No se almacena nada, no se conserva texto completo, no se republica ninguna fuente y la cobertura nunca se presenta como propia.",
    disabledTitle: "NOTICIAS EN VIVO DESACTIVADAS",
    disabledBody: "No se hizo ninguna solicitud. Los titulares en vivo están apagados porque esta implementación no los habilitó.",
    disabledNote: "El laboratorio de fuentes sigue siendo sintético y sin conexión. Habilitar esta página es una variable de despliegue, no un cambio de código.",
    unavailableTitle: "NOTICIAS EN VIVO NO DISPONIBLES",
    unavailableBody: "Motivo: {reason}. No se muestra ningún titular en lugar de uno desactualizado o inventado.",
    unavailableNote: "Cada fuente falla por separado. Un tiempo de espera agotado, un error HTTP o un documento vacío se informa aquí en vez de suponerse.",
    warning: "TITULARES DE TERCEROS · SOLO ATRIBUCIÓN · SIN TEXTO COMPLETO · SIN REPUBLICACIÓN · NO ES UN RESPALDO",
    meta: "Recopilado el {time} · {count} titulares de {sources} de {feeds} fuentes · actualizado como máximo cada {minutes} minutos.",
    feedsTitle: "Estado de las fuentes en esta recopilación",
    feedsCaption: "Cada medio autorizado y lo que recibió esta recopilación",
    columnPublisher: "Medio",
    columnStatus: "Estado",
    columnHeadlines: "Titulares",
    columnReason: "Motivo",
    undated: "HORA NO INFORMADA POR LA FUENTE",
    noReason: "—",
    rightsNote: "Los titulares pertenecen a sus medios. CoinBlink enlaza la nota original y no muestra más de lo que entrega la fuente. Nada aquí crea una licencia, una suscripción ni un derecho de republicación, y la redacción sintética sigue siendo lo predeterminado.",
  }),
});

export const LIVE_NEWS_LOCALES = Object.freeze(Object.keys(LIVE_NEWS_COPY));

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
