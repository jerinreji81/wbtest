/* WorshipBase Phase G navigation owner scaffold.
   Concrete tab registry, route registry, navigation controller, and gesture controller.
   This module owns registry data and raw edge-back gesture handling; the legacy shell still supplies behaviour adapters until feature extraction. */
(function(root){
'use strict';

function now(){return Date.now?Date.now():new Date().getTime()}
function asArray(list){return Array.prototype.slice.call(list||[])}
function noop(){return false}
function closest(el,selector){try{return el&&el.closest?el.closest(selector):null}catch(e){return null}}
function elementFromRef(ref){
  if(!ref)return null;
  if(ref===root.document)return root.document;
  if(ref===root.window)return root.window;
  if(typeof ref==='string')return root.document.querySelector(ref);
  return ref;
}
function publicSpec(spec){
  var out={};
  Object.keys(spec||{}).forEach(function(k){
    if(typeof spec[k]!=='function')out[k]=spec[k];
  });
  return out;
}

function createRegistry(kind){
  var map=Object.create(null);
  var order=[];
  function register(idOrSpec,spec){
    var item=typeof idOrSpec==='string'?Object.assign({},spec||{},{id:idOrSpec}):Object.assign({},idOrSpec||{});
    if(!item.id)throw new Error(kind+' registry entry requires id');
    if(!map[item.id])order.push(item.id);
    map[item.id]=Object.freeze(item);
    return map[item.id];
  }
  function unregister(id){
    if(!map[id])return false;
    delete map[id];
    order=order.filter(function(x){return x!==id});
    return true;
  }
  function get(id){return map[id]||null}
  function has(id){return !!map[id]}
  function list(){return order.map(function(id){return map[id]}).filter(Boolean)}
  function ids(){return order.slice()}
  function clear(){map=Object.create(null);order=[]}
  return {kind:kind,register:register,unregister:unregister,get:get,has:has,list:list,ids:ids,clear:clear};
}

var WBTabRegistry=createRegistry('tab');
var WBRouteRegistry=createRegistry('route');

var adapters={
  showTab:noop,
  back:noop,
  closeTop:noop,
  currentTab:function(){return null},
  routeState:function(){return {}}
};

var WBNavigationController={
  configure:function(next){
    next=next||{};
    Object.keys(next).forEach(function(k){if(typeof next[k]==='function')adapters[k]=next[k]});
    return this;
  },
  registerTab:function(spec){return WBTabRegistry.register(spec)},
  registerRoute:function(spec){return WBRouteRegistry.register(spec)},
  registerDefaultTabs:function(){
    var defaults=[
      {id:'songs',label:'Library',button:'#tab-songs',route:'#song-section',freshLaunch:true},
      {id:'setlist',label:'Set Lists',button:'#tab-setlist',route:'#setlist-section'},
      {id:'workspace',label:'Workspace',button:'#tab-workspace',route:'#workspace-section'},
      {id:'tools',label:'Tools',button:'#tab-tools',route:'#tools-section'},
      {id:'settings',label:'Settings',button:'#tab-settings',route:'#settings-section'}
    ];
    defaults.forEach(function(tab){
      WBTabRegistry.register(tab);
      WBRouteRegistry.register({id:tab.id,element:tab.route,tab:tab.id,label:tab.label,topLevel:true});
    });
    return defaults.length;
  },
  showTab:function(id,reason){
    var tab=WBTabRegistry.get(id)||WBTabRegistry.get('songs');
    if(!tab)return false;
    return adapters.showTab(tab.id,reason||'controller')!==false;
  },
  back:function(reason){return adapters.back(reason||'controller')===true},
  closeTop:function(reason){return adapters.closeTop(reason||'controller')===true},
  current:function(){return adapters.currentTab()},
  routeState:function(){return adapters.routeState()},
  diagnostics:function(){
    return {
      tabs:WBTabRegistry.list().map(publicSpec),
      routes:WBRouteRegistry.list().map(publicSpec),
      current:adapters.currentTab(),
      routeState:adapters.routeState()
    };
  }
};

var gestureMap=Object.create(null);
function registerEdgeBack(options){
  options=options||{};
  var id=options.id||options.route||('edge-back-'+Object.keys(gestureMap).length);
  if(gestureMap[id]&&gestureMap[id].destroy)gestureMap[id].destroy();
  var target=elementFromRef(options.element)||root.document;
  var threshold=typeof options.threshold==='number'?options.threshold:72;
  var edge=typeof options.edge==='number'?options.edge:96;
  var shouldStart=typeof options.shouldStart==='function'?options.shouldStart:function(){return true};
  var onCommit=typeof options.onCommit==='function'?options.onCommit:function(){return WBNavigationController.back('edge-back')};
  var state={sx:0,sy:0,dx:0,tracking:false,locked:false,startedAt:0};
  function point(e){return e&&e.touches&&e.touches[0]?e.touches[0]:e}
  function onStart(e){
    var p=point(e);if(!p)return;
    if(p.clientX>edge)return;
    if(options.ignoreSelector&&closest(e.target,options.ignoreSelector))return;
    if(shouldStart(e,p)===false)return;
    state.sx=p.clientX;state.sy=p.clientY;state.dx=0;state.tracking=true;state.locked=false;state.startedAt=now();
    try{if(options.activeClass)root.document.body.classList.add(options.activeClass)}catch(err){}
  }
  function onMove(e){
    if(!state.tracking)return;var p=point(e);if(!p)return;
    state.dx=p.clientX-state.sx;var dy=Math.abs(p.clientY-state.sy);
    if(!state.locked){
      if(Math.abs(state.dx)<18&&dy<18)return;
      if(dy>Math.abs(state.dx)*0.9){state.tracking=false;return}
      state.locked=true;
    }
    if(state.dx>16&&state.dx>dy*1.2&&e.cancelable)e.preventDefault();
    if(typeof options.onProgress==='function')options.onProgress(Math.max(0,state.dx),e);
  }
  function finish(committed){
    var dx=state.dx;
    state.tracking=false;state.locked=false;state.dx=0;
    try{if(options.activeClass)root.document.body.classList.remove(options.activeClass)}catch(err){}
    if(committed)onCommit({distance:dx,startedAt:state.startedAt,endedAt:now(),id:id});
    else if(typeof options.onCancel==='function')options.onCancel({distance:dx,id:id});
  }
  function onEnd(){if(!state.tracking)return;finish(state.dx>threshold)}
  function onCancel(){if(!state.tracking)return;finish(false)}
  target.addEventListener('touchstart',onStart,{passive:true,capture:true});
  target.addEventListener('touchmove',onMove,{passive:false,capture:true});
  target.addEventListener('touchend',onEnd,{passive:true,capture:true});
  target.addEventListener('touchcancel',onCancel,{passive:true,capture:true});
  var handle={id:id,route:options.route||null,element:options.element||'document',threshold:threshold,edge:edge,destroy:function(){
    target.removeEventListener('touchstart',onStart,true);
    target.removeEventListener('touchmove',onMove,true);
    target.removeEventListener('touchend',onEnd,true);
    target.removeEventListener('touchcancel',onCancel,true);
    delete gestureMap[id];
  }};
  gestureMap[id]=handle;
  return handle;
}

var WBGestureController={
  registerEdgeBack:registerEdgeBack,
  unregister:function(id){if(!gestureMap[id])return false;gestureMap[id].destroy();return true},
  list:function(){return Object.keys(gestureMap).map(function(id){var g=gestureMap[id];return {id:g.id,route:g.route,element:g.element,threshold:g.threshold,edge:g.edge}})},
  diagnostics:function(){return {gestures:this.list(),owner:'WBGestureController'}}
};

root.WBTabRegistry=WBTabRegistry;
root.WBRouteRegistry=WBRouteRegistry;
root.WBNavigationController=WBNavigationController;
root.WBGestureController=WBGestureController;
})(window);
