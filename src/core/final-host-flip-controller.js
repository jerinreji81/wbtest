/* WorshipBase Phase 2b - L7 final host flip readiness owner.
   Owns the final host-retirement decision contract. This module does not pretend the
   legacy shell is gone; it proves whether the active host can be flipped safely and
   records blockers when it cannot. */
(function(root){
'use strict';

var REQUIRED_PUBLIC_CONTRACTS=[
  'WBTopLevelRouter',
  'WBLibraryModule',
  'WBSetListModule',
  'WBExportModule',
  'WBSettingsModule',
  'WBWorkspaceModule',
  'WBBackupModule',
  'WorshipBasePad',
  'WBRunDiagnostics',
  'WBRebuildStatus'
];
var REQUIRED_SOURCE_OWNERS=[
  'WBAppShellController',
  'WBMainShellController',
  'WBLegacyRuntimeAdapterController',
  'WBStaticShellParityController',
  'WBSourceHostController',
  'WBGlobalSurfaceNavigationController',
  'WBCloudRuntimeController',
  'WBLibrarySongController',
  'WBLibrarySurfaceController',
  'WBSongEditorImportController',
  'WBSongImportDestinationController',
  'WBSongLifecycleController',
  'WBWorkspaceSurfaceController',
  'WBWorkspaceActionController',
  'WBWorkspaceCloudController',
  'WBExportPdfRuntimeController',
  'WBBackupRestoreController',
  'WBBrowserParitySmokeController'
];
var REQUIRED_ANCHOR_IDS=[
  'app','song-section','setlist-section','workspace-section','tools-section','settings-section',
  'song-view','export-view','wb-export-pdf-preview-view','backup-centre-modal',
  'vscroll','vinner','wb-set-editor','workspace-home-panel','workspace-detail-panel','tools-home-panel','settings-list'
];

function ownDoc(ctx){return (ctx&&ctx.document)||root.document||null}
function byId(doc,id){try{return !!(doc&&doc.getElementById(id))}catch(e){return false}}
function missingGlobals(names){return names.filter(function(name){return !root[name]})}
function missingAnchors(doc){return REQUIRED_ANCHOR_IDS.filter(function(id){return !byId(doc,id)})}
function parity(ctx){
  try{
    if(root.WBStaticShellParityController&&typeof root.WBStaticShellParityController.browserParityGate==='function'){
      return root.WBStaticShellParityController.browserParityGate(ctx||{});
    }
  }catch(e){}
  return {pass:false,missingCount:1,missing:{staticShellParityController:['WBStaticShellParityController']}};
}
function finalHostFlipContract(){
  return {
    owner:'WBFinalHostFlipController',
    phase:'Phase 2b - L7',
    boundary:'final-host-flip-readiness',
    requiredPublicContracts:REQUIRED_PUBLIC_CONTRACTS.slice(),
    requiredSourceOwners:REQUIRED_SOURCE_OWNERS.slice(),
    requiredAnchors:REQUIRED_ANCHOR_IDS.slice(),
    completionRule:'Modularisation is complete only after the active deployable host no longer depends on src/legacy/index.phase-d.html as the app runtime owner.',
    productBehaviourChanged:false
  };
}
function legacyShellRetirementReadiness(ctx){
  ctx=ctx||{};
  var doc=ownDoc(ctx);
  var parityResult=parity(ctx);
  var missingPublicContracts=missingGlobals(REQUIRED_PUBLIC_CONTRACTS);
  var missingSourceOwners=missingGlobals(REQUIRED_SOURCE_OWNERS);
  var missingStaticAnchors=missingAnchors(doc);
  var sourceHostActive=!!(root.WBSourceHostController&&root.WBSourceHostController.isSourceHostActive&&root.WBSourceHostController.isSourceHostActive());
  var legacyShellActive=ctx.legacyShellActive!==undefined?!!ctx.legacyShellActive:!sourceHostActive;
  var browserParityPass=!!(parityResult&&parityResult.pass);
  var runtimeContractsPass=missingPublicContracts.length===0;
  var sourceOwnersPass=missingSourceOwners.length===0;
  var staticAnchorsPass=missingStaticAnchors.length===0;
  var blockers=[];
  if(!browserParityPass)blockers.push('browser parity gate has not passed in this runtime context');
  if(!runtimeContractsPass)blockers.push('missing public runtime contracts: '+missingPublicContracts.join(', '));
  if(!sourceOwnersPass)blockers.push('missing source owners: '+missingSourceOwners.join(', '));
  if(!staticAnchorsPass)blockers.push('missing static anchors: '+missingStaticAnchors.join(', '));
  if(legacyShellActive)blockers.push('src/legacy/index.phase-d.html remains the active app host');
  return {
    owner:'WBFinalHostFlipController',
    phase:'Phase 2b - L7',
    gate:'legacy-shell-retirement-readiness',
    ready:browserParityPass&&runtimeContractsPass&&sourceOwnersPass&&staticAnchorsPass&&!legacyShellActive,
    canFlipHostWithoutLegacy:!legacyShellActive&&browserParityPass&&runtimeContractsPass&&sourceOwnersPass&&staticAnchorsPass,
    legacyShellActive:legacyShellActive,
    browserParityPass:browserParityPass,
    runtimeContractsPass:runtimeContractsPass,
    sourceOwnersPass:sourceOwnersPass,
    staticAnchorsPass:staticAnchorsPass,
    missingPublicContracts:missingPublicContracts,
    missingSourceOwners:missingSourceOwners,
    missingStaticAnchors:missingStaticAnchors,
    parity:parityResult,
    blockers:blockers
  };
}
function mainHostPlan(ctx){
  var readiness=legacyShellRetirementReadiness(ctx||{});
  return {
    owner:'WBFinalHostFlipController',
    phase:'Phase 2b - L7',
    currentHost:readiness.legacyShellActive?'src/legacy/index.phase-d.html':'src/host/index.phase-2b.html',
    targetHost:'source-owned static host with runtime adapters supplied by modules',
    action:readiness.ready?'flip-host':'keep-legacy-host-as-adapter',
    nextRequiredOutcome:readiness.ready?'Run browser smoke/parity tests and remove remaining host-adapter debt.':'Extract or replace remaining host runtime before marking modularisation complete.',
    readiness:readiness
  };
}
function diagnostics(ctx){
  return mainHostPlan(ctx||{});
}

root.WBFinalHostFlipController={
  finalHostFlipContract:finalHostFlipContract,
  legacyShellRetirementReadiness:legacyShellRetirementReadiness,
  mainHostPlan:mainHostPlan,
  diagnostics:diagnostics,
  requiredPublicContracts:REQUIRED_PUBLIC_CONTRACTS.slice(),
  requiredSourceOwners:REQUIRED_SOURCE_OWNERS.slice()
};
})(window);
