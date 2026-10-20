import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalEditorialVariant } from '../../../src/modules/CB-M07/local-editorial-variants.mjs';
import { inspectLocalApprovalHistory, latestLocalApproval, recordLocalApproval } from '../../../src/modules/CB-M07/local-editorial-approvals.mjs';
import { renderLocalCmsUi, LOCAL_CMS_UI_SCRIPT } from '../../../src/modules/CB-M05/p1c-local/local-cms-ui.mjs';

const draft=Object.freeze({
  id:'00000000-0000-0000-0000-0000000000f1',revision:2,status:'draft',
  title:'Fictional title',summary:'Test-only',source_url:'https://example.org/fake',
  author_label:'',updated_at:1760870000,body:'PRIVATE_BODY_ABC',
  sessionSecret:'PRIVATE_SESSION_ABC',
});
const variant=(channel,text='Fictional local caption')=>createLocalEditorialVariant(draft,channel,text);
const write=(history,row,action,reason='')=>recordLocalApproval(history,row,action,[draft],reason);

test('M07-I versioned immutable per-channel save, approve, resave and reject',()=>{
  let log=Object.freeze([]);
  const x1=variant('x');
  assert.throws(()=>write(log,x1,'APPROVE'),TypeError);
  log=write(log,x1,'SAVE');
  assert.equal(latestLocalApproval(log,draft,'x').version,1);
  log=write(log,x1,'APPROVE');
  assert.throws(()=>write(log,x1,'REJECT','Needs editorial review'),TypeError);
  const x2=variant('x','Updated fictional caption');
  log=write(log,x2,'SAVE');
  assert.equal(latestLocalApproval(log,draft,'x').version,2);
  assert.equal(latestLocalApproval(log,draft,'x').action,'SAVE');
  log=write(log,x2,'REJECT','Requires another revision');
  const instagram=variant('instagram');
  log=write(log,instagram,'SAVE');
  log=write(log,instagram,'APPROVE');
  assert.equal(latestLocalApproval(log,draft,'x').action,'REJECT');
  assert.equal(latestLocalApproval(log,draft,'instagram').version,1);
  assert.equal(latestLocalApproval(log,draft,'tiktok'),null);
  assert.ok(log.every(Object.isFrozen));
  assert.doesNotMatch(JSON.stringify(log),/PRIVATE_BODY_ABC|PRIVATE_SESSION_ABC/);
  assert.equal(inspectLocalApprovalHistory(log,[draft]).size,2);
});

test('M07-I reset invalidates local approval; stale, forged and invalid decisions fail closed',()=>{
  const tiktok=variant('tiktok');
  let log=write(Object.freeze([]),tiktok,'SAVE');
  log=write(log,tiktok,'REJECT','Fictional review feedback');
  log=write(log,tiktok,'RESET');
  assert.equal(latestLocalApproval(log,draft,'tiktok').action,'RESET');
  assert.throws(()=>write(log,tiktok,'APPROVE'),TypeError);
  log=write(log,tiktok,'SAVE');
  assert.equal(latestLocalApproval(log,draft,'tiktok').version,2);
  for(const reason of ['', 'short',' leading reason','Bad\nreason','x'.repeat(241)]) {
    assert.throws(()=>write(log,tiktok,'REJECT',reason),TypeError);
  }
  assert.throws(()=>write(log,tiktok,'APPROVE','Publish now'),TypeError);
  assert.throws(()=>inspectLocalApprovalHistory([...log,{...log[0]}],[draft]),TypeError);
  assert.throws(()=>inspectLocalApprovalHistory(log,[{...draft,revision:3}]),TypeError);
  assert.throws(()=>inspectLocalApprovalHistory(log,[{...draft,source_url:'https://example.org/forged'}]),TypeError);
  assert.throws(()=>inspectLocalApprovalHistory(log,[{...draft,author_label:'Fake credit'}]),TypeError);
});

test('M07-I LOCAL controls are session-only and never grant posting or rights clearance',()=>{
  const html=renderLocalCmsUi('ab'.repeat(32));
  for(const id of ['m07-approval-panel','m07-approval-approve','m07-approval-reject',
    'm07-approval-reason','m07-approval-status','m07-approval-audit']) {
    assert.ok(html.includes('id="'+id+'"'));
  }
  assert.match(LOCAL_CMS_UI_SCRIPT,/localApprovalEvents = \[\]/);
  assert.match(LOCAL_CMS_UI_SCRIPT,/const recordLocalApproval =/);
  assert.match(html,/APPROVED FOR LOCAL EDITORIAL REVIEW ONLY/);
  assert.doesNotMatch(LOCAL_CMS_UI_SCRIPT,/localStorage|sessionStorage|indexedDB|innerHTML|window\.open/);
});
