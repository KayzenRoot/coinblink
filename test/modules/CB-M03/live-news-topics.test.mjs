import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_NEWS_TOPIC_LIMIT, LIVE_NEWS_TOPIC_MIN_COUNT, extractLiveTopics,
} from '../../../src/modules/CB-M03/live-news-topics.mjs';

const entry = (title, summary = '') => ({ title, summary });

test('counts one occurrence per headline and drops function words', () => {
  const topics = extractLiveTopics([
    entry('Bitcoin ETF inflows', 'bitcoin demand'),
    entry('Bitcoin miners', 'bitcoin supply'),
    entry('Ethereum ETF approved', 'the sec approved an ethereum etf'),
  ]);
  assert.deepEqual(topics, [
    { term: 'bitcoin', count: 2 },
    { term: 'etf', count: 2 },
  ]);
  assert.equal(Object.isFrozen(topics), true);
  assert.equal(Object.isFrozen(topics[0]), true);
});

test('a repeated word still counts once per headline', () => {
  const topics = extractLiveTopics([
    entry('bitcoin bitcoin bitcoin', 'bitcoin'),
    entry('bitcoin price', 'bitcoin bitcoin'),
  ]);
  assert.deepEqual(topics, [{ term: 'bitcoin', count: 2 }]);
});

test('accents fold so the same word is counted together', () => {
  assert.deepEqual(extractLiveTopics([
    entry('Ação regulatória'), entry('Acao regulatoria'),
  ]), [
    { term: 'acao', count: 2 },
    { term: 'regulatoria', count: 2 },
  ]);
});

test('function words from every site language stay out of the list', () => {
  const topics = extractLiveTopics([
    entry('The para sobre con del bitcoin', 'and com dos las'),
    entry('The para sobre con del bitcoin', 'and com dos las'),
  ]);
  assert.deepEqual(topics, [{ term: 'bitcoin', count: 2 }]);
});

test('very short words and bare numbers are not topics', () => {
  const topics = extractLiveTopics([
    entry('btc is up in 2026'), entry('btc is up in 2026'),
  ]);
  assert.deepEqual(topics, [{ term: 'btc', count: 2 }]);
});

test('limit and minimum count are clamped and never invent a topic', () => {
  assert.equal(LIVE_NEWS_TOPIC_LIMIT, 8);
  assert.equal(LIVE_NEWS_TOPIC_MIN_COUNT, 2);
  const items = Array.from({ length: 10 }, (_, index) => entry('alpha bravo charlie delta echo ' + index));
  assert.equal(extractLiveTopics(items, { limit: 3 }).length, 3);
  assert.equal(extractLiveTopics(items, { limit: 999 }).length, 5);
  assert.deepEqual(extractLiveTopics(items, { minCount: 1 }).map((topic) => topic.term),
    ['alpha', 'bravo', 'charlie', 'delta', 'echo']);
  assert.equal(extractLiveTopics(items, { limit: 0, minCount: 0 }).length, 5);
});

test('input that cannot be measured yields an empty frozen list', () => {
  assert.deepEqual(extractLiveTopics(null), []);
  assert.deepEqual(extractLiveTopics('headline'), []);
  assert.deepEqual(extractLiveTopics([null, 1, 'headline']), []);
  assert.equal(Object.isFrozen(extractLiveTopics(null)), true);
});

test('a plural folds into its singular only when both forms appear', () => {
  assert.deepEqual(extractLiveTopics([
    entry('agents agent'), entry('agent agents'),
  ]), [{ term: 'agent', count: 4 }]);
  assert.deepEqual(extractLiveTopics([
    entry('companies company'), entry('company companies'),
  ]), [{ term: 'company', count: 4 }]);
  assert.deepEqual(extractLiveTopics([
    entry('agents agents'), entry('agents'),
  ]), [{ term: 'agents', count: 2 }]);
});

test('publisher boilerplate never becomes a topic', () => {
  const topics = extractLiveTopics([
    entry('Bitcoin story', 'The post appeared first on Bitcoin Magazine'),
    entry('Bitcoin story', 'The post appeared first on Bitcoin Magazine'),
  ]);
  assert.deepEqual(topics, [{ term: 'bitcoin', count: 2 }]);
});
