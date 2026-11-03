import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TOPICS, articlesForTopic, headlinesForTopic, topicBySlug, topicSlugForTag,
} from '../../../src/modules/CB-M02/topics.mjs';

test('topics are stable slugs mapped to the home categories', () => {
  assert.equal(TOPICS.length, 8);
  assert.equal(topicBySlug('bitcoin').category, 'Bitcoin');
  assert.equal(topicBySlug('ai-crypto').category, 'AI x Crypto');
  assert.equal(topicBySlug('nope'), null);
  assert.equal(topicBySlug(''), null);
});

test('a free-form tag maps to a topic only when one exists', () => {
  assert.equal(topicSlugForTag('bitcoin'), 'bitcoin');
  assert.equal(topicSlugForTag('Bitcoin'), 'bitcoin');
  assert.equal(topicSlugForTag('ai x crypto'), 'ai-crypto');
  assert.equal(topicSlugForTag('AI'), 'ai-crypto');
  assert.equal(topicSlugForTag('analysis'), 'market-analysis');
  assert.equal(topicSlugForTag('regulation'), 'regulation');
  assert.equal(topicSlugForTag('hack'), null);
});

test('articles and headlines are filtered by the topic category', () => {
  const articles = [
    { slug: 'a', title: 'Bitcoin ETF inflows' },
    { slug: 'b', title: 'SEC opens a probe' },
  ];
  const headlines = [
    { title: 'Bitcoin ETF volumes rise', link: 'https://a.example/1' },
    { title: 'Ethereum upgrade ships', link: 'https://b.example/2' },
  ];
  assert.deepEqual(articlesForTopic(articles, topicBySlug('bitcoin')).map((a) => a.slug), ['a']);
  assert.deepEqual(articlesForTopic(articles, topicBySlug('regulation')).map((a) => a.slug), ['b']);
  assert.deepEqual(headlinesForTopic(headlines, topicBySlug('bitcoin')).map((h) => h.link), ['https://a.example/1']);
  assert.deepEqual(articlesForTopic(articles, null), []);
});

test('the page answers 404 for an unknown topic and links the tags', () => {
  const page = readFileSync('src/pages/[locale]/topic/[topic].astro', 'utf8');
  assert.match(page, /if \(topic === null\) Astro\.response\.status = 404/u);
  assert.doesNotMatch(page, /rel="noreferrer noopener external"/u, "the topic page never links out");
  const article = readFileSync('src/modules/CB-M05/ArticlePage.astro', 'utf8');
  assert.match(article, /topicSlugForTag\(tag\)/u);
  assert.match(article, /\/topic\/\$\{topic\}/u);
});

test('the topics index links every topic and counts what is on it', () => {
  const page = readFileSync('src/pages/[locale]/topics.astro', 'utf8');
  assert.match(page, /TOPICS\.map/u);
  assert.match(page, /\/topic\/\$\{row\.slug\}/u);
  assert.match(page, /articlesForTopic\(cards, topic\)\.length/u);
  assert.match(page, /headlinesForTopic\(headlines, topic\)\.length/u);
  const search = readFileSync('src/pages/[locale]/search.astro', 'utf8');
  assert.match(search, /\/topics`\}/u);
});
