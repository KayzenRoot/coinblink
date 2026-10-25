import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MODEL="../../../src/modules/CB-M14/drill-model.mjs";

test("M14 P0 deterministic offline incident exercise keeps three immutable non-operational scenarios",async()=>{
  const {listLocalIncidentScenarios,buildLocalIncidentDrill}=await import(MODEL);
  const examples=listLocalIncidentScenarios();
  assert.ok(Object.isFrozen(examples));
  assert.deepEqual(examples.map(x=>x.id),["baseline","queue","security"]);
  for(const entry of examples){
    assert.ok(Object.isFrozen(entry));
    assert.deepEqual(Object.keys(entry).sort(),["id","label"]);
    const r=buildLocalIncidentDrill(entry.id);
    assert.equal(r.status,"EXERCISE_ONLY");
    assert.equal(Object.isFrozen(r),true);
    const x=r.preview;
    assert.ok(Object.isFrozen(x)&&Object.isFrozen(x.steps));
    assert.equal(x.context,entry.id);
    assert.equal(x.mode,"LOCAL_SYNTHETIC");
    assert.equal(x.live,false);
    assert.equal(x.monitoringEnabled,false);
    assert.equal(x.remoteAccessEnabled,false);
    assert.equal(x.incidentDeclared,false);
    assert.equal(x.alertSent,false);
    assert.equal(x.rollbackExecuted,false);
    assert.equal(x.secretsAccessed,false);
    assert.equal(x.automationEnabled,false);
    assert.equal(x.actions.length,0);
    assert.ok(Object.isFrozen(x.actions));
    assert.ok(x.steps.length>=2 && x.steps.length<=3);
    assert.ok(x.steps.every(s=>typeof s==="string" && s.length>=12 && !/https?:\/\/|token|api[_-]?key|secret|password/iu.test(s)));
    assert.match(x.severity,/^(?:PRACTICE_ONLY|SIMULATED_WARNING|SIMULATED_HOLD)$/u);
  }
});

test("M14 P0 hostile scenario names fail closed without touching operational systems",async()=>{
  const {buildLocalIncidentDrill}=await import(MODEL);
  for(const input of ["__proto__","constructor","","BASELINE","../admin","https://bad.invalid",null,undefined,[],{},true,14]){
    assert.deepEqual(buildLocalIncidentDrill(input),Object.freeze({status:"INVALID_EXERCISE",preview:null}));
  }
});

test("M14 P0 no privileged routes, monitoring, storage, outbound calls, inline scripts or real alerts",()=>{
  const route=readFileSync("src/pages/demo/incident-drill.astro","utf8");
  const page=readFileSync("src/modules/CB-M14/IncidentDrill.astro","utf8");
  const client=readFileSync("src/modules/CB-M14/incident-drill.client.js","utf8");
  const css=readFileSync("src/modules/CB-M14/incident-drill.css","utf8");
  assert.match(route,/IncidentDrill/u);
  assert.match(page,/data-m14-scenario/u);
  assert.match(page,/data-m14-steps/u);
  assert.match(page,/data-m14-status[^>]*aria-live="polite"/u);
  assert.match(page,/incident-drill\.client\.js\?url&no-inline/u);
  assert.match(page,/incident-drill\.css\?url&no-inline/u);
  assert.match(page,/NO LIVE MONITORING/u);
  assert.match(page,/NO ACTIONS EXECUTED/u);
  assert.match(client,/replaceChildren\(\)/u);
  assert.match(client,/textContent/u);
  assert.match(css,/:focus-visible/u);
  for(const file of [route,page,client]){
    assert.doesNotMatch(file,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|<iframe|<form|type="email"|type="password"|<img|document\.cookie|process\.env|\/admin\/api/iu);
  }
});
