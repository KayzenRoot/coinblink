// M08 P0: deterministic synthetic editorial research. No inference, provider, network or publication.
import { inspectSyntheticProvenance } from "../CB-M03/source-investigation.mjs";
import { listSyntheticSources } from "../CB-M03/source-lab.mjs";
import { inspectMockReadiness } from "../CB-M04/market-readiness.mjs";
import { listMockMarkets } from "../CB-M04/market-lab.mjs";

export const RESEARCH_DEMO_POLICY = "OFFLINE_RESEARCH_NO_AI_NO_FACT_CHECK";
const INVALID = Object.freeze({ status: "INVALID_SELECTION", brief: null });

export function listMockResearchOptions() {
  const sources = listSyntheticSources().items.map(item =>
    Object.freeze({ id: item.id, label: item.label }));
  const markets = listMockMarkets().items.map(item =>
    Object.freeze({ asset: item.asset, label: item.pair }));
  return Object.freeze({
    sources: Object.freeze(sources),
    markets: Object.freeze(markets),
  });
}

export function buildMockResearchBrief(sourceId, asset) {
  const source = inspectSyntheticProvenance(sourceId).report;
  const market = inspectMockReadiness(asset).report;
  if (!source || !market) return INVALID;

  // The canonical M03 and M04 reports are the only inputs. Do not inspect URLs or emit prices.
  const sourceChecks = source.checks.map(check => Object.freeze({
    domain: "SOURCE", code: check.code, state: check.state, label: check.label,
  }));
  const marketChecks = market.blockers.map(code => Object.freeze({
    domain: "MARKET", code, state: "BLOCKED", label: code.replaceAll("_", " ").toLowerCase(),
  }));
  const blockers = Object.freeze([...sourceChecks, ...marketChecks]);
  const brief = Object.freeze({
    sourceId: source.id,
    sourceLabel: source.label,
    sourceStatus: source.inspection,
    asset: market.asset,
    pair: market.pair,
    freshness: market.freshness,
    blockers,
    blockerCount: blockers.length,
    quote: null,
    marketLive: false,
    publiclyUsable: false,
    verified: false,
    generatedByAI: false,
    published: false,
    nextStep: "Human investigation of rights, original evidence, timestamps and provider contracts required",
  });
  return Object.freeze({ status: "MOCK_RESEARCH_REVIEW_REQUIRED", brief });
}


// P1 local human triage groups canonical evidence gates without treating any
// synthetic source, quote or check as verified, licensed or publishable.
const INVALID_TRIAGE = Object.freeze({ status: "INVALID_SELECTION", summary: null });
export function summarizeMockResearchGates(sourceId, asset) {
  const result = buildMockResearchBrief(sourceId, asset);
  const brief = result.brief;
  if (!brief) return INVALID_TRIAGE;
  const sourceGates = brief.blockers.filter(row => row.domain === "SOURCE").length;
  const marketGates = brief.blockers.filter(row => row.domain === "MARKET").length;
  // Schema changes in the dependent modules must fail closed, not silently
  // misrepresent a partially checked evidence packet as complete.
  if (sourceGates !== 4 || marketGates !== 4 || brief.blockerCount !== 8) {
    return INVALID_TRIAGE;
  }
  return Object.freeze({
    status: "MOCK_TRIAGE_REVIEW_REQUIRED",
    summary: Object.freeze({
      total: brief.blockerCount, sourceGates, marketGates,
      humanReviewRequired: true, verified: 0, canPublish: false, live: false,
    }),
  });
}
