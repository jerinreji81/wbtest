/* WorshipBase Phase I.1 personal set-list controller owner.
   Owns personal set shape, counts, item mutation helpers, and set CRUD primitives.
   DOM rendering, workspace sets, Firebase sync, PDF export, and attached song PDF workflows remain untouched. */
(function(root){
'use strict';

function asArray(value){return Array.isArray(value)?value:[];}
function nowLabel(){return 'Updated now';}
function makeId(prefix){return String(prefix||'set')+'-'+Date.now();}
function normalizeText(value,fallback){
  value=String(value==null?'':value).trim();
  fallback=String(fallback==null?'':fallback).trim();
  return value||fallback||'';
}

function ensureSetShape(set){
  if(!set)return set;
  set.entries=asArray(set.entries);
  set.textItems=asArray(set.textItems);
  if(!Array.isArray(set.items)){
    set.items=[];
    set.entries.forEach(function(id){set.items.push({type:'song',songId:String(id)});});
    set.textItems.forEach(function(item){if(item)set.items.push(item);});
  }
  set.items=asArray(set.items).map(function(item,idx){
    if(typeof item==='string'||typeof item==='number')return {type:'song',songId:String(item),order:idx};
    if(!item||typeof item!=='object')return null;
    if(!item.type&&item.songId)item.type='song';
    if(item.type==='section'){
      if(item.title&&!item.label)item.label=item.title;
      if(item.label&&!item.title)item.title=item.label;
    }
    return item;
  }).filter(Boolean);
  set.songNotes=set.songNotes&&typeof set.songNotes==='object'?set.songNotes:{};
  set.songCues=set.songCues&&typeof set.songCues==='object'?set.songCues:{};
  set.setNotes=String(set.setNotes||'');
  set.setKey=set.setKey||'original';
  return set;
}

function setHasNotes(set){
  set=ensureSetShape(set);
  if(!set)return false;
  if(String(set.setNotes||'').trim())return true;
  var notes=set.songNotes||{},cues=set.songCues||{};
  return Object.keys(notes).some(function(key){return String(notes[key]||'').trim();})||
         Object.keys(cues).some(function(key){return String(cues[key]||'').trim();});
}

function syncCounts(set){
  set=ensureSetShape(set);
  if(!set)return set;
  set.entries=set.items.filter(function(item){return item&&item.type==='song';}).map(function(item){return item.songId;});
  set.textItems=set.items.filter(function(item){return item&&item.type!=='song';});
  set.songCount=set.entries.length;
  set.itemCount=set.textItems.length;
  set.notes=setHasNotes(set);
  if(!set.updated)set.updated=nowLabel();
  return set;
}

function syncAll(sets){
  sets=asArray(sets);
  sets.forEach(syncCounts);
  return sets;
}

function currentSet(sets,activeSetId){
  sets=asArray(sets);
  var set=sets.find(function(item){return item&&item.id===activeSetId;})||sets[0]||null;
  return syncCounts(set);
}

function countLabel(set){
  set=syncCounts(set);
  var songs=(set&&set.songCount)||0,items=(set&&set.itemCount)||0;
  return songs+' '+(songs===1?'song':'songs')+' · '+items+' '+(items===1?'item':'items');
}

function createSet(name,options){
  options=options||{};
  var id=options.id||makeId(options.idPrefix||'new');
  return syncCounts(Object.assign({
    id:id,
    name:normalizeText(name,'New set list'),
    updated:nowLabel(),
    notes:false,
    source:'Personal',
    entries:[],
    textItems:[],
    items:[],
    setKey:'original',
    setNotes:'',
    songNotes:{},
    songCues:{}
  },options.extra||{}));
}

function addSet(sets,set,position){
  sets=asArray(sets);
  set=syncCounts(set);
  if(position==='end')sets.push(set);else sets.unshift(set);
  return {sets:sets,set:set};
}

function deleteSet(sets,setId){
  sets=asArray(sets).filter(function(set){return set&&set.id!==setId;});
  return {sets:sets,activeSetId:(sets[0]&&sets[0].id)||null};
}

function renameSet(set,name){
  set=ensureSetShape(set);
  if(!set)return set;
  set.name=normalizeText(name,set.name||'Untitled set');
  set.updated=nowLabel();
  return syncCounts(set);
}

function clearSet(set){
  set=ensureSetShape(set);
  if(!set)return set;
  set.items=[];
  set.entries=[];
  set.textItems=[];
  set.updated=nowLabel();
  return syncCounts(set);
}

function removeItem(set,index){
  set=ensureSetShape(set);
  if(!set||!Array.isArray(set.items))return {changed:false,item:null,set:set};
  index=parseInt(index,10);
  if(index<0||index>=set.items.length)return {changed:false,item:null,set:set};
  var item=set.items.splice(index,1)[0];
  set.updated=nowLabel();
  syncCounts(set);
  return {changed:true,item:item,set:set};
}

function moveItem(set,from,to){
  set=ensureSetShape(set);
  if(!set||!Array.isArray(set.items))return {changed:false,set:set,from:from,to:to};
  from=parseInt(from,10);to=parseInt(to,10);
  if(from<0||from>=set.items.length)return {changed:false,set:set,from:from,to:to};
  to=Math.max(0,Math.min(set.items.length,to));
  if(from<to)to-=1;
  if(from===to)return {changed:false,set:set,from:from,to:to};
  var item=set.items.splice(from,1)[0];
  set.items.splice(to,0,item);
  set.updated=nowLabel();
  syncCounts(set);
  return {changed:true,set:set,from:from,to:to,item:item};
}

function findSongItemIndex(set,songId){
  set=ensureSetShape(set);
  songId=String(songId||'');
  if(!set||!songId)return -1;
  return set.items.findIndex(function(item){return item&&item.type==='song'&&String(item.songId)===songId;});
}

function addSong(set,songId,extra){
  set=ensureSetShape(set);
  songId=String(songId||'');
  if(!set||!songId)return {changed:false,added:false,set:set};
  if(findSongItemIndex(set,songId)>=0){syncCounts(set);return {changed:false,added:false,exists:true,set:set};}
  set.items.push(Object.assign({type:'song',songId:songId},extra||{}));
  set.updated=nowLabel();
  syncCounts(set);
  return {changed:true,added:true,set:set};
}

function toggleSong(set,songId,extra){
  set=ensureSetShape(set);
  var idx=findSongItemIndex(set,songId);
  if(idx>=0){
    var removed=set.items.splice(idx,1)[0];
    set.updated=nowLabel();
    syncCounts(set);
    return {changed:true,added:false,removed:true,item:removed,set:set};
  }
  var added=addSong(set,songId,extra);
  added.added=true;
  added.removed=false;
  return added;
}

function addSectionOrText(set,kind,name,note){
  set=ensureSetShape(set);
  if(!set)return {changed:false,set:set};
  name=normalizeText(name,kind==='section'?'SECTION':'Service item');
  note=String(note||'');
  if(kind==='section')set.items.push({type:'section',label:name.toUpperCase(),title:name.toUpperCase()});
  else set.items.push({type:'item',title:name,note:note,sub:note});
  set.updated=nowLabel();
  syncCounts(set);
  return {changed:true,set:set};
}

function updateSectionOrText(set,index,kind,name,note){
  set=ensureSetShape(set);
  index=parseInt(index,10);
  if(!set||!set.items||!set.items[index])return {changed:false,set:set};
  var item=set.items[index];
  name=normalizeText(name,kind==='section'?'SECTION':'Service item');
  note=String(note||'');
  if(kind==='section'){
    item.type='section';
    item.label=name.toUpperCase();
    item.title=name.toUpperCase();
    delete item.note;delete item.sub;
  }else{
    item.type='item';
    item.title=name;
    item.note=note;
    item.sub=note;
  }
  set.updated=nowLabel();
  syncCounts(set);
  return {changed:true,set:set,item:item};
}

function preserveSetArray(sets){
  return asArray(sets).map(function(set){return syncCounts(set);});
}

function mutationContract(){
  return [
    'preserve unknown set and set-entry fields',
    'never flatten set entries to only songId/key',
    'keep personal set list mutations local until a caller explicitly syncs elsewhere',
    'future section-filter fields such as sections and lineSnippet must pass through unchanged'
  ];
}

root.WBPersonalSetController={
  ensureSetShape:ensureSetShape,
  preserveSetArray:preserveSetArray,
  syncCounts:syncCounts,
  syncAll:syncAll,
  currentSet:currentSet,
  setHasNotes:setHasNotes,
  countLabel:countLabel,
  createSet:createSet,
  addSet:addSet,
  deleteSet:deleteSet,
  renameSet:renameSet,
  clearSet:clearSet,
  removeItem:removeItem,
  moveItem:moveItem,
  findSongItemIndex:findSongItemIndex,
  addSong:addSong,
  toggleSong:toggleSong,
  addSectionOrText:addSectionOrText,
  updateSectionOrText:updateSectionOrText,
  mutationContract:mutationContract
};
})(window);
