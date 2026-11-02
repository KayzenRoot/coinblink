import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/modules/CB-M09/LocalizedNewsPage.astro', 'utf8');

test('the news page calls itself a demo only while nothing real is on it', () => {
  assert.match(page, /const realArticles = detail !== null \? \[\] : await listArticleCards/u);
  assert.match(page, /const hasRealContent = realArticles\.length > 0 \|\| liveSnapshot\?\.status === "LIVE_HEADLINES"/u);
  assert.match(page, /hasRealContent \? "CoinBlink · News" : copy\.listTitle/u);
  assert.match(page, /title=\{detail \? copy\.detailTitle : listTitle\}/u);
  assert.match(page, /description=\{detail \? copy\.detailDescription : listDescription\}/u);
});
