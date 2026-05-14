/* WorshipBase Phase 2b - H1 Settings/Admin extraction boundary owner.
   Owns non-visual Tools action semantics for Key/Capo, Chord/NNS, Pads, and Bible.
   Legacy DOM handlers remain temporary callers; they delegate state mutations here. */
(function(root){
'use strict';

function call(fn){if(typeof fn==='function')return fn.apply(null,Array.prototype.slice.call(arguments,1));}
function num(value,fallback){var n=parseInt(value,10);return Number.isFinite(n)?n:(fallback||0);}
function asLower(value,fallback){value=String(value||fallback||'').trim().toLowerCase();return value||fallback||'';}
function getOwner(){return root.WBToolsController||{};}
function getBibleOwner(){return root.WBBibleController||{};}
function getChordOwner(){return root.WBChordNnsController||{};}
function getPadAudio(){return root.WorshipBasePad||{};}

function normaliseChordState(state){
  state=state||{};
  if(!state.key)state.key='C';
  if(!state.mode)state.mode='major';
  if(!state.transposeTarget)state.transposeTarget=state.key||'C';
  if(!state.root)state.root='C';
  if(!state.quality)state.quality='maj';
  state.variation=num(state.variation,0);
  if(!state.instrument)state.instrument='guitar';
  if(!('lastCopy' in state))state.lastCopy='';
  return state;
}
function setChordKey(state,value){state=normaliseChordState(state);state.key=value||state.key;return state;}
function setChordMode(state,value){state=normaliseChordState(state);state.mode=value||state.mode;return state;}
function setChordTransposeTarget(state,value){state=normaliseChordState(state);state.transposeTarget=value||state.transposeTarget||state.key;return state;}
function setChordRoot(state,value){state=normaliseChordState(state);state.root=value||state.root;return state;}
function setChordQuality(state,value){state=normaliseChordState(state);state.quality=value||state.quality;state.variation=0;return state;}
function setChordVariation(state,value){state=normaliseChordState(state);state.variation=num(value,0);return state;}
function applyNnsExample(ctx,value){
  ctx=ctx||{};
  var doc=ctx.document||root.document;
  var input=doc&&doc.getElementById?doc.getElementById('nns-convert-input'):null;
  if(input){input.value=value||'';call(ctx.updateConversion);if(input.focus)input.focus();return true;}
  return false;
}
function copyNnsResult(ctx){
  ctx=ctx||{};
  var state=normaliseChordState(call(ctx.getChordState)||ctx.chordState||{});
  var showToast=ctx.showToast||function(){};
  if(!state.lastCopy){showToast('Nothing to copy');return false;}
  try{
    if(root.navigator&&root.navigator.clipboard&&root.navigator.clipboard.writeText){
      root.navigator.clipboard.writeText(state.lastCopy).then(function(){showToast('Conversion copied')},function(){showToast('Copy failed')});
      return true;
    }
  }catch(e){}
  showToast('Copy failed');
  return false;
}

function normalisePadState(state,keys,types){
  var owner=getOwner();
  if(owner.normalizePadState)return owner.normalizePadState(state,keys,types);
  state=state||{};
  return {type:state.type||'Peaceful',key:state.key||'C',playing:!!state.playing};
}
function setPadTypeState(state,value,keys,types){
  var owner=getOwner();
  state=owner.setPadType?owner.setPadType(state,value,types):Object.assign({},state||{},{type:value});
  try{var audio=getPadAudio();if(audio&&audio.setMode)audio.setMode(value)}catch(e){}
  return normalisePadState(state,keys,types);
}
function setPadKeyState(state,value,keys,types){
  var owner=getOwner();
  state=owner.setPadKey?owner.setPadKey(state,value,keys):Object.assign({},state||{},{key:value});
  try{var audio=getPadAudio();if(audio&&audio.setKey)audio.setKey(value)}catch(e){}
  return normalisePadState(state,keys,types);
}
function setPadPlayingState(state,playing,keys,types){
  var owner=getOwner();
  state=owner.setPadPlaying?owner.setPadPlaying(state,!!playing):Object.assign({},state||{},{playing:!!playing});
  return normalisePadState(state,keys,types);
}
function playPad(ctx){
  ctx=ctx||{};
  var showToast=ctx.showToast||function(){};
  var state=setPadPlayingState(call(ctx.getPadState)||ctx.padState||{},true,ctx.keys,ctx.types);
  call(ctx.setPadState,state);
  try{
    var audio=getPadAudio();
    if(audio&&audio.start){
      var result=audio.start();
      if(result&&typeof result.then==='function'){
        result.then(function(){call(ctx.renderStatus)}).catch(function(err){var reset=setPadPlayingState(state,false,ctx.keys,ctx.types);call(ctx.setPadState,reset);call(ctx.renderStatus);showToast(err&&err.message?err.message:'Could not play pad')});
      }
    }
  }catch(err){showToast('Could not play pad')}
  call(ctx.renderStatus);
  return state;
}
function stopPad(ctx){
  ctx=ctx||{};
  var state=setPadPlayingState(call(ctx.getPadState)||ctx.padState||{},false,ctx.keys,ctx.types);
  call(ctx.setPadState,state);
  try{var audio=getPadAudio();if(audio&&audio.stop)audio.stop()}catch(e){}
  call(ctx.renderStatus);
  return state;
}

function setBibleBook(ctx,book){
  ctx=ctx||{};
  var controller=ctx.controller||getBibleOwner();
  var state=ctx.bibleState||call(ctx.getBibleState)||{};
  var runtime=ctx.bibleRuntime||call(ctx.getBibleRuntime)||{};
  var settings=ctx.settings||call(ctx.getSettings)||{};
  if(controller.setBook)controller.setBook(state,runtime,book,settings);
  else{state.book=book;var max=call(ctx.chapterCount,book)||28;state.chapter=Math.min(num(state.chapter,1),max);}
  call(ctx.persistRouteMemory);
  call(ctx.renderPicker);
  call(ctx.renderShell);
  return state;
}
function setBibleChapter(ctx,chapter){
  ctx=ctx||{};
  var controller=ctx.controller||getBibleOwner();
  var state=ctx.bibleState||call(ctx.getBibleState)||{};
  var runtime=ctx.bibleRuntime||call(ctx.getBibleRuntime)||{};
  if(controller.setChapter)controller.setChapter(state,runtime,chapter,ctx.settings||{});
  else state.chapter=num(chapter,1);
  call(ctx.persistRouteMemory);
  call(ctx.renderShell);
  call(ctx.closePicker);
  return state;
}
function changeBibleChapter(ctx,delta){
  ctx=ctx||{};
  var controller=ctx.controller||getBibleOwner();
  var state=ctx.bibleState||call(ctx.getBibleState)||{};
  var runtime=ctx.bibleRuntime||call(ctx.getBibleRuntime)||{};
  if(controller.changeChapter)controller.changeChapter(state,runtime,delta,ctx.settings||{});
  else state.chapter=num(state.chapter,1)+(parseInt(delta,10)||0);
  call(ctx.persistRouteMemory);
  call(ctx.renderShell);
  return state;
}
function setBibleVersion(ctx,version){
  ctx=ctx||{};
  var controller=ctx.controller||getBibleOwner();
  var state=ctx.bibleState||call(ctx.getBibleState)||{};
  var settings=ctx.settings||call(ctx.getSettings)||{};
  if(controller.setVersion)controller.setVersion(state,version,settings);
  else state.version=asLower(version,'esv');
  settings.defaultBibleVersion=state.version;
  call(ctx.persistSettings);
  call(ctx.persistRouteMemory);
  call(ctx.loadBibleData,true);
  call(ctx.renderSettings);
  call(ctx.closeVersionPicker);
  return state;
}
function copyBibleVerse(ctx,verseNumber,text){
  ctx=ctx||{};
  var state=ctx.bibleState||call(ctx.getBibleState)||{};
  var ref=(state.book||'')+' '+(state.chapter||'')+':'+(verseNumber||'');
  call(ctx.copyBibleVerse,ref,text||'');
  return ref+' - '+String(text||'');
}

function makeToolsActionAdapters(ctx){
  ctx=ctx||{};
  return {
    setNnsKey:function(v){setChordKey(ctx.chordState,v);call(ctx.renderChordNns)},
    setNnsMode:function(v){setChordMode(ctx.chordState,v);call(ctx.renderChordNns)},
    setNnsTransposeTarget:function(v){setChordTransposeTarget(ctx.chordState,v);call(ctx.updateNnsConversion)},
    updateNnsConversion:function(){call(ctx.updateNnsConversion)},
    applyNnsExample:function(v){applyNnsExample({document:ctx.document,updateConversion:ctx.updateNnsConversion},v)},
    copyNnsResult:function(){copyNnsResult({chordState:ctx.chordState,showToast:ctx.showToast})},
    setNnsRoot:function(v){setChordRoot(ctx.chordState,v);call(ctx.renderNnsDiagram)},
    setNnsQuality:function(v){setChordQuality(ctx.chordState,v);call(ctx.renderNnsDiagram)},
    setNnsVariation:function(v){setChordVariation(ctx.chordState,v);call(ctx.renderNnsDiagram)},
    setPadType:function(v){ctx.setPadState(setPadTypeState(ctx.getPadState(),v,ctx.keys,ctx.types));call(ctx.initPads)},
    setPadKey:function(v){ctx.setPadState(setPadKeyState(ctx.getPadState(),v,ctx.keys,ctx.types));call(ctx.initPads)},
    playPad:function(){playPad({getPadState:ctx.getPadState,setPadState:ctx.setPadState,keys:ctx.keys,types:ctx.types,renderStatus:ctx.updatePadStatus,showToast:ctx.showToast})},
    stopPad:function(){stopPad({getPadState:ctx.getPadState,setPadState:ctx.setPadState,keys:ctx.keys,types:ctx.types,renderStatus:ctx.updatePadStatus})}
  };
}

function diagnostics(){
  return {phase:'Phase 2b - H1',owner:'WBToolsStateActionController',actionContract:['normaliseChordState','setChordKey','setChordMode','setChordTransposeTarget','setChordRoot','setChordQuality','setChordVariation','applyNnsExample','copyNnsResult','normalisePadState','setPadTypeState','setPadKeyState','playPad','stopPad','setBibleBook','setBibleChapter','changeBibleChapter','setBibleVersion','copyBibleVerse','makeToolsActionAdapters'],nonDestructive:true,legacyShellHost:true};
}

root.WBToolsStateActionController={
  normaliseChordState:normaliseChordState,
  setChordKey:setChordKey,
  setChordMode:setChordMode,
  setChordTransposeTarget:setChordTransposeTarget,
  setChordRoot:setChordRoot,
  setChordQuality:setChordQuality,
  setChordVariation:setChordVariation,
  applyNnsExample:applyNnsExample,
  copyNnsResult:copyNnsResult,
  normalisePadState:normalisePadState,
  setPadTypeState:setPadTypeState,
  setPadKeyState:setPadKeyState,
  setPadPlayingState:setPadPlayingState,
  playPad:playPad,
  stopPad:stopPad,
  setBibleBook:setBibleBook,
  setBibleChapter:setBibleChapter,
  changeBibleChapter:changeBibleChapter,
  setBibleVersion:setBibleVersion,
  copyBibleVerse:copyBibleVerse,
  makeToolsActionAdapters:makeToolsActionAdapters,
  diagnostics:diagnostics,
  actionContract:['normaliseChordState','setChordKey','setChordMode','setChordTransposeTarget','setChordRoot','setChordQuality','setChordVariation','applyNnsExample','copyNnsResult','normalisePadState','setPadTypeState','setPadKeyState','playPad','stopPad','setBibleBook','setBibleChapter','changeBibleChapter','setBibleVersion','copyBibleVerse','makeToolsActionAdapters']
};
})(window);
