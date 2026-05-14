/* WorshipBase Phase 2b - L7 static shell split / browser parity gate owner.
   Owns the static DOM contract used to prove that a thinner shell still contains the
   same route, sheet, modal, and injected-owner anchors before the legacy host can be retired. */
(function(root){
'use strict';

var ROUTE_IDS=['song-section','setlist-section','workspace-section','tools-section','settings-section'];
var TAB_IDS=['tab-songs','tab-setlist','tab-workspace','tab-tools','tab-settings'];
var CORE_SURFACE_IDS=['app','toast','song-view','export-view','wb-export-pdf-preview-view','dup-review-view','wb-set-editor','workspace-home-panel','workspace-detail-panel','settings-list'];
var LIBRARY_IDS=['srch-inp','library-filter-row','vscroll','vinner','alpha-strip','alpha-bubble','recent-songs-section','ptr-indicator','manage-toolbar'];
var SONG_EDITOR_IDS=['add-song-modal','song-form-title','song-form-artist','song-form-chart','song-form-key','song-form-save','song-editor-preview-pane'];
var SETLIST_IDS=['wb-personal-list','sl-items','set-song-picker-list','set-summary-box','set-key-options','set-notes-editor'];
var WORKSPACE_IDS=['workspace-setlists-panel','workspace-detail-body','workspace-publish-list-static','workspace-new-name','workspace-members','workspace-settings-card'];
var TOOLS_IDS=['tools-home-panel','tools-keycapo-panel','tools-pads-panel','tools-chordnns-panel','bible-section','nns-diagram-svg'];
var BACKUP_EXPORT_IDS=['backup-centre-modal','backup-centre-body','file-import-review','export-preset-card-row','wb-export-preview-pages'];
var REQUIRED_SCRIPT_IDS=['wb-core-constants','wb-core-app-shell','wb-core-main-shell-controller','wb-core-legacy-runtime-adapter-controller','wb-core-static-shell-parity-controller','wb-core-source-host-controller','wb-ui-components','wb-ui-surface-lifecycle','wb-global-surface-navigation-controller','wb-library-controller','wb-library-surface-controller','wb-song-lifecycle-controller','wb-workspace-surface-controller','wb-workspace-action-controller','wb-workspace-cloud-controller','wb-export-pdf-runtime-controller','wb-backup-restore-controller','wb-cloud-runtime-controller'];
var REQUIRED_STYLE_IDS=['wb-rebuild-consolidated-style'];

function ownDoc(ctx){return (ctx&&ctx.document)||root.document||null}
function byId(doc,id){try{return !!(doc&&doc.getElementById(id))}catch(e){return false}}
function missingIds(doc,ids){return ids.filter(function(id){return !byId(doc,id)})}
function scriptPresent(doc,id){return byId(doc,id)}
function stylePresent(doc,id){return byId(doc,id)}
function staticShellContract(){
  return {
    owner:'WBStaticShellParityController',
    phase:'Phase 2b - L7',
    staticShellSplit:true,
    routeIds:ROUTE_IDS.slice(),
    tabIds:TAB_IDS.slice(),
    requiredGroups:{
      coreSurface:CORE_SURFACE_IDS.slice(),
      library:LIBRARY_IDS.slice(),
      songEditor:SONG_EDITOR_IDS.slice(),
      setlist:SETLIST_IDS.slice(),
      workspace:WORKSPACE_IDS.slice(),
      tools:TOOLS_IDS.slice(),
      backupExport:BACKUP_EXPORT_IDS.slice()
    },
    requiredScripts:REQUIRED_SCRIPT_IDS.slice(),
    requiredStyles:REQUIRED_STYLE_IDS.slice(),
    modularisationComplete:false
  };
}
function browserParityGate(ctx){
  var doc=ownDoc(ctx);
  var groups=staticShellContract().requiredGroups;
  var missing={
    routes:missingIds(doc,ROUTE_IDS),
    tabs:missingIds(doc,TAB_IDS),
    coreSurface:missingIds(doc,groups.coreSurface),
    library:missingIds(doc,groups.library),
    songEditor:missingIds(doc,groups.songEditor),
    setlist:missingIds(doc,groups.setlist),
    workspace:missingIds(doc,groups.workspace),
    tools:missingIds(doc,groups.tools),
    backupExport:missingIds(doc,groups.backupExport),
    scripts:REQUIRED_SCRIPT_IDS.filter(function(id){return !scriptPresent(doc,id)}),
    styles:REQUIRED_STYLE_IDS.filter(function(id){return !stylePresent(doc,id)})
  };
  var activeRoutes=doc?Array.prototype.slice.call(doc.querySelectorAll('.route.active')).map(function(el){return el.id||''}):[];
  var activeTabs=doc?Array.prototype.slice.call(doc.querySelectorAll('.tab-btn.active')).map(function(el){return el.id||el.getAttribute('data-tab')||''}):[];
  var missingCount=Object.keys(missing).reduce(function(sum,key){return sum+missing[key].length},0);
  return {
    owner:'WBStaticShellParityController',
    phase:'Phase 2b - L7',
    gate:'static-shell-browser-parity',
    pass:missingCount===0 && activeRoutes.length<=1 && activeTabs.length<=1,
    missing:missing,
    missingCount:missingCount,
    activeRoutes:activeRoutes,
    activeTabs:activeTabs,
    legacyHostStillActive:!(root.WBSourceHostController&&root.WBSourceHostController.isSourceHostActive&&root.WBSourceHostController.isSourceHostActive()),
    staticShellSplit:true
  };
}
function diagnostics(ctx){return browserParityGate(ctx)}

root.WBStaticShellParityController={
  staticShellContract:staticShellContract,
  browserParityGate:browserParityGate,
  diagnostics:diagnostics,
  routeIds:ROUTE_IDS.slice(),
  tabIds:TAB_IDS.slice()
};
})(window);
