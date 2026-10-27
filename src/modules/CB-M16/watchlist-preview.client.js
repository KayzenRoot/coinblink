// Fictional ordering exercise only. Never stores, alerts or contacts a service.
const root=document.querySelector("[data-m16-root]");

function wire(){
  const launch=root?.querySelectorAll("[data-m16-add]");
  const targets={
    order:root?.querySelector("[data-m16-order]"),
    empty:root?.querySelector("[data-m16-empty]"),
    progress:root?.querySelector("[data-m16-progress]"),
    verdict:root?.querySelector("[data-m16-verdict]"),
    direction:root?.querySelector("[data-m16-direction]"),
    reset:root?.querySelector("[data-m16-reset]"),
  };
  const catalog=[...(launch??[])].map((button)=>button.getAttribute("data-m16-add"));
  const valid=catalog.length===4 && catalog.every((id)=>typeof id==="string"&&id.length>0) &&
    targets.order instanceof HTMLOListElement && targets.empty instanceof HTMLParagraphElement &&
    targets.progress instanceof HTMLParagraphElement && targets.verdict instanceof HTMLParagraphElement &&
    targets.direction instanceof HTMLSelectElement && targets.reset instanceof HTMLButtonElement;
  if(!valid)return null;
  return {catalog,launch:[...(launch??[])],...targets};
}

const parts=wire();
if(parts){
  const {order,empty,progress,verdict,direction,reset}=parts;
  const labelOf=new Map(parts.launch.map((button)=>[
    button.getAttribute("data-m16-add"),button.previousElementSibling?.textContent??"",
  ]));
  let sequence=[];
  let focusHint=null;

  const controls=(id,index)=>{
    const row=document.createElement("li");
    const name=document.createElement("span");
    name.textContent=labelOf.get(id)??id;
    const up=document.createElement("button");
    up.type="button"; up.textContent="Move up"; up.dataset.m16Move="up"; up.dataset.m16Id=id;
    up.disabled=index===0;
    const down=document.createElement("button");
    down.type="button"; down.textContent="Move down"; down.dataset.m16Move="down"; down.dataset.m16Id=id;
    down.disabled=index===sequence.length-1;
    const drop=document.createElement("button");
    drop.type="button"; drop.textContent="Remove"; drop.dataset.m16Remove=id;
    row.append(name,up,down,drop);
    return row;
  };

  const paint=()=>{
    order.replaceChildren(...sequence.map((id,index)=>controls(id,index)));
    empty.hidden=sequence.length>0;
    const chosen=direction.value==="none"?"no direction":"notional direction "+direction.value;
    progress.textContent=sequence.length+" of 4 practice entries ordered in this session.";
    verdict.textContent="ALERTS DISABLED · NOT_CONFIGURED · "+sequence.length+
      " fictional entries ordered with "+chosen+". Nothing is monitored or delivered.";
    if(focusHint){
      const pick=(way)=>order.querySelector(
        '[data-m16-move="'+way+'"][data-m16-id="'+focusHint.id+'"]');
      const wanted=pick(focusHint.direction);
      const other=pick(focusHint.direction==="up"?"down":"up");
      const target=wanted&&!wanted.disabled?wanted:other;
      target?.focus();
      focusHint=null;
    }
  };

  const swap=(id,step)=>{
    const from=sequence.indexOf(id);
    const to=from+step;
    if(from<0||to<0||to>=sequence.length)return false;
    const next=sequence.slice();
    next[from]=sequence[to];
    next[to]=sequence[from];
    sequence=next;
    return true;
  };

  parts.launch.forEach((button)=>{
    button.addEventListener("click",()=>{
      const id=button.getAttribute("data-m16-add");
      if(sequence.includes(id)||sequence.length>=4)return;
      sequence=[...sequence,id];
      paint();
      button.disabled=true;
    });
  });

  order.addEventListener("click",(event)=>{
    const button=event.target instanceof HTMLElement?event.target.closest("button"):null;
    if(!button)return;
    const removed=button.getAttribute("data-m16-remove");
    if(removed){
      sequence=sequence.filter((id)=>id!==removed);
      const additive=parts.launch.find((item)=>item.getAttribute("data-m16-add")===removed);
      if(additive)additive.disabled=false;
      paint();
      return;
    }
    const moved=button.getAttribute("data-m16-move");
    const id=button.getAttribute("data-m16-id");
    if(!moved||!id)return;
    if(swap(id,moved==="up"?-1:1)){
      focusHint={direction:moved,id};
      paint();
    }
  });

  direction.addEventListener("change",paint);
  reset.addEventListener("click",()=>{
    sequence=[];
    parts.launch.forEach((button)=>{button.disabled=false;});
    direction.value="none";
    paint();
    parts.launch[0]?.focus();
  });

  paint();
}
