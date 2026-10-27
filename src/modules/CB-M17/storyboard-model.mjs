// CB-M17-P0: fictional storyboard planner. It NEVER produces, uploads or publishes media.
const SHOT_KINDS=Object.freeze(["cover","section","diagram","chart","timeline","animation"]);
const RATIOS=Object.freeze(["16:9","4:5","9:16"]);
const KIND_LOOKUP=new Set(SHOT_KINDS);
const RATIO_LOOKUP=new Set(RATIOS);
const REJECTED=Object.freeze({status:"INVALID_BRIEF",plan:null});
const MAX_SHOTS=5;
const MAX_TITLE=120;
const MIN_TITLE=8;
const MAX_CAPTION=140;
const MIN_CAPTION=6;
const isUnsafeControl=(code)=>code===0x7f||(code<0x20&&code!==0x09&&code!==0x0a&&code!==0x0d);
const hasControlChar=(value)=>Array.from(value).some((glyph)=>isUnsafeControl(glyph.codePointAt(0)));
// Claims that would present generated artwork as authentic event photography.
const AUTHENTICITY_CLAIMS=Object.freeze([
  "authentic photo","real photo","live photo","photo of the event","actual event photo",
  "genuine photograph","unedited photo","real footage","live footage","breaking photo",
]);

function textFault(value,min,max){
  if(typeof value!=="string")return "type";
  const trimmed=value.trim();
  if(trimmed!==value)return "padding";
  if(hasControlChar(value))return "control";
  if(value.length<min||value.length>max)return "length";
  return null;
}

function claimsAuthenticity(text){
  const lowered=text.toLowerCase();
  return AUTHENTICITY_CLAIMS.some((claim)=>lowered.includes(claim));
}

export function listLocalShotKinds(){return SHOT_KINDS;}
export function listLocalAspectRatios(){return RATIOS;}
export function listLocalStoryboardLimits(){
  return Object.freeze({maxShots:MAX_SHOTS,minTitle:MIN_TITLE,maxTitle:MAX_TITLE,
    minCaption:MIN_CAPTION,maxCaption:MAX_CAPTION});
}

/** Build a fictional shot plan. Nothing is rendered, stored, uploaded or published. */
export function planLocalStoryboard(brief,beats){
  if(brief===null||typeof brief!=="object"||Array.isArray(brief))return REJECTED;
  if(textFault(brief.title,MIN_TITLE,MAX_TITLE))return REJECTED;
  if(!RATIO_LOOKUP.has(brief.ratio))return REJECTED;
  if(!Array.isArray(beats)||beats.length<1||beats.length>MAX_SHOTS)return REJECTED;
  const seen=new Set();
  const shots=[];
  for(const beat of beats){
    if(beat===null||typeof beat!=="object"||Array.isArray(beat))return REJECTED;
    if(!KIND_LOOKUP.has(beat.kind))return REJECTED;
    if(textFault(beat.caption,MIN_CAPTION,MAX_CAPTION))return REJECTED;
    if(claimsAuthenticity(beat.caption)||claimsAuthenticity(brief.title))return REJECTED;
    const signature=beat.kind+"\u0000"+beat.caption;
    if(seen.has(signature))return REJECTED;
    seen.add(signature);
    shots.push(Object.freeze({
      index:shots.length,
      kind:beat.kind,
      ratio:brief.ratio,
      caption:beat.caption,
    }));
  }
  return Object.freeze({
    status:"LOCAL_PLAN_ONLY",mode:"LOCAL_SYNTHETIC",
    title:brief.title,ratio:brief.ratio,
    shots:Object.freeze(shots),shotCount:shots.length,
    mediaProduced:false,providerConnected:false,uploadEnabled:false,published:false,
    storageUsed:false,rightsCleared:false,provenanceAttached:false,renderQueued:false,
    altTextRequired:true,humanReviewRequired:true,
    costUsd:0,costCapUsd:0,costCapEnforced:false,
    actions:Object.freeze([]),
  });
}
