/* WorshipBase Phase 2b - J3 workspace action/event/persistence owner.
   Owns Workspace local persistence, set create/publish/copy/delete/duplicate/rename/profile actions,
   detail click routing, swipe-back, and editor drag/reorder binding. Cloud writes are delegated to
   WBWorkspaceCloudController through host callbacks. */
(function(root){
'use strict';

function arr(value){return Array.isArray(value)?value:[];}
function ctl(ctx){return (ctx&&ctx.workspaceSetController)||root.WBWorkspaceSetController||null;}
function surface(ctx){return root.WBWorkspaceSurfaceController||{};}
function qs(ctx,id,within){return ctx&&ctx.qs?ctx.qs(id,within):((within||document).querySelector('#'+id));}
function qsa(ctx,sel,within){return ctx&&ctx.qsa?ctx.qsa(sel,within):Array.prototype.slice.call((within||document).querySelectorAll(sel));}
function safeCall(ctx,name,args,fallback){
  if(ctx&&typeof ctx[name]==='function')return ctx[name].apply(null,args||[]);
  if(typeof fallback==='function')return fallback();
}
function workspaceCountLabel(ctx,set){
  if(ctx&&typeof ctx.workspaceCountLabel==='function')return ctx.workspaceCountLabel(set);
  var c=ctl(ctx);
  if(c&&c.countLabel)return c.countLabel(set);
  var items=arr(set&&set.items),songs=arr(set&&set.entries).length||items.filter(function(item){return item&&item.type==='song';}).length,extra=arr(set&&set.textItems).length||items.filter(function(item){return item&&item.type!=='song';}).length;
  return songs+' '+(songs===1?'song':'songs')+(extra?' · '+extra+' '+(extra===1?'item':'items'):'');
}
function workspaceSetCounts(ctx,set){
  if(ctx&&typeof ctx.workspaceSetCounts==='function')return ctx.workspaceSetCounts(set);
  var c=ctl(ctx);
  if(c&&c.syncCounts)return c.syncCounts(set);
  return set;
}
function ensureSetShape(ctx,set){return ctx&&typeof ctx.ensureSetShape==='function'?ctx.ensureSetShape(set):set;}
function setHasNotes(ctx,set){return ctx&&typeof ctx.setHasNotes==='function'?ctx.setHasNotes(set):!!(set&&set.setNotes);}
function uniqueWorkspacePublishName(ctx,base){
  if(ctx&&typeof ctx.uniqueWorkspacePublishName==='function')return ctx.uniqueWorkspacePublishName(base);
  var s=surface(ctx);
  if(s.uniqueWorkspacePublishName)return s.uniqueWorkspacePublishName(ctx,base);
  var c=ctl(ctx);
  if(c&&c.uniquePublishName)return c.uniquePublishName(arr(ctx&&ctx.workspaceState&&ctx.workspaceState.sets),base);
  base=String(base||'Published set').trim()||'Published set';
  if(!/workspace/i.test(base))base=base+' (Workspace)';
  var used={};arr(ctx&&ctx.workspaceState&&ctx.workspaceState.sets).forEach(function(set){used[String(set&&set.name||'').toLowerCase()]=true;});
  var out=base,i=2;while(used[String(out).toLowerCase()]){out=base+' '+i;i++;}return out;
}
function refreshWorkspaceSet(ctx,set){
  safeCall(ctx,'renderWorkspaceSetDetail',[set]);
  safeCall(ctx,'renderWorkspaceSetLists',[]);
}
function persistWorkspace(ctx){
  ctx=ctx||{};
  var state=ctx.workspaceState||{};
  var c=ctl(ctx);
  var sets=c&&c.preserveSetArray?c.preserveSetArray(state.sets||[]):(ctx.preserveSetArray?ctx.preserveSetArray(state.sets||[]):(state.sets||[]));
  if(ctx.writeStoredJson&&ctx.STORAGE_KEYS)ctx.writeStoredJson(ctx.STORAGE_KEYS.workspace,Object.assign({},state,{sets:sets}));
  if(ctx.cloudFirebaseConfig&&(ctx.cloudState&&ctx.cloudState.firebase&&ctx.cloudState.firebase.connected||ctx.cloudFirebaseConfig())){
    if(ctx.syncWorkspaceSetToFirebase)arr(state.sets).forEach(function(set){ctx.syncWorkspaceSetToFirebase(set);});
    if(ctx.syncWorkspaceProfileToFirebase)ctx.syncWorkspaceProfileToFirebase(state.profile||{});
  }
  return sets;
}
function openWorkspaceHome(ctx){ctx.workspaceState.detailType=null;ctx.workspaceState.activeSetId=null;safeCall(ctx,'showWorkspacePanel',['home']);return true;}
function openWorkspaceSetLists(ctx){ctx.workspaceState.detailType=null;safeCall(ctx,'renderWorkspaceSetLists',[]);safeCall(ctx,'showWorkspacePanel',['setlists']);return true;}
function openWorkspacePublishSheet(ctx){ctx=ctx||{};var state=ctx.workspaceState||{};state.selectedPublishId=(ctx.activeSetId&&arr(ctx.personalSets).some(function(x){return x.id===ctx.activeSetId}))?ctx.activeSetId:(ctx.state&&ctx.state.setOptionsContext==='personal'&&ctx.activeSetId?ctx.activeSetId:null);safeCall(ctx,'renderWorkspacePublishList',[]);var m=qs(ctx,'bs-workspace-publish');if(m){m.classList.add('open','wb-transfer-sheet');m.setAttribute('aria-hidden','false')}return true;}
function closeWorkspacePublishSheet(ctx){var m=qs(ctx,'bs-workspace-publish');if(m&&ctx.closeSheetElement)ctx.closeSheetElement(m);else if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}return true;}
function saveWorkspacePublish(ctx){
  ctx=ctx||{};var state=ctx.workspaceState||{};
  var src=arr(ctx.personalSets).find(function(x){return x.id===state.selectedPublishId});
  if(!src){safeCall(ctx,'showToast',['Choose a Personal set first']);return false;}
  ensureSetShape(ctx,src);
  var input=qs(ctx,'workspace-publish-name');
  var name=(input&&input.value||uniqueWorkspacePublishName(ctx,src.name||'Published set')).trim();
  var c=ctl(ctx),copy;
  if(c&&c.publishFromPersonal){var result=c.publishFromPersonal(src,state.sets,name);state.sets=result.sets;copy=result.set;}
  else{copy={id:'ws-'+Date.now(),name:name,updated:'Updated now',notes:setHasNotes(ctx,src),setNotes:src.setNotes||'',setKey:src.setKey||'original',items:JSON.parse(JSON.stringify(src.items||[])),source:'personal-publish',sourcePersonalSetId:src.id};state.sets.unshift(copy);workspaceSetCounts(ctx,copy);}
  persistWorkspace(ctx);closeWorkspacePublishSheet(ctx);safeCall(ctx,'renderWorkspaceSetLists',[]);safeCall(ctx,'openWorkspaceSetEditorShell',[copy.id]);safeCall(ctx,'showToast',['Published to Workspace']);
  return copy;
}
function copyWorkspaceSetToPersonal(ctx,id){
  ctx=ctx||{};var state=ctx.workspaceState||{};
  var src=arr(state.sets).find(function(x){return x.id===id})||arr(state.sets).find(function(x){return x.id===state.activeSetId});
  if(!src)return false;
  var c=ctl(ctx);
  var copy=c&&c.copyToPersonal?c.copyToPersonal(src):{id:'set-'+Date.now(),name:(src.name||'Workspace set')+' copy',source:'Personal',updated:'Updated now',setNotes:src.setNotes||'',setKey:src.setKey||'original',items:JSON.parse(JSON.stringify(src.items||[])),songNotes:{},songCues:{}};
  ensureSetShape(ctx,copy);safeCall(ctx,'syncSetCounts',[copy]);arr(ctx.personalSets).unshift(copy);safeCall(ctx,'persistSets',[]);safeCall(ctx,'renderPersonalHome',[]);safeCall(ctx,'renderSettings',[]);safeCall(ctx,'showToast',['Copied to Personal']);
  return copy;
}
function openWorkspaceNewSheet(ctx){var name=qs(ctx,'workspace-new-name');if(name)name.value='';var m=qs(ctx,'bs-workspace-new');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){if(name)name.focus({preventScroll:true})},60)}return true;}
function closeWorkspaceNewSheet(ctx){var m=qs(ctx,'bs-workspace-new');if(m&&ctx.closeSheetElement)ctx.closeSheetElement(m);else if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}return true;}
function saveWorkspaceNew(ctx){
  ctx=ctx||{};var input=qs(ctx,'workspace-new-name');var name=(input&&input.value||'New Workspace Set').trim();
  var c=ctl(ctx),state=ctx.workspaceState||{};
  var set=c&&c.createSet?c.createSet(name):{id:'ws-'+Date.now(),name:name,updated:'Updated now',notes:false,setKey:'original',items:[],setNotes:''};
  if(c&&c.addSet)c.addSet(state.sets,set);else state.sets.unshift(set);
  persistWorkspace(ctx);closeWorkspaceNewSheet(ctx);safeCall(ctx,'renderWorkspaceSetLists',[]);safeCall(ctx,'openWorkspaceSetEditorShell',[set.id]);safeCall(ctx,'showToast',['Workspace set created']);return set;
}
function deleteWorkspaceSet(ctx,id){
  ctx=ctx||{};var state=ctx.workspaceState||{};
  var doomed=arr(state.sets).find(function(x){return x.id===id});
  return safeCall(ctx,'appConfirm',['Delete this Workspace set list?',{title:'Delete Workspace set',detail:(doomed?('This Workspace set has '+workspaceCountLabel(ctx,doomed)+'. '):'')+'This removes the local Workspace set from this device. You can undo immediately after deleting.',confirmText:'Delete',danger:true}],function(){return Promise.resolve(false);}).then(function(ok){
    if(!ok)return false;var snap=safeCall(ctx,'dataSafetySnapshot',['delete Workspace set']);var c=ctl(ctx);
    if(c&&c.deleteSet){var next=c.deleteSet(state.sets,id);state.sets=next.sets;}else state.sets=arr(state.sets).filter(function(x){return x.id!==id});
    persistWorkspace(ctx);safeCall(ctx,'renderWorkspaceSetLists',[]);if(state.activeSetId===id)openWorkspaceSetLists(ctx);safeCall(ctx,'offerDataUndo',['Workspace set deleted',snap]);return true;
  });
}
function duplicateWorkspaceSet(ctx,id){
  ctx=ctx||{};var state=ctx.workspaceState||{},c=ctl(ctx),copy=null;
  if(c&&c.duplicateSet){var result=c.duplicateSet(state.sets,id);state.sets=result.sets;copy=result.set;}
  else{var src=arr(state.sets).find(function(x){return x.id===id});if(!src)return false;copy=JSON.parse(JSON.stringify(src));copy.id='ws-'+Date.now();copy.name=src.name+' copy';copy.updated='Updated now';state.sets.unshift(copy);}
  if(!copy)return false;persistWorkspace(ctx);safeCall(ctx,'renderWorkspaceSetLists',[]);safeCall(ctx,'openWorkspaceSetEditorShell',[copy.id]);safeCall(ctx,'showToast',['Workspace set duplicated']);return copy;
}
function openWorkspaceRenameSheet(ctx,id){
  ctx=ctx||{};var set=arr(ctx.workspaceState&&ctx.workspaceState.sets).find(function(x){return x.id===id});if(!set)return false;
  return safeCall(ctx,'appPrompt',['Rename Workspace set',set.name,{title:'Rename Workspace set',confirmText:'Rename'}],function(){return Promise.resolve('');}).then(function(name){
    if(!name)return false;var c=ctl(ctx);if(c&&c.renameSet)c.renameSet(set,name);else{set.name=name.trim()||set.name;set.updated='Updated now'}
    persistWorkspace(ctx);safeCall(ctx,'renderWorkspaceSetDetail',[set]);safeCall(ctx,'renderWorkspaceSetLists',[]);safeCall(ctx,'showToast',['Workspace set renamed']);return true;
  });
}
function regenerateWorkspaceInvite(ctx){var c=ctl(ctx),state=ctx.workspaceState||{};var code=c&&c.regenerateInviteCode?c.regenerateInviteCode():'WB-'+Math.random().toString(36).slice(2,6).toUpperCase()+'-'+Math.floor(100+Math.random()*900);state.profile=state.profile||{};state.profile.inviteCode=code;persistWorkspace(ctx);safeCall(ctx,'showToast',['Invite code preview regenerated']);if(state.panel==='detail')safeCall(ctx,'renderWorkspaceMembers',[]);return code;}
function copyWorkspaceInvite(ctx){var state=ctx.workspaceState||{};var code=(state.profile&&state.profile.inviteCode)||'WB-TEAM-042';try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(code);else throw new Error('Clipboard unavailable')}catch(e){safeCall(ctx,'appPrompt',['Copy invite code',code,{title:'Copy invite code',message:'Copy this code manually if needed.',confirmText:'Done'}]);}safeCall(ctx,'showToast',['Invite code copied']);return code;}
function saveWorkspaceProfile(ctx){var n=qs(ctx,'workspace-profile-name'),d=qs(ctx,'workspace-profile-desc');var fields={name:(n&&n.value.trim())||'Workspace',description:(d&&d.value.trim())||'Team planning and shared sets'};var c=ctl(ctx);ctx.workspaceState.profile=c&&c.updateProfile?c.updateProfile(ctx.workspaceState.profile,fields):Object.assign(ctx.workspaceState.profile||{},fields);persistWorkspace(ctx);safeCall(ctx,'showToast',['Workspace profile saved']);safeCall(ctx,'renderWorkspaceSetLists',[]);safeCall(ctx,'renderWorkspaceSettings',[]);safeCall(ctx,'showWorkspacePanel',['detail']);return ctx.workspaceState.profile;}
function clearWorkspaceProfile(ctx){return safeCall(ctx,'appConfirm',['Clear the local Workspace profile from this device?',{title:'Clear Workspace profile',detail:'This will not delete Workspace set lists. You can undo immediately after clearing.',confirmText:'Clear',danger:true}],function(){return Promise.resolve(false);}).then(function(ok){if(!ok)return false;var snap=safeCall(ctx,'dataSafetySnapshot',['clear Workspace profile']);var c=ctl(ctx);ctx.workspaceState.profile=c&&c.defaultProfile?c.defaultProfile():{name:'Workspace',description:'Team planning and shared sets',inviteCode:'WB-TEAM-042'};persistWorkspace(ctx);safeCall(ctx,'renderWorkspaceSettings',[]);safeCall(ctx,'offerDataUndo',['Workspace profile cleared',snap]);return true;});}
function editWorkspaceItem(ctx,idx){
  ctx=ctx||{};idx=parseInt(idx,10);var set=arr(ctx.workspaceState&&ctx.workspaceState.sets).find(function(x){return x.id===ctx.workspaceState.activeSetId});if(!set||!set.items||!set.items[idx])return false;var item=set.items[idx],c=ctl(ctx);
  if(item.type==='section')return safeCall(ctx,'appPrompt',['Section name',item.title||item.label||'SECTION',{title:'Section name',confirmText:'Save'}],function(){return Promise.resolve('');}).then(function(label){if(!label)return false;if(c&&c.updateSectionOrText)c.updateSectionOrText(set,idx,'section',label,'');else{item.label=label.toUpperCase();item.title=label.toUpperCase();set.updated='Updated now'}persistWorkspace(ctx);refreshWorkspaceSet(ctx,set);return true;});
  if(item.type==='item')return safeCall(ctx,'appPrompt',['Service item title',item.title||'Service item',{title:'Service item title',confirmText:'Save'}],function(){return Promise.resolve('');}).then(function(title){if(!title)return false;if(c&&c.updateSectionOrText)c.updateSectionOrText(set,idx,'text',title,item.note||item.sub||'');else{item.title=title;set.updated='Updated now'}persistWorkspace(ctx);refreshWorkspaceSet(ctx,set);return true;});
  return false;
}
function addWorkspaceServiceItem(ctx,kind){safeCall(ctx,'openSetAddSheet',[kind==='section'?'section':'text','workspace']);return true;}
function openWorkspaceSummary(ctx){var set=arr(ctx.workspaceState&&ctx.workspaceState.sets).find(function(x){return x.id===ctx.workspaceState.activeSetId});if(!set)return false;var text=safeCall(ctx,'buildSetSummaryLines',[set,true],function(){return workspaceCountLabel(ctx,set);});var box=qs(ctx,'set-summary-box');if(box){box.dataset.summaryText=text;box.innerHTML=safeCall(ctx,'buildSetSummaryPreviewHtml',[text],function(){return String(text||'');});}var m=qs(ctx,'bs-set-summary');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}return true;}
function openWorkspaceSetKeyPrompt(ctx){safeCall(ctx,'openWorkspaceSetKeySheet',[]);return true;}
function openWorkspaceNotesPrompt(ctx){safeCall(ctx,'openSetNotes',[]);return true;}
function handleWorkspaceSetOption(ctx,action){var set=ctx.activeWorkspaceSet?ctx.activeWorkspaceSet():arr(ctx.workspaceState&&ctx.workspaceState.sets).find(function(x){return x.id===ctx.workspaceState.activeSetId});if(!set)return false;var id=set.id;if(action==='rename')return openWorkspaceRenameSheet(ctx,id);if(action==='duplicate')return duplicateWorkspaceSet(ctx,id);if(action==='delete')return deleteWorkspaceSet(ctx,id);if(action==='add-section')return addWorkspaceServiceItem(ctx,'section');if(action==='add-text')return addWorkspaceServiceItem(ctx,'text');if(action==='summary')return openWorkspaceSummary(ctx);if(action==='export'){if(ctx.state)ctx.state.exportWorkspaceSetId=id;safeCall(ctx,'openExportView',['workspace-set']);return true;}if(action==='notes')return openWorkspaceNotesPrompt(ctx);if(action==='set-key')return openWorkspaceSetKeyPrompt(ctx);if(action==='copy-personal')return copyWorkspaceSetToPersonal(ctx,id);return false;}
function workspaceBack(ctx){var state=ctx.workspaceState||{};if(state.panel&&state.panel!=='home'){if(state.panel==='detail'&&state.detailType==='set')openWorkspaceSetLists(ctx);else openWorkspaceHome(ctx);return true;}openWorkspaceHome(ctx);return true;}
function installWorkspaceSwipeBack(ctx){var el=qs(ctx,'workspace-section');if(!el||el.dataset.swipeBackReady==='1')return false;el.dataset.swipeBackReady='1';var sx=0,sy=0,dx=0,tracking=false;el.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(!t)return;if(!ctx.workspaceState||ctx.workspaceState.panel==='home')return;sx=t.clientX;sy=t.clientY;dx=0;tracking=sx<96},{passive:true});el.addEventListener('touchmove',function(e){if(!tracking)return;var t=e.touches&&e.touches[0];if(!t)return;dx=t.clientX-sx;var dy=Math.abs(t.clientY-sy);if(dx>16&&dx>dy*1.35)e.preventDefault()},{passive:false});el.addEventListener('touchend',function(){if(!tracking)return;tracking=false;if(dx>82)workspaceBack(ctx)},{passive:true});return true;}
function moveWorkspaceSetItem(ctx,from,to){var set=arr(ctx.workspaceState&&ctx.workspaceState.sets).find(function(x){return x.id===ctx.workspaceState.activeSetId});if(!set)return false;var c=ctl(ctx);var result=c&&c.moveItem?c.moveItem(set,from,to):(function(){set.items=set.items||[];if(from<0||from>=set.items.length)return {changed:false};to=Math.max(0,Math.min(set.items.length,to));if(from<to)to-=1;if(from===to)return {changed:false};var item=set.items.splice(from,1)[0];set.items.splice(to,0,item);set.updated='Updated now';workspaceSetCounts(ctx,set);return {changed:true}})();if(!result.changed)return false;safeCall(ctx,'commitSetMutation',['workspace',set,{action:'moveItem',refresh:['workspaceDetail','workspaceLists']}],function(){persistWorkspace(ctx);refreshWorkspaceSet(ctx,set);});safeCall(ctx,'showToast',['Workspace order updated']);return true;}
function installWorkspaceSetDrag(ctx){
  var panel=qs(ctx,'workspace-detail-panel');if(!panel||panel.dataset.workspaceDragReady==='1')return false;panel.dataset.workspaceDragReady='1';
  var drag=null,raf=0;
  function cleanup(){if(!drag)return;if(raf)cancelAnimationFrame(raf);document.removeEventListener('pointermove',onMove);document.removeEventListener('pointerup',onUp);document.removeEventListener('pointercancel',onCancel);if(drag.source){drag.source.classList.remove('dragging','drag-source');drag.source.removeAttribute('aria-grabbed');drag.source.style.transform='';drag.source.style.display=''}if(drag.ghost&&drag.ghost.parentNode)drag.ghost.parentNode.removeChild(drag.ghost);if(drag.placeholder&&drag.placeholder.parentNode)drag.placeholder.parentNode.removeChild(drag.placeholder);if(drag.host)drag.host.dataset.dragSuppress='1';var host=drag.host;drag=null;if(host)setTimeout(function(){host.dataset.dragSuppress=''},120)}
  function start(source,e){var handle=e.target.closest&&e.target.closest('.drag-handle');if(!handle)return;var host=source.closest('.workspace-editor-items');if(!host)return;var idx=parseInt(source.dataset.workspaceIndex,10);if(isNaN(idx))return;if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();var rect=source.getBoundingClientRect(),hostRect=host.getBoundingClientRect();var ph=document.createElement('div');ph.className='set-drag-placeholder';ph.style.height=rect.height+'px';source.parentNode.insertBefore(ph,source.nextSibling);var ghost=source.cloneNode(true);ghost.classList.add('drag-ghost');ghost.style.width=rect.width+'px';ghost.style.left=rect.left+'px';ghost.style.top=rect.top+'px';ghost.style.height=rect.height+'px';document.body.appendChild(ghost);source.classList.add('dragging','drag-source');source.setAttribute('aria-grabbed','true');source.style.display='none';drag={source:source,host:host,placeholder:ph,ghost:ghost,from:idx,to:idx,offsetY:e.clientY-rect.top,hostLeft:hostRect.left,hostWidth:hostRect.width,scroller:source.closest('.workspace-detail-body-scroll')||source.closest('.workspace-scroll')||qs(ctx,'workspace-section')};document.addEventListener('pointermove',onMove,{passive:false});document.addEventListener('pointerup',onUp,{passive:false});document.addEventListener('pointercancel',onCancel,{passive:false});onMove(e)}
  function onMove(e){if(!drag)return;if(e.cancelable)e.preventDefault();var y=e.clientY-drag.offsetY;drag.ghost.style.transform='translate3d(0,'+(y-parseFloat(drag.ghost.style.top||0))+'px,0)';var after=null,items=qsa(ctx,'[data-workspace-index]',drag.host).filter(function(el){return el!==drag.source});for(var i=0;i<items.length;i++){var r=items[i].getBoundingClientRect();if(e.clientY<r.top+r.height/2){after=items[i];break}}if(after)drag.host.insertBefore(drag.placeholder,after);else drag.host.appendChild(drag.placeholder);var children=Array.prototype.slice.call(drag.host.children).filter(function(el){return el!==drag.source});drag.to=Math.max(0,children.indexOf(drag.placeholder));if(drag.scroller&&!raf){raf=requestAnimationFrame(function(){raf=0;var sc=drag&&drag.scroller;if(!sc)return;var sr=sc.getBoundingClientRect?sc.getBoundingClientRect():{top:0,bottom:window.innerHeight};if(e.clientY<sr.top+80)sc.scrollTop-=12;else if(e.clientY>sr.bottom-80)sc.scrollTop+=12})}}
  function onUp(){if(!drag)return;var from=drag.from,to=drag.to;cleanup();moveWorkspaceSetItem(ctx,from,to)}
  function onCancel(){cleanup()}
  panel.addEventListener('pointerdown',function(e){var source=e.target.closest&&e.target.closest('[data-workspace-index]');if(source)start(source,e)},{passive:false});
  panel.addEventListener('keydown',function(e){var handle=e.target.closest&&e.target.closest('.drag-handle');if(!handle||!panel.contains(handle))return;var source=handle.closest('[data-workspace-index]');if(!source)return;var host=source.closest('.workspace-editor-items');if(!host)return;var from=parseInt(source.dataset.workspaceIndex,10),to=null,total=qsa(ctx,'[data-workspace-index]',host).length;if(e.key==='ArrowUp')to=from-1;else if(e.key==='ArrowDown')to=from+2;else if(e.key==='Home')to=0;else if(e.key==='End')to=total;else return;if(from===0&&e.key==='ArrowUp')return;if(from===total-1&&e.key==='ArrowDown')return;e.preventDefault();moveWorkspaceSetItem(ctx,from,to)});
  return true;
}
function installWorkspaceControls(ctx){
  ctx=ctx||{};installWorkspaceSetDrag(ctx);
  var a=qs(ctx,'workspace-open-sets');if(a&&!a.dataset.ready){a.dataset.ready='1';a.addEventListener('click',function(){openWorkspaceSetLists(ctx)})}
  qsa(ctx,'.workspace-subview-back').forEach(function(b){if(!b.dataset.ready){b.dataset.ready='1';b.addEventListener('click',function(){workspaceBack(ctx)})}});
  var pub=qs(ctx,'workspace-publish-set');if(pub&&!pub.dataset.ready){pub.dataset.ready='1';pub.addEventListener('click',function(){openWorkspacePublishSheet(ctx)})}
  var mem=qs(ctx,'workspace-members');if(mem&&!mem.dataset.ready){mem.dataset.ready='1';mem.addEventListener('click',function(){safeCall(ctx,'openWorkspaceInfoShell',['Members & invites'])})}
  var st=qs(ctx,'workspace-settings-card');if(st&&!st.dataset.ready){st.dataset.ready='1';st.addEventListener('click',function(){safeCall(ctx,'openWorkspaceInfoShell',['Workspace settings'])})}
  var nw=qs(ctx,'workspace-subview-new');if(nw&&!nw.dataset.ready){nw.dataset.ready='1';nw.addEventListener('click',function(){openWorkspaceNewSheet(ctx)})}
  var list=qs(ctx,'workspace-setlists-panel');if(list&&!list.dataset.ready){list.dataset.ready='1';list.addEventListener('click',function(e){var del=e.target.closest('[data-workspace-delete]');if(del){e.preventDefault();e.stopPropagation();deleteWorkspaceSet(ctx,del.dataset.workspaceDelete);return}var card=e.target.closest('[data-workspace-set]');if(card)safeCall(ctx,'openWorkspaceSetEditorShell',[card.dataset.workspaceSet])})}
  var detail=qs(ctx,'workspace-detail-panel');if(detail&&!detail.dataset.ready){detail.dataset.ready='1';detail.addEventListener('click',function(e){
    var dragHost=e.target.closest&&e.target.closest('.workspace-editor-items');if(dragHost&&dragHost.dataset.dragSuppress==='1'){e.preventDefault();e.stopPropagation();return}
    var add=e.target.closest('[data-workspace-add-song]');if(add){safeCall(ctx,'openWorkspaceSongPicker',[]);return}
    var cp=e.target.closest('[data-workspace-copy]');if(cp){copyWorkspaceSetToPersonal(ctx,cp.dataset.workspaceCopy);return}
    var op=e.target.closest('[data-workspace-options]');if(op){ctx.workspaceState.activeSetId=op.dataset.workspaceOptions;safeCall(ctx,'openSetOptions',['workspace']);return}
    var clear=e.target.closest('[data-workspace-clear]');if(clear){var cs=arr(ctx.workspaceState.sets).find(function(x){return x.id===clear.dataset.workspaceClear});if(cs)safeCall(ctx,'appConfirm',['Clear all items from this Workspace set?',{title:'Clear Workspace set',detail:'This will remove '+workspaceCountLabel(ctx,cs)+' from the Workspace set. You can undo immediately after clearing.',confirmText:'Clear',danger:true}],function(){return Promise.resolve(false);}).then(function(ok){if(!ok)return;var snap=safeCall(ctx,'dataSafetySnapshot',['clear Workspace set']);var c=ctl(ctx);if(c&&c.clearSet)c.clearSet(cs);else{cs.items=[];cs.updated='Updated now';workspaceSetCounts(ctx,cs)}safeCall(ctx,'commitSetMutation',['workspace',cs,{action:'clearSet',refresh:['workspaceDetail','workspaceLists']}],function(){persistWorkspace(ctx);refreshWorkspaceSet(ctx,cs)});safeCall(ctx,'offerDataUndo',['Workspace set cleared',snap])});return}
    var rm=e.target.closest('[data-workspace-remove]');if(rm){var set=arr(ctx.workspaceState.sets).find(function(x){return x.id===ctx.workspaceState.activeSetId});if(set)safeCall(ctx,'appConfirm',['Remove this item from the Workspace set?',{title:'Remove item',detail:'This only removes the item from this Workspace set. You can undo immediately after removing.',confirmText:'Remove',danger:true}],function(){return Promise.resolve(false);}).then(function(ok){if(!ok)return;var snap=safeCall(ctx,'dataSafetySnapshot',['remove Workspace item']);var c=ctl(ctx);if(c&&c.removeItem)c.removeItem(set,parseInt(rm.dataset.workspaceRemove,10));else{set.items.splice(parseInt(rm.dataset.workspaceRemove,10),1);set.updated='Updated now';workspaceSetCounts(ctx,set)}safeCall(ctx,'commitSetMutation',['workspace',set,{action:'removeItem',refresh:['workspaceDetail','workspaceLists']}],function(){persistWorkspace(ctx);refreshWorkspaceSet(ctx,set)});safeCall(ctx,'offerDataUndo',['Removed from Workspace set',snap])});return}
    var notes=e.target.closest('[data-workspace-notes]');if(notes){openWorkspaceNotesPrompt(ctx);return}
    var setKey=e.target.closest('[data-workspace-set-key]');if(setKey){safeCall(ctx,'openWorkspaceSetKeySheet',[]);return}
    var key=e.target.closest('[data-workspace-key]');if(key){safeCall(ctx,'openWorkspaceSetKeySheet',[parseInt(key.dataset.workspaceKey,10)]);return}
    var songItem=e.target.closest('.workspace-song-item[data-song-id]');if(songItem){var wsSong=arr(ctx.songs).find(function(x){return x.id===songItem.dataset.songId});if(wsSong)safeCall(ctx,'showSong',[wsSong,'workspace-set',{scope:'workspace',setId:ctx.workspaceState.activeSetId,index:parseInt(songItem.dataset.workspaceIndex,10)}]);return}
    var editable=e.target.closest('.workspace-section-item,.workspace-text-item');if(editable){safeCall(ctx,'openWorkspaceSetItemEditor',[parseInt(editable.dataset.workspaceIndex,10)]);return}
    if(e.target.closest('[data-copy-invite]'))copyWorkspaceInvite(ctx);
    if(e.target.closest('[data-regenerate-invite]'))regenerateWorkspaceInvite(ctx);
    if(e.target.closest('[data-save-workspace-profile]'))saveWorkspaceProfile(ctx);
    if(e.target.closest('[data-clear-workspace-profile]'))clearWorkspaceProfile(ctx);
    if(e.target.closest('[data-workspace-settings-open]'))safeCall(ctx,'renderWorkspaceSettings',[]);
    if(e.target.closest('[data-workspace-members-open]'))safeCall(ctx,'renderWorkspaceMembers',[]);
  })}
  var ps=qs(ctx,'bs-workspace-publish');if(ps&&!ps.dataset.ready){ps.dataset.ready='1';ps.addEventListener('click',function(e){if(e.target===ps||e.target.id==='workspace-publish-cancel'||(e.target.closest&&e.target.closest('.workspace-publish-close'))){closeWorkspacePublishSheet(ctx);return}if(e.target.id==='workspace-publish-back'){ctx.workspaceState.selectedPublishId=null;safeCall(ctx,'renderWorkspacePublishList',[]);return}var row=e.target.closest('[data-publish-set]');if(row){ctx.workspaceState.selectedPublishId=row.dataset.publishSet;safeCall(ctx,'renderWorkspacePublishList',[]);return}if(e.target.id==='workspace-publish-save')saveWorkspacePublish(ctx)})}
  var ns=qs(ctx,'bs-workspace-new');if(ns&&!ns.dataset.ready){ns.dataset.ready='1';ns.addEventListener('click',function(e){if(e.target===ns||e.target.id==='workspace-new-cancel'||e.target.id==='workspace-new-close'){closeWorkspaceNewSheet(ctx);return}if(e.target.id==='workspace-new-save')saveWorkspaceNew(ctx)})}
  safeCall(ctx,'renderWorkspaceSetLists',[]);return true;
}
function actionContract(){return ['local workspace persistence ownership','workspace create/publish/copy/delete/duplicate/rename actions','workspace profile/invite actions','workspace detail click routing','workspace drag/reorder and swipe event ownership'];}
function diagnostics(ctx){ctx=ctx||{};return {owner:'WBWorkspaceActionController',sets:arr(ctx.workspaceState&&ctx.workspaceState.sets).length,panel:ctx.workspaceState&&ctx.workspaceState.panel||'home',actionContract:actionContract()};}

