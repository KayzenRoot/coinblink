// First-party outbound directory, not an RSS feed or a publication pipeline.
// URLs are manually verified official publisher endpoints, not article licensing grants.
// [id, publisher, type, englishURL, portugueseURL, englishScope, portugueseScope]
const OFFICIAL_SOURCE_ROWS = Object.freeze([
  ["bitcoin-core", "Bitcoin Core", "protocol", "https://bitcoincore.org/en/blog/", "https://bitcoincore.org/en/blog/", "Software releases and protocol security updates.", "Lançamentos do software e atualizações de segurança do protocolo."],
  ["ethereum-foundation", "Ethereum Foundation", "protocol", "https://blog.ethereum.org/archive", "https://blog.ethereum.org/pt-br/archive", "Original research, protocol and ecosystem posts.", "Publicações sobre pesquisas, protocolo e ecossistema. O arquivo em português é parcial."],
  ["solana", "Solana", "ecosystem", "https://solana.com/news", "https://solana.com/news", "Official ecosystem and developer announcements.", "Anúncios do ecossistema e de desenvolvedores publicados em inglês."],
  ["chainlink", "Chainlink", "ecosystem", "https://chain.link/newsroom", "https://chain.link/newsroom", "Project press announcements and integrations.", "Comunicados e anúncios de integrações do projeto, em inglês."],
  ["sec", "U.S. SEC", "regulation", "https://www.sec.gov/newsroom", "https://www.sec.gov/newsroom", "U.S. securities regulator newsroom, not crypto-only.", "Sala de notícias do regulador de valores mobiliários dos EUA. Não é exclusiva de cripto."],
  ["cftc", "U.S. CFTC", "regulation", "https://www.cftc.gov/PressRoom/PressReleases", "https://www.cftc.gov/PressRoom/PressReleases", "U.S. commodities regulator press releases, not crypto-only.", "Comunicados do regulador de derivativos dos EUA. Não são exclusivos de cripto."],
]);
const ALLOWED_HOSTS = new Set([
  "bitcoincore.org", "blog.ethereum.org", "solana.com",
  "chain.link", "www.sec.gov", "www.cftc.gov",
]);
export function getOfficialSources(locale = "en") {
  const pt = locale === "pt-br";
  return OFFICIAL_SOURCE_ROWS.map((row) => {
    const url = row[pt ? 4 : 3];
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
      description: row[pt ? 6 : 5],
    });
  });
}
