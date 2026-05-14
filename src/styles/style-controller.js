/* WorshipBase Phase K4 style controller owner.
   Purpose: keep a single style/CSS ownership boundary while adding feature style ownership.
   This is not a redesign pass. It centralises style metadata, safe-area/layout tokens,
   and future owner assignments so later polish does not become patch stacking. */
(function(root){
'use strict';

var STYLE_PHASE='Phase 2b - B2';

var OWNER_AREAS={
  appShell:'src/styles/wb-ui-system.css + legacy shell',
  library:'features/library later + styles/library later',
  songView:'features/song + styles/song later',
  setList:'features/setlist + styles/setlist later',
  workspace:'features/workspace + styles/workspace later',
  tools:'features/tools + styles/tools later',
  settings:'features/settings + styles/settings later',
  backup:'features/backup + styles/backup later',
  exportPdf:'src/features/export + future styles/export.css; app-generated PDF only',
  cancelledAttachedPdf:'cancelled; no style or workflow owner'
};

var TARGETED_POLISH_BACKLOG=[
  { id:'WB-J4-003', area:'tools/key-capo', note:'Review Key/Capo selectors and suggestions for usability after owner extraction.' },
  { id:'WB-J4-004', area:'tools/bible-version-picker', note:'Improve Bible version picker metadata arrangement.' },
  { id:'WB-J4-005', area:'backup', note:'Show clear backup completion details after Drive backup actions.' },
  { id:'WB-EXP-001', area:'export/pdf', note:'Review app-generated PDF readability, spacing, chord visibility, and preview controls.' },
  { id:'WB-K3-001', area:'export/pdf', note:'Use WBExportPdfFormatController before changing PDF presets, preview actions, or page layout.' },
  { id:'WB-C1-008', area:'backup', note:'Review Backup Centre Done button safe-area placement.' },
  { id:'WB-C1-009', area:'export', note:'Make export menu highlights fully theme-driven.' },
  { id:'WB-C1-010', area:'pdf-preview', note:'Review PDF preview top button colours using theme tokens.' },
  { id:'WB-C1-012', area:'publish-sheet', note:'Review Publish to Workspace action-button vertical placement.' },
  { id:'WB-H-005', area:'song-view/swipe', note:'Improve next/previous song swipe smoothness in normal and focus mode.' },
  { id:'WB-I-006', area:'workspace/reorder', note:'Unify Workspace reorder feel with personal Set List reorder.' },
  { id:'WB-I-007', area:'setlist/workspace/reorder', note:'Increase drag-handle touch area without changing visual density.' },
  { id:'WB-I-008', area:'setlist/song-notes', note:'Expose set and song notes with small indicators and pop-up/sheet access.' }
];

function getFeatureRegistry(){
  return root.WBFeatureStyleRegistry || null;
}

function getOwner(area){
  return OWNER_AREAS[area] || 'unassigned style owner';
}

function listPolishBacklog(){
  return TARGETED_POLISH_BACKLOG.slice();
}

function listFeatureStyleOwners(){
  var registry=getFeatureRegistry();
  return registry && typeof registry.listOwners==='function' ? registry.listOwners() : [];
}

function getFeatureStyleOwner(featureId){
  var registry=getFeatureRegistry();
  return registry && typeof registry.getOwner==='function' ? registry.getOwner(featureId) : null;
}

function getSafeAreaTokenNames(){
  return ['--sat','--sab','env(safe-area-inset-top)','env(safe-area-inset-bottom)'];
}

function getThemeTokenNames(){
  return [
    '--tc','--accent','--accent-bg','--accent-fg',
    '--bg1','--bg2','--bg3',
    '--txt1','--txt2','--txt3',
    '--surface-tint','--surface-border',
    '--wb-card-fill','--wb-card-border','--wb-control-fill'
  ];
}

function applyPhaseMarker(){
  try{ document.documentElement.setAttribute('data-wb-style-phase', STYLE_PHASE); }catch(e){}
}

root.WBStyleController={
  phase:STYLE_PHASE,
  ownerAreas:OWNER_AREAS,
  getOwner:getOwner,
  listPolishBacklog:listPolishBacklog,
  listFeatureStyleOwners:listFeatureStyleOwners,
  getFeatureStyleOwner:getFeatureStyleOwner,
  getSafeAreaTokenNames:getSafeAreaTokenNames,
  getThemeTokenNames:getThemeTokenNames,
  applyPhaseMarker:applyPhaseMarker
};

try{ applyPhaseMarker(); }catch(e){}
})(window);
