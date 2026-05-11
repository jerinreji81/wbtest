/* WorshipBase Phase J3 Backup Centre UI controller.
   Owns backup action labels, Drive action confirmation, and visible async feedback.
   Drive API primitives remain in WBBackupService; Backup Centre rendering remains in the legacy shell for now. */
(function(root){
'use strict';

var ACTIONS={
  'export-full':{working:'Preparing local backup…',done:'Local backup created'},
  'export-songs':{working:'Preparing songs backup…',done:'Songs backup created'},
  'export-sets':{working:'Preparing set list backup…',done:'Set list backup created'},
  'export-settings':{working:'Preparing notes and settings backup…',done:'Settings backup created'},
  'restore-full':{working:'Choose a backup file…'},
  'restore-songs':{working:'Choose a songs backup file…'},
  'restore-sets':{working:'Choose a set list backup file…'},
  'restore-settings':{working:'Choose a settings backup file…'},
  'snapshot':{working:'Preparing snapshot…',done:'Snapshot downloaded'},
  'drive-connect':{working:'Connecting Google Drive…',done:'Google Drive connected'},
  'drive-backup':{working:'Backing up to Google Drive…',done:'Google Drive backup complete'},
  'drive-restore':{working:'Checking Google Drive backup…',done:'Drive backup ready to review'},
  'drive-snapshot':{working:'Preparing Drive snapshot…',done:'Drive snapshot downloaded'},
  'drive-disconnect':{working:'Disconnecting Drive…',done:'Drive disconnected on this device'}
};

function actionInfo(action){return ACTIONS[action]||{working:'Working…',done:'Done'}}
function buttonForAction(action){try{return document.querySelector('[data-backup-action="'+String(action).replace(/"/g,'\\"')+'"]')}catch(e){return null}}
function titleNode(button){return button?button.querySelector('.backup-centre-title'):null}
function setBusy(action,busy){
  var btn=buttonForAction(action); if(!btn)return;
  var title=titleNode(btn);
  if(busy){
    if(!btn.dataset.wbBackupOriginalTitle && title)btn.dataset.wbBackupOriginalTitle=title.textContent||'';
    btn.disabled=true;
    btn.setAttribute('aria-busy','true');
    if(title)title.textContent=actionInfo(action).working||'Working…';
  }else{
    btn.disabled=false;
    btn.removeAttribute('aria-busy');
    if(title && btn.dataset.wbBackupOriginalTitle){title.textContent=btn.dataset.wbBackupOriginalTitle;delete btn.dataset.wbBackupOriginalTitle;}
  }
}
function toast(hooks,msg){try{if(hooks&&typeof hooks.toast==='function')hooks.toast(msg)}catch(e){}}
function alertError(hooks,msg){try{if(hooks&&typeof hooks.alert==='function')hooks.alert(msg)}catch(e){}}
function confirmDisconnect(confirmFn){
  var msg='Disconnect Google Drive on this device?\n\nThis only forgets the local connection. Existing Drive backups are not deleted.';
  try{return typeof confirmFn==='function'?!!confirmFn(msg):true}catch(e){return false}
}
function shouldConfirmAction(action,confirmFn){
  if(action==='drive-disconnect')return confirmDisconnect(confirmFn);
  return true;
}
function trackAction(action,result,hooks){
  if(!result || typeof result.then!=='function')return result;
  setBusy(action,true);
  toast(hooks,actionInfo(action).working||'Working…');
  return result.then(function(value){
    setBusy(action,false);
    var done=actionInfo(action).done;
    if(done && action.indexOf('drive-restore')<0)toast(hooks,done);
    return value;
  }).catch(function(err){
    setBusy(action,false);
    var msg=(err&&err.message)||'Backup action failed';
    alertError(hooks,msg);
    throw err;
  });
}
function statusLine(state){
  state=state||{};
  if(state.busy)return state.label||'Working…';
  if(state.connected)return state.lastBackupAt?'Last backup '+state.lastBackupAt:'Connected';
  return 'Not connected';
}

root.WBBackupUiController={
  actionInfo:actionInfo,
  setBusy:setBusy,
  shouldConfirmAction:shouldConfirmAction,
  trackAction:trackAction,
  statusLine:statusLine
};
})(window);
