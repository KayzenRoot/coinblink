import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const MODEL="../../../src/modules/CB-M16/watchlist-model.mjs";

const INVALID=Object.freeze({status:"INVALID_PREVIEW",preview:null});
const DENIED_ORDERS=[null,undefined,true,{},12,"btc",["__proto__"],["../admin"],["btc","btc"],
  ["btc",null],["btc",3],["btc","eth","stable","index","extra"],["constructor"],
  ["https://external.invalid"]];
const ALL_ORDERS=[["btc"],["index","stable"],["eth","btc","index"],["btc","eth","stable","index"]];
const DIRECTIONS=["none","above","below"];

test("M16 P0 catalog exposes four frozen entries carrying only an id and a label",async()=>{
  const {listLocalWatchlistEntries}=await import(MODEL);
  const entries=listLocalWatchlistEntries();
  assert.equal(Object.isFrozen(entries),true);
  assert.deepEqual(entries.map((entry)=>entry.id),["btc","eth","stable","index"]);
  for(const entry of entries){
    assert.equal(Object.isFrozen(entry),true);
    assert.deepEqual(Object.keys(entry),["id","label"]);
    assert.ok(entry.label.length>=20,`label too short: ${entry.label}`);
    assert.doesNotMatch(entry.label,/https?:|\d{2,}/u);
  }
});

test("M16 P0 allowed orderings and directions never produce a delivered alert",async()=>{
  const {buildLocalWatchlist}=await import(MODEL);
  for(const order of ALL_ORDERS){
    for(const threshold of DIRECTIONS){
      const preview=buildLocalWatchlist(order,threshold);
      assert.equal(preview.status,"LOCAL_PREVIEW_ONLY");
      assert.equal(preview.mode,"LOCAL_SYNTHETIC");
      assert.equal(preview.threshold,threshold);
      assert.deepEqual([...preview.entries],order);
      assert.equal(preview.alertDelivery,"NOT_CONFIGURED");
      for(const flag of ["orderLocked","alertsEnabled","realTimeData","live","providerConnected",
        "personalDataStored","accountRequired","pushEnabled","emailEnabled"]){
        assert.equal(preview[flag],false,`${flag} must stay false`);
      }
      assert.equal(preview.notificationsSent,0);
      assert.deepEqual(preview.actions,[]);
      for(const part of [preview.entries,preview.actions,preview])assert.equal(Object.isFrozen(part),true);
    }
  }
});

test("M16 P0 rejected orderings and directions fail closed without state",async()=>{
  const {buildLocalWatchlist}=await import(MODEL);
  for(const order of DENIED_ORDERS)assert.deepEqual(buildLocalWatchlist(order),INVALID);
  for(const threshold of [null,"","ALERTS","above ",0,[],{},true,"ABOVE"]){
    assert.deepEqual(buildLocalWatchlist(["btc"],threshold),INVALID);
  }
});

test("M16 P0 reordering swaps neighbours, refuses the edges and never mutates its input",async()=>{
  const {moveLocalWatchlistEntry}=await import(MODEL);
  const original=Object.freeze(["btc","eth","stable"]);
  assert.deepEqual([...moveLocalWatchlistEntry(original,"eth","up")],["eth","btc","stable"]);
  assert.deepEqual([...moveLocalWatchlistEntry(original,"eth","down")],["btc","stable","eth"]);
  assert.equal(Object.isFrozen(moveLocalWatchlistEntry(original,"eth","up")),true);
  assert.deepEqual([...original],["btc","eth","stable"],"input must not be mutated");
  assert.equal(moveLocalWatchlistEntry(original,"btc","up"),null,
    "moving the first entry up is refused instead of silently reordering");
  assert.equal(moveLocalWatchlistEntry(original,"stable","down"),null);
  for(const bad of [[original,"unknown","up"],[original,"eth","sideways"],[["btc","btc"],"btc","up"],
    [null,"btc","up"],[[],"btc","up"],[original,null,"up"]]){
    assert.equal(moveLocalWatchlistEntry(...bad),null,`must reject ${JSON.stringify(bad)}`);
  }
});

test("M16 P0 shipped browser sources keep the no-account, no-delivery boundary",()=>{
  const sources=["src/modules/CB-M16/WatchlistPreview.astro","src/pages/demo/watchlist.astro",
    "src/modules/CB-M16/watchlist-preview.client.js"];
  const page=readFileSync(sources[0],"utf8");
  const route=readFileSync(sources[1],"utf8");
  const script=readFileSync(sources[2],"utf8");
  const styles=readFileSync("src/modules/CB-M16/watchlist-preview.css","utf8");
  assert.match(route,/WatchlistPreview/u);
  assert.match(page,/data-m16-add=/u);
  assert.match(page,/data-m16-order/u);
  assert.match(page,/data-m16-verdict[^>]*aria-live="polite"/u);
  assert.match(page,/ALERTS DISABLED/u);
  assert.match(page,/watchlist-preview\.(?:client\.js|css)\?url&no-inline/u);
  assert.match(script,/textContent/u);
  assert.match(script,/replaceChildren/u);
  assert.match(styles,/focus-visible/u);
  const forbidden=/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|<iframe|<form|type="email"|type="password"|<img|document\.cookie|process\.env|new\s+Notification|Notification\.(?:requestPermission|permission)|serviceWorker|\/admin\/api/iu;
  for(const source of sources)assert.doesNotMatch(readFileSync(source,"utf8"),forbidden);
});
