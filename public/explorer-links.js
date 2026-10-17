// Read-only explorer destinations. Format checks are NOT checksum, ownership,
// authenticity, balance, transaction status or confirmation checks.
const BASE58 = "[1-9A-HJ-NP-Za-km-z]";
const EXPLORERS = Object.freeze({
  bitcoin: Object.freeze({ hostname: "mempool.space", base: "https://mempool.space", addressPath: "/address/", transactionPath: "/tx/" }),
  ethereum: Object.freeze({ hostname: "etherscan.io", base: "https://etherscan.io", addressPath: "/address/", transactionPath: "/tx/" }),
  solana: Object.freeze({ hostname: "solscan.io", base: "https://solscan.io", addressPath: "/account/", transactionPath: "/tx/" }),
});
const BITCOIN_BASE58_ADDRESS = new RegExp("^[13]" + BASE58 + "{25,34}$", "u");
const BITCOIN_BECH32_ADDRESS = /^bc1[ac-hj-np-z02-9]{11,87}$/u;
const SOLANA_ADDRESS = new RegExp("^" + BASE58 + "{32,44}$", "u");
const SOLANA_SIGNATURE = new RegExp("^" + BASE58 + "{80,90}$", "u");
const ETHEREUM_ADDRESS = /^0x[a-fA-F0-9]{40}$/u;
const ETHEREUM_TRANSACTION = /^0x[a-fA-F0-9]{64}$/u;
const BITCOIN_TRANSACTION = /^[a-fA-F0-9]{64}$/u;

export function createExplorerLookup(network, kind, rawValue) {
  if (!Object.hasOwn(EXPLORERS, network) || !["address", "transaction"].includes(kind)) {
    return Object.freeze({ ok: false, error: "selection" });
  }
  if (typeof rawValue !== "string" || rawValue.length > 140) {
    return Object.freeze({ ok: false, error: "format" });
  }
  const value = rawValue.trim();
  if (!value || value.length > 110) return Object.freeze({ ok: false, error: "format" });
  const matches = network === "bitcoin"
    ? kind === "address"
      ? BITCOIN_BASE58_ADDRESS.test(value) || BITCOIN_BECH32_ADDRESS.test(value)
      : BITCOIN_TRANSACTION.test(value)
    : network === "ethereum"
      ? kind === "address" ? ETHEREUM_ADDRESS.test(value) : ETHEREUM_TRANSACTION.test(value)
      : kind === "address" ? SOLANA_ADDRESS.test(value) : SOLANA_SIGNATURE.test(value);
  if (!matches) return Object.freeze({ ok: false, error: "format" });
  const provider = EXPLORERS[network];
  const prefix = kind === "address" ? provider.addressPath : provider.transactionPath;
  const url = new URL(prefix + encodeURIComponent(value), provider.base);
  if (url.protocol !== "https:" || url.hostname !== provider.hostname) {
    return Object.freeze({ ok: false, error: "destination" });
  }
  return Object.freeze({ ok: true, url: url.href, provider: provider.hostname });
}
