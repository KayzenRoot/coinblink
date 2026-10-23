import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockResearchTransfer, canonicalMockResearchTransfers,
  parseMockResearchTransfer, formatMockResearchNote, MAX_MOCK_RESEARCH_BYTES }
  from '../../../src/modules/CB-M08/research-transfer.mjs';
import { buildMockResearchBrief } from '../../../src/modules/CB-M08/research-desk.mjs';

test('M08 exposes nine canonical immutable offline source/market transfer packets', () => {
  const catalog = canonicalMockResearchTransfers();
  assert.equal(catalog.length, 9);
  assert.ok(Object.isFrozen(catalog) && catalog.every(Object.isFrozen));
  for (const row of catalog) {
    const raw = JSON.stringify(row);
    assert.ok(Buffer.byteLength(raw) <= MAX_MOCK_RESEARCH_BYTES);
    assert.deepEqual(parseMockResearchTransfer(raw, catalog), row);
    assert.ok(Object.isFrozen(row.blockers) && row.blockers.every(Object.isFrozen));
    assert.deepEqual(row.blockers.map(b => b.code),
      buildMockResearchBrief(row.sourceId, row.asset).brief.blockers.map(b => b.code));
    assert.deepEqual([row.quote,row.mode,row.rights], [null,'MOCK','NOT_CLEARED']);
    for (const flag of ['marketLive','publiclyUsable','verified','generatedByAI','published']) {
      assert.equal(row[flag], false);
    }
    const original = 'Private Owner text';
    const note = formatMockResearchNote(row, original);
    assert.match(note, /^Private Owner text\n\n\[COINBLINK M08 OFFLINE MOCK RESEARCH/u);
    assert.match(note, /NO FACT CHECK, LIVE QUOTES, AI OR PUBLICATION/u);
    assert.equal(formatMockResearchNote(row,note), null);
  }
});

test('M08 rejects forgery of blockers, license, source IDs, rights and all LIVE flags', () => {
  const catalog = canonicalMockResearchTransfers(), row = catalog[0];
  const forged = [
    {...row, rights:'CLEARED'}, {...row, mode:'LIVE'},
    {...row, quote:123.45}, {...row, verified:true},
    {...row, marketLive:true}, {...row, publiclyUsable:true},
    {...row, generatedByAI:true}, {...row, published:true},
    {...row, sourceId:'demo-source-evil'}, {...row, asset:'DOGE'},
    {...row, version:2}, {...row, sourceLabel:'<img src=x onerror=alert(1)>'},
    {...row, blockerCount:0}, {...row, blockers:[]},
    {...row, blockers:row.blockers.map((v,i) => i===0 ? {...v,state:'ALLOWED'} : v)},
    {...row, extra:'OWNER_APPROVED'},
  ];
  for(const packet of forged)assert.equal(parseMockResearchTransfer(JSON.stringify(packet),catalog),null);
  for(const raw of ['', 'null', '{}', '[]', '{bad','x'.repeat(4097),
    '{"__proto__":{"admin":true}}']) {
    assert.equal(parseMockResearchTransfer(raw,catalog),null);
  }
  assert.equal(parseMockResearchTransfer(JSON.stringify(row),[]),null);
  assert.throws(()=>createMockResearchTransfer('unknown','BTC'));
  assert.throws(()=>createMockResearchTransfer('demo-source-alpha','BTC/USD'));
});

test('M08 private unsaved warning cannot repeat or exceed CMS text bounds', () => {
  const row = canonicalMockResearchTransfers()[0];
  assert.equal(formatMockResearchNote(row,'x'.repeat(39999)),null);
  assert.equal(formatMockResearchNote({...row,verified:true},'hello'),null);
  const raw = JSON.stringify(row);
  assert.match(formatMockResearchNote(row,''),/^\[COINBLINK M08 OFFLINE MOCK/u);
  assert.equal(JSON.stringify(row),raw,'formatting never modifies original packet');
});
