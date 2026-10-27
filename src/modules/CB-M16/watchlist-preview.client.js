// Fictional ordering exercise only. Never stores, alerts or contacts a service.
const root=document.querySelector("[data-m16-root]");

function wire(){
  const adders=[...(root?.querySelectorAll("[data-m16-add]")??[])];
  const parts={
    order:root?.querySelector("[data-m16-order]"),
    empty:root?.querySelector("[data-m16-empty]"),
    progress:root?.querySelector("[data-m16-progress]"),
    verdict:root?.querySelector("[data-m16-verdict]"),
    direction:root?.querySelector("[data-m16-direction]"),
    reset:root?.querySelector("[data-m16-reset]"),
  };
  const usable=adders.every((button)=>typeof button.dataset.m16Add==="string"&&button.dataset.m16Add.length>0) &&
    adders.length===4 &&
    parts.order instanceof HTMLOListElement && parts.empty instanceof HTMLParagraphElement &&
    parts.progress instanceof HTMLParagraphElement && parts.verdict instanceof HTMLParagraphElement &&
    parts.direction instanceof HTMLSelectElement && parts.reset instanceof HTMLButtonElement;
  if(!usable)return null;
  return {adders,...parts};
}

const parts=wire();
if(parts){
  const {adders,order,empty,progress,verdict,direction,reset}=parts;
  const labelOf=new Map(adders.map((button)=>[button.dataset.m16Add,button.previousElementSibling?.textContent??""]));
  let sequence=[];
  let focusHint=null;

  const makeButton=(text,move,id,disabled)=>{
    const button=document.createElement("button");
    button.type="button";
    button.textContent=text;
    button.dataset.m16Move=move;
    button.dataset.m16Id=id;
    button.disabled=disabled;
    return button;
  };

  const rowFor=(id,index)=>{
    const row=document.createElement("li");
    const name=document.createElement("span");
    name.textContent=labelOf.get(id)??id;
    const drop=document.createElement("button");
    drop.type="button";
    drop.textContent="Remove";
    drop.dataset.m16Remove=id;
    row.append(
      name,
      makeButton("Move up","up",id,index===0),
      makeButton("Move down","down",id,index===sequence.length-1),
      drop,
    );
    return row;
  };

  const restoreFocus=()=>{
    if(!focusHint)return;
    const pick=(way)=>order.querySelector(
      '[data-m16-move="'+way+'"][data-m16-id="'+focusHint.id+'"]');
    const wanted=pick(focusHint.direction);
    const target=wanted&&!wanted.disabled?wanted:pick(focusHint.direction==="up"?"down":"up");
    target?.focus();
    focusHint=null;
  };

  const paint=()=>{
    order.replaceChildren(...sequence.map((id,index)=>rowFor(id,index)));
    empty.hidden=sequence.length>0;
    const chosen=direction.value==="none"?"no direction":"notional direction "+direction.value;
    progress.textContent=sequence.length+" of 4 practice entries ordered in this session.";
    verdict.textContent="ALERTS DISABLED · NOT_CONFIGURED · "+sequence.length+
      " fictional entries ordered with "+chosen+". Nothing is monitored or delivered.";
    restoreFocus();
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

  const reinstate=(id)=>{
    const adder=adders.find((item)=>item.dataset.m16Add===id);
    if(adder)adder.disabled=false;
  };

  const handleRowClick=(button)=>{
    const removed=button.dataset.m16Remove;
    if(removed){
      sequence=sequence.filter((id)=>id!==removed);
      reinstate(removed);
      paint();
      return;
    }
    const moved=button.dataset.m16Move;
    const id=button.dataset.m16Id;
    if(!moved||!id)return;
    if(swap(id,moved==="up"?-1:1)){
      focusHint={direction:moved,id};
      paint();
    }
  };

  adders.forEach((button)=>{
    button.addEventListener("click",()=>{
      const id=button.dataset.m16Add;
      if(sequence.includes(id)||sequence.length>=4)return;
      sequence=[...sequence,id];
      button.disabled=true;
      paint();
    });
  });

  order.addEventListener("click",(event)=>{
    const button=event.target instanceof HTMLElement?event.target.closest("button"):null;
    if(button)handleRowClick(button);
  });

  direction.addEventListener("change",paint);
  reset.addEventListener("click",()=>{
    sequence=[];
    adders.forEach((button)=>{button.disabled=false;});
    direction.value="none";
    paint();
    adders[0]?.focus();
  });

  paint();
}
