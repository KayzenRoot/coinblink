// CB-M16-P0: fictional ordered watchlist. Ordering a list NEVER creates a live alert.
const ENTRIES=Object.freeze([
  Object.freeze({id:"btc",label:"Fictional Bitcoin-like market entry"}),
  Object.freeze({id:"eth",label:"Fictional Ethereum-like market entry"}),
  Object.freeze({id:"stable",label:"Fictional stablecoin monitoring entry"}),
  Object.freeze({id:"index",label:"Fictional broad market index entry"}),
]);
const KNOWN=Object.freeze(ENTRIES.map((entry)=>entry.id));
const DIRECTIONS=Object.freeze(["none","above","below"]);
const REJECTED=Object.freeze({status:"INVALID_PREVIEW",preview:null});

function isOrderedSubset(value){
  if(!Array.isArray(value)||value.length===0||value.length>KNOWN.length)return false;
  if(new Set(value).size!==value.length)return false;
  return value.every((id)=>typeof id==="string"&&KNOWN.includes(id));
}

export function listLocalWatchlistEntries(){return ENTRIES;}
export function listLocalWatchlistDirections(){return DIRECTIONS;}

/** Swap one entry with its neighbour; returns a new frozen array or null at the edges. */
export function moveLocalWatchlistEntry(order,id,direction){
  if(!isOrderedSubset(order))return null;
  if(direction!=="up"&&direction!=="down")return null;
  const from=order.indexOf(id);
  if(from===-1)return null;
  const to=direction==="up"?from-1:from+1;
  if(to<0||to>=order.length)return null;
  const next=order.slice();
  next[from]=order[to];
  next[to]=order[from];
  return Object.freeze(next);
}

export function buildLocalWatchlist(order,threshold="none"){
  if(!Array.isArray(order)||order.length>KNOWN.length)return REJECTED;
  if(!order.every((id)=>typeof id==="string"&&KNOWN.includes(id)))return REJECTED;
  if(new Set(order).size!==order.length)return REJECTED;
  if(!DIRECTIONS.includes(threshold))return REJECTED;
  return Object.freeze({
    status:"LOCAL_PREVIEW_ONLY",mode:"LOCAL_SYNTHETIC",
    entries:Object.freeze(order.slice()),
    savedCount:order.length,savedTotal:KNOWN.length,
    orderLocked:false,threshold,
    alertDelivery:"NOT_CONFIGURED",alertsEnabled:false,notificationsSent:0,
    realTimeData:false,live:false,providerConnected:false,personalDataStored:false,
    accountRequired:false,pushEnabled:false,emailEnabled:false,
    actions:Object.freeze([]),
  });
}
