/* WorshipBase Phase K4 feature style ownership registry.
   Purpose: define style ownership boundaries without moving CSS or changing visuals.
   Later K phases can move/co-locate CSS by owner using this registry rather than
   adding one-off override blocks. */
(function(root){
'use strict';

var PHASE='Phase 2b - B2';

var OWNERS=[
  {
    id:'app-shell',
    owner:'legacy shell',
    eventualPath:'src/styles/app-shell.css',
    selectors:['#app','.hdr','.tab-bar','.route','.bs-bg','.bs'],
    status:'canonical-ui-system'
  },
  {
    id:'library',
    owner:'src/styles/wb-ui-system.css until feature split',
    eventualPath:'src/features/library/library.css',
    selectors:['#song-section','.srch-wrap','.song-item','.alpha-letter','.filter-chip'],
    status:'canonical-token-consumer'
  },
  {
    id:'song-view',
    owner:'src/features/song',
    eventualPath:'src/features/song/song-view.css',
    selectors:['#song-view','.sv-hdr','.sheet','.pair-line','.live-tools','.pres-section-rail'],
    status:'canonical-token-consumer'
  },
  {
    id:'setlist',
    owner:'src/features/setlist',
    eventualPath:'src/features/setlist/setlist.css',
    selectors:['#setlist-section','#wb-personal-manager','#wb-set-editor','.set-item','.wb-personal-card'],
    status:'canonical-token-consumer'
  },
  {
    id:'workspace',
    owner:'src/features/workspace',
    eventualPath:'src/features/workspace/workspace.css',
    selectors:['#workspace-section','.workspace-card','.wb806-subview','.wb805-subview','.wb763-subview'],
    status:'canonical-token-consumer'
  },
  {
    id:'tools',
    owner:'src/features/tools',
    eventualPath:'src/features/tools/tools.css',
    selectors:['#tools-section','#bible-section','.bible-combo','.bible-picker-list','.pad-card'],
    status:'canonical-token-consumer'
  },
  {
    id:'settings',
    owner:'src/features/settings',
    eventualPath:'src/features/settings/settings.css',
    selectors:['#settings-section','.settings-card','.theme-sw','.setting-row'],
    status:'canonical-token-consumer'
  },
  {
    id:'backup',
    owner:'src/features/backup',
    eventualPath:'src/features/backup/backup.css',
    selectors:['#backup-section','.backup-card','.restore-review','.drive-row'],
    status:'canonical-token-consumer'
  },
  {
    id:'export-pdf',
    owner:'src/features/export',
    eventualPath:'src/features/export/export.css',
    selectors:['.export-row','.export-grid','.preview-wrap','.preview-body'],
    status:'controller-boundary-established-app-generated-pdf-only'
  }
];

var TOKEN_GROUPS={
  color:['--tc','--accent','--accent-bg','--accent-fg','--bg1','--bg2','--bg3','--txt1','--txt2','--txt3'],
  surface:['--surface-tint','--surface-tint-strong','--surface-border','--wb-card-fill','--wb-card-border','--wb-control-fill'],
  geometry:['--rad','--rad-lg','--rad-pill','--item-h','--tab-h'],
  safeArea:['--sat','--sab'],
  typography:['--wb-text-scale']
};

function clone(value){
  try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}
}

function normaliseId(id){
  return String(id||'').trim().toLowerCase();
}

function listOwners(){
  return OWNERS.map(clone);
}

function getOwner(id){
  var needle=normaliseId(id);
  for(var i=0;i<OWNERS.length;i++){
    if(OWNERS[i].id===needle) return clone(OWNERS[i]);
  }
  return null;
}

function listSelectors(id){
  var owner=getOwner(id);
  return owner && owner.selectors ? owner.selectors.slice() : [];
}

function listTokenGroups(){
  return clone(TOKEN_GROUPS);
}

function findOwnerBySelector(selector){
  var sel=String(selector||'').trim();
  if(!sel) return null;
  for(var i=0;i<OWNERS.length;i++){
    if((OWNERS[i].selectors||[]).indexOf(sel)>=0) return clone(OWNERS[i]);
  }
  return null;
}

root.WBFeatureStyleRegistry={
  phase:PHASE,
  listOwners:listOwners,
  getOwner:getOwner,
  listSelectors:listSelectors,
  listTokenGroups:listTokenGroups,
  findOwnerBySelector:findOwnerBySelector
};
})(window);
