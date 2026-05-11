/* WorshipBase Phase J1 Tools controller owner.
   Owns Tools panel state, Key/Capo calculations, and pad-selector state helpers.
   Bible rendering and audio playback remain in the legacy shell for now. */
(function(root){
'use strict';

var TOOL_KEYS=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
var PAD_TYPES=['Peaceful','Analog','Drones'];
var VALID_PANELS={home:true,bible:true,keycapo:true,pads:true,chordnns:true};

function normalizePanel(name){
  name=String(name||'home').trim().toLowerCase();
  if(name==='key-capo'||name==='key_capo'||name==='capo')name='keycapo';
  if(name==='pad'||name==='pads')name='pads';
  if(name==='chord-nns'||name==='chord_nns'||name==='nns'||name==='chords'||name==='reference')name='chordnns';
  if(name==='scripture')name='bible';
  return VALID_PANELS[name]?name:'home';
}
function showPanel(doc,state,name){
  name=normalizePanel(name);
  if(state)state.toolsPanel=name==='home'?'home':name;
  if(doc&&doc.querySelectorAll){
    Array.prototype.forEach.call(doc.querySelectorAll('#tools-section .tools-panel'),function(panel){
      panel.classList.toggle('active',panel.id==='tools-'+name+'-panel');
    });
  }
  return name;
}
function ensureKey(key,fallback,keys){
  keys=keys&&keys.length?keys:TOOL_KEYS;
  key=String(key||'').trim();
  fallback=String(fallback||keys[0]||'C').trim();
  return keys.indexOf(key)>=0?key:(keys.indexOf(fallback)>=0?fallback:(keys[0]||'C'));
}
function keyCapo(original,target,keys){
  keys=keys&&keys.length?keys:TOOL_KEYS;
  original=ensureKey(original,'G',keys);
  target=ensureKey(target,'C',keys);
  var oi=keys.indexOf(original),ti=keys.indexOf(target),steps=(ti-oi+keys.length)%keys.length;
  var suggestions=[0,1,2,3,4].map(function(capo){
    return {capo:capo,shape:keys[(ti-capo+keys.length)%keys.length]};
  });
  return {original:original,target:target,steps:steps,suggestions:suggestions};
}
function normalizePadState(state,keys,types){
  keys=keys&&keys.length?keys:TOOL_KEYS;
  types=types&&types.length?types:PAD_TYPES;
  state=state&&typeof state==='object'?state:{};
  return {
    type:types.indexOf(state.type)>=0?state.type:types[0],
    key:keys.indexOf(state.key)>=0?state.key:keys[0],
    playing:!!state.playing
  };
}
function chipModels(values,active){
  return (values||[]).map(function(value){return {value:value,active:value===active};});
}
function padStatus(state){
  state=normalizePadState(state);
  return state.playing?('Playing '+state.type+' pad in '+state.key):('Ready: '+state.type+' pad in '+state.key);
}
function setPadType(state,type,types){
  state=normalizePadState(state,null,types);
  types=types&&types.length?types:PAD_TYPES;
  state.type=types.indexOf(type)>=0?type:state.type;
  return state;
}
function setPadKey(state,key,keys){
  state=normalizePadState(state,keys,null);
  keys=keys&&keys.length?keys:TOOL_KEYS;
  state.key=keys.indexOf(key)>=0?key:state.key;
  return state;
}
function setPadPlaying(state,playing){
  state=normalizePadState(state);
  state.playing=!!playing;
  return state;
}
function toolsBackTarget(state){
  if(!state)return 'home';
  return normalizePanel(state.toolsPanel)==='home'?'tab-home':'home';
}

root.WBToolsController={
  TOOL_KEYS:TOOL_KEYS,
  PAD_TYPES:PAD_TYPES,
  normalizePanel:normalizePanel,
  showPanel:showPanel,
  ensureKey:ensureKey,
  keyCapo:keyCapo,
  normalizePadState:normalizePadState,
  chipModels:chipModels,
  padStatus:padStatus,
  setPadType:setPadType,
  setPadKey:setPadKey,
  setPadPlaying:setPadPlaying,
  toolsBackTarget:toolsBackTarget
};
})(window);
