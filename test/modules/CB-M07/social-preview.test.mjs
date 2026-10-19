import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLocalSocialPreview, SOCIAL_LOCAL_CHANNELS } from '../../../src/modules/CB-M07/social-preview.mjs';
import { createLocalSocialCard } from '../../../src/modules/CB-M07/social-card.mjs';
import { renderLocalCmsUi, LOCAL_CMS_UI_SCRIPT } from '../../../src/modules/CB-M05/p1c-local/local-cms-ui.mjs';

const draft = Object.freeze({
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Local synthetic editorial headline',
  summary: 'Fictional source-verification tutorial for a private preview.',
  source_url: 'https://example.org/source',
  author_label: 'Synthetic Test Owner',
  status: 'draft', revision: 2, updated_at: 1760870000,
  body: 'SENSITIVE_PRIVATE_BODY_NEVER_INCLUDED',
  sessionSecret: 'SENSITIVE_PRIVATE_SECRET',
});

test('three channels produce text-only synthetic concepts, always unlicensed and unpublished', () => {
  assert.deepEqual([...SOCIAL_LOCAL_CHANNELS], ['x','instagram','tiktok']);
  assert.equal(Object.isFrozen(SOCIAL_LOCAL_CHANNELS), true);
  const previews = SOCIAL_LOCAL_CHANNELS.map(channel => createLocalSocialPreview(draft, channel));
  for (const p of previews) {
    assert.equal(p.channelName, ({x:'X',instagram:'Instagram',tiktok:'TikTok'})[p.channel]);
    assert.equal(p.mode, 'LOCAL_SYNTHETIC');
    assert.equal(p.status, 'DEMO_ONLY');
    assert.equal(p.publishingStatus, 'DRAFT_ONLY');
    assert.equal(p.sourceStatus, 'SOURCE_VERIFICATION_PENDING');
    assert.equal(p.creditStatus, 'CREDIT_PRESENT_UNVERIFIED');
    assert.equal(p.rights, 'NOT_CLEARED');
    assert.match(p.text, /Local synthetic editorial headline/);
    assert.match(p.text, /Fictional source-verification tutorial/);
    assert.match(p.text, /Source reference \(NOT VERIFIED\): https:\/\/example.org\/source/);
    assert.doesNotMatch(JSON.stringify(p), /SENSITIVE_PRIVATE_BODY|SENSITIVE_PRIVATE_SECRET|sessionSecret/);
    assert.equal(Object.isFrozen(p), true);
  }
  assert.match(previews[2].text, /storyboard only/);
  assert.match(previews[1].text, /LOCAL editorial concept/);
});

test('missing credit is not treated as verified even if HTTPS source is present', () => {
  const p = createLocalSocialPreview({...draft, author_label:'   '}, 'x');
  assert.equal(p.creditStatus, 'CREDIT_MISSING');
  assert.equal(p.sourceStatus, 'SOURCE_VERIFICATION_PENDING');
  assert.equal(p.rights, 'NOT_CLEARED');
});

test('invalid channels, data and unsafe source URLs fail closed', () => {
  for (const ch of ['',null,'X','youtube','facebook','publish',0,{},[]]) {
    assert.throws(() => createLocalSocialPreview(draft,ch), TypeError);
  }
  for (const row of [
    null,{},[], {...draft,status:'published'},
    {...draft,summary:''}, {...draft,summary:42},
    {...draft,summary:'x'.repeat(401)},
    {...draft,title:'bad'}, {...draft,source_url:'http://example.org'},
    {...draft,source_url:'https://user:pass@example.org/path'},
    {...draft,source_url:'javascript:alert(1)'},
    {...draft,source_url:''}, {...draft,author_label:null},
    {...draft,revision:0}
  ]) assert.throws(() => createLocalSocialPreview(row,'x'), TypeError);
});

