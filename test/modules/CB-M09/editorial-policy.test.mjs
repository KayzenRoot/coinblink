import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/modules/CB-M09/EditorialPolicy.astro', 'utf8');

test('the policy states what the pipeline actually does', () => {
  for (const marker of [
    'do not copy their paragraphs', 'citation to that source with its https link',
    'written by Workers AI', 'invent no numbers, dates, names or quotes',
    'Nothing reaches the public without the owner publishing it',
    'CoinBlink AI draft', 'answering 410', 'revision',
  ]) {
    assert.ok(page.includes(marker), marker);
  }
});

test('it is honest about what CoinBlink does not do', () => {
  assert.match(page, /do not give investment advice/u);
  assert.match(page, /word count over collected titles, not a market measure/u);
});

test('the three locales exist and the Spanish page defers to English', () => {
  for (const locale of ['en', 'pt-br', 'es']) {
    const route = readFileSync('src/pages/' + locale + '/editorial.astro', 'utf8');
    assert.match(route, new RegExp('locale="' + locale + '"', 'u'));
  }
  assert.match(page, /Prevalece la versión en inglés/u);
});

test('the home footer links the policy', () => {
  const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
  assert.match(home, /l\("\/en\/editorial", "\/pt-br\/editorial", "\/es\/editorial"\)/u);
});
