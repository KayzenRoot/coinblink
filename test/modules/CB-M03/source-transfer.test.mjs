import assert from 'node:assert/strict';
import test from 'node:test';
import { listSyntheticSources } from '../../../src/modules/CB-M03/source-lab.mjs';
import { createMockSourceTransfer, parseMockSourceTransfer } from '../../../src/modules/CB-M03/source-transfer.mjs';

const rows = listSyntheticSources().items;
test('M03 source transfer handles only the three canonical synthetic specimens', () => {
  assert.equal(rows.length, 3);
  for (const row of rows) {
    const packet = createMockSourceTransfer(row);
    const restored = parseMockSourceTransfer(JSON.stringify(packet), rows);
    assert.equal(restored.id, row.id);
    assert.equal(restored.sourceUrl, row.originUrl);
    assert.equal(restored.rights, 'NOT_CLEARED');
    assert.equal(restored.publiclyUsable, false);
    assert.equal(packet.capture, 'NOT_CAPTURED');
    assert.equal(packet.digest, 'NO_DIGEST');
    assert.equal(packet.mode, 'MOCK');
    assert.equal(Object.isFrozen(packet), true);
    assert.equal(Object.isFrozen(restored), true);
  }
});

test('M03 transfer never accepts untrusted rights, new identifiers or altered source URLs', () => {
  const origin = createMockSourceTransfer(rows[0]);
  const invalid = [
    { ...origin, rights: 'CLEARED' }, { ...origin, publiclyUsable: true },
    { ...origin, licensing: 'APPROVED' }, { ...origin, mode: 'LIVE' },
    { ...origin, version: 2 }, { ...origin, capture: 'CAPTURED' },
    { ...origin, digest: 'FAKE_DIGEST' }, { ...origin, status: 'AVAILABLE' },
    { ...origin, id: 'demo-source-delta' }, { ...origin, id: rows[1].id },
    { ...origin, originUrl: 'https://attacker.example.test/' },
    { ...origin, originUrl: 'http://feed.example.test/articles/001' },
    { ...origin, label: '<img src=x onerror=alert(1)>' },
    { ...origin, injectedPermission: true },
  ];
  for (const packet of invalid) assert.equal(parseMockSourceTransfer(JSON.stringify(packet), rows), null);
  for (const raw of ['[]', '{}', 'null', '{invalid', '', 'x'.repeat(2049),
    JSON.stringify({ __proto__: { admin: true } })]) {
    assert.equal(parseMockSourceTransfer(raw, rows), null);
  }
  assert.equal(parseMockSourceTransfer(JSON.stringify(origin), []), null);
  assert.equal(parseMockSourceTransfer(JSON.stringify(origin), [{...rows[0], licensing:'APPROVED'}, ...rows.slice(1)]), null);
  assert.throws(() => createMockSourceTransfer({...rows[0], licensing:'APPROVED'}));
});

test('M03 transfer parser is side-effect-free and never creates privileged routes', () => {
  const before = structuredClone(rows);
  const packet = createMockSourceTransfer(rows[2]);
  parseMockSourceTransfer(JSON.stringify(packet), rows);
  assert.deepEqual(rows, before);
  assert.equal(packet.publiclyUsable, false);
});
