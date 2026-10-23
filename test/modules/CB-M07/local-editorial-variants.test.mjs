import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalEditorialVariant, getLocalEditorialVariant, upsertLocalEditorialVariant } from '../../../src/modules/CB-M07/local-editorial-variants.mjs';
import { createLocalSocialCard } from '../../../src/modules/CB-M07/social-card.mjs';
import { renderLocalCmsUi, LOCAL_CMS_UI_SCRIPT } from '../../../src/modules/CB-M05/p1c-local/local-cms-ui.mjs';

const draft = Object.freeze({
  id:'00000000-0000-0000-0000-000000000001',
  title:'Private synthetic market briefing',
  summary:'Fictional social test description with unverified attribution.',
  source_url:'https://example.org/fiction', author_label:'', status:'draft',
  revision:2, updated_at:1760870000,
  body:'DO_NOT_COPY_BODY', sessionSecret:'DO_NOT_COPY_SECRET',
});

test('M07-H stores immutable independent channel variants with mandatory source and rights', () => {
  let rows = Object.freeze([]);
  for (const channel of ['x','instagram','tiktok']) {
    rows = upsertLocalEditorialVariant(rows,draft,channel,'Fictional '+channel+' caption');
  }
  assert.equal(rows.length,3);
  assert.ok(Object.isFrozen(rows));
  const originalInstagram = getLocalEditorialVariant(rows,draft,'instagram');
  rows = upsertLocalEditorialVariant(rows,draft,'x','Revised fictional X caption');
  assert.equal(rows.length,3);
  assert.equal(getLocalEditorialVariant(rows,draft,'instagram'),originalInstagram);
  assert.match(getLocalEditorialVariant(rows,draft,'x').text,/Revised fictional X/);
  assert.equal(getLocalEditorialVariant(rows,draft,'tiktok').channel,'tiktok');
  for (const v of rows) {
    assert.ok(Object.isFrozen(v));
    assert.equal(v.draftRevision,2);
    assert.equal(v.mode,'LOCAL_SYNTHETIC');
    assert.equal(v.status,'DEMO_ONLY');
    assert.equal(v.publishingStatus,'DRAFT_ONLY');
    assert.equal(v.sourceStatus,'SOURCE_VERIFICATION_PENDING');
    assert.equal(v.creditStatus,'CREDIT_MISSING');
    assert.equal(v.rights,'NOT_CLEARED');
    assert.match(v.text,/Source reference \(NOT VERIFIED\): https:\/\/example.org\/fiction$/);
    assert.doesNotMatch(JSON.stringify(v),/DO_NOT_COPY_BODY|DO_NOT_COPY_SECRET|sessionSecret/);
    const card=createLocalSocialCard(v);
    assert.equal(card.text,v.text);
    assert.match(card.labels,/NOT_CLEARED/);
  }
  assert.equal(getLocalEditorialVariant(rows,{...draft,revision:3},'x'),null);
  assert.equal(getLocalEditorialVariant(rows,{...draft,id:'00000000-0000-0000-0000-000000000002'},'x'),null);
});

test('M07-H rejects invalid text, unauthorized sources, stale rows and oversized collections', () => {
  for (const text of [null,0,'short',' leading','trailing ', 'x'.repeat(1601), 'bad\u0000text']) {
    assert.throws(()=>createLocalEditorialVariant(draft,'x',text),TypeError);
  }
  assert.throws(()=>createLocalEditorialVariant({...draft,source_url:'http://example.org'},'x','Valid sample text'),TypeError);
  assert.throws(()=>createLocalEditorialVariant({...draft,status:'published'},'x','Valid sample text'),TypeError);
  assert.throws(()=>createLocalEditorialVariant(draft,'youtube','Valid sample text'),TypeError);
  const v=createLocalEditorialVariant(draft,'x','Valid sample text');
  assert.throws(()=>upsertLocalEditorialVariant([{...v,rights:'CLEARED'}],draft,'x','Another valid text'),TypeError);
  assert.throws(()=>upsertLocalEditorialVariant(Array(61).fill(v),draft,'x','Another valid text'),TypeError);
  assert.throws(()=>getLocalEditorialVariant(null,draft,'x'),TypeError);
  const longSource={...draft,source_url:'https://example.org/'+ 'z'.repeat(440)};
  assert.throws(()=>createLocalEditorialVariant(longSource,'x','a'.repeat(1600)),RangeError);
});

