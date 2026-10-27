// Fictional planning exercise only. Imports the tested model; never renders or publishes media.
const root=document.querySelector("[data-m17-root]");
const MAX_SHOTS=5;

const grab=(name)=>root?.querySelector?.("[data-m17-"+name+"]");

async function mount(){
  const modelUrl=root?.dataset.m17Model;
  if(typeof modelUrl!=="string"||modelUrl.length===0)return;
  let model;
  try{
    model=await import(/* @vite-ignore */ modelUrl);
  }catch{
    return;
  }
  const planLocalStoryboard=model?.planLocalStoryboard;
  if(typeof planLocalStoryboard!=="function")return;

  const title=grab("title");
  const ratio=grab("ratio");
  const kind=grab("kind");
  const caption=grab("caption");
  const add=grab("add");
  const plan=grab("plan");
  const reset=grab("reset");
  const shots=grab("shots");
  const empty=grab("shots-empty");
  const result=grab("result");
  const ready=title instanceof HTMLInputElement && caption instanceof HTMLInputElement &&
    ratio instanceof HTMLSelectElement && kind instanceof HTMLSelectElement &&
    add instanceof HTMLButtonElement && plan instanceof HTMLButtonElement &&
    reset instanceof HTMLButtonElement && shots instanceof HTMLOListElement &&
    empty instanceof HTMLParagraphElement && result instanceof HTMLParagraphElement;
  if(!ready)return;

  const draft=[];
  const status=(text)=>{result.textContent=text;};

  const paintShots=()=>{
    shots.replaceChildren(...draft.map((beat,position)=>{
      const row=document.createElement("li");
      const text=document.createElement("span");
      text.textContent=beat.kind+" · "+beat.caption+" ("+ratio.value+")";
      const drop=document.createElement("button");
      drop.type="button";
      drop.textContent="Remove shot "+(position+1);
      drop.dataset.m17Drop=String(position);
      row.append(text,drop);
      return row;
    }));
    empty.hidden=draft.length>0;
  };

  const drafted=()=>{
    status("NOTHING PRODUCED · "+draft.length+" fictional shot(s) drafted. No media exists yet.");
  };

  add.addEventListener("click",()=>{
    if(draft.length>=MAX_SHOTS){
      status("REFUSED · INVALID_BRIEF · At most "+MAX_SHOTS+" fictional shots.");
      return;
    }
    draft.push({kind:kind.value,caption:caption.value});
    caption.value="";
    paintShots();
    caption.focus();
    drafted();
  });

  shots.addEventListener("click",(event)=>{
    const button=event.target instanceof HTMLElement?event.target.closest("button"):null;
    const drop=button?.dataset.m17Drop;
    if(drop===undefined)return;
    draft.splice(Number(drop),1);
    paintShots();
    drafted();
  });

  plan.addEventListener("click",()=>{
    const outcome=planLocalStoryboard({title:title.value,ratio:ratio.value},draft);
    if(outcome?.status!=="LOCAL_PLAN_ONLY"){
      status("REFUSED · INVALID_BRIEF · Nothing is produced.");
      return;
    }
    status("PLAN ONLY · "+outcome.shotCount+" fictional shot(s) at "+outcome.ratio+
      " · mediaProduced=false · published=false · cost "+outcome.costUsd+" USD.");
  });

  reset.addEventListener("click",()=>{
    draft.length=0;
    title.value="";
    caption.value="";
    kind.selectedIndex=0;
    ratio.selectedIndex=0;
    paintShots();
    status("NOTHING PRODUCED · Add fictional shots, then plan them.");
    title.focus();
  });

  paintShots();
}

mount().catch(()=>{
  const result=grab("result");
  if(result instanceof HTMLElement){
    result.textContent="NOTHING PRODUCED · The local planner could not start.";
  }
});
