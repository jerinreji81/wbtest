/* WorshipBase Phase H.2 song view state/controller owner.
   Owns song-open state transitions, per-origin view memory, and song context entry traversal.
   DOM rendering remains in the legacy shell for now. */
(function(root){
'use strict';

var VALID_MODES={lyrics:true,chords:true,nns:true};

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
  if(origin==='workspace-set'||origin==='workspace'||origin==='workspace-setlist')return 'workspace-set';
  return 'library';
}

function defaultMode(settings){
  return normalizeMode(settings&&settings.defaultSongView,'chords');
}

function defaultFocusForOrigin(origin){
  origin=normalizeOrigin(origin);
  return origin==='setlist'||origin==='workspace-set';
}

function ensureState(appState){
  appState=appState||{};
  appState.songViewMemory=appState.songViewMemory&&typeof appState.songViewMemory==='object'?appState.songViewMemory:{};
  if(!appState.lastSongOrigin)appState.lastSongOrigin='library';
  return appState;
}

function ensureMemory(appState,settings,origin){
  appState=ensureState(appState);
  origin=normalizeOrigin(origin||appState.lastSongOrigin||'library');
  var fallbackMode=defaultMode(settings);
  if(!appState.songViewMemory[origin]||typeof appState.songViewMemory[origin]!=='object'){
    appState.songViewMemory[origin]={mode:fallbackMode,focus:defaultFocusForOrigin(origin)};
  }
  appState.songViewMemory[origin].mode=normalizeMode(appState.songViewMemory[origin].mode,fallbackMode);
  if(typeof appState.songViewMemory[origin].focus!=='boolean')appState.songViewMemory[origin].focus=defaultFocusForOrigin(origin);
  return appState.songViewMemory[origin];
}

function rememberCurrent(appState,settings,origin){
  appState=ensureState(appState);
  origin=normalizeOrigin(origin||appState.lastSongOrigin||'library');
  var mem=ensureMemory(appState,settings,origin);
  mem.mode=normalizeMode(appState.mode,defaultMode(settings));
  mem.focus=!!appState.focusMode;
  return mem;
}

function beginOpen(options){
  options=options||{};
  var appState=ensureState(options.state||{});
  var settings=options.settings||{};
  var song=options.song||{};
  var origin=normalizeOrigin(options.origin||appState.tab||'library');
  var context=options.context||null;
  var fromSet=origin==='setlist'||origin==='workspace-set'||!!(context&&context.scope);
  var mem=ensureMemory(appState,settings,origin);
  appState.selectedId=song.id;
  appState.songContext=context;
  appState.displayKey=typeof options.resolveKey==='function'?options.resolveKey(song,context):(song.key||'C');
  appState.lastSongOrigin=origin;
  if(origin==='library'){
    var preserveLibraryMode=!!appState.preserveLibrarySongViewModeOnce;
    appState.mode=preserveLibraryMode?normalizeMode(mem.mode,defaultMode(settings)):defaultMode(settings);
    appState.focusMode=false;
    appState.preserveLibrarySongViewModeOnce=false;
  }else{
    appState.mode=normalizeMode(mem.mode,defaultMode(settings));
    appState.focusMode=(typeof mem.focus==='boolean')?mem.focus:!!fromSet;
  }
  return {
    origin:origin,
    context:context,
    fromSet:fromSet,
    mode:appState.mode,
    focusMode:!!appState.focusMode,
    displayKey:appState.displayKey,
    memory:mem
  };
}

function closeOpenState(appState){
  appState=ensureState(appState);
  appState.songContext=null;
  return appState;
}

function setMode(appState,settings,mode){
  appState=ensureState(appState);
  appState.mode=normalizeMode(mode,defaultMode(settings));
  rememberCurrent(appState,settings,appState.lastSongOrigin||'library');
  return appState.mode;
}

function setFocus(appState,settings,on){
  appState=ensureState(appState);
  appState.focusMode=on==null?!appState.focusMode:!!on;
  rememberCurrent(appState,settings,appState.lastSongOrigin||'library');
  return !!appState.focusMode;
}

function entriesFromSet(set,songs,scope){
  var out=[];
  var list=Array.isArray(songs)?songs:[];
  if(!set||!Array.isArray(set.items))return out;
  set.items.forEach(function(item,idx){
    if(!item||item.type!=='song')return;
    var song=list.find(function(x){return x&&x.id===item.songId});
    if(song)out.push({song:song,context:{scope:scope,setId:set.id,index:idx,item:item}});
  });
  return out;
}

function entriesForOrigin(options){
  options=options||{};
  var appState=ensureState(options.state||{});
  var origin=normalizeOrigin(options.origin||appState.lastSongOrigin||'library');
  var ctx=options.context||appState.songContext||null;
  var songs=Array.isArray(options.songs)?options.songs:[];
  if(origin==='setlist'){
    var personalSet=(typeof options.findSet==='function'?options.findSet(ctx):null)||(typeof options.currentSet==='function'?options.currentSet():null);
    if(typeof options.ensureSetShape==='function'&&personalSet)personalSet=options.ensureSetShape(personalSet);
    return entriesFromSet(personalSet,songs,'personal');
  }
  if(origin==='workspace-set'){
    var workspaceSet=(typeof options.findSet==='function'?options.findSet(ctx):null)||(typeof options.activeWorkspaceSet==='function'?options.activeWorkspaceSet():null);
    return entriesFromSet(workspaceSet,songs,'workspace');
  }
  if(typeof options.orderedVisibleSongs==='function'){
    return (options.orderedVisibleSongs()||[]).map(function(song){return {song:song,context:null};});
  }
  return songs.map(function(song){return {song:song,context:null};});
}

function currentEntryIndex(entries,ctx,selectedId){
  ctx=ctx||null;
  entries=Array.isArray(entries)?entries:[];
  if(!entries.length)return -1;
  var wantedIndex=ctx&&typeof ctx.index==='number'?ctx.index:null;
  var wantedSet=ctx&&ctx.setId||null;
  for(var i=0;i<entries.length;i++){
    var entry=entries[i],entryCtx=entry&&entry.context||null;
    if(!entry||!entry.song||entry.song.id!==selectedId)continue;
    if(wantedIndex!=null&&entryCtx&&entryCtx.index===wantedIndex&&(wantedSet==null||entryCtx.setId===wantedSet))return i;
    if(wantedIndex==null)return i;
  }
  return entries.findIndex(function(entry){return entry&&entry.song&&entry.song.id===selectedId;});
}

function hierarchyDescription(){
  return [
    'fresh library opens use user default mode and normal page mode',
    'library adjacent song navigation preserves the current library Lyrics/Chords/NNS mode for that traversal',
    'setlist context memory is separate from library and workspace',
    'workspace-set context memory is separate from library and personal setlist',
    'context memory wins while swiping through songs in that context; otherwise settings.defaultSongView is used'
  ];
}

root.WBSongViewController={
  validModes:Object.keys(VALID_MODES),
  normalizeMode:normalizeMode,
  normalizeOrigin:normalizeOrigin,
  defaultMode:defaultMode,
  defaultFocusForOrigin:defaultFocusForOrigin,
  ensureMemory:ensureMemory,
  rememberCurrent:rememberCurrent,
  beginOpen:beginOpen,
  closeOpenState:closeOpenState,
  setMode:setMode,
  setFocus:setFocus,
  entriesForOrigin:entriesForOrigin,
  currentEntryIndex:currentEntryIndex,
  hierarchyDescription:hierarchyDescription
};
})(window);
