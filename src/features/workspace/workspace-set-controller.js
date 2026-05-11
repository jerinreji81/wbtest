/* WorshipBase Phase I.2 workspace set controller owner.
   Owns Workspace set shape, counts, snapshot normalisation, item mutation helpers,
   publish/copy primitives, and workspace profile helpers.
   DOM rendering, Firebase paths, drag UX, PDF export, and attached song PDF workflows remain untouched. */
(function(root){
'use strict';

function asArray(value){return Array.isArray(value)?value:[];}
function nowLabel(){return 'Updated now';}
function makeId(prefix){return String(prefix||'ws')+'-'+Date.now();}
function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
function normalizeText(value,fallback){
  value=String(value==null?'':value).trim();
  fallback=String(fallback==null?'':fallback).trim();
  return value||fallback||'';
}

function ensureSetShape(set,options){
  options=options||{};
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
  if(options.id||!set.id)set.id=String(options.id||set.id||makeId('ws'));
  set.source=options.source||set.source||'Workspace';
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

function preserveSetArray(sets){return asArray(sets).map(syncCounts);}
function activeSet(sets,activeSetId){return syncCounts(asArray(sets).find(function(set){return set&&set.id===activeSetId;})||null);}

function normalizeSet(raw,id){
  var base=Object.assign({id:id||String(Date.now())},raw||{});
  return syncCounts(ensureSetShape(base,{id:id||base.id,source:base.source||'Workspace'}));
}

function recordsFromSnapshot(data){
  if(!data)return [];
  var out=[];
  if(Array.isArray(data)){
    data.forEach(function(value,idx){if(value&&typeof value==='object')out.push(normalizeSet(value,value.id||String(idx)));});
    return out;
  }
  if(typeof data==='object'){
    Object.keys(data).forEach(function(key){var value=data[key];if(value&&typeof value==='object')out.push(normalizeSet(value,value.id||key));});
  }
  return out;
}

function countLabel(set){
  set=syncCounts(set);
  var songs=(set&&set.songCount)||0,items=(set&&set.itemCount)||0;
  return songs+' '+(songs===1?'song':'songs')+(items?' · '+items+' '+(items===1?'item':'items'):'');
}
function itemCountLabel(set){return countLabel(set);}
function dateLabel(set){return (set&&set.updated)||nowLabel();}
function statusLabel(options){return options&&options.cloud?'Workspace set · Cloud':'Workspace set';}

function createSet(name,options){
  options=options||{};
  var set=Object.assign({
    id:options.id||makeId(options.idPrefix||'ws'),
    name:normalizeText(name,'New Workspace Set'),
    updated:nowLabel(),
    notes:false,
    source:'Workspace',
    setKey:'original',
    setNotes:'',
    items:[],
    entries:[],
    textItems:[],
    songNotes:{},
    songCues:{}
  },options.extra||{});
  return syncCounts(set);
}
function addSet(sets,set,position){sets=asArray(sets);set=syncCounts(set);if(position==='end')sets.push(set);else sets.unshift(set);return {sets:sets,set:set};}
function deleteSet(sets,setId){sets=asArray(sets).filter(function(set){return set&&set.id!==setId;});return {sets:sets,activeSetId:(sets[0]&&sets[0].id)||null};}
function duplicateSet(sets,setId){
  sets=asArray(sets);
  var src=sets.find(function(set){return set&&set.id===setId;});
  if(!src)return {changed:false,sets:sets,set:null};
  var copy=clone(src)||{};
  copy.id=makeId('ws');
  copy.name=normalizeText((src.name||'Workspace set')+' copy','Workspace set copy');
  copy.updated=nowLabel();
  syncCounts(copy);
  sets.unshift(copy);
  return {changed:true,sets:sets,set:copy};
}
function renameSet(set,name){set=ensureSetShape(set);if(!set)return set;set.name=normalizeText(name,set.name||'Workspace set');set.updated=nowLabel();return syncCounts(set);}
function clearSet(set){set=ensureSetShape(set);if(!set)return set;set.items=[];set.entries=[];set.textItems=[];set.updated=nowLabel();return syncCounts(set);}

function removeItem(set,index){
  set=ensureSetShape(set);index=parseInt(index,10);
  if(!set||!Array.isArray(set.items)||index<0||index>=set.items.length)return {changed:false,item:null,set:set};
  var item=set.items.splice(index,1)[0];set.updated=nowLabel();syncCounts(set);return {changed:true,item:item,set:set};
}
function moveItem(set,from,to){
  set=ensureSetShape(set);from=parseInt(from,10);to=parseInt(to,10);
  if(!set||!Array.isArray(set.items)||from<0||from>=set.items.length)return {changed:false,set:set,from:from,to:to};
  to=Math.max(0,Math.min(set.items.length,to));
  if(from<to)to-=1;
  if(from===to)return {changed:false,set:set,from:from,to:to};
  var item=set.items.splice(from,1)[0];set.items.splice(to,0,item);set.updated=nowLabel();syncCounts(set);
  return {changed:true,set:set,from:from,to:to,item:item};
}
function findSongItemIndex(set,songId){
  set=ensureSetShape(set);songId=String(songId||'');
  if(!set||!songId)return -1;
  return set.items.findIndex(function(item){return item&&item.type==='song'&&String(item.songId)===songId;});
}
function addSong(set,songId,extra){
  set=ensureSetShape(set);songId=String(songId||'');
  if(!set||!songId)return {changed:false,added:false,set:set};
  if(findSongItemIndex(set,songId)>=0){syncCounts(set);return {changed:false,added:false,exists:true,set:set};}
  set.items.push(Object.assign({type:'song',songId:songId},extra||{}));set.updated=nowLabel();syncCounts(set);
  return {changed:true,added:true,set:set};
}
function toggleSong(set,songId,extra){
  set=ensureSetShape(set);var idx=findSongItemIndex(set,songId);
  if(idx>=0){var removed=set.items.splice(idx,1)[0];set.updated=nowLabel();syncCounts(set);return {changed:true,removed:true,added:false,item:removed,set:set};}
  var added=addSong(set,songId,extra);added.removed=false;return added;
}
function addSectionOrText(set,kind,name,note){
  set=ensureSetShape(set);if(!set)return {changed:false,set:set};
  name=normalizeText(name,kind==='section'?'SECTION':'Service item');note=String(note||'');
  if(kind==='section')set.items.push({type:'section',label:name.toUpperCase(),title:name.toUpperCase()});
  else set.items.push({type:'item',title:name,note:note,sub:note});
  set.updated=nowLabel();syncCounts(set);return {changed:true,set:set};
}
function updateSectionOrText(set,index,kind,name,note){
  set=ensureSetShape(set);index=parseInt(index,10);
  if(!set||!set.items||!set.items[index])return {changed:false,set:set};
  var item=set.items[index];name=normalizeText(name,kind==='section'?'SECTION':'Service item');note=String(note||'');
  if(kind==='section'){item.type='section';item.label=name.toUpperCase();item.title=name.toUpperCase();delete item.note;delete item.sub;}
  else{item.type='item';item.title=name;item.note=note;item.sub=note;}
  set.updated=nowLabel();syncCounts(set);return {changed:true,set:set,item:item};
}
function updateSetKey(set,setKey){set=ensureSetShape(set);if(!set)return set;set.setKey=setKey||'original';set.updated=nowLabel();return syncCounts(set);}
function updateSetNotes(set,notes){set=ensureSetShape(set);if(!set)return set;set.setNotes=String(notes||'');set.updated=nowLabel();return syncCounts(set);}

function uniquePublishName(sets,base){
  sets=asArray(sets);base=normalizeText(base,'Published set');
  if(!/workspace/i.test(base))base=base+' (Workspace)';
  var used={};sets.forEach(function(set){used[String(set&&set.name||'').toLowerCase()]=true;});
  var out=base,i=2;while(used[String(out).toLowerCase()]){out=base+' '+i;i++;}return out;
}
function publishFromPersonal(personalSet,workspaceSets,name){
  personalSet=ensureSetShape(personalSet);workspaceSets=asArray(workspaceSets);
  if(!personalSet)return {changed:false,set:null,sets:workspaceSets};
  var copy=syncCounts({
    id:makeId('ws'),
    name:normalizeText(name,uniquePublishName(workspaceSets,personalSet.name||'Published set')),
    updated:nowLabel(),
    notes:setHasNotes(personalSet),
    setNotes:personalSet.setNotes||'',
    setKey:personalSet.setKey||'original',
    items:clone(personalSet.items||[]),
    songNotes:clone(personalSet.songNotes||{}),
    songCues:clone(personalSet.songCues||{}),
    source:'personal-publish',
    sourcePersonalSetId:personalSet.id
  });
  workspaceSets.unshift(copy);return {changed:true,set:copy,sets:workspaceSets};
}
function copyToPersonal(workspaceSet,options){
  options=options||{};workspaceSet=ensureSetShape(workspaceSet);
  if(!workspaceSet)return null;
  return syncCounts({
    id:options.id||('set-'+Date.now()),
    name:normalizeText(options.name,(workspaceSet.name||'Workspace set')+' copy'),
    source:'Personal',
    updated:nowLabel(),
    setNotes:workspaceSet.setNotes||'',
    setKey:workspaceSet.setKey||'original',
    items:clone(workspaceSet.items||[]),
    songNotes:clone(workspaceSet.songNotes||{}),
    songCues:clone(workspaceSet.songCues||{})
  });
}
function defaultProfile(){return {name:'Workspace',description:'Team planning and shared sets',inviteCode:'WB-TEAM-042'};}
function normalizeProfile(profile){return Object.assign(defaultProfile(),(profile&&typeof profile==='object')?profile:{});}
function updateProfile(profile,fields){return Object.assign(normalizeProfile(profile),fields||{});}
function regenerateInviteCode(){return 'WB-'+Math.random().toString(36).slice(2,6).toUpperCase()+'-'+Math.floor(100+Math.random()*900);}

function mutationContract(){
  return [
    'preserve unknown workspace set and set-entry fields',
    'never flatten workspace entries to only songId/key',
    'keep Firebase path ownership in firebase-service; this controller owns only set shape and mutations',
    'future section-filter fields such as sections and lineSnippet must pass through unchanged'
  ];
}

root.WBWorkspaceSetController={
  ensureSetShape:ensureSetShape,
  normalizeSet:normalizeSet,
  recordsFromSnapshot:recordsFromSnapshot,
  preserveSetArray:preserveSetArray,
  syncCounts:syncCounts,
  activeSet:activeSet,
  setHasNotes:setHasNotes,
  countLabel:countLabel,
  itemCountLabel:itemCountLabel,
  dateLabel:dateLabel,
  statusLabel:statusLabel,
  createSet:createSet,
  addSet:addSet,
  deleteSet:deleteSet,
  duplicateSet:duplicateSet,
  renameSet:renameSet,
  clearSet:clearSet,
  removeItem:removeItem,
  moveItem:moveItem,
  findSongItemIndex:findSongItemIndex,
  addSong:addSong,
  toggleSong:toggleSong,
  addSectionOrText:addSectionOrText,
  updateSectionOrText:updateSectionOrText,
  updateSetKey:updateSetKey,
  updateSetNotes:updateSetNotes,
  uniquePublishName:uniquePublishName,
  publishFromPersonal:publishFromPersonal,
  copyToPersonal:copyToPersonal,
  defaultProfile:defaultProfile,
  normalizeProfile:normalizeProfile,
  updateProfile:updateProfile,
  regenerateInviteCode:regenerateInviteCode,
  mutationContract:mutationContract
};
})(window);
