/* WorshipBase Phase 2b - G3 Tools concrete render owner.
   Owns concrete DOM rendering for Tools surfaces while the legacy shell remains the temporary host.
   This module deliberately accepts state/services through context objects so it does not create a new global truth. */
(function(root){
'use strict';

function esc(value){
  if(root.WBUtils&&root.WBUtils.esc)return root.WBUtils.esc(value);
  return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]});
}
function qs(id,doc){return (doc||root.document).getElementById(id);}
function asArray(value){return Array.isArray(value)?value:[];}
function maybe(fn){return typeof fn==='function';}
function setButton(ctx,id,value,sub){
  if(ctx&&maybe(ctx.setPickerButton)){ctx.setPickerButton(id,value,sub);return;}
  var b=qs(id,ctx&&ctx.document);if(!b)return;
  var strong=b.querySelector('strong'),em=b.querySelector('em');
  if(strong)strong.textContent=value;
  if(em)em.textContent=sub||'Change';
}
function toolsRender(){return root.WBToolsRenderModel||{};}
function toolsController(){return root.WBToolsController||{};}
function chordController(){return root.WBChordNnsController||{};}

function renderKeyCapo(ctx){
  ctx=ctx||{};
  var doc=ctx.document||root.document;
  var keys=asArray(ctx.keys&&ctx.keys.length?ctx.keys:(toolsController().TOOL_KEYS||[]));
  if(!keys.length)keys=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  var o=qs('tools-kc-original',doc),t=qs('tools-kc-target',doc),res=qs('tools-kc-result',doc),sg=qs('tools-kc-suggestions',doc);
  if(!o||!t||!res||!sg)return false;
  if(!o.children.length){
    o.innerHTML=keys.map(function(k){return '<option value="'+esc(k)+'">'+esc(k)+'</option>';}).join('');
    t.innerHTML=o.innerHTML;
    o.value='G';
    t.value='C';
  }
  var owner=toolsController();
  var calc=owner.keyCapo?owner.keyCapo(o.value,t.value,keys):(function(){
    var oi=keys.indexOf(o.value),ti=keys.indexOf(t.value),steps=(ti-oi+12)%12;
    return {original:o.value,target:t.value,steps:steps,suggestions:[0,1,2,3,4].map(function(capo){return {capo:capo,shape:keys[(ti-capo+12)%12]};})};
  })();
  o.value=calc.original;
  t.value=calc.target;
  setButton(ctx,'tools-kc-original-btn',calc.original);
  setButton(ctx,'tools-kc-target-btn',calc.target);
  res.innerHTML='<strong>'+esc(calc.original)+' → '+esc(calc.target)+'</strong><br>Transpose '+esc(calc.steps)+' semitone'+(calc.steps===1?'':'s')+' up.';
  var render=toolsRender();
  if(render.keyCapoResultHtml)sg.innerHTML=render.keyCapoResultHtml(calc).replace(/Play ([^<]+)<\/span>/g,'Play $1 shapes</span>');
  else sg.innerHTML=asArray(calc.suggestions).map(function(x){return '<div class="tools-kc-suggestion"><strong>Capo '+esc(x.capo)+'</strong><span>Play '+esc(x.shape)+' shapes</span></div>';}).join('');
  return true;
}

