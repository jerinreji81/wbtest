/* WorshipBase Phase 2b - I2 Library/Song concrete surface owner.
   Owns Library manage-mode selection, duplicate review, source selection, delete-impact text,
   and remove-everywhere collection updates while the legacy shell remains the temporary host. */
(function(root){
'use strict';

function stringId(v){return String(v==null?'':v).trim();}
function asArray(v){return Array.isArray(v)?v:[];}
function songTitle(song){return song&&song.title?String(song.title):'';}
function songArtist(song){return song&&(song.artist||song.author)?String(song.artist||song.author):'';}
function setItems(set){return set&&Array.isArray(set.items)?set.items:[];}
function normalizeKeyText(text,ctx){
  ctx=ctx||{};
  if(typeof ctx.normalizeSearchText==='function')return ctx.normalizeSearchText(text);
  return String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9# +/.-]+/g,' ').replace(/\s+/g,' ').trim();
}
function normalizeCodeText(text,ctx){
  ctx=ctx||{};
  if(typeof ctx.normalizeSongCode==='function')return ctx.normalizeSongCode(text);
  return normalizeKeyText(text,ctx);
}
function isFirebaseSong(song){return !!(song&&(song.source==='firebase'||song.importSource==='firebase'));}
function isEditableLocalSong(song){return !!(song&&!isFirebaseSong(song));}
function syncManageToolbar(ctx){
  ctx=ctx||{};
  var qs=ctx.qs||function(){return null};
  var doc=ctx.document||root.document;
  var adminUnlocked=!!ctx.adminUnlocked;
  var manageMode=!!ctx.manageMode;
  var selectedIds=asArray(ctx.manageSelectedIds);
  if(!adminUnlocked){manageMode=false;selectedIds=[];}
  if(doc&&doc.body&&doc.body.classList)doc.body.classList.toggle('manage-mode',!!(adminUnlocked&&manageMode));
  var bar=qs('manage-toolbar'),count=qs('manage-count'),del=qs('manage-delete');
  var on=!!(adminUnlocked&&manageMode);
  if(bar){bar.hidden=!on;bar.setAttribute('aria-hidden',on?'false':'true');}
  if(count)count.textContent=(selectedIds.length||0)+' selected';
  if(del)del.disabled=!selectedIds.length;
  return {manageMode:manageMode,manageSelectedIds:selectedIds};
}
function setManageMode(currentIds,currentMode,on){
  var nextMode=on==null?!currentMode:!!on;
  return {manageMode:nextMode,manageSelectedIds:nextMode?asArray(currentIds).slice():[]};
}
function toggleSelection(currentIds,id){
  id=stringId(id);var out=asArray(currentIds).slice();
  if(!id)return out;
  var i=out.indexOf(id);
  if(i>=0)out.splice(i,1);else out.push(id);
  return out;
}
function visibleSongIds(rows){
  return asArray(rows).map(function(row){return row&&row.song&&row.song.id;}).filter(Boolean).map(String);
}
function selectAllVisible(currentIds,rows){
  var ids=visibleSongIds(rows),cur=asArray(currentIds).map(String);
  return cur.length===ids.length?[]:ids;
}
function duplicateGroups(songs,ctx){
  ctx=ctx||{};var seen={},groups=[];
  asArray(songs).forEach(function(song){
    if(!song)return;
    var code=typeof ctx.songCode==='function'?ctx.songCode(song):(song.code||song.id||'');
    var key=(normalizeKeyText(songTitle(song)+' '+songArtist(song),ctx)||normalizeCodeText(code,ctx)||stringId(song.id)).trim();
    if(!key)return;
    (seen[key]||(seen[key]=[])).push(song);
  });
  Object.keys(seen).forEach(function(key){if(seen[key].length>1)groups.push(seen[key]);});
  return groups;
}
function duplicateReviewSelection(songs,ctx){
  var groups=duplicateGroups(songs,ctx),ids=[];
  groups.forEach(function(group){group.slice(1).forEach(function(song){if(song&&song.id)ids.push(String(song.id));});});
  return {groups:groups,selectedIds:ids,count:groups.length};
}
function songUsageForDelete(id,ctx){
  id=stringId(id);ctx=ctx||{};var out=[];
  asArray(ctx.personalSets).forEach(function(set){
    if(typeof ctx.ensureSetShape==='function')set=ctx.ensureSetShape(set)||set;
    var count=setItems(set).filter(function(item){return item&&item.type==='song'&&String(item.songId)===id;}).length;
    if(count)out.push({scope:'Personal',setId:set.id,setName:set.name||'Untitled set',count:count});
  });
  asArray(ctx.workspaceState&&ctx.workspaceState.sets).forEach(function(set){
    var count=setItems(set).filter(function(item){return item&&item.type==='song'&&String(item.songId)===id;}).length;
    if(count)out.push({scope:'Workspace',setId:set.id,setName:set.name||'Untitled Workspace set',count:count});
  });
  return out;
}
function songUsageImpactText(id,ctx){
  var used=songUsageForDelete(id,ctx);
  if(!used.length)return 'Not currently used in any personal or Workspace set.';
  var total=used.reduce(function(n,u){return n+(u.count||1);},0);
  var lines=used.slice(0,5).map(function(u){return u.scope+': '+u.setName+(u.count>1?' ×'+u.count:'');});
  if(used.length>5)lines.push('+'+(used.length-5)+' more set list'+(used.length-5===1?'':'s'));
  return 'Used in '+total+' set reference'+(total===1?'':'s')+':\n'+lines.join('\n');
}
function bulkSongUsageImpactText(ids,ctx){
  ids=asArray(ids).map(String);ctx=ctx||{};var total=0,lines=[];
  ids.forEach(function(id){
    var song=asArray(ctx.songs).find(function(s){return s&&String(s.id)===id;});
    var used=songUsageForDelete(id,ctx);
    if(used.length){
      var count=used.reduce(function(n,u){return n+(u.count||1);},0);
      total+=count;
      if(lines.length<6)lines.push((song&&song.title||id)+' — '+used.map(function(u){return u.scope+': '+u.setName+(u.count>1?' ×'+u.count:'');}).join(', '));
    }
  });
  if(!total)return 'No selected songs are currently used in personal or Workspace sets.';
  return 'Set references that will be removed ('+total+'):\n'+lines.join('\n')+(total&&lines.length<ids.length?'':'');
}
function removeSongEverywhere(id,model,ctx){
  id=stringId(id);model=model||{};ctx=ctx||{};
  model.localSongs=asArray(model.localSongs).filter(function(song){return song&&String(song.id)!==id;});
  model.firebaseSongs=asArray(model.firebaseSongs).filter(function(song){return song&&String(song.id)!==id;});
  model.songMemory=Object.assign({},model.songMemory||{});
  delete model.songMemory[id];
  model.personalSets=asArray(model.personalSets);
  model.personalSets.forEach(function(set){
    if(typeof ctx.ensureSetShape==='function')set=ctx.ensureSetShape(set)||set;
    set.items=setItems(set).filter(function(item){return !item||item.type!=='song'||String(item.songId)!==id;});
    if(typeof ctx.syncSetCounts==='function')ctx.syncSetCounts(set);
  });
  model.workspaceState=model.workspaceState||{};
  model.workspaceState.sets=asArray(model.workspaceState.sets);
  model.workspaceState.sets.forEach(function(set){
    set.items=setItems(set).filter(function(item){return !item||item.type!=='song'||String(item.songId)!==id;});
    if(typeof ctx.workspaceSetCounts==='function')ctx.workspaceSetCounts(set);
  });
  return model;
}
function idsBySource(songs,source){
  source=source==='firebase'?'firebase':'local';
  return asArray(songs).filter(function(song){return source==='firebase'?isFirebaseSong(song):isEditableLocalSong(song);}).map(function(song){return String(song.id);});
}
function renderContract(){return {phase:'Phase 2b - I2',owner:'WBLibrarySurfaceController',contracts:['syncManageToolbar','setManageMode','toggleSelection','selectAllVisible','duplicateReviewSelection','songUsageImpactText','bulkSongUsageImpactText','removeSongEverywhere','idsBySource'],legacyShellHost:true,nonDestructive:true};}

root.WBLibrarySurfaceController={
  isFirebaseSong:isFirebaseSong,
  isEditableLocalSong:isEditableLocalSong,
  syncManageToolbar:syncManageToolbar,
  setManageMode:setManageMode,
  toggleSelection:toggleSelection,
  visibleSongIds:visibleSongIds,
  selectAllVisible:selectAllVisible,
  duplicateGroups:duplicateGroups,
  duplicateReviewSelection:duplicateReviewSelection,
  songUsageForDelete:songUsageForDelete,
  songUsageImpactText:songUsageImpactText,
  bulkSongUsageImpactText:bulkSongUsageImpactText,
  removeSongEverywhere:removeSongEverywhere,
  idsBySource:idsBySource,
  renderContract:renderContract,
  diagnostics:renderContract
};
})(window);
