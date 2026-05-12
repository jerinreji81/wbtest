/* WorshipBase Phase 2b - C1 app shell/router owner.
   Owns top-level tab route application, body route classes, route-memory snapshot building,
   and shell diagnostics. The legacy shell supplies feature adapters until those features are extracted. */
(function(root){
'use strict';

var DEFAULT_ROUTES={
  songs:'song-section',
  setlist:'setlist-section',
  workspace:'workspace-section',
  tools:'tools-section',
  settings:'settings-section'
};
var TAB_ORDER=['songs','setlist','workspace','tools','settings'];
var TAB_LABELS={songs:'Library',setlist:'Set Lists',workspace:'Workspace',tools:'Tools',settings:'Settings'};

var adapters={
  qs:function(id){return root.document&&root.document.getElementById(id)},
  qsa:function(sel){return root.document?Array.prototype.slice.call(root.document.querySelectorAll(sel)):[]},
  getState:function(){return {}},
  getWorkspaceState:function(){return {}},
  getPersonalSets:function(){return []},
  routes:DEFAULT_ROUTES,
  closeTransientsBeforeRouteChange:function(){},
  renderPersonalHome:function(){},
  openSet:function(){},
  openToolsHome:function(){},
  openToolsBible:function(){},
  showToolsPanel:function(){},
  renderWorkspaceSetLists:function(){},
  showWorkspacePanel:function(){},
  persistRouteMemory:function(){},
  onBeforeRoute:function(){},
  onAfterRoute:function(){}
};
var configured=false;

function assign(target,source){Object.keys(source||{}).forEach(function(k){target[k]=source[k]});return target}
function routes(){return assign(assign({},DEFAULT_ROUTES),adapters.routes||{})}
function normaliseTab(tab){var r=routes();return r[tab]?tab:'songs'}
function qs(id){try{return adapters.qs(id)}catch(e){return null}}
function qsa(sel){try{return adapters.qsa(sel)||[]}catch(e){return []}}
function state(){try{return adapters.getState()||{}}catch(e){return {}}}
function workspaceState(){try{return adapters.getWorkspaceState()||{}}catch(e){return {}}}
function personalSets(){try{return adapters.getPersonalSets()||[]}catch(e){return []}}
function hasEditorOpen(){var el=qs('wb-set-editor');return !!(el&&!el.hidden)}

function setBodyRouteClasses(tab,extra){
  if(!root.document||!root.document.body)return false;
  tab=normaliseTab(tab);
  var body=root.document.body;
  var keep=[];
  if(body.classList.contains('dark'))keep.push('dark');
  if(body.classList.contains('wb-ui-ready'))keep.push('wb-ui-ready');
  keep.push('wb-route-'+tab,'wb-tab-'+tab);
  if(extra)String(extra).split(/\s+/).filter(Boolean).forEach(function(cls){keep.push(cls)});
  body.className=keep.join(' ');
  return true;
}

function applyTopLevelRoute(tab){
  tab=normaliseTab(tab);
  var r=routes();
  qsa('.route').forEach(function(el){el.classList.remove('active')});
  var routeEl=qs(r[tab]);
  if(routeEl)routeEl.classList.add('active');
  qsa('.tab-btn').forEach(function(btn){btn.classList.toggle('active', btn.dataset&&btn.dataset.tab===tab)});
  var search=qs('srch-wrap');if(search)search.style.display=tab==='songs'?'block':'none';
  var add=qs('hdr-add-btn');if(add)add.style.display=tab==='songs'?'flex':'none';
  setBodyRouteClasses(tab);
  return tab;
}

function routeMemorySnapshot(extra){
  var s=state(), w=workspaceState();
  var bible=extra&&extra.bible?extra.bible:null;
  return {
    tab:s.tab||'songs',
    toolsPanel:s.toolsPanel||'home',
    workspacePanel:w.panel||'home',
    workspaceActiveSetId:w.activeSetId||null,
    workspaceDetailType:w.detailType||null,
    workspaceSelectedPublishId:w.selectedPublishId||null,
    setlistEditorId:s.setlistEditorId||null,
    libraryFilter:s.filter||'all',
    libraryScope:s.scope||'smart',
    bible:bible
  };
}

function routeStateSnapshot(){
  var s=state(), w=workspaceState();
  return {
    tab:s.tab||'songs',
    setlistEditorId:s.setlistEditorId||null,
    workspacePanel:w.panel||'home',
    workspaceActiveSetId:w.activeSetId||null,
    workspaceDetailType:w.detailType||null,
    workspaceSelectedPublishId:w.selectedPublishId||null,
    toolsPanel:s.toolsPanel||'home',
    songOpen:!!(qs('song-view')&&qs('song-view').classList.contains('visible'))
  };
}

function showTab(tab,options){
  options=options||{};
  var s=state(), w=workspaceState();
  tab=normaliseTab(tab);
  try{adapters.onBeforeRoute(tab,options)}catch(e){}
  try{adapters.closeTransientsBeforeRouteChange(tab)}catch(e){}
  var previous=s.tab;

  if(tab==='setlist'&&previous==='setlist'&&hasEditorOpen()){
    s.setlistEditorId=null;
    s.tab=tab;
    applyTopLevelRoute(tab);
    try{adapters.renderPersonalHome(false)}catch(e){}
    try{adapters.persistRouteMemory('repeat-setlist')}catch(e){}
    try{adapters.onAfterRoute(tab,previous,options)}catch(e){}
    return tab;
  }
  if(tab==='workspace'&&previous==='workspace'&&w.panel&&w.panel!=='home'){
    try{adapters.showWorkspacePanel('home')}catch(e){}
    try{adapters.persistRouteMemory('repeat-workspace')}catch(e){}
    try{adapters.onAfterRoute(tab,previous,options)}catch(e){}
    return tab;
  }
  if(tab==='tools'&&previous==='tools'&&s.toolsPanel&&s.toolsPanel!=='home'){
    try{adapters.openToolsHome()}catch(e){}
    try{adapters.persistRouteMemory('repeat-tools')}catch(e){}
    try{adapters.onAfterRoute(tab,previous,options)}catch(e){}
    return tab;
  }

  s.tab=tab;
  applyTopLevelRoute(tab);

  if(tab==='setlist'){
    var remembered=s.setlistEditorId&&personalSets().some(function(x){return x&&x.id===s.setlistEditorId});
    try{if(previous!=='setlist'&&remembered)adapters.openSet(s.setlistEditorId);else adapters.renderPersonalHome(false)}catch(e){}
  }
  if(tab==='tools'){
    var panel=s.toolsPanel||'home';
    try{if(panel==='bible')adapters.openToolsBible(true);else adapters.showToolsPanel(panel||'home')}catch(e){}
  }
  if(tab==='workspace'){
    try{adapters.renderWorkspaceSetLists()}catch(e){}
    try{adapters.showWorkspacePanel(w.panel||'home')}catch(e){}
  }
  try{adapters.persistRouteMemory('route-change')}catch(e){}
  try{adapters.onAfterRoute(tab,previous,options)}catch(e){}
  return tab;
}

function configure(next){
  adapters=assign(adapters,next||{});
  configured=true;
  return WBAppShellController;
}

function registerWithNavigation(nav){
  nav=nav||root.WBNavigationController;
  if(!nav)return false;
  try{nav.registerDefaultTabs()}catch(e){}
  nav.configure({
    showTab:function(tab,reason){showTab(tab,{reason:reason||'navigation-controller'});return true},
    currentTab:function(){return state().tab||'songs'},
    routeState:function(){return routeStateSnapshot()}
  });
  return true;
}

function diagnostics(){
  var r=routes();
  return {
    owner:'WBAppShellController',
    phase:'Phase 2b - D2',
    configured:configured,
    tabs:TAB_ORDER.map(function(id){return {id:id,label:TAB_LABELS[id],route:r[id]||null}}),
    current:routeStateSnapshot(),
    bodyClassOwner:'WBAppShellController.setBodyRouteClasses',
    routeMemoryOwner:'WBAppShellController.routeMemorySnapshot',
    activeRouteOwner:'WBAppShellController.showTab',
    legacyAdapterBoundary:'Feature renderers still supplied by legacy shell until later Phase 2b extraction phases.'
  };
}

var WBAppShellController={
  configure:configure,
  showTab:showTab,
  applyTopLevelRoute:applyTopLevelRoute,
  setBodyRouteClasses:setBodyRouteClasses,
  routeMemorySnapshot:routeMemorySnapshot,
  routeStateSnapshot:routeStateSnapshot,
  registerWithNavigation:registerWithNavigation,
  diagnostics:diagnostics,
  normaliseTab:normaliseTab,
  routes:function(){return routes()},
  tabs:function(){return TAB_ORDER.slice()}
};

root.WBAppShellController=WBAppShellController;
})(window);
