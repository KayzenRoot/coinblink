// First-party outbound directory, not an RSS feed or a publication pipeline.
// URLs are manually verified official publisher endpoints, not article licensing grants.
// [id, publisher, type, englishURL, portugueseURL, englishScope, portugueseScope, spanishScope]
const OFFICIAL_SOURCE_ROWS = Object.freeze([
  ["bitcoin-core", "Bitcoin Core", "protocol", "https://bitcoincore.org/en/blog/", "https://bitcoincore.org/en/blog/", "Software releases and protocol security updates.", "Lançamentos do software e atualizações de segurança do protocolo.", "Lanzamientos de software y actualizaciones de seguridad del protocolo."],
  ["ethereum-foundation", "Ethereum Foundation", "protocol", "https://blog.ethereum.org/archive", "https://blog.ethereum.org/pt-br/archive", "Original research, protocol and ecosystem posts.", "Publicações sobre pesquisas, protocolo e ecossistema. O arquivo em português é parcial.", "Publicaciones sobre investigación, protocolo y ecosistema."],
  ["solana", "Solana", "ecosystem", "https://solana.com/news", "https://solana.com/news", "Official ecosystem and developer announcements.", "Anúncios do ecossistema e de desenvolvedores publicados em inglês.", "Anuncios oficiales del ecosistema y de desarrolladores, publicados en inglés."],
  ["chainlink", "Chainlink", "ecosystem", "https://chain.link/newsroom", "https://chain.link/newsroom", "Project press announcements and integrations.", "Comunicados e anúncios de integrações do projeto, em inglês.", "Comunicados de prensa y anuncios de integraciones del proyecto, en inglés."],
  ["sec", "U.S. SEC", "regulation", "https://www.sec.gov/newsroom", "https://www.sec.gov/newsroom", "U.S. securities regulator newsroom, not crypto-only.", "Sala de notícias do regulador de valores mobiliários dos EUA. Não é exclusiva de cripto.", "Sala de prensa del regulador de valores de EE. UU. No es exclusiva de cripto."],
  ["cftc", "U.S. CFTC", "regulation", "https://www.cftc.gov/PressRoom/PressReleases", "https://www.cftc.gov/PressRoom/PressReleases", "U.S. commodities regulator press releases, not crypto-only.", "Comunicados do regulador de derivativos dos EUA. Não são exclusivos de cripto.", "Comunicados del regulador de derivados de EE. UU. No son exclusivos de cripto."],
]);
const ALLOWED_HOSTS = new Set([
  "bitcoincore.org", "blog.ethereum.org", "solana.com",
  "chain.link", "www.sec.gov", "www.cftc.gov",
]);
const URL_COLUMN = Object.freeze({ en: 3, "pt-br": 4, es: 3 });
const SCOPE_COLUMN = Object.freeze({ en: 5, "pt-br": 6, es: 7 });
const column = (columns, locale, fallback) =>
  Object.hasOwn(columns, locale) ? columns[locale] : fallback;

export function getOfficialSources(locale = "en") {
  const urlIndex = column(URL_COLUMN, locale, 3);
  const scopeIndex = column(SCOPE_COLUMN, locale, 5);
  return OFFICIAL_SOURCE_ROWS.map((row) => {
    const url = row[urlIndex];
    const target = new URL(url);
    if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
      throw new Error("Official source URL is not allowlisted");
    }
    return Object.freeze({
      id: row[0],
      name: row[1],
      type: row[2],
      url: target.href,
      host: target.hostname,
      description: row[scopeIndex],
    });
  });
}
