import test from "node:test";
import assert from "node:assert/strict";
import { inspectMockReadiness, summarizeMockReadiness, compareMockReadiness } from "../../../src/modules/CB-M04/market-readiness.mjs";
import { listMockMarkets } from "../../../src/modules/CB-M04/market-lab.mjs";

test("M04 readiness counts exactly the three frozen offline observations", () => {
  const summary=summarizeMockReadiness();
  assert.deepEqual(summary,{mode:"MOCK",total:3,stale:1,unavailable:2,live:0,tradable:0});
  assert.ok(Object.isFrozen(summary));
  for(const item of listMockMarkets().items){
    const {status,report}=inspectMockReadiness(item.asset);
    assert.equal(status,"MOCK_READINESS_ONLY");
    assert.equal(report.asset,item.asset);
    assert.equal(report.live,false);
    assert.equal(report.publiclyUsable,false);
    assert.equal(report.numericQuote,null);
    assert.equal(report.inspection,"DENIED_RIGHTS");
    assert.ok(Object.isFrozen(report)&&Object.isFrozen(report.blockers));
    assert.equal(report.blockers.includes("NO_LIVE_FEED"),true);
    assert.equal(report.blockers.includes("RIGHTS_NOT_CLEARED"),true);
    assert.doesNotMatch(JSON.stringify(report), /numericValue|provider|sourceUrl|secret|password/u);
  }
});
test("M04 invalid symbol requests fail closed without enumerating any data",()=>{
  for(const symbol of [null,undefined,42,"DOGE","btc","../admin","__proto__","BTC/USD"]){
    assert.deepEqual(inspectMockReadiness(symbol),{status:"NOT_FOUND",report:null});
  }
});
test("M04 comparison is bounded, immutable and refuses price or LIVE inference",()=>{
  const comparison=compareMockReadiness("BTC","ETH");
  assert.equal(comparison.status,"MOCK_COMPARISON_NO_PRICES");
  assert.equal(comparison.bothUnavailable,true);
  assert.equal(comparison.left.freshness,"STALE");
  assert.equal(comparison.right.freshness,"UNAVAILABLE");
  assert.ok(Object.isFrozen(comparison)&&Object.isFrozen(comparison.left)
    &&Object.isFrozen(comparison.right)&&Object.isFrozen(comparison.left.blockers));
  assert.doesNotMatch(JSON.stringify(comparison),/numericValue|numericQuote|price|provider|observedAtUTC/u);
  for(const pair of [["BTC","BTC"],["BTC","UNKNOWN"],["__proto__","SOL"]]){
    assert.deepEqual(compareMockReadiness(...pair),{status:"INVALID_PAIR",left:null,right:null});
  }
});
