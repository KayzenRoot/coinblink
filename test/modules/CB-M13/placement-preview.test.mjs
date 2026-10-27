import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const MODEL = "../../../src/modules/CB-M13/placement-preview.mjs";

test("M13 P0 layout registry is immutable and includes three empty fictional contexts", async () => {
  const { listLocalPlacementContexts, buildLocalPlacementPreview } = await import(MODEL);
  const contexts = listLocalPlacementContexts();
  assert.ok(Object.isFrozen(contexts));
  assert.deepEqual(contexts.map(x => [x.id, x.slotCount]), [["home",2],["article",3],["digest",1]]);
  for(const ctx of contexts){
    assert.ok(Object.isFrozen(ctx));
    assert.deepEqual(Object.keys(ctx).sort(), ["id","label","slotCount"]);
    const r=buildLocalPlacementPreview(ctx.id);
    assert.equal(r.status,"EMPTY_LAYOUT_ONLY");
    const p=r.preview;
    assert.equal(p.context,ctx.id);
    assert.equal(p.slotCount,ctx.slotCount);
    assert.equal(p.slots.length,ctx.slotCount);
    assert.equal(p.mode,"LOCAL_SYNTHETIC");
    assert.equal(p.live,false);
    assert.equal(p.adsEnabled,false);
    assert.equal(p.sponsor,null);
    assert.equal(p.revenue,null);
    assert.equal(p.impressionsTracked,false);
    assert.equal(p.clicksTracked,false);
    assert.equal(p.bookingEnabled,false);
    assert.ok(Object.isFrozen(p) && Object.isFrozen(p.slots));
    assert.ok(p.slots.every(x=>Object.isFrozen(x)&&x.state==="EMPTY_PLACEHOLDER"&&x.isAdvertisement===false&&x.creative===null&&/^[a-z-]+$/u.test(x.id)));
    assert.equal(new Set(p.slots.map(x=>x.id)).size,p.slotCount);
  }
});

test("M13 P0 invalid or hostile context fails closed", async () => {
  const { buildLocalPlacementPreview } = await import(MODEL);
  const denied=Object.freeze({status:"INVALID_CONTEXT",preview:null});
  for(const x of ["__proto__","constructor","","HOME","../admin","https://ad-network.invalid",null,undefined,13,[],{},true]){
    assert.deepEqual(buildLocalPlacementPreview(x),denied);
  }
});

test("M13 P0 route and UI have visible placeholders but no money, ads, storage or privileged requests", () => {
  const route=readFileSync("src/pages/demo/placements.astro","utf8");
  const astro=readFileSync("src/modules/CB-M13/PlacementPreview.astro","utf8");
  const client=readFileSync("src/modules/CB-M13/placement-preview.client.js","utf8");
  const css=readFileSync("src/modules/CB-M13/placement-preview.css","utf8");
  assert.match(route,/PlacementPreview/u);
  assert.match(astro,/data-m13-context/u);
  assert.match(astro,/data-m13-card-list/u);
  assert.match(astro,/data-m13-status[^>]*aria-live="polite"/u);
  assert.match(astro,/placement-preview\.client\.js\?url&no-inline/u);
  assert.match(astro,/placement-preview\.css\?url&no-inline/u);
  assert.match(astro,/NO LIVE ADS/u);
  assert.match(astro,/NO REVENUE/u);
  assert.match(client,/replaceChildren\(\)/u);
  assert.match(client,/textContent/u);
  assert.match(css,/:focus-visible/u);
  for(const source of [astro,client,route]){
    assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|<iframe|<form|type="email"|type="password"|<img|<script[^>]*https?:|\/admin\/|document\.cookie|process\.env/u);
  }
});
