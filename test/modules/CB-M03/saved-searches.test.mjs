import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVED_SEARCH_KEY, SAVED_SEARCH_MAX, addSavedSearch, clearSavedSearches, normalizeSavedSearch,
  readSavedSearches, removeSavedSearch, savedSearchHref,
} from '../../../src/modules/CB-M03/saved-searches.mjs';

function fakeStorage(initial) {
  const map = new Map();
  if (initial !== undefined) map.set(SAVED_SEARCH_KEY, initial);
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    raw: () => map.get(SAVED_SEARCH_KEY),
  };
}

test('a saved search keeps only query, publisher and window', () => {
  const entry = normalizeSavedSearch({ q: '  bitcoin  ', source: 'coindesk', since: '12', title: 'ignored' });
  assert.deepEqual(entry, { q: 'bitcoin', source: 'coindesk', since: 12, id: 'bitcoin|coindesk|12' });
  assert.equal(Object.isFrozen(entry), true);
  assert.equal(normalizeSavedSearch({}), null);
  assert.equal(normalizeSavedSearch(null), null);
  assert.equal(normalizeSavedSearch('bitcoin'), null);
  const fallback = normalizeSavedSearch({ q: 'etf', source: 'constructor', since: 999 });
  assert.equal(fallback.source, 'all');
  assert.equal(fallback.since, 0);
});

test('the saved link is a canonical live URL', () => {
  const entry = normalizeSavedSearch({ q: 'etf', source: 'coindesk', since: 12 });
  assert.equal(savedSearchHref(entry, 'en'), '/en/news/live?q=etf&source=coindesk&since=12');
  assert.equal(savedSearchHref(normalizeSavedSearch({ q: 'acao' }), 'pt-br'), '/pt-br/news/live?q=acao');
});

test('reading tolerates corrupt, foreign and oversized data', () => {
  assert.deepEqual(readSavedSearches(fakeStorage()), []);
  assert.deepEqual(readSavedSearches(fakeStorage('{not json')), []);
  assert.deepEqual(readSavedSearches(fakeStorage('{"q":"bitcoin"}')), []);
  assert.deepEqual(readSavedSearches(null), []);
  const oversized = JSON.stringify(Array.from({ length: SAVED_SEARCH_MAX + 5 }, (_, index) => ({
    q: 'term' + index, source: 'all', since: 0,
  })));
  const items = readSavedSearches(fakeStorage(oversized));
  assert.equal(items.length, SAVED_SEARCH_MAX);
  const duplicated = JSON.stringify([
    { q: 'bitcoin', source: 'all', since: 0 },
    { q: 'bitcoin', source: 'all', since: 0 },
    { q: '', source: 'all', since: 0 },
    null,
  ]);
  assert.deepEqual(readSavedSearches(fakeStorage(duplicated)).map((entry) => entry.id), ['bitcoin|all|0']);
});

test('adding is newest first, deduplicated and bounded', () => {
  const storage = fakeStorage();
  const first = addSavedSearch(storage, { q: 'bitcoin' });
  assert.equal(first.status, 'SAVED');
  assert.equal(first.items.length, 1);
  assert.equal(addSavedSearch(storage, { q: 'bitcoin' }).status, 'DUPLICATE');
  assert.equal(addSavedSearch(storage, {}).status, 'EMPTY');
  const second = addSavedSearch(storage, { q: 'etf', source: 'coindesk' });
  assert.deepEqual(second.items.map((entry) => entry.q), ['etf', 'bitcoin']);
  for (let index = 0; index < SAVED_SEARCH_MAX; index += 1) {
    addSavedSearch(storage, { q: 'term' + index });
  }
  assert.equal(readSavedSearches(storage).length, SAVED_SEARCH_MAX);
  assert.equal(addSavedSearch(storage, { q: 'overflow' }).status, 'FULL');
});

test('the stored payload never contains headline text', () => {
  const storage = fakeStorage();
  addSavedSearch(storage, { q: 'bitcoin', source: 'decrypt', since: 3, title: 'Secret headline' });
  const payload = JSON.parse(storage.raw());
  assert.deepEqual(Object.keys(payload[0]).sort(), ['id', 'q', 'since', 'source']);
  assert.equal(storage.raw().includes('Secret headline'), false);
});

test('removing and clearing report what happened and survive storage errors', () => {
  const storage = fakeStorage();
  const entry = addSavedSearch(storage, { q: 'bitcoin' }).items[0];
  assert.equal(removeSavedSearch(storage, 'missing').status, 'NOT_FOUND');
  assert.equal(removeSavedSearch(storage, entry.id).status, 'REMOVED');
  assert.deepEqual(readSavedSearches(storage), []);
  assert.equal(clearSavedSearches(storage).status, 'EMPTY');
  addSavedSearch(storage, { q: 'etf' });
  assert.equal(clearSavedSearches(storage).status, 'CLEARED');

  const broken = {
    getItem: () => null,
    setItem: () => { throw new Error('quota'); },
  };
  const failed = addSavedSearch(broken, { q: 'bitcoin' });
  assert.equal(failed.status, 'ERROR');
  assert.deepEqual(failed.items, []);
});
