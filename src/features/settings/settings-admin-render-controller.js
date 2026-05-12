/* WorshipBase Phase 2b - H2 Settings/Admin render-action owner.
   Owns Settings/Admin render fragments and action-facing models while the legacy shell remains the temporary host.
   This module must stay deterministic: it receives state/context and returns HTML or plain models. */
(function(root){
'use strict';
function own(obj){return obj&&typeof obj==='object'?obj:{}}
function esc(v){
  if(root.WBUtils&&root.WBUtils.esc)return root.WBUtils.esc(v);
  return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
}
var ICON_PATHS={
  dark:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  text:'<path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="M13.5 6.5l4 4"/>',
  theme:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  music:'<path d="M9 18.5a2.5 2.5 0 1 1-1-2V6l10-2v10.5a2.5 2.5 0 1 1-1-2V8L9 9.5z"/>',
  view:'<path d="M5 7h14M5 12h14M5 17h14"/>',
  highlight:'<rect x="5" y="7" width="14" height="10" rx="2"/><path d="M8 12h8"/>',
  flat:'<path d="M10 4v15"/><path d="M10 12.5c4-3 7-1.7 7 1.3 0 3.5-4.2 4.8-7 5.2"/>',
  phone:'<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 18h2"/>',
  set:'<path d="M5 7h9M5 12h7M5 17h9"/><path d="M17 10v6M14 13h6"/>',
  pdf:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h4"/>',
  bible:'<path d="M7 4h10v16H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  backup:'<path d="M12 3 5 6v5c0 4.5 2.9 7.8 7 10 4.1-2.2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/>'
};
function settingsIcon(name){return '<span class="ss-ico"><svg viewBox="0 0 24 24">'+(ICON_PATHS[name]||ICON_PATHS.theme)+'</svg></span>'}
function settingLabel(key,val,controller){
  controller=controller||root.WBSettingsController||{};
  if(controller.settingLabel)return controller.settingLabel(key,val);
  var labels={defaultDisplayKey:{original:'Original'},defaultSongView:{chords:'Chords',lyrics:'Lyrics',nns:'NNS'},defaultPdfPreset:{stage:'Stage chart',rehearsal:'Rehearsal',compact:'Compact print',lyrics:'Lyrics only'},addToSetBehavior:{ask:'Ask',active:'Active set'},defaultBibleVersion:{esv:'ESV'}};
  return labels[key]&&labels[key][val]||val;
}
function choiceSub(key,settings,controller){
  settings=own(settings);controller=controller||root.WBSettingsController||{};
  if(controller.choiceSub)return controller.choiceSub(key,settings);
  if(key==='defaultDisplayKey')return settings.defaultDisplayKey==='original'?'Show songs in their original key':'All songs open in key of '+settings.defaultDisplayKey;
  if(key==='defaultSongView')return 'Songs open in '+settingLabel('defaultSongView',settings.defaultSongView,controller)+' view';
  if(key==='defaultPdfPreset')return 'Open export on '+settingLabel('defaultPdfPreset',settings.defaultPdfPreset,controller)+' preset';
  if(key==='addToSetBehavior')return 'Ask every time which set to use';
  if(key==='defaultBibleVersion')return 'Bible opens in '+settingLabel('defaultBibleVersion',settings.defaultBibleVersion,controller);
  return '';
}
function choiceRow(opts){
  opts=own(opts);var settings=own(opts.settings),key=opts.key,idbase=opts.idbase||key,controller=opts.controller||root.WBSettingsController||{};
  return '<button class="ss-row" data-choice-key="'+esc(key)+'" type="button">'+settingsIcon(opts.icon)+'<div class="ss-body"><div class="ss-lbl">'+esc(opts.title)+'</div><div class="ss-sub" id="'+esc(idbase)+'-sub">'+esc(choiceSub(key,settings,controller))+'</div></div><div class="ss-right"><span class="ss-val" id="'+esc(idbase)+'-val">'+esc(settingLabel(key,settings[key],controller))+'</span><svg fill="none" height="12" viewBox="0 0 7 12" width="7"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg></div></button>';
}
function toggleRow(opts){
  opts=own(opts);var settings=own(opts.settings),key=opts.key;
  return '<div class="ss-row no-tap">'+settingsIcon(opts.icon)+'<div class="ss-body"><div class="ss-lbl">'+esc(opts.title)+'</div>'+(opts.sub?'<div class="ss-sub">'+esc(opts.sub)+'</div>':'')+'</div><button class="sw '+(settings[key]?'on':'')+'" id="'+esc(opts.id||key)+'" data-toggle-setting="'+esc(key)+'" type="button" aria-label="Toggle '+esc(opts.title)+'"><span class="sw-thumb"></span></button></div>';
}
function driveStatusValueHtml(stats){
  stats=own(stats);
  return '<span class="drive-status-value"><span class="wb-settings-drive-dot '+esc(stats.driveDotClass||'disconnected')+'"></span>'+esc(stats.drive||'Not connected')+'</span>';
}
function backupSummaryHtml(stats,driveHtml){
  stats=own(stats);driveHtml=driveHtml||driveStatusValueHtml(stats);
  return '<div class="ss-section" id="wb-backup-restore-section"><div class="ss-title">Backup &amp; Restore</div><div class="wb-settings-backup-card"><button class="wb-settings-backup-row wb-bc-entry-row" id="wb-backup-centre-entry-row" data-settings-action="backup" type="button">'+settingsIcon('backup')+'<div class="ss-body"><div class="ss-lbl">Backup Centre</div><div class="ss-sub">Local files and Google Drive backup in one place.</div></div><div class="ss-right"><span class="wb-bc-entry-pill">OPEN</span><svg fill="none" height="12" viewBox="0 0 7 12" width="7"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg></div></button><div class="wb-settings-backup-summary"><div class="wb-settings-backup-grid"><div class="wb-settings-backup-mini"><div class="wb-settings-backup-mini-label">My songs</div><div class="wb-settings-backup-mini-value">'+esc(stats.localSongs||0)+'</div></div><div class="wb-settings-backup-mini"><div class="wb-settings-backup-mini-label">Personal set lists</div><div class="wb-settings-backup-mini-value">'+esc(stats.setLists||0)+'</div></div><div class="wb-settings-backup-mini"><div class="wb-settings-backup-mini-label">Notes &amp; cues</div><div class="wb-settings-backup-mini-value">'+esc(stats.notes||0)+'</div></div><div class="wb-settings-backup-mini"><div class="wb-settings-backup-mini-label">Google Drive</div><div class="wb-settings-backup-mini-value">'+driveHtml+'</div></div></div><div class="wb-settings-backup-footer">Drive backup is now wired for runtime OAuth and hidden appDataFolder storage.</div></div></div></div>';
}
function themeSwatchesHtml(ctx){
  ctx=own(ctx);var settings=own(ctx.settings),palette=own(ctx.palette),active=ctx.activeThemeKey||settings.theme||'stone';
  return Object.keys(palette).map(function(k){var t=own(palette[k]);var dark=own(t.dark);var dot=settings.darkMode?(dark.accentStrong||t.c):(t.c||'#10374A');var isActive=active===k;var light=/^(#fff|#ffffff)$/i.test(dot);return '<button class="theme-sw '+(isActive?'active ':'')+(light?'light-check':'')+'" data-theme-value="'+esc(k)+'" type="button" aria-label="'+esc(t.name||k)+' theme" style="--theme-dot:'+esc(dot)+'"></button>'}).join('');
}
function renderSettingsHtml(ctx){
  ctx=own(ctx);var settings=own(ctx.settings),controller=ctx.controller||root.WBSettingsController||{},stats=own(ctx.stats),scalePct=Math.max(0,Math.min(100,parseFloat(ctx.scalePct)||0));
  var html='';
  html+='<div class="ss-section"><div class="ss-title">Appearance</div><div class="ss-card">';
  html+=toggleRow({settings:settings,icon:'dark',title:'Dark mode',key:'darkMode',id:'dark-sw'});
  html+='<div class="ss-row no-tap">'+settingsIcon('text')+'<div class="ss-body"><div class="ss-lbl">Text size</div><div class="sz-wrap"><span class="sz-a">A</span><input class="sz-slider" id="settings-text-size" data-text-size-slider type="range" min="0.85" max="1.25" step="0.05" value="'+esc(settings.textSize)+'" style="--pct:'+esc(scalePct)+'%"><span class="sz-a big">A</span></div></div></div>';
  html+='<div class="ss-row no-tap">'+settingsIcon('theme')+'<div class="ss-body"><div class="ss-lbl">Colour theme</div></div></div><div class="theme-row">'+themeSwatchesHtml({settings:settings,palette:ctx.palette,activeThemeKey:ctx.activeThemeKey})+'</div>';
  html+='</div></div>';
  html+='<div class="ss-section"><div class="ss-title">Library</div><div class="ss-card">'+choiceRow({settings:settings,controller:controller,icon:'music',title:'Default display key',key:'defaultDisplayKey',idbase:'def-key'})+choiceRow({settings:settings,controller:controller,icon:'view',title:'Default song view',key:'defaultSongView',idbase:'def-songview'})+'</div></div>';
  html+='<div class="ss-section"><div class="ss-title">Song defaults</div><div class="ss-card">'+toggleRow({settings:settings,icon:'highlight',title:'Highlight chords by default',sub:'Songs open with chord highlight '+(settings.highlightChordsDefault?'on':'off'),key:'highlightChordsDefault',id:'default-highlight-sw'})+toggleRow({settings:settings,icon:'flat',title:'Use flats by default',sub:'Prefer flats when songs open',key:'useFlatsDefault',id:'default-flats-sw'})+toggleRow({settings:settings,icon:'phone',title:'Keep screen awake on song pages',sub:'Prevent screen sleep while viewing songs',key:'keepScreenAwakeOnSongs',id:'keep-awake-sw'})+'</div></div>';
  html+='<div class="ss-section"><div class="ss-title">Preview</div><div class="ss-card">'+choiceRow({settings:settings,controller:controller,icon:'pdf',title:'Default PDF preset',key:'defaultPdfPreset',idbase:'def-pdf'})+'</div></div>';
  html+='<div class="ss-section"><div class="ss-title">Bible</div><div class="ss-card">'+choiceRow({settings:settings,controller:controller,icon:'bible',title:'Default Bible version',key:'defaultBibleVersion',idbase:'def-bible'})+'</div></div>';
  html+=backupSummaryHtml(stats,ctx.driveStatusHtml);
  html+=String(ctx.adminToolsHtml||'');
  html+='<div class="ss-section"><div class="ss-title">About</div><div class="ss-card"><div class="about-panel"><div class="wb-brand-mark" id="about-brand-mark" aria-hidden="true">'+String(ctx.brandMarkHtml||'')+'</div><div class="about-copy"><div class="about-name" id="about-brand-name">WorshipBase</div><div class="about-version-pill">'+esc(ctx.version||'')+'</div><div class="about-by">Created by <strong>Jerin Reji</strong></div>'+(ctx.adminUnlocked?'<div class="admin-state-line unlocked">Admin mode unlocked</div>':'')+'</div></div></div></div>';
  return html;
}
function renderPickerOptionsHtml(opts){
  opts=own(opts);var controller=opts.controller||root.WBSettingsController||{},choices=own(opts.choices),key=opts.key,current=opts.current;
  var models=controller.optionModels?controller.optionModels(choices,key,current):(choices[key]||[]).map(function(o){return {key:key,value:o[0],label:o[1],active:String(current)===String(o[0])}});
  return models.map(function(o){return '<button class="settings-option '+(o.active?'active':'')+'" data-picker-key="'+esc(key)+'" data-picker-value="'+esc(o.value)+'" type="button">'+esc(o.label)+'</button>'}).join('');
}
function actionContract(){
  return {phase:'Phase 2b - H2',owner:'WBSettingsAdminRenderController',contracts:['settingsIcon','choiceRow','toggleRow','backupSummaryHtml','renderSettingsHtml','renderPickerOptionsHtml'],legacyShellHost:true,nonDestructive:true};
}
root.WBSettingsAdminRenderController={
  settingsIcon:settingsIcon,
  settingLabel:settingLabel,
  choiceSub:choiceSub,
  choiceRow:choiceRow,
  toggleRow:toggleRow,
  driveStatusValueHtml:driveStatusValueHtml,
  backupSummaryHtml:backupSummaryHtml,
  renderSettingsHtml:renderSettingsHtml,
  renderPickerOptionsHtml:renderPickerOptionsHtml,
  actionContract:actionContract,
  diagnostics:actionContract
};
})(window);
