// Fictional interaction only. Never stores a preference or contacts a service.
const root=document.querySelector("[data-m16-root]");
const boxes=[...(root?.querySelectorAll("[data-m16-asset]")??[])];
const threshold=root?.querySelector("[data-m16-threshold]");
const progress=root?.querySelector("[data-m16-progress]");
const status=root?.querySelector("[data-m16-status]");
const reset=root?.querySelector("[data-m16-reset]");
const allowed=Object.freeze(["btc","eth","stable","index"]);
const directions=Object.freeze(["none","above","below"]);
if(boxes.length===4 && boxes.every(x=>x instanceof HTMLInputElement) &&
    threshold instanceof HTMLSelectElement &&
    progress instanceof HTMLElement && status instanceof HTMLElement &&
    reset instanceof HTMLButtonElement &&
    boxes.every((x,i)=>x.value===allowed[i]) &&
    [...threshold.options].every(option=>directions.includes(option.value))){
  const render=()=>{
    const count=boxes.filter(box=>box.checked).length;
    const direction=threshold.value==="none"?"no direction":
      "notional direction "+threshold.value;
    progress.textContent=count+" of 4 practice entries saved in this session.";
    status.textContent="ALERTS DISABLED · NOT_CONFIGURED · "+count+
      " fictional entries practiced with "+direction+". Nothing is monitored or delivered.";
  };
  boxes.forEach(box=>box.addEventListener("change",render));
  threshold.addEventListener("change",render);
  reset.addEventListener("click",()=>{
    boxes.forEach(box=>{box.checked=false;});
    threshold.value="none";
    render();
    boxes[0].focus();
  });
  render();
}
