/* WorshipBase Phase F startup/PWA lifecycle owner.
   Source of truth for launch reset rules and PWA update registration.
   This module must remain behaviour-preserving: fresh launch starts at Library and closes stale overlays. */
(function(root){
'use strict';

var DEFAULT_STATIC_ASSETS=[
  'manifest.webmanifest',
  'wb-offline-sw.js',
  'worshipbase_layered_fold_w_proper/app-icons/app-icon-180.png',
  'worshipbase_layered_fold_w_proper/app-icons/app-icon-192.png',
  'worshipbase_layered_fold_w_proper/app-icons/apple-touch-icon.png',
  'worshipbase_layered_fold_w_proper/png/worshipbase-mark-256.png',
  'worshipbase_layered_fold_w_proper/launch/launch-dark.png'
];

var BODY_TRANSIENT_CLASSES=[
  'song-open',
  'song-focus',
  'performance-mode',
  'cues-hidden',
  'sheet-lock',
  'modal-lock',
  'editor-open',
  'song-closing',
  'song-view-swiping'
];

function canUseOfflineCaches(){
  return !!(root.isSecureContext && 'caches' in root);
}

function sameOriginAsset(url){
  try{
    var u=new URL(url, root.location && root.location.href ? root.location.href : undefined);
    return u.origin===(root.location&&root.location.origin) ? u.href : '';
  }catch(e){return ''}
}

function normalizeLaunchState(context){
  context=context||{};
  var state=context.state||{};
  var workspaceState=context.workspaceState||{};

  state.tab='songs';
  state.selectedId=null;
  state.songContext=null;
  state.setlistEditorId=null;
  state.toolsPanel='home';

  workspaceState.panel='home';
  workspaceState.activeSetId=null;
  workspaceState.detailType=null;
  workspaceState.selectedPublishId=null;

  try{
    if(root.document&&root.document.body){
      root.document.body.classList.remove.apply(root.document.body.classList, BODY_TRANSIENT_CLASSES);
    }
  }catch(e){}

  state.routeMemoryLoaded=true;
  return {state:state,workspaceState:workspaceState};
}

function syncLibraryFilterChips(state){
  state=state||{};
  try{
    var active=String(state.filter||'all');
    var row=root.document&&root.document.getElementById('library-filter-row');
    if(!row)return false;
    Array.prototype.forEach.call(row.querySelectorAll('.filter-chip[data-filter]'),function(btn){
      btn.classList.toggle('active', String(btn.getAttribute('data-filter')||'')===active);
    });
    return true;
  }catch(e){return false}
}

function collectOfflineUrls(options){
  options=options||{};
  var urls=[];
  try{urls.push(root.location.href.split('#')[0]);}catch(e){}
  (options.staticAssets||DEFAULT_STATIC_ASSETS).forEach(function(p){
    var u=sameOriginAsset(p); if(u)urls.push(u);
  });
  try{
    [root.document.querySelector('link[rel="manifest"]'),root.document.querySelector('link[rel="apple-touch-icon"]'),root.document.querySelector('link[rel="icon"]')].forEach(function(el){
      if(!el||!el.href)return; var u=sameOriginAsset(el.href); if(u)urls.push(u);
    });
  }catch(e){}
  var seen=Object.create(null);
  return urls.filter(function(u){if(!u||seen[u])return false;seen[u]=true;return true});
}

function warmOfflineCaches(options){
  options=options||{};
  if(!canUseOfflineCaches())return Promise.resolve(false);
  var urls=collectOfflineUrls(options);
  if(!urls.length)return Promise.resolve(false);
  var cacheName=options.cacheName||'worshipbase-offline-runtime';
  return root.caches.open(cacheName).then(function(cache){
    return Promise.all(urls.map(function(u){return cache.add(u).catch(function(){})})).then(function(){return true});
  }).catch(function(){return false});
}

function registerOfflineServiceWorker(options){
  options=options||{};
  var navigator=root.navigator;
  if(!navigator||!('serviceWorker' in navigator))return Promise.resolve(false);
  if(!/^https?:$/i.test(root.location&&root.location.protocol||''))return Promise.resolve(false);
  var swUrl=options.url||'./wb-offline-sw.js';
  if(options.version)swUrl += (swUrl.indexOf('?')>=0?'&':'?') + 'v=' + encodeURIComponent(options.version);
  var notify=typeof options.notify==='function'?options.notify:function(){};
  return navigator.serviceWorker.register(swUrl).then(function(reg){
    try{if(reg&&reg.update)reg.update().catch(function(){})}catch(e){}
    try{if(reg&&reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'})}catch(e){}
    try{
      reg.addEventListener('updatefound',function(){
        var sw=reg.installing;if(!sw)return;
        sw.addEventListener('statechange',function(){
          if(sw.state==='installed'&&navigator.serviceWorker.controller){
            notify('WorshipBase updated. Reopen if anything looks old.');
          }
        });
      });
    }catch(e){}
    return true;
  }).catch(function(){return false});
}

var serviceWorkerRefreshing=false;
function installServiceWorkerControllerReload(options){
  options=options||{};
  var navigator=root.navigator;
  if(!navigator||!('serviceWorker' in navigator))return false;
  try{
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(serviceWorkerRefreshing)return;
      serviceWorkerRefreshing=true;
      setTimeout(function(){try{root.location.reload()}catch(e){}}, options.delayMs||250);
    });
    return true;
  }catch(e){return false}
}

function diagnostics(){
  return {
    freshLaunchRoute:'songs',
    transientClasses:BODY_TRANSIENT_CLASSES.slice(),
    canUseOfflineCaches:canUseOfflineCaches(),
    serviceWorker:!!(root.navigator&&root.navigator.serviceWorker),
    controllerReloadInstalled:serviceWorkerRefreshing?true:'listener-installed-on-boot'
  };
}

root.WBStartupLifecycle={
  DEFAULT_STATIC_ASSETS:DEFAULT_STATIC_ASSETS,
  BODY_TRANSIENT_CLASSES:BODY_TRANSIENT_CLASSES,
  normalizeLaunchState:normalizeLaunchState,
  syncLibraryFilterChips:syncLibraryFilterChips,
  canUseOfflineCaches:canUseOfflineCaches,
  sameOriginAsset:sameOriginAsset,
  collectOfflineUrls:collectOfflineUrls,
  warmOfflineCaches:warmOfflineCaches,
  registerOfflineServiceWorker:registerOfflineServiceWorker,
  installServiceWorkerControllerReload:installServiceWorkerControllerReload,
  diagnostics:diagnostics
};
})(window);
