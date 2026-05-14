/* WorshipBase Phase 2b - L2 main shell retirement boundary.
   Owns shell-level dialog wrappers, brand asset application, and launch route-memory
   persistence/loading contracts. The legacy HTML shell remains a temporary adapter. */
(function(root){
'use strict';

function assign(target,source){Object.keys(source||{}).forEach(function(k){target[k]=source[k]});return target}
function promise(value){return value&&typeof value.then==='function'?value:Promise.resolve(value)}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function qs(ctx,id){try{return ctx&&ctx.qs?ctx.qs(id):(root.document&&root.document.getElementById(id))}catch(e){return null}}
function dialogController(ctx){return (ctx&&ctx.WBDialogController)||root.WBDialogController||{}}

function appAlert(ctx,message,opts){
  opts=assign({title:'WorshipBase',message:String(message||'')},opts||{});
  var ctrl=dialogController(ctx);
  if(ctrl&&typeof ctrl.alert==='function')return promise(ctrl.alert(opts));
  try{if(root.alert)root.alert(opts.message||message||'')}catch(e){}
  return Promise.resolve(true);
}
function appConfirm(ctx,message,opts){
  opts=assign({title:'Confirm',message:String(message||''),confirmText:'OK',cancelText:'Cancel'},opts||{});
  var ctrl=dialogController(ctx);
  if(ctrl&&typeof ctrl.confirm==='function')return promise(ctrl.confirm(opts));
  try{return Promise.resolve(root.confirm?!!root.confirm(opts.message||message||''):false)}catch(e){return Promise.resolve(false)}
}
function appPrompt(ctx,title,value,opts){
  opts=assign({title:title||'Enter details',value:value||'',confirmText:'Save',cancelText:'Cancel'},opts||{});
  var ctrl=dialogController(ctx);
  if(ctrl&&typeof ctrl.prompt==='function')return promise(ctrl.prompt(opts));
  try{var result=root.prompt?root.prompt(opts.title||title||'',opts.value||value||''):null;return Promise.resolve(result==null?null:String(result))}catch(e){return Promise.resolve(null)}
}

function assetConfig(constants,overrides){
  constants=constants||root.WBConstants||{};
  return assign(assign({},constants.ASSET_DEFAULTS||{}),(overrides&&typeof overrides==='object')?overrides:((root.WB_ASSETS&&typeof root.WB_ASSETS==='object')?root.WB_ASSETS:{}));
}
function wbMonogramSvg(){
  return '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 18l8 28 10-20 10 20 8-28" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function aboutBrandMarkHtml(ctx){
  ctx=ctx||{};
  var config=ctx.assetConfig||assetConfig(ctx.WBConstants,ctx.WB_ASSETS);
  var mark=config.markUrl||config.markLargeUrl||'';
  return mark?'<img alt="WorshipBase mark" src="'+esc(mark)+'">':wbMonogramSvg();
}
function applyBrandAssets(ctx){
  ctx=ctx||{};
  var config=ctx.assetConfig||assetConfig(ctx.WBConstants,ctx.WB_ASSETS);
  try{
    var titleLogo=config.wordmarkText||'WorshipBase';
    var brandName=qs(ctx,'about-brand-name');
    var wm=qs(ctx,'wm-name');
    var launchWordmark=qs(ctx,'launch-wordmark');
    if(wm&&titleLogo)wm.textContent=titleLogo;
    if(brandName&&titleLogo)brandName.textContent=titleLogo;
    if(launchWordmark&&titleLogo)launchWordmark.textContent=titleLogo;

    var doc=ctx.document||root.document;
    var apple=doc&&doc.querySelector&&doc.querySelector('link[rel="apple-touch-icon"]');
    if(apple&&config.appleTouchIconUrl)apple.setAttribute('href',config.appleTouchIconUrl);
    var favicon=doc&&doc.querySelector&&doc.querySelector('link[rel="icon"]');
    if(favicon&&config.icon192Url){favicon.setAttribute('href',config.icon192Url);favicon.setAttribute('type','image/png');}

    var launchLogo=qs(ctx,'launch-logo');
    if(launchLogo&&config.markLargeUrl)launchLogo.innerHTML='<img alt="WorshipBase mark" src="'+esc(config.markLargeUrl)+'">';

    var aboutMark=qs(ctx,'about-brand-mark');
    var aboutPanel=aboutMark&&aboutMark.closest&&aboutMark.closest('.about-panel');
    var aboutLogo=config.markUrl||config.markLargeUrl||'';
    if(aboutMark&&aboutLogo){
      if(aboutPanel)aboutPanel.classList.remove('has-rich-brand');
      aboutMark.innerHTML='<img alt="WorshipBase mark" src="'+esc(aboutLogo)+'" style="width:100%;height:100%;object-fit:contain">';
    }
    return true;
  }catch(e){return false}
}

function bibleSnapshot(ctx){
  var bible=ctx&&ctx.bibleState;
  if(!bible)return null;
  return {book:bible.book,chapter:bible.chapter,version:bible.version};
}
function buildRouteMemorySnapshot(ctx){
  ctx=ctx||{};
  var state=ctx.state||{};
  var workspaceState=ctx.workspaceState||{};
  var bible=bibleSnapshot(ctx);
  var appShell=ctx.WBAppShellController||root.WBAppShellController;
  if(appShell&&typeof appShell.routeMemorySnapshot==='function')return appShell.routeMemorySnapshot({bible:bible});
  return {
    tab:state.tab||'songs',
    toolsPanel:state.toolsPanel||'home',
    workspacePanel:workspaceState.panel||'home',
    workspaceActiveSetId:workspaceState.activeSetId||null,
    workspaceDetailType:workspaceState.detailType||null,
    workspaceSelectedPublishId:workspaceState.selectedPublishId||null,
    setlistEditorId:state.setlistEditorId||null,
    libraryFilter:state.filter||'all',
    libraryScope:state.scope||'smart',
    bible:bible
  };
}
function persistRouteMemory(ctx,reason){
  ctx=ctx||{};
  var keys=ctx.STORAGE_KEYS||{};
  var snap=buildRouteMemorySnapshot(ctx);
  if(reason)snap.reason=reason;
  if(typeof ctx.writeStoredJson==='function')ctx.writeStoredJson(keys.routeMemory,snap);
  return snap;
}
function loadRouteMemory(ctx){
  ctx=ctx||{};
  var state=ctx.state||{};
  var workspaceState=ctx.workspaceState||{};
  var bibleState=ctx.bibleState||null;
  var keys=ctx.STORAGE_KEYS||{};
  var mem={};
  try{mem=typeof ctx.readStoredObject==='function'?ctx.readStoredObject(keys.routeMemory,{}):{}}catch(e){mem={}}
  if(mem.libraryFilter)state.filter=mem.libraryFilter;
  // QA2: keep Library search scope session-only so a previous Lyrics search does not become the cold-launch default.
    state.scope='smart';
  if(mem.bible&&bibleState){
    bibleState.book=mem.bible.book||bibleState.book;
    bibleState.chapter=parseInt(mem.bible.chapter,10)||bibleState.chapter;
    bibleState.version=String(mem.bible.version||bibleState.version||(ctx.settings&&ctx.settings.defaultBibleVersion)||'esv').toLowerCase();
  }
  var startup=ctx.StartupLifecycle||root.WBStartupLifecycle;
  if(startup&&typeof startup.normalizeLaunchState==='function'){
    startup.normalizeLaunchState({state:state,workspaceState:workspaceState});
  }else{
    state.tab='songs';state.filter='all';state.query='';state.selectedId=null;state.songContext=null;state.setlistEditorId=null;state.toolsPanel='home';
    workspaceState.panel='home';workspaceState.activeSetId=null;workspaceState.detailType=null;workspaceState.selectedPublishId=null;
    try{root.document.body.classList.remove('song-open','song-focus','performance-mode','cues-hidden','sheet-lock','modal-lock','editor-open','song-closing','song-view-swiping')}catch(e){}
    state.routeMemoryLoaded=true;
  }
  return {memory:mem,state:state,workspaceState:workspaceState,bibleState:bibleState};
}

function diagnostics(){
  return {
    owner:'WBMainShellController',
    phase:'Phase 2b - L2',
    shellRetirementBoundary:'dialog wrappers, brand assets, and route-memory launch bootstrap are source-owned',
    mainShellContract:['appAlert','appConfirm','appPrompt','assetConfig','applyBrandAssets','aboutBrandMarkHtml','persistRouteMemory','loadRouteMemory'],
    legacyAdapterBoundary:'src/legacy/index.phase-d.html still hosts remaining runtime functions until final shell retirement.',
    modularisationComplete:false
  };
}

root.WBMainShellController={
  appAlert:appAlert,
  appConfirm:appConfirm,
  appPrompt:appPrompt,
  assetConfig:assetConfig,
  applyBrandAssets:applyBrandAssets,
  wbMonogramSvg:wbMonogramSvg,
  aboutBrandMarkHtml:aboutBrandMarkHtml,
  buildRouteMemorySnapshot:buildRouteMemorySnapshot,
  persistRouteMemory:persistRouteMemory,
  loadRouteMemory:loadRouteMemory,
  diagnostics:diagnostics,
  mainShellContract:diagnostics().mainShellContract
};
})(window);
