// CB-M09-P1-ABOUT-001: localized "how it works" transparency page.
//
// Key-major so every language is visible in review. The facts on the page are
// deployment facts, not marketing copy: sources, attribution, the closed intake
// gate and what is not connected.
export const ABOUT_LOCALES = Object.freeze(["en", "pt-br", "es"]);

const COPY_ROWS = Object.freeze({
  lang: { en: "en", "pt-br": "pt-BR", es: "es" },
  pageTitle: {
    en: "CoinBlink · How it works (DEMO)",
    "pt-br": "CoinBlink · Como funciona (DEMO)",
    es: "CoinBlink · Cómo funciona (DEMO)",
  },
  pageDescription: {
    en: "What is real, what is synthetic and what is deliberately not connected in this CoinBlink demonstration.",
    "pt-br": "O que é real, o que é sintético e o que está deliberadamente desconectado nesta demonstração do CoinBlink.",
    es: "Qué es real, qué es sintético y qué está deliberadamente desconectado en esta demostración de CoinBlink.",
  },
  back: {
    en: "← Live headlines",
    "pt-br": "← Manchetes ao vivo",
    es: "← Titulares en vivo",
  },
  h1: {
    en: "How CoinBlink works",
    "pt-br": "Como o CoinBlink funciona",
    es: "Cómo funciona CoinBlink",
  },
  tag: {
    en: "DEMO · TRANSPARENCY · NO PUBLICATION",
    "pt-br": "DEMO · TRANSPARÊNCIA · SEM PUBLICAÇÃO",
    es: "DEMO · TRANSPARENCIA · SIN PUBLICACIÓN",
  },
  intro: {
    en: "CoinBlink is a labelled demonstration. This page explains what is real, what is synthetic and what is deliberately not connected.",
    "pt-br": "O CoinBlink é uma demonstração rotulada. Esta página explica o que é real, o que é sintético e o que está deliberadamente desconectado.",
    es: "CoinBlink es una demostración etiquetada. Esta página explica qué es real, qué es sintético y qué está deliberadamente desconectado.",
  },
  headlinesTitle: {
    en: "Headlines",
    "pt-br": "Manchetes",
    es: "Titulares",
  },
  headlinesBody: {
    en: "Five public RSS feeds are read. For each item the site shows the headline, a short excerpt, the publication time and a link to the original article. Headlines stay in the publisher's language. Nothing is stored and no full article is kept.",
    "pt-br": "Cinco feeds RSS públicos são lidos. De cada item, o site mostra a manchete, um trecho curto, o horário de publicação e um link para a matéria original. As manchetes permanecem no idioma do veículo. Nada é armazenado e nenhum artigo completo é mantido.",
    es: "Se leen cinco fuentes RSS públicas. De cada elemento, el sitio muestra el titular, un extracto corto, la hora de publicación y un enlace a la nota original. Los titulares permanecen en el idioma del medio. No se almacena nada y no se conserva ningún artículo completo.",
  },
  attributionTitle: {
    en: "Attribution and rights",
    "pt-br": "Atribuição e direitos",
    es: "Atribución y derechos",
  },
  attributionBody: {
    en: "Every headline names its publisher and links to the original. CoinBlink does not claim the reporting, does not republish feeds and holds no rights reference for any source.",
    "pt-br": "Cada manchete nomeia seu veículo e linka para o original. O CoinBlink não reivindica a reportagem, não republica feeds e não possui referência de direitos para nenhuma fonte.",
    es: "Cada titular nombra a su medio y enlaza al original. CoinBlink no reclama la cobertura, no republica fuentes y no tiene referencia de derechos para ninguna fuente.",
  },
  coverageTitle: {
    "en": "Cross-publisher coverage",
    "pt-br": "Cobertura entre veículos",
    "es": "Cobertura entre medios",
  },
  coverageBody: {
    "en": "When two headlines share enough significant title words, the reader notes the other publishers that carried the same story and links each one. The match is mechanical, not editorial, the publishers' text is never merged or rewritten, and the public API exposes only counts. A dedicated page lists every covered story.",
    "pt-br": "Quando dois títulos compartilham palavras significativas suficientes, o leitor indica os outros veículos que publicaram a mesma história e linka cada um. A comparação é mecânica, não editorial, o texto dos veículos nunca é fundido nem reescrito, e a API pública expõe apenas contagens. Uma página dedicada lista todas as histórias cobertas.",
    "es": "Cuando dos titulares comparten suficientes palabras significativas, el lector indica los otros medios que publicaron la misma historia y enlaza cada uno. La comparación es mecánica, no editorial, el texto de los medios nunca se fusiona ni se reescribe, y la API pública expone solo recuentos. Una página dedicada lista todas las historias cubiertas.",
  },
  localTitle: {
    "en": "What stays in your browser",
    "pt-br": "O que fica no seu navegador",
    "es": "Qué se queda en tu navegador",
  },
  localBody: {
    "en": "Saved searches and the marker that shows what arrived since your last visit live only in this browser. They are not an account, they are not sent anywhere, and clearing site data removes them. The language switch keeps the current path and filters.",
    "pt-br": "Buscas salvas e a marcação do que chegou desde a sua última visita ficam somente neste navegador. Não são uma conta, não são enviadas a lugar nenhum e apagar os dados do site as remove. O seletor de idioma mantém o caminho e os filtros atuais.",
    "es": "Las búsquedas guardadas y la marca de lo que llegó desde tu última visita se quedan solo en este navegador. No son una cuenta, no se envían a ningún lugar y borrar los datos del sitio las elimina. El selector de idioma mantiene la ruta y los filtros actuales.",
  },
  intakeTitle: {
    en: "Editorial intake",
    "pt-br": "Entrada editorial",
    es: "Entrada editorial",
  },
  intakeBody: {
    en: "Collected headlines are evaluated by the private admission gate. Because no source has an owner-approved rights reference, the gate denies every candidate; nothing is queued, approved or published.",
    "pt-br": "As manchetes coletadas são avaliadas pelo gate privado de admissão. Como nenhuma fonte tem referência de direitos aprovada pelo proprietário, o gate nega todas as candidatas; nada é enfileirado, aprovado ou publicado.",
    es: "Los titulares recopilados se evalúan en el gate privado de admisión. Como ninguna fuente tiene una referencia de derechos aprobada por el propietario, el gate rechaza todas las candidatas; nada se encola, se aprueba ni se publica.",
  },
  syntheticTitle: {
    en: "Synthetic content",
    "pt-br": "Conteúdo sintético",
    es: "Contenido sintético",
  },
  syntheticBody: {
    en: "The fictional newsroom, market panels, research desk, newsletter, placements and editorial shell use invented examples. They are labelled and never published.",
    "pt-br": "A redação fictícia, os painéis de mercado, a mesa de pesquisa, a newsletter, os espaços publicitários e o editor usam exemplos inventados. Eles são rotulados e nunca publicados.",
    es: "La redacción ficticia, los paneles de mercado, la mesa de investigación, el boletín, los espacios publicitarios y el editor usan ejemplos inventados. Están etiquetados y nunca se publican.",
  },
  notConnectedTitle: {
    en: "What is not connected",
    "pt-br": "O que não está conectado",
    es: "Lo que no está conectado",
  },
  notConnectedBody: {
    en: "This deployment has no accounts, payments, audience analytics, newsletter delivery or protected admin access. The market preview is off unless the owner enables it.",
    "pt-br": "Esta implantação não tem contas, pagamentos, analytics de audiência, envio de newsletter nem acesso administrativo protegido. O preview de mercado fica desligado a menos que o proprietário o habilite.",
    es: "Esta implementación no tiene cuentas, pagos, analítica de audiencia, envío de boletines ni acceso administrativo protegido. La vista previa de mercado está desactivada salvo que el propietario la habilite.",
  },
  linksTitle: {
    en: "Where to look next",
    "pt-br": "Para onde ir agora",
    es: "Adónde ir ahora",
  },
  coverageLink: {
    "en": "All covered stories",
    "pt-br": "Todas as histórias cobertas",
    "es": "Todas las historias cubiertas",
  },
  liveLink: { en: "Live headlines →", "pt-br": "Manchetes ao vivo →", es: "Titulares en vivo →" },
  sourcesLink: { en: "Source directory →", "pt-br": "Diretório de fontes →", es: "Directorio de fuentes →" },
  intakeLink: { en: "Private intake gate →", "pt-br": "Gate de entrada privada →", es: "Gate de entrada privada →" },
  developersLink: { en: "Developer sandbox →", "pt-br": "Sandbox de desenvolvedor →", es: "Sandbox de desarrollador →" },
  labsLink: { en: "Demo labs →", "pt-br": "Laboratórios demo →", es: "Laboratorios demo →" },
  homeLink: { en: "Home →", "pt-br": "Início →", es: "Inicio →" },
  note: {
    en: "This page describes the current demonstration, not a commercial news service.",
    "pt-br": "Esta página descreve a demonstração atual, não um serviço comercial de notícias.",
    es: "Esta página describe la demostración actual, no un servicio comercial de noticias.",
  },
});

export const ABOUT_COPY = Object.freeze(Object.fromEntries(
  ABOUT_LOCALES.map((locale) => [locale, Object.freeze(Object.fromEntries(
    Object.entries(COPY_ROWS).map(([key, row]) => [key, row[locale]]),
  ))]),
));

/** Copy for a site locale; unknown values fall back to English, never throw. */
export function getAboutCopy(locale) {
  return typeof locale === "string" && Object.hasOwn(ABOUT_COPY, locale)
    ? ABOUT_COPY[locale]
    : ABOUT_COPY.en;
}
