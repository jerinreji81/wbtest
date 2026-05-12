/* WorshipBase Phase 2b - C2 surface lifecycle owner; active package Phase 2b - D1.
   Owns the shared lifecycle boundary for bottom sheets, modal/full-page overlays,
   transient route cleanup, and surface diagnostics while the legacy shell still
   supplies many concrete close handlers. New/extracted code should register
   surfaces here instead of adding separate close-all logic. */
(function(root){
'use strict';

var adapters={
  qs:function(id){return root.document&&root.document.getElementById(id)},
  qsa:function(sel){return root.document?Array.prototype.slice.call(root.document.querySelectorAll(sel)):[]},
  closers:{},
  beforeClose:function(){},
  afterClose:function(){}
};
var registry={};
var configured=false;

function assign(target,source){Object.keys(source||{}).forEach(function(k){target[k]=source[k]});return target}
function qs(id){try{return adapters.qs(id)}catch(e){return null}}
function qsa(sel){try{return adapters.qsa(sel)||[]}catch(e){return []}}
function isOpenElement(el){return !!(el&&el.classList&&(el.classList.contains('open')||el.classList.contains('visible')))}
function safeClose(fn,reason,id){
  try{if(typeof fn==='function'){fn(reason,id);return true}}catch(e){}
  return false;
}
function configure(next){
  next=next||{};
  if(next.closers)adapters.closers=assign(adapters.closers,next.closers);
  adapters=assign(adapters,next);
  configured=true;
  registerLegacySurfaces();
  return WBSurfaceLifecycle;
}
function register(id,options){
  if(!id)return WBSurfaceLifecycle;
  registry[id]=assign({id:id,type:'surface',selector:'#'+id,priority:50},options||{});
  return WBSurfaceLifecycle;
}
function unregister(id){delete registry[id];return WBSurfaceLifecycle}
function registerLegacySurfaces(){
  var bottomSheets={
    'bs-admin-pin':'closeAdminPinSheet','bs-admin-firebase-tools':'closeAdminFirebaseTools','bs-admin-duplicates':'closeAdminDuplicateReview',
    'bs-add-song-menu':'closeAddSongMenu','bs-song-menu':'closeSongMenu','bs-playback':'closePlaybackOptions','bs-pad':'closePadSheet',
    'bs-chord-diagrams':'closeChordDiagramsSheet','bs-set-options':'closeSetOptions','bs-set-song-picker':'closeSetSongPicker','bs-set-key':'closeSetKeySheet',
    'bs-personal-new':'closePersonalNewSheet','bs-workspace-new':'closeWorkspaceNewSheet','bs-workspace-publish':'closeWorkspacePublishSheet',
    'bs-settings-picker':'closeSettingsPicker','bs-bible-picker':'closeBiblePicker','bs-bible-version':'closeBibleVersionPicker','bs-import-duplicates':'closeImportDuplicateReview'
  };
  Object.keys(bottomSheets).forEach(function(id){
    if(registry[id])return;
    register(id,{type:'bottom-sheet',selector:'#'+id,priority:70,close:function(reason){return callCloser(bottomSheets[id],reason,id)}});
  });
  var pages={
    'dup-review-view':'closeDuplicateReviewPage','wb-export-pdf-preview-view':'closeExportPreview','export-view':'closeExportView','backup-centre-modal':'closeBackupCentre','add-song-modal':'closeAddSongModal'
  };
  Object.keys(pages).forEach(function(id){
    if(registry[id])return;
    register(id,{type:'full-page',selector:'#'+id,priority:90,close:function(reason){return callCloser(pages[id],reason,id)}});
  });
}
function callCloser(name,reason,id){
  var fn=adapters.closers&&adapters.closers[name];
  if(!fn&&typeof root[name]==='function')fn=root[name];
  return safeClose(fn,reason,id);
}
function fallbackCloseElement(el){
  if(!el)return false;
  if(el.classList)el.classList.remove('open','visible');
  try{el.setAttribute('aria-hidden','true')}catch(e){}
  return true;
}
function closeSurface(id,reason){
  var item=registry[id];
  if(!item)return false;
  var el=null;
  if(item.selector){try{el=root.document&&root.document.querySelector(item.selector)}catch(e){}}
  if(item.isOpen&&!item.isOpen(el))return false;
  if(!item.isOpen&&!isOpenElement(el))return false;
  try{adapters.beforeClose(item,reason)}catch(e){}
  var ok=safeClose(item.close,reason,id);
  if(!ok)ok=fallbackCloseElement(el);
  try{adapters.afterClose(item,reason,ok)}catch(e){}
  return ok;
}
function openSurfaces(type){
  registerLegacySurfaces();
  return Object.keys(registry).map(function(id){return registry[id]}).filter(function(item){
    if(type&&item.type!==type)return false;
    var el=null;
    if(item.selector){try{el=root.document&&root.document.querySelector(item.selector)}catch(e){}}
    return item.isOpen?item.isOpen(el):isOpenElement(el);
  }).sort(function(a,b){return (b.priority||0)-(a.priority||0)});
}
function closeType(type,reason){
  var items=openSurfaces(type), closed=0;
  items.forEach(function(item){if(closeSurface(item.id,reason))closed++});
  return closed;
}
function closeBottomSheets(reason){return closeType('bottom-sheet',reason||'close-bottom-sheets')}
function closeFullPages(reason){return closeType('full-page',reason||'close-full-pages')}
function closeAll(reason){return closeType(null,reason||'close-all')}
function closeTop(reason){
  var items=openSurfaces(null);
  if(!items.length)return false;
  return closeSurface(items[0].id,reason||'close-top');
}
function closeBeforeRouteChange(tab){
  closeBottomSheets('route:'+tab);
  closeFullPages('route:'+tab);
  return true;
}
function diagnostics(){
  registerLegacySurfaces();
  var items=Object.keys(registry).map(function(id){
    var item=registry[id];
    var el=null;
    if(item.selector){try{el=root.document&&root.document.querySelector(item.selector)}catch(e){}}
    return {id:id,type:item.type,selector:item.selector,priority:item.priority||0,isOpen:item.isOpen?!!item.isOpen(el):isOpenElement(el)};
  }).sort(function(a,b){return (b.priority||0)-(a.priority||0)});
  return {
    owner:'WBSurfaceLifecycle',
    phase:'Phase 2b - D1',
    configured:configured,
    registeredSurfaceCount:items.length,
    openSurfaceCount:items.filter(function(x){return x.isOpen}).length,
    surfaces:items,
    lifecycleOwner:'src/ui/surface-lifecycle.js',
    legacyAdapterBoundary:'Concrete close handlers still live in the legacy shell until later extraction phases.'
  };
}

var WBSurfaceLifecycle={
  configure:configure,
  register:register,
  unregister:unregister,
  closeSurface:closeSurface,
  closeBottomSheets:closeBottomSheets,
  closeFullPages:closeFullPages,
  closeAll:closeAll,
  closeTop:closeTop,
  closeBeforeRouteChange:closeBeforeRouteChange,
  openSurfaces:openSurfaces,
  diagnostics:diagnostics
};

root.WBSurfaceLifecycle=WBSurfaceLifecycle;
})(window);
