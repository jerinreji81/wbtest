/* WorshipBase Phase 2b - D1 data model service owner.
   Source of truth for non-destructive data shape normalisation across songs,
   personal sets, workspace sets, workspace profile/state, settings snapshots,
   and backup/export-safe model diagnostics.

   Phase 2b rule: this service preserves unknown fields. It must not narrow future
   models such as section filters, usage events, attachments, permissions, themes,
   or workspace metadata to only the fields known today. */
(function(root){
'use strict';

function constants(){return root.WBConstants||{};}
function defaults(){return constants().DEFAULT_SETTINGS||{};}
function clone(value,fallback){try{return JSON.parse(JSON.stringify(value));}catch(e){return fallback===undefined?value:fallback;}}
function asArray(value){return Array.isArray(value)?value:[];}
function asObject(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function text(value,fallback){
  value=String(value==null?'':value).trim();
  fallback=String(fallback==null?'':fallback).trim();
  return value||fallback||'';
}
function nowIso(){try{return new Date().toISOString();}catch(e){return '';}}
function nowLabel(){return 'Updated now';}
function makeId(prefix){return String(prefix||'id')+'-'+Date.now();}
function normaliseKeyValue(value,fallback){
  var util=root.WBUtils||{};
  var out=util.normalizeKeyName?util.normalizeKeyName(value||fallback||''):String(value||fallback||'').trim();
  return out||fallback||'original';
}
function knownSource(scope,source){
  if(source)return source;
  if(scope==='workspace')return 'Workspace';
  if(scope==='personal')return 'Personal';
  return '';
}

function normalizeSong(raw,options){
  options=options||{};
  raw=asObject(raw);
  var out=Object.assign({},raw);
  out.id=text(out.id||options.id,makeId('song'));
  out.title=text(out.title||out.name||out.songTitle,options.fallbackTitle||'Untitled song');
  if(out.name&&!out.title)out.title=out.name;
  out.artist=text(out.artist||out.author||out.writer,'');
  if(out.artist&&!out.author)out.author=out.artist;
  out.key=normaliseKeyValue(out.key||out.songKey||out.defaultKey,options.defaultKey||'C');
  if(out.originalKey)out.originalKey=normaliseKeyValue(out.originalKey,out.key);
  out.source=out.source||options.source||'';
  if(out.importId!=null)out.importId=String(out.importId);
  if(out.id!=null)out.id=String(out.id);
  if(out.favorite==null)out.favorite=false;
  return out;
}

function normalizeSongArray(list,options){
  options=options||{};
  return asArray(list).map(function(song,idx){return normalizeSong(song,Object.assign({},options,{id:song&&song.id||options.idPrefix&&String(options.idPrefix)+'-'+idx}));});
}

function normalizeSetItem(item,index){
  index=index||0;
  if(typeof item==='string'||typeof item==='number')return {type:'song',songId:String(item),order:index};
  if(!item||typeof item!=='object')return null;
  var out=Object.assign({},item);
  if(!out.type&&out.songId)out.type='song';
  if(!out.type)out.type='item';
  if(out.type==='song'){
    out.songId=String(out.songId||out.id||'');
    if(!out.songId)return null;
  }
  if(out.type==='section'){
    if(out.title&&!out.label)out.label=out.title;
    if(out.label&&!out.title)out.title=out.label;
    out.label=text(out.label||out.title,'SECTION').toUpperCase();
    out.title=text(out.title||out.label,out.label).toUpperCase();
  }
  if(out.type==='item'){
    out.title=text(out.title||out.label,'Service item');
    if(out.note&&!out.sub)out.sub=out.note;
    if(out.sub&&!out.note)out.note=out.sub;
  }
  if(out.key==='follow-set'||out.key==='follow')delete out.key;
  return out;
}

function normalizeSetItems(set){
  set=asObject(set);
  var items=Array.isArray(set.items)?set.items.slice():[];
  if(!items.length){
    asArray(set.entries).forEach(function(id){items.push({type:'song',songId:String(id)});});
    asArray(set.textItems).forEach(function(item){if(item)items.push(item);});
  }
  return items.map(normalizeSetItem).filter(Boolean);
}

function hasSetNotes(set){
  set=asObject(set);
  if(String(set.setNotes||'').trim())return true;
  var notes=asObject(set.songNotes),cues=asObject(set.songCues);
  return Object.keys(notes).some(function(id){return String(notes[id]||'').trim();})||
         Object.keys(cues).some(function(id){return String(cues[id]||'').trim();});
}

function syncSetCounts(set){
  if(!set||typeof set!=='object')return set;
  set.items=normalizeSetItems(set);
  set.entries=set.items.filter(function(item){return item&&item.type==='song';}).map(function(item){return item.songId;});
  set.textItems=set.items.filter(function(item){return item&&item.type!=='song';});
  set.songCount=set.entries.length;
  set.itemCount=set.textItems.length;
  set.notes=hasSetNotes(set);
  if(!set.updated)set.updated=nowLabel();
  return set;
}

function normalizeSet(raw,options){
  options=options||{};
  raw=asObject(raw);
  var out=Object.assign({},raw);
  out.id=text(out.id||options.id,makeId(options.scope==='workspace'?'ws':'set'));
  out.name=text(out.name||out.title,options.scope==='workspace'?'Workspace set':'Set list');
  out.source=knownSource(options.scope,out.source);
  out.setKey=normaliseKeyValue(out.setKey||out.defaultKey,options.defaultSetKey||'original');
  out.setNotes=String(out.setNotes||'');
  out.songNotes=asObject(out.songNotes);
  out.songCues=asObject(out.songCues);
  return syncSetCounts(out);
}

function normalizeSetArray(list,options){
  options=options||{};
  return asArray(list).map(function(set,idx){return normalizeSet(set,Object.assign({},options,{id:set&&set.id||undefined,index:idx}));});
}

function normalizeWorkspaceProfile(profile){
  profile=asObject(profile);
  return Object.assign({
    name:'Workspace',
    description:'Team planning and shared sets',
    inviteCode:'WB-TEAM-042'
  },profile);
}

function normalizeWorkspaceState(workspace){
  workspace=asObject(workspace);
  var out=Object.assign({},workspace);
  out.profile=normalizeWorkspaceProfile(out.profile||out.meta||{});
  out.sets=normalizeSetArray(out.sets,{scope:'workspace'});
  if(!out.activeSetId&&out.sets[0])out.activeSetId=out.sets[0].id;
  return out;
}

function normalizeSettings(settings){
  var out=Object.assign({},defaults(),asObject(settings));
  if(out.addToSetBehavior&&out.addToSetBehavior!=='ask')out.addToSetBehavior='ask';
  if(!out.defaultDisplayKey)out.defaultDisplayKey='original';
  if(!out.defaultSongView)out.defaultSongView='chords';
  if(!out.defaultPdfPreset)out.defaultPdfPreset='rehearsal';
  return out;
}

function normalizeSongMemory(memory){
  var src=asObject(memory),out={};
  Object.keys(src).forEach(function(id){
    var item=asObject(src[id]);
    out[String(id)]=Object.assign({},item);
  });
  return out;
}

function normalizeAppDataSnapshot(snapshot){
  snapshot=asObject(snapshot);
  var out=Object.assign({},snapshot);
  out.songs=normalizeSongArray(out.songs||out.localSongs||[]);
  out.sets=normalizeSetArray(out.sets||out.personalSets||[],{scope:'personal'});
  out.workspace=normalizeWorkspaceState(out.workspace||out.workspaceState||{});
  out.settings=normalizeSettings(out.settings||{});
  out.songMemory=normalizeSongMemory(out.songMemory||{});
  out.schemaVersion=out.schemaVersion||1;
  out.normalizedAt=out.normalizedAt||nowIso();
  return out;
}

function modelDiagnostics(snapshot){
  snapshot=normalizeAppDataSnapshot(snapshot||{});
  return {
    songs:snapshot.songs.length,
    personalSets:snapshot.sets.length,
    workspaceSets:snapshot.workspace&&snapshot.workspace.sets?snapshot.workspace.sets.length:0,
    settingsKeys:Object.keys(snapshot.settings||{}).length,
    songMemoryEntries:Object.keys(snapshot.songMemory||{}).length,
    hasWorkspaceProfile:!!(snapshot.workspace&&snapshot.workspace.profile),
    contract:modelContract()
  };
}

function modelContract(){
  return [
    'preserve unknown fields on songs, sets, set items, workspace state, and settings',
    'normalise shape without changing visible behaviour unless a caller explicitly mutates data',
    'do not flatten future set item fields such as sections, lineSnippet, usageEventId, or mergedFrom',
    'personal and workspace sets must use the same canonical set shape',
    'backup/export/import pipelines should consume normalized snapshots instead of ad-hoc legacy shapes'
  ];
}

root.WBDataModel={
  clone:clone,
  asArray:asArray,
  asObject:asObject,
  text:text,
  normalizeSong:normalizeSong,
  normalizeSongArray:normalizeSongArray,
  normalizeSetItem:normalizeSetItem,
  normalizeSetItems:normalizeSetItems,
  hasSetNotes:hasSetNotes,
  syncSetCounts:syncSetCounts,
  normalizeSet:normalizeSet,
  normalizeSetArray:normalizeSetArray,
  normalizeWorkspaceProfile:normalizeWorkspaceProfile,
  normalizeWorkspaceState:normalizeWorkspaceState,
  normalizeSettings:normalizeSettings,
  normalizeSongMemory:normalizeSongMemory,
  normalizeAppDataSnapshot:normalizeAppDataSnapshot,
  modelDiagnostics:modelDiagnostics,
  modelContract:modelContract
};
})(window);