root.WBWorkspaceActionController={
  persistWorkspace:persistWorkspace,
  openWorkspaceHome:openWorkspaceHome,
  openWorkspaceSetLists:openWorkspaceSetLists,
  openWorkspacePublishSheet:openWorkspacePublishSheet,
  closeWorkspacePublishSheet:closeWorkspacePublishSheet,
  saveWorkspacePublish:saveWorkspacePublish,
  copyWorkspaceSetToPersonal:copyWorkspaceSetToPersonal,
  openWorkspaceNewSheet:openWorkspaceNewSheet,
  closeWorkspaceNewSheet:closeWorkspaceNewSheet,
  saveWorkspaceNew:saveWorkspaceNew,
  deleteWorkspaceSet:deleteWorkspaceSet,
  duplicateWorkspaceSet:duplicateWorkspaceSet,
  openWorkspaceRenameSheet:openWorkspaceRenameSheet,
  regenerateWorkspaceInvite:regenerateWorkspaceInvite,
  copyWorkspaceInvite:copyWorkspaceInvite,
  saveWorkspaceProfile:saveWorkspaceProfile,
  clearWorkspaceProfile:clearWorkspaceProfile,
  editWorkspaceItem:editWorkspaceItem,
  addWorkspaceServiceItem:addWorkspaceServiceItem,
  openWorkspaceSummary:openWorkspaceSummary,
  openWorkspaceSetKeyPrompt:openWorkspaceSetKeyPrompt,
  openWorkspaceNotesPrompt:openWorkspaceNotesPrompt,
  handleWorkspaceSetOption:handleWorkspaceSetOption,
  workspaceBack:workspaceBack,
  installWorkspaceSwipeBack:installWorkspaceSwipeBack,
  moveWorkspaceSetItem:moveWorkspaceSetItem,
  installWorkspaceSetDrag:installWorkspaceSetDrag,
  installWorkspaceControls:installWorkspaceControls,
  diagnostics:diagnostics,
  actionContract:actionContract
};
})(window);
