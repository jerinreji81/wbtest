/* WorshipBase Phase E.3 backup / Google Drive service boundary.
   Source of truth for Google Identity loading, Drive appdata requests, JSON upload/download,
   backup metadata stamping, and Drive status shaping.
   UI orchestration and restore review rendering remain in the legacy shell for now. */
(function(root){
'use strict';

var GOOGLE_IDENTITY_SCRIPT='https://accounts.google.com/gsi/client';
var scriptPromise=null;

function constants(){return root.WBConstants||{}}
function storage(){return root.WBStorage||{}}
function googleConfig(){return (constants().GOOGLE_DRIVE)||{}}
function clone(value){try{return JSON.parse(JSON.stringify(value))}catch(e){return value}}
function cloudClientId(){
  var s=storage();
  var stored=s&&s.safeGet?s.safeGet('wb_google_client_id'):'';
  return (root.WB_CLOUD_CONFIG&&root.WB_CLOUD_CONFIG.googleClientId)||stored||googleConfig().clientId||'';
}
function ensureClientId(){return cloudClientId()||googleConfig().clientId||''}
function scope(){return googleConfig().scope||'https://www.googleapis.com/auth/drive.appdata'}
function backupName(){return googleConfig().backupName||'worshipbase-personal-backup.json'}
function snapshotName(){return googleConfig().snapshotName||'worshipbase-pre-restore-snapshot.json'}
function legacyStateKey(){return googleConfig().legacyStateKey||'wb_google_drive_backup_v1'}

function loadScript(src){
  if(scriptPromise)return scriptPromise;
  scriptPromise=new Promise(function(resolve,reject){
    var existing=document.querySelector('script[data-ext-src="'+src+'"]');
    if(existing){
      if(existing.dataset.loaded==='1'){resolve();return}
      existing.addEventListener('load',function(){existing.dataset.loaded='1';resolve()},{once:true});
      existing.addEventListener('error',function(){reject(new Error('Could not load '+src))},{once:true});
      return;
    }
    var s=document.createElement('script');
    s.src=src;
    s.async=true;
    s.dataset.extSrc=src;
    s.onload=function(){s.dataset.loaded='1';resolve()};
    s.onerror=function(){reject(new Error('Could not load '+src))};
    document.head.appendChild(s);
  });
  return scriptPromise;
}
function ensureGoogleIdentity(){
  if(root.google&&root.google.accounts&&root.google.accounts.oauth2)return Promise.resolve();
  return loadScript(GOOGLE_IDENTITY_SCRIPT);
}
function tokenValid(driveState){
  driveState=driveState||{};
  return !!(driveState.accessToken&&driveState.expiresAt&&driveState.expiresAt>Date.now()+20000);
}
function requestToken(driveState,options){
  options=options||{};
  driveState=driveState||{};
  if(tokenValid(driveState))return Promise.resolve(driveState.accessToken);
  var clientId=options.clientId||ensureClientId();
  if(!clientId)return Promise.reject(new Error('Google Drive client ID is not configured.'));
  return ensureGoogleIdentity().then(function(){return new Promise(function(resolve,reject){
    try{
      var tokenClient=root.google.accounts.oauth2.initTokenClient({
        client_id:clientId,
        scope:options.scope||scope(),
        callback:function(resp){
          if(resp&&resp.access_token){
            driveState.connected=true;
            driveState.accessToken=resp.access_token;
            driveState.expiresAt=Date.now()+((resp.expires_in||3600)*1000);
            driveState.lastConnectedAt=new Date().toISOString();
            if(typeof options.onStateChanged==='function')options.onStateChanged(driveState,resp);
            resolve(resp.access_token);
            return;
          }
          reject(new Error((resp&&resp.error_description)||(resp&&resp.error)||'Google Drive authorisation failed'));
        },
        error_callback:function(err){reject(new Error((err&&err.message)||(err&&err.type)||'Google Drive authorisation failed'))}
      });
      tokenClient.requestAccessToken({prompt:options.interactive?'consent':''});
    }catch(err){reject(err)}
  })})
}
function authHeaders(token){return {Authorization:'Bearer '+token}}
function fetchJson(url,opts){
  return fetch(url,opts).then(function(r){
    if(!r.ok)return r.text().then(function(t){throw new Error(t||('Drive request failed ('+r.status+')'))});
    return r.json();
  });
}
function findFileByName(name,driveState,options){
  name=name||backupName();
  return requestToken(driveState,{interactive:!(driveState&&driveState.connected),onStateChanged:options&&options.onStateChanged}).then(function(token){
    var safeName=String(name).replace(/'/g,"\'");
    var q=encodeURIComponent("name='"+safeName+"' and trashed=false and 'appDataFolder' in parents");
    return fetchJson('https://www.googleapis.com/drive/v3/files?q='+q+'&spaces=appDataFolder&fields=files(id,name,modifiedTime,size)',{headers:authHeaders(token)}).then(function(data){
      var files=(data.files||[]).sort(function(a,b){return String(b.modifiedTime||'').localeCompare(String(a.modifiedTime||''))});
      return {token:token,file:files[0]||null,files:files};
    });
  });
}
function uploadJsonFile(name,payload,fileId,driveState,options){
  name=name||backupName();
  return requestToken(driveState,{interactive:!(driveState&&driveState.connected)||!tokenValid(driveState),onStateChanged:options&&options.onStateChanged}).then(function(token){
    var boundary='wb-'+Date.now()+'-'+Math.random().toString(16).slice(2);
    var metadata={name:name,mimeType:'application/json',parents:['appDataFolder']};
    var body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(payload,null,2)+'\r\n--'+boundary+'--';
    var method=fileId?'PATCH':'POST';
    var url='https://www.googleapis.com/upload/drive/v3/files'+(fileId?'/'+encodeURIComponent(fileId):'')+'?uploadType=multipart&fields=id,name,modifiedTime';
    return fetchJson(url,{method:method,headers:Object.assign({'Content-Type':'multipart/related; boundary='+boundary},authHeaders(token)),body:body});
  });
}
function downloadJsonFile(fileId,driveState,options){
  return requestToken(driveState,{interactive:!(driveState&&driveState.connected)||!tokenValid(driveState),onStateChanged:options&&options.onStateChanged}).then(function(token){
    return fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(fileId)+'?alt=media',{headers:authHeaders(token)}).then(function(r){
      if(!r.ok)return r.text().then(function(t){throw new Error(t||'Could not download Drive backup')});
      return r.json();
    });
  });
}
function stampBackupPayload(payload,kind){
  var out=Object.assign({},payload||{});
  out.format=out.format||'worshipbase-google-drive-backup';
  out.backupKind=kind||out.backupKind||'personal-appdatafolder';
  out.fileName=out.fileName||backupName();
  out.driveSchema=out.driveSchema||'rebuild-v7';
  return out;
}
function connectInteractive(driveState,callbacks){
  callbacks=callbacks||{};
  return requestToken(driveState,{interactive:true,onStateChanged:callbacks.onStateChanged}).then(function(){
    driveState.connected=true;
    if(typeof callbacks.onStateChanged==='function')callbacks.onStateChanged(driveState);
    return driveState;
  });
}
function disconnectLocal(driveState,callbacks){
  callbacks=callbacks||{};
  var token=(driveState&&driveState.accessToken)||'';
  var next={connected:false,email:'',accessToken:'',expiresAt:0,lastBackupAt:'',lastModifiedTime:'',lastRestoreAt:'',fileId:'',snapshotFileId:'',snapshotSaved:false};
  Object.keys(next).forEach(function(k){driveState[k]=next[k]});
  try{var s=storage();if(s&&s.safeRemove)s.safeRemove(legacyStateKey())}catch(e){}
  try{if(token&&root.google&&root.google.accounts&&root.google.accounts.oauth2)root.google.accounts.oauth2.revoke(token,function(){})}catch(e){}
  if(typeof callbacks.onStateChanged==='function')callbacks.onStateChanged(driveState);
  return driveState;
}
function status(driveState){
  driveState=driveState||{};
  return {connected:!!driveState.connected,hasClientId:!!ensureClientId(),fileId:driveState.fileId||'',lastBackupAt:driveState.lastBackupAt||'',lastRestoreAt:driveState.lastRestoreAt||'',lastModifiedTime:driveState.lastModifiedTime||'',snapshotSaved:!!driveState.snapshotSaved,snapshotFileId:driveState.snapshotFileId||''};
}
function resetForTests(){scriptPromise=null}

root.WBBackupService={
  GOOGLE_IDENTITY_SCRIPT:GOOGLE_IDENTITY_SCRIPT,
  config:googleConfig,
  cloudClientId:cloudClientId,
  ensureClientId:ensureClientId,
  scope:scope,
  backupName:backupName,
  snapshotName:snapshotName,
  legacyStateKey:legacyStateKey,
  loadScript:loadScript,
  ensureGoogleIdentity:ensureGoogleIdentity,
  tokenValid:tokenValid,
  requestToken:requestToken,
  authHeaders:authHeaders,
  fetchJson:fetchJson,
  findFileByName:findFileByName,
  uploadJsonFile:uploadJsonFile,
  downloadJsonFile:downloadJsonFile,
  stampBackupPayload:stampBackupPayload,
  connectInteractive:connectInteractive,
  disconnectLocal:disconnectLocal,
  status:status,
  cloudClone:clone,
  _resetForTests:resetForTests
};
})(window);
