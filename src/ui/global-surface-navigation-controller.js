/* WorshipBase Phase 2b - L1 global surface/navigation bridge owner.
   Owns shared toast/sheet helpers, transient surface cleanup, navigation scaffold
   registration, Escape/back handling, and the universal edge-swipe bridge while
   the legacy shell remains the temporary host. */
(function(root){
'use strict';

function noop(){return null}
function ctxFn(ctx,name){return ctx&&typeof ctx[name]==='function'?ctx[name]:noop}
function qs(ctx,id){try{return ctxFn(ctx,'qs')(id)}catch(e){return null}}
function qsa(ctx,sel){try{return ctxFn(ctx,'qsa')(sel)||[]}catch(e){return []}}
function call(ctx,name){
  var args=Array.prototype.slice.call(arguments,2);
  var fn=ctx&&ctx.closers&&ctx.closers[name];
  if(!fn&&ctx&&typeof ctx[name]==='function')fn=ctx[name];
  if(!fn&&typeof root[name]==='function')fn=root[name];
  if(typeof fn!=='function')return null;
  try{return fn.apply(null,args)}catch(e){return null}
}
function closeByName(ctx,name,reason,id){return call(ctx,name,reason,id)}
function setAriaClosed(el){try{if(el)el.setAttribute('aria-hidden','true')}catch(e){}}
function closeSheetElement(ctx,bg){if(!bg)return false;if(bg.classList)bg.classList.remove('open');setAriaClosed(bg);return true}
function showSync(ctx,msg,isError){try{showToast(ctx,msg,isError)}catch(e){} }
function showToast(ctx,msg){
  var t=qs(ctx,'toast');
  if(!t)return false;
  try{ctxFn(ctx,'clearLastDataSafetyUndo')()}catch(e){}
  t.className='';
  t.textContent=msg;
  t.classList.add('show');
  var timerTarget=(ctx&&ctx.showToastFn)||showToast;
  clearTimeout(timerTarget._t);
  timerTarget._t=setTimeout(function(){
    try{t.classList.remove('show');t.textContent=''}catch(e){}
  },1550);
  return true;
}
function hideToast(ctx){
  var t=qs(ctx,'toast');
  if(!t)return false;
  var timerTarget=(ctx&&ctx.showToastFn)||showToast;
  clearTimeout(timerTarget._t);
  try{ctxFn(ctx,'clearLastDataSafetyUndo')()}catch(e){}
  t.classList.remove('show','wb-undo-toast');
  t.textContent='';
  return true;
}
function fastTabSelectFromEvent(ctx,e){
  var b=e&&e.target&&e.target.closest&&e.target.closest('.tab-btn[data-tab]');
  if(!b)return false;
  var fn=(ctx&&ctx.fastTabSelectFromEventFn)||fastTabSelectFromEvent;
  var now=Date.now();
  if(fn._last&&fn._tab===b.dataset.tab&&now-fn._last<80)return true;
  fn._last=now;fn._tab=b.dataset.tab;
  if(e.cancelable)e.preventDefault();
  if(e.stopPropagation)e.stopPropagation();
  if(root.WBNavigationController)root.WBNavigationController.showTab(b.dataset.tab,'tab-fast');
  else call(ctx,'switchTab',b.dataset.tab);
  return true;
}
function closeOpenBottomSheets(ctx,reason){
  ctx=ctx||{};ctx._globalBridgeFlags=ctx._globalBridgeFlags||{};
  if(root.WBSurfaceLifecycle&&root.WBSurfaceLifecycle.closeBottomSheets&&ctx._globalBridgeFlags.closeBottomSheets!==true){
    ctx._globalBridgeFlags.closeBottomSheets=true;
    try{return root.WBSurfaceLifecycle.closeBottomSheets(reason||'global-bridge')}finally{ctx._globalBridgeFlags.closeBottomSheets=false}
  }
  var closers={
    'bs-admin-pin':'closeAdminPinSheet','bs-admin-firebase-tools':'closeAdminFirebaseTools','bs-admin-duplicates':'closeAdminDuplicateReview',
    'bs-add-song-menu':'closeAddSongMenu','bs-song-menu':'closeSongMenu','bs-playback':'closePlaybackOptions','bs-pad':'closePadSheet',
    'bs-chord-diagrams':'closeChordDiagramsSheet','bs-set-options':'closeSetOptions','bs-set-song-picker':'closeSetSongPicker','bs-set-key':'closeSetKeySheet',
    'bs-personal-new':'closePersonalNewSheet','bs-workspace-new':'closeWorkspaceNewSheet','bs-workspace-publish':'closeWorkspacePublishSheet',
    'bs-settings-picker':'closeSettingsPicker','bs-bible-picker':'closeBiblePicker','bs-bible-version':'closeBibleVersionPicker','bs-import-duplicates':'closeImportDuplicateReview'
  };
  var count=0;
  qsa(ctx,'.bs-bg.open').forEach(function(bg){
    var id=bg&&bg.id||'';
    var name=closers[id];
    if(name)closeByName(ctx,name,reason,id);else closeSheetElement(ctx,bg);
    count++;
  });
  return count;
}
function closeOpenFullPagesForRoute(ctx,reason){
  ctx=ctx||{};ctx._globalBridgeFlags=ctx._globalBridgeFlags||{};
  if(root.WBSurfaceLifecycle&&root.WBSurfaceLifecycle.closeFullPages&&ctx._globalBridgeFlags.closeFullPages!==true){
    ctx._globalBridgeFlags.closeFullPages=true;
    try{return root.WBSurfaceLifecycle.closeFullPages(reason||'global-bridge')}finally{ctx._globalBridgeFlags.closeFullPages=false}
  }
  ['closeDuplicateReviewPage','closeExportPreview','closeExportView','closeBackupCentre','closeImportPages','closeFileImportShell','closeUgImportShell','closeWorkspaceNewSheet'].forEach(function(name){closeByName(ctx,name,reason)});
  return true;
}
function closeTopTransientSurface(ctx,reason){
  ctx=ctx||{};ctx._globalBridgeFlags=ctx._globalBridgeFlags||{};
  if(root.WBSurfaceLifecycle&&root.WBSurfaceLifecycle.closeTop&&ctx._globalBridgeFlags.closeTop!==true){
    ctx._globalBridgeFlags.closeTop=true;
    try{if(root.WBSurfaceLifecycle.closeTop(reason||'global-bridge'))return true}finally{ctx._globalBridgeFlags.closeTop=false}
  }
  var page=qs(ctx,'dup-review-view');if(page&&page.classList.contains('visible')){closeByName(ctx,'closeDuplicateReviewPage',reason);return true}
  var pv=qs(ctx,'wb-export-pdf-preview-view');if(pv&&pv.classList.contains('open')){closeByName(ctx,'closeExportPreview',reason);return true}
  var exp=qs(ctx,'export-view');if(exp&&exp.classList.contains('visible')){closeByName(ctx,'closeExportView',reason);return true}
  var bc=qs(ctx,'backup-centre-modal');if(bc&&bc.classList.contains('open')){closeByName(ctx,'closeBackupCentre',reason);return true}
  var editor=qs(ctx,'add-song-modal');if(editor&&editor.classList.contains('open')){closeByName(ctx,'closeAddSongModal',reason);return true}
  var sheet=Array.prototype.slice.call((root.document&&root.document.querySelectorAll('.bs-bg.open'))||[]).pop();
  if(sheet){closeOpenBottomSheets(ctx,reason);return true}
  var sv=qs(ctx,'song-view');if(sv&&sv.classList.contains('visible')){closeByName(ctx,'closeSongViewSmooth',reason);return true}
  return false;
}
function closeTransientsBeforeRouteChange(ctx,tab){
  if(root.WBSurfaceLifecycle&&root.WBSurfaceLifecycle.closeBeforeRouteChange){root.WBSurfaceLifecycle.closeBeforeRouteChange(tab);return true}
  closeOpenBottomSheets(ctx,'route');
  closeOpenFullPagesForRoute(ctx,'route');
  return true;
}
function registerPhaseGNavigationScaffold(ctx){
  ctx=ctx||{};
  if(root.WBSurfaceLifecycle&&root.WBSurfaceLifecycle.configure){
    root.WBSurfaceLifecycle.configure({qs:ctx.qs,qsa:ctx.qsa,closers:ctx.closers||{}});
  }
  if(root.WBAppShellController&&root.WBAppShellController.configure){
    root.WBAppShellController.configure({
      qs:ctx.qs,qsa:ctx.qsa,routes:ctx.routes,
      getState:ctx.getState,getWorkspaceState:ctx.getWorkspaceState,getPersonalSets:ctx.getPersonalSets,
      closeTransientsBeforeRouteChange:function(tab){return closeTransientsBeforeRouteChange(ctx,tab)},
      renderPersonalHome:ctx.renderPersonalHome,openSet:ctx.openSet,openToolsHome:ctx.openToolsHome,openToolsBible:ctx.openToolsBible,showToolsPanel:ctx.showToolsPanel,
      renderWorkspaceSetLists:ctx.renderWorkspaceSetLists,showWorkspacePanel:ctx.showWorkspacePanel,
      persistRouteMemory:function(){call(ctx,'persistRouteMemory')}
    });
    root.WBAppShellController.registerWithNavigation(root.WBNavigationController);
  }
  if(!root.WBNavigationController)return false;
  root.WBNavigationController.configure({
    closeTop:function(reason){return closeTopTransientSurface(ctx,reason||'back')},
    back:function(reason){if(closeTopTransientSurface(ctx,reason||'back'))return true;return backForActiveRoute(ctx,reason||'back')},
    currentTab:function(){var s=ctx.getState?ctx.getState():{};return s.tab||'songs'},
    routeState:function(){
      if(root.WBAppShellController&&root.WBAppShellController.routeStateSnapshot)return root.WBAppShellController.routeStateSnapshot();
      var s=ctx.getState?ctx.getState():{},w=ctx.getWorkspaceState?ctx.getWorkspaceState():{};
      return {tab:s.tab||'songs',setlistEditorId:s.setlistEditorId||null,workspacePanel:w.panel||'home',workspaceActiveSetId:w.activeSetId||null,toolsPanel:s.toolsPanel||'home',songOpen:!!(qs(ctx,'song-view')&&qs(ctx,'song-view').classList.contains('visible'))};
    }
  });
  return true;
}
function installGlobalNavigationBehaviour(ctx){
  if(!root.document||!root.document.body)return false;
  if(root.document.body.dataset.navBehaviour77==='1')return true;
  root.document.body.dataset.navBehaviour77='1';
  root.document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&closeTopTransientSurface(ctx,'escape')&&e.cancelable)e.preventDefault();
  });
  root.document.addEventListener('click',function(e){
    var bg=e.target&&e.target.classList&&e.target.classList.contains('bs-bg')?e.target:null;
    if(bg&&bg.classList.contains('open')){closeOpenBottomSheets(ctx,'backdrop');return}
    var closeBtn=e.target&&e.target.closest&&e.target.closest('.bs-bg.open .m-close,.bs-bg.open .bs-cancel,[data-wb-close]');
    if(closeBtn){
      var owner=closeBtn.closest&&closeBtn.closest('.bs-bg.open');
      if(owner){if(e.cancelable)e.preventDefault();closeOpenBottomSheets(ctx,'button')}
    }
  },true);
  return true;
}
function backForActiveRoute(ctx){
  var s=ctx&&ctx.getState?ctx.getState():{},w=ctx&&ctx.getWorkspaceState?ctx.getWorkspaceState():{};
  if(qs(ctx,'song-view')&&qs(ctx,'song-view').classList.contains('visible')){closeByName(ctx,'closeSongViewSmooth');return true}
  if(s.tab==='setlist'&&qs(ctx,'setlist-section')&&qs(ctx,'setlist-section').classList.contains('wb-editor-mode')){call(ctx,'renderPersonalHome',false);return true}
  if(s.tab==='workspace'&&w.panel&&w.panel!=='home'){call(ctx,'workspaceBack');return true}
  if(s.tab==='tools'&&s.toolsPanel&&s.toolsPanel!=='home'){call(ctx,'openToolsHome');return true}
  return false;
}
function installUniversalEdgeSwipeBack(ctx){
  if(!root.document||!root.document.body)return false;
  if(root.document.body.dataset.wb09SwipeBackReady==='1')return true;
  root.document.body.dataset.wb09SwipeBackReady='1';
  if(!root.WBGestureController||!root.WBNavigationController)return false;
  root.WBGestureController.registerEdgeBack({
    id:'universal-route-back',route:'top-level-subroute',element:root.document,edge:96,threshold:82,
    shouldStart:function(e){
      if(qs(ctx,'song-view')&&qs(ctx,'song-view').classList.contains('visible'))return false;
      if(e.target.closest&&e.target.closest('.bs-bg.open,.settings-picker-sheet.open,#add-song-modal.open,#backup-centre-modal.open'))return false;
      return true;
    },
    onCommit:function(){root.WBNavigationController.back('edge-swipe')}
  });
  return true;
}
function diagnostics(ctx){
  return {
    owner:'WBGlobalSurfaceNavigationController',
    phase:'Phase 2b - L1',
    hasSurfaceLifecycle:!!root.WBSurfaceLifecycle,
    hasNavigationController:!!root.WBNavigationController,
    hasAppShellController:!!root.WBAppShellController,
    navBehaviourInstalled:!!(root.document&&root.document.body&&root.document.body.dataset.navBehaviour77==='1'),
    edgeBackInstalled:!!(root.document&&root.document.body&&root.document.body.dataset.wb09SwipeBackReady==='1'),
    openBottomSheets:qsa(ctx,'.bs-bg.open').map(function(el){return el.id||''}).filter(Boolean),
    globalBridgeContract:['toast','sheet','transient-cleanup','navigation-scaffold','route-back','edge-swipe']
  };
}

root.WBGlobalSurfaceNavigationController={
  showSync:showSync,
  showToast:showToast,
  hideToast:hideToast,
  closeSheetElement:closeSheetElement,
  fastTabSelectFromEvent:fastTabSelectFromEvent,
  closeOpenBottomSheets:closeOpenBottomSheets,
  closeOpenFullPagesForRoute:closeOpenFullPagesForRoute,
  closeTopTransientSurface:closeTopTransientSurface,
  closeTransientsBeforeRouteChange:closeTransientsBeforeRouteChange,
  registerPhaseGNavigationScaffold:registerPhaseGNavigationScaffold,
  installGlobalNavigationBehaviour:installGlobalNavigationBehaviour,
  backForActiveRoute:backForActiveRoute,
  installUniversalEdgeSwipeBack:installUniversalEdgeSwipeBack,
  diagnostics:diagnostics
};
})(window);
