import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const PATH="../../../src/modules/CB-M16/watchlist-model.mjs";

test("M16 P0 watchlist catalog is immutable and contains four bounded fictional entries",async()=>{
  const {listLocalWatchlistAssets}=await import(PATH);
  const assets=listLocalWatchlistAssets();
  assert.equal(Object.isFrozen(assets),true);
  assert.deepEqual(assets.map(x=>x.id),["btc","eth","stable","index"]);
  for(const item of assets){
    assert.ok(Object.isFrozen(item));
    assert.deepEqual(Object.keys(item).sort(),["id","label"]);
    assert.equal(typeof item.label,"string");
    assert.ok(item.label.length>=12);
  }
});

test("M16 P0 saved watchlist never enables delivery even with every entry and a direction set",async()=>{
  const {buildLocalWatchlist}=await import(PATH);
  const ids=["btc","eth","stable","index"];
  for(const selected of [[],["btc"],["btc","eth"],ids]){
    for(const threshold of ["none","above","below"]){
      const result=buildLocalWatchlist(selected,threshold);
      assert.ok(Object.isFrozen(result));
      assert.equal(result.status,"LOCAL_PREVIEW_ONLY");
      assert.equal(result.mode,"LOCAL_SYNTHETIC");
      assert.equal(result.savedCount,selected.length);
      assert.equal(result.savedTotal,4);
      assert.equal(result.threshold,threshold);
      assert.equal(result.alertDelivery,"NOT_CONFIGURED");
      assert.equal(result.alertsEnabled,false);
      assert.equal(result.notificationsSent,0);
      assert.equal(result.realTimeData,false);
      assert.equal(result.live,false);
      assert.equal(result.providerConnected,false);
      assert.equal(result.personalDataStored,false);
      assert.equal(result.accountRequired,false);
      assert.equal(result.pushEnabled,false);
      assert.equal(result.emailEnabled,false);
      assert.equal(result.actions.length,0);
      assert.ok(Object.isFrozen(result.actions));
      assert.deepEqual([...result.selected],selected);
      assert.ok(Object.isFrozen(result.selected));
    }
  }
});

test("M16 P0 omitting the direction defaults to none and still cannot deliver",async()=>{
  const {buildLocalWatchlist}=await import(PATH);
  for(const result of [buildLocalWatchlist(["btc"]),buildLocalWatchlist(["btc"],undefined)]){
    assert.equal(result.status,"LOCAL_PREVIEW_ONLY");
    assert.equal(result.threshold,"none");
    assert.equal(result.alertsEnabled,false);
    assert.equal(result.notificationsSent,0);
  }
});

test("M16 P0 invalid selections, thresholds and duplicates fail closed with zero alert authority",async()=>{
  const {buildLocalWatchlist}=await import(PATH);
  const denied=Object.freeze({status:"INVALID_PREVIEW",preview:null});
  const badSelections=[null,undefined,true,{},12,"btc",["__proto__"],["../admin"],
    ["btc","btc"],["btc",null],["btc",3],["btc","eth","stable","index","extra"],
    ["constructor"],["https://external.invalid"]];
  for(const arg of badSelections)assert.deepEqual(buildLocalWatchlist(arg),denied);
  for(const threshold of [null,"","ALERTS","above ",0,[],{},true]){
    assert.deepEqual(buildLocalWatchlist(["btc"],threshold),denied);
  }
});

test("M16 P0 static browser contracts forbid accounts, persistence, delivery and privileged routing",()=>{
  const page=readFileSync("src/modules/CB-M16/WatchlistPreview.astro","utf8");
  const route=readFileSync("src/pages/demo/watchlist.astro","utf8");
  const js=readFileSync("src/modules/CB-M16/watchlist-preview.client.js","utf8");
  const css=readFileSync("src/modules/CB-M16/watchlist-preview.css","utf8");
  assert.match(route,/WatchlistPreview/u);
  assert.match(page,/data-m16-asset/u);
  assert.match(page,/data-m16-threshold/u);
  assert.match(page,/data-m16-progress/u);
  assert.match(page,/data-m16-status[^>]*aria-live="polite"/u);
  assert.match(page,/ALERTS DISABLED/u);
  assert.match(page,/watchlist-preview\.client\.js\?url&no-inline/u);
  assert.match(page,/watchlist-preview\.css\?url&no-inline/u);
  assert.match(js,/data-m16-reset/u);
  assert.match(js,/textContent/u);
  assert.match(css,/:focus-visible/u);
  for(const source of [page,route,js]){
    assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|<iframe|<form|type="email"|type="password"|<img|document\.cookie|process\.env|new\s+Notification|Notification\.(?:requestPermission|permission)|serviceWorker|\/admin\/api/iu);
  }
});
