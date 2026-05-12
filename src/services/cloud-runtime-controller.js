/* WorshipBase Phase 2b - K3 cloud/Firebase/Drive/offline runtime owner.
   Owns shared cloud state persistence, Google Drive runtime orchestration, Firebase auth/song
   runtime connection, and offline-first reconnect/service-worker warmup. The legacy shell remains
   a temporary host that supplies app-state callbacks through cloudRuntimeCtx(). */
(function(root){
'use strict';

var firebaseReconnectTimer=null;
var connectivityWatchersInstalled=false;
var offlineWarmStarted=false;
var serviceWorkerControllerReloadInstalled=false;

function asObject(value){return value&&typeof value==='object'?value:{};}
function arr(value){return Array.isArray(value)?value:[];}
function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(e){return value;}}
function call(ctx,name,args,fallback){
  if(ctx&&typeof ctx[name]==='function')return ctx[name].apply(null,args||[]);
  if(typeof fallback==='function')return fallback();
}
function promiseReject(message){return Promise.reject(new Error(message));}
function storage(ctx){return ctx&&ctx.StorageService||root.WBStorage||{};}
function firebaseService(ctx){return ctx&&ctx.FirebaseService||root.WBFirebaseService||{};}
function backupService(ctx){return ctx&&ctx.BackupService||root.WBBackupService||{};}
function startupLifecycle(ctx){return ctx&&ctx.StartupLifecycle||root.WBStartupLifecycle||{};}
function constants(ctx){return ctx&&ctx.WBConstants||root.WBConstants||{};}
function cloudState(ctx){
  ctx=ctx||{};
  ctx.cloudState=ctx.cloudState||{googleDrive:{connected:false,email:'',accessToken:'',expiresAt:0,lastBackupAt:'',fileId:'',snapshotFileId:'',snapshotSaved:false},firebase:{connected:false,email:'',uid:'',provider:'',lastAuthAt:'',configured:false}};
  ctx.cloudState.googleDrive=Object.assign({connected:false,email:'',accessToken:'',expiresAt:0,lastBackupAt:'',fileId:'',snapshotFileId:'',snapshotSaved:false},ctx.cloudState.googleDrive||{});
  ctx.cloudState.firebase=Object.assign({connected:false,email:'',uid:'',provider:'',lastAuthAt:'',configured:false},ctx.cloudState.firebase||{});
  return ctx.cloudState;
}
function firebaseRuntime(ctx){
  ctx=ctx||{};
  ctx.firebaseRuntime=ctx.firebaseRuntime||{};
  return ctx.firebaseRuntime;
}
function readStoredJson(ctx,key,fallback){var s=storage(ctx);return ctx&&ctx.readStoredJson?ctx.readStoredJson(key,fallback):(s.readJson?s.readJson(key,fallback):fallback);}
function readStoredObject(ctx,key,fallback){var s=storage(ctx);return ctx&&ctx.readStoredObject?ctx.readStoredObject(key,fallback):(s.readObject?s.readObject(key,fallback):fallback);}
function readStoredArray(ctx,key,fallback){var s=storage(ctx);return ctx&&ctx.readStoredArray?ctx.readStoredArray(key,fallback):(s.readArray?s.readArray(key,fallback):arr(fallback));}
function writeStoredJson(ctx,key,value){var s=storage(ctx);return ctx&&ctx.writeStoredJson?ctx.writeStoredJson(key,value):(s.writeJson?s.writeJson(key,value):undefined);}
function safeGet(ctx,key){var s=storage(ctx);return ctx&&ctx.safeGet?ctx.safeGet(key):(s.safeGet?s.safeGet(key):'');}
function safeSet(ctx,key,value){var s=storage(ctx);return ctx&&ctx.safeSet?ctx.safeSet(key,value):(s.safeSet?s.safeSet(key,value):undefined);}
function safeRemove(ctx,key){var s=storage(ctx);return ctx&&ctx.safeRemove?ctx.safeRemove(key):(s.safeRemove?s.safeRemove(key):undefined);}
function storageKeys(ctx){return ctx&&ctx.STORAGE_KEYS||constants(ctx).STORAGE_KEYS||{};}
function googleDriveConfig(ctx){var svc=backupService(ctx);return svc.config?svc.config():((constants(ctx).GOOGLE_DRIVE)||{});}
function googleDriveClientId(ctx){return googleDriveConfig(ctx).clientId||'137901259240-jkkun2kjr4a3bnfrqmbu1jk9ieqvn5jh.apps.googleusercontent.com';}
function googleDriveScope(ctx){return googleDriveConfig(ctx).scope||'https://www.googleapis.com/auth/drive.appdata';}
function googleDriveBackupName(ctx){var svc=backupService(ctx);return svc.backupName?svc.backupName():(googleDriveConfig(ctx).backupName||'worshipbase-personal-backup.json');}
function googleDriveSnapshotName(ctx){var svc=backupService(ctx);return svc.snapshotName?svc.snapshotName():(googleDriveConfig(ctx).snapshotName||'worshipbase-pre-restore-snapshot.json');}
function googleDriveLegacyStateKey(ctx){var svc=backupService(ctx);return svc.legacyStateKey?svc.legacyStateKey():(googleDriveConfig(ctx).legacyStateKey||'wb_google_drive_backup_v1');}
function getPromise(ctx,name){var fn='get'+name.charAt(0).toUpperCase()+name.slice(1);return ctx&&typeof ctx[fn]==='function'?ctx[fn]():ctx&&ctx[name];}
function setPromise(ctx,name,value){var fn='set'+name.charAt(0).toUpperCase()+name.slice(1);if(ctx&&typeof ctx[fn]==='function')ctx[fn](value);else if(ctx)ctx[name]=value;return value;}
function getFirebaseSongs(ctx){return ctx&&typeof ctx.getFirebaseSongs==='function'?arr(ctx.getFirebaseSongs()):arr(ctx&&ctx.firebaseSongs);}
function setFirebaseSongs(ctx,songs){songs=arr(songs);if(ctx&&typeof ctx.setFirebaseSongs==='function')ctx.setFirebaseSongs(songs);else if(ctx)ctx.firebaseSongs=songs;return songs;}
function getFirebaseSongsDetach(ctx){return ctx&&typeof ctx.getFirebaseSongsDetach==='function'?ctx.getFirebaseSongsDetach():ctx&&ctx.firebaseSongsDetach;}
function setFirebaseSongsDetach(ctx,fn){if(ctx&&typeof ctx.setFirebaseSongsDetach==='function')ctx.setFirebaseSongsDetach(fn);else if(ctx)ctx.firebaseSongsDetach=fn;}
function getFirebaseSharedSetsDetach(ctx){return ctx&&typeof ctx.getFirebaseSharedSetsDetach==='function'?ctx.getFirebaseSharedSetsDetach():ctx&&ctx.firebaseSharedSetsDetach;}
function setFirebaseSharedSetsDetach(ctx,fn){if(ctx&&typeof ctx.setFirebaseSharedSetsDetach==='function')ctx.setFirebaseSharedSetsDetach(fn);else if(ctx)ctx.firebaseSharedSetsDetach=fn;}

function persistCloudState(ctx){writeStoredJson(ctx,storageKeys(ctx).cloud,cloudState(ctx));return cloudState(ctx);}
function loadCloudState(ctx){
  var state=cloudState(ctx),parsed=readStoredObject(ctx,storageKeys(ctx).cloud,{});
  if(parsed&&typeof parsed==='object'){
    state.googleDrive=Object.assign({},state.googleDrive,parsed.googleDrive||{});
    state.firebase=Object.assign({},state.firebase,parsed.firebase||{});
  }
  var legacy=readStoredObject(ctx,googleDriveLegacyStateKey(ctx),{});
  if(legacy&&(legacy.connected||legacy.fileId||legacy.lastBackupAt)&&!state.googleDrive.connected){
    state.googleDrive=Object.assign({},state.googleDrive,{connected:!!legacy.connected,fileId:legacy.fileId||state.googleDrive.fileId||'',lastBackupAt:legacy.lastBackupAt||state.googleDrive.lastBackupAt||'',lastModifiedTime:legacy.lastModifiedTime||state.googleDrive.lastModifiedTime||'',lastRestoreAt:legacy.lastRestoreAt||state.googleDrive.lastRestoreAt||'',snapshotFileId:legacy.snapshotFileId||state.googleDrive.snapshotFileId||''});
    persistCloudState(ctx);
  }
  return state;
}
function cloudGoogleClientId(ctx){var svc=backupService(ctx);return svc.cloudClientId?svc.cloudClientId():((root.WB_CLOUD_CONFIG&&root.WB_CLOUD_CONFIG.googleClientId)||safeGet(ctx,'wb_google_client_id')||googleDriveClientId(ctx));}
function ensureGoogleClientId(ctx){var svc=backupService(ctx);return svc.ensureClientId?svc.ensureClientId():(cloudGoogleClientId(ctx)||googleDriveClientId(ctx));}
function cloudFirebaseConfig(ctx){var svc=firebaseService(ctx);return svc.config?svc.config():readStoredJson(ctx,'wb_firebase_config',null);}
function ensureFirebaseConfigPrompt(ctx){
  ctx=ctx||{};
  var cfg=cloudFirebaseConfig(ctx),state=cloudState(ctx);
  if(cfg){state.firebase.configured=true;persistCloudState(ctx);return Promise.resolve(cfg);}
  if(typeof ctx.appPrompt!=='function')return Promise.resolve(null);
  return ctx.appPrompt('Firebase config', safeGet(ctx,'wb_firebase_config')||'', {title:'Firebase config',message:'Paste the Firebase web config JSON.',confirmText:'Save config',multiline:true}).then(function(raw){
    if(raw&&raw.trim()){
      try{cfg=JSON.parse(raw);writeStoredJson(ctx,'wb_firebase_config',cfg);state.firebase.configured=true;persistCloudState(ctx);return cfg;}
      catch(e){return call(ctx,'appAlert',['Firebase config is not valid JSON.',{title:'Invalid config'}],function(){return Promise.resolve();}).then(function(){return null;});}
    }
    return null;
  });
}
function cloudFirestorePaths(ctx){var svc=firebaseService(ctx);return svc.paths?svc.paths():{songsPath:'songs',sharedSetsPath:'setlists',workspaceSetsCollection:'workspaceSets',workspaceProfileCollection:'workspaceMeta',workspaceProfileDocId:'default',bibleCollection:'bibleChapters'};}
function normalizeFirebaseSongShape(raw,id){
  var src=Object.assign({},raw||{});
  if(!src.chart&&src.lyrics)src.chart=src.lyrics;
  if(!src.chart&&src.content)src.chart=src.content;
  if(!src.artist&&src.author)src.artist=src.author;
  if(!src.author&&src.artist)src.author=src.artist;
  if(!src.songCode&&src.code)src.songCode=src.code;
  if(!src.code&&src.songCode)src.code=src.songCode;
  src.id=String(id||src.id||src.fbKey||src.songId||src.songCode||'').trim();
  return src;
}
function firebaseSongRecordsFromSnapshot(data){
  if(!data)return [];
  var out=[];
  if(Array.isArray(data)){data.forEach(function(v,idx){if(v&&typeof v==='object')out.push(normalizeFirebaseSongShape(v,v.id||v.fbKey||String(idx)));});return out;}
  if(typeof data==='object')Object.entries(data).forEach(function(entry){var k=entry[0],v=entry[1];if(v&&typeof v==='object')out.push(normalizeFirebaseSongShape(v,v.id||v.fbKey||k));});
  return out;
}
function normalizeFirebaseSong(ctx,raw,id){
  var normalize=ctx&&ctx.normalizeImportedSong;
  var n=typeof normalize==='function'?normalize(Object.assign({},raw||{},{id:id||raw&&raw.id||'',importSource:'firebase'}),'firebase'):Object.assign({},raw||{},{id:id||raw&&raw.id||'',source:'firebase'});
  n.id=String(id||raw&&raw.id||n.id||'').trim();
  n.source='firebase';
  return n;
}
function loadCachedFirebaseSongs(ctx){
  var parsed=readStoredArray(ctx,storageKeys(ctx).firebaseSongsCache,[]);
  if(parsed.length)setFirebaseSongs(ctx,parsed.map(function(s){return normalizeFirebaseSong(ctx,s,s&&s.id);}));
  return getFirebaseSongs(ctx);
}
function persistFirebaseSongsCache(ctx){writeStoredJson(ctx,storageKeys(ctx).firebaseSongsCache,getFirebaseSongs(ctx).map(function(s){return Object.assign({},s);}));return true;}
function canUseOfflineCaches(ctx){var startup=startupLifecycle(ctx);return startup.canUseOfflineCaches?startup.canUseOfflineCaches():!!(root.isSecureContext&&'caches' in root);}
function sameOriginAsset(ctx,url){var startup=startupLifecycle(ctx);return startup.sameOriginAsset?startup.sameOriginAsset(url):(function(){try{var u=new URL(url,root.location&&root.location.href);return u.origin===(root.location&&root.location.origin)?u.href:'';}catch(e){return '';}})();}
function warmOfflineCaches(ctx){var startup=startupLifecycle(ctx);return startup.warmOfflineCaches?startup.warmOfflineCaches({cacheName:'worshipbase-offline-phase-2b-g3'}):Promise.resolve(false);}
function registerOfflineServiceWorker(ctx){var startup=startupLifecycle(ctx);return startup.registerOfflineServiceWorker?startup.registerOfflineServiceWorker({url:'./wb-offline-sw.js',version:ctx&&ctx.VERSION||constants(ctx).VERSION,notify:ctx&&ctx.showToast}):Promise.resolve(false);}
function installServiceWorkerControllerReload(ctx){if(serviceWorkerControllerReloadInstalled)return true;var startup=startupLifecycle(ctx);if(startup.installServiceWorkerControllerReload){serviceWorkerControllerReloadInstalled=true;return startup.installServiceWorkerControllerReload({delayMs:250});}return false;}
function scheduleFirebaseReconnect(ctx){
  if(root.navigator&&root.navigator.onLine===false)return;
  clearTimeout(firebaseReconnectTimer);
  firebaseReconnectTimer=setTimeout(function(){setPromise(ctx,'firebaseConnectPromise',null);connectFirebaseRuntimeIfConfigured(ctx);},280);
}
function updateOfflineIndicator(ctx,fromEvent){
  if(root.navigator&&root.navigator.onLine===false){call(ctx,'showSync',['Offline mode',true]);return;}
  if(fromEvent){call(ctx,'showSync',['Back online']);scheduleFirebaseReconnect(ctx);}
}
function installConnectivityWatchers(ctx){
  if(connectivityWatchersInstalled)return;
  connectivityWatchersInstalled=true;
  root.addEventListener&&root.addEventListener('offline',function(){updateOfflineIndicator(ctx,true);});
  root.addEventListener&&root.addEventListener('online',function(){updateOfflineIndicator(ctx,true);});
  if(root.document&&root.document.addEventListener)root.document.addEventListener('visibilitychange',function(){if(root.document.visibilityState==='visible'&&(!root.navigator||root.navigator.onLine!==false))scheduleFirebaseReconnect(ctx);});
}
function ensureOfflineFirstRuntime(ctx){installConnectivityWatchers(ctx);if(!offlineWarmStarted){offlineWarmStarted=true;warmOfflineCaches(ctx);registerOfflineServiceWorker(ctx);}updateOfflineIndicator(ctx,false);}
function backupStateChanged(ctx){persistCloudState(ctx);call(ctx,'renderSettings',[]);var qs=ctx&&ctx.qs;if(typeof qs==='function'){var modal=qs('backup-centre-modal');if(modal&&modal.classList&&modal.classList.contains('open'))call(ctx,'openBackupCentre',[]);}}
function ensureGoogleIdentity(ctx){var svc=backupService(ctx);if(svc.ensureGoogleIdentity)return svc.ensureGoogleIdentity();if(root.google&&root.google.accounts&&root.google.accounts.oauth2)return Promise.resolve();var p=getPromise(ctx,'googleScriptPromise');if(p)return p;p=call(ctx,'wbLoadScript',['https://accounts.google.com/gsi/client'],function(){return promiseReject('Google Identity unavailable');});setPromise(ctx,'googleScriptPromise',p);return p;}
function googleDriveTokenValid(ctx){var svc=backupService(ctx);return svc.tokenValid?svc.tokenValid(cloudState(ctx).googleDrive):!!(cloudState(ctx).googleDrive.accessToken&&cloudState(ctx).googleDrive.expiresAt&&cloudState(ctx).googleDrive.expiresAt>Date.now()+20000);}
function requestGoogleDriveToken(ctx,interactive){var svc=backupService(ctx);return svc.requestToken?svc.requestToken(cloudState(ctx).googleDrive,{interactive:!!interactive,onStateChanged:function(){backupStateChanged(ctx);}}):promiseReject('Backup service unavailable');}
function driveFindFileByName(ctx,name){var svc=backupService(ctx);return svc.findFileByName?svc.findFileByName(name||googleDriveBackupName(ctx),cloudState(ctx).googleDrive,{onStateChanged:function(){backupStateChanged(ctx);}}):promiseReject('Backup service unavailable');}
function driveUploadJsonFile(ctx,name,payload,fileId){var svc=backupService(ctx);return svc.uploadJsonFile?svc.uploadJsonFile(name,payload,fileId,cloudState(ctx).googleDrive,{onStateChanged:function(){backupStateChanged(ctx);}}):promiseReject('Backup service unavailable');}
function driveDownloadJsonFile(ctx,fileId){var svc=backupService(ctx);return svc.downloadJsonFile?svc.downloadJsonFile(fileId,cloudState(ctx).googleDrive,{onStateChanged:function(){backupStateChanged(ctx);}}):promiseReject('Backup service unavailable');}
function refreshDriveBackupUi(ctx){call(ctx,'renderSettings',[]);var qs=ctx&&ctx.qs;if(typeof qs==='function'){var modal=qs('backup-centre-modal');if(modal&&modal.classList&&modal.classList.contains('open'))call(ctx,'openBackupCentre',[]);}}
function uploadLatestBackupToDrive(ctx){
  ctx=ctx||{};call(ctx,'showToast',['Preparing Drive backup…']);
  var payload=call(ctx,'buildLocalBackupPayload',[],function(){return {};});
  var svc=backupService(ctx);
  payload=svc.stampBackupPayload?svc.stampBackupPayload(payload,'personal-appdatafolder'):payload;
  payload.format=payload.format||'worshipbase-google-drive-backup';payload.backupKind=payload.backupKind||'personal-appdatafolder';payload.fileName=payload.fileName||googleDriveBackupName(ctx);payload.driveSchema=payload.driveSchema||'rebuild-v7';
  return driveFindFileByName(ctx,googleDriveBackupName(ctx)).then(function(out){return driveUploadJsonFile(ctx,googleDriveBackupName(ctx),payload,out.file&&out.file.id);}).then(function(file){
    var now=new Date().toISOString(),state=cloudState(ctx);state.googleDrive.connected=true;state.googleDrive.fileId=file.id||state.googleDrive.fileId||'';state.googleDrive.lastBackupAt=now;state.googleDrive.lastModifiedTime=file.modifiedTime||now;
    call(ctx,'recordBackupHistory',[{kind:'Google Drive',label:'Back up now',detail:'Uploaded hidden personal backup to Google Drive app data storage.',when:now,summary:call(ctx,'backupPayloadSummary',['full'],function(){return null;})}]);
    persistCloudState(ctx);refreshDriveBackupUi(ctx);call(ctx,'showToast',['Google Drive backup complete']);return file;
  }).catch(function(err){try{console.error(err);}catch(e){}return call(ctx,'appAlert',[err&&err.message?err.message:'Google Drive backup failed']);});
}
function beginRestoreFromDrive(ctx){
  call(ctx,'renderBackupLoadingState',['Checking Google Drive backup…','Looking for your latest hidden WorshipBase backup before opening Restore Review.']);call(ctx,'showToast',['Checking Google Drive backup…']);
  var state=cloudState(ctx),filePromise=state.googleDrive.fileId?Promise.resolve({file:{id:state.googleDrive.fileId,name:googleDriveBackupName(ctx)}}):driveFindFileByName(ctx,googleDriveBackupName(ctx));
  return filePromise.then(function(out){var file=out&&out.file;if(!file||!file.id)throw new Error('No WorshipBase backup found in Google Drive yet.');state.googleDrive.connected=true;state.googleDrive.fileId=file.id;state.googleDrive.lastModifiedTime=file.modifiedTime||state.googleDrive.lastModifiedTime||'';persistCloudState(ctx);return driveDownloadJsonFile(ctx,file.id).then(function(data){return {file:file,data:data};});}).then(function(out){state.googleDrive.lastRestoreAt=new Date().toISOString();persistCloudState(ctx);call(ctx,'openBackupRestoreReview',[out.data,{mode:'full',fileName:out.file.name||googleDriveBackupName(ctx),source:'drive'}]);call(ctx,'showToast',['Drive backup ready to review']);}).catch(function(err){try{console.error(err);}catch(e){}return call(ctx,'appAlert',[err&&err.message?err.message:'Could not restore from Google Drive']);});
}
function uploadLocalSnapshotToDrive(ctx){
  var raw=safeGet(ctx,'wb_rebuild_52_pre_restore_snapshot');if(!raw)return Promise.resolve(false);var data;
  try{data=JSON.parse(raw);}catch(e){data={format:'worshipbase-pre-restore-snapshot',snapshotAt:new Date().toISOString(),raw:raw};}
  data.fileName=googleDriveSnapshotName(ctx);
  return driveFindFileByName(ctx,googleDriveSnapshotName(ctx)).then(function(out){return driveUploadJsonFile(ctx,googleDriveSnapshotName(ctx),data,out.file&&out.file.id);}).then(function(file){var state=cloudState(ctx);state.googleDrive.snapshotFileId=file.id||state.googleDrive.snapshotFileId||'';state.googleDrive.snapshotSaved=true;state.googleDrive.snapshotSavedAt=new Date().toISOString();persistCloudState(ctx);refreshDriveBackupUi(ctx);return true;}).catch(function(err){try{console.warn('Could not upload Drive snapshot',err);}catch(e){}return false;});
}
function downloadDriveSnapshot(ctx){
  var id=cloudState(ctx).googleDrive.snapshotFileId,lookup=id?Promise.resolve({file:{id:id,name:googleDriveSnapshotName(ctx)}}):driveFindFileByName(ctx,googleDriveSnapshotName(ctx));
  return lookup.then(function(out){if(!out||!out.file||!out.file.id){call(ctx,'downloadPreRestoreSnapshot',[]);return null;}return driveDownloadJsonFile(ctx,out.file.id).then(function(data){call(ctx,'downloadTextFile',['worshipbase-drive-pre-restore-snapshot-'+call(ctx,'backupStamp',[],function(){return Date.now();})+'.json',JSON.stringify(data,null,2)]);return data;});}).catch(function(err){try{console.error(err);}catch(e){}return call(ctx,'appAlert',[err&&err.message?err.message:'Could not download Drive snapshot']);});
}
function connectGoogleDriveInteractive(ctx){var svc=backupService(ctx);var p=svc.connectInteractive?svc.connectInteractive(cloudState(ctx).googleDrive,{onStateChanged:function(){backupStateChanged(ctx);}}):requestGoogleDriveToken(ctx,true);return p.then(function(){cloudState(ctx).googleDrive.connected=true;persistCloudState(ctx);refreshDriveBackupUi(ctx);call(ctx,'showToast',['Google Drive connected']);}).catch(function(err){if(err&&err.message)return call(ctx,'appAlert',[err.message]);});}
function disconnectGoogleDriveLocal(ctx){var svc=backupService(ctx);if(svc.disconnectLocal)svc.disconnectLocal(cloudState(ctx).googleDrive,{onStateChanged:function(){backupStateChanged(ctx);}});else{cloudState(ctx).googleDrive={connected:false,email:'',accessToken:'',expiresAt:0,lastBackupAt:'',lastModifiedTime:'',lastRestoreAt:'',fileId:'',snapshotFileId:'',snapshotSaved:false};persistCloudState(ctx);}refreshDriveBackupUi(ctx);call(ctx,'showToast',['Drive disconnected on this device']);}
function googleDriveStatus(ctx){var svc=backupService(ctx);return svc.status?svc.status(cloudState(ctx).googleDrive):{connected:!!cloudState(ctx).googleDrive.connected,hasClientId:!!cloudGoogleClientId(ctx),fileId:cloudState(ctx).googleDrive.fileId||'',lastBackupAt:cloudState(ctx).googleDrive.lastBackupAt||'',lastRestoreAt:cloudState(ctx).googleDrive.lastRestoreAt||'',snapshotSaved:!!cloudState(ctx).googleDrive.snapshotSaved};}
function firebasePrefersRedirect(){var ua=root.navigator&&root.navigator.userAgent||'';var standalone=!!((root.matchMedia&&root.matchMedia('(display-mode: standalone)').matches)||(root.navigator&&root.navigator.standalone));return standalone||/iP(?:hone|ad|od)/i.test(ua);}
function ensureFirebaseSdk(ctx){
  var existing=getPromise(ctx,'firebaseInitPromise');if(existing)return existing;
  var p=ensureFirebaseConfigPrompt(ctx).then(function(cfg){
    if(!cfg)throw new Error('Firebase config is required.');
    var svc=firebaseService(ctx),state=cloudState(ctx);
    return (svc.ensureSdk?svc.ensureSdk({config:cfg,onAuthStateChanged:function(user){state.firebase.connected=!!user;state.firebase.email=user&&user.email||'';state.firebase.uid=user&&user.uid||'';state.firebase.provider=user&&user.providerData&&user.providerData[0]&&user.providerData[0].providerId||'';state.firebase.lastAuthAt=user?new Date().toISOString():state.firebase.lastAuthAt;persistCloudState(ctx);call(ctx,'renderSettings',[]);}}):promiseReject('Firebase service unavailable')).then(function(firebase){
      state.firebase.configured=true;
      if(firebase.auth){return firebase.auth().getRedirectResult().catch(function(){return null;}).then(function(){persistCloudState(ctx);call(ctx,'renderSettings',[]);return firebase;});}
      persistCloudState(ctx);call(ctx,'renderSettings',[]);return firebase;
    });
  });
  setPromise(ctx,'firebaseInitPromise',p);return p;
}
function connectFirebaseAuth(ctx){return ensureFirebaseSdk(ctx).then(function(firebase){if(!firebase.auth)throw new Error('Firebase auth unavailable');var provider=new firebase.auth.GoogleAuthProvider();if(firebasePrefersRedirect()){call(ctx,'showToast',['Opening Google sign-in…']);return firebase.auth().signInWithRedirect(provider);}return firebase.auth().signInWithPopup(provider).then(function(){call(ctx,'showToast',['Firebase auth connected']);}).catch(function(err){var code=(err&&err.code)||'',msg=(err&&err.message)||'';if(/popup|cancelled-popup-request|popup-closed-by-user/i.test(code+' '+msg)){call(ctx,'showToast',['Opening Google sign-in…']);return firebase.auth().signInWithRedirect(provider);}throw err;});}).catch(function(err){if(err&&err.message)return call(ctx,'appAlert',[err.message]);});}
function disconnectFirebaseAuth(ctx){return ensureFirebaseSdk(ctx).then(function(firebase){if(!firebase.auth)return null;return firebase.auth().signOut();}).then(function(){var state=cloudState(ctx);state.firebase.connected=false;state.firebase.email='';state.firebase.uid='';persistCloudState(ctx);call(ctx,'renderSettings',[]);call(ctx,'showToast',['Firebase auth signed out']);}).catch(function(err){if(err&&err.message)return call(ctx,'appAlert',[err.message]);});}
function handleFirebaseSettingsAction(ctx){return cloudState(ctx).firebase.connected?disconnectFirebaseAuth(ctx):connectFirebaseAuth(ctx);}
function firebaseRealtimeDb(ctx){var svc=firebaseService(ctx);return svc.realtimeDb?svc.realtimeDb({config:cloudFirebaseConfig(ctx)}):ensureFirebaseSdk(ctx).then(function(firebase){if(!firebase.database)throw new Error('Cloud database unavailable');return firebase.database();});}
function firebaseFirestore(ctx){var svc=firebaseService(ctx);return svc.firestore?svc.firestore({config:cloudFirebaseConfig(ctx)}):ensureFirebaseSdk(ctx).then(function(firebase){if(!firebase.firestore)throw new Error('Cloud database unavailable');return firebase.firestore();});}
function detachFirebaseRuntime(ctx){try{var s=getFirebaseSongsDetach(ctx);if(typeof s==='function')s();}catch(e){}try{if(ctx&&typeof ctx.detachWorkspaceRuntime==='function')ctx.detachWorkspaceRuntime();else{var w=getFirebaseSharedSetsDetach(ctx);if(typeof w==='function')w();}}catch(e){}setFirebaseSongsDetach(ctx,null);setFirebaseSharedSetsDetach(ctx,null);firebaseRuntime(ctx).songsListening=false;firebaseRuntime(ctx).workspaceListening=false;}
function afterSongsChanged(ctx,message,finishMode){call(ctx,'persistFirebaseSongsCache',[],function(){return persistFirebaseSongsCache(ctx);});call(ctx,'rebuildSongsCache',[]);call(ctx,'renderLibrary',[]);call(ctx,'renderSettings',[]);if(message)call(ctx,'showSync',[message,message.indexOf('Offline')===0]);try{call(ctx,'maybeFinishLaunch',[finishMode]);}catch(e){} }
function loadFirebaseSongsRuntime(ctx){
  ctx=ctx||{};var paths=cloudFirestorePaths(ctx),runtime=firebaseRuntime(ctx),svc=firebaseService(ctx);
  if(runtime.songsListening&&typeof getFirebaseSongsDetach(ctx)==='function')return Promise.resolve(getFirebaseSongs(ctx));
  return new Promise(function(resolve,reject){
    var settled=false;
    var ok=function(snap){
      var data=snap&&typeof snap.val==='function'?snap.val():null;
      var list=firebaseSongRecordsFromSnapshot(data).map(function(song){return normalizeFirebaseSong(ctx,song,song&&song.id);}).filter(function(song){return song&&song.title&&(song.chart||song.lyrics||song.content);});
      setFirebaseSongs(ctx,list);runtime.songsListening=true;runtime.songsLoaded=true;runtime.songsSettled=true;runtime.songsFailed=false;runtime.lastSongsSyncAt=new Date().toISOString();
      afterSongsChanged(ctx,list.length?'Library synced':'',''+(list.length?'cache':'remote'));
      if(!settled){settled=true;resolve(getFirebaseSongs(ctx));}
    };
    var fail=function(err){
      runtime.songsListening=false;runtime.songsFailed=true;runtime.songsSettled=true;
      if(getFirebaseSongs(ctx).length){afterSongsChanged(ctx,'Offline — using cache','cache');if(!settled){settled=true;resolve(getFirebaseSongs(ctx));}return;}
      setFirebaseSongs(ctx,[]);afterSongsChanged(ctx,'','empty');if(!settled){settled=true;reject(err||new Error('Could not load Firebase songs'));}
    };
    if(!svc.listenRealtimeValue){fail(new Error('Firebase service unavailable'));return;}
    svc.listenRealtimeValue(paths.songsPath||'songs',ok,fail,{config:cloudFirebaseConfig(ctx)}).then(function(detach){setFirebaseSongsDetach(ctx,function(){runtime.songsListening=false;try{detach&&detach();}catch(e){}});}).catch(fail);
  }).catch(function(err){
    runtime.songsFailed=true;runtime.songsSettled=true;
    if(getFirebaseSongs(ctx).length){afterSongsChanged(ctx,'Offline — using cache','cache');return getFirebaseSongs(ctx);}
    setFirebaseSongs(ctx,[]);call(ctx,'rebuildSongsCache',[]);call(ctx,'renderLibrary',[]);call(ctx,'renderSettings',[]);call(ctx,'showSync',['Sync error',true]);try{call(ctx,'maybeFinishLaunch',['empty']);}catch(e){}return [];
  });
}
function connectFirebaseRuntimeIfConfigured(ctx){
  ensureOfflineFirstRuntime(ctx);
  var cfg=cloudFirebaseConfig(ctx);if(!cfg)return Promise.resolve(null);
  var existing=getPromise(ctx,'firebaseConnectPromise');if(existing)return existing;
  var p=ensureFirebaseSdk(ctx).then(function(){return Promise.all([loadFirebaseSongsRuntime(ctx),call(ctx,'loadFirebaseWorkspaceRuntime',[],function(){return Promise.resolve([]);})]);}).catch(function(err){try{console.warn('Firebase runtime connect failed',err);}catch(e){}return null;});
  setPromise(ctx,'firebaseConnectPromise',p);return p;
}
function cloudRuntimeContract(){return {owner:'WBCloudRuntimeController',phase:'Phase 2b - K3',cloudState:['persistCloudState','loadCloudState','cloudGoogleClientId','cloudFirebaseConfig','cloudFirestorePaths'],drive:['backupStateChanged','ensureGoogleIdentity','requestGoogleDriveToken','uploadLatestBackupToDrive','beginRestoreFromDrive','uploadLocalSnapshotToDrive','downloadDriveSnapshot','connectGoogleDriveInteractive','disconnectGoogleDriveLocal','googleDriveStatus'],firebase:['ensureFirebaseConfigPrompt','ensureFirebaseSdk','connectFirebaseAuth','disconnectFirebaseAuth','firebaseRealtimeDb','firebaseFirestore','loadFirebaseSongsRuntime','connectFirebaseRuntimeIfConfigured','detachFirebaseRuntime'],offline:['canUseOfflineCaches','warmOfflineCaches','registerOfflineServiceWorker','scheduleFirebaseReconnect','installConnectivityWatchers','ensureOfflineFirstRuntime'],guarantee:'Cloud, Firebase, Drive, and offline runtime orchestration lives behind one source service owner while the legacy shell remains only a host adapter.'};}
function diagnostics(ctx){var state=cloudState(ctx),runtime=firebaseRuntime(ctx);return {owner:'WBCloudRuntimeController',phase:'Phase 2b - K3',firebaseConfigured:!!state.firebase.configured,firebaseConnected:!!state.firebase.connected,driveConnected:!!state.googleDrive.connected,songsListening:!!runtime.songsListening,workspaceListening:!!runtime.workspaceListening,lastSongsSyncAt:runtime.lastSongsSyncAt||'',lastWorkspaceSyncAt:runtime.lastWorkspaceSyncAt||'',cloudRuntimeContract:cloudRuntimeContract()};}

root.WBCloudRuntimeController={
  persistCloudState:persistCloudState,
  loadCloudState:loadCloudState,
  cloudGoogleClientId:cloudGoogleClientId,
  ensureGoogleClientId:ensureGoogleClientId,
  cloudFirebaseConfig:cloudFirebaseConfig,
  ensureFirebaseConfigPrompt:ensureFirebaseConfigPrompt,
  cloudFirestorePaths:cloudFirestorePaths,
  normalizeFirebaseSongShape:normalizeFirebaseSongShape,
  firebaseSongRecordsFromSnapshot:firebaseSongRecordsFromSnapshot,
  normalizeFirebaseSong:normalizeFirebaseSong,
  loadCachedFirebaseSongs:loadCachedFirebaseSongs,
  persistFirebaseSongsCache:persistFirebaseSongsCache,
  canUseOfflineCaches:canUseOfflineCaches,
  sameOriginAsset:sameOriginAsset,
  warmOfflineCaches:warmOfflineCaches,
  registerOfflineServiceWorker:registerOfflineServiceWorker,
  installServiceWorkerControllerReload:installServiceWorkerControllerReload,
  scheduleFirebaseReconnect:scheduleFirebaseReconnect,
  updateOfflineIndicator:updateOfflineIndicator,
  installConnectivityWatchers:installConnectivityWatchers,
  ensureOfflineFirstRuntime:ensureOfflineFirstRuntime,
  backupStateChanged:backupStateChanged,
  ensureGoogleIdentity:ensureGoogleIdentity,
  googleDriveTokenValid:googleDriveTokenValid,
  requestGoogleDriveToken:requestGoogleDriveToken,
  driveFindFileByName:driveFindFileByName,
  driveUploadJsonFile:driveUploadJsonFile,
  driveDownloadJsonFile:driveDownloadJsonFile,
  refreshDriveBackupUi:refreshDriveBackupUi,
  uploadLatestBackupToDrive:uploadLatestBackupToDrive,
  beginRestoreFromDrive:beginRestoreFromDrive,
  uploadLocalSnapshotToDrive:uploadLocalSnapshotToDrive,
  downloadDriveSnapshot:downloadDriveSnapshot,
  connectGoogleDriveInteractive:connectGoogleDriveInteractive,
  disconnectGoogleDriveLocal:disconnectGoogleDriveLocal,
  googleDriveStatus:googleDriveStatus,
  firebasePrefersRedirect:firebasePrefersRedirect,
  ensureFirebaseSdk:ensureFirebaseSdk,
  connectFirebaseAuth:connectFirebaseAuth,
  disconnectFirebaseAuth:disconnectFirebaseAuth,
  handleFirebaseSettingsAction:handleFirebaseSettingsAction,
  firebaseRealtimeDb:firebaseRealtimeDb,
  firebaseFirestore:firebaseFirestore,
  detachFirebaseRuntime:detachFirebaseRuntime,
  loadFirebaseSongsRuntime:loadFirebaseSongsRuntime,
  connectFirebaseRuntimeIfConfigured:connectFirebaseRuntimeIfConfigured,
  cloudRuntimeContract:cloudRuntimeContract,
  diagnostics:diagnostics
};
})(window);
