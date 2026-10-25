// CB-M13: draw only immutable server-prepared placeholder labels.
const root=document.querySelector("[data-m13-root]");
const choice=root?.querySelector("[data-m13-context]");
const listing=root?.querySelector("[data-m13-card-list]");
const status=root?.querySelector("[data-m13-status]");
const reset=root?.querySelector("[data-m13-reset]");
const known=Object.freeze({home:2,article:3,digest:1});
if(choice instanceof HTMLSelectElement && listing instanceof HTMLElement &&
   status instanceof HTMLElement && reset instanceof HTMLButtonElement){
  const draw=()=>{
    listing.replaceChildren();
    const key=choice.value;
    const raw=choice.selectedOptions.item(0)?.dataset.m13Snapshot;
    let envelope=null;
    try{envelope=JSON.parse(raw||"null");}catch{envelope=null;}
    const preview=envelope?.preview;
    const valid=Object.hasOwn(known,key) && envelope?.status==="EMPTY_LAYOUT_ONLY" &&
      preview?.mode==="LOCAL_SYNTHETIC" && preview?.context===key &&
      preview?.adsEnabled===false && preview?.live===false &&
      preview?.bookingEnabled===false && preview?.sponsor===null &&
      preview?.revenue===null && preview?.impressionsTracked===false &&
      preview?.clicksTracked===false && preview?.slotCount===known[key] &&
      Array.isArray(preview.slots) && preview.slots.length===known[key] &&
      preview.slots.every(slot=>typeof slot?.id==="string" &&
        /^[a-z-]+$/u.test(slot.id) && typeof slot.label==="string" &&
        slot.state==="EMPTY_PLACEHOLDER" && slot.isAdvertisement===false &&
        slot.creative===null) &&
      new Set(preview.slots.map(slot=>slot.id)).size===known[key];
    if(!valid){
      status.textContent="Invalid LOCAL placeholder data. No layout, advertisement or access was created.";
      return;
    }
    for(const slot of preview.slots){
      const li=document.createElement("li");
      li.dataset.m13Card="";
      const strong=document.createElement("strong");
      strong.textContent=slot.label;
      const label=document.createElement("p");
      label.textContent="EMPTY PLACEHOLDER · NOT AN AD";
      li.append(strong,label);
      listing.append(li);
    }
    status.textContent=String(preview.slotCount)+" empty illustrative spaces · NO LIVE ADS";
  };
  choice.addEventListener("change",draw);
  reset.addEventListener("click",()=>{
    choice.value="home";
    draw();
    choice.focus();
  });
  draw();
}
