/* WorshipBase Phase I.3 add-to-set and song-view context contract owner.
   Owns destination-picker defaults, deprecated add-to-set setting behaviour,
   and cross-context song-view mode hierarchy helpers.
   DOM rendering remains in the legacy shell for now. */
(function(root){
'use strict';

var VALID_MODES={lyrics:true,chords:true,nns:true};
var VALID_ORIGINS={library:true,setlist:true,'workspace-set':true};

function normalizeMode(mode,fallback){
  mode=String(mode||'').trim();
  fallback=String(fallback||'chords').trim();
  if(!VALID_MODES[fallback])fallback='chords';
  return VALID_MODES[mode]?mode:fallback;
}
function normalizeOrigin(origin){
  origin=String(origin||'').trim();
  if(origin==='songs'||origin==='song'||origin==='library')return 'library';
  if(origin==='setlist'||origin==='personal-set'||origin==='personal')return 'setlist';
  if(origin==='workspace'||origin==='workspace-set'||origin==='workspace-setlist')return 'workspace-set';
  return 'library';
}
function defaultMode(settings){return normalizeMode(settings&&settings.defaultSongView,'chords');}
function defaultFocus(origin){origin=normalizeOrigin(origin);return origin==='setlist'||origin==='workspace-set';}
function ensureMemoryBag(state){
  state=state||{};
  state.songViewMemory=state.songViewMemory&&typeof state.songViewMemory==='object'?state.songViewMemory:{};
  return state.songViewMemory;
}
function ensureContextMemory(state,settings,origin){
  origin=normalizeOrigin(origin);
  var bag=ensureMemoryBag(state),fallback=defaultMode(settings);
  if(!bag[origin]||typeof bag[origin]!=='object')bag[origin]={mode:fallback,focus:defaultFocus(origin)};
  bag[origin].mode=normalizeMode(bag[origin].mode,fallback);
  if(typeof bag[origin].focus!=='boolean')bag[origin].focus=defaultFocus(origin);
  return bag[origin];
}
function shouldPreserveModeForOpen(origin,reason,state){
  origin=normalizeOrigin(origin);
  reason=String(reason||'').trim();
  var preserveOrigin=state&&state.preserveSongViewModeOriginOnce?normalizeOrigin(state.preserveSongViewModeOriginOnce):null;
  if(preserveOrigin===origin)return true;
  if(origin==='library'&&state&&state.preserveLibrarySongViewModeOnce)return true;
  return reason==='adjacent-song';
}
function applyOpenMode(state,settings,origin,reason){
  origin=normalizeOrigin(origin);
  var fallback=defaultMode(settings),mem=ensureContextMemory(state,settings,origin);
  var preserve=shouldPreserveModeForOpen(origin,reason,state);
  if(origin==='library'){
    state.mode=preserve?normalizeMode(mem.mode,fallback):fallback;
    state.focusMode=false;
    state.preserveLibrarySongViewModeOnce=false;
  }else{
    state.mode=preserve?normalizeMode(mem.mode,fallback):fallback;
    state.focusMode=preserve&&typeof mem.focus==='boolean'?mem.focus:defaultFocus(origin);
  }
  if(preserve)state.preserveSongViewModeOriginOnce=null;
  return {origin:origin,mode:state.mode,focusMode:!!state.focusMode,memory:mem,preserve:preserve};
}
function rememberMode(state,settings,origin,mode,focus){
  origin=normalizeOrigin(origin||(state&&state.lastSongOrigin)||'library');
  var mem=ensureContextMemory(state,settings,origin);
  mem.mode=normalizeMode(mode||(state&&state.mode),defaultMode(settings));
  if(typeof focus==='boolean')mem.focus=focus;
  else if(state&&typeof state.focusMode==='boolean')mem.focus=!!state.focusMode;
  return mem;
}
function markAdjacentNavigation(state,origin){
  origin=normalizeOrigin(origin||(state&&state.lastSongOrigin)||'library');
  if(state){
    state.preserveSongViewModeOriginOnce=origin;
    if(origin==='library')state.preserveLibrarySongViewModeOnce=true;
  }
  return origin;
}
function destinationScopeForContext(context){
  context=context||{};
  return context.scope==='workspace'?'workspace':'personal';
}
function destinationTitle(){return 'Add to set list';}
function destinationDoneLabel(){return 'Done';}
function deprecatedSettingsKeys(){return ['addToSetBehavior'];}
function normalizeSettings(settings){
  settings=settings||{};
  if(settings.addToSetBehavior&&settings.addToSetBehavior!=='ask')settings.addToSetBehavior='ask';
  return settings;
}
function hierarchyDescription(){
  return [
    'Fresh song opens in Library, Set List, and Workspace use Settings defaultSongView.',
    'Library fresh opens use normal page mode.',
    'Set List and Workspace fresh opens use their performance/focus default until the user changes it.',
    'Adjacent next/previous song navigation preserves the current Lyrics/Chords/NNS mode and focus state within that context only.',
    'Add-to-set always asks for a destination; the old automatic active-set setting is deprecated.'
  ];
}

root.WBAddToSetController={
  normalizeMode:normalizeMode,
  normalizeOrigin:normalizeOrigin,
  defaultMode:defaultMode,
  defaultFocus:defaultFocus,
  ensureContextMemory:ensureContextMemory,
  shouldPreserveModeForOpen:shouldPreserveModeForOpen,
  applyOpenMode:applyOpenMode,
  rememberMode:rememberMode,
  markAdjacentNavigation:markAdjacentNavigation,
  destinationScopeForContext:destinationScopeForContext,
  destinationTitle:destinationTitle,
  destinationDoneLabel:destinationDoneLabel,
  deprecatedSettingsKeys:deprecatedSettingsKeys,
  normalizeSettings:normalizeSettings,
  hierarchyDescription:hierarchyDescription
};
})(window);
