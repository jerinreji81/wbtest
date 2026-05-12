/* WorshipBase Phase 2b - L7 source-owned host owner.
   Owns the active host contract after the build input moves out of src/legacy.
   It does not remove browser smoke-test requirements; it proves that the deployable
   shell is now sourced from src/host and records any remaining host-adapter debt. */
(function(root){
'use strict';

var HOST_FILE='src/host/index.phase-2b.html';
var ARCHIVED_LEGACY_HOST='src/legacy/index.phase-d.html';
var REQUIRED_HOST_ANCHORS=['app','toast','song-section','setlist-section','workspace-section','tools-section','settings-section','song-view','export-view','wb-export-pdf-preview-view','backup-centre-modal'];
var REQUIRED_RUNTIME_OWNERS=['WBStaticShellParityController','WBFinalHostFlipController','WBLegacyRuntimeAdapterController','WBMainShellController','WBGlobalSurfaceNavigationController','WBBrowserParitySmokeController'];

function doc(ctx){return (ctx&&ctx.document)||root.document||null;}
function hasId(d,id){try{return !!(d&&d.getElementById(id));}catch(e){return false;}}
function missingIds(d,ids){return ids.filter(function(id){return !hasId(d,id);});}
function missingGlobals(names){return names.filter(function(name){return !root[name];});}
function isSourceHostActive(){return true;}
function sourceHostContract(){
  return {
    owner:'WBSourceHostController',
    phase:'Phase 2b - L7',
    boundary:'source-owned-host-runtime-retired',
    activeHost:HOST_FILE,
    archivedLegacyHost:ARCHIVED_LEGACY_HOST,
    legacyHostActive:false,
    hostReplacement:'build input moved from src/legacy/index.phase-d.html to src/host/index.phase-2b.html',
    completionCaveat:'Inline host runtime has moved to src/core/host-runtime-adapter.js. Manual browser smoke/parity testing is still required before final release sign-off.',
    productBehaviourChanged:false
  };
}
function hostReadiness(ctx){
  var d=doc(ctx);
  var missingAnchors=missingIds(d,REQUIRED_HOST_ANCHORS);
  var missingOwners=missingGlobals(REQUIRED_RUNTIME_OWNERS);
  var parity=null;
  try{
    parity=root.WBStaticShellParityController&&root.WBStaticShellParityController.browserParityGate?root.WBStaticShellParityController.browserParityGate(ctx||{}):null;
  }catch(e){parity={pass:false,error:e&&e.message?e.message:String(e)};}
  var finalHost=null;
  try{
    finalHost=root.WBFinalHostFlipController&&root.WBFinalHostFlipController.legacyShellRetirementReadiness?root.WBFinalHostFlipController.legacyShellRetirementReadiness(Object.assign({},ctx||{},{legacyShellActive:false})):null;
  }catch(e){finalHost={ready:false,error:e&&e.message?e.message:String(e)};}
  return {
    owner:'WBSourceHostController',
    phase:'Phase 2b - L7',
    gate:'source-host-runtime-readiness',
    activeHost:HOST_FILE,
    legacyHostActive:false,
    missingAnchors:missingAnchors,
    missingRuntimeOwners:missingOwners,
    staticParityPass:!!(parity&&parity.pass),
    finalHostReady:!!(finalHost&&finalHost.ready),
    ready:missingAnchors.length===0&&missingOwners.length===0&&!!(parity&&parity.pass),
    parity:parity,
    finalHost:finalHost
  };
}
function diagnostics(ctx){
  return {
    contract:sourceHostContract(),
    readiness:hostReadiness(ctx||{}),
    nextRequiredOutcome:'Run browser smoke/parity tests against the source-owned host, then retire any remaining host-adapter debt only if the runtime contract stays green.'
  };
}

root.WBSourceHostController={
  sourceHostContract:sourceHostContract,
  hostReadiness:hostReadiness,
  diagnostics:diagnostics,
  isSourceHostActive:isSourceHostActive,
  activeHost:HOST_FILE
};
})(window);
