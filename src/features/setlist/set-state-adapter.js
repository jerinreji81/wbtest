/* WorshipBase Phase 2b - E2 set-list state/action adapter owner.
   Owns shared Personal/Workspace set action semantics while the legacy shell remains
   the temporary DOM/event adapter. This module must not render UI directly and must
   not persist by itself unless the caller explicitly provides persistence callbacks. */
(function(root){
'use strict';

function asArray(value){return Array.isArray(value)?value:[];}
function asObject(value){return value&&typeof value==='object'?value:{};}
function normalizeScope(scope){scope=String(scope||'personal').toLowerCase();return scope==='workspace'?'workspace':'personal';}
function nowLabel(){return 'Updated now';}
function personalOwner(){return root.WBPersonalSetController||null;}
function workspaceOwner(){return root.WBWorkspaceSetController||null;}
function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
function getSets(env,scope){env=asObject(env);scope=normalizeScope(scope);return scope==='workspace'?asArray(env.workspaceSets):asArray(env.personalSets);}
function activeId(env,scope){env=asObject(env);scope=normalizeScope(scope);return scope==='workspace'?env.activeWorkspaceSetId:env.activePersonalSetId;}
function ownerForScope(scope){scope=normalizeScope(scope);return scope==='workspace'?workspaceOwner():personalOwner();}
function ensureSet(scope,set){var owner=ownerForScope(scope);if(owner&&owner.ensureSetShape)return owner.ensureSetShape(set);return set;}
function syncSet(scope,set){var owner=ownerForScope(scope);if(owner&&owner.syncCounts)return owner.syncCounts(set);return set;}
function activeSet(scope,env){
  scope=normalizeScope(scope);env=asObject(env);var sets=getSets(env,scope),id=activeId(env,scope),owner=ownerForScope(scope);
  if(scope==='workspace'&&owner&&owner.activeSet)return owner.activeSet(sets,id);
  if(scope==='personal'&&owner&&owner.currentSet)return owner.currentSet(sets,id);
  return syncSet(scope,sets.find(function(set){return set&&set.id===id;})||sets[0]||null);
}
function findSet(scope,env,setId){
  scope=normalizeScope(scope);setId=String(setId||'');var sets=getSets(env,scope);
  return syncSet(scope,sets.find(function(set){return set&&String(set.id||'')===setId;})||null);
}
function setLabel(scope){return normalizeScope(scope)==='workspace'?'Workspace set':'Set';}
function mutationResult(scope,set,changed,action,extra){
  set=syncSet(scope,set);return Object.assign({scope:normalizeScope(scope),set:set,changed:changed!==false,action:action||'mutate'},extra||{});
}
function renameSet(scope,set,name){
  scope=normalizeScope(scope);var owner=ownerForScope(scope);if(owner&&owner.renameSet)owner.renameSet(set,name);else if(set){set.name=String(name||set.name||'Untitled set').trim()||set.name||'Untitled set';set.updated=nowLabel();syncSet(scope,set);}return mutationResult(scope,set,true,'rename');
}
function clearSet(scope,set){
  scope=normalizeScope(scope);var owner=ownerForScope(scope);if(owner&&owner.clearSet)owner.clearSet(set);else if(set){set.items=[];set.entries=[];set.textItems=[];set.updated=nowLabel();syncSet(scope,set);}return mutationResult(scope,set,true,'clear');
}
function removeItem(scope,set,index){
  scope=normalizeScope(scope);var owner=ownerForScope(scope),result=null;if(owner&&owner.removeItem)result=owner.removeItem(set,index);else{set=ensureSet(scope,set);index=parseInt(index,10);if(!set||!set.items||index<0||index>=set.items.length)return mutationResult(scope,set,false,'removeItem',{item:null});var item=set.items.splice(index,1)[0];set.updated=nowLabel();syncSet(scope,set);result={changed:true,item:item,set:set};}return mutationResult(scope,result&&result.set||set,!!(result&&result.changed),'removeItem',{item:result&&result.item});
}
function moveItem(scope,set,from,to){
  scope=normalizeScope(scope);var owner=ownerForScope(scope),result=null;if(owner&&owner.moveItem)result=owner.moveItem(set,from,to);else{set=ensureSet(scope,set);from=parseInt(from,10);to=parseInt(to,10);if(!set||!set.items||from<0||from>=set.items.length)return mutationResult(scope,set,false,'moveItem',{from:from,to:to});to=Math.max(0,Math.min(set.items.length,to));if(from<to)to-=1;if(from===to)return mutationResult(scope,set,false,'moveItem',{from:from,to:to});var item=set.items.splice(from,1)[0];set.items.splice(to,0,item);set.updated=nowLabel();syncSet(scope,set);result={changed:true,set:set,from:from,to:to,item:item};}return mutationResult(scope,result&&result.set||set,!!(result&&result.changed),'moveItem',result||{});
}
function addOrUpdateSectionOrText(scope,set,index,kind,name,note){
  scope=normalizeScope(scope);var owner=ownerForScope(scope);index=(index===null||index===undefined)?null:parseInt(index,10);kind=kind==='section'?'section':'text';name=String(name||'').trim();note=String(note||'');var result=null;
  if(owner){if(index!==null&&set&&set.items&&set.items[index]&&owner.updateSectionOrText)result=owner.updateSectionOrText(set,index,kind,name,note);else if(owner.addSectionOrText)result=owner.addSectionOrText(set,kind,name,note);}
  if(!result){set=ensureSet(scope,set);if(!set)return mutationResult(scope,set,false,'addOrUpdateSectionOrText');set.items=asArray(set.items);if(index!==null&&set.items[index]){var item=set.items[index];if(kind==='section'){item.type='section';item.label=name.toUpperCase();item.title=name.toUpperCase();delete item.note;delete item.sub;}else{item.type='item';item.title=name;item.note=note;item.sub=note;}result={changed:true,set:set,item:item};}else{if(kind==='section')set.items.push({type:'section',label:name.toUpperCase(),title:name.toUpperCase()});else set.items.push({type:'item',title:name,note:note,sub:note});result={changed:true,set:set};}set.updated=nowLabel();syncSet(scope,set);}
  return mutationResult(scope,result&&result.set||set,!!(result&&result.changed),'addOrUpdateSectionOrText',{item:result&&result.item,kind:kind,edited:index!==null});
}
function setDefaultKey(scope,set,keyChoice){
  scope=normalizeScope(scope);keyChoice=String(keyChoice||'original');var owner=ownerForScope(scope);if(scope==='workspace'&&owner&&owner.updateSetKey)owner.updateSetKey(set,keyChoice);else{set=ensureSet(scope,set);if(set){set.setKey=keyChoice;set.updated=nowLabel();syncSet(scope,set);}}return mutationResult(scope,set,true,'setDefaultKey',{key:keyChoice});
}
function setSongKey(scope,set,index,keyChoice){
  scope=normalizeScope(scope);set=ensureSet(scope,set);index=parseInt(index,10);keyChoice=String(keyChoice||'inherit');if(!set||!set.items||!set.items[index])return mutationResult(scope,set,false,'setSongKey',{index:index,key:keyChoice});var item=set.items[index];if(keyChoice==='inherit'){delete item.setKey;delete item.keyOverride;}else{item.setKey=keyChoice;item.keyOverride=true;}set.updated=nowLabel();syncSet(scope,set);return mutationResult(scope,set,true,'setSongKey',{index:index,key:keyChoice,item:item});
}
function setKey(scope,set,index,keyChoice){return (index===null||index===undefined)?setDefaultKey(scope,set,keyChoice):setSongKey(scope,set,index,keyChoice);}
function setSetNotes(scope,set,notes){
  scope=normalizeScope(scope);var owner=ownerForScope(scope);notes=String(notes||'').trim();if(scope==='workspace'&&owner&&owner.updateSetNotes)owner.updateSetNotes(set,notes);else{set=ensureSet(scope,set);if(set){set.setNotes=notes;set.updated=nowLabel();syncSet(scope,set);}}return mutationResult(scope,set,true,'setSetNotes',{notes:notes});
}
function setSongNotes(scope,set,songId,note,cue){
  scope=normalizeScope(scope);set=ensureSet(scope,set);songId=String(songId||'');if(!set||!songId)return mutationResult(scope,set,false,'setSongNotes',{songId:songId});set.songNotes=asObject(set.songNotes);set.songCues=asObject(set.songCues);note=String(note||'').trim();cue=String(cue||'').trim();if(note)set.songNotes[songId]=note;else delete set.songNotes[songId];if(cue)set.songCues[songId]=cue;else delete set.songCues[songId];set.updated=nowLabel();syncSet(scope,set);return mutationResult(scope,set,true,'setSongNotes',{songId:songId,note:note,cue:cue});
}
function setHasNotes(scope,set){var owner=ownerForScope(scope);if(owner&&owner.setHasNotes)return owner.setHasNotes(set);set=ensureSet(scope,set);if(!set)return false;return !!(String(set.setNotes||'').trim()||Object.keys(asObject(set.songNotes)).some(function(k){return String(set.songNotes[k]||'').trim();})||Object.keys(asObject(set.songCues)).some(function(k){return String(set.songCues[k]||'').trim();}));}
function summary(scope,set){set=syncSet(scope,set);return {scope:normalizeScope(scope),id:set&&set.id||'',name:set&&set.name||'',songs:set&&set.songCount||0,items:set&&set.itemCount||0,hasNotes:setHasNotes(scope,set),setKey:set&&set.setKey||'original'};}
function actionContract(){return [
  'Legacy DOM handlers may stay temporarily, but Personal/Workspace set mutations must delegate here where practical.',
  'This adapter does not render UI; WBSetEditor owns markup and scope renderers.',
  'This adapter does not perform storage writes unless a caller explicitly supplies/handles persistence.',
  'All actions preserve unknown item fields for future section filtering and workspace metadata.',
  'Scope is explicit: personal and workspace behaviours use one action vocabulary with different persistence adapters.'
];}
function diagnostics(){return {owner:'WBSetStateAdapter',phase:'Phase 2b - E2',actions:['activeSet','findSet','renameSet','clearSet','removeItem','moveItem','addOrUpdateSectionOrText','setKey','setSetNotes','setSongNotes','summary'],contract:actionContract()};}

root.WBSetStateAdapter={
  normalizeScope:normalizeScope,
  activeSet:activeSet,
  findSet:findSet,
  ensureSet:ensureSet,
  syncSet:syncSet,
  setLabel:setLabel,
  renameSet:renameSet,
  clearSet:clearSet,
  removeItem:removeItem,
  moveItem:moveItem,
  addOrUpdateSectionOrText:addOrUpdateSectionOrText,
  setKey:setKey,
  setSetNotes:setSetNotes,
  setSongNotes:setSongNotes,
  setHasNotes:setHasNotes,
  summary:summary,
  actionContract:actionContract,
  diagnostics:diagnostics
};
})(window);
