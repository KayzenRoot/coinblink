import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/modules/CB-M09/LocalizedNewsPage.astro', 'utf8');

test('the news page calls itself a demo only while nothing real is on it', () => {
  assert.match(page, /const realArticles = detail !== null \? \[\] : await listArticleCards/u);
  assert.match(page, /const hasRealContent = realArticles\.length > 0 \|\| liveSnapshot\?\.status === "LIVE_HEADLINES"/u);
  assert.match(page, /"pt-br": \["CoinBlink · Notícias"/u);
  assert.match(page, /const listTitle = hasRealContent \? realTitle : copy\.listTitle/u);
  assert.match(page, /title=\{detail \? copy\.detailTitle : listTitle\}/u);
  assert.match(page, /description=\{detail \? copy\.detailDescription : listDescription\}/u);
});

test('the news page links the live, topics, search and sources surfaces', () => {
  assert.match(page, /class="news-explore"/u);
  assert.match(page, /\/news\/live`\}/u);
  assert.match(page, /\/topics`\}/u);
  assert.match(page, /\/search`\}/u);
  assert.match(page, /\/news\/sources`\}/u);
});
