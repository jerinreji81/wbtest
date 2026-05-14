/* WorshipBase Phase 2b - E3 set-list event/persistence adapter owner.
   Owns the commit boundary after Personal/Workspace set mutations while the legacy
   shell remains the temporary DOM event adapter. This module does not attach DOM
   listeners directly; callers provide persistence, close, refresh and sync callbacks. */
(function(root){
'use strict';

function normalizeScope(scope){scope=String(scope||'personal').toLowerCase();return scope==='workspace'?'workspace':'personal';}
function asArray(value){return Array.isArray(value)?value:[];}
function asObject(value){return value&&typeof value==='object'?value:{};}
function call(fn,args,errors,label){if(typeof fn!=='function')return false;try{fn.apply(null,args||[]);return true;}catch(e){errors.push({step:label||'callback',message:e&&e.message?e.message:String(e)});return false;}}
function unique(list){var out=[];asArray(list).forEach(function(item){item=String(item||'').trim();if(item&&out.indexOf(item)<0)out.push(item);});return out;}
function normaliseList(value){if(!value)return [];return Array.isArray(value)?unique(value):unique(String(value).split(/[\s,]+/));}

var CLOSE_ALIASES={setKey:'closeSetKey',key:'closeSetKey',setAdd:'closeSetAdd',add:'closeSetAdd',setNotes:'closeSetNotes',notes:'closeSetNotes',songNotes:'closeSongNotes'};
var REFRESH_ALIASES={
  personalEditor:'renderPersonalEditor',editor:'renderPersonalEditor',personalHome:'renderPersonalHome',home:'renderPersonalHome',settings:'renderSettings',library:'renderLibrary',songNotePreview:'renderSongNotePreview',notePreview:'renderSongNotePreview',
  workspaceDetail:'renderWorkspaceDetail',workspaceLists:'renderWorkspaceLists',workspaceList:'renderWorkspaceLists',setOptions:'updateSetOptionsState',songKey:'refreshOpenSongKeyFromContext',openSongKey:'refreshOpenSongKeyFromContext'
};
function defaultRefresh(scope){return normalizeScope(scope)==='workspace'?['workspaceDetail','workspaceLists']:['personalEditor'];}
function sync(scope,set,callbacks,errors){callbacks=asObject(callbacks);return normalizeScope(scope)==='workspace'?call(callbacks.syncWorkspace,[set],errors,'syncWorkspace'):call(callbacks.syncPersonal,[set],errors,'syncPersonal');}
function persist(scope,callbacks,errors){callbacks=asObject(callbacks);return normalizeScope(scope)==='workspace'?call(callbacks.persistWorkspace,[],errors,'persistWorkspace'):call(callbacks.persistPersonal,[],errors,'persistPersonal');}
function closeSurfaces(closeList,callbacks,errors){callbacks=asObject(callbacks);return normaliseList(closeList).map(function(close){var fn=CLOSE_ALIASES[close]||close;return {surface:close,called:call(callbacks[fn],[],errors,fn)};});}
function refreshSurfaces(scope,set,refreshList,callbacks,errors){callbacks=asObject(callbacks);var used=normaliseList(refreshList);if(!used.length)used=defaultRefresh(scope);return used.map(function(name){var fnName=REFRESH_ALIASES[name]||name;var args=(fnName==='renderWorkspaceDetail')?[set]:[];return {surface:name,called:call(callbacks[fnName],args,errors,fnName)};});}
function commit(scope,set,options){
  scope=normalizeScope(scope);options=asObject(options);var errors=[];var callbacks=asObject(options.callbacks||options);
  var result={owner:'WBSetEventPersistenceAdapter',phase:'Phase 2b - E3',scope:scope,setId:set&&set.id||'',action:options.action||'setMutation',synced:false,persisted:false,closed:[],refreshed:[],errors:errors};
  if(options.sync!==false)result.synced=sync(scope,set,callbacks,errors);
  if(options.persist!==false)result.persisted=persist(scope,callbacks,errors);
  result.closed=closeSurfaces(options.close||[],callbacks,errors);
  result.refreshed=refreshSurfaces(scope,set,options.refresh||[],callbacks,errors);
  if(typeof callbacks.afterCommit==='function')call(callbacks.afterCommit,[result,set],errors,'afterCommit');
  return result;
}
function mutationContext(scope,set,action){return {scope:normalizeScope(scope),setId:set&&set.id||'',action:action||'setMutation'};}
function eventContract(){return [
  'Legacy click handlers may remain temporarily, but after a set mutation they should call WBSetEventPersistenceAdapter.commit where practical.',
  'This owner centralises sync, persist, close-sheet, and refresh ordering for Personal and Workspace sets.',
  'The adapter must not attach DOM events directly while src/legacy/index.phase-d.html remains the active shell.',
  'Callers supply callbacks so persistence remains explicit and testable during extraction.',
  'Personal and Workspace set mutations must use the same action vocabulary and commit lifecycle.'
];}
function diagnostics(){return {owner:'WBSetEventPersistenceAdapter',phase:'Phase 2b - E3',methods:['commit','persist','sync','closeSurfaces','refreshSurfaces','mutationContext'],contract:eventContract()};}

root.WBSetEventPersistenceAdapter={
  normalizeScope:normalizeScope,
  commit:commit,
  persist:persist,
  sync:sync,
  closeSurfaces:closeSurfaces,
  refreshSurfaces:refreshSurfaces,
  mutationContext:mutationContext,
  eventContract:eventContract,
  diagnostics:diagnostics
};
})(window);
