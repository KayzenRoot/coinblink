import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const MODEL="../../../src/modules/CB-M17/storyboard-model.mjs";

const REJECTED=Object.freeze({status:"INVALID_BRIEF",plan:null});
const GOOD_BRIEF=Object.freeze({title:"A fictional explainer about custody layers",ratio:"16:9"});
const goodBeat=(kind,caption)=>({kind,caption});
const BEATS=[
  goodBeat("cover","Illustrative cover for an invented custody explainer"),
  goodBeat("diagram","Fictional diagram of layered key custody") ,
];
const APPROVED_CLAIMS=["authentic photo","real photo","live photo","photo of the event",
  "actual event photo","genuine photograph","unedited photo","real footage","live footage","breaking photo"];

test("M17 P0 shot catalog, ratios and limits are frozen and bounded",async()=>{
  const model=await import(MODEL);
  const kinds=model.listLocalShotKinds();
  const ratios=model.listLocalAspectRatios();
  const limits=model.listLocalStoryboardLimits();
  assert.equal(Object.isFrozen(kinds),true);
  assert.deepEqual([...kinds],["cover","section","diagram","chart","timeline","animation"]);
  assert.deepEqual([...ratios],["16:9","4:5","9:16"]);
  assert.ok(Object.isFrozen(ratios));
  assert.deepEqual(limits,{maxShots:5,minTitle:8,maxTitle:120,minCaption:6,maxCaption:140});
  assert.ok(Object.isFrozen(limits));
});

test("M17 P0 an accepted plan still produces, uploads and publishes nothing",async()=>{
  const {planLocalStoryboard}=await import(MODEL);
  for(const ratio of ["16:9","4:5","9:16"]){
    const plan=planLocalStoryboard({...GOOD_BRIEF,ratio},BEATS);
    assert.ok(Object.isFrozen(plan));
    assert.equal(plan.status,"LOCAL_PLAN_ONLY");
    assert.equal(plan.mode,"LOCAL_SYNTHETIC");
    assert.equal(plan.ratio,ratio);
    assert.equal(plan.shotCount,2);
    assert.deepEqual(plan.shots.map((shot)=>shot.index),[0,1]);
    for(const shot of plan.shots){
      assert.ok(Object.isFrozen(shot));
      assert.equal(shot.ratio,ratio);
      assert.equal(typeof shot.caption,"string");
      assert.deepEqual(Object.keys(shot),["index","kind","ratio","caption"]);
    }
    for(const flag of ["mediaProduced","providerConnected","uploadEnabled","published","storageUsed",
      "rightsCleared","provenanceAttached","renderQueued","costCapEnforced"]){
      assert.equal(plan[flag],false,`${flag} must stay false`);
    }
    assert.equal(plan.altTextRequired,true);
    assert.equal(plan.humanReviewRequired,true);
    assert.equal(plan.costUsd,0);
    assert.equal(plan.costCapUsd,0);
    assert.deepEqual(plan.actions,[]);
    assert.ok(Object.isFrozen(plan.shots)&&Object.isFrozen(plan.actions));
  }
});

test("M17 P0 authenticity claims are refused in the title and in every shot caption",async()=>{
  const {planLocalStoryboard}=await import(MODEL);
  for(const claim of APPROVED_CLAIMS){
    const inTitle=planLocalStoryboard({...GOOD_BRIEF,title:"Fictional story with "+claim+" inside"},BEATS);
    assert.deepEqual(inTitle,REJECTED,`title claim not refused: ${claim}`);
    const inCaption=planLocalStoryboard(GOOD_BRIEF,
      [goodBeat("cover","Fictional cover described as "+claim+" for practice")]);
    assert.deepEqual(inCaption,REJECTED,`caption claim not refused: ${claim}`);
  }
});

test("M17 P0 malformed briefs, shots and duplicates fail closed",async()=>{
  const {planLocalStoryboard}=await import(MODEL);
  const badBriefs=[null,undefined,true,"brief",12,[],{...GOOD_BRIEF,title:"short"},
    {...GOOD_BRIEF,title:"x".repeat(121)},{...GOOD_BRIEF,title:" padded title here "},
    {...GOOD_BRIEF,title:"Fictional\u0007story here"},{...GOOD_BRIEF,ratio:"21:9"},
    {...GOOD_BRIEF,ratio:null},{...GOOD_BRIEF,title:42}];
  for(const brief of badBriefs)assert.deepEqual(planLocalStoryboard(brief,BEATS),REJECTED);
  const badBeats=[null,undefined,"shots",{},[],[goodBeat("cover","tiny")],
    [goodBeat("poster","Fictional caption long enough to pass")],
    [goodBeat("cover","Fictional caption long enough to pass"),goodBeat("cover","Fictional caption long enough to pass")],
    [goodBeat("cover",null)],[goodBeat("cover","x".repeat(141))],
    [goodBeat("cover","Fictional caption long enough to pass"),goodBeat("cover","Second distinct fictional caption")].concat(
      Array.from({length:4},(_,i)=>goodBeat("section","Extra fictional caption number "+i)))];
  for(const beats of badBeats)assert.deepEqual(planLocalStoryboard(GOOD_BRIEF,beats),REJECTED);
  assert.deepEqual(planLocalStoryboard(undefined,undefined),REJECTED);
});

test("M17 P0 shipped sources import the tested model and keep every media boundary",()=>{
  const files=["src/modules/CB-M17/StoryboardComposer.astro","src/pages/demo/storyboard.astro",
    "src/modules/CB-M17/storyboard-composer.client.js"];
  const page=readFileSync(files[0],"utf8");
  const route=readFileSync(files[1],"utf8");
  const script=readFileSync(files[2],"utf8");
  const styles=readFileSync("src/modules/CB-M17/storyboard-composer.css","utf8");
  assert.match(route,/StoryboardComposer/u);
  assert.match(page,/data-m17-model=\{modelUrl\}/u);
  assert.match(page,/storyboard-model\.mjs\?url/u);
  assert.match(page,/data-m17-result[^>]*aria-live="polite"/u);
  assert.match(page,/NOTHING PRODUCED/u);
  assert.match(script,/await import\(/u,"the client must load the tested model instead of copying its rules");
  assert.match(styles,/focus-visible/u);
  const forbidden=/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|<iframe|type="email"|type="password"|<img|<video|document\.cookie|process\.env|serviceWorker|\/admin\/api/iu;
  for(const file of files)assert.doesNotMatch(readFileSync(file,"utf8"),forbidden);
});
