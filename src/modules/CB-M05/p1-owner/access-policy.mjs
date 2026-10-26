// CB-M05-P1-OWNER-ACCESS-001: LOCAL synthetic boundary only. Not wired to /admin.
const ORIGIN='https://owner.example.test';
const COOKIE='__Host-cb_p1_owner';
const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const timestamp=x=>Number.isSafeInteger(x)&&x>=0;
async function keyedHash(key,raw) {
  if(!hex64(key)) throw new TypeError('Missing synthetic session HMAC');
  const secret=Uint8Array.from(key.match(/../g),x=>Number.parseInt(x,16));
  const k=await crypto.subtle.importKey('raw',secret,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const h=await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');
}
export async function authorizeLocalRead({request,db,secret,nowSeconds}={}) {
  const deny=Object.freeze({allowed:false,status:401});
  if(!(request instanceof Request)||!db||typeof db.prepare!=='function'||!hex64(secret)||!timestamp(nowSeconds))return deny;
  let url;
  try{url=new URL(request.url);}catch{return deny;}
  if(request.method!=='GET'||url.origin!==ORIGIN||url.pathname!=='/local/owner-readonly'||
    url.search||request.headers.get('sec-fetch-site')!=='same-origin')return deny;
  const h=request.headers.get('origin');
  if(h!==null&&h!==ORIGIN)return deny;
  const cookies=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(COOKIE+'='));
  if(cookies.length!==1)return deny;
  const raw=cookies[0].slice(COOKIE.length+1);
  if(!hex64(raw))return deny;
  try{
    const digest=await keyedHash(secret,raw);
    const row=await db.prepare(
      'SELECT s.owner_id FROM p1_session s JOIN p1_credentials c ON c.credential_id=s.credential_id JOIN p1_owner o ON o.owner_id=s.owner_id WHERE s.digest=? AND s.owner_id=1 AND s.revoked_at IS NULL AND c.revoked_at IS NULL AND s.issued_at<=? AND s.issued_at>? AND s.last_seen_at>? AND s.expires_at>?'
    ).bind(digest,nowSeconds,nowSeconds-43200,nowSeconds-1800,nowSeconds).first();
    if(row?.owner_id!==1)return deny;
    // If persistence refuses activity renewal, reject instead of extending an untracked session.
    const written=await db.prepare('UPDATE p1_session SET last_seen_at=? WHERE digest=? AND revoked_at IS NULL AND last_seen_at>? AND expires_at>? AND EXISTS (SELECT 1 FROM p1_credentials c WHERE c.credential_id=p1_session.credential_id AND c.revoked_at IS NULL)').bind(nowSeconds,digest,nowSeconds-1800,nowSeconds).run();
    if(written?.success!==true||written?.meta?.changes!==1)return deny;
    return Object.freeze({allowed:true,status:200,ownerId:1});
  }catch{return deny;}
}
// Used only by internal, verified synthetic-session handling.
export async function digestLocalSession(secret,token) {
  if(!hex64(token))throw new TypeError('Invalid synthetic session token');
  return keyedHash(secret,token);
}
