// CB-M04-P1-MARKETS-LIVE-001: real-time prices over a public WebSocket.
//
// Binance is the primary public stream (it carries the 24h open, so the change
// can be computed); Coinbase is the fallback for the assets it lists. The page
// already renders a server snapshot, so this only refreshes what is on screen
// and never blocks the first paint. If both streams fail, the snapshot stays.
(function () {
  "use strict";
  var BINANCE = "wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker/solustd@miniTicker/bnbusdt@miniTicker/xrpusdt@miniTicker";
  var COINBASE = "wss://ws-feed.exchange.coinbase.com";
  var COINBASE_PAIRS = { BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD", XRP: "XRP-USD" };
  var attempts = 0;
  var socket = null;

  function money(value) {
    var digits = value >= 1000 ? 0 : value >= 1 ? 2 : 4;
    return "$" + value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function paint(symbol, price, changePercent) {
    var rows = document.querySelectorAll('[data-live-symbol="' + symbol + '"]');
    for (var index = 0; index < rows.length; index += 1) {
      var priceNode = rows[index].querySelector("[data-live-price]");
      if (priceNode) priceNode.textContent = money(price);
      var changeNode = rows[index].querySelector("[data-live-change]");
      if (changeNode && typeof changePercent === "number" && isFinite(changePercent)) {
        changeNode.textContent = (changePercent >= 0 ? "+" : "") + changePercent.toFixed(2) + "%";
        changeNode.className = "live-change " + (changePercent >= 0 ? "is-up" : "is-down");
      }
    }
  }

  function fromBinance(event) {
    var payload = JSON.parse(event.data);
    var data = payload && payload.data ? payload.data : null;
    if (!data || typeof data.s !== "string") return;
    var symbol = data.s.replace("USDT", "");
    var close = Number(data.c);
    var open = Number(data.o);
    if (!isFinite(close) || close <= 0) return;
    paint(symbol, close, open > 0 ? ((close - open) / open) * 100 : null);
  }

  function fromCoinbase(event) {
    var payload = JSON.parse(event.data);
    if (!payload || payload.type !== "ticker" || typeof payload.product_id !== "string") return;
    var symbol = payload.product_id.replace("-USD", "");
    var price = Number(payload.price);
    if (!isFinite(price) || price <= 0) return;
    var open = Number(payload.open_24h);
    paint(symbol, price, isFinite(open) && open > 0 ? ((price - open) / open) * 100 : null);
  }

  function connectCoinbase() {
    socket = new WebSocket(COINBASE);
    socket.addEventListener("open", function () {
      socket.send(JSON.stringify({
        type: "subscribe",
        product_ids: Object.keys(COINBASE_PAIRS).map(function (key) { return COINBASE_PAIRS[key]; }),
        channels: ["ticker"],
      }));
    });
    socket.addEventListener("message", function (event) {
      try { fromCoinbase(event); } catch { /* ignore a malformed frame */ }
    });
    socket.addEventListener("close", function () { retry(); });
    socket.addEventListener("error", function () { try { socket.close(); } catch { /* already closed */ } });
  }

  function connectBinance() {
    socket = new WebSocket(BINANCE);
    socket.addEventListener("message", function (event) {
      try { fromBinance(event); } catch { /* ignore a malformed frame */ }
    });
    socket.addEventListener("error", function () { try { socket.close(); } catch { /* already closed */ } });
    socket.addEventListener("close", function () { connectCoinbase(); });
  }

  function retry() {
    attempts += 1;
    if (attempts > 3) return;
    setTimeout(connectBinance, 2000 * attempts);
  }

  if (typeof WebSocket !== "function") return;
  if (!document.querySelector("[data-live-symbol]")) return;
  connectBinance();
})();
