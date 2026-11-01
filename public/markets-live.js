// CB-M04-P1-MARKETS-LIVE-001: real-time prices over a public WebSocket.
//
// Binance is the primary public stream (it carries the 24h open, so the change
// can be computed); Coinbase is the fallback for the assets it lists. The page
// already renders a server snapshot, so this only refreshes what is on screen
// and never blocks the first paint. If both streams fail, the snapshot stays.
import { parseBinance, parseCoinbase, money } from "/markets-live-core.js";

(function () {
  "use strict";
  var BINANCE = "wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker/solusdt@miniTicker/bnbusdt@miniTicker/xrpusdt@miniTicker";
  var COINBASE = "wss://ws-feed.exchange.coinbase.com";
  var COINBASE_PAIRS = { BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD", XRP: "XRP-USD" };
  var attempts = 0;
  var socket = null;

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

  function apply(parsed) {
    if (!parsed) return;
    attempts = 0;
    paint(parsed.symbol, parsed.price, parsed.change);
  }

  function fromBinance(event) {
    try { apply(parseBinance(event.data)); } catch { /* ignore a malformed frame */ }
  }

  function fromCoinbase(event) {
    try { apply(parseCoinbase(event.data)); } catch { /* ignore a malformed frame */ }
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
    socket.addEventListener("message", fromCoinbase);
    socket.addEventListener("close", function () { retry(); });
    socket.addEventListener("error", function () { try { socket.close(); } catch { /* already closed */ } });
  }

  function connectBinance() {
    socket = new WebSocket(BINANCE);
    socket.addEventListener("message", fromBinance);
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