function renderPads(ctx){
  ctx=ctx||{};
  var doc=ctx.document||root.document;
  var owner=toolsController();
  var keys=asArray(ctx.keys&&ctx.keys.length?ctx.keys:(owner.TOOL_KEYS||[]));
  var types=asArray(ctx.types&&ctx.types.length?ctx.types:(owner.PAD_TYPES||[]));
  if(!keys.length)keys=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  if(!types.length)types=['Peaceful','Analog','Drones'];
  var state=ctx.state||{type:'Peaceful',key:'C',playing:false};
  if(owner.normalizePadState)state=owner.normalizePadState(state,keys,types);
  var tr=qs('tools-pad-type-row',doc),kr=qs('tools-pad-key-row',doc);
  if(!tr||!kr)return false;
  var typeModels=owner.chipModels?owner.chipModels(types,state.type):types.map(function(p){return {value:p,active:state.type===p};});
  var keyModels=owner.chipModels?owner.chipModels(keys,state.key):keys.map(function(k){return {value:k,active:state.key===k};});
  tr.innerHTML=typeModels.map(function(p){return '<button class="tools-pad-chip '+(p.active?'active':'')+'" data-pad-type="'+esc(p.value)+'" type="button">'+esc(p.value)+'</button>';}).join('');
  kr.innerHTML=keyModels.map(function(k){return '<button class="tools-pad-key '+(k.active?'active':'')+'" data-pad-key="'+esc(k.value)+'" type="button">'+esc(k.value)+'</button>';}).join('');
  renderPadStatus({document:doc,state:state});
  return state;
}
function renderPadStatus(ctx){
  ctx=ctx||{};
  var el=qs('tools-pad-status',ctx.document||root.document),owner=toolsController(),state=ctx.state||{};
  if(!el)return false;
  el.textContent=owner.padStatus?owner.padStatus(state):(state.playing?('Playing '+state.type+' pad in '+state.key):('Ready: '+state.type+' pad in '+state.key));
  return true;
}

