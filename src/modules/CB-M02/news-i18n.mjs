// Fictional P0 specimens only. English identifiers and source data remain canonical.
const es = Object.freeze({
  "demo-wallet-safety": Object.freeze({
    title: "Taller ficticio sobre seguridad de billeteras",
    summary: "Escenario inventado para practicar la lectura de un artículo educativo. No ocurrió ningún evento real.",
    body: "En este ejercicio imaginario, se comparan opciones de recuperación sin utilizar claves reales.",
  }),
  "demo-protocol-classroom": Object.freeze({
    title: "Aula imaginaria sobre protocolos",
    summary: "Demostración ficticia de cómo se explicaría un protocolo. No es un anuncio auténtico.",
    body: "Una clase inventada examina confirmaciones de red. No representa ninguna noticia real.",
  }),
  "demo-chain-basics": Object.freeze({
    title: "Tutorial de registros ficticios",
    summary: "Ejemplo educativo sintético, sin precios ni noticias reales de criptoactivos.",
    body: "Un registro inventado permite explorar estados hipotéticos de transacciones de forma segura.",
  }),
});

const pt = Object.freeze({
  "demo-wallet-safety": Object.freeze({
    title: "Oficina fictícia de segurança de carteiras",
    summary: "Cenário inventado para testar a navegação de um artigo educativo. Nenhum evento ocorreu.",
    body: "Neste exercício imaginário, leitores comparam opções de recuperação sem utilizar chaves reais.",
  }),
  "demo-protocol-classroom": Object.freeze({
    title: "Sala de aula imaginária sobre protocolos",
    summary: "Demonstração fictícia de como uma explicação sobre protocolos pode aparecer.",
    body: "Uma aula inventada explora confirmações de rede. Isto não é um anúncio real.",
  }),
  "demo-chain-basics": Object.freeze({
    title: "Tutorial de registros fictícios",
    summary: "Exemplo didático sintético, não é notícia nem preço real de criptoativos.",
    body: "Um registro inventado permite explorar estados hipotéticos de transações.",
  }),
});
const copies = Object.freeze({
  es: Object.freeze({
    directoryTitle: "Explorar noticias ficticias",
    disclaimer: "SOLO DEMOSTRACIÓN · HISTORIAS INVENTADAS · NO PUBLICADAS",
    explanation: "Explora escenarios educativos imaginarios. No hay noticias ni precios en vivo, borradores privados o solicitudes externas.",
    home: "Inicio (EN)", list: "Todas las historias ficticias", search: "Buscar ejemplos ficticios",
    searchHint: "Busca un título o tema", category: "Categoría del ejemplo",
    resetFilters: "Borrar filtros",
    topicTitle: "Explorar temas educativos ficticios",
    topicExplanation: "Elige un tema de este ejercicio sin conexión. No se consultan noticias reales.",
    exploreTopic: "Explorar tema ficticio",
    readingPath: "Ruta de lectura ficticia", step: "Ejemplo", of: "de",
    pathDisclaimer: "Ejercicios sin conexión, no noticias reales",
    previousExample: "Ejemplo ficticio anterior", nextExample: "Siguiente ejemplo ficticio",
    pathStart: "Inicio de la ruta", pathEnd: "Fin de la ruta",
    all: "Todos los ejemplos", security: "Seguridad", protocol: "Protocolos", education: "Educación",
    results: "ejemplos ficticios", empty: "No hay ejemplos ficticios coincidentes. No se hicieron búsquedas externas.",
    read: "Leer ejemplo ficticio", back: "Volver a las historias ficticias",
    missingTitle: "Ejemplo ficticio no encontrado",
    missing: "Este ejemplo no existe. No se ha accedido a ninguna noticia real ni borrador privado.",
    detailDisclaimer: "EJEMPLO INVENTADO · NUNCA PUBLICADO COMO NOTICIA",
  }),
  en: Object.freeze({
    directoryTitle: "Fictional news discovery",
    disclaimer: "DEMO ONLY · INVENTED STORIES · NOT PUBLISHED",
    explanation: "Explore imaginary educational scenarios. No live news, prices, private drafts, or external requests.",
    home: "Home", list: "All fictional stories", search: "Search fictional examples",
    searchHint: "Search a headline or topic", category: "Example category",
    resetFilters: "Clear filters",
    topicTitle: "Explore fictional learning topics",
    topicExplanation: "Select a theme for this offline exercise. No real news is requested.",
    exploreTopic: "Explore fictional topic",
    readingPath: "Fictional reading path", step: "Example", of: "of",
    pathDisclaimer: "Offline lessons, not real reporting",
    previousExample: "Previous fictional example", nextExample: "Next fictional example",
    pathStart: "Start of the learning path", pathEnd: "End of the learning path",
    all: "All examples", security: "Security", protocol: "Protocols", education: "Education",
    results: "fictional examples", empty: "No fictional examples match. No external search was made.",
    read: "Read fictional example", back: "Back to fictional stories",
    missingTitle: "Fictional example not found",
    missing: "This example does not exist. No public article or private draft was accessed.",
    detailDisclaimer: "INVENTED EXAMPLE · NEVER PUBLISHED NEWS",
  }),
  "pt-br": Object.freeze({
    directoryTitle: "Explorar notícias fictícias",
    disclaimer: "SOMENTE DEMO · HISTÓRIAS INVENTADAS · NÃO PUBLICADAS",
    explanation: "Explore cenários educativos imaginários. Sem notícias, preços, rascunhos privados ou chamadas externas.",
    home: "Início", list: "Todas as histórias fictícias", search: "Pesquisar exemplos fictícios",
    searchHint: "Pesquise um título ou assunto", category: "Categoria do exemplo",
    resetFilters: "Limpar filtros",
    pathEnd: "Fim do percurso",
    previousExample: "Exemplo fictício anterior",
    step: "Exemplo", of: "de",
    topicExplanation: "Escolha um tema desta atividade offline. Nenhuma notícia real será buscada.",
    pathStart: "Início do percurso",
    exploreTopic: "Explorar tema fictício",
    pathDisclaimer: "Exercícios offline, não são notícias reais",
    nextExample: "Próximo exemplo fictício",
    topicTitle: "Explorar temas educativos fictícios",
    readingPath: "Percurso de leitura fictícia",
    all: "Todos os exemplos", security: "Segurança", protocol: "Protocolos", education: "Educação",
    results: "exemplos fictícios", empty: "Nenhum exemplo fictício encontrado. Não houve busca externa.",
    read: "Ler exemplo fictício", back: "Voltar às histórias fictícias",
    missingTitle: "Exemplo fictício não encontrado",
    missing: "Este exemplo não existe. Nenhum artigo público ou rascunho privado foi acessado.",
    detailDisclaimer: "EXEMPLO INVENTADO · NUNCA PUBLICADO COMO NOTÍCIA",
  }),
});
export function newsCopy(locale = "en") {
  return copies[locale] ?? copies.en;
}
export function localizeMockNews(item, locale = "en") {
  if (!item) return null;
  const translated = locale === "pt-br" ? pt[item.slug] : locale === "es" ? es[item.slug] : null;
  return translated ? { ...item, ...translated } : item;
}