test('the LOCAL studio is nested inside authenticated hidden dashboard, with no publishing or new endpoint', () => {
  const html = renderLocalCmsUi('aa'.repeat(32));
  assert.match(html, /id="m06-dashboard"[^>]*hidden/u);
  assert.match(html, /id="m07-social"/u);
  assert.match(html, /id="m07-preview"[^>]*hidden/u);
  assert.match(html, /id="m07-generate"/u);
  assert.match(html, /id="m07-clear"/u);
  assert.match(html, /id="m07-draft"/u);
  assert.match(html, /NO POSTING/u);
  assert.match(html, /script nonce="[a-f0-9]{64}" type="module"/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /createLocalSocialPreview\(draft, ui\.socialChannel\.value\)/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /ui\.socialPreviewText\.textContent = concept\.text/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /ui\.socialDraft\.replaceChildren\(\)/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /if \(!csrf \|\| ui\.form\.hidden \|\| ui\.dashboard\.hidden\) return/u);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT, /\/local\/social|\/admin\/social|\.innerHTML|localStorage|sessionStorage|window\.open/u);
  const publicAdmin = readFileSync('src/pages/admin/[...route].js','utf8');
  assert.match(publicAdmin,/!import\.meta\.env\.DEV/u);
});

test('M07-B visual formats are distinct, never imply posting or verified rights', () => {
  const seen = new Set();
  for (const channel of SOCIAL_LOCAL_CHANNELS) {
    const concept = createLocalSocialPreview(draft, channel);
    const card = createLocalSocialCard(concept);
    assert.equal(card.channel, channel);
    assert.ok(!seen.has(card.formatLabel));
    seen.add(card.formatLabel);
    assert.equal(card.text, concept.text);
    assert.match(card.labels, /DEMO_ONLY.*DRAFT_ONLY.*SOURCE_VERIFICATION_PENDING.*NOT_CLEARED/);
    assert.equal(Object.isFrozen(card), true);
    assert.doesNotMatch(JSON.stringify(card), /SENSITIVE_PRIVATE_BODY|SENSITIVE_PRIVATE_SECRET/);
  }
  assert.equal(seen.size, 3);
});

test('M07-B refuses malformed or publication-like cards, including missing credit metadata', () => {
  const valid = createLocalSocialPreview(draft, 'x');
  for (const bad of [null, [], {}, {...valid,mode:'LIVE'}, {...valid,status:'PUBLISHED'},
    {...valid,publishingStatus:'PUBLISHED'}, {...valid,rights:'CLEARED'},
    {...valid,sourceStatus:'VERIFIED'}, {...valid,creditStatus:'VERIFIED'},
    {...valid,channel:'facebook'}, {...valid,text:''}, {...valid,text:'z'.repeat(2001)}]) {
    assert.throws(() => createLocalSocialCard(bad), TypeError);
  }
  assert.match(createLocalSocialCard(createLocalSocialPreview(
    {...draft,author_label:'   '}, 'x')).labels, /CREDIT_MISSING/);
});

test('M07-B accessible mockup markup remains private and DOM-only', () => {
  const html = renderLocalCmsUi('ab'.repeat(32));
  assert.match(html, /id="m06-dashboard"[^>]*hidden/u);
  assert.match(html, /id="m07-preview"[^>]*hidden/u);
  assert.match(html, /id="m07-card"[^>]*hidden/u);
  assert.match(html, /id="m07-card-copy"/u);
  assert.match(html, /id="m07-viewport"/u);
  assert.match(html, /for="m07-viewport"/u);
  assert.match(html, /Text-only accessible version/u);
  assert.match(html, /UNOFFICIAL · LOCAL DEMO/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /ui\.socialCardCopy\.textContent = card\.text/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /ui\.socialCard\.dataset\.viewport/u);
  assert.match(LOCAL_CMS_UI_SCRIPT, /ui\.socialCardCopy\.textContent = ''/u);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT,
    /\/local\/social|\/admin\/social|\.innerHTML|localStorage|sessionStorage|window\.open/u);
});