test('M07-H rejects forged credit, source, rights and frozen rows', () => {
  const valid = createLocalEditorialVariant(draft,'x','Valid fictional example');
  const creditedDraft = {...draft,author_label:'Fictional credit'};
  const credited = createLocalEditorialVariant(creditedDraft,'x','Credit present example');
  const accepted = upsertLocalEditorialVariant([credited],creditedDraft,'instagram',
    'Instagram-only example',[creditedDraft]);
  assert.equal(accepted[0],credited);
  assert.ok(accepted.every(Object.isFrozen));
  assert.equal(getLocalEditorialVariant(accepted,creditedDraft,'x').creditStatus,
    'CREDIT_PRESENT_UNVERIFIED');
  const forgeries = [
    Object.freeze({...valid,creditStatus:'CREDIT_PRESENT_UNVERIFIED'}),
    Object.freeze({...valid,text:'Fake text without attribution'}),
    Object.freeze({...valid,text:valid.text.replace('NOT VERIFIED','VERIFIED')}),
    Object.freeze({...valid,rights:'CLEARED'}),
    Object.freeze({...valid,sourceStatus:'SOURCE_VERIFIED'}),
    Object.freeze({...valid,channelName:'Another channel'}),
    Object.freeze({...valid,editableText:'Another fictional message'}),
    Object.freeze({...valid,unexpected:'extra field'}),
    {...valid},
  ];
  for (const forged of forgeries) {
    assert.throws(()=>getLocalEditorialVariant([forged],draft,'x'),TypeError);
    assert.throws(()=>upsertLocalEditorialVariant([forged],draft,'instagram',
      'Another valid example',[draft]),TypeError);
  }
});

test('M07-H rejects stale or unauthorized carried-over variants across drafts', () => {
  const second = {...draft,id:'00000000-0000-0000-0000-000000000002',
    source_url:'https://example.org/second',author_label:'Second author'};
  const firstVariant = createLocalEditorialVariant(draft,'x','First fictional message');
  let rows = upsertLocalEditorialVariant([firstVariant],second,'instagram',
    'Second fictional caption',[draft,second]);
  assert.equal(rows.length,2);
  assert.equal(getLocalEditorialVariant(rows,second,'instagram').creditStatus,
    'CREDIT_PRESENT_UNVERIFIED');
  for (const unauthorized of [
    [draft], [draft,{...second,revision:3}],
    [draft,{...second,source_url:'https://example.org/changed'}],
    [draft,{...second,author_label:''}],
  ]) {
    assert.throws(()=>upsertLocalEditorialVariant(rows,draft,'tiktok',
      'Third fictional example',unauthorized),TypeError);
  }
  rows = upsertLocalEditorialVariant(rows,draft,'tiktok','Third fictional example',[draft,second]);
  assert.equal(rows.length,3);
});

test('M07-H editor remains protected by nonce and never adds egress or persistence', () => {
  const html=renderLocalCmsUi('bc'.repeat(32));
  assert.match(html,/id="m06-dashboard"[^>]*hidden/);
  for (const id of ['m07-variant-composer','m07-variant-text','m07-variant-save','m07-variant-reset','m07-variant-status']) {
    assert.ok(html.includes('id="'+id+'"'));
  }
  assert.match(LOCAL_CMS_UI_SCRIPT,/localEditorialVariants = \[\]/);
  assert.match(LOCAL_CMS_UI_SCRIPT,/ui\.variantText\.value = ''/);
  assert.match(LOCAL_CMS_UI_SCRIPT,/upsertLocalEditorialVariant/);
  assert.match(LOCAL_CMS_UI_SCRIPT,/const requireCanonicalLocalVariant =/);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT,/localStorage|sessionStorage|indexedDB|innerHTML|\/local\/social|\/admin\/social|window\.open/);
  assert.match(html,/NOT POSTED/);
});