function renderChordTable(ctx){
  ctx=ctx||{};
  var state=ctx.state||{};
  var owner=ctx.owner||chordController();
  var table=qs('nns-scale-table',ctx.document||root.document);
  if(!owner.scaleRows||!table)return false;
  var rows=owner.scaleRows(state.key,state.mode);
  table.innerHTML='<thead><tr><th class="nns-col-chord">Chord</th><th class="nns-col-quality">Quality</th><th class="nns-col-roman">Roman</th><th class="nns-col-number">NNS</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td class="nns-chord-cell"><strong>'+esc(r.chord)+'</strong></td><td class="nns-quality-cell">'+esc(r.quality)+'</td><td class="nns-roman-cell">'+esc(r.roman)+'</td><td class="nns-number-cell"><span>'+esc(r.nns)+'</span></td></tr>';}).join('')+'</tbody>';
  return true;
}
function renderScaleSummary(ctx){
  ctx=ctx||{};
  var state=ctx.state||{};
  var owner=ctx.owner||chordController();
  var box=qs('nns-scale-summary',ctx.document||root.document);if(!owner||!box)return false;
  var notes=owner.scaleNoteList?owner.scaleNoteList(state.key,state.mode):[];
  var rel=owner.relativeKey?owner.relativeKey(state.key,state.mode):null;
  box.innerHTML='<div class="nns-summary-pill"><strong>'+esc(state.key+' '+(state.mode==='minor'?'Minor':'Major'))+':</strong><span>'+esc(notes.join(' · '))+'</span></div>'+
    (rel?'<div class="nns-summary-mini"><strong>'+esc(rel.label)+':</strong><span>'+esc(rel.key)+'</span></div>':'');
  return true;
}
function renderReference(ctx){
  ctx=ctx||{};
  var state=ctx.state||{};
  var owner=ctx.owner||chordController();
  var box=qs('nns-reference-grid',ctx.document||root.document);if(!owner||!box)return false;
  var rows=owner.theoryRows?owner.theoryRows(state.key,state.mode):[];
  box.innerHTML=rows.map(function(item){return '<div class="nns-ref-item"><strong>'+esc(item.label)+'</strong><span>'+esc(item.value)+'</span></div>';}).join('')+
    '<div class="nns-ref-note">Tip: slash numbers follow the bass note, e.g. <strong>5/7</strong> in C = <strong>G/B</strong>. Borrowed numbers like <strong>b7</strong> are available in the converter.</div>';
  return true;
}
function renderCommonProgressions(ctx){
  ctx=ctx||{};
  var state=ctx.state||{};
  var owner=ctx.owner||chordController();
  var box=qs('nns-common-progressions',ctx.document||root.document);if(!owner||!box||!owner.commonProgressions)return false;
  box.innerHTML=owner.commonProgressions(state.key,state.mode).map(function(p){return '<button class="nns-example-chip" type="button" data-nns-example="'+esc(p.nns)+'"><span>'+esc(p.nns)+'</span><small>'+esc(p.chords)+'</small></button>';}).join('');
  return true;
}
function updateConversion(ctx){
  ctx=ctx||{};
  var state=ctx.state||{};
  var owner=ctx.owner||chordController();
  var doc=ctx.document||root.document;
  var inp=qs('nns-convert-input',doc),out=qs('nns-convert-result',doc),tr=qs('nns-transpose-result',doc),copy=qs('nns-copy-result',doc);if(!owner||!out)return false;
  var value=inp?inp.value.trim():'';
  if(!value){
    out.textContent='Enter a progression to convert chords to numbers, or numbers to chords.';
    if(tr)tr.textContent='Transpose preview will appear here.';
    state.lastCopy='';
    if(copy)copy.disabled=true;
    if(ctx.syncPickerButtons)ctx.syncPickerButtons();
    return true;
  }
  var converted=owner.convertProgression?owner.convertProgression(value,state.key,state.mode):null;
  var line=converted&&converted.line?converted.line:'';
  var label=converted&&converted.direction==='numbers-to-chords'?'Numbers → chords':'Chords → numbers';
  out.innerHTML='<span class="nns-result-label">'+esc(label)+'</span><div class="nns-result-line">'+esc(line||'?')+'</div>';
  var trans=owner.transposeProgression?owner.transposeProgression(value,state.key,state.transposeTarget,state.mode):null;
  var transLine=trans&&trans.line?trans.line:'';
  if(tr)tr.innerHTML='<span class="nns-result-label">Transposed to '+esc(state.transposeTarget)+'</span><div class="nns-result-line">'+esc(transLine||'?')+'</div>';
  state.lastCopy=(label+': '+(line||'?')+'\nTransposed to '+state.transposeTarget+': '+(transLine||'?'));
  if(copy)copy.disabled=false;
  if(ctx.syncPickerButtons)ctx.syncPickerButtons();
  return true;
}
function renderDiagram(ctx){
  ctx=ctx||{};
  var state=ctx.state||{};
  var owner=ctx.owner||chordController();
  if(!owner.diagramFor)return false;
  var doc=ctx.document||root.document;
  var isPiano=state.instrument==='piano';
  var variations=isPiano&&owner.pianoDiagramVariations?owner.pianoDiagramVariations(state.root,state.quality):(owner.diagramVariations?owner.diagramVariations(state.root,state.quality):[]);
  if(state.variation>=(variations.length||1))state.variation=0;
  var model=owner.diagramFor(state.root,state.quality,state.variation),title=qs('nns-diagram-title',doc),svg=qs('nns-diagram-svg',doc),hint=qs('nns-diagram-hint',doc),varBox=qs('nns-diagram-variations',doc);
  if(title)title.textContent=model.name;
  if(svg)svg.innerHTML=isPiano&&owner.pianoDiagramHtml?owner.pianoDiagramHtml(state.root,state.quality,state.variation):owner.diagramSvg(model);
  if(varBox){varBox.hidden=!variations||variations.length<2;varBox.innerHTML=varBox.hidden?'':variations.map(function(v,i){return '<button class="nns-variation-chip '+(i===state.variation?'active':'')+'" data-nns-variation="'+i+'" type="button">'+esc(v.label||((isPiano?'Voicing ':'Shape ')+(i+1)))+'</button>';}).join('');}
  if(hint){
    if(isPiano){
      var notes=owner.pianoChordNotes?owner.pianoChordNotes(state.root,state.quality,state.variation):[];
      var label=variations&&variations[state.variation]&&variations[state.variation].label?variations[state.variation].label:'Root position';
      hint.textContent=label+' · '+notes.join(' · ');
    }else{
      hint.textContent=(model.diagram&&model.diagram.shape?model.diagram.shape:model.hint)+(model.variationCount>1?' · '+(model.variationIndex+1)+' of '+model.variationCount:'');
    }
  }
  return true;
}
function renderChordNns(ctx){
  ctx=ctx||{};
  var owner=ctx.owner||chordController();
  if(!owner)return false;
  renderChordTable(ctx);
  renderScaleSummary(ctx);
  renderReference(ctx);
  renderCommonProgressions(ctx);
  updateConversion(ctx);
  renderDiagram(ctx);
  if(ctx.syncPickerButtons)ctx.syncPickerButtons();
  return true;
}

