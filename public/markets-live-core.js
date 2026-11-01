// CB-M04-P1-MARKETS-LIVE-001: pure helpers for the real-time price stream.
// Kept separate from the DOM script so they can be unit tested in Node.

export function money(value) {
  const digits = value >= 10000 ? 0 : value >= 1 ? 2 : 4;
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function changePercent(close, open) {
  return Number.isFinite(close) && Number.isFinite(open) && open > 0 ? ((close - open) / open) * 100 : null;
}

/** Binance combined stream frame: { data: { s, c, o } }. */
export function parseBinance(raw) {
  const payload = JSON.parse(raw);
  const data = payload && payload.data ? payload.data : null;
  if (!data || typeof data.s !== "string") return null;
  const symbol = data.s.replace("USDT", "");
  const close = Number(data.c);
  if (!Number.isFinite(close) || close <= 0) return null;
  return { symbol, price: close, change: changePercent(close, Number(data.o)) };
}

/** Coinbase ticker frame: { type: "ticker", product_id, price, open_24h }. */
export function parseCoinbase(raw) {
  const payload = JSON.parse(raw);
  if (!payload || payload.type !== "ticker" || typeof payload.product_id !== "string") return null;
  const price = Number(payload.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    symbol: payload.product_id.replace("-USD", ""),
    price,
    change: changePercent(price, Number(payload.open_24h)),
  };
}
