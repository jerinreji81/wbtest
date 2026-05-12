/* WorshipBase Phase 2b - B2 shared UI component owner.
   Purpose: one markup owner for repeated app patterns while the legacy shell is being retired.
   Rule: new/extracted renderers should call WBUI instead of hand-writing back buttons,
   metadata rows, icon surfaces, chips, and set-list header controls. */
(function(root){
'use strict';

function esc(value){
  if(root.WBDom&&typeof root.WBDom.esc==='function')return root.WBDom.esc(value);
  return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}
function classes(){
  return Array.prototype.slice.call(arguments).filter(Boolean).join(' ');
}
function attrs(map){
  var out='';
  Object.keys(map||{}).forEach(function(key){
    var value=map[key];
    if(value===false||value==null)return;
    if(value===true){out+=' '+key;return;}
    out+=' '+key+'="'+esc(value)+'"';
  });
  return out;
}
function icon(name,options){
  options=options||{};
  var size=options.size||20;
  var stroke=options.stroke||2;
  var common=' fill="none" height="'+esc(size)+'" viewBox="0 0 24 24" width="'+esc(size)+'" aria-hidden="true"';
  var p='';
  if(name==='back')p='<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="'+esc(stroke)+'"></path>';
  else if(name==='notes')p='<path d="M6 3.5h11v17H6z" stroke="currentColor" stroke-width="1.7"></path><path d="M8.5 8h6M8.5 11.5h6M8.5 15h3.8" stroke="currentColor" stroke-linecap="round" stroke-width="1.7"></path>';
  else if(name==='more')p='<circle cx="5" cy="12" fill="currentColor" r="1.9"></circle><circle cx="12" cy="12" fill="currentColor" r="1.9"></circle><circle cx="19" cy="12" fill="currentColor" r="1.9"></circle>';
  else if(name==='plus')p='<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round" stroke-width="'+esc(stroke)+'"></path>';
  else if(name==='chevronRight')p='<path d="M9 5l7 7-7 7" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="'+esc(stroke)+'"></path>';
  else p='<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="'+esc(stroke)+'"></circle>';
  return '<svg'+common+'>'+p+'</svg>';
}
function backButton(options){
  options=options||{};
  return '<button type="button" class="'+esc(classes('wb-ui-back',options.className))+'"'+attrs({id:options.id,'data-back':options.backTarget,'aria-label':options.label||'Back'})+'>'+icon('back',{size:20,stroke:2.25})+'</button>';
}
function iconButton(options){
  options=options||{};
  return '<button type="button" class="'+esc(classes('wb-ui-icon-btn',options.className))+'"'+attrs({id:options.id,'data-action':options.action,'data-index':options.index,'aria-label':options.label||options.icon||'Action'})+'>'+icon(options.icon||'more',options.iconOptions||{})+'</button>';
}
function metadata(items,options){
  options=options||{};
  var parts=(items||[]).filter(function(x){return x!=null&&String(x).trim()!=='';}).map(function(x){return '<span>'+esc(x)+'</span>';}).join('<span class="wb-ui-meta-dot">·</span>');
  return '<span class="'+esc(classes('wb-ui-meta',options.className))+'">'+parts+'</span>';
}
function cardIcon(content,options){
  options=options||{};
  return '<span class="'+esc(classes('wb-ui-card-icon',options.className))+'">'+(content||'')+'</span>';
}
function card(options){
  options=options||{};
  return '<button type="button" class="'+esc(classes('wb-ui-card',options.className))+'"'+attrs(options.attrs||{})+'>'+
    (options.icon?cardIcon(options.icon,options.iconOptions):'')+
    '<span class="wb-ui-card-main"><span class="wb-ui-card-title">'+esc(options.title||'Untitled')+'</span>'+
    (options.meta?metadata(options.meta,{className:'wb-ui-card-meta'}):'')+'</span>'+
    (options.after||'')+'</button>';
}
function statusChip(label,options){
  options=options||{};
  return '<span class="'+esc(classes('wb-ui-chip',options.className))+'">'+esc(label)+'</span>';
}
function noteChip(active,label){
  return active?statusChip(label||'Notes',{className:'wb-ui-chip-note'}):'';
}
function setHeaderControls(options){
  options=options||{};
  var noteClass=classes('sl-option-btn icon-only sl-notes-quick',options.hasNotes?'has-notes':'');
  return '<div class="sl-hdr-meta '+esc(options.metaClass||'')+'"><span class="workspace-editor-count" '+(options.countId?'id="'+esc(options.countId)+'"':'')+'>'+esc(options.countLabel||'0 songs')+'</span>'+
    '<button class="workspace-editor-key sl-set-key-info" '+(options.keyId?'id="'+esc(options.keyId)+'"':'')+' type="button">'+esc(options.keyLabel||'Default: Original')+'</button></div>'+
    '<div class="sl-btns '+esc(options.actionsClass||'')+'">'+
    iconButton({id:options.notesId,className:noteClass,icon:'notes',label:options.notesLabel||'Set notes'})+
    iconButton({id:options.moreId,className:'sl-option-btn icon-only',icon:'more',label:options.moreLabel||'Set options'})+
    '<button class="sl-clear-btn" '+(options.clearId?'id="'+esc(options.clearId)+'"':'')+' type="button">Clear</button></div>';
}

var registry={
  phase:'Phase 2b - B2',
  owner:'src/ui/components.js',
  patterns:['backButton','iconButton','metadata','cardIcon','card','statusChip','noteChip','setHeaderControls'],
  rule:'New or extracted renderers must use this owner for repeated UI markup before adding bespoke markup.'
};

root.WBUI={
  registry:registry,
  esc:esc,
  attrs:attrs,
  classes:classes,
  icon:icon,
  backButton:backButton,
  iconButton:iconButton,
  metadata:metadata,
  cardIcon:cardIcon,
  card:card,
  statusChip:statusChip,
  noteChip:noteChip,
  setHeaderControls:setHeaderControls
};
})(window);
