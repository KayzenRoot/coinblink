import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createLocalCalendarIdea, addLocalCalendarIdea } from '../../../src/modules/CB-M07/local-calendar.mjs';
import { renderLocalCmsUi, LOCAL_CMS_UI_SCRIPT } from '../../../src/modules/CB-M05/p1c-local/local-cms-ui.mjs';

const draft = Object.freeze({
  id:'00000000-0000-0000-0000-000000000001',
  title:'Private hypothetical sample',
  summary:'Fictional editorial concepts are never actually published.',
  source_url:'https://example.org/fiction',
  author_label:'',status:'draft',revision:1,updated_at:1760870000,
  body:'PRIVATE_BODY_MUST_NOT_COPY',sessionSecret:'PRIVATE_SECRET_MUST_NOT_COPY',
});

test('M07-C LOCAL converts hypothetical time to UTC and keeps rights unverified',()=>{
  const idea=createLocalCalendarIdea(draft,'x','2026-11-20T12:30','America/Sao_Paulo');
  assert.equal(idea.utcISO,'2026-11-20T15:30:00.000Z');
  assert.equal(idea.hypotheticalLocal,'2026-11-20T12:30');
  assert.equal(idea.timeZone,'America/Sao_Paulo');
  assert.equal(idea.status,'PLANNED_CONCEPT_ONLY');
  assert.equal(idea.publication,'DRAFT_ONLY');
  assert.equal(idea.sourceStatus,'SOURCE_VERIFICATION_PENDING');
  assert.equal(idea.rights,'NOT_CLEARED');
  assert.equal(idea.creditStatus,'CREDIT_MISSING');
  assert.ok(Object.isFrozen(idea));
  assert.doesNotMatch(JSON.stringify(idea),/PRIVATE_BODY_MUST_NOT_COPY|PRIVATE_SECRET_MUST_NOT_COPY|example\.org/);
  assert.equal(createLocalCalendarIdea(draft,'tiktok','2026-11-20T15:30','UTC').utcISO,idea.utcISO);
});
test('M07-C rejects nonexistent and ambiguous DST local times and invalid calendars',()=>{
  assert.throws(()=>createLocalCalendarIdea(draft,'x','2026-03-08T02:30','America/New_York'),TypeError);
  assert.throws(()=>createLocalCalendarIdea(draft,'x','2026-11-01T01:30','America/New_York'),TypeError);
  assert.equal(createLocalCalendarIdea(draft,'instagram','2026-11-01T03:30','America/New_York').utcISO,
    '2026-11-01T08:30:00.000Z');
  for (const date of ['2026-02-30T12:00','2026-13-01T12:00','2026-11-31T10:00',
    '2026-11-20T24:00','2026-11-20T12:60','2026-11-20','bad','','2026-11-20T12:30Z']) {
    assert.throws(()=>createLocalCalendarIdea(draft,'x',date,'UTC'),TypeError);
  }
  for (const zone of ['Europe/Paris','GMT-3','Invalid',null]) {
    assert.throws(()=>createLocalCalendarIdea(draft,'x','2026-11-20T12:30',zone),TypeError);
  }
  for (const item of [null,{}, {...draft,status:'published'}, {...draft,source_url:'http://invalid.test'},
    {...draft,revision:0}]) {
    assert.throws(()=>createLocalCalendarIdea(item,'x','2026-11-20T12:30','UTC'),TypeError);
  }
});
test('M07-C immutable 20-entry bounded list sorts by UTC and disallows duplicates',()=>{
  let state=[];
  for(let i=0;i<20;i++){
    const minute=String(40-i).padStart(2,'0');
    const item=createLocalCalendarIdea(draft,'x','2026-11-20T12:'+minute,'UTC');
    state=addLocalCalendarIdea(state,item);
  }
  assert.equal(state.length,20);
  assert.ok(Object.isFrozen(state));
  assert.equal(state[0].utcISO,'2026-11-20T12:21:00.000Z');
  assert.equal(state[19].utcISO,'2026-11-20T12:40:00.000Z');
  assert.throws(()=>addLocalCalendarIdea(state,createLocalCalendarIdea(draft,'x','2026-11-20T12:50','UTC')),RangeError);
  assert.throws(()=>addLocalCalendarIdea(state.slice(0,1),state[0]),RangeError);
  assert.throws(()=>addLocalCalendarIdea([], {...state[0],rights:'CLEARED'}),TypeError);
  assert.throws(()=>addLocalCalendarIdea(null,state[0]),TypeError);
});
test('M07-C calendar stays inside private dashboard with CSP, labeled accessible controls and DOM scrubbing',()=>{
  const html=renderLocalCmsUi('ab'.repeat(32));
  assert.match(html,/id="m06-dashboard"[^>]*hidden/u);
  assert.match(html,/id="m07-calendar-date"/u);
  assert.match(html,/id="m07-calendar-zone"/u);
  assert.match(html,/id="m07-calendar-list"/u);
  assert.match(html,/id="m07-calendar-add"/u);
  assert.match(html,/id="m07-calendar-clear"/u);
  assert.match(html,/MEMORY ONLY · NOT SCHEDULED/u);
  assert.match(html,/script nonce="[a-f0-9]{64}" type="module"/u);
  assert.match(LOCAL_CMS_UI_SCRIPT,/ui\.calendarList\.replaceChildren\(\)/u);
  assert.match(LOCAL_CMS_UI_SCRIPT,/description\.textContent = /u);
  assert.match(LOCAL_CMS_UI_SCRIPT,/createLocalCalendarIdea\(draft, ui\.socialChannel\.value/u);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT,/localStorage|sessionStorage|indexedDB|window\.open|\/local\/calendar|\/admin\/calendar|\.innerHTML/u);
  assert.match(readFileSync('src/pages/admin/[...route].js','utf8'),/!import\.meta\.env\.DEV/u);
});
