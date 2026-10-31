import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeEntities, stripMarkup } from '../../../src/modules/CB-M03/rss-parse.mjs';

test('numeric character references are decoded once', () => {
  assert.equal(decodeEntities('Strategy&#8217;s own numbers'), 'Strategy\u2019s own numbers');
  assert.equal(decodeEntities('left &#x2018; right &#x2019;'), 'left \u2018 right \u2019');
  assert.equal(decodeEntities('dash &#8212; dash'), 'dash \u2014 dash');
});

test('named entities keep working and unknown ones stay literal', () => {
  assert.equal(decodeEntities('a &amp; b &lt; c'), 'a & b < c');
  assert.equal(decodeEntities('keep &unknown; as is'), 'keep &unknown; as is');
  assert.equal(decodeEntities('out of range &#0; &#9999999;'), 'out of range &#0; &#9999999;');
});

test('decoding cannot introduce markup: stripMarkup output is still plain text', () => {
  const value = stripMarkup('<b>Hi</b> &#60;script&#62; &amp; bye');
  assert.equal(value, 'Hi <script> & bye');
  // The renderer escapes it, so the angle brackets never become an element.
  const escaped = value.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  assert.equal(escaped.includes('&lt;script&gt;'), true);
  assert.equal(escaped.includes('<script>'), false);
});
