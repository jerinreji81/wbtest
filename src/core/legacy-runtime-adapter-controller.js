/* WorshipBase Phase 2b - L7 legacy runtime adapter owner.
   Owns public host contracts while reporting final-host flip readiness through source controllers. */
(function(root){
'use strict';

function noop(){}
function own(ctx, name, fallback){return ctx && ctx[name] !== undefined ? ctx[name] : fallback;}
function qsa(ctx, selector){
  if (ctx && typeof ctx.qsa === 'function') return ctx.qsa(selector);
  var doc = own(ctx, 'document', root.document);
  return doc ? Array.prototype.slice.call(doc.querySelectorAll(selector)) : [];
}
function qs(ctx, id){
  if (ctx && typeof ctx.qs === 'function') return ctx.qs(id);
  var doc = own(ctx, 'document', root.document);
  return doc ? doc.getElementById(id) : null;
}
function safeCall(fn, fallback){
  try { return typeof fn === 'function' ? fn() : fallback; }
  catch (e) { return fallback; }
}
function padFallback(){
  return {
    state:{on:false,key:'C',mode:'peaceful',volume:.35},
    library:{peaceful:{},analog:{},drones:{}},
    start:function(){this.state.on=true;return this.state;},
    stop:function(){this.state.on=false;return this.state;},
    setKey:function(k){this.state.key=k||'C';},
    setMode:function(m){this.state.mode=m||'peaceful';},
    setVolume:function(v){this.state.volume=+v||0;}
  };
}
function activeSongViewDiagnostics(ctx){
  var songView = qs(ctx, 'song-view');
  return {
    open:!!(songView && songView.classList.contains('visible')),
    mode:ctx.state && ctx.state.mode,
    focusMode:!!(ctx.state && ctx.state.focusMode),
    chordHighlight:!!(ctx.state && ctx.state.chordHighlight),
    hasPicker:qsa(ctx, '.settings-picker-sheet').length===5,
    hasBackupCentre:!!qs(ctx, 'backup-centre-modal'),
    hasPlaybackSheet:!!qs(ctx, 'bs-playback'),
    hasPadSheet:!!qs(ctx, 'bs-pad')
  };
}
function runDiagnostics(ctx){
  ctx = ctx || {};
  var topRoutes=['song-section','setlist-section','workspace-section','tools-section','settings-section'];
  var visibleRoutes=qsa(ctx, '.route.active').map(function(el){return el.id;});
  var activeTabs=qsa(ctx, '.tab-btn.active').map(function(el){return el.dataset.tab||el.id||el.textContent.trim();});
  var moduleChecks={
    router:!!(root.WBTopLevelRouter&&typeof root.WBTopLevelRouter.show==='function'),
    library:!!(root.WBLibraryModule&&typeof root.WBLibraryModule.render==='function'),
    setlist:!!(root.WBSetListModule&&typeof root.WBSetListModule.renderHome==='function'),
    workspace:!!(root.WBWorkspaceModule&&typeof root.WBWorkspaceModule.home==='function'),
    settings:!!(root.WBSettingsModule&&typeof root.WBSettingsModule.render==='function'),
    performance:!!(root.WBPerformanceModule&&typeof root.WBPerformanceModule.stopAll==='function'),
    exportModule:!!(root.WBExportModule&&typeof root.WBExportModule.open==='function'),
    importModule:!!(root.WBImportModule&&typeof root.WBImportModule.openEditor==='function'),
    padApi:!!(root.WorshipBasePad&&typeof root.WorshipBasePad.start==='function'&&typeof root.WorshipBasePad.stop==='function'&&typeof root.WorshipBasePad.setKey==='function'&&typeof root.WorshipBasePad.setMode==='function'),
    backupModule:!!(root.WBBackupModule&&typeof root.WBBackupModule.open==='function'&&typeof root.WBBackupModule.exportLocal==='function')
  };
  var routeChecks={
    oneActiveTab:activeTabs.length===1,
    oneActiveRoute:visibleRoutes.length===1,
    knownTopRoutesPresent:topRoutes.every(function(id){return !!qs(ctx, id);}),
    toolsSubviewOwnedByTools:!ctx.state || ctx.state.tab!=='tools' || !!qs(ctx, 'tools-section.active')
  };
  try {
    console.assert(moduleChecks.router,'router');
    console.assert(routeChecks.oneActiveTab,'one tab');
    console.assert(routeChecks.oneActiveRoute,'one route');
    console.assert(moduleChecks.padApi,'pad api');
  } catch (e) {}
  var navigatorRef = own(ctx, 'navigator', root.navigator || {});
  var firebaseRuntime = ctx.firebaseRuntime || {};
  var bibleRuntime = ctx.bibleRuntime || {};
  var cloudState = ctx.cloudState || {firebase:{},googleDrive:{}};
  return {
    version:ctx.VERSION,
    phase:ctx.REBUILD_PHASE,
    reference:ctx.REBUILD_REFERENCE,
    route:ctx.state && ctx.state.tab,
    activeTabs:activeTabs,
    visibleRoutes:visibleRoutes,
    checks:{modules:moduleChecks,routes:routeChecks},
    library:root.WBLibraryModule&&root.WBLibraryModule.diagnostics?root.WBLibraryModule.diagnostics():{},
    setlist:root.WBSetListModule&&root.WBSetListModule.diagnostics?root.WBSetListModule.diagnostics():{},
    settings:root.WBSettingsModule&&root.WBSettingsModule.diagnostics?root.WBSettingsModule.diagnostics():{},
    workspace:root.WBWorkspaceModule&&root.WBWorkspaceModule.diagnostics?root.WBWorkspaceModule.diagnostics():{},
    songView:activeSongViewDiagnostics(ctx),
    performance:root.WBPerformanceModule&&root.WBPerformanceModule.diagnostics?root.WBPerformanceModule.diagnostics():{},
    exportModule:root.WBExportModule&&root.WBExportModule.audit?root.WBExportModule.audit():{},
    importModule:root.WBImportModule&&root.WBImportModule.diagnostics?root.WBImportModule.diagnostics():{},
    backupModule:root.WBBackupModule&&root.WBBackupModule.diagnostics?root.WBBackupModule.diagnostics():{},
    navigation:root.WBNavigationController&&root.WBNavigationController.diagnostics?root.WBNavigationController.diagnostics():{},
    appShell:root.WBAppShellController&&root.WBAppShellController.diagnostics?root.WBAppShellController.diagnostics():{},
    staticShell:root.WBStaticShellParityController&&root.WBStaticShellParityController.browserParityGate?root.WBStaticShellParityController.browserParityGate(ctx):{},
    finalHostFlip:root.WBFinalHostFlipController&&root.WBFinalHostFlipController.diagnostics?root.WBFinalHostFlipController.diagnostics(ctx):{},
    browserParitySmoke:root.WBBrowserParitySmokeController&&root.WBBrowserParitySmokeController.diagnostics?root.WBBrowserParitySmokeController.diagnostics(ctx):{},
    gestures:root.WBGestureController&&root.WBGestureController.diagnostics?root.WBGestureController.diagnostics():{},
    offline:{
      online:navigatorRef.onLine!==false,
      serviceWorker:!!navigatorRef.serviceWorker,
      secureContext:!!root.isSecureContext,
      songCacheCount:(ctx.firebaseSongs||[]).length,
      bibleCachedChapters:Object.keys((bibleRuntime&&bibleRuntime.chapterCache)||{}).length,
      lastSongsSyncAt:firebaseRuntime.lastSongsSyncAt||'',
      lastWorkspaceSyncAt:firebaseRuntime.lastWorkspaceSyncAt||''
    },
    deferred:{
      firebase:cloudState.firebase&&cloudState.firebase.connected?'auth connected':(cloudState.firebase&&cloudState.firebase.configured?'config ready':'not configured'),
      googleDrive:cloudState.googleDrive&&cloudState.googleDrive.connected?'oauth connected':(safeCall(ctx.cloudGoogleClientId,'')?'v85 client ready':'not configured'),
      backupRestore:'local + Drive runtime flow',
      pdfExport:'song + set export active',
      bibleText:safeCall(ctx.biblePackageReady,false)?'package folder ready':(safeCall(ctx.cloudFirebaseConfig,false)?'firebase fallback ready':'not configured')
    }
  };
}
function rebuildStatus(ctx){
  return {
    version:ctx && ctx.VERSION,
    phase:ctx && ctx.REBUILD_PHASE,
    stabilityFreeze:true,
    reference:ctx && ctx.REBUILD_REFERENCE,
    deferred:[
      'Final on-device regression test still recommended before calling this finished',
      'Song PDF attachment/extraction parity is intentionally cancelled unless explicitly requested later',
      'No blocking launch screen until all core interaction is stable'
    ],
    active:[
      'Google Drive OAuth hook wired to v85 Drive client ID',
      'Drive status dots restored in Settings/Backup Centre',
      'hidden Drive backup/restore runtime flow',
      'Firebase RTDB song library loading with local cache',
      'Firebase workspace set listener + local cache',
      'Bible package loader with cache and Firebase chapter fallback',
      'route memory for top-level/tools/workspace/set editor and workspace detail state',
      'v85-style visual tidy pass for spacing and backup centre',
      'consolidated half-slide song back gesture',
      'local JSON backup export',
      'restore review screen',
      'selective restore for songs, set lists and settings',
      'pre-restore safety snapshot',
      'offline audit hardening with service worker registration + cache warming + reconnect guards',
      'blocking loading screen removed',
      'external Layered Fold W brand asset folder support',
      'simplified About branding',
      'v85-style About-logo admin PIN unlock',
      'song page parity fixes under consolidated route owner',
      'set summary preview/copy parity',
      'workspace/personal set-add parity',
      'non-blocking startup and direct cache/Firebase render',
      'data safety UX: undo, delete impact and import review statuses'
    ],
    diagnostics:'Run window.WBRunDiagnostics() after loading the app.',
    adapterOwner:'WBLegacyRuntimeAdapterController',
    finalHostFlip:'Run window.WBFinalHostFlipController.diagnostics() to inspect final host readiness.',
    browserParitySmoke:'Run window.WBBrowserParitySmokeController.diagnostics() after loading the app.'
  };
}
function installHostPublicContracts(ctx){
  ctx = ctx || {};
  root.WBTopLevelRouter={
    show:ctx.switchTab||noop,
    current:function(){return ctx.state && ctx.state.tab;},
    diagnostics:function(){return root.WBAppShellController&&root.WBAppShellController.diagnostics?root.WBAppShellController.diagnostics():{owner:'legacySwitchTabFallback'};}
  };
  root.switchTab=ctx.switchTab||noop;
  root.WBLibraryModule={render:ctx.renderLibrary||noop,diagnostics:function(){return {songs:(ctx.songs||[]).length,visible:ctx.filteredSongs?ctx.filteredSongs().length:0,hasLibraryDom:!!(qs(ctx,'vscroll')&&qs(ctx,'vinner')&&qs(ctx,'alpha-strip')&&qs(ctx,'recent-songs-section')&&qs(ctx,'ptr-indicator')&&qs(ctx,'alpha-bubble')),filters:qsa(ctx,'.filter-chip').length};}};
  root.WBSetListModule={renderHome:ctx.renderPersonalHome||noop,openSet:ctx.openSet||noop,renderEditor:ctx.renderSetEditor||noop,diagnostics:function(){return {sets:(ctx.personalSets||[]).length,activeSetId:ctx.activeSetId,homeCards:qsa(ctx,'.wb-personal-card').length,editorCards:qsa(ctx,'#sl-items .set-card').length};}};
  root.WBExportModule={open:ctx.openExportView||noop,preview:ctx.openExportPreview||noop,close:ctx.closeExportView||noop,audit:function(){var view=qs(ctx,'export-view'),preview=qs(ctx,'wb-export-pdf-preview-view'),s=ctx.exportPageState||{};return {exportView:!!view,previewView:!!preview,viewOpen:!!(view&&view.classList.contains('visible')),previewOpen:!!(preview&&preview.classList.contains('open')),context:s.context,preset:s.preset,mode:s.mode,flow:s.flow,columns:s.columns,size:s.size};}};
  root.WBSettingsModule={render:ctx.renderSettings||noop,apply:ctx.applySettings||noop,diagnostics:function(){var settings=ctx.cloneSettings?ctx.cloneSettings(ctx.settings||{}):(ctx.settings||{}),cloud=ctx.cloudState||{googleDrive:{},firebase:{}};return {settings:settings,theme:settings.theme,darkMode:!!settings.darkMode,backup:{local:true,driveConnected:!!(cloud.googleDrive&&cloud.googleDrive.connected),firebaseConnected:!!(cloud.firebase&&cloud.firebase.connected)}};}};
  root.WBWorkspaceModule={home:ctx.openWorkspaceHome||noop,setLists:ctx.openWorkspaceSetLists||noop,publish:ctx.openWorkspacePublishSheet||noop,diagnostics:function(){var w=ctx.workspaceState||{sets:[]};return {panel:w.panel,sets:(w.sets||[]).length,activeSetId:w.activeSetId,home:!!qs(ctx,'workspace-home-panel'),setlists:!!qs(ctx,'workspace-setlists-panel'),detail:!!qs(ctx,'workspace-detail-panel')};}};
  root.WBBackupModule={open:ctx.openBackupCentre||noop,exportLocal:ctx.exportLocalBackup||noop,exportSongs:ctx.exportSongsBackup||noop,exportSetLists:ctx.exportSetListsBackup||noop,exportSettings:ctx.exportSettingsBackup||noop,restoreData:ctx.restoreEverythingFromData||noop,restoreSelected:ctx.applyRestoreSelectionFromData||noop,openRestoreReview:ctx.openBackupRestoreReview||noop,diagnostics:function(){var safeGet=ctx.safeGet||function(){return '';},cloud=ctx.cloudState||{googleDrive:{},firebase:{}};return {localBackup:true,selectiveExport:true,restoreEverything:true,restoreReview:true,restoreSelected:true,restoreSongs:true,restoreSetLists:true,restoreSettings:true,preRestoreSnapshot:!!safeGet('wb_rebuild_52_pre_restore_snapshot'),lastBackupAt:safeGet('wb_rebuild_52_last_backup_at'),driveConnected:!!(cloud.googleDrive&&cloud.googleDrive.connected),driveEmail:(cloud.googleDrive&&cloud.googleDrive.email)||'',firebaseConnected:!!(cloud.firebase&&cloud.firebase.connected)};}};
  root.WorshipBasePad=(root.WBPadAudioController&&root.WBPadAudioController.create)?root.WBPadAudioController.create({toast:ctx.showToast,assetsBase:'assets/'}):padFallback();
  root.WBRunDiagnostics=function(){return runDiagnostics(ctx);};
  root.WBRebuildStatus=function(){return rebuildStatus(ctx);};
  return legacyRuntimeAdapterContract(ctx);
}
function installRuntimeHost(ctx){
  ctx = ctx || {};
  var doc = ctx.document || root.document;
  if (!doc || typeof ctx.install !== 'function') return false;
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', ctx.install, {once:true});
  else ctx.install();
  return true;
}
function legacyRuntimeAdapterContract(ctx){
  return {
    owner:'WBLegacyRuntimeAdapterController',
    publicContracts:['WBTopLevelRouter','WBLibraryModule','WBSetListModule','WBExportModule','WBSettingsModule','WBWorkspaceModule','WBBackupModule','WorshipBasePad','WBRunDiagnostics','WBRebuildStatus'],
    bootstrapOwner:'installRuntimeHost',
    diagnosticsOwner:'runDiagnostics',
    legacyRuntimeAdapterContract:true,
    route:ctx && ctx.state && ctx.state.tab
  };
}

root.WBLegacyRuntimeAdapterController={
  installHostPublicContracts:installHostPublicContracts,
  installRuntimeHost:installRuntimeHost,
  runDiagnostics:runDiagnostics,
  rebuildStatus:rebuildStatus,
  legacyRuntimeAdapterContract:legacyRuntimeAdapterContract
};
})(window);
