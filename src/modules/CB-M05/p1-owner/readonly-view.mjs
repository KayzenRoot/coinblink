// CB-M05-P1-OWNER-ACCESS-001: LOCAL-only read model, no publishing/mutations.
const HEADERS=Object.freeze({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store, max-age=0',
  'x-content-type-options':'nosniff',
  'x-robots-tag':'noindex, nofollow',
});
export function renderOwnerReadOnly({authorized=false,ownerId}={}) {
  if(authorized!==true||ownerId!==1){
    return new Response(JSON.stringify({error:'Access denied'}),{status:401,headers:HEADERS});
  }
  return new Response(JSON.stringify({
    mode:'LOCAL_ONLY',
    ownerId:1,
    readOnly:true,
    marketData:'UNAVAILABLE',
    rights:'NOT_CLEARED',
    publiclyUsable:false,
    production:false,
  }),{status:200,headers:HEADERS});
}
