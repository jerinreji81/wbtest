/* WorshipBase Phase 2b - L8 final completion gate owner.
   Owns the final modularisation completion decision after the source host is active,
   the inline host runtime is retired, and browser smoke/parity diagnostics pass. */
(function(root){
'use strict';
var PHASE='Phase 2b - L8';
function safe(fn,fallback){try{return typeof fn==='function'?fn():fallback}catch(e){return Object.assign({error:String(e&&e.message||e)},fallback||{})}}
function completionContract(){return {owner:'WBFinalCompletionGateController',phase:PHASE,boundary:'manual-browser-parity-sign-off-final-completion-gate',requires:['source-owned host active','legacy host not active build input','inline host runtime retired','browser smoke diagnostics pass','final host readiness pass'],productBehaviourChanged:false};}
function completionGate(ctx){
  ctx=ctx||{};
  var smoke=safe(function(){return root.WBBrowserParitySmokeController&&root.WBBrowserParitySmokeController.diagnostics?root.WBBrowserParitySmokeController.diagnostics(ctx):null},null)||{};
  var source=safe(function(){return root.WBSourceHostController&&root.WBSourceHostController.hostReadiness?root.WBSourceHostController.hostReadiness(ctx):null},null)||{};
  var final=safe(function(){return root.WBFinalHostFlipController&&root.WBFinalHostFlipController.legacyShellRetirementReadiness?root.WBFinalHostFlipController.legacyShellRetirementReadiness(Object.assign({},ctx,{legacyShellActive:false})):null},null)||{};
  var pass=!!(smoke.pass&&source.ready&&final.ready&&!final.legacyShellActive);
  var blockers=[];
  if(!smoke.pass)blockers.push('browser smoke gate did not pass');
  if(!source.ready)blockers.push('source host readiness did not pass');
  if(!final.ready)blockers.push('final host readiness did not pass');
  if(final.legacyShellActive)blockers.push('legacy shell is still active');
  return {owner:'WBFinalCompletionGateController',phase:PHASE,gate:'final-modularisation-completion',modularisationComplete:pass,pass:pass,blockers:blockers,smoke:smoke,sourceHost:source,finalHost:final};
}
function diagnostics(ctx){return completionGate(ctx||{});} 
root.WBFinalCompletionGateController={completionContract:completionContract,completionGate:completionGate,diagnostics:diagnostics};
})(window);
