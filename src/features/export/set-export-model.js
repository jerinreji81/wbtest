/* WorshipBase Phase 2b - D2 set key and export model owner.
   Source of truth for set/song/app/original key hierarchy and for the song list
   model consumed by export preview/PDF/share flows.

   Phase 2b rule: callers may pass personal/workspace state adapters, but key
   resolution and export pair construction must go through this owner instead of
   recreating the hierarchy inside page renderers or PDF code. */
(function(root){
'use strict';

function constants(){return root.WBConstants||{};}
function utils(){return root.WBUtils||{};}
function data(){return root.WBDataModel||{};}
function clone(value,fallback){if(data().clone)return data().clone(value,fallback);try{return JSON.parse(JSON.stringify(value));}catch(e){return fallback===undefined?value:fallback;}}
function asArray(value){return Array.isArray(value)?value:[];}
function asObject(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function normalizeKeyName(value){var u=utils();return u.normalizeKeyName?u.normalizeKeyName(value):String(value||'').trim();}
function isValidMusicKey(value){var u=utils();if(u.isValidMusicKey)return u.isValidMusicKey(value);var notes=(constants().NOTES||['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']);var root=String(value||'').replace(/m$/,'');return notes.indexOf(root)>=0;}
function normaliseLegacyChoiceWord(value){
  var raw=String(value==null?'':value).trim();
  var low=raw.toLowerCase().replace(/[_\s-]+/g,'-');
  if(!raw)return 'original';
  if(low==='inherit'||low==='follow'||low==='follow-set'||low==='follow-default'||low==='follow-set-default')return 'inherit';
  if(low==='default'||low==='app'||low==='app-default'||low==='settings'||low==='settings-default')return 'default';
  if(low==='original'||low==='song-original'||low==='song-key'||low==='stored')return 'original';
  return '';
}
function normalizeKeyChoice(value){
  var special=normaliseLegacyChoiceWord(value);
  if(special)return special;
  var normalized=normalizeKeyName(value);
  special=normaliseLegacyChoiceWord(normalized);
  if(special)return special;
  return isValidMusicKey(normalized)?normalized:'original';
}
function itemHasExplicitKey(item){
  item=asObject(item);
  return !!(item.keyOverride===true&&item.setKey&&normalizeKeyChoice(item.setKey)!=='inherit');
}
function songOriginalKey(song,fallback){
  song=asObject(song);
  return normalizeKeyChoice(song.key||song.originalKey||fallback||'C');
}
function firstSongKey(set,env){
  set=asObject(set);env=env||{};
  var list=asArray(env.songs||env.songList);
  var items=asArray(set.items);
  for(var i=0;i<items.length;i++){
    var it=items[i];
    if(it&&it.type==='song'){
      var song=list.find(function(s){return s&&String(s.id)===String(it.songId);});
      if(song&&song.key)return song.key;
    }
  }
  return 'G';
}
function appDefaultChoice(settings){
  settings=asObject(settings);
  return normalizeKeyChoice(settings.defaultDisplayKey||'original');
}
function defaultKeyFor(song,set,env){
  env=env||{};
  var appChoice=appDefaultChoice(env.settings||{});
  if(appChoice&&appChoice!=='original'&&appChoice!=='inherit'&&appChoice!=='default')return appChoice;
  return songOriginalKey(song,firstSongKey(set,env)||'G');
}
function resolveChoiceKey(choice,song,set,env){
  env=env||{};
  choice=normalizeKeyChoice(choice);
  if(choice==='inherit')return resolveSetKey(set,song,env);
  if(choice==='default')return defaultKeyFor(song,set,env);
  if(choice==='original')return songOriginalKey(song,firstSongKey(set,env)||'G');
  return choice;
}
function resolveSetKey(set,song,env){
  env=env||{};
  set=asObject(set);
  if(!set||!Object.keys(set).length)return defaultKeyFor(song,null,env);
  var choice=normalizeKeyChoice(set.setKey||set.defaultKey||'original');
  if(choice==='original'||choice==='default')return defaultKeyFor(song,set,env);
  return resolveChoiceKey(choice,song,set,env);
}
function resolveSetItemChoice(set,item){
  if(itemHasExplicitKey(item))return normalizeKeyChoice(item.setKey);
  set=asObject(set);
  return normalizeKeyChoice(set.setKey||set.defaultKey||'original');
}
function resolveSetItemKey(set,item,song,env){
  env=env||{};
  if(itemHasExplicitKey(item))return resolveChoiceKey(item.setKey,song,set,env);
  return resolveSetKey(set,song,env);
}
function findSetById(list,id){
  id=String(id||'');
  return asArray(list).find(function(set){return set&&String(set.id)===id;})||null;
}
function resolveContextSet(ctx,env){
  ctx=ctx||{};env=env||{};
  if(ctx.scope==='workspace')return findSetById(env.workspaceSets,ctx.setId)||env.activeWorkspaceSet||null;
  if(ctx.scope==='personal')return findSetById(env.personalSets,ctx.setId)||env.activePersonalSet||null;
  if(ctx.setId)return findSetById(env.personalSets,ctx.setId)||findSetById(env.workspaceSets,ctx.setId)||null;
  return null;
}
function resolveContextItem(set,ctx){
  ctx=ctx||{};set=asObject(set);
  if(ctx.item)return ctx.item;
  if(typeof ctx.index==='number'&&asArray(set.items)[ctx.index])return asArray(set.items)[ctx.index];
  return null;
}
function resolveEffectiveKeyForSong(song,ctx,env){
  ctx=ctx||null;env=env||{};
  var set=resolveContextSet(ctx,env),item=resolveContextItem(set,ctx||{});
  return set?resolveSetItemKey(set,item,song,env):defaultKeyFor(song,null,env);
}
function setKeyLabel(set,env){
  set=asObject(set);
  var choice=normalizeKeyChoice(set.setKey||set.defaultKey||'original');
  if(choice==='default')return 'App key';
  if(choice==='original')return 'Original';
  return 'Key '+resolveSetKey(set,null,env||{});
}
function songById(songs,id){
  id=String(id||'');
  return asArray(songs).find(function(song){return song&&String(song.id)===id;})||null;
}
function buildSetExportItems(subject,env){
  subject=asObject(subject);env=env||{};
  var songs=asArray(env.songs||env.songList);
  if(subject.kind==='song'){
    return subject.song?[makeExportPair(subject.song,null,subject,env)]:[];
  }
  var set=asObject(subject.set);
  return asArray(set.items).filter(function(item){return item&&item.type==='song';}).map(function(item,index){
    var song=songById(songs,item.songId);
    return song?makeExportPair(song,item,subject,env,index):null;
  }).filter(Boolean);
}
function makeExportPair(song,item,subject,env,index){
  subject=asObject(subject);env=env||{};
  var set=subject.set||null;
  var scope=subject.kind==='workspace-set'?'workspace':(subject.kind==='set'?'personal':null);
  var ctx=scope?{scope:scope,setId:set&&set.id,item:item,index:index}:null;
  var resolvedKey=ctx?resolveEffectiveKeyForSong(song,ctx,Object.assign({},env,{activePersonalSet:scope==='personal'?set:env.activePersonalSet,activeWorkspaceSet:scope==='workspace'?set:env.activeWorkspaceSet})):defaultKeyFor(song,null,env);
  return {
    song:song,
    item:item||null,
    scope:scope,
    setId:set&&set.id||null,
    index:typeof index==='number'?index:null,
    resolvedKey:resolvedKey,
    originalKey:songOriginalKey(song,'C'),
    itemChoice:item?resolveSetItemChoice(set,item):null,
    setChoice:set?normalizeKeyChoice(set.setKey||'original'):null
  };
}
function buildSetExportModel(subject,env){
  subject=asObject(subject);env=env||{};
  var items=buildSetExportItems(subject,env);
  return {
    kind:subject.kind||'set',
    title:subject.title||((subject.set&&subject.set.name)||((subject.song&&subject.song.title)||'WorshipBase export')),
    meta:subject.meta||'',
    set:subject.set||null,
    song:subject.song||null,
    items:items,
    songCount:items.length,
    keyHierarchy:keyHierarchy(),
    builtAt:new Date().toISOString()
  };
}
function exportPreviewLines(subject,env){
  subject=asObject(subject);env=env||{};
  if((subject.kind==='set'||subject.kind==='workspace-set')&&subject.set){
    var pairs=buildSetExportItems(subject,env),byItem=new Map();
    pairs.forEach(function(pair){if(pair.item)byItem.set(pair.item,pair);});
    var lines=[];
    asArray(subject.set.items).slice(0,16).forEach(function(it){
      if(it.type==='section')lines.push(String(it.label||it.title||'SECTION').toUpperCase());
      else if(it.type==='song'){
        var pair=byItem.get(it),s=pair&&pair.song||songById(env.songs,it.songId);
        if(s)lines.push('• '+(s.title||'Untitled')+' — '+(s.artist||s.author||'')+' ['+(pair&&pair.resolvedKey||resolveSetItemKey(subject.set,it,s,env))+']');
      }else lines.push('• '+(it.title||'Service item')+(it.sub||it.note?' — '+(it.sub||it.note):''));
    });
    return lines.join('\n')||'Empty set list';
  }
  if(subject.song){
    var chart=String(subject.song.chart||'');
    return chart.replace(/\[[^\]]+\]/g,'').slice(0,560)||'No chart text yet';
  }
  return 'Nothing to export';
}
function keyHierarchy(){
  return [
    'individual song item key override',
    'set default key choice',
    'app default display key when selected or needed as fallback',
    'song original/stored key'
  ];
}
function diagnostics(){
  return {
    owner:'WBSetExportModel',
    phase:'Phase 2b - D2',
    keyHierarchy:keyHierarchy(),
    functions:['normalizeKeyChoice','resolveSetItemKey','resolveEffectiveKeyForSong','buildSetExportModel','buildSetExportItems','exportPreviewLines'],
    nonDestructive:true
  };
}

root.WBSetExportModel={
  normalizeKeyChoice:normalizeKeyChoice,
  itemHasExplicitKey:itemHasExplicitKey,
  firstSongKey:firstSongKey,
  appDefaultChoice:appDefaultChoice,
  defaultKeyFor:defaultKeyFor,
  resolveChoiceKey:resolveChoiceKey,
  resolveSetKey:resolveSetKey,
  resolveSetItemChoice:resolveSetItemChoice,
  resolveSetItemKey:resolveSetItemKey,
  resolveEffectiveKeyForSong:resolveEffectiveKeyForSong,
  setKeyLabel:setKeyLabel,
  buildSetExportItems:buildSetExportItems,
  buildSetExportModel:buildSetExportModel,
  exportPreviewLines:exportPreviewLines,
  keyHierarchy:keyHierarchy,
  diagnostics:diagnostics,
  clone:clone
};
})(window);
