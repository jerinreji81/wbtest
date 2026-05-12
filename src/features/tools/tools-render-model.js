/* WorshipBase Phase 2b - G2 Tools render-model/surface owner.
   Owns reusable Tools render models and safe HTML surface fragments for Bible, Key/Capo,
   Chord/NNS, Pads, and shared tool cards while the legacy shell remains the temporary host. */
(function(root){
'use strict';

function esc(value){
  if(root.WBUtils&&root.WBUtils.esc)return root.WBUtils.esc(value);
  return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]});
}
function plural(count,singular,pluralWord){count=Number(count)||0;return count+' '+(count===1?singular:(pluralWord||singular+'s'));}
function attr(value){return esc(value).replace(/`/g,'&#96;');}
function asArray(value){return Array.isArray(value)?value:[];}

function toolCard(model){
  model=model||{};
  var id=model.id?' id="'+attr(model.id)+'"':'';
  var icon=model.iconHtml||'';
  return '<button class="tool-card"'+id+' type="button">'+
    '<span class="tool-card-ico">'+icon+'</span>'+
    '<span class="tool-card-body"><span class="tool-card-title">'+esc(model.title||'Tool')+'</span><span class="tool-card-sub">'+esc(model.subtitle||'')+'</span></span>'+
    '<span class="tool-card-chev">›</span></button>';
}
function panelHeader(model){
  model=model||{};
  var id=model.backId||'';
  return '<div class="tools-bible-bar tool-detail-bar"><button aria-label="Back" class="tool-back-circle" id="'+attr(id)+'" type="button"><svg fill="none" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"></path></svg></button><div class="tool-detail-title">'+esc(model.title||'Tools')+'</div></div>';
}

function keyCapoResultHtml(result){
  result=result||{};
  var suggestions=asArray(result.suggestions);
  return suggestions.map(function(s){
    return '<div class="tools-kc-suggestion"><strong>Capo '+esc(s.capo)+'</strong><span>Play '+esc(s.shape)+' shape</span></div>';
  }).join('') || '<div class="tools-kc-suggestion"><strong>No suggestions</strong><span>Choose keys to calculate.</span></div>';
}
function padStatusHtml(state){
  var owner=root.WBToolsController||{};
  var text=owner.padStatus?owner.padStatus(state):'Ready';
  return '<div class="tools-pad-status">'+esc(text)+'</div>';
}
function chipRowHtml(items,options){
  items=asArray(items);options=options||{};
  return items.map(function(item){
    var value=item.value!=null?item.value:item;
    var label=item.label!=null?item.label:value;
    var active=!!item.active;
    return '<button class="'+esc(options.className||'chip')+' '+(active?'active':'')+'" '+(options.dataName?'data-'+options.dataName+'="'+attr(value)+'" ':'')+'type="button">'+esc(label)+'</button>';
  }).join('');
}

function bibleLoadingHtml(model){
  model=model||{};
  return '<div class="bible-loading-state"><div class="bible-heading">'+esc(model.heading||'Loading Bible…')+'</div><div class="bible-copy">'+esc(model.copy||'Checking the local Bible package on this device.')+'</div></div>';
}
function bibleErrorHtml(model){
  model=model||{};
  return '<div class="bible-loading-state bible-error-state"><div class="bible-heading">'+esc(model.heading||'Bible')+'</div><div class="bible-empty-title">'+esc(model.title||'Unable to load Bible data')+'</div><div class="bible-copy">'+esc(model.copy||'Keep the Bible package folder in the same published site path as this app file.')+'</div></div>';
}
function bibleEmptyHtml(model){
  model=model||{};
  return '<div class="bible-empty"><div class="bible-empty-title">'+esc(model.title||'No verses found')+'</div><div class="bible-empty-sub">'+esc(model.subtitle||'This chapter file loaded, but it did not contain verse text.')+'</div></div>';
}
function bibleVerseHtml(verse,heading){
  verse=verse||{};
  var n=String(verse.number||verse.verse||'');
  var t=String(verse.text||'');
  return '<div class="bible-verse"><button class="bible-vnum" data-bible-copy-verse="'+attr(n)+'" data-bible-copy-text="'+attr(t)+'" type="button" aria-label="Copy '+attr(heading+':'+n)+'">'+esc(n)+'</button><span class="bible-vtext">'+esc(t)+'</span></div>';
}
function bibleChapterHtml(model){
  model=model||{};
  var verses=asArray(model.verses);
  var heading=model.heading||((model.book||'Bible')+' '+(model.chapter||''));
  var abbr=model.versionAbbr||'';
  var verseHtml=verses.map(function(v){return bibleVerseHtml(v,heading);}).join('') || bibleEmptyHtml({});
  var sub=abbr ? (abbr+' · '+plural(verses.length,'verse')) : plural(verses.length,'verse');
  return '<div class="bible-heading">'+esc(heading)+'</div><div class="bible-heading-sub">'+esc(sub)+'</div>'+verseHtml+'<div class="bible-copy">'+esc(model.footer||'')+'</div>';
}
function bibleCopyText(model){
  model=model||{};
  var verses=asArray(model.verses);
  return ((model.heading||'Bible')+(model.versionAbbr?' ('+model.versionAbbr+')':'')+'\n\n'+verses.map(function(v){return String(v.number||v.verse||'')+' '+String(v.text||'');}).join('\n')).trim();
}
function biblePickerHtml(model){
  model=model||{};
  var books=asArray(model.books).map(function(m){return '<button class="bible-picker-item '+(m.active?'active':'')+'" data-bible-book="'+attr(m.book||m.name||m)+'" type="button"><span class="truncate">'+esc(m.book||m.name||m)+'</span></button>';}).join('');
  var chapters=asArray(model.chapters).map(function(m){var n=m.chapter||m;return '<button class="bible-picker-item chapter-item '+(m.active?'active':'')+'" data-bible-chapter="'+attr(n)+'" type="button">'+esc(n)+'</button>';}).join('');
  return {booksHtml:books,chaptersHtml:chapters};
}
function bibleVersionPickerHtml(models){
  return asArray(models).map(function(v){
    return '<button class="bible-version-item" data-bible-version="'+attr(v.id)+'" type="button"><span class="bible-version-copy"><span class="bible-version-title">'+esc((v.abbr||v.id)+' - '+(v.name||''))+'</span><span class="bible-version-sub">'+esc(v.sourceLabel||'')+'</span></span><span class="setdest-state">'+(v.active?'Selected':'Choose')+'</span></button>';
  }).join('');
}
function chordNnsTableHtml(rows){
  rows=asArray(rows);
  return '<table class="nns-table"><thead><tr><th>Degree</th><th>Chord</th><th>Quality</th><th>NNS</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td>'+esc(r.degree||'')+'</td><td><strong>'+esc(r.chord||'')+'</strong></td><td>'+esc(r.quality||'')+'</td><td><span class="nns-pill">'+esc(r.nns||'')+'</span></td></tr>';}).join('')+'</tbody></table>';
}
function diagnostics(){
  return {phase:'Phase 2b - G2',owner:'WBToolsRenderModel',renderContract:['toolCard','panelHeader','keyCapoResultHtml','padStatusHtml','bibleChapterHtml','biblePickerHtml','bibleVersionPickerHtml','chordNnsTableHtml'],nonDestructive:true,legacyShellHost:true};
}

root.WBToolsRenderModel={
  toolCard:toolCard,
  panelHeader:panelHeader,
  keyCapoResultHtml:keyCapoResultHtml,
  padStatusHtml:padStatusHtml,
  chipRowHtml:chipRowHtml,
  bibleLoadingHtml:bibleLoadingHtml,
  bibleErrorHtml:bibleErrorHtml,
  bibleEmptyHtml:bibleEmptyHtml,
  bibleVerseHtml:bibleVerseHtml,
  bibleChapterHtml:bibleChapterHtml,
  bibleCopyText:bibleCopyText,
  biblePickerHtml:biblePickerHtml,
  bibleVersionPickerHtml:bibleVersionPickerHtml,
  chordNnsTableHtml:chordNnsTableHtml,
  diagnostics:diagnostics,
  renderContract:['toolCard','panelHeader','keyCapoResultHtml','padStatusHtml','bibleChapterHtml','biblePickerHtml','bibleVersionPickerHtml','chordNnsTableHtml']
};
})(window);
