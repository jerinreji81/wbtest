/* WorshipBase Phase J2 Settings controller owner.
   Owns settings normalisation, choice labels, theme/token calculations, and settings update semantics.
   Rendering remains in the legacy shell as a compatibility adapter until the Settings feature is fully extracted. */
(function(root){
'use strict';

var DEFAULT_PICKER_IDS={
  defaultDisplayKey:'defkey-options',
  defaultSongView:'defsongview-options',
  defaultPdfPreset:'defpdf-options',
  addToSetBehavior:'addtoset-options',
  defaultBibleVersion:'defbible-options'
};
var LABELS={
  defaultDisplayKey:{original:'Original'},
  defaultSongView:{chords:'Chords',lyrics:'Lyrics',nns:'NNS'},
  defaultPdfPreset:{stage:'Stage chart',rehearsal:'Rehearsal',compact:'Compact print',lyrics:'Lyrics only'},
  addToSetBehavior:{ask:'Ask',active:'Active set'},
  defaultBibleVersion:{esv:'ESV'}
};
var TEXT_SIZE_MIN=.85;
var TEXT_SIZE_MAX=1.25;

function own(obj){return obj&&typeof obj==='object'?obj:{}};
function cloneSettings(base,defaults,palette){
  defaults=own(defaults);palette=own(palette);
  var s=Object.assign({},defaults,own(base));
  if(s.addToSetBehavior&&s.addToSetBehavior!=='ask')s.addToSetBehavior='ask';
  ['theme','themeLight','themeDark'].forEach(function(k){
    if(!palette[s[k]])s[k]=defaults[k]||defaults.theme||'stone';
  });
  if(['lyrics','chords','nns'].indexOf(String(s.defaultSongView||''))<0)s.defaultSongView=defaults.defaultSongView||'chords';
  var size=parseFloat(s.textSize);if(!isFinite(size))size=parseFloat(defaults.textSize)||1;
  s.textSize=Math.max(TEXT_SIZE_MIN,Math.min(TEXT_SIZE_MAX,size));
  return s;
}
function activeThemeKey(settings,defaults,palette){
  settings=cloneSettings(settings,defaults,palette);
  return settings.darkMode?(settings.themeDark||settings.theme||'stone'):(settings.themeLight||settings.theme||'stone');
}
function currentTheme(settings,defaults,palette){
  palette=own(palette);
  return palette[activeThemeKey(settings,defaults,palette)]||palette.stone||palette.darkteal||{};
}
function activeThemeHex(settings,defaults,palette){
  var theme=currentTheme(settings,defaults,palette);
  return theme.c||'#10374A';
}
function hexToRgba(hex,a){
  var h=String(hex||'#10374A').replace('#','');
  if(h.length===3)h=h.split('').map(function(x){return x+x}).join('');
  var n=parseInt(h,16);if(!isFinite(n))n=0x10374A;
  var r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  return 'rgba('+r+','+g+','+b+','+a+')';
}
function hexToHsl(hex){
  var h2=String(hex||'#10374A').replace('#','');
  if(h2.length===3)h2=h2.split('').map(function(c){return c+c}).join('');
  var r=parseInt(h2.slice(0,2),16)/255,g=parseInt(h2.slice(2,4),16)/255,b=parseInt(h2.slice(4,6),16)/255;
  if(!isFinite(r))r=16/255;if(!isFinite(g))g=55/255;if(!isFinite(b))b=74/255;
  var max=Math.max(r,g,b),min=Math.min(r,g,b),h,s,l=(max+min)/2;
  if(max===min){h=s=0}else{
    var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4}
    h*=60;
  }
  return {h:Math.round(h||0),s:Math.round((s||0)*100),l:Math.round(l*100)};
}
function clamp(n,mn,mx){return Math.max(mn,Math.min(mx,n))}
function accentTextFor(hex){
  try{
    hex=String(hex||'').replace('#','');
    if(hex.length===3)hex=hex.split('').map(function(c){return c+c}).join('');
    var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
    var lum=(0.2126*r+0.7152*g+0.0722*b)/255;
    return lum>.56?'#0d1e26':'#ffffff';
  }catch(e){return '#ffffff'}
}
function textScale(settings,defaults,palette){
  settings=cloneSettings(settings,defaults,palette);
  return Math.max(TEXT_SIZE_MIN,Math.min(TEXT_SIZE_MAX,parseFloat(settings.textSize)||1));
}
function textSizePercent(value){
  var size=parseFloat(value);if(!isFinite(size))size=1;
  return Math.max(0,Math.min(100,Math.round(((size-TEXT_SIZE_MIN)/(TEXT_SIZE_MAX-TEXT_SIZE_MIN))*100)));
}
function settingLabel(key,val){
  return (LABELS[key]&&LABELS[key][val])||val;
}
function choiceSub(key,settings){
  settings=own(settings);
  if(key==='defaultDisplayKey')return settings.defaultDisplayKey==='original'?'Show songs in their original key':'All songs open in key of '+settings.defaultDisplayKey;
  if(key==='defaultSongView')return 'Songs open in '+settingLabel('defaultSongView',settings.defaultSongView)+' view';
  if(key==='defaultPdfPreset')return 'Open export on '+settingLabel('defaultPdfPreset',settings.defaultPdfPreset)+' preset';
  if(key==='addToSetBehavior')return 'Ask every time which set to use';
  if(key==='defaultBibleVersion')return 'Bible opens in '+settingLabel('defaultBibleVersion',settings.defaultBibleVersion);
  return '';
}
function optionModels(choices,key,current){
  return (choices&&choices[key]||[]).map(function(o){return {key:key,value:o[0],label:o[1],active:String(current)===String(o[0])};});
}
function updateSetting(settings,key,value,ctx){
  ctx=ctx||{};
  var next=cloneSettings(settings,ctx.defaults,ctx.palette);
  if(key==='addToSetBehavior'){
    next.addToSetBehavior='ask';
  }else if(key==='theme'){
    if(next.darkMode)next.themeDark=value;else next.themeLight=value;
    next.theme=value;
  }else if(key==='darkMode'){
    next.darkMode=!!value;
    next.theme=activeThemeKey(next,ctx.defaults,ctx.palette);
  }else if(key==='textSize'){
    var size=parseFloat(value);next.textSize=Math.max(TEXT_SIZE_MIN,Math.min(TEXT_SIZE_MAX,isFinite(size)?size:1));
  }else{
    next[key]=value;
  }
  return cloneSettings(next,ctx.defaults,ctx.palette);
}
function applyThemeVars(doc,settings,defaults,palette){
  doc=doc||root.document;if(!doc||!doc.documentElement)return;
  settings=cloneSettings(settings,defaults,palette);palette=own(palette);
  var theme=currentTheme(settings,defaults,palette),rootEl=doc.documentElement;
  if(settings.darkMode){
    var d=theme.dark||{};
    rootEl.style.setProperty('--tc',d.accentStrong||theme.c||'#ffffff');
    rootEl.style.setProperty('--tc2',d.accent||theme.c2||theme.c||'#ffffff');
    rootEl.style.setProperty('--tc3',d.accentStrong||theme.c3||theme.c||'#ffffff');
    rootEl.style.setProperty('--tc-light','rgba(255,255,255,.08)');
    rootEl.style.setProperty('--tc-mid','rgba(255,255,255,.18)');
    rootEl.style.setProperty('--tc-faint',hexToRgba(d.accentStrong||theme.c||'#ffffff',.18));
    rootEl.style.setProperty('--accent',d.accent||theme.c||'#ffffff');
    rootEl.style.setProperty('--accent-strong',d.accentStrong||theme.c||'#ffffff');
    rootEl.style.setProperty('--accent-surface',hexToRgba(d.accentStrong||theme.c||'#ffffff',.18));
    rootEl.style.setProperty('--accent-surface-strong',hexToRgba(d.accentStrong||theme.c||'#ffffff',.28));
    rootEl.style.setProperty('--accent-border',hexToRgba(d.accentStrong||theme.c||'#ffffff',.46));
    rootEl.style.setProperty('--accent-bg',hexToRgba(d.accentStrong||theme.c||'#ffffff',.18));
    rootEl.style.setProperty('--chord-color',d.chord||d.accent||theme.c||'#ffffff');
    rootEl.style.setProperty('--accent-fg',accentTextFor(d.accent||d.accentStrong||theme.c||'#ffffff'));
  }else{
    rootEl.style.setProperty('--tc',theme.c||'#10374A');
    rootEl.style.setProperty('--tc2',theme.c2||theme.c||'#17506c');
    rootEl.style.setProperty('--tc3',theme.c3||theme.c||'#0a2534');
    rootEl.style.setProperty('--tc-light',theme.light||'#e8f3f7');
    rootEl.style.setProperty('--tc-mid',theme.mid||'#7ab8cc');
    rootEl.style.setProperty('--tc-faint',hexToRgba(theme.c||'#10374A',.07));
    rootEl.style.setProperty('--surface-tint','rgba(16,55,74,.05)');
    rootEl.style.setProperty('--surface-tint-strong','rgba(16,55,74,.09)');
    rootEl.style.setProperty('--surface-border','rgba(16,55,74,.12)');
    rootEl.style.setProperty('--accent',theme.c||'#10374A');
    rootEl.style.setProperty('--accent-bg',theme.light||'#e8f3f7');
    rootEl.style.setProperty('--accent-fg',accentTextFor(theme.c||'#10374A'));
    rootEl.style.removeProperty('--accent-strong');
    rootEl.style.removeProperty('--accent-surface');
    rootEl.style.removeProperty('--accent-surface-strong');
    rootEl.style.removeProperty('--accent-border');
    rootEl.style.removeProperty('--chord-color');
  }
}
function applyHighlightThemeVars(doc,settings,defaults,palette){
  doc=doc||root.document;if(!doc||!doc.documentElement)return;
  settings=cloneSettings(settings,defaults,palette);
  var rootEl=doc.documentElement,theme=currentTheme(settings,defaults,palette);
  if(settings.darkMode){
    var d=theme.dark||{};
    rootEl.style.setProperty('--chord-highlight-bg',hexToRgba(d.accentStrong||theme.c||'#ffffff',.22));
    rootEl.style.setProperty('--chord-color',d.chord||d.accent||theme.c||'#ffffff');
  }else{
    var hex=activeThemeHex(settings,defaults,palette),hs=hexToHsl(hex),l=clamp(92-Math.min(hs.s,50)*0.04,89,92),sat=clamp(Math.max(Math.round(hs.s*0.7),22),22,48);
    rootEl.style.setProperty('--chord-highlight-bg','hsl('+hs.h+','+sat+'%,'+l+'%)');
  }
}
function applyDocumentSettings(doc,settings,defaults,palette){
  doc=doc||root.document;if(!doc)return cloneSettings(settings,defaults,palette);
  var s=cloneSettings(settings,defaults,palette);
  if(doc.body)doc.body.classList.toggle('dark',!!s.darkMode);
  applyThemeVars(doc,s,defaults,palette);
  applyHighlightThemeVars(doc,s,defaults,palette);
  if(doc.documentElement)doc.documentElement.style.setProperty('--wb-text-scale',textScale(s,defaults,palette));
  return s;
}

root.WBSettingsController={
  DEFAULT_PICKER_IDS:DEFAULT_PICKER_IDS,
  LABELS:LABELS,
  TEXT_SIZE_MIN:TEXT_SIZE_MIN,
  TEXT_SIZE_MAX:TEXT_SIZE_MAX,
  cloneSettings:cloneSettings,
  activeThemeKey:activeThemeKey,
  currentTheme:currentTheme,
  activeThemeHex:activeThemeHex,
  hexToRgba:hexToRgba,
  hexToHsl:hexToHsl,
  accentTextFor:accentTextFor,
  textScale:textScale,
  textSizePercent:textSizePercent,
  settingLabel:settingLabel,
  choiceSub:choiceSub,
  optionModels:optionModels,
  updateSetting:updateSetting,
  applyThemeVars:applyThemeVars,
  applyHighlightThemeVars:applyHighlightThemeVars,
  applyDocumentSettings:applyDocumentSettings
};
})(window);
