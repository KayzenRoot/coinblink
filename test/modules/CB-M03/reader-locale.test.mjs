import test from 'node:test';
import assert from 'node:assert/strict';
import {
  READER_LOCALES,
  readerLocaleLabel,
  readerLocaleLinks,
  readerLocaleName,
  readerLocaleTag,
} from '../../../src/modules/CB-M03/reader-locale.mjs';

test('the switch rewrites only the locale segment and keeps the query string', () => {
  assert.deepEqual([...READER_LOCALES], ['en', 'pt-br', 'es']);
  const links = readerLocaleLinks('en', '/en/news/live', '?q=bitcoin&since=24');
  assert.deepEqual(links, {
    'en': '/en/news/live?q=bitcoin&since=24',
    'pt-br': '/pt-br/news/live?q=bitcoin&since=24',
    'es': '/es/news/live?q=bitcoin&since=24',
  });
  assert.equal(Object.isFrozen(links), true);
});

test('nested routes and locale roots keep their shape', () => {
  assert.equal(readerLocaleLinks('pt-br', '/pt-br/news/source/coindesk')['es'],
    '/es/news/source/coindesk');
  assert.equal(readerLocaleLinks('es', '/es/news/coverage', '?source=decrypt')['en'],
    '/en/news/coverage?source=decrypt');
  assert.equal(readerLocaleLinks('en', '/en')['pt-br'], '/pt-br');
  assert.equal(readerLocaleLinks('en', '/en/')['es'], '/es/');
});

test('unknown locales, foreign paths and malformed searches fail closed', () => {
  assert.throws(() => readerLocaleLinks('en', '/pt-br/news/live'), TypeError);
  assert.throws(() => readerLocaleLinks('en', 'news/live'), TypeError);
  assert.equal(readerLocaleLinks('en', '/en/news/live', 'q=1')['pt-br'], '/pt-br/news/live');
  assert.equal(readerLocaleTag('xx'), 'en');
  assert.equal(readerLocaleName('xx'), 'English');
  assert.equal(readerLocaleLabel('xx'), 'Language');
});

test('the switch is localized and names every language in itself', () => {
  assert.equal(readerLocaleLabel('en'), 'Language');
  assert.equal(readerLocaleLabel('pt-br'), 'Idioma');
  assert.equal(readerLocaleLabel('es'), 'Idioma');
  assert.equal(readerLocaleName('en'), 'English');
  assert.equal(readerLocaleName('pt-br'), 'Português (Brasil)');
  assert.equal(readerLocaleName('es'), 'Español');
  assert.equal(readerLocaleTag('pt-br'), 'pt-BR');
});
