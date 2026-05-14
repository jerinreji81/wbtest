/* WorshipBase Phase 2b - L7 browser parity smoke gate owner.
   Owns the lightweight browser/runtime smoke contract for the source-owned host.
   This is intentionally non-destructive: it checks anchors, public contracts, route/tab
   scaffolding, injected source owners, and final-host readiness without changing product state. */
(function(root){
'use strict';

var PHASE='Phase 2b - L7';
var REQUIRED_ANCHORS=[
  'app','toast','song-section','setlist-section','workspace-section','tools-section','settings-section',
  'song-view','export-view','wb-export-pdf-preview-view','backup-centre-modal','dup-review-view',
  'vscroll','vinner','alpha-strip','recent-songs-section','ptr-indicator','alpha-bubble',
  'wb-set-editor','workspace-home-panel','workspace-detail-panel','tools-home-panel','settings-list'
];
var REQUIRED_TABS=['tab-songs','tab-setlist','tab-workspace','tab-tools','tab-settings'];
var REQUIRED_PUBLIC_CONTRACTS=[
  'WBTopLevelRouter','WBLibraryModule','WBSetListModule','WBExportModule','WBSettingsModule',
  'WBWorkspaceModule','WBBackupModule','WorshipBasePad','WBRunDiagnostics','WBRebuildStatus'
];
var REQUIRED_SOURCE_OWNERS=[
  'WBSourceHostController','WBStaticShellParityController','WBFinalHostFlipController','WBLegacyRuntimeAdapterController',
  'WBMainShellController','WBGlobalSurfaceNavigationController','WBCloudRuntimeController','WBLibrarySongController',
  'WBLibrarySurfaceController','WBSongEditorImportController','WBSongImportDestinationController','WBSongLifecycleController',
  'WBWorkspaceSurfaceController','WBWorkspaceActionController','WBWorkspaceCloudController','WBExportPdfRuntimeController',
  'WBBackupRestoreController'
];

function getDoc(ctx){return (ctx&&ctx.document)||root.document||null;}
function hasId(doc,id){try{return !!(doc&&doc.getElementById(id));}catch(e){return false;}}
function missingIds(doc,ids){return ids.filter(function(id){return !hasId(doc,id);});}
function missingGlobals(names){return names.filter(function(name){return !root[name];});}
function classListContains(el,name){return !!(el&&el.classList&&el.classList.contains(name));}
function countSelector(doc,selector){try{return doc?doc.querySelectorAll(selector).length:0;}catch(e){return 0;}}
function safeCall(fn,fallback){try{return typeof fn==='function'?fn():fallback;}catch(e){return fallback;}}

function browserSmokeContract(){
  return {
    owner:'WBBrowserParitySmokeController',
    phase:PHASE,
    boundary:'browser-parity-smoke-gate',
    requiredAnchors:REQUIRED_ANCHORS.slice(),
    requiredTabs:REQUIRED_TABS.slice(),
    requiredPublicContracts:REQUIRED_PUBLIC_CONTRACTS.slice(),
    requiredSourceOwners:REQUIRED_SOURCE_OWNERS.slice(),
    productBehaviourChanged:false
  };
}
function smokeGate(ctx){
  ctx=ctx||{};
  var doc=getDoc(ctx);
  var missingAnchors=missingIds(doc,REQUIRED_ANCHORS);
  var missingTabs=missingIds(doc,REQUIRED_TABS);
  var missingPublic=missingGlobals(REQUIRED_PUBLIC_CONTRACTS);
  var missingOwners=missingGlobals(REQUIRED_SOURCE_OWNERS);
  var staticParity=safeCall(function(){
    return root.WBStaticShellParityController&&root.WBStaticShellParityController.browserParityGate?root.WBStaticShellParityController.browserParityGate(ctx):null;
  }, null);
  var finalHost=safeCall(function(){
    return root.WBFinalHostFlipController&&root.WBFinalHostFlipController.legacyShellRetirementReadiness?root.WBFinalHostFlipController.legacyShellRetirementReadiness(Object.assign({},ctx,{legacyShellActive:false})):null;
  }, null);
  var sourceHost=safeCall(function(){
    return root.WBSourceHostController&&root.WBSourceHostController.hostReadiness?root.WBSourceHostController.hostReadiness(ctx):null;
  }, null);
  var activeRoutes=countSelector(doc,'.route.active');
  var activeTabs=countSelector(doc,'.tab-btn.active');
  var app=doc&&doc.getElementById('app');
  var routeBodyClass=doc&&doc.body?/\btab-/.test(doc.body.className||''):false;
  var result={
    owner:'WBBrowserParitySmokeController',
    phase:PHASE,
    gate:'browser-parity-smoke-gate',
    sourceHostActive:!!(root.WBSourceHostController&&root.WBSourceHostController.isSourceHostActive&&root.WBSourceHostController.isSourceHostActive()),
    missingAnchors:missingAnchors,
    missingTabs:missingTabs,
    missingPublicContracts:missingPublic,
    missingSourceOwners:missingOwners,
    activeRouteCount:activeRoutes,
    activeTabCount:activeTabs,
    appPresent:!!app,
    bodyHasRouteClass:routeBodyClass,
    staticParityPass:!!(staticParity&&staticParity.pass),
    finalHostReady:!!(finalHost&&finalHost.ready),
    sourceHostReady:!!(sourceHost&&sourceHost.ready),
    pass:missingAnchors.length===0&&missingTabs.length===0&&missingPublic.length===0&&missingOwners.length===0&&activeRoutes<=1&&activeTabs<=1&&!!app,
    staticParity:staticParity,
    finalHost:finalHost,
    sourceHost:sourceHost
  };
  root.__wbBrowserParitySmokeLastResult=result;
  return result;
}
function install(ctx){
  var doc=getDoc(ctx);
  if(!doc)return null;
  var run=function(){return smokeGate(ctx||{});};
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',run,{once:true});
  else setTimeout(run,0);
  return true;
}
function diagnostics(ctx){return smokeGate(ctx||{});}

root.WBBrowserParitySmokeController={
  browserSmokeContract:browserSmokeContract,
  smokeGate:smokeGate,
  diagnostics:diagnostics,
  install:install,
  requiredAnchors:REQUIRED_ANCHORS.slice(),
  requiredTabs:REQUIRED_TABS.slice()
};
})(window);
