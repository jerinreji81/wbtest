/* WorshipBase Phase 2b - G2 Tools DOM extraction boundary.
   Owns shared Tools event routing, panel open/back semantics, picker dispatch, pad row routing,
   and diagnostics while legacy render surfaces remain temporary adapters. */
(function(root){
'use strict';

function closest(target, selector){return target&&target.closest?target.closest(selector):null;}
function call(fn){if(typeof fn==='function')return fn.apply(null,Array.prototype.slice.call(arguments,1));}
function once(el,key,handler){if(!el||!handler)return false;var flag='toolsDom'+key;if(el.dataset&&el.dataset[flag]==='1')return false;if(el.dataset)el.dataset[flag]='1';el.addEventListener('click',handler);return true;}
function getToolsController(){return root.WBToolsController||{};}
function normalizePanel(name){var owner=getToolsController();return owner.normalizePanel?owner.normalizePanel(name):String(name||'home').toLowerCase();}

function openPanel(panel, adapters){
  adapters=adapters||{};
  panel=normalizePanel(panel);
  if(panel==='bible'&&adapters.openBible)return adapters.openBible();
  if(panel==='home'&&adapters.openHome)return adapters.openHome();
  if(adapters.showPanel)return adapters.showPanel(panel);
}

function bindHomeCards(doc, adapters){
  doc=doc||root.document;adapters=adapters||{};
  once(doc.getElementById('tool-open-bible'),'OpenBible',function(){openPanel('bible',adapters)});
  once(doc.getElementById('tool-open-keycapo'),'OpenKeyCapo',function(){openPanel('keycapo',adapters)});
  once(doc.getElementById('tool-open-pads'),'OpenPads',function(){openPanel('pads',adapters)});
  once(doc.getElementById('tool-open-chordnns'),'OpenChordNns',function(){openPanel('chordnns',adapters)});
}

function bindBackButtons(doc, adapters){
  doc=doc||root.document;adapters=adapters||{};
  ['tools-keycapo-back','tools-pads-back','tools-chordnns-back'].forEach(function(id){
    once(doc.getElementById(id),'BackHome',function(){openPanel('home',adapters)});
  });
  once(doc.getElementById('tools-bible-back'),'BibleBackHome',function(){openPanel('home',adapters)});
}

function bindPickerButtons(doc, adapters){
  doc=doc||root.document;adapters=adapters||{};
  Array.prototype.forEach.call(doc.querySelectorAll('[data-tool-picker]'),function(btn){
    once(btn,'Picker',function(){if(adapters.openToolPicker)adapters.openToolPicker(btn.dataset.toolPicker)});
  });
}

function bindKeyCapo(doc, adapters){
  doc=doc||root.document;adapters=adapters||{};
  var original=doc.getElementById('tools-kc-original');
  var target=doc.getElementById('tools-kc-target');
  if(original&&!original.dataset.toolsDomKeyCapoChange){original.dataset.toolsDomKeyCapoChange='1';original.addEventListener('change',function(){call(adapters.updateKeyCapo)});}
  if(target&&!target.dataset.toolsDomKeyCapoChange){target.dataset.toolsDomKeyCapoChange='1';target.addEventListener('change',function(){call(adapters.updateKeyCapo)});}
}

function bindChordNns(doc, adapters){
  doc=doc||root.document;adapters=adapters||{};
  function change(id, fn){var el=doc.getElementById(id);if(el&&!el.dataset.toolsDomChange){el.dataset.toolsDomChange='1';el.addEventListener('change',function(){call(fn,this.value)});}}
  change('nns-key-select',adapters.setNnsKey);
  change('nns-mode-select',adapters.setNnsMode);
  change('nns-transpose-target',adapters.setNnsTransposeTarget);
  var input=doc.getElementById('nns-convert-input');
  if(input&&!input.dataset.toolsDomInput){input.dataset.toolsDomInput='1';input.addEventListener('input',function(){call(adapters.updateNnsConversion)});}
  var examples=doc.getElementById('nns-common-progressions');
  once(examples,'Examples',function(e){var b=closest(e.target,'[data-nns-example]');if(!b)return;call(adapters.applyNnsExample,b.dataset.nnsExample||'');});
  var copy=doc.getElementById('nns-copy-result');
  once(copy,'Copy',function(){call(adapters.copyNnsResult)});
  change('nns-diagram-root',adapters.setNnsRoot);
  change('nns-diagram-quality',adapters.setNnsQuality);
  var variations=doc.getElementById('nns-diagram-variations');
  once(variations,'Variations',function(e){var b=closest(e.target,'[data-nns-variation]');if(!b)return;call(adapters.setNnsVariation,parseInt(b.dataset.nnsVariation,10)||0);});
}

function bindPads(doc, adapters){
  doc=doc||root.document;adapters=adapters||{};
  once(doc.getElementById('tools-pad-type-row'),'PadType',function(e){var b=closest(e.target,'[data-pad-type]');if(b)call(adapters.setPadType,b.dataset.padType);});
  once(doc.getElementById('tools-pad-key-row'),'PadKey',function(e){var b=closest(e.target,'[data-pad-key]');if(b)call(adapters.setPadKey,b.dataset.padKey);});
  once(doc.getElementById('tools-pad-play-btn'),'PadPlay',function(){call(adapters.playPad)});
  once(doc.getElementById('tools-pad-stop-btn'),'PadStop',function(){call(adapters.stopPad)});
}

function bindTools(doc, adapters){
  bindHomeCards(doc,adapters);
  bindBackButtons(doc,adapters);
  bindPickerButtons(doc,adapters);
  bindKeyCapo(doc,adapters);
  bindChordNns(doc,adapters);
  bindPads(doc,adapters);
  return diagnostics(doc);
}

function diagnostics(doc){
  doc=doc||root.document;
  var ids=['tool-open-bible','tool-open-keycapo','tool-open-pads','tool-open-chordnns','tools-keycapo-back','tools-pads-back','tools-chordnns-back','tools-bible-back','tools-pad-play-btn','tools-pad-stop-btn'];
  var present=ids.filter(function(id){return !!doc.getElementById(id)});
  return {phase:'Phase 2b - G2',owner:'WBToolsDomController',presentControls:present.length,totalControls:ids.length,operationDomContract:['bindTools','bindHomeCards','bindBackButtons','bindKeyCapo','bindChordNns','bindPads','openPanel']};
}

root.WBToolsDomController={
  openPanel:openPanel,
  bindHomeCards:bindHomeCards,
  bindBackButtons:bindBackButtons,
  bindPickerButtons:bindPickerButtons,
  bindKeyCapo:bindKeyCapo,
  bindChordNns:bindChordNns,
  bindPads:bindPads,
  bindTools:bindTools,
  diagnostics:diagnostics,
  operationDomContract:['bindTools','bindHomeCards','bindBackButtons','bindKeyCapo','bindChordNns','bindPads','openPanel']
};
})(window);
