// CB-M14-P0: safe fictional drill scenarios, not telemetry or operational controls.
const SCENARIOS=Object.freeze([
  Object.freeze({id:"baseline",label:"Baseline practice"}),
  Object.freeze({id:"queue",label:"Simulated queue warning"}),
  Object.freeze({id:"security",label:"Simulated security hold"}),
]);
const STEPS=Object.freeze({
  baseline:Object.freeze([
    "Read the example indicators without assuming any production health.",
    "Practice documenting an observation before proposing changes.",
  ]),
  queue:Object.freeze([
    "Classify the fictional queue pressure as an exercise only.",
    "Identify what evidence a human operator would need to inspect.",
    "Describe a review step without operating any platform service.",
  ]),
  security:Object.freeze([
    "Treat the fictional security hold as an exercise, never a live alert.",
    "Document escalation responsibilities without opening privileged access.",
    "Request independent verification before any future recovery decision.",
  ]),
});
const SEVERITIES=Object.freeze({baseline:"PRACTICE_ONLY",queue:"SIMULATED_WARNING",security:"SIMULATED_HOLD"});
const INVALID=Object.freeze({status:"INVALID_EXERCISE",preview:null});
export function listLocalIncidentScenarios(){return SCENARIOS;}
export function buildLocalIncidentDrill(context){
  if(typeof context!=="string"||!Object.hasOwn(STEPS,context))return INVALID;
  return Object.freeze({
    status:"EXERCISE_ONLY",
    preview:Object.freeze({
      mode:"LOCAL_SYNTHETIC",context,severity:SEVERITIES[context],steps:STEPS[context],
      live:false,monitoringEnabled:false,remoteAccessEnabled:false,
      incidentDeclared:false,alertSent:false,rollbackExecuted:false,
      secretsAccessed:false,automationEnabled:false,actions:Object.freeze([]),
    }),
  });
}
