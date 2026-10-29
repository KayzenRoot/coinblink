import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const model = readFileSync('src/modules/CB-M03/live-intake.mjs', 'utf8');
const page = readFileSync('src/pages/demo/intake.astro', 'utf8');
const index = readFileSync('src/pages/demo/index.astro', 'utf8');

test('the intake page is gated, escaped and never publishes', () => {
  assert.match(page, /readLiveNews\(\{ enabled: import\.meta\.env\.PUBLIC_NEWS_LIVE \}\)/u);
  assert.match(page, /buildLiveIntakeReview/u);
  assert.match(page, /data-m03-intake\b/u);
  assert.ok(page.includes('data-m03-intake-state="measured"'));
  assert.doesNotMatch(page, /set:html|<form|<script/u);
  assert.match(page, /rel="noreferrer noopener external"/u);
  assert.match(page, /PRIVATE_REVIEW_ONLY/u);
  assert.match(page, /NO PUBLICATION/u);
});

test('the intake model reuses the canonical gate and keeps no state', () => {
  assert.match(model, /from "\.\/ingestion\/source-eligibility\.mjs"/u);
  assert.doesNotMatch(model, /fetch\s*\(|localStorage|sessionStorage|indexedDB|caches\.(open|put)/u);
  assert.match(model, /LIVE_INTAKE_REGISTRY = Object\.freeze\(\[\]\)/u);
  assert.match(model, /publicationAllowed: false/u);
  assert.match(model, /storageAllowed: false/u);
});

test('the demo index links to the intake gate', () => {
  assert.ok(index.includes('href: "/demo/intake"'));
});
