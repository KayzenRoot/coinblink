import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCE_EXCERPT_CHARS, decodeEntities, fetchSourceText, htmlToText,
} from '../../../src/modules/CB-M08/source-text.mjs';

const PAGE = `<!doctype html><html><head><title>Story</title>
<script>window.__data = {"secret":true};</script><style>.x{color:red}</style></head>
<body><nav>Home</nav><article><h1>Hong Kong expands settlement</h1>
<p>Hong Kong&rsquo;s regulator said the 24/7 settlement pilot &amp; stablecoin trials will start next month.</p>
<p>The programme covers &lt;three&gt; institutions and 130&nbsp;million HKD.</p></article>
<footer>Subscribe</footer><iframe src="ad"></iframe></body></html>`;

test('the page becomes readable text without markup or scripts', () => {
  const text = htmlToText(PAGE);
  assert.match(text, /Hong Kong expands settlement/u);
  assert.match(text, /24\/7 settlement pilot & stablecoin trials/u);
  assert.doesNotMatch(text, /__data|color:red|iframe|ad"/u);
  assert.doesNotMatch(text, /<\/?(?:p|div|script|style|iframe|nav|footer|article)\b/iu, 'no real tags survive');
  assert.match(text, /<three> institutions/u, 'an escaped angle bracket stays literal text');
  assert.match(text, /130 million HKD/u, 'entities and nbsp are decoded');
  assert.ok(text.length <= SOURCE_EXCERPT_CHARS);
});

test('the excerpt is capped', () => {
  const long = htmlToText('<p>' + 'word '.repeat(5000) + '</p>');
  assert.equal(long.length, SOURCE_EXCERPT_CHARS);
});

test('entities and code points decode safely', () => {
  assert.equal(decodeEntities('a &amp; b &#65; &#x42; &bogus;'), 'a & b A B &bogus;');
  assert.equal(decodeEntities('&#0;'), ' ');
  assert.equal(decodeEntities('&#99999999;'), ' ');
});

test('the fetch fails closed on every bad path', async () => {
  assert.equal((await fetchSourceText({ url: 'http://x.test' })).reason, 'url');
  assert.equal((await fetchSourceText({ url: 'https://x.test', fetchImpl: null })).status, 'error');
  assert.equal((await fetchSourceText({ url: 'https://x.test', fetchImpl: async () => new Response('no', { status: 404 }) })).reason, 'HTTP_404');
  assert.equal((await fetchSourceText({
    url: 'https://x.test', fetchImpl: async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
  })).reason, 'not_html');
  assert.equal((await fetchSourceText({
    url: 'https://x.test', fetchImpl: async () => new Response('<p>short</p>', { status: 200, headers: { 'content-type': 'text/html' } }),
  })).reason, 'empty');
  assert.equal((await fetchSourceText({
    url: 'https://x.test', fetchImpl: async () => new Response(PAGE, { status: 200, headers: { 'content-type': 'text/html' } }),
  })).status, 'ok');
});
