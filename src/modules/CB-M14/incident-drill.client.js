// Display-only synthetic example. No real incidents, backend, actions or persistent state.
const root=document.querySelector("[data-m14-root]");
const select=root?.querySelector("[data-m14-scenario]");
const steps=root?.querySelector("[data-m14-steps]");
const status=root?.querySelector("[data-m14-status]");
const reset=root?.querySelector("[data-m14-reset]");
const severity=Object.freeze({baseline:"PRACTICE_ONLY",queue:"SIMULATED_WARNING",security:"SIMULATED_HOLD"});
if(select instanceof HTMLSelectElement && steps instanceof HTMLElement &&
    status instanceof HTMLElement && reset instanceof HTMLButtonElement){
  const render=()=>{
    steps.replaceChildren();
    const key=select.value;
    const raw=select.selectedOptions.item(0)?.dataset.m14Example;
    let response;
    try{response=JSON.parse(raw||"null");}catch{response=null;}
    const exercise=response?.preview;
    const valid=Object.hasOwn(severity,key)&&response?.status==="EXERCISE_ONLY" &&
      exercise?.context===key && exercise?.severity===severity[key] &&
      exercise?.mode==="LOCAL_SYNTHETIC" && exercise?.live===false &&
      exercise?.monitoringEnabled===false && exercise?.remoteAccessEnabled===false &&
      exercise?.incidentDeclared===false && exercise?.alertSent===false &&
      exercise?.rollbackExecuted===false && exercise?.secretsAccessed===false &&
      exercise?.automationEnabled===false && Array.isArray(exercise?.actions) &&
      exercise.actions.length===0 && Array.isArray(exercise?.steps) &&
      exercise.steps.length>0 && exercise.steps.length<=3 &&
      exercise.steps.every(s=>typeof s==="string"&&s.length>=12);
    if(!valid){
      status.textContent="INVALID EXERCISE · Nothing executed or inspected.";
      return;
    }
    for(const step of exercise.steps){
      const li=document.createElement("li");
      li.textContent=step;
      steps.append(li);
    }
    status.textContent=exercise.severity.replaceAll("_"," ")+" · SIMULATION ONLY · NO ACTIONS EXECUTED";
  };
  select.addEventListener("change",render);
  reset.addEventListener("click",()=>{
    select.value="baseline";
    render();
    select.focus();
  });
  render();
}