function renderBibleChapterSurface(ctx){
  ctx=ctx||{};
  var card=qs('bible-card',ctx.document||root.document);if(!card)return false;
  var render=toolsRender();
  var model=ctx.model||{};
  if(ctx.state==='loading')card.innerHTML=render.bibleLoadingHtml?render.bibleLoadingHtml(model):'<div class="bible-loading-state"><div class="bible-heading">'+esc(model.heading||'Loading Bible…')+'</div><div class="bible-copy">'+esc(model.copy||'Loading chapter…')+'</div></div>';
  else if(ctx.state==='error')card.innerHTML=render.bibleErrorHtml?render.bibleErrorHtml(model):'<div class="bible-loading-state bible-error-state"><div class="bible-heading">'+esc(model.heading||'Bible')+'</div><div class="bible-empty-title">'+esc(model.title||'Unable to load Bible data')+'</div><div class="bible-copy">'+esc(model.copy||'')+'</div></div>';
  else card.innerHTML=render.bibleChapterHtml?render.bibleChapterHtml(model):'';
  return true;
}
function renderBiblePickerSurface(ctx){
  ctx=ctx||{};
  var doc=ctx.document||root.document;
  var books=qs('bible-book-picker-list',doc),chapters=qs('bible-chapter-picker-list',doc);if(!books||!chapters)return false;
  var render=toolsRender();
  var html=render.biblePickerHtml?render.biblePickerHtml({books:ctx.books||[],chapters:ctx.chapters||[]}):{booksHtml:'',chaptersHtml:''};
  books.innerHTML=html.booksHtml||'';
  chapters.innerHTML=html.chaptersHtml||'';
  setTimeout(function(){var a=books.querySelector('.active');if(a)a.scrollIntoView({block:'center'});var c=chapters.querySelector('.active');if(c)c.scrollIntoView({block:'center'});},0);
  return true;
}
function renderBibleVersionPickerSurface(ctx){
  ctx=ctx||{};
  var el=qs('bible-version-list',ctx.document||root.document);if(!el)return false;
  var render=toolsRender();
  el.innerHTML=render.bibleVersionPickerHtml?render.bibleVersionPickerHtml(ctx.versions||[]):'';
  return true;
}

function diagnostics(){
  return {phase:'Phase 2b - G3',owner:'WBToolsSurfaceController',surfaceContract:['renderKeyCapo','renderPads','renderPadStatus','renderChordNns','renderChordTable','renderScaleSummary','renderReference','renderCommonProgressions','updateConversion','renderDiagram','renderBibleChapterSurface','renderBiblePickerSurface','renderBibleVersionPickerSurface'],nonDestructive:true,legacyShellHost:true};
}

root.WBToolsSurfaceController={
  renderKeyCapo:renderKeyCapo,
  renderPads:renderPads,
  renderPadStatus:renderPadStatus,
  renderChordNns:renderChordNns,
  renderChordTable:renderChordTable,
  renderScaleSummary:renderScaleSummary,
  renderReference:renderReference,
  renderCommonProgressions:renderCommonProgressions,
  updateConversion:updateConversion,
  renderDiagram:renderDiagram,
  renderBibleChapterSurface:renderBibleChapterSurface,
  renderBiblePickerSurface:renderBiblePickerSurface,
  renderBibleVersionPickerSurface:renderBibleVersionPickerSurface,
  diagnostics:diagnostics,
  surfaceContract:['renderKeyCapo','renderPads','renderPadStatus','renderChordNns','renderBibleChapterSurface','renderBiblePickerSurface','renderBibleVersionPickerSurface']
};
})(window);
