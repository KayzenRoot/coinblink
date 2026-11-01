import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/modules/CB-M09/LegalPage.astro', 'utf8');

test('the legal page states the facts the system actually implements', () => {
  for (const marker of [
    'does not copy article text', 'delayed by up to 60 seconds', 'There is no password',
    'double opt-in', 'without cookies', 'rel=\\"sponsored\\"', 'metadata only', 'Stripe',
    'founder@nexlabs.company',
  ]) {
    assert.ok(page.includes(marker), marker);
  }
});

test('it is presented as a draft for the owner, not a certification', () => {
  assert.match(page, /Working draft for the owner's review/u);
  assert.match(page, /Not legal advice and not a certification of compliance/u);
});

test('deletion and unsubscribe promises match the code', () => {
  assert.match(page, /delete your account at any time/u);
  assert.match(page, /removes the account, the watchlist, the sessions and the alert records/u);
  assert.match(page, /every message carries an unsubscribe link/u);
  assert.match(page, /at most once per day/u);
});

test('the three locales exist and the Spanish page defers to English', () => {
  for (const locale of ['en', 'pt-br', 'es']) {
    const route = readFileSync('src/pages/' + locale + '/legal.astro', 'utf8');
    assert.match(route, new RegExp('locale="' + locale + '"', 'u'));
  }
  assert.match(page, /prevalece la versión en inglés/u);
});
