/* WorshipBase Phase 2b data-safety DOM handler controller.
   Source of truth for DOM event routing used by Backup Centre, Import Review,
   Export View, and PDF Preview surfaces.

   Phase 2b rule: legacy screens may still provide DOM nodes temporarily, but
   click/change routing should be owned here so data-safety surfaces do not keep
   inventing parallel handlers inside the legacy shell. */
(function(root){
'use strict';

function closest(target, selector){
  return target && target.closest ? target.closest(selector) : null;
}
function call(fn){
  if(typeof fn!=='function')return undefined;
  var args=Array.prototype.slice.call(arguments,1);
  return fn.apply(null,args);
}
function prevent(event){
  if(event && event.preventDefault)event.preventDefault();
  if(event && event.stopPropagation)event.stopPropagation();
}
function asObject(value){return value&&typeof value==='object'?value:{};}
function asArray(value){return Array.isArray(value)?value:[];}
function escapeHtml(value){
  return String(value==null?'':value).replace(/[&<>"]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch];});
}

function handleBackupCentreClick(event, handlers){
  handlers=asObject(handlers);
  var target=event&&event.target;
  var confirmCancel=closest(target,'[data-backup-confirm-cancel]');
  if(confirmCancel){prevent(event);call(handlers.openBackupCentre);return true;}
  var confirmRun=closest(target,'[data-backup-confirm-run]');
  if(confirmRun){prevent(event);call(handlers.runBackupActionConfirmed,confirmRun.dataset.backupConfirmRun);return true;}
  var toggle=closest(target,'[data-backup-review-toggle]');
  if(toggle){prevent(event);call(handlers.handleBackupReviewToggle,toggle.dataset.backupReviewToggle);return true;}
  var reviewAction=closest(target,'[data-backup-review-action]');
  if(reviewAction){prevent(event);call(handlers.handleBackupReviewAction,reviewAction.dataset.backupReviewAction);return true;}
  var action=closest(target,'[data-backup-action]');
  if(action){prevent(event);call(handlers.handleBackupAction,action.dataset.backupAction);return true;}
  return false;
}

function updateImportChoiceState(choice){
  var card=closest(choice,'[data-dup-index]');
  if(!card)return;
  var buttons=card.querySelectorAll ? card.querySelectorAll('.import-dup-choice') : [];
  Array.prototype.forEach.call(buttons,function(btn){btn.classList.toggle('active',btn===choice);});
}
function handleImportDuplicateReviewClick(event, state, handlers){
  state=asObject(state);handlers=asObject(handlers);
  var target=event&&event.target;
  if(!target)return false;
  if(target.id==='import-dup-cancel' || target===state.root){prevent(event);call(handlers.closeImportDuplicateReview);return true;}
  if(target.id==='import-dup-continue'){prevent(event);call(handlers.applyImportDuplicateChoices);return true;}
  var choice=closest(target,'[data-dup-choice]');
  if(choice && state.queue){
    prevent(event);
    var card=closest(choice,'[data-dup-index]');
    var idx=card?parseInt(card.dataset.dupIndex,10):-1;
    var item=state.queue && state.queue.dupes ? state.queue.dupes[idx] : null;
    if(item){item.decision=choice.dataset.dupChoice;updateImportChoiceState(choice);}
    return true;
  }
  return false;
}

function importStatusPills(counts){
  counts=asObject(counts);
  return ['new','duplicate','updated','skipped'].map(function(k){
    var label={new:'New',duplicate:'Duplicate',updated:'Updated',skipped:'Skipped'}[k];
    return '<span class="file-import-status-pill '+k+'">'+label+': '+(counts[k]||0)+'</span>';
  }).join('');
}
function importSongRow(song,index,status){
  song=asObject(song);status=asObject(status);
  var match=status.match?(' · matches '+(status.match.title||'existing song')):'';
  var kind=escapeHtml(status.kind||'new');
  return '<label class="file-song-row '+kind+'"><input type="checkbox" data-file-song-check="'+index+'" '+(song.selected!==false?'checked':'')+'><span><span class="file-song-title">'+escapeHtml(song.title||'Untitled')+'</span><span class="file-song-meta">'+escapeHtml((song.artist||'Unknown')+' · Key '+(song.key||'C')+match)+'</span><span class="file-song-status '+kind+'">'+escapeHtml(status.label||'New')+'</span></span></label>';
}
function buildFileImportReviewModel(songs,statusFn,countsFn){
  var items=asArray(songs);
  var selected=items.filter(function(song){return song.selected!==false;}).length;
  var statuses=items.map(function(song){return call(statusFn,song)||{};});
  var counts=call(countsFn,items)||statuses.reduce(function(acc,st){st=asObject(st);var key=st.kind||'new';acc[key]=(acc[key]||0)+1;return acc;},{new:0,duplicate:0,updated:0,skipped:0});
  return {items:items,selected:selected,counts:counts,statuses:statuses};
}

function handleExportViewClick(event, handlers){
  handlers=asObject(handlers);
  var state=asObject(handlers.exportPageState);
  var target=event&&event.target;
  if(!target)return false;
  var closeBtn=closest(target,'#export-view-back,#export-view-cancel');
  if(closeBtn){prevent(event);call(handlers.closeExportView);return true;}
  var previewBtn=closest(target,'#export-view-preview-top,#export-view-preview-bottom');
  if(previewBtn){prevent(event);call(handlers.openExportPreview);return true;}
  var preset=closest(target,'[data-export-preset-card]');
  if(preset){prevent(event);call(handlers.applyExportPresetState,preset.dataset.exportPresetCard);call(handlers.renderExportView);return true;}
  var mode=closest(target,'[data-export-mode]');
  if(mode){prevent(event);state.mode=mode.dataset.exportMode;call(handlers.syncExportControls);call(handlers.renderExportMiniPreview);return true;}
  var flow=closest(target,'[data-export-flow]');
  if(flow){prevent(event);state.flow=flow.dataset.exportFlow;call(handlers.syncExportControls);call(handlers.renderExportMiniPreview);return true;}
  var cols=closest(target,'[data-export-columns]');
  if(cols){prevent(event);state.columns=cols.dataset.exportColumns;call(handlers.syncExportControls);call(handlers.renderExportMiniPreview);return true;}
  var size=closest(target,'[data-export-size]');
  if(size){prevent(event);state.size=size.dataset.exportSize;call(handlers.syncExportControls);call(handlers.renderExportMiniPreview);return true;}
  var flag=closest(target,'[data-export-flag]');
  if(flag){prevent(event);var key=flag.dataset.exportFlag;state.flags=asObject(state.flags);state.flags[key]=!state.flags[key];call(handlers.syncExportControls);call(handlers.renderExportMiniPreview);return true;}
  return false;
}

function bindPreviewButtons(qs, handlers){
  handlers=asObject(handlers);
  var back=call(qs,'wb-export-preview-back');
  if(back&&!back.dataset.ready){back.dataset.ready='1';back.addEventListener('click',function(event){prevent(event);call(handlers.closeExportPreview);});}
  var save=call(qs,'wb-export-preview-save');
  if(save&&!save.dataset.ready){save.dataset.ready='1';save.addEventListener('click',function(event){prevent(event);call(handlers.saveCurrentPreviewPdf);});}
}

function operationDomContract(){
  return {
    owner:'WBDataSafetyDomController',
    phase:'Phase 2b - G2',
    owns:[
      'Backup Centre click routing',
      'Import duplicate review click routing',
      'File import review DOM model helpers',
      'Export View click routing',
      'PDF preview button binding'
    ],
    legacyBoundary:'Legacy shell still supplies concrete DOM surfaces until feature renderers are extracted.'
  };
}
function diagnostics(){
  return {
    owner:'WBDataSafetyDomController',
    phase:'Phase 2b - G2',
    hasBackupCentreHandler:typeof handleBackupCentreClick==='function',
    hasImportDuplicateReviewHandler:typeof handleImportDuplicateReviewClick==='function',
    hasExportViewHandler:typeof handleExportViewClick==='function',
    contract:operationDomContract()
  };
}

root.WBDataSafetyDomController={
  handleBackupCentreClick:handleBackupCentreClick,
  handleImportDuplicateReviewClick:handleImportDuplicateReviewClick,
  handleExportViewClick:handleExportViewClick,
  bindPreviewButtons:bindPreviewButtons,
  importStatusPills:importStatusPills,
  importSongRow:importSongRow,
  buildFileImportReviewModel:buildFileImportReviewModel,
  operationDomContract:operationDomContract,
  diagnostics:diagnostics
};
})(window);
