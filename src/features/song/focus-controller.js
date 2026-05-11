/* WorshipBase Phase H.3 focus/performance song-view owner.
   Owns section-rail data helpers, focus/live chrome class helpers, and mode-cycling helpers.
   Visual CSS, PDF/export, Firebase, backup, and attached song PDF workflows remain untouched. */
(function(root){
'use strict';

function fallbackEsc(v){
  return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
}

function normalizeSectionName(value){
  return String(value||'').trim().replace(/^\[|\]$/g,'').replace(/\s+/g,' ');
}

function isLikelySection(raw,chartApi){
  raw=normalizeSectionName(raw);
  if(!raw)return false;
  if(chartApi&&typeof chartApi.isSectionTag==='function')return !!chartApi.isSectionTag(raw);
  if(chartApi&&chartApi.isSectionTag)return !!chartApi.isSectionTag(raw);
  return !/^[A-G](?:#|b)?(?:m|maj|min|sus|dim|aug|add|\d|\/|\s)*$/i.test(raw);
}

function shortSectionLabel(sec){
  var clean=normalizeSectionName(sec);
  var lower=clean.toLowerCase();
  var num=(clean.match(/\d+/)||[''])[0];
  if(/pre[-\s]*chorus/.test(lower))return 'PC'+num;
  if(/chorus/.test(lower))return 'C'+num;
  if(/verse/.test(lower))return 'V'+num;
  if(/bridge/.test(lower))return 'B'+num;
  if(/intro/.test(lower))return 'I'+num;
  if(/outro/.test(lower))return 'O'+num;
  if(/interlude|instrumental/.test(lower))return 'INT'+num;
  if(/coda/.test(lower))return 'CODA';
  if(/tag/.test(lower))return 'T'+num;
  if(/ending|end/.test(lower))return 'E'+num;
  if(/solo/.test(lower))return 'S'+num;
  if(/refrain/.test(lower))return 'R'+num;
  if(/turnaround/.test(lower))return 'TA'+num;
  return clean.replace(/[^A-Za-z0-9]/g,'').slice(0,4).toUpperCase()||'SEC';
}

function collectSections(chart,chartApi){
  var sections=[];
  String(chart||'').replace(/\[([^\]]+)\]/g,function(_,raw){
    var t=normalizeSectionName(raw);
    if(!t||!isLikelySection(t,chartApi))return '';
    if(sections.indexOf(t)<0)sections.push(t);
    return '';
  });
  return sections;
}

function renderRailHtml(sections,options){
  options=options||{};
  var esc=options.esc||fallbackEsc;
  sections=Array.isArray(sections)?sections:[];
  return sections.slice(0,options.limit||10).map(function(sec,i){
    return '<button class="pres-section-chip '+(i===0?'active':'')+'" data-section-jump="'+esc(sec)+'" aria-label="Jump to '+esc(sec)+'" title="'+esc(sec)+'" type="button">'+esc(shortSectionLabel(sec))+'</button>';
  }).join('');
}

function createRailLock(){return {until:0,section:''};}
function lockRail(lock,section,ms){
  lock=lock||createRailLock();
  lock.until=Date.now()+(ms||620);
  lock.section=String(section||'');
  return lock;
}
function lockedSection(lock){
  return lock&&lock.section&&Date.now()<lock.until?lock.section:'';
}
function clearRailLock(lock){
  if(lock){lock.until=0;lock.section='';}
  return lock;
}

function setActiveRail(doc,section){
  doc=doc||root.document;
  if(!doc||!doc.querySelectorAll)return;
  Array.prototype.forEach.call(doc.querySelectorAll('.pres-section-chip'),function(btn){
    btn.classList.toggle('active',btn.getAttribute('data-section-jump')===section);
  });
}

function resolveActiveSection(scrollEl,sheetEl,options){
  options=options||{};
  if(!scrollEl||!sheetEl||!sheetEl.querySelectorAll)return '';
  var nodes=Array.prototype.slice.call(sheetEl.querySelectorAll('[data-section-label]'));
  if(!nodes.length)return '';
  var current=nodes[0].getAttribute('data-section-label')||'';
  var rect=scrollEl.getBoundingClientRect();
  var focusMin=options.focusMin||54,focusMax=options.focusMax||120,ratio=options.focusRatio||.2;
  var focusLine=rect.top+Math.min(focusMax,Math.max(focusMin,rect.height*ratio));
  nodes.forEach(function(node){
    if(node.getBoundingClientRect().top<=focusLine)current=node.getAttribute('data-section-label')||current;
  });
  return current;
}

function setFocusClasses(doc,songView,on){
  doc=doc||root.document;
  on=!!on;
  if(doc&&doc.body){
    doc.body.classList.toggle('song-focus',on);
    doc.body.classList.toggle('performance-mode',on);
  }
  if(songView&&songView.classList){
    songView.classList.toggle('song-focus',on);
    songView.classList.toggle('performance-mode',on);
    songView.classList.toggle('live-chrome-awake',on);
    songView.classList.remove('live-tools-expanded');
    if(!on)songView.classList.remove('autoscroll-panel-open','metronome-panel-open');
  }
}

function resetLiveTools(liveTools){
  if(!liveTools||!liveTools.classList)return;
  liveTools.classList.add('collapsed');
  liveTools.classList.remove('expanded');
}

function setLiveToolsExpanded(songView,liveTools,open){
  open=!!open;
  if(songView&&songView.classList)songView.classList.toggle('live-tools-expanded',open);
  if(liveTools&&liveTools.classList){
    liveTools.classList.toggle('collapsed',!open);
    liveTools.classList.toggle('expanded',open);
  }
}

var wakeTimer=0;
function wakeLiveChrome(songView,enabled,ms){
  if(!songView||!enabled)return;
  songView.classList.add('live-chrome-awake');
  if(wakeTimer)clearTimeout(wakeTimer);
  wakeTimer=setTimeout(function(){
    if(songView&&!songView.classList.contains('live-tools-expanded'))songView.classList.remove('live-chrome-awake');
  },ms||2400);
}

function nextMode(current,modes){
  modes=Array.isArray(modes)&&modes.length?modes:['lyrics','chords','nns'];
  var idx=modes.indexOf(current);
  return modes[(idx+1+modes.length)%modes.length];
}

root.WBSongFocusController={
  normalizeSectionName:normalizeSectionName,
  shortSectionLabel:shortSectionLabel,
  collectSections:collectSections,
  renderRailHtml:renderRailHtml,
  createRailLock:createRailLock,
  lockRail:lockRail,
  lockedSection:lockedSection,
  clearRailLock:clearRailLock,
  setActiveRail:setActiveRail,
  resolveActiveSection:resolveActiveSection,
  setFocusClasses:setFocusClasses,
  resetLiveTools:resetLiveTools,
  setLiveToolsExpanded:setLiveToolsExpanded,
  wakeLiveChrome:wakeLiveChrome,
  nextMode:nextMode
};
})(window);
