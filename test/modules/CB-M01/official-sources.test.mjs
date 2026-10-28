import assert from "node:assert/strict";
import test from "node:test";
import { getOfficialSources } from "../../../src/modules/CB-M01/official-sources.mjs";

const approvedHosts = new Set([
  "bitcoincore.org", "blog.ethereum.org", "solana.com",
  "chain.link", "www.sec.gov", "www.cftc.gov",
]);

test("official source directory is finite, immutable and contains only approved HTTPS publisher endpoints", () => {
  for (const locale of ["en", "pt-br", "es"]) {
    const sources = getOfficialSources(locale);
    assert.equal(sources.length, 6);
    assert.equal(new Set(sources.map((entry) => entry.id)).size, sources.length);
    assert.equal(new Set(sources.map((entry) => entry.host)).size, sources.length);
    for (const source of sources) {
      const url = new URL(source.url);
      assert.ok(Object.isFrozen(source));
      assert.equal(url.protocol, "https:");
      assert.equal(url.hostname, source.host);
      assert.ok(approvedHosts.has(source.host));
      assert.equal(url.username, "");
      assert.equal(url.password, "");
      assert.equal(url.hash, "");
      assert.equal(url.search, "");
      assert.ok(source.description.length > 22);
      assert.match(source.id, /^[a-z-]+$/u);
      assert.ok(["protocol", "ecosystem", "regulation"].includes(source.type));
    }
  }
});

test("locale-specific Ethereum original archive is partial and other publishers remain external English sources", () => {
  const en = getOfficialSources("en");
  const pt = getOfficialSources("pt-br");
  const es = getOfficialSources("es");
  assert.deepEqual(en.map(({ id }) => id), es.map(({ id }) => id));
  assert.match(es.find(({ id }) => id === "sec").description, /regulador de valores/u);
  assert.deepEqual(en.map(({ id }) => id), pt.map(({ id }) => id));
  assert.deepEqual(en, getOfficialSources("other"));
  const ef = pt.find(({ id }) => id === "ethereum-foundation");
  assert.ok(ef.url.endsWith("/pt-br/archive"));
  assert.match(ef.description, /parcial/u);
  for (const source of pt.filter(({ id }) => id !== "ethereum-foundation")) {
    assert.equal(source.url, en.find(({ id }) => id === source.id).url);
  }
});
