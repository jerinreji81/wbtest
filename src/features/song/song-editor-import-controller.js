/* WorshipBase Phase 2b - I3 Song editor/import extraction boundary owner.
   Owns editor form helpers, editor history, song payload validation/commit helpers,
   and import duplicate review models while the legacy shell remains the temporary host. */
(function(root){
'use strict';

function fallbackEsc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
function asArray(v){return Array.isArray(v)?v:[];}
function str(v){return String(v==null?'':v);}
function trimmed(v){return str(v).trim();}
function call(fn){if(typeof fn==='function')return fn.apply(null,Array.prototype.slice.call(arguments,1));}
function qs(ctx,id){return ctx&&ctx.qs?ctx.qs(id):null;}
function qsa(ctx,sel,rootEl){return ctx&&ctx.qsa?ctx.qsa(sel,rootEl):[];}
function qv(ctx,id,def){return ctx&&ctx.qv?ctx.qv(id,def):(qs(ctx,id)?qs(ctx,id).value:def);}
function normalizeKey(ctx,key){return ctx&&ctx.normalizeKeyName?ctx.normalizeKeyName(key):trimmed(key||'C');}
function ensureSelectOption(select,value){if(!select||!value)return;var found=false;Array.prototype.slice.call(select.options||[]).forEach(function(o){if(String(o.value)===String(value))found=true;});if(!found){var opt=(select.ownerDocument||document).createElement('option');opt.value=value;opt.textContent=value;select.appendChild(opt);}}

function setSongCategory(cat,ctx){
  cat=cat==='malayalam'?'malayalam':'english';
  var hidden=qs(ctx,'song-form-category');
  if(hidden)hidden.value=cat;
  qsa(ctx,'[data-song-cat]').forEach(function(b){b.classList.toggle('active',b.dataset.songCat===cat);});
  return cat;
}
function clearSongForm(ctx){
  ['song-form-title','song-form-artist','song-form-code','song-form-time','song-form-bpm','song-form-spotify','song-form-youtube','song-form-chart'].forEach(function(id){var el=qs(ctx,id);if(el)el.value='';});
  var k=qs(ctx,'song-form-key');if(k){ensureSelectOption(k,'C');k.value='C';}var chartEl=qs(ctx,'song-form-chart');if(chartEl)chartEl.dataset.sourceKey='C';
  setSongCategory('english',ctx);
  resetEditorHistory('',ctx);
}
function fillSongForm(song,ctx){
  song=song||{};
  function set(id,v){var el=qs(ctx,id);if(el)el.value=v||'';}
  set('song-form-title',song.title);
  set('song-form-artist',song.artist||song.author);
  set('song-form-code',song.code);
  var displayKey=normalizeKey(ctx,song.key||song.displayKey||'C');var sourceKey=normalizeKey(ctx,song.chartKey||song.originalKey||song.sourceKey||song.key||displayKey||'C');var keySel=qs(ctx,'song-form-key');if(keySel){ensureSelectOption(keySel,displayKey);keySel.value=displayKey;}else set('song-form-key',displayKey);
  set('song-form-time',song.timeSig||song.time||'');
  set('song-form-bpm',song.bpm||'');
  set('song-form-spotify',song.spotifyUrl||song.spotify||'');
  set('song-form-youtube',song.youtubeUrl||song.youtube||'');
  set('song-form-chart',song.chart||'');var chartBox=qs(ctx,'song-form-chart');if(chartBox)chartBox.dataset.sourceKey=sourceKey;
  setSongCategory(song.cat||song.category||'english',ctx);
  resetEditorHistory(song.chart||'',ctx);
  if(ctx&&ctx.updateSongEditorPreview)ctx.updateSongEditorPreview();
}
function setSongEditorPane(mode,ctx){
  mode=mode==='preview'?'preview':'edit';
  qsa(ctx,'[data-song-editor-mode]').forEach(function(b){b.classList.toggle('active',b.dataset.songEditorMode===mode);});
  var editPane=qs(ctx,'song-editor-edit-pane'),previewPane=qs(ctx,'song-editor-preview-pane');
  if(editPane)editPane.classList.toggle('hidden',mode!=='edit');
  if(previewPane)previewPane.classList.toggle('hidden',mode!=='preview');
  if(mode==='preview'&&ctx&&ctx.updateSongEditorPreview)ctx.updateSongEditorPreview();
  return mode;
}
function previewChartForDisplay(chart,sourceKey,targetKey){
  var text=str(chart||'');
  var sk=normalizeKey(null,sourceKey||'C'),tk=normalizeKey(null,targetKey||sk||'C');
  if(!text||!sk||!tk||sk===tk)return text;
  return text.replace(/^(\s*Key\s+of\s+)([A-G](?:#|b)?)(\s*)$/im,function(_,pre,k,post){
    return pre+tk+post;
  }).replace(/^(\s*Key\s*[:=-]\s*)([A-G](?:#|b)?)(\s*)$/im,function(_,pre,k,post){
    return pre+tk+post;
  });
}
function updateSongEditorPreview(ctx){
  var title=trimmed(qv(ctx,'song-form-title','Untitled song'))||'Untitled song';
  var artist=trimmed(qv(ctx,'song-form-artist',''));
  var key=normalizeKey(ctx,str(qv(ctx,'song-form-key','C'))||'C');
  var chartEl=qs(ctx,'song-form-chart');
  var sourceKey=normalizeKey(ctx,(chartEl&&chartEl.dataset&&chartEl.dataset.sourceKey)||key||'C');
  var chart=str(qv(ctx,'song-form-chart',''))||'';
  var previewChart=previewChartForDisplay(chart,sourceKey,key);
  var bpm=trimmed(qv(ctx,'song-form-bpm',''));
  var time=trimmed(qv(ctx,'song-form-time',''));
  var titleEl=qs(ctx,'song-editor-preview-title');if(titleEl)titleEl.textContent=title;
  var metaEl=qs(ctx,'song-editor-preview-meta');
  if(metaEl)metaEl.textContent=[artist,'Key of '+key,time,bpm?bpm+' BPM':''].filter(Boolean).join(' · ');
  var body=qs(ctx,'song-editor-preview-body');
  if(body){
    body.innerHTML=chart.trim()&&ctx&&ctx.formatChartHtml?ctx.formatChartHtml(previewChart,'chords',{key:sourceKey,chartKey:sourceKey,originalKey:sourceKey,sourceKey:sourceKey,displayKey:key,title:title,artist:artist,chart:previewChart}):'<div class="preview-empty">Start typing to preview the chart.</div>';
  }
}

var editorHistory=[],editorHistoryIndex=-1,editorHistoryLock=false;
function resetEditorHistory(v,ctx){editorHistory=[v||''];editorHistoryIndex=0;updateEditorUndoRedo(ctx);}
function pushEditorHistory(ctx){
  if(editorHistoryLock)return;
  var el=qs(ctx,'song-form-chart');if(!el)return;
  var v=el.value;if(editorHistory[editorHistoryIndex]===v)return;
  editorHistory=editorHistory.slice(0,editorHistoryIndex+1);editorHistory.push(v);
  if(editorHistory.length>80)editorHistory.shift();
  editorHistoryIndex=editorHistory.length-1;updateEditorUndoRedo(ctx);
}
function updateEditorUndoRedo(ctx){var u=qs(ctx,'editor-undo-btn'),r=qs(ctx,'editor-redo-btn');if(u)u.disabled=editorHistoryIndex<=0;if(r)r.disabled=editorHistoryIndex>=editorHistory.length-1;}
function editorUndo(ctx){if(editorHistoryIndex<=0)return;var el=qs(ctx,'song-form-chart');if(!el)return;editorHistoryIndex--;editorHistoryLock=true;el.value=editorHistory[editorHistoryIndex]||'';editorHistoryLock=false;updateEditorUndoRedo(ctx);updateSongEditorPreview(ctx);}
function editorRedo(ctx){if(editorHistoryIndex>=editorHistory.length-1)return;var el=qs(ctx,'song-form-chart');if(!el)return;editorHistoryIndex++;editorHistoryLock=true;el.value=editorHistory[editorHistoryIndex]||'';editorHistoryLock=false;updateEditorUndoRedo(ctx);updateSongEditorPreview(ctx);}
function chartTextarea(ctx){return qs(ctx,'song-form-chart');}
function insertAtChart(text,ctx){var el=chartTextarea(ctx);if(!el)return;var s=el.selectionStart||0,e=el.selectionEnd||s,val=el.value;el.value=val.slice(0,s)+text+val.slice(e);var p=s+String(text||'').length;el.focus();el.setSelectionRange(p,p);pushEditorHistory(ctx);updateSongEditorPreview(ctx);}
function getNextEditorSectionNumber(label,ctx){var ta=chartTextarea(ctx),value=ta&&ta.value||'';if(label==='Verse'){var matches=value.match(/\[Verse(?:\s+(\d+))?\]/gi)||[],max=0;matches.forEach(function(item){var m=item.match(/\[Verse(?:\s+(\d+))?\]/i);max=Math.max(max,parseInt(m&&m[1]||'0',10)||0);});return Math.max(1,max+1);}return null;}
function insertSectionLabel(label,ctx){var ta=chartTextarea(ctx);if(!ta)return;var start=ta.selectionStart||0,before=(ta.value||'').slice(0,start),lineStart=before.lastIndexOf('\n')+1,atLineStart=start===lineStart,needsLeading=!!before&&!before.endsWith('\n')&&!atLineStart,prefix=needsLeading?'\n':'',num=getNextEditorSectionNumber(label,ctx),finalLabel=(label==='Verse'&&num)?(label+' '+num):label;insertAtChart(prefix+'['+finalLabel+'] ',ctx);}
function insertChordLine(ctx){var ta=chartTextarea(ctx);insertAtChart(((ta&&ta.value&&!(ta.value||'').endsWith('\n'))?'\n':'')+'C              G              D\n',ctx);}
function sectionBoundsAtCursor(ctx){var el=chartTextarea(ctx),txt=el?el.value:'';var p=el?el.selectionStart:0;var start=txt.lastIndexOf('\n[',Math.max(0,p-1));start=start<0?(txt[0]==='['?0:0):start+1;var next=txt.indexOf('\n[',p);var end=next<0?txt.length:next;return {start:start,end:end,text:txt.slice(start,end)};}
function duplicateCurrentSection(ctx){var el=chartTextarea(ctx);if(!el)return;var b=sectionBoundsAtCursor(ctx);var ins='\n'+b.text.trim()+'\n';el.value=el.value.slice(0,b.end)+ins+el.value.slice(b.end);pushEditorHistory(ctx);updateSongEditorPreview(ctx);}
function normalizeEditorSpacing(ctx){var el=chartTextarea(ctx);if(!el)return;el.value=el.value.replace(/[ \t]+$/gm,'').replace(/\n{3,}/g,'\n\n').trim()+"\n";pushEditorHistory(ctx);updateSongEditorPreview(ctx);}

function normalizeImportTitle(v){return str(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9\u0d00-\u0d7f]+/g,' ').trim();}
function normalizeImportArtist(v){return str(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\u0d00-\u0d7f]+/g,' ').trim();}
function normalizeSongCode(v){return trimmed(v).toUpperCase();}
function importCodeNext(songs){var n=asArray(songs).filter(function(x){return x&&x.source==='local'||/^L\d+/i.test(x&&x.code||'');}).length+1;return 'L'+String(n).padStart(3,'0');}
function safeTitleFromUrl(url){var u=str(url).split(/[?#]/)[0].split('/').filter(Boolean).pop()||'Imported song';try{u=decodeURIComponent(u);}catch(e){}return u.replace(/\.[a-z0-9]+$/i,'').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()||'Imported song';}
function songPayloadFromForm(ctx){
  var title=trimmed(qv(ctx,'song-form-title',''));
  var artist=trimmed(qv(ctx,'song-form-artist',''));
  var key=normalizeKey(ctx,str(qv(ctx,'song-form-key','C'))||'C');
  var chartEl=qs(ctx,'song-form-chart');
  var sourceKey=normalizeKey(ctx,(chartEl&&chartEl.dataset&&chartEl.dataset.sourceKey)||key||'C');
  var chart=str(qv(ctx,'song-form-chart','')).replace(/\r\n?/g,'\n').trim();
  var raw={title:title,artist:artist,code:trimmed(qv(ctx,'song-form-code','')),key:key,chartKey:sourceKey,originalKey:sourceKey,sourceKey:sourceKey,cat:str(qv(ctx,'song-form-category','english'))||'english',chart:chart,bpm:trimmed(qv(ctx,'song-form-bpm','')),timeSig:trimmed(qv(ctx,'song-form-time','')),spotifyUrl:trimmed(qv(ctx,'song-form-spotify','')),youtubeUrl:trimmed(qv(ctx,'song-form-youtube',''))};
  return ctx&&ctx.normalizeImportedSong?ctx.normalizeImportedSong(raw,'editor'):raw;
}
function validateSongPayload(song){if(!song||!trimmed(song.title))return 'Add a song title first.';if(!trimmed(song.chart))return 'Add lyrics/chords before saving.';if(song.bpm&&(!/^\d+$/.test(song.bpm)||+song.bpm<20||+song.bpm>260))return 'BPM should be between 20 and 260.';if(song.timeSig&&!/^\d+\s*\/\s*\d+$/.test(song.timeSig))return 'Time signature should look like 4/4.';return '';}
function commitSongPayload(song,replaceId,model,ctx){
  model=model||{};ctx=ctx||{};
  var payload=ctx.normalizeImportedSong?ctx.normalizeImportedSong(song,(song&&song.importSource)||'local'):Object.assign({},song||{});
  payload.code=payload.code||importCodeNext(model.songs);
  payload.source='local';delete payload.selected;
  model.localSongs=asArray(model.localSongs);
  model.songs=asArray(model.songs);
  if(replaceId){
    var existing=model.localSongs.find(function(s){return s&&s.id===replaceId;});
    if(existing){Object.assign(existing,payload,{id:existing.id,source:'local'});call(ctx.rebuildSongsCache);return asArray(ctx.songsGetter&&ctx.songsGetter()||model.songs).find(function(s){return s&&s.id===existing.id;})||existing;}
  }
  var normTitle=trimmed(payload.title).toLowerCase(),normArtist=trimmed(payload.artist||payload.author).toLowerCase(),normChart=str(payload.chart).replace(/\r\n?/g,'\n').trim();
  var duplicate=model.localSongs.find(function(s){return trimmed(s&&s.title).toLowerCase()===normTitle&&trimmed(s&& (s.artist||s.author)).toLowerCase()===normArtist&&str(s&&s.chart).replace(/\r\n?/g,'\n').trim()===normChart&&str(s&&s.key)===str(payload.key);});
  if(duplicate){Object.assign(duplicate,payload,{id:duplicate.id,source:'local'});call(ctx.rebuildSongsCache);return asArray(ctx.songsGetter&&ctx.songsGetter()||model.songs).find(function(s){return s&&s.id===duplicate.id;})||duplicate;}
  payload.id=payload.id||('local-song-'+Date.now()+'-'+Math.random().toString(36).slice(2,6));
  model.localSongs.push(payload);call(ctx.rebuildSongsCache);return asArray(ctx.songsGetter&&ctx.songsGetter()||model.songs).find(function(s){return s&&s.id===payload.id;})||payload;
}
function exactImportUpdateMatch(draft,songs){draft=draft||{};var importId=trimmed(draft.id||draft.importId);if(!importId)return null;return asArray(songs).find(function(s){return str(s&&s.id)===importId||str(s&&s.importId)===importId;})||null;}
function findImportDuplicates(draft,songs){
  draft=draft||{};var nt=normalizeImportTitle(draft.title),na=normalizeImportArtist(draft.artist||draft.author),code=normalizeSongCode(draft.code),importId=trimmed(draft.id||draft.importId);
  if(!nt&&!code)return [];
  return asArray(songs).filter(function(s){
    if(!s)return false;
    if(importId&&(str(s.id)===importId||str(s.importId)===importId))return false;
    var st=normalizeImportTitle(s.title),sa=normalizeImportArtist(s.artist||s.author),sc=normalizeSongCode(s.code);
    if(code&&sc&&code===sc)return true;
    if(nt&&st&&nt===st){if(!na&&!sa)return true;if(na&&sa)return na===sa||sa.indexOf(na)>=0||na.indexOf(sa)>=0;return false;}
    return false;
  }).slice(0,3);
}
function importDraftReviewStatus(draft,songs){
  if(!draft||draft.selected===false)return {kind:'skipped',label:'Skipped',match:null};
  var update=exactImportUpdateMatch(draft,songs);if(update)return {kind:'updated',label:'Updated',match:update};
  var dup=findImportDuplicates(draft,songs);if(dup&&dup.length)return {kind:'duplicate',label:'Duplicate',match:dup[0]};
  return {kind:'new',label:'New',match:null};
}
function importDraftStatusCounts(rows,songs){var counts={new:0,duplicate:0,updated:0,skipped:0};asArray(rows).forEach(function(s){var st=importDraftReviewStatus(s,songs).kind;counts[st]=(counts[st]||0)+1;});return counts;}
function prepareImportedSongBatch(drafts,opts,ctx){
  ctx=ctx||{};opts=opts||{};
  var normalized=asArray(drafts).map(function(d){return ctx.normalizeImportedSong?ctx.normalizeImportedSong(d,(opts&&opts.source)||(d&&d.importSource)||'file'):d;}).filter(function(d){return d&&d.title&&d.chart;});
  if(!normalized.length)return {toast:'Nothing to save',drafts:[],dupes:[],opts:opts};
  var issues=[];
  normalized.forEach(function(d,i){var err=validateSongPayload(d);if(err)issues.push((d.title||('Song '+(i+1)))+': '+err);});
  if(issues.length)return {toast:issues[0],drafts:normalized,dupes:[],opts:opts};
  normalized.forEach(function(d){var update=exactImportUpdateMatch(d,ctx.songs);if(update)d._decision='replace:'+update.id;});
  var dupes=normalized.map(function(d){return d._decision&&d._decision.indexOf('replace:')===0?null:{draft:d,matches:findImportDuplicates(d,ctx.songs),decision:'skip'};}).filter(function(x){return x&&x.matches.length;});
  return {toast:'',drafts:normalized,dupes:dupes,opts:opts};
}
function duplicateReviewView(allDrafts,dupes,ctx){
  ctx=ctx||{};var esc=ctx.esc||fallbackEsc;
  var counts=ctx.importReviewCounts?ctx.importReviewCounts(allDrafts||[],function(d){return importDraftReviewStatus(d,ctx.songs);}):importDraftStatusCounts(allDrafts||[],ctx.songs);
  var hint=ctx.importReviewSummary?ctx.importReviewSummary(allDrafts||[],dupes,function(d){return importDraftReviewStatus(d,ctx.songs);}):('Review before saving: New '+(counts.new||0)+' · Duplicate '+asArray(dupes).length+' · Updated '+(counts.updated||0)+' · Skipped '+(counts.skipped||0)+'. Choose what to do with each duplicate.');
  var html=asArray(dupes).map(function(item,i){var m=item.matches[0]||{};return '<div class="import-dup-card" data-dup-index="'+i+'"><div class="import-dup-card-head"><div class="import-dup-card-title">'+esc(item.draft.title)+'</div><div class="import-dup-card-meta">Incoming · '+esc(item.draft.artist||'Unknown')+' · Key '+esc(item.draft.key||'C')+'</div></div><div class="import-dup-match"><div class="import-dup-match-title">Possible match: '+esc(m.title||'Existing song')+'</div><div class="import-dup-match-meta">'+esc((m.artist||'Unknown')+' · '+(m.code||'')+' · Key '+(m.key||'C'))+'</div></div><div class="import-dup-actions"><button class="import-dup-choice active" data-dup-choice="skip" type="button">Keep existing</button><button class="import-dup-choice" data-dup-choice="import" type="button">Import copy</button><button class="import-dup-choice danger" data-dup-choice="replace:'+esc(m.id||'')+'" type="button">Replace</button></div><div class="import-dup-note">Default keeps the existing song. Choose Import copy if this is a different arrangement.</div></div>';}).join('');
  return {hint:hint,html:html};
}
function renderContract(){return {phase:'Phase 2b - I3',owner:'WBSongEditorImportController',contracts:['clearSongForm','fillSongForm','songPayloadFromForm','validateSongPayload','commitSongPayload','prepareImportedSongBatch','duplicateReviewView','findImportDuplicates','importDraftStatusCounts'],legacyShellHost:true,nonDestructive:true};}

root.WBSongEditorImportController={
  clearSongForm:clearSongForm,
  fillSongForm:fillSongForm,
  setSongCategory:setSongCategory,
  setSongEditorPane:setSongEditorPane,
  updateSongEditorPreview:updateSongEditorPreview,
  resetEditorHistory:resetEditorHistory,
  pushEditorHistory:pushEditorHistory,
  updateEditorUndoRedo:updateEditorUndoRedo,
  editorUndo:editorUndo,
  editorRedo:editorRedo,
  chartTextarea:chartTextarea,
  insertAtChart:insertAtChart,
  getNextEditorSectionNumber:getNextEditorSectionNumber,
  insertSectionLabel:insertSectionLabel,
  insertChordLine:insertChordLine,
  sectionBoundsAtCursor:sectionBoundsAtCursor,
  duplicateCurrentSection:duplicateCurrentSection,
  normalizeEditorSpacing:normalizeEditorSpacing,
  normalizeImportTitle:normalizeImportTitle,
  normalizeImportArtist:normalizeImportArtist,
  normalizeSongCode:normalizeSongCode,
  importCodeNext:importCodeNext,
  safeTitleFromUrl:safeTitleFromUrl,
  songPayloadFromForm:songPayloadFromForm,
  validateSongPayload:validateSongPayload,
  commitSongPayload:commitSongPayload,
  exactImportUpdateMatch:exactImportUpdateMatch,
  importDraftReviewStatus:importDraftReviewStatus,
  importDraftStatusCounts:importDraftStatusCounts,
  findImportDuplicates:findImportDuplicates,
  prepareImportedSongBatch:prepareImportedSongBatch,
  duplicateReviewView:duplicateReviewView,
  renderContract:renderContract,
  diagnostics:renderContract
};
})(window);
