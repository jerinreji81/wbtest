/* WorshipBase Phase D constants owner.
   This file is the source of truth for static app constants extracted from the v8.17 legacy shell. */
(function(root){
'use strict';

var VERSION='Rebuild_8.17I3.1';
var REBUILD_PHASE='Phase I.3.1: Set/List song-view hierarchy stabilization';
var REBUILD_REFERENCE='Working-v85.0-fixed.html';

var ASSET_DEFAULTS={
  basePath:'./worshipbase_layered_fold_w_proper/',
  icon180Url:'./worshipbase_layered_fold_w_proper/app-icons/app-icon-180.png',
  icon192Url:'./worshipbase_layered_fold_w_proper/app-icons/app-icon-192.png',
  icon512Url:'./worshipbase_layered_fold_w_proper/app-icons/app-icon-512.png',
  appleTouchIconUrl:'./worshipbase_layered_fold_w_proper/app-icons/apple-touch-icon.png',
  markUrl:'./worshipbase_layered_fold_w_proper/png/worshipbase-mark-256.png',
  markLargeUrl:'./worshipbase_layered_fold_w_proper/png/worshipbase-mark-512.png',
  logoLightUrl:'./worshipbase_layered_fold_w_proper/svg/worshipbase-logo-primary-light.svg',
  logoDarkUrl:'./worshipbase_layered_fold_w_proper/svg/worshipbase-logo-primary-dark.svg',
  launchImageUrl:'./worshipbase_layered_fold_w_proper/launch/launch-dark.png',
  wordmarkText:'WorshipBase'
};

var STORAGE_KEYS={
  songs:'wb_rebuild_52_songs',
  songMemory:'wb_rebuild_52_song_memory',
  sets:'wb_rebuild_52_sets',
  recents:'wb_rebuild_52_recents',
  settings:'wb_rebuild_52_settings',
  workspace:'wb_rebuild_52_workspace',
  cloud:'wb_rebuild_52_cloud',
  routeMemory:'wb_rebuild_52_route_memory',
  firebaseSongsCache:'wb_rebuild_52_firebase_song_cache',
  bibleCache:'wb_rebuild_52_bible_cache'
};

var DEFAULT_SETTINGS={
  darkMode:false,
  textSize:1,
  themeLight:'stone',
  themeDark:'stone',
  theme:'stone',
  defaultDisplayKey:'original',
  defaultSongView:'chords',
  highlightChordsDefault:true,
  useFlatsDefault:false,
  keepScreenAwakeOnSongs:false,
  addToSetBehavior:'ask',
  defaultPdfPreset:'rehearsal',
  defaultBibleVersion:'esv'
};

var NOTES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var NOTES_SHARP=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var NOTES_FLAT=['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

var SETTINGS_CHOICES={
  defaultDisplayKey:[['original','Original key']]
    .concat(NOTES.map(function(n){return [n,n]}))
    .concat(NOTES.map(function(n){return [n+'m',n+'m']})),
  defaultSongView:[['lyrics','Lyrics'],['chords','Chords'],['nns','NNS']],
  defaultPdfPreset:[['stage','Stage chart'],['rehearsal','Rehearsal'],['compact','Compact print'],['lyrics','Lyrics only']],
  addToSetBehavior:[['ask','Ask every time'],['active','Use active set']],
  defaultBibleVersion:[['esv','ESV']]
};

var THEME_PALETTE={
  neutral:{name:'Neutral',c:'#111111',c2:'#2f3945',c3:'#050506',light:'#eef1f4',mid:'#56657a',dark:{accent:'#f2f2f2',accentStrong:'#ffffff',chord:'#ffffff',accentFg:'#000000'}},
  forest:{name:'Forest',c:'#1A4731',c2:'#27724f',c3:'#08291b',light:'#eaf6ef',mid:'#63ba83',dark:{accent:'#9ee6b3',accentStrong:'#54c878',chord:'#b8f0c7',accentFg:'#061109'}},
  olive:{name:'Sage / Olive',c:'#6F7D3C',c2:'#8aa447',c3:'#36451a',light:'#f0f6d8',mid:'#bfd654',dark:{accent:'#d7e58e',accentStrong:'#bfd35b',chord:'#e8f2b1',accentFg:'#111307'}},
  stone:{name:'Stone / Taupe',c:'#8A7A68',c2:'#a08f7a',c3:'#51473c',light:'#f2eee8',mid:'#c9bdac',dark:{accent:'#ddd0bd',accentStrong:'#b9aa96',chord:'#eee4d5',accentFg:'#15110d'}},
  cedar:{name:'Cedar',c:'#7A5A4D',c2:'#9a735f',c3:'#573120',light:'#f5ede8',mid:'#d0a895',dark:{accent:'#e7bd99',accentStrong:'#d8945f',chord:'#f0d2b3',accentFg:'#160d07'}},
  mulberry:{name:'Mulberry',c:'#5A2034',c2:'#8a3955',c3:'#3f0e1f',light:'#f8e7ee',mid:'#d56a8b',dark:{accent:'#f1a6b8',accentStrong:'#e9799a',chord:'#fac4d0',accentFg:'#150609'}},
  purple:{name:'Deep Purple',c:'#3A0A55',c2:'#5c1f7d',c3:'#220135',light:'#f2eaf5',mid:'#b996c5',dark:{accent:'#dfbdff',accentStrong:'#b983ff',chord:'#ead7ff',accentFg:'#13001f'}},
  darkteal:{name:'Dark Teal',c:'#10374A',c2:'#17506c',c3:'#0a2534',light:'#e8f3f7',mid:'#7ab8cc',dark:{accent:'#8ee6e6',accentStrong:'#3fcaca',chord:'#b9f2f2',accentFg:'#041111'}},
  slate:{name:'Slate Blue',c:'#4F6480',c2:'#6986a6',c3:'#243246',light:'#eef3f8',mid:'#7895b8',dark:{accent:'#a8c7ff',accentStrong:'#7aa7ff',chord:'#c4d9ff',accentFg:'#050914'}},
  navy:{name:'Midnight Navy',c:'#2F4565',c2:'#4d668f',c3:'#1f2e45',light:'#ecf4ff',mid:'#7fa8e9',dark:{accent:'#b9d5ff',accentStrong:'#86b4ff',chord:'#d1e3ff',accentFg:'#06101d'}}
};

var GOOGLE_DRIVE={
  clientId:'137901259240-jkkun2kjr4a3bnfrqmbu1jk9ieqvn5jh.apps.googleusercontent.com',
  scope:'https://www.googleapis.com/auth/drive.appdata',
  backupName:'worshipbase-personal-backup.json',
  snapshotName:'worshipbase-pre-restore-snapshot.json',
  legacyStateKey:'wb_google_drive_backup_v1'
};

root.WBConstants={
  VERSION:VERSION,
  REBUILD_PHASE:REBUILD_PHASE,
  REBUILD_REFERENCE:REBUILD_REFERENCE,
  ASSET_DEFAULTS:ASSET_DEFAULTS,
  STORAGE_KEYS:STORAGE_KEYS,
  DEFAULT_SETTINGS:DEFAULT_SETTINGS,
  NOTES:NOTES,
  NOTES_SHARP:NOTES_SHARP,
  NOTES_FLAT:NOTES_FLAT,
  SETTINGS_CHOICES:SETTINGS_CHOICES,
  THEME_PALETTE:THEME_PALETTE,
  GOOGLE_DRIVE:GOOGLE_DRIVE
};
})(window);
