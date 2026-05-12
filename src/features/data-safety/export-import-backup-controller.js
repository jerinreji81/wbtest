/* WorshipBase Phase 2b data-safety operation controller.
   Source of truth for data-safety operation contracts that span export, import,
   backup, restore review, notes/cues, and PDF/export handoff.

   Phase 2b rule: legacy handlers may still collect DOM events temporarily, but
   common export/import/backup/PDF concrete operations should be described here
   instead of being redefined differently across Settings, Backup Centre, Import
   Review, and PDF flows. */
(function(root){
'use strict';

function asArray(value){return Array.isArray(value)?value:[];}
function asObject(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function clone(value,fallback){
  try{return JSON.parse(JSON.stringify(value));}
  catch(e){return fallback===undefined?value:fallback;}
}
function nowIso(){try{return new Date().toISOString();}catch(e){return '';}}
function countObjectKeys(obj){obj=asObject(obj);return Object.keys(obj).length;}
function call(fn){
  if(typeof fn!=='function')return undefined;
  var args=Array.prototype.slice.call(arguments,1);
  return fn.apply(null,args);
}
function ensureSetShape(set){
  set=asObject(set);
  var out=clone(set,{});
  out.items=asArray(out.items);
  out.songNotes=asObject(out.songNotes);
  out.songCues=asObject(out.songCues);
  out.setNotes=String(out.setNotes||'');
  return out;
}
function stateSongs(state){state=asObject(state);return asArray(state.localSongs||state.songs);}
function statePersonalSets(state){state=asObject(state);return asArray(state.personalSets||state.sets);}
function stateSongMemory(state){state=asObject(state);return asObject(state.songMemory);}
function stateRecents(state){state=asObject(state);return asArray(state.recentIds||state.recents);}
function stateVersion(options){options=asObject(options);return String(options.version||((root.WBConstants||{}).VERSION)||'');}
function stamp(options){options=asObject(options);return options.exportedAt||nowIso();}
function notesForSet(set){
  set=ensureSetShape(set);
  return countObjectKeys(set.songNotes)+countObjectKeys(set.songCues)+(set.setNotes?1:0);
}
function notesForSets(sets){return asArray(sets).reduce(function(total,set){return total+notesForSet(set);},0);}
function backupKind(kind){
  kind=String(kind||'full').toLowerCase();
  if(kind==='everything'||kind==='all')return 'full';
  if(kind==='songs'||kind==='my-songs')return 'songs';
  if(kind==='sets'||kind==='setlists'||kind==='set-lists')return 'sets';
  if(kind==='settings'||kind==='notes'||kind==='notes-cues')return 'settings';
  return 'full';
}
function buildBackupSummary(state,kind){
  state=asObject(state);kind=backupKind(kind);
  var localSongs=stateSongs(state);
  var personalSets=statePersonalSets(state);
  var songMemory=stateSongMemory(state);
  var recentIds=stateRecents(state);
  var all={songs:localSongs.length,sets:personalSets.length,notes:notesForSets(personalSets),settings:true,recents:recentIds.length};
  if(kind==='songs')return {songs:all.songs,sets:0,notes:countObjectKeys(songMemory),settings:false,recents:0};
  if(kind==='sets')return {songs:0,sets:all.sets,notes:all.notes,settings:false,recents:0};
  if(kind==='settings')return {songs:0,sets:0,notes:0,settings:true,recents:all.recents};
  return all;
}
function buildLocalBackupPayload(state,options){
  state=asObject(state);options=asObject(options);
  return {
    format:options.format||'worshipbase-rebuild-backup',
    version:stateVersion(options),
    schema:options.schema||3,
    exportedAt:stamp(options),
    songs:clone(stateSongs(state),[]),
    songMemory:clone(stateSongMemory(state),{}),
    personalSets:clone(statePersonalSets(state),[]),
    recentIds:clone(stateRecents(state),[]),
    activeSetId:String(state.activeSetId||''),
    settings:clone(asObject(state.settings),{}),
    workspaceSummary:options.workspaceSummary||{included:false,reason:'Workspace and Firebase library data are shared cloud data and are not part of local backup.'}
  };
}
function buildBackupPayload(kind,state,options){
  kind=backupKind(kind);state=asObject(state);options=asObject(options);
  var exportedAt=stamp(options),version=stateVersion(options);
  if(kind==='songs')return {format:'worshipbase-rebuild-songs',version:version,schema:3,exportedAt:exportedAt,songs:clone(stateSongs(state),[]),songMemory:clone(stateSongMemory(state),{})};
  if(kind==='sets')return {format:'worshipbase-rebuild-setlists',version:version,schema:2,exportedAt:exportedAt,personalSets:clone(statePersonalSets(state),[]),activeSetId:String(state.activeSetId||'')};
  if(kind==='settings')return {format:'worshipbase-rebuild-settings',version:version,schema:2,exportedAt:exportedAt,settings:clone(asObject(state.settings),{}),recentIds:clone(stateRecents(state),[]),activeSetId:String(state.activeSetId||'')};
  return buildLocalBackupPayload(state,Object.assign({},options,{exportedAt:exportedAt,version:version}));
}
function backupFilename(kind,stampText){
  kind=backupKind(kind);stampText=String(stampText||nowIso().replace(/[:.]/g,'-'));
  if(kind==='songs')return 'worshipbase-rebuild-songs-'+stampText+'.json';
  if(kind==='sets')return 'worshipbase-rebuild-setlists-'+stampText+'.json';
  if(kind==='settings')return 'worshipbase-rebuild-settings-'+stampText+'.json';
  return 'worshipbase-rebuild-backup-'+stampText+'.json';
}
function backupHistoryEntry(kind,payload,summary){
  kind=backupKind(kind);payload=asObject(payload);summary=asObject(summary);
  var map={
    full:{label:'Export Everything',detail:'Downloaded full personal backup JSON.'},
    songs:{label:'Export My Songs',detail:'Downloaded songs and song memory JSON.'},
    sets:{label:'Export Set Lists',detail:'Downloaded personal set lists JSON.'},
    settings:{label:'Export Notes & Cues',detail:'Downloaded settings, recents and note/cue metadata JSON.'}
  };
  var picked=map[kind]||map.full;
  return {kind:'Local file',label:picked.label,detail:picked.detail,when:payload.exportedAt||nowIso(),summary:summary};
}
function backupToastMessage(kind){
  kind=backupKind(kind);
  if(kind==='songs')return 'Songs backup created';
  if(kind==='sets')return 'Set list backup created';
  if(kind==='settings')return 'Settings backup created';
  return 'Local backup created';
}
function localBackupOperation(kind,state,env,options){
  env=asObject(env);options=asObject(options);kind=backupKind(kind);
  var payload=buildBackupPayload(kind,state,options);
  var summary=buildBackupSummary(state,kind);
  var stampText=call(env.backupStamp)||String(payload.exportedAt||nowIso()).replace(/[:.]/g,'-');
  return {kind:kind,payload:payload,summary:summary,filename:backupFilename(kind,stampText),history:backupHistoryEntry(kind,payload,summary),message:backupToastMessage(kind)};
}
function performLocalBackup(kind,state,env,options){
  env=asObject(env);
  var op=localBackupOperation(kind,state,env,options);
  if(op.kind==='full')call(env.safeSet,'wb_rebuild_52_last_backup_at',op.payload.exportedAt);
  call(env.recordBackupHistory,op.history);
  call(env.downloadTextFile,op.filename,JSON.stringify(op.payload,null,2),'application/json');
  if(op.kind==='full')call(env.renderSettings);
  call(env.showToast,op.message);
  return op;
}
function sourceSongsExportPayload(source,sourceSongs,options){
  source=source==='firebase'?'firebase':'local';options=asObject(options);
  return {format:'worshipbase-song-source-export',version:stateVersion(options),source:source,exportedAt:stamp(options),songs:clone(asArray(sourceSongs),[])};
}
function sourceSongsExportOperation(source,sourceSongs,env,options){
  env=asObject(env);source=source==='firebase'?'firebase':'local';
  var payload=sourceSongsExportPayload(source,sourceSongs,options);
  var stampText=call(env.backupStamp)||String(payload.exportedAt||nowIso()).replace(/[:.]/g,'-');
  var filename='worshipbase-'+(source==='firebase'?'firebase-cache':'my-songs')+'-'+stampText+'.json';
  call(env.downloadTextFile,filename,JSON.stringify(payload,null,2),'application/json');
  return {payload:payload,filename:filename,source:source};
}
function importReviewCounts(rows,reviewFn){
  var counts={new:0,duplicate:0,updated:0,skipped:0};
  asArray(rows).forEach(function(row){
    var status='new';
    try{status=reviewFn?((reviewFn(row)||{}).kind||'new'):(row&&row.selected===false?'skipped':(row&&row._decision&&String(row._decision).indexOf('replace:')===0?'updated':'new'));}
    catch(e){status='new';}
    if(!counts.hasOwnProperty(status))counts[status]=0;
    counts[status]++;
  });
  return counts;
}
function importReviewSummary(rows,dupes,reviewFn){
  var counts=importReviewCounts(rows,reviewFn);
  if(dupes!==undefined)counts.duplicate=asArray(dupes).length;
  return 'Review before saving: New '+(counts.new||0)+' · Duplicate '+(counts.duplicate||0)+' · Updated '+(counts.updated||0)+' · Skipped '+(counts.skipped||0)+'. Choose what to do with each duplicate.';
}
function notesCuesExportPayload(state){
  state=asObject(state);
  return {
    format:'worshipbase-notes-cues',
    version:String(state.version||((root.WBConstants||{}).VERSION)||''),
    exportedAt:state.exportedAt||nowIso(),
    personalSets:asArray(state.personalSets).map(function(s){s=ensureSetShape(s);return {id:s.id,name:s.name,setNotes:s.setNotes||'',songNotes:clone(s.songNotes,{}),songCues:clone(s.songCues,{})};}),
    workspaceSets:asArray(state.workspaceSets).map(function(s){s=ensureSetShape(s);return {id:s.id,name:s.name,setNotes:s.setNotes||'',songNotes:clone(s.songNotes,{}),songCues:clone(s.songCues,{})};})
  };
}
function notesCuesExportOperation(state,env){
  env=asObject(env);
  var payload=notesCuesExportPayload(state);
  var stampText=call(env.backupStamp)||String(payload.exportedAt||nowIso()).replace(/[:.]/g,'-');
  var filename='worshipbase-notes-cues-'+stampText+'.json';
  call(env.downloadTextFile,filename,JSON.stringify(payload,null,2),'application/json');
  return {payload:payload,filename:filename};
}
function applyNotesCuesPayload(data,state){
  data=asObject(data);state=asObject(state);
  var personalSets=asArray(state.personalSets);
  var workspaceSets=asArray(state.workspaceSets);
  var changed=0;
  function applyTo(list,src){
    src=asObject(src);
    var set=asArray(list).find(function(x){return x&&(String(x.id||'')===String(src.id||'')||String(x.name||'')===String(src.name||''));});
    if(!set)return;
    set.setNotes=src.setNotes||set.setNotes||'';
    set.songNotes=Object.assign({},asObject(set.songNotes),asObject(src.songNotes));
    set.songCues=Object.assign({},asObject(set.songCues),asObject(src.songCues));
    changed++;
  }
  asArray(data.personalSets).forEach(function(src){applyTo(personalSets,src);});
  asArray(data.workspaceSets).forEach(function(src){applyTo(workspaceSets,src);});
  return {changed:changed,personalSets:personalSets,workspaceSets:workspaceSets};
}
function importNotesCuesJsonOperation(text,state,env){
  env=asObject(env);
  var data=JSON.parse(String(text||'{}'));
  var res=applyNotesCuesPayload(data,state);
  call(env.persistSets);
  call(env.persistWorkspace);
  call(env.renderPersonalHome);
  call(env.renderWorkspaceSetLists);
  call(env.renderSettings);
  call(env.showToast,res.changed?('Notes/cues restored for '+res.changed+' set'+(res.changed===1?'':'s')):'No matching sets found');
  return res;
}
function restoreReviewModel(plan,current,selection){
  var restore=root.WBRestoreReviewController||{};
  var counts=restore.counts?restore.counts(plan):{};
  var rows=restore.comparisonRows?restore.comparisonRows(current,counts):[];
  return {plan:plan||{},counts:counts,current:current||{},selection:selection||{},comparisonRows:rows,selectedSummary:restore.selectedSummary?restore.selectedSummary(selection):'',fewerMessages:restore.fewerMessages?restore.fewerMessages(current,counts,selection):[]};
}
function exportOperationModel(subject,env,options){
  var model=root.WBSetExportModel||{};
  var pdf=root.WBExportPdfFormatController||{};
  return {
    subject:subject||{},
    exportModel:model.buildSetExportModel?model.buildSetExportModel(subject,env||{}):null,
    previewLines:model.exportPreviewLines?model.exportPreviewLines(subject,env||{}):'',
    formatContract:pdf.buildFormatContract?pdf.buildFormatContract(options||{}):null
  };
}
function openPdfPreview(env){
  env=asObject(env);
  call(env.installStyle);
  var qs=env.qs||function(id){return root.document&&root.document.getElementById(id);};
  var v=qs('wb-export-pdf-preview-view'),pages=qs('wb-export-preview-pages'),title=qs('wb-export-preview-title'),scroll=qs('wb-export-preview-scroll'),subject=call(env.subject)||{};
  if(!v||!pages)return {ok:false,reason:'missing-preview-elements',plan:null};
  if(title)title.textContent=subject.kind==='song'?'Song PDF Preview':'Set List PDF Preview';
  v.classList.add('open');v.setAttribute('aria-hidden','false');
  if(scroll)scroll.scrollTop=0;
  try{
    var plan=call(env.buildPlan);
    pages.innerHTML=call(env.renderPlan,plan)||'';
    return {ok:true,plan:plan};
  }catch(err){
    try{root.console&&root.console.warn&&root.console.warn('Export preview render error',err);}catch(e){}
    pages.innerHTML='<div class="wb-export-preview-error"><div>Preview could not render.</div><small>'+call(env.escape,(err&&err.message)||'Unknown export error')+'</small></div>';
    call(env.showToast,'Preview needs attention');
    return {ok:false,error:err,plan:null};
  }
}
function isAppleTouchDevice(){
  var nav=root.navigator||{},ua=nav.userAgent||'';
  return /iPad|iPhone|iPod/.test(ua)||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1);
}
function pdfFilename(plan,safeFilename){
  safeFilename=typeof safeFilename==='function'?safeFilename:function(s){return String(s||'WorshipBase').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().slice(0,80)||'WorshipBase';};
  return safeFilename(plan&&plan.title||'WorshipBase')+' - WorshipBase.pdf';
}
async function savePdfPlan(env){
  env=asObject(env);
  var plan=env.plan||call(env.buildPlan);
  var blob=call(env.planToBlob,plan);
  var name=pdfFilename(plan,env.safeFilename);
  var doc=env.document||root.document,nav=root.navigator||{},urlApi=root.URL||root.webkitURL,file=null,isAppleTouch=isAppleTouchDevice();
  try{if(typeof root.File!=='undefined')file=new root.File([blob],name,{type:'application/pdf',lastModified:Date.now()});}catch(e){}
  function fallbackDownload(){
    if(isAppleTouch){call(env.showToast,'PDF share unavailable in this browser');return;}
    if(!doc||!urlApi||!blob){call(env.showToast,'PDF unavailable');return;}
    var url=urlApi.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download=name;a.target='_blank';doc.body.appendChild(a);a.click();a.remove();root.setTimeout(function(){try{urlApi.revokeObjectURL(url)}catch(e){}},60000);call(env.showToast,'PDF downloaded');
  }
  try{
    if(file&&nav.share&&(!nav.canShare||nav.canShare({files:[file]}))){
      await nav.share({files:[file]});
      call(env.showToast,'PDF shared');
      return {shared:true,downloaded:false,fileName:name};
    }
    if(file&&nav.share&&isAppleTouch){
      await nav.share({files:[file]});
      call(env.showToast,'PDF shared');
      return {shared:true,downloaded:false,fileName:name};
    }
  }catch(err){
    if(err&&err.name==='AbortError')return {cancelled:true,fileName:name};
    try{root.console&&root.console.warn&&root.console.warn('PDF native share failed',err);}catch(e){}
  }
  fallbackDownload();
  return {shared:false,downloaded:!isAppleTouch,fileName:name};
}
function operationContract(){
  return {
    owner:'WBDataSafetyController',
    phase:'Phase 2b - G2',
    export:['buildBackupPayload','localBackupOperation','performLocalBackup','sourceSongsExportOperation','exportOperationModel','openPdfPreview','savePdfPlan'],
    import:['importReviewCounts','importReviewSummary','applyNotesCuesPayload','importNotesCuesJsonOperation'],
    backup:['buildLocalBackupPayload','buildBackupSummary','buildBackupPayload','performLocalBackup','restoreReviewModel'],
    restore:['restoreReviewModel'],
    notesCues:['notesCuesExportPayload','notesCuesExportOperation','applyNotesCuesPayload','importNotesCuesJsonOperation'],
    guarantee:'Common export/import/backup/PDF concrete operations live behind one data-safety owner while remaining legacy DOM handlers act as temporary adapters.'
  };
}
function diagnostics(){return {owner:'WBDataSafetyController',phase:'Phase 2b - G2',contract:operationContract(),nonDestructive:true,methods:['buildBackupSummary','buildLocalBackupPayload','buildBackupPayload','localBackupOperation','performLocalBackup','sourceSongsExportPayload','sourceSongsExportOperation','importReviewCounts','importReviewSummary','notesCuesExportPayload','notesCuesExportOperation','applyNotesCuesPayload','importNotesCuesJsonOperation','restoreReviewModel','exportOperationModel','openPdfPreview','savePdfPlan']};}

root.WBDataSafetyController={
  buildBackupSummary:buildBackupSummary,
  buildLocalBackupPayload:buildLocalBackupPayload,
  buildBackupPayload:buildBackupPayload,
  localBackupOperation:localBackupOperation,
  performLocalBackup:performLocalBackup,
  sourceSongsExportPayload:sourceSongsExportPayload,
  sourceSongsExportOperation:sourceSongsExportOperation,
  importReviewCounts:importReviewCounts,
  importReviewSummary:importReviewSummary,
  notesCuesExportPayload:notesCuesExportPayload,
  notesCuesExportOperation:notesCuesExportOperation,
  applyNotesCuesPayload:applyNotesCuesPayload,
  importNotesCuesJsonOperation:importNotesCuesJsonOperation,
  restoreReviewModel:restoreReviewModel,
  exportOperationModel:exportOperationModel,
  openPdfPreview:openPdfPreview,
  savePdfPlan:savePdfPlan,
  operationContract:operationContract,
  diagnostics:diagnostics
};
})(window);
