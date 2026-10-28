import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HOME_LOCALES, translateHome } from '../../../src/modules/CB-M01/home-copy.mjs';

const component = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
const keys = [...new Set([...component.matchAll(/t\("([^"]+)"\)/gu)].map((match) => match[1]))];
// Protocol names and one neutral label are legitimately identical in Spanish.
const UNCHANGED = new Set(['Bitcoin', 'Ethereum', 'Altcoins', 'DeFi', 'NFTs', 'Web3', 'Radar 24h', 'Neutral']);

test('the home copy covers every rendered string in three languages', () => {
  assert.deepEqual([...HOME_LOCALES].sort(), ['en', 'es', 'pt-br']);
  assert.ok(keys.length >= 120, 'expected the full set of home strings, found ' + keys.length);
  for (const key of keys) {
    assert.equal(translateHome(key, 'en'), key);
    for (const locale of ['pt-br', 'es']) {
      const value = translateHome(key, locale);
      assert.equal(typeof value, 'string', key + ' ' + locale);
      assert.ok(value.trim().length > 0, key + ' ' + locale);
      if (!UNCHANGED.has(key)) {
        assert.notEqual(value, key, key + ' needs a ' + locale + ' translation');
      }
    }
  }
});

test('unknown strings and prototype names fall back to English', () => {
  assert.equal(translateHome('A string that is not in the table', 'es'), 'A string that is not in the table');
  assert.equal(translateHome('constructor', 'pt-br'), 'constructor');
  assert.equal(translateHome('__proto__', 'es'), '__proto__');
  assert.equal(translateHome('Home', 'fr'), 'Home');
  assert.equal(translateHome('Home'), 'Home');
});
