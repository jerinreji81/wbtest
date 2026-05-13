/* WorshipBase Phase 2b - E1 shared set editor owner.
   Owns shared Personal/Workspace set editor render models and HTML fragments.
   Scope adapters remain in the legacy shell for this phase; this module centralises
   repeated set-list card/editor markup so Personal and Workspace stop drifting. */
(function(root){
'use strict';

function asArray(value){return Array.isArray(value)?value:[];}
function asObject(value){return value&&typeof value==='object'?value:{};}
function escapeHtml(value){
  return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function getEsc(options){options=options||{};return typeof options.escape==='function'?options.escape:escapeHtml;}
function normalizeScope(scope){scope=String(scope||'personal').toLowerCase();return scope==='workspace'?'workspace':'personal';}
function itemCount(set){set=asObject(set);var items=asArray(set.items);return {
  songs:items.filter(function(item){return item&&item.type==='song';}).length,
  items:items.filter(function(item){return item&&item.type!=='song';}).length
};}
function fallbackCountLabel(set){var c=itemCount(set);return c.songs+' '+(c.songs===1?'song':'songs')+' · '+c.items+' '+(c.items===1?'item':'items');}
function hasAnyNotes(set){
  set=asObject(set);
  if(String(set.setNotes||'').trim())return true;
  var notes=asObject(set.songNotes),cues=asObject(set.songCues);
  return Object.keys(notes).some(function(id){return String(notes[id]||'').trim();})||
         Object.keys(cues).some(function(id){return String(cues[id]||'').trim();});
}
function callOr(options,name,args,fallback){
  options=options||{};
  if(typeof options[name]==='function'){
    try{return options[name].apply(null,args||[]);}catch(e){}
  }
  return typeof fallback==='function'?fallback():fallback;
}
function setName(set){set=asObject(set);return set.name||set.title||'Untitled set';}
function setId(set){set=asObject(set);return String(set.id||'');}
function notesPill(set,scope){return hasAnyNotes(set)?'<span class="wb-note-pill '+(scope==='workspace'?'workspace-pill':'')+'">Notes</span>':'';}

function listCard(scope,set,options){
  scope=normalizeScope(scope);set=asObject(set);options=options||{};
  var esc=getEsc(options);
  var id=esc(setId(set));
  var count=esc(callOr(options,'countLabel',[set],function(){return fallbackCountLabel(set);}));
  var updated=esc(callOr(options,'dateLabel',[set],function(){return set.updated||'Updated now';}));
  var name=esc(setName(set));
  var note=notesPill(set,scope);
  if(scope==='workspace'){
    return '<div class="workspace-subview-card wb-personal-card" data-workspace-set="'+id+'" role="button" tabindex="0"><span class="wb-personal-main workspace-card-main"><span class="wb-personal-name workspace-subview-name">'+name+'</span><span class="wb-personal-card-meta workspace-subview-meta"><span>'+count+'</span>'+note+'<span>'+updated+'</span></span></span><span class="workspace-card-actions wb-personal-actions"><button class="wb-card-btn danger" data-workspace-delete="'+id+'" type="button" aria-label="Delete set">×</button></span></div>';
  }
  return '<div class="wb-personal-card" role="button" tabindex="0" data-set-id="'+id+'"><span class="wb-personal-main"><span class="wb-personal-name">'+name+'</span><span class="wb-personal-card-meta"><span>'+count+'</span>'+note+'<span>'+updated+'</span></span></span><span class="wb-personal-actions"><button class="wb-card-btn danger" data-delete-set="'+id+'" type="button" aria-label="Delete set">×</button></span></div>';
}
function listCards(scope,sets,options){
  scope=normalizeScope(scope);sets=asArray(sets);options=options||{};
  var html=sets.map(function(set){return listCard(scope,set,options);}).join('');
  if(html)return html;
  if(scope==='workspace')return '<div class="workspace-empty-card">No Workspace set lists yet. Publish a personal set or create a shared plan.</div>';
  return '<div class="wb-personal-empty"><strong>No set lists yet</strong><div>Create your first personal set list.</div></div>';
}
function languageBadge(song){return song&&song.cat==='malayalam'?'ML':'EN';}
function resolveSongKey(set,item,song,options){return callOr(options,'resolveSetItemKey',[set,item,song],function(){return (item&&item.key)||(set&&set.setKey)||((song&&song.key)||'Original');});}
function explicitSongKey(item,options){return !!callOr(options,'itemHasExplicitKey',[item],function(){return !!(item&&(item.key||item.selectedKey||item.setKey||item.overrideKey));});}
function songCodeFor(song,options){return callOr(options,'songCode',[song],function(){return song&&song.code?String(song.code):'';});}

function dragHandle(label,esc){return '<div class="drag-handle" role="button" tabindex="0" aria-label="Reorder '+esc(label||'item')+'"><span></span><span></span><span></span></div>';}
function noteCueChips(set,song){
  set=asObject(set);song=asObject(song);
  var note=asObject(set.songNotes)[song.id],cue=asObject(set.songCues)[song.id];
  return (note?'<span class="set-note-chip">Note</span>':'')+(cue?'<span class="set-cue-chip">Cue</span>':'');
}
function songItemHtml(scope,set,item,idx,song,options){
  scope=normalizeScope(scope);set=asObject(set);item=asObject(item);song=asObject(song);options=options||{};
  var esc=getEsc(options);
  var idxAttr=scope==='workspace'?'data-workspace-index':'data-set-index';
  var keyAttr=scope==='workspace'?'data-workspace-key':'data-key-index';
  var rmAttr=scope==='workspace'?'data-workspace-remove':'data-remove-index';
  var scopeClass=scope==='workspace'?' workspace-song-item':'';
  var songId=esc(song.id||item.songId||'');
  var title=esc(song.title||'Untitled song');
  var artist=esc(song.artist||(scope==='workspace'?'Unknown':''));
  var key=esc(resolveSongKey(set,item,song,options));
  var hasKey=explicitSongKey(item,options)?' has-item-key':'';
  var code=esc(songCodeFor(song,options));
  var meta='<div class="set-code-row"><span class="set-song-code">'+code+'</span><span class="lang-badge">'+languageBadge(song)+'</span>'+noteCueChips(set,song)+'</div>';
  return '<div class="set-card song-set-card'+scopeClass+'" '+idxAttr+'="'+idx+'" data-song-id="'+songId+'">'+dragHandle(song.title||'song',esc)+'<div class="set-info"><div class="set-title">'+title+'</div><div class="set-meta">'+artist+'</div>'+meta+'</div><button class="set-key-btn'+hasKey+'" '+keyAttr+'="'+idx+'" type="button" aria-label="Choose key for '+title+'">Key '+key+'</button><button class="set-rm" '+rmAttr+'="'+idx+'" type="button">×</button></div>';
}
function sectionItemHtml(scope,item,idx,options){
  scope=normalizeScope(scope);item=asObject(item);var esc=getEsc(options||{});
  var idxAttr=scope==='workspace'?'data-workspace-index':'data-set-index';
  var rmAttr=scope==='workspace'?'data-workspace-remove':'data-remove-index';
  var extra=scope==='workspace'?' workspace-section-item':'';
  return '<div class="set-section-card set-section-item'+extra+'" '+idxAttr+'="'+idx+'">'+dragHandle('section',esc)+'<div class="set-section-title">'+esc(item.title||item.label||'SECTION')+'</div><button class="set-rm" '+rmAttr+'="'+idx+'" type="button">×</button></div>';
}
function textItemHtml(scope,item,idx,options){
  scope=normalizeScope(scope);item=asObject(item);var esc=getEsc(options||{});
  var idxAttr=scope==='workspace'?'data-workspace-index':'data-set-index';
  var rmAttr=scope==='workspace'?'data-workspace-remove':'data-remove-index';
  var extra=scope==='workspace'?' workspace-text-item':'';
  return '<div class="set-card text-set-card'+extra+'" '+idxAttr+'="'+idx+'">'+dragHandle('service item',esc)+'<div class="set-info"><div class="set-title">'+esc(item.title||'Service item')+'</div><div class="set-meta">'+esc(item.note||item.sub||'')+'</div></div><button class="set-rm" '+rmAttr+'="'+idx+'" type="button">×</button></div>';
}
function findSong(songs,id){songs=asArray(songs);id=String(id||'');return songs.find(function(song){return song&&String(song.id)===id;})||null;}
function editorItemHtml(scope,set,item,idx,songs,options){
  scope=normalizeScope(scope);set=asObject(set);item=asObject(item);songs=asArray(songs);options=options||{};
  if(item.type==='section')return sectionItemHtml(scope,item,idx,options);
  if(item.type==='item'||item.type==='text')return textItemHtml(scope,item,idx,options);
  var song=findSong(songs,item.songId);
  if(!song)return '';
  return songItemHtml(scope,set,item,idx,song,options);
}
function editorItemsHtml(scope,set,songs,options){
  set=asObject(set);var html=asArray(set.items).map(function(item,idx){return editorItemHtml(scope,set,item,idx,songs,options);}).join('');
  if(html)return html;
  return normalizeScope(scope)==='workspace'?'<div class="workspace-empty-card">No items in this Workspace set yet.</div>':'<div class="sl-empty"><strong>No songs in this set list</strong><div>Use the add button or set options to build a service set.</div></div>';
}
function notesIconSvg(){return '<svg fill="none" height="17" viewBox="0 0 17 17" width="17"><path d="M4 2.5h9v12H4z" stroke="currentColor" stroke-width="1.4"></path><path d="M6.5 6h4M6.5 8.5h4M6.5 11h2.8" stroke="currentColor" stroke-linecap="round" stroke-width="1.4"></path></svg>';}
function moreIconSvg(){return '<svg fill="none" height="4" viewBox="0 0 18 4" width="18"><circle cx="2" cy="2" fill="currentColor" r="2"></circle><circle cx="9" cy="2" fill="currentColor" r="2"></circle><circle cx="16" cy="2" fill="currentColor" r="2"></circle></svg>';}
function toolbarHtml(scope,set,options){
  scope=normalizeScope(scope);set=asObject(set);options=options||{};var esc=getEsc(options);
  var count=esc(callOr(options,'countLabel',[set],function(){return fallbackCountLabel(set);}));
  var key=esc(callOr(options,'keyLabel',[set],function(){return 'Default: '+(set.setKey||'Original');}));
  var id=esc(setId(set));
  var notesClass=String(set.setNotes||'').trim()?' has-notes':'';
  if(scope==='workspace'){
    return '<div class="workspace-editor-toolbar sl-hdr workspace-sl-hdr"><div class="sl-hdr-meta workspace-editor-meta"><span id="workspace-editor-count" class="workspace-editor-count">'+count+'</span><button id="workspace-editor-key" class="workspace-editor-key sl-set-key-info" data-workspace-set-key type="button">'+key+'</button></div><div class="sl-btns workspace-editor-actions"><button id="workspace-editor-notes-btn" class="sl-option-btn icon-only sl-notes-quick'+notesClass+'" data-workspace-notes="'+id+'" type="button" aria-label="Workspace set notes">'+notesIconSvg()+'</button><button class="sl-option-btn icon-only" data-workspace-options="'+id+'" type="button" aria-label="Workspace set options">'+moreIconSvg()+'</button><button class="sl-clear-btn" data-workspace-clear="'+id+'" type="button">Clear</button></div></div>';
  }
  return '<div class="sl-hdr"><div class="sl-hdr-meta"><span id="sl-count">'+count+'</span><button id="sl-set-key-info" class="sl-set-key-info" data-set-action="set-key" type="button">'+key+'</button></div><div class="sl-btns"><button class="sl-option-btn icon-only sl-notes-quick'+notesClass+'" data-set-action="notes" type="button" aria-label="Set notes">'+notesIconSvg()+'</button><button class="sl-option-btn icon-only" data-set-action="more" type="button" aria-label="Set options">'+moreIconSvg()+'</button><button class="sl-clear-btn" id="clear-set" type="button">Clear</button></div></div>';
}
function workspaceEditorShell(set,rows,options){
  set=asObject(set);var esc=getEsc(options||{});var id=esc(setId(set));
  return '<div class="workspace-set-editor">'+toolbarHtml('workspace',set,options)+'<div class="workspace-editor-items sl-items">'+rows+'</div><button aria-label="Add song to Workspace set" class="add-fab workspace-add-fab" data-workspace-add-song type="button"><svg fill="none" height="28" viewBox="0 0 24 24" width="28"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-linecap="round" stroke-width="2.4"></path></svg></button></div>';
}
function renderContract(){return [
  'Personal and Workspace set cards are rendered by WBSetEditor.listCard/listCards',
  'Personal and Workspace set editor rows are rendered by WBSetEditor.editorItemHtml/editorItemsHtml',
  'Per-scope legacy handlers remain adapters only during Phase 2b - E1',
  'All set editor row data attributes are preserved for existing event handlers',
  'Notes/cue chips, key buttons, drag handles and remove buttons must be emitted from this shared owner'
];}
function diagnostics(){return {owner:'WBSetEditor',phase:'Phase 2b - E1',contracts:renderContract(),patterns:['listCard','listCards','editorItemHtml','editorItemsHtml','toolbarHtml','workspaceEditorShell']};}

root.WBSetEditor={
  normalizeScope:normalizeScope,
  itemCount:itemCount,
  fallbackCountLabel:fallbackCountLabel,
  hasAnyNotes:hasAnyNotes,
  listCard:listCard,
  listCards:listCards,
  editorItemHtml:editorItemHtml,
  editorItemsHtml:editorItemsHtml,
  toolbarHtml:toolbarHtml,
  workspaceEditorShell:workspaceEditorShell,
  renderContract:renderContract,
  diagnostics:diagnostics
};
})(window);
