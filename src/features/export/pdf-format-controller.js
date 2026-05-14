/* WorshipBase Phase K4 app-generated export/PDF format controller.
   Purpose: create a single owner for export/PDF formatting metadata before any visual or PDF-layout changes.
   This does not change the current PDF engine. Attached song PDF workflows remain cancelled. */
(function(root){
'use strict';

var PHASE='K4';
var SCOPE='app-generated-pdf-only';

var PRESETS={
  compact:{
    id:'compact',
    label:'Compact',
    description:'More songs per page; smallest readable spacing.',
    intent:'service-planning-printout',
    review:['line-density','chord-legibility','section-label-visibility','page-break-control']
  },
  standard:{
    id:'standard',
    label:'Standard',
    description:'Balanced readability and page count.',
    intent:'default-readable-export',
    review:['title-hierarchy','chord-visibility','lyric-spacing','meta-clarity']
  },
  large:{
    id:'large',
    label:'Large',
    description:'Higher visibility for rehearsal or stage reference.',
    intent:'visibility-first-export',
    review:['page-count','large-text-fit','chord-wrap','section-spacing']
  }
};

var REVIEW_AREAS=[
  { id:'title-meta', label:'Title and metadata hierarchy', owner:'export/pdf' },
  { id:'section-labels', label:'Section label clarity and spacing', owner:'export/pdf' },
  { id:'chords', label:'Chord visibility and chord/lyric alignment', owner:'song chart + export/pdf' },
  { id:'lyrics', label:'Lyric readability and line height', owner:'export/pdf' },
  { id:'page-breaks', label:'Song and section page-break behaviour', owner:'export/pdf' },
  { id:'preview-actions', label:'Phone preview action colours and placement', owner:'export/pdf style' },
  { id:'theme-tokens', label:'Export menu highlights and preview buttons use theme tokens', owner:'styles/export-pdf' }
];

var CANCELLED_WORKFLOWS=[
  'attached-song-pdf-upload',
  'attached-song-pdf-base64-storage',
  'attached-song-pdf-extraction'
];

function clone(value){
  try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}
}

function normalisePreset(value){
  var key=String(value||'standard').trim().toLowerCase();
  return PRESETS[key] ? key : 'standard';
}

function getPreset(value){
  return clone(PRESETS[normalisePreset(value)]);
}

function listPresets(){
  return Object.keys(PRESETS).map(function(key){return clone(PRESETS[key]);});
}

function getReviewAreas(){
  return REVIEW_AREAS.map(clone);
}

function getCancelledWorkflows(){
  return CANCELLED_WORKFLOWS.slice();
}

function isAttachedPdfWorkflow(name){
  var key=String(name||'').trim().toLowerCase();
  return CANCELLED_WORKFLOWS.indexOf(key)>=0;
}

function buildFormatContract(options){
  options=options||{};
  var preset=getPreset(options.preset);
  return {
    phase:PHASE,
    scope:SCOPE,
    preset:preset.id,
    presetLabel:preset.label,
    includeChords:options.includeChords!==false,
    includeNotes:!!options.includeNotes,
    includeCover:!!options.includeCover,
    includeKeys:options.includeKeys!==false,
    reviewRequired:preset.review.slice(),
    attachedSongPdfWorkflows:'cancelled'
  };
}

function shouldReviewChange(changeArea){
  var key=String(changeArea||'').trim().toLowerCase();
  if(!key) return false;
  return REVIEW_AREAS.some(function(area){return area.id===key || area.owner.toLowerCase().indexOf(key)>=0;});
}

root.WBExportPdfFormatController={
  phase:PHASE,
  scope:SCOPE,
  listPresets:listPresets,
  getPreset:getPreset,
  normalisePreset:normalisePreset,
  getReviewAreas:getReviewAreas,
  getCancelledWorkflows:getCancelledWorkflows,
  isAttachedPdfWorkflow:isAttachedPdfWorkflow,
  buildFormatContract:buildFormatContract,
  shouldReviewChange:shouldReviewChange
};
})(window);
