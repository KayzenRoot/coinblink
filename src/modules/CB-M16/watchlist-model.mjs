// CB-M16-P0: fictional watchlist preview. A saved watchlist NEVER creates a live alert.
const ASSETS=Object.freeze([
  Object.freeze({id:"btc",label:"Fictional Bitcoin-like market entry"}),
  Object.freeze({id:"eth",label:"Fictional Ethereum-like market entry"}),
  Object.freeze({id:"stable",label:"Fictional stablecoin monitoring entry"}),
  Object.freeze({id:"index",label:"Fictional broad market index entry"}),
]);
const IDS=new Set(ASSETS.map(x=>x.id));
const INVALID=Object.freeze({status:"INVALID_PREVIEW",preview:null});
const THRESHOLDS=Object.freeze(["none","above","below"]);
export function listLocalWatchlistAssets(){return ASSETS;}
export function buildLocalWatchlist(selected,threshold="none"){
  if(!Array.isArray(selected)||selected.length>ASSETS.length||
     !selected.every(x=>typeof x==="string"&&IDS.has(x))||
     new Set(selected).size!==selected.length)return INVALID;
  if(!THRESHOLDS.includes(threshold))return INVALID;
  return Object.freeze({
    status:"LOCAL_PREVIEW_ONLY",mode:"LOCAL_SYNTHETIC",
    savedCount:selected.length,savedTotal:ASSETS.length,
    threshold,
    alertDelivery:"NOT_CONFIGURED",
    alertsEnabled:false,notificationsSent:0,realTimeData:false,
    live:false,providerConnected:false,personalDataStored:false,
    accountRequired:false,pushEnabled:false,emailEnabled:false,
    actions:Object.freeze([]),
    selected:Object.freeze(selected.slice()),
  });
}
