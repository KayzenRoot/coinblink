import assert from "node:assert/strict";
import test from "node:test";
import { createExplorerLookup } from "../../../src/modules/CB-M01/explorer-links.mjs";

const examples = [
  ["bitcoin", "address", "1BoatSLRHtKNngkdXEeobR76b53LETtpyT", "https://mempool.space/address/"],
  ["bitcoin", "address", "bc1q" + "q".repeat(38), "https://mempool.space/address/"],
  ["bitcoin", "transaction", "a".repeat(64), "https://mempool.space/tx/"],
  ["ethereum", "address", "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe", "https://etherscan.io/address/"],
  ["ethereum", "transaction", "0x" + "a".repeat(64), "https://etherscan.io/tx/"],
  ["solana", "address", "7dGrdJRYtsNR8UYxZ3TnifXGjGc9eRYLq9sELwYpuuUu", "https://solscan.io/account/"],
  ["solana", "transaction", "uzUc9i1WChEcyuQFT5v7Bn9s4WzGnbNqg8NPyDA8r7GRpmUsctac7hLvyvbiM1Cz3GC9KZZPvKD6RMAdoroX2Aj", "https://solscan.io/tx/"],
];

test("network-specific explorer links use only three preapproved HTTPS origins", () => {
  for (const [chain, kind, value, prefix] of examples) {
    const result = createExplorerLookup(chain, kind, "  " + value + "  ");
    assert.equal(result.ok, true, `Expected compatible syntax for ${chain} ${kind}`);
    assert.equal(result.url, prefix + encodeURIComponent(value));
    assert.equal(new URL(result.url).origin, new URL(prefix).origin);
    assert.ok(Object.isFrozen(result));
  }
});

test("malformed, injected, unrecognized and oversized inputs generate no URLs", () => {
  const unsafe = [
    ["bitcoin", "transaction", "0x" + "a".repeat(64)],
    ["ethereum", "address", "javascript:alert(1)"],
    ["ethereum", "address", "0x" + "A".repeat(39)],
    ["solana", "address", "0OIl" + "A".repeat(36)],
    ["bitcoin", "address", "bc1qinvalid$$$"],
    ["bitcoin", "address", "bc1Q" + "q".repeat(38)],
    ["solana", "transaction", "A".repeat(44)],
    ["unknown", "address", "A".repeat(44)],
    ["bitcoin", "balance", "a".repeat(64)],
    ["solana", "address", "/tx/foo?to=https://evil.example"],
    ["ethereum", "transaction", "a".repeat(200)],
    ["ethereum", "transaction", "<script>alert(1)</script>"],
    ["solana", "address", "PRIVATE KEY: a".repeat(30)],
  ];
  for (const args of unsafe) {
    const result = createExplorerLookup(...args);
    assert.equal(result.ok, false, JSON.stringify(args));
    assert.equal("url" in result, false);
  }
  assert.equal(createExplorerLookup("ethereum", "address", null).ok, false);
});

test("syntactic lookup never pretends an identifier exists or is confirmed", () => {
  const result = createExplorerLookup("ethereum", "transaction", "0x" + "f".repeat(64));
  assert.deepEqual(Object.keys(result).sort(), ["ok", "provider", "url"]);
});
