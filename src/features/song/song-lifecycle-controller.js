/* WorshipBase Phase 2b - I5 song lifecycle/menu/notes/focus owner.
   Owns song view lifecycle, song menu state/actions, live/focus chrome helpers,
   playback action state, adjacent navigation, and song notes/cues helpers while
   the legacy shell remains the temporary runtime host. */
(function(root){
'use strict';

function noop(){}
function fallbackEsc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
function ctxDoc(ctx){return ctx&&ctx.document||root.document;}
function qs(ctx,id){return ctx&&ctx.qs?ctx.qs(id):(ctxDoc(ctx)&&ctxDoc(ctx).getElementById?ctxDoc(ctx).getElementById(id):null);}
function qsa(ctx,sel,host){if(ctx&&ctx.qsa)return ctx.qsa(sel,host);var d=host||ctxDoc(ctx);return d&&d.querySelectorAll?Array.prototype.slice.call(d.querySelectorAll(sel)):[];}
function body(ctx){var d=ctxDoc(ctx);return d&&d.body?d.body:null;}
function songs(ctx){return Array.isArray(ctx&&ctx.songs)?ctx.songs:[];}
function state(ctx){ctx.state=ctx.state||{};return ctx.state;}
function settings(ctx){ctx.settings=ctx.settings||{};return ctx.settings;}
function activeSong(ctx){var st=state(ctx);return songs(ctx).find(function(x){return x&&x.id===st.selectedId})||null;}
function closeSheetElement(ctx,bg){if(ctx&&ctx.closeSheetElement)return ctx.closeSheetElement(bg);if(!bg)return;bg.classList.remove('open');bg.setAttribute('aria-hidden','true');}
function songCode(ctx,song){return ctx&&ctx.songCode?ctx.songCode(song):(song&&song.code||'');}
function renderSongNotePreview(ctx){
  var box=qs(ctx,'song-note-preview');if(!box)return;
  var set=currentSongNoteSet(ctx),s=activeSong(ctx),esc=(ctx&&ctx.esc)||fallbackEsc;
  if(!set||!s){box.classList.remove('show');box.innerHTML='';syncSongNotesQuickIndicator(ctx);return;}
  var note=(set.songNotes||{})[s.id]||'',cue=(set.songCues||{})[s.id]||'';
  if(!note&&!cue){box.classList.remove('show');box.innerHTML='';syncSongNotesQuickIndicator(ctx);return;}
  var parts=[];if(note)parts.push('<span class="song-note-preview-chip note">Note</span>');if(cue)parts.push('<span class="song-note-preview-chip cue">Cues</span>');
  var summary=note&&cue?'Notes + cues':(note?'Song note':'Cues');
  box.classList.add('show');
  box.innerHTML='<button class="song-note-preview-open compact" type="button" onclick="openSongNotesSheet()"><span class="song-note-preview-title">'+esc(summary)+'</span><span class="song-note-preview-chips">'+parts.join('')+'</span></button>';
  syncSongNotesQuickIndicator(ctx);
}
function syncSongNotesQuickIndicator(ctx){
  var has=selectedSongHasNotes(ctx),btn=qs(ctx,'sv-notes-btn'),live=qs(ctx,'live-tool-notes'),lbl=qs(ctx,'live-notes-label'),setter=root.WBSongInteractionController&&root.WBSongInteractionController.setButtonHasContent;
  if(setter){setter(btn,has);setter(live,has);}else{if(btn)btn.classList.toggle('has-notes',has);if(live)live.classList.toggle('has-notes',has);}
  if(lbl)lbl.textContent=has?'ON':'—';
}
function syncSetNotesQuickIndicator(ctx){
  var set=ctx&&ctx.currentSet?ctx.currentSet():null,has=!!(set&&set.setNotes),btn=qs(ctx,'sl-notes-quick-btn'),setter=root.WBSongInteractionController&&root.WBSongInteractionController.setButtonHasContent;
  if(setter)setter(btn,has);else if(btn)btn.classList.toggle('has-notes',has);
  var ws=ctx&&ctx.activeWorkspaceSet?ctx.activeWorkspaceSet():null,wbtn=qs(ctx,'workspace-editor-notes-btn'),whas=!!(ws&&ws.setNotes);
  if(setter)setter(wbtn,whas);else if(wbtn)wbtn.classList.toggle('has-notes',whas);
}
function closeSongView(ctx){
  ctx=ctx||{};var st=state(ctx),d=ctxDoc(ctx),b=body(ctx);
  if(ctx.stopPerformanceTools)ctx.stopPerformanceTools();
  if(ctx.hideToast)ctx.hideToast();
  if(root.WBSongViewController&&root.WBSongViewController.closeOpenState)root.WBSongViewController.closeOpenState(st);else st.songContext=null;
  var sv=qs(ctx,'song-view'),suppress=!!(sv&&sv.classList.contains('suppress-return'));
  if(sv){
    sv.classList.remove('visible','song-focus','performance-mode','live-chrome-awake','live-tools-expanded','autoscroll-panel-open','metronome-panel-open','dragging-back','dragging-song');
    sv.setAttribute('aria-hidden','true');
  }
  if(ctx.clearSongTransitionLayer)ctx.clearSongTransitionLayer();
  if(!suppress&&ctx.clearSongSwipeOffset)ctx.clearSongSwipeOffset();
  if(ctx.freezeSongMotionUI)ctx.freezeSongMotionUI(false);
  if(b)b.classList.remove('song-open','song-focus','performance-mode','cues-hidden','song-view-swiping','song-closing');
  if(ctx.syncWakeLock)ctx.syncWakeLock();
}
function prepareLibraryForSongReturn(ctx){
  ctx=ctx||{};var b=body(ctx);
  try{if(ctx.clearSongTransitionLayer)ctx.clearSongTransitionLayer();if(ctx.clearSongSwipeOffset)ctx.clearSongSwipeOffset();if(ctx.freezeSongMotionUI)ctx.freezeSongMotionUI(false);}catch(e){}
  if(b){b.classList.remove('song-view-swiping','song-motion-freeze');b.classList.add('song-closing');b.classList.remove('song-open');}
  try{var tab=qs(ctx,'tab-bar');if(tab)tab.style.display='flex';var alpha=qs(ctx,'alpha-strip');if(alpha){alpha.style.display='flex';alpha.style.opacity='1';alpha.style.visibility='visible';alpha.style.transform='none';}}catch(e){}
}
function finishSongReturn(ctx,sv){
  ctx=ctx||{};var b=body(ctx);
  try{if(sv){sv.classList.add('suppress-return');sv.style.transition='none';sv.style.transform='translate3d(100%,0,0)';sv.style.opacity='0';sv.style.visibility='hidden';sv.style.pointerEvents='none';sv.classList.remove('closing-back','dragging-back','dragging-song');}}catch(e){}
  closeSongView(ctx);
  if(b)b.classList.remove('song-closing','song-view-swiping');
  try{if(ctx.renderLibrary)ctx.renderLibrary();if(ctx.filteredSongRows&&ctx.renderAlpha)ctx.renderAlpha(ctx.filteredSongRows().map(function(x){return x.song;}));}catch(e){}
  try{if(sv){sv.classList.add('suppress-return');sv.style.transition='none';sv.style.transform='translate3d(100%,0,0)';sv.style.opacity='0';sv.style.visibility='hidden';sv.style.pointerEvents='none';}}catch(e){}
}
function closeSongViewSmooth(ctx){
  ctx=ctx||{};var sv=qs(ctx,'song-view');
  if(!sv||!sv.classList.contains('visible')){closeSongView(ctx);return;}
  prepareLibraryForSongReturn(ctx);sv.classList.remove('dragging-back','dragging-song');sv.style.transition='';sv.style.transform='translate3d(0,0,0)';sv.style.opacity='1';
  root.requestAnimationFrame(function(){sv.classList.add('closing-back');root.setTimeout(function(){finishSongReturn(ctx,sv);},165);});
}
function showSong(ctx,s,origin,context){
  ctx=ctx||{};if(!s)return;var st=state(ctx),set=settings(ctx),d=ctxDoc(ctx),b=body(ctx),esc=(ctx&&ctx.esc)||fallbackEsc;
  origin=ctx.normalizeSongOrigin?ctx.normalizeSongOrigin(origin||st.tab||'library'):(root.WBSongViewController&&root.WBSongViewController.normalizeOrigin?root.WBSongViewController.normalizeOrigin(origin||st.tab||'library'):'library');
  var openState=root.WBSongViewController&&root.WBSongViewController.beginOpen?root.WBSongViewController.beginOpen({state:st,settings:set,song:s,origin:origin,context:context,resolveKey:ctx.resolveSongOpenKey}):(function(){st.selectedId=s.id;st.songContext=context||null;st.displayKey=ctx.resolveSongOpenKey?ctx.resolveSongOpenKey(s,st.songContext):(s.key||'C');st.lastSongOrigin=origin;st.mode=set.defaultSongView||'chords';st.focusMode=origin!=='library';return {origin:origin,focusMode:st.focusMode,mode:st.mode};})();
  st.chordHighlight=!!set.highlightChordsDefault;
  if(b)b.classList.remove('song-focus','performance-mode','cues-hidden');
  var sv=qs(ctx,'song-view');if(sv){sv.classList.remove('song-focus','performance-mode','live-chrome-awake','live-tools-expanded','closing-back','dragging-back','dragging-song','suppress-return');sv.style.transition='';sv.style.transform='';sv.style.opacity='';sv.style.visibility='';sv.style.pointerEvents='';sv.setAttribute('aria-hidden','false');}
  if(ctx.clearSongSwipeOffset)ctx.clearSongSwipeOffset();
  if(Array.isArray(ctx.recentIds)){ctx.recentIds=[s.id].concat(ctx.recentIds.filter(function(id){return id!==s.id;})).slice(0,8);if(ctx.setRecentIds)ctx.setRecentIds(ctx.recentIds);}
  if(ctx.persistRecents)ctx.persistRecents();if(ctx.renderRecents)ctx.renderRecents();
  var title=qs(ctx,'sv-title');if(title)title.textContent=s.title;
  var top=d&&d.querySelector?d.querySelector('#song-view .sv-top'):null;if(top)top.setAttribute('data-focus-title',s.title);
  var pres=qs(ctx,'sv-pres-title');if(pres)pres.textContent=s.title;
  var artist=(s.artist||s.author||'Unknown'),key=(s.key||'C'),author=qs(ctx,'sv-author');
  if(author)author.innerHTML='<span class="sv-meta-artist">'+esc(artist)+'</span><span class="sv-meta-sep">·</span><span class="sv-meta-key">Originally in '+esc(key)+'</span><span class="sv-meta-sep">·</span><span class="sv-song-code">Song ID: '+esc(songCode(ctx,s))+'</span>';
  var keyValue=qs(ctx,'sv-key-value');if(keyValue)keyValue.textContent=st.displayKey||s.key||'C';
  var fav=qs(ctx,'sv-fav-btn');if(fav){fav.classList.toggle('on',!!s.favorite);if(ctx.heartIcon)fav.innerHTML=ctx.heartIcon(!!s.favorite);}
  updateSongTopActionStates(ctx);renderSongNotePreview(ctx);syncSongNotesQuickIndicator(ctx);
  qsa(ctx,'.seg-btn').forEach(function(button){button.classList.toggle('active',button.dataset.mode===st.mode);});
  if(ctx.renderSongSheet)ctx.renderSongSheet();
  if(b)b.classList.add('song-open');
  var songView=qs(ctx,'song-view');if(songView){songView.classList.add('visible');songView.classList.toggle('song-focus',!!openState.focusMode);songView.classList.remove('autoscroll-panel-open','metronome-panel-open');}
  var sc=qs(ctx,'sv-scroll');if(sc)sc.scrollTop=0;
  toggleFocusMode(ctx,!!openState.focusMode);
  if(ctx.syncWakeLock)ctx.syncWakeLock();
}
function setSongMode(ctx,mode){var st=state(ctx),set=settings(ctx);if(root.WBSongViewController&&root.WBSongViewController.setMode)root.WBSongViewController.setMode(st,set,mode);else{if(['lyrics','chords','nns'].indexOf(mode)<0)mode='chords';st.mode=mode;if(ctx.rememberCurrentSongView)ctx.rememberCurrentSongView();}if(ctx.renderSongSheet)ctx.renderSongSheet();}
function transposeSong(ctx,delta){var s=activeSong(ctx),st=state(ctx),set=settings(ctx);if(!s)return;var current=ctx.normalizeKeyName?ctx.normalizeKeyName(st.displayKey||s.key||'C'):(st.displayKey||s.key||'C'),idx=ctx.noteIndex?ctx.noteIndex(current):null;if(idx==null)idx=ctx.noteIndex?ctx.noteIndex(s.key||'C')||0:0;var minor=ctx.isMinorKey&&(ctx.isMinorKey(current)||ctx.isMinorKey(s.key));st.displayKey=(ctx.noteName?ctx.noteName(idx+delta,!!set.useFlatsDefault):current)+(minor?'m':'');if(ctx.renderSongSheet)ctx.renderSongSheet();}
function syncKeySelect(ctx,song){var st=state(ctx),set=settings(ctx),esc=(ctx&&ctx.esc)||fallbackEsc,key=ctx.normalizeKeyName?ctx.normalizeKeyName(st.displayKey||(song&&song.key)||'C'):(st.displayKey||(song&&song.key)||'C'),label=qs(ctx,'sv-key-value'),sel=qs(ctx,'sv-key-select'),minor=ctx.isMinorKey&&(ctx.isMinorKey(key)||ctx.isMinorKey(song&&song.key));if(label)label.textContent=ctx.labelKey?ctx.labelKey(key):key;if(sel){var keys=ctx.keyOptionList?ctx.keyOptionList(minor,!!set.useFlatsDefault):[key];sel.innerHTML=keys.map(function(k){return '<option value="'+esc(k)+'" '+(k===key?'selected':'')+'>'+esc(ctx.labelKey?ctx.labelKey(k):k)+'</option>';}).join('');if(keys.indexOf(key)<0)sel.insertAdjacentHTML('afterbegin','<option value="'+esc(key)+'" selected>'+esc(ctx.labelKey?ctx.labelKey(key):key)+'</option>');}}
function transposeToKey(ctx,key){var st=state(ctx);st.displayKey=ctx.normalizeKeyName?ctx.normalizeKeyName(key||st.displayKey):(key||st.displayKey);if(ctx.renderSongSheet)ctx.renderSongSheet();}
function openSongMenu(ctx){updateSongMenuUI(ctx);var m=qs(ctx,'bs-song-menu');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false');}}
function closeSongMenu(ctx){closeSheetElement(ctx,qs(ctx,'bs-song-menu'));}
function updateSongMenuUI(ctx){
  ctx=ctx||{};var list=qs(ctx,'song-menu-list'),st=state(ctx),set=settings(ctx),s=activeSong(ctx),pct=Math.round((parseFloat(set.textSize)||1)*100),slider=qs(ctx,'text-size-menu-slider'),val=qs(ctx,'text-size-menu-val');
  if(slider){slider.value=String(pct);slider.style.setProperty('--pct',Math.max(0,Math.min(100,(pct-85)/40*100))+'%');}
  if(val)val.textContent=pct+'%';
  var edit=qs(ctx,'mi-edit-song');if(edit){var canEdit=!!(s&&((ctx.isEditableLocalSong&&ctx.isEditableLocalSong(s))||ctx.adminUnlocked));edit.hidden=!canEdit;edit.classList.toggle('is-hidden',!canEdit);}
  var badge=qs(ctx,'mi-song-notes-badge');if(badge&&s){var memory=ctx.songMemory||{};var has=!!(memory&&memory[s.id]&&(memory[s.id].note||memory[s.id].cues));badge.classList.toggle('hidden',!has);}
  if(!list)return;
  qsa(ctx,'[data-song-action]',list).forEach(function(b){var a=b.dataset.songAction,on=(a==='focus'&&!!st.focusMode)||(a==='highlight'&&!!st.chordHighlight)||(a==='flats'&&!!set.useFlatsDefault)||(a==='dark'&&!!set.darkMode);b.classList.toggle('on',on);var sw=b.querySelector('.wbsm-toggle');if(sw)sw.classList.toggle('on',on);});
}
function toggleFocusMode(ctx,on){
  ctx=ctx||{};var st=state(ctx),set=settings(ctx),sv=qs(ctx,'song-view'),owner=ctx.focusOwner?ctx.focusOwner():(root.WBSongFocusController||{});
  if(root.WBSongViewController&&root.WBSongViewController.setFocus)root.WBSongViewController.setFocus(st,set,on);else{st.focusMode=on==null?!st.focusMode:!!on;if(ctx.rememberCurrentSongView)ctx.rememberCurrentSongView();}
  if(owner&&owner.setFocusClasses)owner.setFocusClasses(ctxDoc(ctx),sv,st.focusMode);else{var b=body(ctx);if(b){b.classList.toggle('song-focus',st.focusMode);b.classList.toggle('performance-mode',st.focusMode);}if(sv){sv.classList.toggle('song-focus',st.focusMode);sv.classList.toggle('performance-mode',st.focusMode);sv.classList.toggle('live-chrome-awake',st.focusMode);sv.classList.remove('live-tools-expanded');if(!st.focusMode)sv.classList.remove('autoscroll-panel-open','metronome-panel-open');}}
  if(!st.focusMode&&ctx.performanceState){ctx.performanceState.autoscrollPanel=false;ctx.performanceState.metronomePanel=false;}
  var live=qs(ctx,'live-tools');if(owner&&owner.resetLiveTools)owner.resetLiveTools(live);else if(live){live.classList.add('collapsed');live.classList.remove('expanded');}
  if(ctx.renderPerformanceRail)ctx.renderPerformanceRail();updateLiveToolLabels(ctx);updateSongMenuUI(ctx);if(ctx.updatePerformanceUI)ctx.updatePerformanceUI();
  if(st.focusMode)wakeLiveChrome(ctx);if(ctx.syncWakeLock)ctx.syncWakeLock();
}
function jumpToSongSection(ctx,sec){
  ctx=ctx||{};var sheet=qs(ctx,'sv-sheet');if(!sheet)return;var owner=ctx.focusOwner?ctx.focusOwner():(root.WBSongFocusController||{}),nodes=qsa(ctx,'[data-section-label]',sheet),lock=ctx.sectionRailJumpLock;
  for(var i=0;i<nodes.length;i++){if(nodes[i].dataset.sectionLabel===sec){if(owner&&owner.lockRail)owner.lockRail(lock,sec,620);else if(lock){lock.until=Date.now()+620;lock.section=sec;}if(ctx.setActiveRail)ctx.setActiveRail(sec);nodes[i].scrollIntoView({block:'start',behavior:'smooth'});wakeLiveChrome(ctx);root.setTimeout(function(){if(owner&&owner.lockedSection){if(!owner.lockedSection(lock)){if(owner.clearRailLock)owner.clearRailLock(lock);if(ctx.updateRailFromScroll)ctx.updateRailFromScroll();}}else if(lock&&Date.now()>=lock.until){lock.section='';if(ctx.updateRailFromScroll)ctx.updateRailFromScroll();}},680);return;}}
}
function wakeLiveChrome(ctx){var st=state(ctx),sv=qs(ctx,'song-view'),owner=ctx&&ctx.focusOwner?ctx.focusOwner():(root.WBSongFocusController||{});if(owner&&owner.wakeLiveChrome)return owner.wakeLiveChrome(sv,!!st.focusMode,2400);if(!sv||!st.focusMode)return;sv.classList.add('live-chrome-awake');root.clearTimeout(wakeLiveChrome._t);wakeLiveChrome._t=root.setTimeout(function(){if(sv&&!sv.classList.contains('live-tools-expanded'))sv.classList.remove('live-chrome-awake');},2400);}
function toggleLiveToolsExpanded(ctx){var sv=qs(ctx,'song-view'),live=qs(ctx,'live-tools');if(!sv||!live)return;var open=!sv.classList.contains('live-tools-expanded'),owner=ctx&&ctx.focusOwner?ctx.focusOwner():(root.WBSongFocusController||{});if(owner&&owner.setLiveToolsExpanded)owner.setLiveToolsExpanded(sv,live,open);else{sv.classList.toggle('live-tools-expanded',open);live.classList.toggle('collapsed',!open);live.classList.toggle('expanded',open);}wakeLiveChrome(ctx);}
function updateLiveToolLabels(ctx){var st=state(ctx),lv=qs(ctx,'live-view-label');if(lv)lv.textContent=(st.mode||'chords').toUpperCase();var cues=qs(ctx,'live-cues-label'),b=body(ctx);if(cues)cues.textContent=b&&b.classList.contains('cues-hidden')?'OFF':'ON';}
function cycleLiveViewMode(ctx){var st=state(ctx),owner=ctx&&ctx.focusOwner?ctx.focusOwner():(root.WBSongFocusController||{});setSongMode(ctx,owner&&owner.nextMode?owner.nextMode(st.mode,['lyrics','chords','nns']):(['lyrics','chords','nns'][(['lyrics','chords','nns'].indexOf(st.mode)+1+3)%3]));wakeLiveChrome(ctx);}
function stepSongText(ctx,delta){var set=settings(ctx),next=Math.max(.85,Math.min(1.25,(parseFloat(set.textSize)||1)+(delta*.05)));if(ctx.updateSetting)ctx.updateSetting('textSize',String(next),true);if(ctx.renderSongSheet)ctx.renderSongSheet();wakeLiveChrome(ctx);}
function toggleFocusCues(ctx){var b=body(ctx);if(b)b.classList.toggle('cues-hidden');updateLiveToolLabels(ctx);wakeLiveChrome(ctx);}
function setSongViewPanelClasses(ctx){var st=ctx&&ctx.performanceState||{},sv=qs(ctx,'song-view'),auto=qs(ctx,'pres-autoscroll'),metro=qs(ctx,'pres-metronome');if(sv){sv.classList.toggle('autoscroll-panel-open',!!st.autoscrollPanel);sv.classList.toggle('metronome-panel-open',!!st.metronomePanel);}if(auto)auto.classList.toggle('show',!!st.autoscrollPanel);if(metro)metro.classList.toggle('show',!!st.metronomePanel);}
function currentSongNoteScope(ctx){var st=state(ctx),ctxState=st.songContext||{},norm=ctx&&ctx.normalizeSongOrigin||function(v){return root.WBSongViewController&&root.WBSongViewController.normalizeOrigin?root.WBSongViewController.normalizeOrigin(v):String(v||'');};if(ctxState.scope==='workspace'||norm(st.lastSongOrigin||'')==='workspace-set')return 'workspace';if(ctxState.scope==='personal'||norm(st.lastSongOrigin||'')==='setlist')return 'personal';if(ctx&&ctx.currentSet&&ctx.currentSet())return 'personal';return '';}
function currentSongNoteSet(ctx){var st=state(ctx),ctxState=st.songContext||{},scope=currentSongNoteScope(ctx),owner=ctx&&ctx.setStateAdapter?ctx.setStateAdapter():null;if(scope==='workspace'){var wsId=ctxState.setId||(ctx.workspaceState&&ctx.workspaceState.activeSetId);return owner&&owner.findSet?owner.findSet('workspace',ctx.setStateEnv?ctx.setStateEnv():{},wsId):(ctx.ensureSetShape?ctx.ensureSetShape(((ctx.workspaceState&&ctx.workspaceState.sets)||[]).find(function(x){return x.id===wsId;})||null):null);}if(scope==='personal'){var id=ctxState.setId||ctx.activeSetId;var set=owner&&owner.findSet?owner.findSet('personal',ctx.setStateEnv?ctx.setStateEnv():{},id):(ctx.ensureSetShape?ctx.ensureSetShape((ctx.personalSets||[]).find(function(x){return x.id===id;})||null):null);if(!set&&ctx&&ctx.currentSet)set=ctx.currentSet();return set&&(ctx.ensureSetShape?ctx.ensureSetShape(set):set);}return null;}
function selectedSongHasNotes(ctx){var set=currentSongNoteSet(ctx),s=activeSong(ctx);if(!set||!s)return false;return !!((set.songNotes||{})[s.id]||(set.songCues||{})[s.id]);}
function normalizeCueText(v){return String(v||'').toLowerCase().replace(/\[[^\]]+\]/g,' ').replace(/\b(cue|note)\b[:\-]?/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function stripInlineChordsText(v){return String(v||'').replace(/\[([A-G][b#]?[^\[\]]*)\]/g,'').replace(/\[[^\]]+\]/g,' ').trim();}
function parseSongCueMarkers(set,s){var raw=String(set&&s&&(set.songCues||{})[s.id]||'').split('\n').map(function(x){return x.trim();}).filter(Boolean),cues=[];raw.forEach(function(line,idx){var target='',cue=line,mm=line.match(/^line\s*(\d+)\s*[:|\-–—>]\s*(.+)$/i);if(mm){target='line:'+mm[1];cue=mm[2].trim();}else if(line.indexOf('|')>=0){var p=line.split('|');target=p.shift().trim();cue=p.join('|').trim();}else if(line.indexOf('=>')>=0){var q=line.split('=>');target=q.shift().trim();cue=q.join('=>').trim();}else if(line.indexOf(' - ')>=0){var r=line.split(' - ');target=r.shift().trim();cue=r.join(' - ').trim();}cue=cue.replace(/^cue\s*[:\-]\s*/i,'').trim();if(cue)cues.push({target:target,cue:cue,index:idx,used:false});});return cues;}
function cueMatchesNode(cue,nodeText,lineIndex){var target=String(cue.target||'').trim();if(!target)return lineIndex===0&&!cue.used;var lineMatch=target.match(/^line:(\d+)$/i);if(lineMatch)return Number(lineMatch[1])===lineIndex+1;var t=normalizeCueText(target),n=normalizeCueText(stripInlineChordsText(nodeText));return !!t&&!!n&&(n.indexOf(t)>=0||t.indexOf(n)>=0);}
function applySongCueMarkersToSheet(ctx,sheet,set,s){var d=ctxDoc(ctx);if(!sheet||!set||!s)return;sheet.querySelectorAll('.song-cue-marker').forEach(function(el){el.remove();});var cues=parseSongCueMarkers(set,s);if(!cues.length)return;var nodes=Array.prototype.slice.call(sheet.querySelectorAll('.sec-lbl,.lyric-row,.lyric-only-row,.pair-lyric'));nodes.forEach(function(node,lineIndex){var matches=cues.filter(function(c){return !c.used&&cueMatchesNode(c,node.textContent||'',lineIndex);});matches.forEach(function(cue){var marker=d.createElement('div');marker.className='song-cue-marker';marker.textContent=cue.cue;var block=node.closest&&node.closest('.lyric-block')||node;if(block&&block.parentNode)block.parentNode.insertBefore(marker,block);cue.used=true;});});cues.filter(function(c){return !c.used&&!String(c.target||'').trim();}).reverse().forEach(function(cue){var marker=d.createElement('div');marker.className='song-cue-marker';marker.textContent=cue.cue;sheet.insertBefore(marker,sheet.firstChild);});}
function openSongNotesSheet(ctx){var set=currentSongNoteSet(ctx),s=activeSong(ctx);if(!set||!s){if(ctx&&ctx.showToast)ctx.showToast('Open a set song to save notes');return;}var title=qs(ctx,'song-notes-title'),note=qs(ctx,'song-note-text'),cue=qs(ctx,'song-cue-text');if(title)title.textContent='Notes & cues';if(note)note.value=(set.songNotes&&set.songNotes[s.id])||'';if(cue)cue.value=(set.songCues&&set.songCues[s.id])||'';var m=qs(ctx,'bs-song-notes');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false');}}
function saveSongNotes(ctx){var set=currentSongNoteSet(ctx),s=activeSong(ctx),scope=currentSongNoteScope(ctx);if(!set||!s)return;var n=((qs(ctx,'song-note-text')||{}).value||'').trim(),c=((qs(ctx,'song-cue-text')||{}).value||'').trim(),owner=ctx&&ctx.setStateAdapter?ctx.setStateAdapter():null;if(owner&&owner.setSongNotes)owner.setSongNotes(scope,set,s.id,n,c);else{set.songNotes=set.songNotes||{};set.songCues=set.songCues||{};if(n)set.songNotes[s.id]=n;else delete set.songNotes[s.id];if(c)set.songCues[s.id]=c;else delete set.songCues[s.id];set.updated='Updated now';}if(scope==='workspace'){if(ctx.commitSetMutation)ctx.commitSetMutation('workspace',set,{action:'songNotes',close:['songNotes'],refresh:['workspaceDetail','workspaceLists','settings','songNotePreview']});if(ctx.showToast)ctx.showToast('Workspace notes saved');return;}if(ctx.commitSetMutation)ctx.commitSetMutation('personal',set,{action:'songNotes',close:['songNotes'],refresh:['personalEditor','settings','songNotePreview']});if(ctx.showToast)ctx.showToast('Notes saved');}
function collectPlaybackLinks(song){var links=[];function add(label,url){url=String(url||'').trim();if(/^https?:\/\//i.test(url)&&!links.some(function(x){return x.url===url;}))links.push({label:label,url:url});}if(!song)return links;add('Spotify',song.spotifyUrl||song.spotify||song.spotifyLink);add('YouTube / YouTube Music',song.youtubeUrl||song.youtube||song.youtubeLink||song.youtubeMusicUrl);if(Array.isArray(song.playbackLinks))song.playbackLinks.forEach(function(l){add(l.label||l.name||'Playback',l.url||l.href||l.link);});return links;}
function updateSongTopActionStates(ctx){var s=activeSong(ctx),links=collectPlaybackLinks(s),play=qs(ctx,'sv-play-btn'),pad=qs(ctx,'sv-pad-btn');if(play){play.classList.toggle('empty',!links.length);play.setAttribute('aria-label',links.length?'Open song links':'No song links saved');play.setAttribute('title','Song links');}if(pad){pad.classList.toggle('on',!!(root.WorshipBasePad&&root.WorshipBasePad.state&&root.WorshipBasePad.state.on));pad.setAttribute('title','Pad');}}
function orderedVisibleSongs(ctx){var rows=ctx&&ctx.filteredSongRows?ctx.filteredSongRows():null,list=(rows&&rows.length?rows.map(function(x){return x.song;}):songs(ctx).slice()).filter(Boolean);return list.length?list:songs(ctx).slice();}
function showAdjacentSong(ctx,dir,opts){
  ctx=ctx||{};var st=state(ctx),origin=ctx.normalizeSongOrigin?ctx.normalizeSongOrigin(st.lastSongOrigin||'library'):'library',entries=ctx.songEntriesForOrigin?ctx.songEntriesForOrigin(origin,st.songContext):[];if(!entries.length||!st.selectedId)return false;var i=ctx.currentSongEntryIndex?ctx.currentSongEntryIndex(entries,st.songContext):-1;if(i<0)return false;var next=entries[(i+dir+entries.length)%entries.length];if(!next||!next.song||(next.song.id===st.selectedId&&entries.length===1))return false;var sv=qs(ctx,'song-view');if(!sv){showSong(ctx,next.song,origin,next.context);return true;}var tuning=root.WBSongInteractionController&&root.WBSongInteractionController.songTransitionTiming?root.WBSongInteractionController.songTransitionTiming():{outgoing:'transform .30s cubic-bezier(.22,1,.32,1), opacity .22s ease',incoming:'transform .30s cubic-bezier(.22,1,.32,1), opacity .14s linear',cleanupMs:330},distance=ctx.songSwipeDistance?ctx.songSwipeDistance():Math.max(228,Math.round((root.innerWidth||390)*.62)),incomingStart=dir>0?distance:-distance,releaseOffset=opts&&typeof opts.startOffset==='number'?opts.startOffset:0;if(ctx.freezeSongMotionUI)ctx.freezeSongMotionUI(true);if(ctx.clearSongSwipeOffset)ctx.clearSongSwipeOffset();var outgoing=ctx.createSongTransitionPane?ctx.createSongTransitionPane('outgoing'):null;if(outgoing){outgoing.style.transform='translate3d('+Math.round(releaseOffset)+'px,0,0)';outgoing.style.opacity='1';}if(root.WBAddToSetController&&root.WBAddToSetController.markAdjacentNavigation)root.WBAddToSetController.markAdjacentNavigation(st,origin);else if(origin==='library')st.preserveLibrarySongViewModeOnce=true;showSong(ctx,next.song,origin,next.context);var incoming=ctx.createSongTransitionPane?ctx.createSongTransitionPane('incoming'):null;if(incoming){incoming.style.transform='translate3d('+incomingStart+'px,0,0)';incoming.style.opacity='.985';}root.requestAnimationFrame(function(){if(outgoing){outgoing.style.transition=tuning.outgoing;outgoing.style.transform='translate3d('+(dir>0?-distance:distance)+'px,0,0)';outgoing.style.opacity='.02';}if(incoming){incoming.style.transition=tuning.incoming;incoming.style.transform='translate3d(0,0,0)';incoming.style.opacity='1';}root.setTimeout(function(){if(ctx.clearSongTransitionLayer)ctx.clearSongTransitionLayer();if(ctx.freezeSongMotionUI)ctx.freezeSongMotionUI(false);},tuning.cleanupMs||330);});return true;
}
function handleSongMenuAction(ctx,action){var st=state(ctx);if(action==='edit'){var s=activeSong(ctx);closeSongMenu(ctx);if(!s)return;if((ctx.isEditableLocalSong&&ctx.isEditableLocalSong(s))||ctx.adminUnlocked){if(ctx.openAddSongModal)ctx.openAddSongModal(s);return;}if(ctx.openAdminPinSheet)ctx.openAdminPinSheet();return;}if(action==='focus'){toggleFocusMode(ctx);closeSongMenu(ctx);return;}if(action==='notes'){closeSongMenu(ctx);openSongNotesSheet(ctx);return;}if(action==='chord-diagrams'){closeSongMenu(ctx);if(ctx.openChordDiagramsSheet)ctx.openChordDiagramsSheet();return;}if(action==='highlight'){st.chordHighlight=!st.chordHighlight;var sh=qs(ctx,'sv-sheet');if(sh)sh.classList.toggle('chords-highlight',!!st.chordHighlight&&st.mode!=='lyrics');if(ctx.renderSongSheet)ctx.renderSongSheet();if(ctx.showToast)ctx.showToast(st.chordHighlight?'Chord highlight on':'Chord highlight off');}else if(action==='flats'){if(ctx.updateSetting)ctx.updateSetting('useFlatsDefault',!settings(ctx).useFlatsDefault,true);if(ctx.renderSongSheet)ctx.renderSongSheet();if(ctx.showToast)ctx.showToast(settings(ctx).useFlatsDefault?'Using flats':'Using sharps');}else if(action==='dark'){if(ctx.updateSetting)ctx.updateSetting('darkMode',!settings(ctx).darkMode,true);if(ctx.renderSettings)ctx.renderSettings();if(ctx.showToast)ctx.showToast(settings(ctx).darkMode?'Dark mode on':'Dark mode off');}else if(action==='copy'){if(ctx.copyCurrentLyrics)ctx.copyCurrentLyrics();if(ctx.showToast)ctx.showToast('Lyrics copied');closeSongMenu(ctx);return;}else if(action==='export-json'){if(ctx.downloadCurrentSongJson)ctx.downloadCurrentSongJson();closeSongMenu(ctx);return;}else if(action==='export-pdf'){closeSongMenu(ctx);if(ctx.openExportView)ctx.openExportView('song');return;}updateSongMenuUI(ctx);}
function lifecycleContract(){return {phase:'Phase 2b - I5',owner:'WBSongLifecycleController',contracts:['closeSongView','showSong','toggleFocusMode','openSongMenu','updateSongMenuUI','handleSongMenuAction','openSongNotesSheet','saveSongNotes','applySongCueMarkersToSheet','showAdjacentSong'],legacyShellHost:true,nonDestructive:true};}
root.WBSongLifecycleController={
  closeSongView:closeSongView,prepareLibraryForSongReturn:prepareLibraryForSongReturn,finishSongReturn:finishSongReturn,closeSongViewSmooth:closeSongViewSmooth,showSong:showSong,
  setSongMode:setSongMode,transposeSong:transposeSong,syncKeySelect:syncKeySelect,transposeToKey:transposeToKey,
  openSongMenu:openSongMenu,closeSongMenu:closeSongMenu,updateSongMenuUI:updateSongMenuUI,handleSongMenuAction:handleSongMenuAction,
  toggleFocusMode:toggleFocusMode,jumpToSongSection:jumpToSongSection,wakeLiveChrome:wakeLiveChrome,toggleLiveToolsExpanded:toggleLiveToolsExpanded,updateLiveToolLabels:updateLiveToolLabels,cycleLiveViewMode:cycleLiveViewMode,stepSongText:stepSongText,toggleFocusCues:toggleFocusCues,setSongViewPanelClasses:setSongViewPanelClasses,
  activeSong:activeSong,collectPlaybackLinks:collectPlaybackLinks,updateSongTopActionStates:updateSongTopActionStates,orderedVisibleSongs:orderedVisibleSongs,showAdjacentSong:showAdjacentSong,
  currentSongNoteScope:currentSongNoteScope,currentSongNoteSet:currentSongNoteSet,selectedSongHasNotes:selectedSongHasNotes,normalizeCueText:normalizeCueText,stripInlineChordsText:stripInlineChordsText,parseSongCueMarkers:parseSongCueMarkers,cueMatchesNode:cueMatchesNode,applySongCueMarkersToSheet:applySongCueMarkersToSheet,renderSongNotePreview:renderSongNotePreview,syncSongNotesQuickIndicator:syncSongNotesQuickIndicator,syncSetNotesQuickIndicator:syncSetNotesQuickIndicator,openSongNotesSheet:openSongNotesSheet,saveSongNotes:saveSongNotes,
  lifecycleContract:lifecycleContract,diagnostics:lifecycleContract
};
})(window);
