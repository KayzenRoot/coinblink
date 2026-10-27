// Fictional interaction only. Never sets release rights or contacts a service.
const root=document.querySelector("[data-m15-root]");
const boxes=[...(root?.querySelectorAll("[data-m15-check]")??[])];
const progress=root?.querySelector("[data-m15-progress]");
const status=root?.querySelector("[data-m15-status]");
const reset=root?.querySelector("[data-m15-reset]");
const allowed=Object.freeze(["rights","consent","security","owner"]);
if(boxes.length===4 && boxes.every(x=>x instanceof HTMLInputElement) &&
    progress instanceof HTMLElement && status instanceof HTMLElement &&
    reset instanceof HTMLButtonElement &&
    boxes.every((x,i)=>x.value===allowed[i])){
  const render=()=>{
    const count=boxes.filter(box=>box.checked).length;
    progress.textContent=count+" of 4 practice topics checked.";
    status.textContent="RELEASE BLOCKED · BLOCKED_NOT_ADMITTED · "+count+
      " fictional topics practiced. No evidence or production approval verified.";
  };
  boxes.forEach(box=>box.addEventListener("change",render));
  reset.addEventListener("click",()=>{
    boxes.forEach(box=>{box.checked=false;});
    render();
    boxes[0].focus();
  });
  render();
}
