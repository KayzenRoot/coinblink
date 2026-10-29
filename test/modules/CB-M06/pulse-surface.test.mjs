import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/pages/demo/pulse.astro', 'utf8');
const index = readFileSync('src/pages/demo/index.astro', 'utf8');

test('the pulse aggregates only measured signals and stores nothing', () => {
  assert.match(page, /readLiveNews/u);
  assert.match(page, /buildLiveIntakeReview/u);
  assert.ok(page.includes('data-m06-pulse'));
  assert.ok(page.includes('data-m06-pulse-reader={snapshot.status}'));
  assert.ok(page.includes('PUBLIC_BUILD_SHA'));
  assert.ok(page.includes('Headlines'));
  assert.ok(page.includes('no audience analytics'));
  assert.doesNotMatch(page, /set:html|<script|<form|localStorage|sessionStorage|fetch\s*\(/u);
});

test('the demo index links to the pulse', () => {
  assert.ok(index.includes('href: "/demo/pulse"'));
});
