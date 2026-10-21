// Fictional P0 specimens only. English identifiers and source data remain canonical.
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
  en: Object.freeze({
    directoryTitle: "Fictional news discovery",
    disclaimer: "DEMO ONLY · INVENTED STORIES · NOT PUBLISHED",
    explanation: "Explore imaginary educational scenarios. No live news, prices, private drafts, or external requests.",
    home: "Home", list: "All fictional stories", search: "Search fictional examples",
    searchHint: "Search a headline or topic", category: "Example category",
    resetFilters: "Clear filters",
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
  if (locale !== "pt-br") return item;
  const translated = pt[item.slug];
  return translated ? { ...item, ...translated } : item;
}
