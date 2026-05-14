/* WorshipBase Phase 2b - I4 Song import/fetch and destination owner.
   Owns import fetch routing, import destination sheet state, Firebase/local import payloads,
   and imported/manual song commit orchestration while the legacy shell remains the temporary host. */
(function(root){
'use strict';

function asArray(v){return Array.isArray(v)?v:[];}
function str(v){return String(v==null?'':v);}
function trimmed(v){return str(v).trim();}
function call(ctx,name){if(ctx&&typeof ctx[name]==='function')return ctx[name].apply(ctx,Array.prototype.slice.call(arguments,2));}
function qs(ctx,id){return ctx&&ctx.qs?ctx.qs(id):null;}
function setText(el,text){if(el)el.textContent=text;}
function setHtml(el,html){if(el)el.innerHTML=html;}
function esc(ctx,v){return ctx&&ctx.esc?ctx.esc(v):str(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
function promiseValue(v){return v&&typeof v.then==='function'?v:Promise.resolve(v);}

var importDestinationResolver=null;

function ugBackendBase(){return 'https://worshipbase-ug.worshipbase.workers.dev';}
function sopBackendBase(){return 'https://wb-sop.jerinreji81.workers.dev';}
function importBackendBase(kind){return kind==='sop'?sopBackendBase():ugBackendBase();}
function searchImportUrl(kind,query){return kind==='sop'?(sopBackendBase()+'/api/sop/search?q='+encodeURIComponent(query)+'&lang=Malayalam'):(ugBackendBase()+'/api/ug/search?q='+encodeURIComponent(query));}
function importUrl(kind,urlOrId,byId){return kind==='sop'?(sopBackendBase()+'/api/sop/import?url='+encodeURIComponent(urlOrId)):(ugBackendBase()+'/api/ug/import?'+(byId?'id=':'url=')+encodeURIComponent(urlOrId));}
function fetchJson(url){return fetch(url,{headers:{Accept:'application/json'}}).then(function(r){return r.json().then(function(j){if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j;});});}

function chooseImportDestination(count,label,ctx){
  return new Promise(function(resolve){
    importDestinationResolver=resolve;
    var m=qs(ctx,'bs-import-destination');
    if(m){m.classList.add('open');m.setAttribute('aria-hidden','false');}
  });
}
function resolveImportDestination(dest,ctx){
  var fn=importDestinationResolver;importDestinationResolver=null;
  var m=qs(ctx,'bs-import-destination');
  if(ctx&&ctx.closeSheetElement)ctx.closeSheetElement(m);else if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true');}
  if(fn)fn(dest||'');
}
function firebaseAvailableForImports(ctx){
  try{return !!(ctx&&((typeof ctx.firebaseRealtimeDb==='function')||(root.firebase&&root.firebase.apps&&root.firebase.apps.length)));}
  catch(e){return false;}
}
function firebaseSongId(song){return (song&&song.id)||((song&&song.code)||'fb-song')+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);}
function localSongId(song){var id=song&&song.id?str(song.id):'';return id.indexOf('my_')===0?id:('my_'+Date.now()+'_'+Math.random().toString(36).slice(2,8));}
function makeFirebaseSong(song,ctx){
  var id=firebaseSongId(song);
  var raw=Object.assign({},song||{},{id:id,source:'firebase',librarySource:'worshipbase'});
  return ctx&&ctx.normalizeFirebaseSong?ctx.normalizeFirebaseSong(raw,id):raw;
}
function makeFirebasePayload(rows,ctx){return asArray(rows).filter(Boolean).map(function(s){var out=makeFirebaseSong(s,ctx);out.id=out.id||firebaseSongId(out);return out;});}
function makeLocalPayload(rows){return asArray(rows).filter(Boolean).map(function(s){return Object.assign({},s,{id:localSongId(s),source:'local'});});}
function mergeRecentIds(imported,recentIds){
  imported=asArray(imported).filter(function(s){return s&&s.id;});
  return imported.map(function(s){return s.id;}).concat(asArray(recentIds).filter(function(id){return !imported.some(function(s){return s.id===id;});})).slice(0,8);
}
function clearLibrarySearch(ctx){
  if(ctx&&ctx.state){ctx.state.filter='all';ctx.state.query='';}
  var inp=qs(ctx,'srch-inp');if(inp)inp.value='';
  var clr=qs(ctx,'srch-clr');if(clr)clr.style.display='none';
}
function refreshImportSurfaces(ctx){
  call(ctx,'renderLibrary');call(ctx,'renderSettings');call(ctx,'closeAddSongModal');call(ctx,'closeImportPages');call(ctx,'closeImportDuplicateReview');
}

function putFirebaseSongsBulk(rows,ctx){
  rows=makeFirebasePayload(rows,ctx);
  var paths=ctx&&ctx.cloudFirestorePaths?ctx.cloudFirestorePaths():{};
  return promiseValue(call(ctx,'firebaseRealtimeDb')).then(function(db){
    var updates={};
    rows.forEach(function(s){updates[((paths&&paths.songsPath)||'songs')+'/'+ctx.firebaseSongPathKey(s.id)]=JSON.parse(JSON.stringify(s));});
    if(db&&db.ref&&db.ref().update)return db.ref().update(updates);
    throw new Error('Realtime DB update unavailable');
  }).then(function(){
    if(ctx&&ctx.setFirebaseSongs)ctx.setFirebaseSongs(ctx.mergeSongSources(ctx.getFirebaseSongs(),rows));
    call(ctx,'persistFirebaseSongsCache');call(ctx,'rebuildSongsCache');call(ctx,'renderLibrary');call(ctx,'renderSettings');
    return rows;
  }).catch(function(){
    if(ctx&&ctx.setFirebaseSongs)ctx.setFirebaseSongs(ctx.mergeSongSources(ctx.getFirebaseSongs(),rows));
    call(ctx,'persistFirebaseSongsCache');call(ctx,'rebuildSongsCache');call(ctx,'renderLibrary');call(ctx,'renderSettings');
    return rows;
  });
}
function saveImportedSongsToDestination(rows,dest,ctx){
  rows=asArray(rows).filter(Boolean);
  if(!rows.length){call(ctx,'showToast','No songs to import');return Promise.resolve([]);}
  if(dest==='firebase'){
    var payload=makeFirebasePayload(rows,ctx);
    var saver=ctx&&ctx.putFirebaseSongsBulk?ctx.putFirebaseSongsBulk:putFirebaseSongsBulk;
    return promiseValue(saver(payload,ctx)).then(function(saved){call(ctx,'showToast','Saved to Firebase');return saved||payload;});
  }
  var local=makeLocalPayload(rows);
  if(ctx&&ctx.setLocalSongs)ctx.setLocalSongs(ctx.mergeSongSources(ctx.getLocalSongs(),local));
  call(ctx,'persistSongs');call(ctx,'rebuildSongsCache');call(ctx,'renderLibrary');call(ctx,'showToast','Saved to My Songs');
  return Promise.resolve(local);
}

function saveManualSongToDestination(payload,dest,ctx){
  dest=dest==='firebase'?'firebase':'local';
  var draft=ctx.normalizeImportedSong(payload||{},(payload&&payload.importSource)||'editor');
  var replaceId=draft.id&&asArray(ctx.getLocalSongs()).some(function(s){return s.id===draft.id;})?draft.id:null;
  if(dest==='firebase'){
    if(!ctx.adminUnlocked()){call(ctx,'showToast','Admin mode required for Firebase songs');return Promise.resolve(null);}
    var fb=makeFirebaseSong(draft,ctx);
    return saveImportedSongsToDestination([fb],'firebase',ctx).then(function(saved){
      var first=(saved&&saved[0])||fb;
      if(first&&first.id){ctx.setRecentIds([first.id].concat(asArray(ctx.getRecentIds()).filter(function(id){return id!==first.id;})).slice(0,8));call(ctx,'persistRecents');}
      call(ctx,'renderLibrary');call(ctx,'renderSettings');call(ctx,'renderSongSheet');call(ctx,'closeAddSongModal');call(ctx,'showToast','Song saved to Firebase');
      return first;
    });
  }
  var saved=ctx.commitSongPayload(draft,replaceId);
  if(saved&&saved.id){ctx.setRecentIds([saved.id].concat(asArray(ctx.getRecentIds()).filter(function(id){return id!==saved.id;})).slice(0,8));call(ctx,'persistRecents');}
  call(ctx,'persistSongs');call(ctx,'rebuildSongsCache');call(ctx,'renderLibrary');call(ctx,'renderSettings');call(ctx,'renderSongSheet');call(ctx,'closeAddSongModal');
  call(ctx,'showToast',replaceId?'Song updated':'Song saved to My Songs');
  return Promise.resolve(saved);
}
function saveManualNewSong(payload,ctx){
  if(ctx.adminUnlocked())return chooseImportDestination(1,'song',ctx).then(function(dest){if(!dest)return null;return saveManualSongToDestination(payload,dest,ctx);});
  return saveManualSongToDestination(payload,'local',ctx);
}
function saveManualEditedSong(payload,existing,ctx){
  if(!existing)return Promise.resolve(null);
  if(ctx.isFirebaseSong(existing)){
    if(!ctx.adminUnlocked()){call(ctx,'showToast','Only admin can save changes to Firebase songs');return Promise.resolve(null);}
    return promiseValue(ctx.updateFirebaseSongRemote(existing.id,Object.assign({},existing,payload,{id:existing.id,source:'firebase'}))).then(function(){call(ctx,'renderSongSheet');call(ctx,'closeAddSongModal');call(ctx,'showToast','Saved to Firebase');});
  }
  if(ctx.adminUnlocked()){
    return chooseImportDestination(1,'song',ctx).then(function(dest){
      if(!dest)return null;
      if(dest==='firebase')return saveManualSongToDestination(Object.assign({},existing,payload,{id:existing.id}),dest,ctx);
      var saved=ctx.commitSongPayload(payload,existing.id);
      call(ctx,'persistSongs');call(ctx,'renderLibrary');call(ctx,'renderSongSheet');call(ctx,'closeAddSongModal');call(ctx,'showToast','Song updated');
      return saved;
    });
  }
  var savedLocal=ctx.commitSongPayload(payload,existing.id);
  call(ctx,'persistSongs');call(ctx,'renderLibrary');call(ctx,'renderSongSheet');call(ctx,'closeAddSongModal');call(ctx,'showToast','Song updated');
  return Promise.resolve(savedLocal);
}
function commitImportedDrafts(drafts,opts,ctx){
  opts=opts||{};drafts=asArray(drafts).filter(Boolean);
  if(ctx.adminUnlocked()&&!opts.destination){
    chooseImportDestination(drafts.length,'Save song to',ctx).then(function(dest){if(!dest)return;commitImportedDrafts(drafts,Object.assign({},opts,{destination:dest}),ctx);});
    return;
  }
  if(opts.destination==='firebase'){
    var toSave=[];
    drafts.forEach(function(d){var decision=d._decision||'import';if(decision==='skip')return;toSave.push(ctx.normalizeImportedSong(Object.assign({},d,{source:'firebase'}),d.importSource||opts.source||'file'));});
    saveImportedSongsToDestination(toSave,'firebase',ctx).then(function(imported){
      imported=asArray(imported);if(!imported.length)return;
      ctx.setRecentIds(mergeRecentIds(imported,ctx.getRecentIds()));call(ctx,'persistRecents');clearLibrarySearch(ctx);refreshImportSurfaces(ctx);
    });
    return;
  }
  var imported=[];
  drafts.forEach(function(d){
    var decision=d._decision||'import';
    if(decision==='skip')return;
    if(decision.indexOf('replace:')===0){
      var id=decision.slice(8),existing=asArray(ctx.getSongs()).find(function(x){return x.id===id;});
      if(ctx.isFirebaseSong(existing)&&ctx.adminUnlocked()){
        var fb=ctx.normalizeFirebaseSong(Object.assign({},existing,d,{id:id,source:'firebase'}),id);
        ctx.updateFirebaseSongRemote(id,fb);
        imported.push(ctx.cacheFirebaseSong(fb));
        return;
      }
      imported.push(ctx.commitSongPayload(d,id));return;
    }
    imported.push(ctx.commitSongPayload(d));
  });
  imported=imported.filter(Boolean);
  if(!imported.length){call(ctx,'showToast','No songs imported');return;}
  call(ctx,'persistSongs');ctx.setRecentIds(mergeRecentIds(imported,ctx.getRecentIds()));call(ctx,'persistRecents');clearLibrarySearch(ctx);refreshImportSurfaces(ctx);call(ctx,'showToast',imported.length+' song'+(imported.length===1?'':'s')+' saved');
}

function mapBackendSong(raw,kind,ctx){
  raw=raw||{};
  if(kind==='ug'&&ctx.normalizeUgImportedSong)return ctx.normalizeUgImportedSong(raw);
  return ctx.normalizeImportedSong({id:raw.id||raw.importId,title:raw.title||raw.name,artist:raw.artist||raw.author,key:raw.key||raw.originalKey||raw.scale,originalKey:raw.originalKey||raw.key||raw.scale,chartKey:raw.chartKey||raw.originalKey||raw.key||raw.scale,sourceKey:raw.sourceKey||raw.originalKey||raw.key||raw.scale,tabType:raw.tabType||raw.type||raw.resultType,rating:raw.rating||raw.stars||raw.score,cat:kind==='sop'?'malayalam':'english',chart:raw.chart||raw.content||raw.lyrics||raw.text,bpm:raw.bpm,timeSig:raw.timeSig||raw.timeSignature,url:raw.url||raw.sourceUrl,code:raw.code},kind);
}
function searchImport(kind,ctx){
  var isSop=kind==='sop',q=trimmed(ctx.qv(isSop?'sop-search-query':'ug-import-query',''));
  if(!q){call(ctx,'showToast',isSop?'Enter a Malayalam song title':'Enter a song or artist');return;}
  ctx.renderImportResults(kind,[],isSop?'Searching Songs of Praise…':'Searching Ultimate Guitar…');
  var meta=qs(ctx,isSop?'sop-preview-meta':'ug-preview-meta');setText(meta,'Searching…');
  fetchJson(searchImportUrl(kind,q)).then(function(data){
    var results=asArray(data.results||data.songs).map(function(r){return mapBackendSong(r,kind,ctx);});
    ctx.renderImportResults(kind,results,isSop?'No results found. Try a shorter search, partial word, or alternate spelling.':'No results found. Try a simpler title/artist search.');
    if(results[0]&&results[0].chart)ctx.setImportedDraft(kind,results[0]);else setText(meta,results.length?(results.length+' result'+(results.length===1?'':'s')+' found. Choose a result to import.'):'No results found');
  }).catch(function(err){ctx.renderImportResults(kind,[],err.message||'Search failed.');setText(meta,'Search failed');call(ctx,'showToast',(isSop?'Songs of Praise':'UG')+' search failed');});
}
function importFromUrl(kind,ctx){
  var isSop=kind==='sop',url=trimmed(ctx.qv(isSop?'sop-source-url':'ug-source-url',''));
  if(!url){call(ctx,'showToast','Paste a URL first');return;}
  var meta=qs(ctx,isSop?'sop-preview-meta':'ug-preview-meta'),body=qs(ctx,isSop?'sop-preview-body':'ug-import-preview');
  setText(meta,'Importing…');setHtml(body,'<div class="preview-empty">Importing chart…</div>');
  fetchJson(importUrl(kind,url,false)).then(function(data){var draft=mapBackendSong(data.song||data,kind,ctx);draft.sourceUrl=url;ctx.setImportedDraft(kind,draft);call(ctx,'showToast','Chart imported');}).catch(function(err){setText(meta,'Import failed');setHtml(body,'<div class="preview-empty">'+esc(ctx,err.message||'Import failed. Try another URL.')+'</div>');call(ctx,'showToast','Import failed');});
}
function importResultByIdOrUrl(kind,draft,ctx){
  if(!draft)return Promise.resolve(null);
  function finish(row){ctx.setImportedDraft(kind,row);call(ctx,'showToast','Imported');return row;}
  var hasRemote=!!(draft.importId||draft.sourceUrl);
  if(hasRemote){
    var url=draft.importId?importUrl(kind,draft.importId,true):importUrl(kind,draft.sourceUrl,false);
    return fetchJson(url).then(function(data){
      var raw=data.song||data||{};
      var canonicalKey=raw.key||raw.originalKey||raw.sourceKey||raw.chartKey||raw.detectedKey||raw.scale||draft.key||draft.originalKey||draft.sourceKey||draft.chartKey||draft.detectedKey||draft.scale;
      var rawChart=raw.chart||raw.content||raw.lyrics||raw.body||raw.text||'';
      var merged=Object.assign({},draft,raw,{
        key:canonicalKey,
        originalKey:canonicalKey,
        sourceKey:canonicalKey,
        chartKey:canonicalKey,
        displayKey:canonicalKey,
        chart:rawChart||draft.chart||''
      });
      return finish(mapBackendSong(merged,kind,ctx));
    }).catch(function(err){
      if(draft.chart&&String(draft.chart).trim())return finish(draft);
      call(ctx,'showToast',kind==='sop'?'Songs of Praise import failed':'UG import failed');
      return null;
    });
  }
  if(draft.chart)return Promise.resolve(finish(draft));
  return Promise.resolve(null);
}
function renderContract(){return {phase:'Phase 2b - I4',owner:'WBSongImportDestinationController',contracts:['fetchJson','searchImport','importFromUrl','importResultByIdOrUrl','chooseImportDestination','resolveImportDestination','putFirebaseSongsBulk','saveImportedSongsToDestination','saveManualSongToDestination','saveManualNewSong','saveManualEditedSong','commitImportedDrafts'],legacyShellHost:true,nonDestructive:true};}

root.WBSongImportDestinationController={
  ugBackendBase:ugBackendBase,
  sopBackendBase:sopBackendBase,
  importBackendBase:importBackendBase,
  searchImportUrl:searchImportUrl,
  importUrl:importUrl,
  fetchJson:fetchJson,
  chooseImportDestination:chooseImportDestination,
  resolveImportDestination:resolveImportDestination,
  firebaseAvailableForImports:firebaseAvailableForImports,
  makeFirebaseSong:makeFirebaseSong,
  makeFirebasePayload:makeFirebasePayload,
  makeLocalPayload:makeLocalPayload,
  mergeRecentIds:mergeRecentIds,
  clearLibrarySearch:clearLibrarySearch,
  putFirebaseSongsBulk:putFirebaseSongsBulk,
  saveImportedSongsToDestination:saveImportedSongsToDestination,
  saveManualSongToDestination:saveManualSongToDestination,
  saveManualNewSong:saveManualNewSong,
  saveManualEditedSong:saveManualEditedSong,
  commitImportedDrafts:commitImportedDrafts,
  mapBackendSong:mapBackendSong,
  searchImport:searchImport,
  importFromUrl:importFromUrl,
  importResultByIdOrUrl:importResultByIdOrUrl,
  renderContract:renderContract,
  diagnostics:renderContract
};
})(window);
