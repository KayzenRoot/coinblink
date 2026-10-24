// CB-M05-P1-OWNER-ACCESS-001: isolated D1 bootstrap proof, never an application route.
const FIXTURE_ORIGIN='https://owner.example.test';
const validToken=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
const validTime=x=>Number.isSafeInteger(x)&&x>=0;
async function sha256(text) {
  const bytes=new TextEncoder().encode(text);
  const sum=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(sum),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function mintLocalTicket({db,token,nowSeconds,ttlSeconds=900}={}) {
  if(!db||!validToken(token)||!validTime(nowSeconds)||!Number.isSafeInteger(ttlSeconds)||ttlSeconds<1||ttlSeconds>900){
    throw new TypeError('Invalid disposable bootstrap ticket');
  }
  const digest=await sha256(token);
  await db.prepare('INSERT INTO p1_ticket(digest,expires_at,consumed_at,claim_marker) VALUES (?, ?, NULL, NULL)').bind(digest,nowSeconds+ttlSeconds).run();
  return true;
}
export async function claimOwnerOnce({db,token,nowSeconds,origin,expectedOrigin,marker}={}) {
  if(!db||typeof db.batch!=='function'||!validToken(token)||!validTime(nowSeconds)||
    origin!==FIXTURE_ORIGIN||expectedOrigin!==FIXTURE_ORIGIN||
    typeof marker!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(marker)) return false;
  try{
    const digest=await sha256(token);
    // D1.batch executes as a single transaction. The unique owner_id=1 constraint
    // and claim_marker together prevent a losing claim from consuming its ticket.
    await db.batch([
      db.prepare('INSERT OR IGNORE INTO p1_owner(owner_id,claim_marker,created_at) SELECT 1,?,? WHERE EXISTS (SELECT 1 FROM p1_ticket WHERE digest=? AND consumed_at IS NULL AND expires_at>?)').bind(marker,nowSeconds,digest,nowSeconds),
      db.prepare('UPDATE p1_ticket SET consumed_at=?,claim_marker=? WHERE digest=? AND consumed_at IS NULL AND expires_at>? AND (SELECT claim_marker FROM p1_owner WHERE owner_id=1)=?').bind(nowSeconds,marker,digest,nowSeconds,marker),
    ]);
    const winner=await db.prepare('SELECT o.claim_marker AS owner_marker,t.claim_marker AS ticket_marker,t.consumed_at AS consumed FROM p1_owner o JOIN p1_ticket t ON t.digest=? WHERE o.owner_id=1').bind(digest).first();
    return winner?.owner_marker===marker&&winner.ticket_marker===marker&&winner.consumed===nowSeconds;
  }catch{return false;}
}
