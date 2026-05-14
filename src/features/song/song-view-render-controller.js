/* WorshipBase Phase 2b - I1 Song view render boundary owner.
   Owns the song sheet DOM render sequence while the legacy shell remains the temporary host. */
(function(root){
'use strict';

function fallbackEsc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
function displaySongForState(song,state){
  song=song||{};state=state||{};
  var sourceKey=song.chartKey||song.originalKey||song.sourceKey||song.key||'C';
  var renderKey=state.displayKey||song.displayKey||song.key||sourceKey||'C';
  return Object.assign({},song,{sourceKey:sourceKey,chartKey:sourceKey,originalKey:sourceKey,displayKey:renderKey,renderKey:renderKey,targetKey:renderKey});
}
function chordsUsedHtml(song,ctx){
  ctx=ctx||{};song=displaySongForState(song,ctx.state||{});
  var esc=ctx.esc||fallbackEsc;
  var extract=ctx.extractChordNames||function(){return [];};
  var display=ctx.displayChord||function(c){return c;};
  var chords=extract(song.chart||'').map(function(c){return display(c,song,'chords');});
  return chords.length?'Chords used: '+chords.map(function(c){return '<strong>'+esc(c)+'</strong>';}).join(' '):'';
}
function renderSheetBodyHtml(song,ctx){
  ctx=ctx||{};song=displaySongForState(song,ctx.state||{});
  var format=ctx.formatChartHtml||function(text){return fallbackEsc(text);};
  var state=ctx.state||{};
  return format(song.chart||'',state.mode,song);
}
function renderSongSheet(ctx){
  ctx=ctx||{};
  var qs=ctx.qs||function(){return null},qsa=ctx.qsa||function(){return [];},state=ctx.state||{},songs=ctx.songs||[];
  var sheet=qs('sv-sheet');
  if(!sheet)return;
  var song=songs.find(function(x){return x.id===state.selectedId;})||songs[0];
  if(!song)return;
  var chordHost=qs('sv-chords-used'),chordHtml=chordsUsedHtml(song,ctx);
  if(chordHost){
    if(chordHtml){chordHost.classList.remove('hidden');chordHost.innerHTML=chordHtml;}
    else{chordHost.classList.add('hidden');chordHost.innerHTML='';}
  }
  sheet.classList.toggle('chords-highlight',!!state.chordHighlight&&state.mode!=='lyrics');
  sheet.classList.toggle('lyrics-readable',state.mode==='lyrics');
  sheet.innerHTML=renderSheetBodyHtml(song,ctx);
  if(typeof ctx.applySongCueMarkersToSheet==='function')ctx.applySongCueMarkersToSheet(sheet,typeof ctx.currentSongNoteSet==='function'?ctx.currentSongNoteSet():null,song);
  sheet.classList.toggle('chords-highlight',!!state.chordHighlight&&state.mode!=='lyrics');
  sheet.classList.toggle('lyrics-readable',state.mode==='lyrics');
  if(typeof ctx.renderPerformanceRail==='function')ctx.renderPerformanceRail();
  qsa('.seg-btn').forEach(function(button){button.classList.toggle('active',button.dataset.mode===state.mode);});
  if(typeof ctx.syncKeySelect==='function')ctx.syncKeySelect(song);
  if(typeof ctx.updateLiveToolLabels==='function')ctx.updateLiveToolLabels();
  if(typeof ctx.updateSongMenuUI==='function')ctx.updateSongMenuUI();
}
function renderContract(){return {phase:'Phase 2b - I1',owner:'WBSongViewRenderController',contracts:['chordsUsedHtml','renderSheetBodyHtml','renderSongSheet'],legacyShellHost:true,nonDestructive:true};}

root.WBSongViewRenderController={
  chordsUsedHtml:chordsUsedHtml,
  renderSheetBodyHtml:renderSheetBodyHtml,
  renderSongSheet:renderSongSheet,
  displaySongForState:displaySongForState,
  renderContract:renderContract,
  diagnostics:renderContract
};
})(window);
