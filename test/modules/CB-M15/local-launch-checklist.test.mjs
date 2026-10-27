import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const PATH="../../../src/modules/CB-M15/local-launch-checklist.mjs";

test("M15 P0 launch practice list is immutable and contains four bounded mock-only topics",async()=>{
  const {listLocalLaunchChecks}=await import(PATH);
  const checks=listLocalLaunchChecks();
  assert.equal(Object.isFrozen(checks),true);
  assert.deepEqual(checks.map(x=>x.id),["rights","consent","security","owner"]);
  for(const item of checks){
    assert.ok(Object.isFrozen(item));
    assert.deepEqual(Object.keys(item).sort(),["id","label"]);
    assert.equal(typeof item.label,"string");
    assert.ok(item.label.length>=12);
  }
});

test("M15 P0 cannot unlock release even when all four illustrative ticks are selected",async()=>{
  const {buildLocalLaunchChecklist}=await import(PATH);
  const ids=["rights","consent","security","owner"];
  for(const selected of [[],["rights"],["rights","consent"],ids]){
    const result=buildLocalLaunchChecklist(selected);
    assert.equal(result.status,"LOCAL_EXERCISE_ONLY");
    assert.ok(Object.isFrozen(result));
    assert.equal(result.mode,"LOCAL_SYNTHETIC");
    assert.equal(result.practiceCount,selected.length);
    assert.equal(result.practiceTotal,4);
    assert.equal(result.releaseDecision,"BLOCKED_NOT_ADMITTED");
    assert.equal(result.releaseAuthorized,false);
    assert.equal(result.productionReady,false);
    assert.equal(result.deploymentEnabled,false);
    assert.equal(result.publishingEnabled,false);
    assert.equal(result.realApproval,false);
    assert.equal(result.live,false);
    assert.equal(result.evidenceVerified,false);
    assert.equal(result.ownerSignoff,false);
    assert.equal(result.actions.length,0);
    assert.ok(Object.isFrozen(result.actions));
  }
});

test("M15 P0 invalid and duplicate selections fail closed with zero authority",async()=>{
  const {buildLocalLaunchChecklist}=await import(PATH);
  const denied=Object.freeze({status:"INVALID_EXERCISE",preview:null});
  const bad=[null,undefined,true,{},12,"rights",["__proto__"],["../admin"],["rights","rights"],["rights",null],["rights",3],["rights","consent","security","owner","extra"],["constructor"],["https://external.invalid"]];
  for(const arg of bad)assert.deepEqual(buildLocalLaunchChecklist(arg),denied);
});

test("M15 P0 static browser contracts forbid privileged routing, persistence, network and launch actions",()=>{
  const page=readFileSync("src/modules/CB-M15/LocalLaunchChecklist.astro","utf8");
  const route=readFileSync("src/pages/demo/launch-readiness.astro","utf8");
  const js=readFileSync("src/modules/CB-M15/local-launch-checklist.client.js","utf8");
  const css=readFileSync("src/modules/CB-M15/local-launch-checklist.css","utf8");
  assert.match(route,/LocalLaunchChecklist/u);
  assert.match(page,/data-m15-check/u);
  assert.match(page,/data-m15-progress/u);
  assert.match(page,/data-m15-status[^>]*aria-live="polite"/u);
  assert.match(page,/RELEASE BLOCKED/u);
  assert.match(page,/local-launch-checklist\.client\.js\?url&no-inline/u);
  assert.match(page,/local-launch-checklist\.css\?url&no-inline/u);
  assert.match(js,/data-m15-reset/u);
  assert.match(js,/textContent/u);
  assert.match(css,/:focus-visible/u);
  for(const source of [page,route,js]){
    assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|<iframe|<form|type="email"|type="password"|<img|document\.cookie|process\.env|\/admin\/api/iu);
  }
});
