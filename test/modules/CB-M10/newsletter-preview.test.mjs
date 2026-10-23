import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { listMockNews } from "../../../src/modules/CB-M02/news-workbench.mjs";
import {
  NEWSLETTER_DEMO_POLICY, listMockNewsletterTopics, buildMockNewsletterPreview,
} from "../../../src/modules/CB-M10/newsletter-preview.mjs";

test("M10 newsletter previews exactly the canonical three M02 fictional articles", () => {
  assert.match(NEWSLETTER_DEMO_POLICY, /NEVER_SENT_NO_SUBSCRIBERS/u);
  const topics = listMockNewsletterTopics();
  assert.deepEqual(topics, ["all", "security", "protocol", "education"]);
  assert.ok(Object.isFrozen(topics));
  const { status, preview } = buildMockNewsletterPreview("all");
  assert.equal(status, "LOCAL_PREVIEW_NOT_SENT");
  assert.equal(preview.storyCount, 3);
  assert.deepEqual(preview.stories.map(x => x.slug), listMockNews().items.map(x => x.slug));
  assert.equal(preview.recipients, 0);
  assert.equal(preview.sent, false);
  assert.equal(preview.scheduled, false);
  assert.equal(preview.published, false);
  assert.equal(preview.deliveryEnabled, false);
  assert.equal(preview.consentCollected, false);
  assert.equal(preview.verified, false);
  assert.equal(preview.requiresHumanRightsReview, true);
  assert.ok(Object.isFrozen(preview) && Object.isFrozen(preview.stories)
    && preview.stories.every(Object.isFrozen));
});

test("M10 topic filtering never invents content or grants newsletter delivery rights", () => {
  for (const topic of ["security", "protocol", "education"]) {
    const x = buildMockNewsletterPreview(topic);
    assert.equal(x.preview.storyCount, 1);
    assert.equal(x.preview.stories[0].category, topic);
    assert.match(x.preview.stories[0].path, /^\/en\/news\/demo-[a-z-]+$/u);
    assert.equal(x.preview.recipients, 0);
  }
  for (const invalid of [null, "", "ALL", "crypto", "__proto__", {}, [], 42]) {
    assert.deepEqual(buildMockNewsletterPreview(invalid), { status: "INVALID_TOPIC", preview: null });
  }
});

test("M10 DOM contracts do not contain email form, storage, network or privileged CMS calls", () => {
  const astro = readFileSync("src/modules/CB-M10/NewsletterWorkbench.astro", "utf8");
  const code = readFileSync("src/modules/CB-M10/newsletter-preview.mjs", "utf8");
  const client = readFileSync("src/modules/CB-M10/newsletter-preview.client.js", "utf8");
  assert.match(astro, /data-m10-preview/u);
  assert.match(astro, /newsletter-preview\.client\.js\?url&no-inline/u);
  assert.match(astro, /data-m10-snapshot/u);
  assert.doesNotMatch(client, /^\s*import\s/mu);
  assert.match(astro, /newsletter-preview\.css\?url&no-inline/u);
  assert.doesNotMatch(astro, /<script>(?!\s*<\/script>)/u);
  assert.doesNotMatch(astro, /<style>/u);
  assert.match(astro, /data-m10-clear/u);
  assert.match(client, /textContent/u);
  assert.match(astro, /NO SUBSCRIBERS/u);
  assert.doesNotMatch(astro + code + client, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|navigator\.clipboard|innerHTML|type="email"|form action=|sendBeacon|\/admin\/api/u);
  assert.match(readFileSync("src/pages/demo/newsletter.astro", "utf8"), /NewsletterWorkbench/u);
});
