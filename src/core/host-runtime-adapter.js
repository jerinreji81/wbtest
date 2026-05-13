/* WorshipBase Phase 2b - L7 source-owned host runtime adapter.
   Extracted from the active source host so src/host/index.phase-2b.html stays a static host.
   This preserves the existing app runtime while moving ownership out of inline host HTML. */
(function(){
'use strict';
var WBConstants=window.WBConstants||{};
var WBUtils=window.WBUtils||{};
var WBDom=window.WBDom||{};
var PersonalSetController=window.WBPersonalSetController||{};
var WorkspaceSetController=window.WBWorkspaceSetController||{};
var SettingsController=window.WBSettingsController||{};
var WBDialogController=window.WBDialogController||{};
var WBAdminController=window.WBAdminController||{};
var MainShellController=window.WBMainShellController||{};
var LegacyRuntimeAdapterController=window.WBLegacyRuntimeAdapterController||{};
function mainShellCtx(){return {document:document,WBConstants:WBConstants,WBDialogController:WBDialogController,WBAppShellController:window.WBAppShellController,StartupLifecycle:StartupLifecycle,STORAGE_KEYS:STORAGE_KEYS,state:state,workspaceState:workspaceState,bibleState:(typeof bibleState==='undefined'?null:bibleState),settings:settings,assetConfig:ASSET_CONFIG,qs:qs,readStoredObject:readStoredObject,writeStoredJson:writeStoredJson}}
function appAlert(message,opts){return MainShellController.appAlert?MainShellController.appAlert(mainShellCtx(),message,opts):Promise.resolve(true)}
function appConfirm(message,opts){return MainShellController.appConfirm?MainShellController.appConfirm(mainShellCtx(),message,opts):Promise.resolve(false)}
function appPrompt(title,value,opts){return MainShellController.appPrompt?MainShellController.appPrompt(mainShellCtx(),title,value,opts):Promise.resolve(null)}
var VERSION=WBConstants.VERSION||'Phase 2b - G3';
var REBUILD_PHASE=WBConstants.REBUILD_PHASE||'Phase 2b - G3: Tools concrete render extraction';
var REBUILD_REFERENCE=WBConstants.REBUILD_REFERENCE||'Working-v85.0-fixed.html';

var ASSET_CONFIG=MainShellController.assetConfig?MainShellController.assetConfig(WBConstants,window.WB_ASSETS):Object.assign({},WBConstants.ASSET_DEFAULTS||{},(window.WB_ASSETS&&typeof window.WB_ASSETS==='object')?window.WB_ASSETS:{});

function applyBrandAssets(){return MainShellController.applyBrandAssets?MainShellController.applyBrandAssets(mainShellCtx()):false}
var routes=

{songs:'song-section',setlist:'setlist-section',workspace:'workspace-section',tools:'tools-section',settings:'settings-section'};
var state={tab:'songs',filter:'all',query:'',scope:'smart',mode:'chords',selectedId:null,chordHighlight:false,displayKey:null,lastSongOrigin:'library',focusMode:false,setlistEditorId:null,setSongPickerFilter:'all',setSongPickerTarget:'personal',setOptionsContext:'personal',setDestinationScope:'personal',exportWorkspaceSetId:null,toolsPanel:'home',songContext:null,songViewMemory:{},routeMemoryLoaded:false};
var localSongs=[];
var firebaseSongs=[];
var songs=[];
var personalSets=[];
var activeSetId='';
var songMemory={};
var SEED_SONGS=[];
var SEED_PERSONAL_SETS=[];
var STORAGE_KEYS=WBConstants.STORAGE_KEYS||{};
var DEFAULT_SETTINGS=WBConstants.DEFAULT_SETTINGS||{};
var NOTES=WBConstants.NOTES||['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
var NOTES_SHARP=WBConstants.NOTES_SHARP||NOTES;
var NOTES_FLAT=WBConstants.NOTES_FLAT||['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
var minorKeyName=WBUtils.minorKeyName;
var isMinorKey=WBUtils.isMinorKey;
var keyRootName=WBUtils.keyRootName;
var normalizeKeyName=WBUtils.normalizeKeyName;
var keyOptionList=WBUtils.keyOptionList;
var isValidMusicKey=WBUtils.isValidMusicKey;
var labelKey=WBUtils.labelKey;
var SETTINGS_CHOICES=WBConstants.SETTINGS_CHOICES||{};
var settings=Object.assign({},DEFAULT_SETTINGS);
var THEME_PALETTE=WBConstants.THEME_PALETTE||{};
var recentIds=['s138'];
var StorageService=window.WBStorage||{};
var FirebaseService=window.WBFirebaseService||{};
var CloudRuntimeController=window.WBCloudRuntimeController||{};
var WorkspaceCloudController=window.WBWorkspaceCloudController||{};
var BackupService=window.WBBackupService||{};
var BackupRestoreController=window.WBBackupRestoreController||{};
var StartupLifecycle=window.WBStartupLifecycle||{};
var safeGet=StorageService.safeGet;
var safeSet=StorageService.safeSet;
var safeRemove=StorageService.safeRemove;
var readStoredJson=StorageService.readJson;
var writeStoredJson=StorageService.writeJson;
var readStoredArray=StorageService.readArray;
var readStoredObject=StorageService.readObject;
var removeStoredMany=StorageService.removeMany;
var preserveSetArray=StorageService.preserveSetArray;

var cloudState={googleDrive:{connected:false,email:'',accessToken:'',expiresAt:0,lastBackupAt:'',fileId:'',snapshotFileId:'',snapshotSaved:false},firebase:{connected:false,email:'',uid:'',provider:'',lastAuthAt:'',configured:false}};
var firebaseInitPromise=null,googleScriptPromise=null,firebaseConnectPromise=null;
var firebaseSongsDetach=null,firebaseSharedSetsDetach=null;
var firebaseRuntime={songsListening:false,workspaceListening:false,songsLoaded:false,workspaceLoaded:false,songsSettled:false,songsFailed:false,lastSongsSyncAt:'',lastWorkspaceSyncAt:''};
function cloudRuntimeCtx(){return {
  STORAGE_KEYS:STORAGE_KEYS,VERSION:VERSION,WBConstants:WBConstants,StorageService:StorageService,FirebaseService:FirebaseService,BackupService:BackupService,StartupLifecycle:StartupLifecycle,cloudState:cloudState,firebaseRuntime:firebaseRuntime,
  readStoredJson:readStoredJson,writeStoredJson:writeStoredJson,readStoredArray:readStoredArray,readStoredObject:readStoredObject,safeGet:safeGet,safeSet:safeSet,safeRemove:safeRemove,
  appPrompt:appPrompt,appAlert:appAlert,showToast:showToast,showSync:showSync,renderSettings:renderSettings,openBackupCentre:openBackupCentre,qs:qs,wbLoadScript:wbLoadScript,
  buildLocalBackupPayload:buildLocalBackupPayload,backupPayloadSummary:backupPayloadSummary,recordBackupHistory:recordBackupHistory,renderBackupLoadingState:renderBackupLoadingState,openBackupRestoreReview:openBackupRestoreReview,downloadPreRestoreSnapshot:downloadPreRestoreSnapshot,downloadTextFile:downloadTextFile,backupStamp:backupStamp,
  normalizeImportedSong:normalizeImportedSong,rebuildSongsCache:rebuildSongsCache,renderLibrary:renderLibrary,maybeFinishLaunch:maybeFinishLaunch,
  loadFirebaseWorkspaceRuntime:function(){return WorkspaceCloudController&&WorkspaceCloudController.loadFirebaseWorkspaceRuntime?WorkspaceCloudController.loadFirebaseWorkspaceRuntime(workspaceCloudCtx()):Promise.resolve(workspaceState.sets)},
  detachWorkspaceRuntime:function(){return WorkspaceCloudController&&WorkspaceCloudController.detachWorkspaceRuntime?WorkspaceCloudController.detachWorkspaceRuntime(workspaceCloudCtx()):null},
  getFirebaseInitPromise:function(){return firebaseInitPromise},setFirebaseInitPromise:function(v){firebaseInitPromise=v},getGoogleScriptPromise:function(){return googleScriptPromise},setGoogleScriptPromise:function(v){googleScriptPromise=v},getFirebaseConnectPromise:function(){return firebaseConnectPromise},setFirebaseConnectPromise:function(v){firebaseConnectPromise=v},
  getFirebaseSongsDetach:function(){return firebaseSongsDetach},setFirebaseSongsDetach:function(fn){firebaseSongsDetach=fn},getFirebaseSharedSetsDetach:function(){return firebaseSharedSetsDetach},setFirebaseSharedSetsDetach:function(fn){firebaseSharedSetsDetach=fn},
  getFirebaseSongs:function(){return firebaseSongs},setFirebaseSongs:function(v){firebaseSongs=v||[]}
}}
function persistCloudState(){return CloudRuntimeController.persistCloudState?CloudRuntimeController.persistCloudState(cloudRuntimeCtx()):writeStoredJson(STORAGE_KEYS.cloud,cloudState)}
function loadCloudState(){return CloudRuntimeController.loadCloudState?CloudRuntimeController.loadCloudState(cloudRuntimeCtx()):cloudState}
function wbMonogramSvg(){return MainShellController.wbMonogramSvg?MainShellController.wbMonogramSvg():''}
function aboutBrandMarkHtml(){return MainShellController.aboutBrandMarkHtml?MainShellController.aboutBrandMarkHtml(mainShellCtx()):wbMonogramSvg()}
var GOOGLE_DRIVE_CONFIG=BackupService.config?BackupService.config():(WBConstants.GOOGLE_DRIVE||{});
var GOOGLE_DRIVE_CLIENT_ID=GOOGLE_DRIVE_CONFIG.clientId||'137901259240-jkkun2kjr4a3bnfrqmbu1jk9ieqvn5jh.apps.googleusercontent.com';
var GOOGLE_DRIVE_SCOPE=GOOGLE_DRIVE_CONFIG.scope||'https://www.googleapis.com/auth/drive.appdata';
var GOOGLE_DRIVE_BACKUP_NAME=BackupService.backupName?BackupService.backupName():(GOOGLE_DRIVE_CONFIG.backupName||'worshipbase-personal-backup.json');
var GOOGLE_DRIVE_SNAPSHOT_NAME=BackupService.snapshotName?BackupService.snapshotName():(GOOGLE_DRIVE_CONFIG.snapshotName||'worshipbase-pre-restore-snapshot.json');
var GOOGLE_DRIVE_LEGACY_STATE_KEY=BackupService.legacyStateKey?BackupService.legacyStateKey():(GOOGLE_DRIVE_CONFIG.legacyStateKey||'wb_google_drive_backup_v1');
function cloudGoogleClientId(){return CloudRuntimeController.cloudGoogleClientId?CloudRuntimeController.cloudGoogleClientId(cloudRuntimeCtx()):(BackupService.cloudClientId?BackupService.cloudClientId():((window.WB_CLOUD_CONFIG&&window.WB_CLOUD_CONFIG.googleClientId)||safeGet('wb_google_client_id')||GOOGLE_DRIVE_CLIENT_ID))}
function ensureGoogleClientId(){return CloudRuntimeController.ensureGoogleClientId?CloudRuntimeController.ensureGoogleClientId(cloudRuntimeCtx()):(BackupService.ensureClientId?BackupService.ensureClientId():(cloudGoogleClientId()||GOOGLE_DRIVE_CLIENT_ID))}
function cloudFirebaseConfig(){return CloudRuntimeController.cloudFirebaseConfig?CloudRuntimeController.cloudFirebaseConfig(cloudRuntimeCtx()):(FirebaseService.config?FirebaseService.config():(readStoredJson('wb_firebase_config',null)||null))}
function ensureFirebaseConfigPrompt(){return CloudRuntimeController.ensureFirebaseConfigPrompt?CloudRuntimeController.ensureFirebaseConfigPrompt(cloudRuntimeCtx()):Promise.resolve(cloudFirebaseConfig())}
function cloudFirestorePaths(){return CloudRuntimeController.cloudFirestorePaths?CloudRuntimeController.cloudFirestorePaths(cloudRuntimeCtx()):(FirebaseService.paths?FirebaseService.paths():{songsPath:'songs',sharedSetsPath:'setlists',workspaceSetsCollection:'workspaceSets',workspaceProfileCollection:'workspaceMeta',workspaceProfileDocId:'default',bibleCollection:'bibleChapters'})}

function loadCachedFirebaseSongs(){return CloudRuntimeController.loadCachedFirebaseSongs?CloudRuntimeController.loadCachedFirebaseSongs(cloudRuntimeCtx()):(function(){var parsed=readStoredArray(STORAGE_KEYS.firebaseSongsCache,[]);if(parsed.length)firebaseSongs=parsed.map(function(s){return normalizeFirebaseSong(s,s&&s.id)})})()}
function normalizeFirebaseSongShape(raw,id){return CloudRuntimeController.normalizeFirebaseSongShape?CloudRuntimeController.normalizeFirebaseSongShape(raw,id):Object.assign({},raw||{},{id:String(id||raw&&raw.id||'').trim()})}
function firebaseSongRecordsFromSnapshot(data){return CloudRuntimeController.firebaseSongRecordsFromSnapshot?CloudRuntimeController.firebaseSongRecordsFromSnapshot(data):[]}
function workspaceSetRecordsFromSnapshot(data){return WorkspaceCloudController&&WorkspaceCloudController.recordsFromSnapshot?WorkspaceCloudController.recordsFromSnapshot(workspaceCloudCtx(),data):(WorkspaceSetController&&WorkspaceSetController.recordsFromSnapshot?WorkspaceSetController.recordsFromSnapshot(data):(function(){if(!data)return [];var out=[];if(Array.isArray(data)){data.forEach(function(v,idx){if(v&&typeof v==='object')out.push(normalizeWorkspaceSet(v,v.id||String(idx)))});return out}if(typeof data==='object'){Object.keys(data).forEach(function(key){var val=data[key];if(val&&typeof val==='object')out.push(normalizeWorkspaceSet(val,key))})}return out})())}
function canUseOfflineCaches(){return CloudRuntimeController.canUseOfflineCaches?CloudRuntimeController.canUseOfflineCaches(cloudRuntimeCtx()):(StartupLifecycle&&StartupLifecycle.canUseOfflineCaches?StartupLifecycle.canUseOfflineCaches():!!(window.isSecureContext&&'caches' in window))}
function sameOriginAsset(url){return CloudRuntimeController.sameOriginAsset?CloudRuntimeController.sameOriginAsset(cloudRuntimeCtx(),url):(StartupLifecycle&&StartupLifecycle.sameOriginAsset?StartupLifecycle.sameOriginAsset(url):(function(){try{var u=new URL(url,location.href);return u.origin===location.origin?u.href:''}catch(e){return ''}})())}
function warmOfflineCaches(){return CloudRuntimeController.warmOfflineCaches?CloudRuntimeController.warmOfflineCaches(cloudRuntimeCtx()):Promise.resolve(false)}
function registerOfflineServiceWorker(){return CloudRuntimeController.registerOfflineServiceWorker?CloudRuntimeController.registerOfflineServiceWorker(cloudRuntimeCtx()):Promise.resolve(false)}
try{if(CloudRuntimeController&&CloudRuntimeController.installServiceWorkerControllerReload)CloudRuntimeController.installServiceWorkerControllerReload(cloudRuntimeCtx());else if(StartupLifecycle&&StartupLifecycle.installServiceWorkerControllerReload)StartupLifecycle.installServiceWorkerControllerReload({delayMs:250})}catch(e){}
function scheduleFirebaseReconnect(){return CloudRuntimeController.scheduleFirebaseReconnect?CloudRuntimeController.scheduleFirebaseReconnect(cloudRuntimeCtx()):null}
function updateOfflineIndicator(fromEvent){return CloudRuntimeController.updateOfflineIndicator?CloudRuntimeController.updateOfflineIndicator(cloudRuntimeCtx(),fromEvent):null}
function installConnectivityWatchers(){return CloudRuntimeController.installConnectivityWatchers?CloudRuntimeController.installConnectivityWatchers(cloudRuntimeCtx()):null}
function ensureOfflineFirstRuntime(){return CloudRuntimeController.ensureOfflineFirstRuntime?CloudRuntimeController.ensureOfflineFirstRuntime(cloudRuntimeCtx()):null}
function persistFirebaseSongsCache(){return CloudRuntimeController.persistFirebaseSongsCache?CloudRuntimeController.persistFirebaseSongsCache(cloudRuntimeCtx()):writeStoredJson(STORAGE_KEYS.firebaseSongsCache,(firebaseSongs||[]).map(function(s){return Object.assign({},s)}))}
function saveBibleCache(){writeStoredJson(STORAGE_KEYS.bibleCache,{version:bibleState&&bibleState.version||'esv',index:bibleRuntime&&bibleRuntime.index||null,books:bibleRuntime&&bibleRuntime.books||[],chapterCache:bibleRuntime&&bibleRuntime.chapterCache?bibleRuntime.chapterCache:{}})}
function loadBibleCache(){var parsed=readStoredObject(STORAGE_KEYS.bibleCache,{});if(parsed&&typeof parsed==='object'){if(parsed.index)bibleRuntime.index=parsed.index;if(Array.isArray(parsed.books))bibleRuntime.books=parsed.books;if(parsed.chapterCache&&typeof parsed.chapterCache==='object')bibleRuntime.chapterCache=parsed.chapterCache;}}
function songMeta(id){if(!id)return {};if(!songMemory[id]||typeof songMemory[id]!=='object')songMemory[id]={};return songMemory[id]}
function persistSongMemory(){writeStoredJson(STORAGE_KEYS.songMemory,songMemory||{})}
function setSongFavorite(songId,on){if(!songId)return;var meta=songMeta(songId);meta.favorite=!!on;songMemory[songId]=meta;var found=(songs||[]).find(function(x){return x.id===songId});if(found)found.favorite=!!on;persistSongMemory();renderLibrary();var active=activeSong();if(active&&active.id===songId){var fav=qs('sv-fav-btn');if(fav){fav.classList.toggle('on',!!on);fav.innerHTML=heartIcon(!!on);}}}
function mergeSongSources(remote,local){var out=[];(remote||[]).forEach(function(song){if(song&&song.id)out.push(song)});(local||[]).forEach(function(song){if(!song||!song.id)return;var idx=out.findIndex(function(x){return x.id===song.id});if(idx>=0)out[idx]=Object.assign({},out[idx],song,{source:'local'});else out.push(song)});out.sort(function(a,b){return String(a.title||'').localeCompare(String(b.title||''))});return out}
function applySongMemoryToSongs(){(songs||[]).forEach(function(song){var meta=songMemory&&songMemory[song.id]||{};song.favorite=!!meta.favorite;});}
function rebuildSongsCache(){songs=mergeSongSources(firebaseSongs,localSongs);applySongMemoryToSongs();return songs}
function wbLoadScript(src){return new Promise(function(resolve,reject){var existing=document.querySelector('script[data-ext-src="'+src+'"]');if(existing){if(existing.dataset.loaded==='1'){resolve();return}existing.addEventListener('load',function(){resolve()},{once:true});existing.addEventListener('error',function(){reject(new Error('Could not load '+src))},{once:true});return}var s=document.createElement('script');s.src=src;s.async=true;s.dataset.extSrc=src;s.onload=function(){s.dataset.loaded='1';resolve()};s.onerror=function(){reject(new Error('Could not load '+src))};document.head.appendChild(s)})}
function backupStateChanged(){return CloudRuntimeController.backupStateChanged?CloudRuntimeController.backupStateChanged(cloudRuntimeCtx()):(persistCloudState(),renderSettings())}
function ensureGoogleIdentity(){return CloudRuntimeController.ensureGoogleIdentity?CloudRuntimeController.ensureGoogleIdentity(cloudRuntimeCtx()):(BackupService.ensureGoogleIdentity?BackupService.ensureGoogleIdentity():Promise.resolve())}
function googleDriveTokenValid(){return CloudRuntimeController.googleDriveTokenValid?CloudRuntimeController.googleDriveTokenValid(cloudRuntimeCtx()):(BackupService.tokenValid?BackupService.tokenValid(cloudState.googleDrive):!!(cloudState.googleDrive.accessToken&&cloudState.googleDrive.expiresAt&&cloudState.googleDrive.expiresAt>Date.now()+20000))}
function requestGoogleDriveToken(interactive){return CloudRuntimeController.requestGoogleDriveToken?CloudRuntimeController.requestGoogleDriveToken(cloudRuntimeCtx(),interactive):(BackupService.requestToken?BackupService.requestToken(cloudState.googleDrive,{interactive:!!interactive,onStateChanged:backupStateChanged}):Promise.reject(new Error('Backup service unavailable')))}
function driveFindFileByName(name){return CloudRuntimeController.driveFindFileByName?CloudRuntimeController.driveFindFileByName(cloudRuntimeCtx(),name):(BackupService.findFileByName?BackupService.findFileByName(name||GOOGLE_DRIVE_BACKUP_NAME,cloudState.googleDrive,{onStateChanged:backupStateChanged}):Promise.reject(new Error('Backup service unavailable')))}
function driveUploadJsonFile(name,payload,fileId){return CloudRuntimeController.driveUploadJsonFile?CloudRuntimeController.driveUploadJsonFile(cloudRuntimeCtx(),name,payload,fileId):(BackupService.uploadJsonFile?BackupService.uploadJsonFile(name,payload,fileId,cloudState.googleDrive,{onStateChanged:backupStateChanged}):Promise.reject(new Error('Backup service unavailable')))}
function driveDownloadJsonFile(fileId){return CloudRuntimeController.driveDownloadJsonFile?CloudRuntimeController.driveDownloadJsonFile(cloudRuntimeCtx(),fileId):(BackupService.downloadJsonFile?BackupService.downloadJsonFile(fileId,cloudState.googleDrive,{onStateChanged:backupStateChanged}):Promise.reject(new Error('Backup service unavailable')))}
function refreshDriveBackupUi(){return CloudRuntimeController.refreshDriveBackupUi?CloudRuntimeController.refreshDriveBackupUi(cloudRuntimeCtx()):(renderSettings(),qs('backup-centre-modal')&&qs('backup-centre-modal').classList.contains('open')?openBackupCentre():null)}
function uploadLatestBackupToDrive(){return CloudRuntimeController.uploadLatestBackupToDrive?CloudRuntimeController.uploadLatestBackupToDrive(cloudRuntimeCtx()):Promise.reject(new Error('Cloud runtime unavailable'))}
function beginRestoreFromDrive(){return CloudRuntimeController.beginRestoreFromDrive?CloudRuntimeController.beginRestoreFromDrive(cloudRuntimeCtx()):Promise.reject(new Error('Cloud runtime unavailable'))}
function uploadLocalSnapshotToDrive(){return CloudRuntimeController.uploadLocalSnapshotToDrive?CloudRuntimeController.uploadLocalSnapshotToDrive(cloudRuntimeCtx()):Promise.resolve(false)}
function downloadDriveSnapshot(){return CloudRuntimeController.downloadDriveSnapshot?CloudRuntimeController.downloadDriveSnapshot(cloudRuntimeCtx()):Promise.resolve(null)}
function connectGoogleDriveInteractive(){return CloudRuntimeController.connectGoogleDriveInteractive?CloudRuntimeController.connectGoogleDriveInteractive(cloudRuntimeCtx()):requestGoogleDriveToken(true)}
function disconnectGoogleDriveLocal(){return CloudRuntimeController.disconnectGoogleDriveLocal?CloudRuntimeController.disconnectGoogleDriveLocal(cloudRuntimeCtx()):null}
window.connectGoogleDriveBackup=connectGoogleDriveInteractive;
window.backupToGoogleDrive=uploadLatestBackupToDrive;
window.restoreFromGoogleDrive=beginRestoreFromDrive;
window.disconnectGoogleDriveBackup=disconnectGoogleDriveLocal;
window.WBGoogleDriveStatus=function(){return CloudRuntimeController.googleDriveStatus?CloudRuntimeController.googleDriveStatus(cloudRuntimeCtx()):(BackupService.status?BackupService.status(cloudState.googleDrive):{connected:!!cloudState.googleDrive.connected,hasClientId:!!cloudGoogleClientId(),fileId:cloudState.googleDrive.fileId||'',lastBackupAt:cloudState.googleDrive.lastBackupAt||'',lastRestoreAt:cloudState.googleDrive.lastRestoreAt||'',snapshotSaved:!!cloudState.googleDrive.snapshotSaved})};

function firebasePrefersRedirect(){return CloudRuntimeController.firebasePrefersRedirect?CloudRuntimeController.firebasePrefersRedirect():/iP(?:hone|ad|od)/i.test(navigator.userAgent||'')}
function ensureFirebaseSdk(){return CloudRuntimeController.ensureFirebaseSdk?CloudRuntimeController.ensureFirebaseSdk(cloudRuntimeCtx()):Promise.reject(new Error('Firebase runtime unavailable'))}
function connectFirebaseAuth(){return CloudRuntimeController.connectFirebaseAuth?CloudRuntimeController.connectFirebaseAuth(cloudRuntimeCtx()):Promise.reject(new Error('Firebase runtime unavailable'))}
function disconnectFirebaseAuth(){return CloudRuntimeController.disconnectFirebaseAuth?CloudRuntimeController.disconnectFirebaseAuth(cloudRuntimeCtx()):Promise.reject(new Error('Firebase runtime unavailable'))}
function handleFirebaseSettingsAction(){return CloudRuntimeController.handleFirebaseSettingsAction?CloudRuntimeController.handleFirebaseSettingsAction(cloudRuntimeCtx()):(cloudState.firebase.connected?disconnectFirebaseAuth():connectFirebaseAuth())}
function firebaseRealtimeDb(){return CloudRuntimeController.firebaseRealtimeDb?CloudRuntimeController.firebaseRealtimeDb(cloudRuntimeCtx()):(FirebaseService.realtimeDb?FirebaseService.realtimeDb({config:cloudFirebaseConfig()}):Promise.reject(new Error('Cloud database unavailable')))}
function firebaseFirestore(){return CloudRuntimeController.firebaseFirestore?CloudRuntimeController.firebaseFirestore(cloudRuntimeCtx()):(FirebaseService.firestore?FirebaseService.firestore({config:cloudFirebaseConfig()}):Promise.reject(new Error('Cloud database unavailable')))}
function normalizeFirebaseSong(raw,id){return CloudRuntimeController.normalizeFirebaseSong?CloudRuntimeController.normalizeFirebaseSong(cloudRuntimeCtx(),raw,id):(function(){var n=normalizeImportedSong(Object.assign({},raw||{},{id:id||raw&&raw.id||'',importSource:'firebase'}),'firebase');n.id=String(id||raw&&raw.id||n.id||'').trim();n.source='firebase';return n})()}
function normalizeWorkspaceSet(raw,id){return WorkspaceSetController&&WorkspaceSetController.normalizeSet?WorkspaceSetController.normalizeSet(raw,id):(function(){var set=ensureSetShape(Object.assign({id:id||String(Date.now())},raw||{}));set.source='Workspace';return set})()}
function detachFirebaseRuntime(){return CloudRuntimeController.detachFirebaseRuntime?CloudRuntimeController.detachFirebaseRuntime(cloudRuntimeCtx()):(firebaseSongsDetach=null,firebaseSharedSetsDetach=null)}
function loadFirebaseSongsRuntime(){return CloudRuntimeController.loadFirebaseSongsRuntime?CloudRuntimeController.loadFirebaseSongsRuntime(cloudRuntimeCtx()):Promise.resolve(firebaseSongs)}

function workspaceCloudCtx(){return {state:state,workspaceState:workspaceState,firebaseRuntime:firebaseRuntime,FirebaseService:FirebaseService,WorkspaceSetController:WorkspaceSetController,cloudFirebaseConfig:cloudFirebaseConfig,cloudFirestorePaths:cloudFirestorePaths,firebaseRealtimeDb:firebaseRealtimeDb,firebaseFirestore:firebaseFirestore,persistWorkspace:persistWorkspace,renderWorkspaceSetLists:renderWorkspaceSetLists,renderWorkspaceSetDetail:renderWorkspaceSetDetail,renderSettings:renderSettings,showSync:showSync,normalizeWorkspaceSet:normalizeWorkspaceSet,getFirebaseSharedSetsDetach:function(){return firebaseSharedSetsDetach},setFirebaseSharedSetsDetach:function(fn){firebaseSharedSetsDetach=fn}}}
function loadFirebaseWorkspaceRuntime(){return WorkspaceCloudController&&WorkspaceCloudController.loadFirebaseWorkspaceRuntime?WorkspaceCloudController.loadFirebaseWorkspaceRuntime(workspaceCloudCtx()):Promise.resolve(workspaceState.sets)}
function connectFirebaseRuntimeIfConfigured(){return CloudRuntimeController.connectFirebaseRuntimeIfConfigured?CloudRuntimeController.connectFirebaseRuntimeIfConfigured(cloudRuntimeCtx()):(ensureOfflineFirstRuntime(),Promise.resolve(null))}
function syncWorkspaceSetToFirebase(set){return WorkspaceCloudController&&WorkspaceCloudController.syncWorkspaceSetToFirebase?WorkspaceCloudController.syncWorkspaceSetToFirebase(workspaceCloudCtx(),set):Promise.resolve()}
function syncWorkspaceProfileToFirebase(profile){return WorkspaceCloudController&&WorkspaceCloudController.syncWorkspaceProfileToFirebase?WorkspaceCloudController.syncWorkspaceProfileToFirebase(workspaceCloudCtx(),profile):Promise.resolve()}
function cloneSettings(base){return SettingsController.cloneSettings?SettingsController.cloneSettings(base,DEFAULT_SETTINGS,THEME_PALETTE):(function(){var s=Object.assign({},DEFAULT_SETTINGS,base||{});['theme','themeLight','themeDark'].forEach(function(k){if(!THEME_PALETTE[s[k]])s[k]=DEFAULT_SETTINGS[k]||'darkteal'});if(s.addToSetBehavior&&s.addToSetBehavior!=='ask')s.addToSetBehavior='ask';return s})()}
function activeThemeKey(){return SettingsController.activeThemeKey?SettingsController.activeThemeKey(settings,DEFAULT_SETTINGS,THEME_PALETTE):(settings.darkMode?(settings.themeDark||settings.theme||'darkteal'):(settings.themeLight||settings.theme||'darkteal'))}
function currentTheme(){return SettingsController.currentTheme?SettingsController.currentTheme(settings,DEFAULT_SETTINGS,THEME_PALETTE):(THEME_PALETTE[activeThemeKey()]||THEME_PALETTE.darkteal)}
function rgbaFromHex(hex,a){return hexToRgba(hex,a)}
function hexToHsl(hex){if(SettingsController.hexToHsl)return SettingsController.hexToHsl(hex);var h2=String(hex||'#10374A').replace('#','');var r=parseInt(h2.slice(0,2),16)/255,g=parseInt(h2.slice(2,4),16)/255,b=parseInt(h2.slice(4,6),16)/255;var max=Math.max(r,g,b),min=Math.min(r,g,b),h,s,l=(max+min)/2;if(max===min){h=s=0}else{var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4}h*=60}return{h:Math.round(h||0),s:Math.round((s||0)*100),l:Math.round(l*100)}}
function clampN(n,mn,mx){return Math.max(mn,Math.min(mx,n))}
function applyHighlightThemeVars(){var theme=currentTheme(),root=document.documentElement;if(settings.darkMode){var d=theme.dark||{};root.style.setProperty('--chord-highlight-bg',rgbaFromHex(d.accentStrong||theme.c,.22));root.style.setProperty('--chord-color',d.chord||d.accent||theme.c)}else{var hex=activeThemeHex();var hs=hexToHsl(hex);var l=clampN(92-Math.min(hs.s,50)*0.04,89,92);var sat=clampN(Math.max(Math.round(hs.s*0.7),22),22,48);root.style.setProperty('--chord-highlight-bg','hsl('+hs.h+','+sat+'%,'+l+'%)')}}
function activeThemeHex(){return SettingsController.activeThemeHex?SettingsController.activeThemeHex(settings,DEFAULT_SETTINGS,THEME_PALETTE):(function(){var t=THEME_PALETTE[settings.darkMode?settings.themeDark:settings.themeLight]||THEME_PALETTE[settings.theme]||THEME_PALETTE.darkteal;return t.c})()}
function accentTextFor(hex){if(SettingsController.accentTextFor)return SettingsController.accentTextFor(hex);try{hex=String(hex||'').replace('#','');if(hex.length===3)hex=hex.split('').map(function(c){return c+c}).join('');var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);var lum=(0.2126*r+0.7152*g+0.0722*b)/255;return lum>.56?'#0d1e26':'#ffffff'}catch(e){return '#ffffff'}}
function applyTheme(){var theme=currentTheme(),root=document.documentElement;if(settings.darkMode){var d=theme.dark;root.style.setProperty('--tc',d.accentStrong);root.style.setProperty('--tc2',d.accent);root.style.setProperty('--tc3',d.accentStrong);root.style.setProperty('--tc-light','rgba(255,255,255,.08)');root.style.setProperty('--tc-mid','rgba(255,255,255,.18)');root.style.setProperty('--tc-faint',rgbaFromHex(d.accentStrong,.18));root.style.setProperty('--accent',d.accent);root.style.setProperty('--accent-strong',d.accentStrong);root.style.setProperty('--accent-surface',rgbaFromHex(d.accentStrong,.18));root.style.setProperty('--accent-surface-strong',rgbaFromHex(d.accentStrong,.28));root.style.setProperty('--accent-border',rgbaFromHex(d.accentStrong,.46));root.style.setProperty('--accent-bg',rgbaFromHex(d.accentStrong,.18));root.style.setProperty('--chord-color',d.chord);root.style.setProperty('--accent-fg',d.accentFg)}else{root.style.setProperty('--tc',theme.c);root.style.setProperty('--tc2',theme.c2);root.style.setProperty('--tc3',theme.c3);root.style.setProperty('--tc-light',theme.light);root.style.setProperty('--tc-mid',theme.mid);root.style.setProperty('--tc-faint',hexToRgba(theme.c,.07));root.style.setProperty('--surface-tint','rgba(16,55,74,.05)');root.style.setProperty('--surface-tint-strong','rgba(16,55,74,.09)');root.style.setProperty('--surface-border','rgba(16,55,74,.12)');root.style.setProperty('--accent',theme.c);root.style.setProperty('--accent-bg',theme.light);root.style.setProperty('--accent-fg',accentTextFor(theme.c));root.style.removeProperty('--accent-strong');root.style.removeProperty('--accent-surface');root.style.removeProperty('--accent-surface-strong');root.style.removeProperty('--accent-border');root.style.removeProperty('--chord-color')}}
function hexToRgba(hex,a){if(SettingsController.hexToRgba)return SettingsController.hexToRgba(hex,a);var h=String(hex||'#4b005f').replace('#','');if(h.length===3)h=h.split('').map(function(x){return x+x}).join('');var n=parseInt(h,16);var r=(n>>16)&255,g=(n>>8)&255,b=n&255;return 'rgba('+r+','+g+','+b+','+a+')'}
function applySettings(){if(SettingsController.applyDocumentSettings){settings=SettingsController.applyDocumentSettings(document,settings,DEFAULT_SETTINGS,THEME_PALETTE);return}settings=cloneSettings(settings);document.body.classList.toggle('dark',!!settings.darkMode);applyTheme();applyHighlightThemeVars();var scale=Math.max(.85,Math.min(1.25,parseFloat(settings.textSize)||1));document.documentElement.style.setProperty('--wb-text-scale',scale)}
function persistSettings(){writeStoredJson(STORAGE_KEYS.settings,settings)}
function persistRouteMemory(reason){return MainShellController.persistRouteMemory?MainShellController.persistRouteMemory(mainShellCtx(),reason):null}
function loadRouteMemory(){return MainShellController.loadRouteMemory?MainShellController.loadRouteMemory(mainShellCtx()):null}
function updateSetting(key,val,skipRender){if(SettingsController.updateSetting){settings=SettingsController.updateSetting(settings,key,val,{defaults:DEFAULT_SETTINGS,palette:THEME_PALETTE});}else{if(key==='addToSetBehavior'){val='ask'}if(key==='theme'){if(settings.darkMode){settings.themeDark=val}else{settings.themeLight=val}settings.theme=val}else if(key==='darkMode'){settings.darkMode=!!val;settings.theme=activeThemeKey()}else{settings[key]=val}}persistSettings();applySettings();if(key==='defaultSongView'||key==='highlightChordsDefault'||key==='theme'||key==='darkMode')renderSongSheet();if(!skipRender)renderSettings()}

function migrateV85ThemeToPalette(hex){hex=String(hex||'').toLowerCase();var pairs={neutral:'#111111',forest:'#1a4731',olive:'#6f7d3c',stone:'#8a7a68',cedar:'#7a5a4d',mulberry:'#5a2034',purple:'#3a0a55',darkteal:'#10374a',slate:'#4f6480',navy:'#2f4565'};var best='stone',bestD=1e9;function parts(h){h=String(h||'').replace('#','');return [parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0]}var p=parts(hex);Object.keys(pairs).forEach(function(k){var q=parts(pairs[k]),d=Math.pow(p[0]-q[0],2)+Math.pow(p[1]-q[1],2)+Math.pow(p[2]-q[2],2);if(d<bestD){bestD=d;best=k}});return best}
function migrateV85Song(raw,source){raw=raw||{};var n=normalizeImportedSong({id:raw.id||raw.fbKey||raw.localId,title:raw.title||raw.name,artist:raw.artist||raw.author||raw.writer,code:raw.code||raw.songCode,key:raw.key||raw.originalKey||raw.scale,cat:raw.cat||raw.category,chart:raw.chart||raw.lyrics||raw.body||raw.content||raw.text,bpm:raw.bpm||raw.tempo,timeSig:raw.timeSig||raw.timeSignature||raw.time,spotifyUrl:raw.spotifyUrl||raw.spotify,youtubeUrl:raw.youtubeUrl||raw.youtube,url:raw.url||raw.sourceUrl,importId:raw.importId||raw.fbKey},source||raw.importSource||'v85');n.id=String(raw.id||raw.fbKey||raw.localId||n.id||('v85_'+Date.now()+'_'+Math.random().toString(36).slice(2,8))).trim();n.key=normalizeKeyName(n.key||'C');n.source=source==='firebase'?'firebase':'local';n.favorite=!!raw.favorite;return n}
function mergeSongArrayById(base,incoming){var by={},out=[];(base||[]).concat(incoming||[]).forEach(function(song){if(!song||!song.title&&!song.chart)return;var id=String(song.id||song.importId||song.fbKey||'').trim()||normalizeSearchText((song.title||'')+' '+(song.artist||''));if(!id)return;if(!by[id]){by[id]=Object.assign({},song,{id:id});out.push(by[id])}else{Object.assign(by[id],song,{id:id})}});return out}
function migrateV85SetItem(item,i){if(typeof item==='string'||typeof item==='number')return {type:'song',songId:String(item),order:i};if(!item||typeof item!=='object')return null;if(item.type==='section')return {type:'section',title:String(item.title||item.label||'Section'),id:String(item.id||('section_'+i)),order:item.order||i};if(item.type==='item'||item.type==='service')return {type:'item',title:String(item.title||item.label||'Service item'),note:String(item.note||item.description||''),id:String(item.id||('item_'+i)),order:item.order||i};return {type:'song',songId:String(item.songId||item.id||''),order:item.order||i,setKey:normalizeKeyChoice(item.setKey||'inherit'),keyOverride:!!item.keyOverride}}
function migrateV85NamedSetMap(raw,fallback){var out=[];if(raw&&typeof raw==='object'){Object.keys(raw).forEach(function(id,idx){var val=raw[id]||{};var items=(Array.isArray(val.items)?val.items:(Array.isArray(val.songs)?val.songs:[])).map(migrateV85SetItem).filter(Boolean);var set={id:String(id||('set_'+idx)),name:String(val.name||fallback+' '+(idx+1)),items:items,setNotes:String(val.notes||val.setNotes||''),updated:'Updated now'};syncSetCounts(set);out.push(set)})}return out}
function migrateV85LocalStorageIntoRebuild(){
  try{
    var cached=readStoredArray('wb_cached_songs',[]);
    if(cached.length){
      firebaseSongs=mergeSongArrayById(firebaseSongs,cached.map(function(s){return migrateV85Song(s,'firebase')}));
      persistFirebaseSongsCache&&persistFirebaseSongsCache();
    }
    var mem=readStoredObject('wb_song_memory_v1',{});
    if(mem&&typeof mem==='object')songMemory=Object.assign({},mem,songMemory||{});
    var prefs=readStoredObject('wb_prefs_v1',{});
    if(prefs&&typeof prefs==='object'){
      if(!safeGet(STORAGE_KEYS.settings)){
        settings=cloneSettings(Object.assign({},settings,{
          darkMode:!!prefs.darkMode,
          textSize:prefs.textSize?Math.max(.85,Math.min(1.25,(parseInt(prefs.textSize,10)||100)/100)):settings.textSize,
          defaultSongView:prefs.defaultSongView||settings.defaultSongView,
          highlightChordsDefault:typeof prefs.highlightChords==='boolean'?prefs.highlightChords:settings.highlightChordsDefault,
          useFlatsDefault:typeof prefs.useFlatsDefault==='boolean'?prefs.useFlatsDefault:settings.useFlatsDefault,
          keepScreenAwakeOnSongs:typeof prefs.keepAwakeOnSongs==='boolean'?prefs.keepAwakeOnSongs:settings.keepScreenAwakeOnSongs,
          addToSetBehavior:prefs.addToSetBehavior||settings.addToSetBehavior,
          themeLight:prefs.themeLight?migrateV85ThemeToPalette(prefs.themeLight):settings.themeLight,
          themeDark:prefs.themeDark?migrateV85ThemeToPalette(prefs.themeDark):settings.themeDark
        }));
        persistSettings();
      }
      if(Array.isArray(prefs.recentSongs)&&!recentIds.length){recentIds=prefs.recentSongs.map(String).slice(0,8);persistRecents()}
      if(Array.isArray(prefs.favoriteSongs)){prefs.favoriteSongs.forEach(function(id){var meta=songMeta(String(id));meta.favorite=true;songMemory[String(id)]=meta})}
    }
    if(!personalSets.length){
      var personal=migrateV85NamedSetMap(readStoredJson('wb_personal_sets_v1',null),'Set');
      var device=readStoredArray('wb_device_sl',[]);
      if(!personal.length&&device.length){
        personal=[{id:'default',name:'My Set',items:device.map(migrateV85SetItem).filter(Boolean),updated:'Updated now'}];
        syncSetCounts(personal[0]);
      }
      if(personal.length){personalSets=preserveSetArray?preserveSetArray(personal):personal;activeSetId=personalSets[0].id;persistSets()}
    }
    var shared=migrateV85NamedSetMap(readStoredJson('wb_cached_named_sets_v1',null),'Shared Set');
    if(shared.length&&!(workspaceState.sets||[]).length){
      workspaceState.sets=(preserveSetArray?preserveSetArray(shared):shared).map(function(s){s.source='Workspace';workspaceSetCounts&&workspaceSetCounts(s);return s});
      persistWorkspace&&persistWorkspace();
    }
    safeSet('wb_rebuild_85_migrated_v1','1');
  }catch(e){console.warn('v85 localStorage migration skipped',e)}
}
function migrateV85IndexedDBSongs(){if(!window.indexedDB||safeGet('wb_rebuild_85_idb_migrated_v1'))return Promise.resolve(false);return new Promise(function(resolve){try{var req=indexedDB.open('worshipbase_local_my_songs_v1',1);req.onerror=function(){resolve(false)};req.onsuccess=function(){var db=req.result;if(!db.objectStoreNames.contains('songs')){resolve(false);return}var tx=db.transaction('songs','readonly'),store=tx.objectStore('songs'),get=store.getAll();get.onerror=function(){resolve(false)};get.onsuccess=function(){var rows=get.result||[];if(rows.length){localSongs=mergeSongArrayById(localSongs,rows.map(function(s){return migrateV85Song(s,'local')}));persistSongs();rebuildSongsCache();renderLibrary();renderPersonalHome();renderSettings();showSync('Loaded v85 local songs')}safeSet('wb_rebuild_85_idb_migrated_v1','1');resolve(!!rows.length)}}}catch(e){console.warn('v85 IndexedDB migration skipped',e);resolve(false)}})}
function loadPersisted(){
  localSongs=readStoredArray(STORAGE_KEYS.songs,localSongs);
  songMemory=readStoredObject(STORAGE_KEYS.songMemory,songMemory||{});
  personalSets=preserveSetArray?preserveSetArray(readStoredArray(STORAGE_KEYS.sets,personalSets)):readStoredArray(STORAGE_KEYS.sets,personalSets);
  recentIds=readStoredArray(STORAGE_KEYS.recents,recentIds);
  if(safeGet(STORAGE_KEYS.settings)){settings=cloneSettings(readStoredObject(STORAGE_KEYS.settings,settings))}
  var parsedWorkspace=readStoredObject(STORAGE_KEYS.workspace,{});
  if(parsedWorkspace&&parsedWorkspace.sets&&Array.isArray(parsedWorkspace.sets)){workspaceState=Object.assign({},workspaceState,parsedWorkspace,{sets:preserveSetArray?preserveSetArray(parsedWorkspace.sets):parsedWorkspace.sets})}
  migrateV85LocalStorageIntoRebuild();
  loadCloudState();
  loadCachedFirebaseSongs();
  loadBibleCache();
  loadRouteMemory();
  rebuildSongsCache();
  applySettings();
}
function persistSongs(){writeStoredJson(STORAGE_KEYS.songs,localSongs)}
function persistSets(){writeStoredJson(STORAGE_KEYS.sets,preserveSetArray?preserveSetArray(personalSets):personalSets)}
function persistRecents(){writeStoredJson(STORAGE_KEYS.recents,recentIds.slice(0,8))}
function resetLocalData(){removeStoredMany([STORAGE_KEYS.songs,STORAGE_KEYS.songMemory,STORAGE_KEYS.sets,STORAGE_KEYS.recents,STORAGE_KEYS.settings,STORAGE_KEYS.workspace,STORAGE_KEYS.routeMemory,STORAGE_KEYS.firebaseSongsCache,STORAGE_KEYS.bibleCache]);localSongs=[];firebaseSongs=[];songMemory={};personalSets=[];settings=cloneSettings();recentIds=[];activeSetId='';workspaceState.panel='home';workspaceState.activeSetId=null;workspaceState.detailType=null;workspaceState.selectedPublishId=null;workspaceState.profile=WorkspaceSetController&&WorkspaceSetController.defaultProfile?WorkspaceSetController.defaultProfile():{name:'Workspace',description:'Team planning and shared sets',inviteCode:'WB-TEAM-042'};workspaceState.sets=[];bibleRuntime.index=null;bibleRuntime.books=[];bibleRuntime.chapterCache=Object.create(null);rebuildSongsCache();persistWorkspace();applySettings();renderLibrary();renderPersonalHome();renderWorkspaceSetLists();renderSettings()}

var qs=WBDom.qs;
function unlockUiInteraction(){try{document.body.classList.add('wb-ui-ready');document.body.style.pointerEvents='auto';document.documentElement.classList.remove('wb-launch-light','wb-launch-dark');document.documentElement.style.background='';document.body.style.background='';var app=qs('app');if(app){app.style.opacity='1';app.style.pointerEvents='auto';}}catch(e){}}
var qsa=WBDom.qsa;
var qv=WBDom.qv;
var focusIfPresent=WBDom.focusIfPresent;
var textContentOf=WBDom.textContentOf;
var esc=WBDom.esc;
var WBChart=window.WBChartRenderer&&window.WBChartRenderer.createAdapter?window.WBChartRenderer.createAdapter({
  esc:esc,
  keyRootName:keyRootName,
  getState:function(){return state||{}},
  getSettings:function(){return settings||{}},
  escapeTextWithSpaces:function(t){return escapeTextWithSpaces(t)},
  screenPairCols:function(){return screenPairCols()},
  wrapAlignedPairForScreen:function(chord,lyric,cols){return wrapAlignedPairForScreen(chord,lyric,cols)}
}):null;
var SongViewController=window.WBSongViewController||{};
var LibrarySurfaceController=window.WBLibrarySurfaceController||{};
var SongEditorImportController=window.WBSongEditorImportController||{};
var SongImportDestinationController=window.WBSongImportDestinationController||{};
var SongLifecycleController=window.WBSongLifecycleController||{};
var firstLetter=WBDom.firstLetter;
function musicIcon(){return '<svg fill="none" viewBox="0 0 24 24"><path d="M9 18V6.8l9-1.8v10.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="18" r="2.4" stroke="currentColor" stroke-width="1.8"/><circle cx="16" cy="16" r="2.4" stroke="currentColor" stroke-width="1.8"/></svg>'}
function heartIcon(on){return '<svg viewBox="0 0 24 24" fill="'+(on?'currentColor':'none')+'"><path d="M20.8 5.9a5.1 5.1 0 0 0-7.2 0L12 7.5l-1.6-1.6a5.1 5.1 0 0 0-7.2 7.2L12 22l8.8-8.9a5.1 5.1 0 0 0 0-7.2Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg>'}
function normalizeSearchText(s){return window.WBLibraryController&&WBLibraryController.normalizeSearchText?WBLibraryController.normalizeSearchText(s):String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9# +/.-]+/g,' ').replace(/\s+/g,' ').trim()}
function stripChartText(text){return window.WBLibraryController&&WBLibraryController.stripChartText?WBLibraryController.stripChartText(text):String(text||'').replace(/\[[^\]]+\]/g,' ').replace(/\s+/g,' ').trim()}
function textMatchesQuery(text,q){return window.WBLibraryController&&WBLibraryController.textMatchesQuery?WBLibraryController.textMatchesQuery(text,q):normalizeSearchText(text).indexOf(normalizeSearchText(q))>=0}
function buildLyricSnippet(song,q){return window.WBLibraryController&&WBLibraryController.buildLyricSnippet?WBLibraryController.buildLyricSnippet(song,q):''}
function highlightSearchHTML(text,q){return window.WBLibraryController&&WBLibraryController.highlightSearchHTML?WBLibraryController.highlightSearchHTML(text,q,esc):esc(text)}
function getSongSearchMatch(s,q){return window.WBLibraryController&&WBLibraryController.getSongSearchMatch?WBLibraryController.getSongSearchMatch(s,q,{state:state,songs:songs,songCode:function(song){return songCode(song)}}):null}
function passesLibraryFilter(s){return window.WBLibraryController&&WBLibraryController.passesLibraryFilter?WBLibraryController.passesLibraryFilter(s,state.filter||'all'):true}
function syncLibraryFilterChips(){if(window.WBLibraryController&&WBLibraryController.syncFilterChips)return WBLibraryController.syncFilterChips({qs:qs,qsa:qsa,state:state})}
function filteredSongRows(){return window.WBLibraryController&&WBLibraryController.filteredSongRows?WBLibraryController.filteredSongRows({songs:songs,state:state,songCode:function(song){return songCode(song)}}):songs.map(function(s){return {song:s,match:null}})}
function filteredSongs(){return window.WBLibraryController&&WBLibraryController.filteredSongs?WBLibraryController.filteredSongs({songs:songs,state:state,songCode:function(song){return songCode(song)}}):filteredSongRows().map(function(x){return x.song})}
function songCode(s){return window.WBLibraryController&&WBLibraryController.songCode?WBLibraryController.songCode(s,songs):(s.code||(s.code='S'+String(Math.max(1,songs.indexOf(s)+1)).padStart(3,'0')))}
function normalizeSongOrigin(origin){return SongViewController.normalizeOrigin?SongViewController.normalizeOrigin(origin):(function(){origin=String(origin||'').trim();if(origin==='songs'||origin==='song'||origin==='library')return 'library';if(origin==='setlist'||origin==='personal-set')return 'setlist';if(origin==='workspace-set'||origin==='workspace')return 'workspace-set';return 'library'})()}
function ensureSongViewMemory(origin){return SongViewController.ensureMemory?SongViewController.ensureMemory(state,settings,origin):{mode:settings.defaultSongView||'chords',focus:false}}
function rememberCurrentSongView(origin){return SongViewController.rememberCurrent?SongViewController.rememberCurrent(state,settings,origin):ensureSongViewMemory(origin)}
function songEntriesForOrigin(origin,ctx){if(SongViewController.entriesForOrigin)return SongViewController.entriesForOrigin({state:state,origin:origin,context:ctx,songs:songs,findSet:findSongContextSet,currentSet:currentSet,activeWorkspaceSet:activeWorkspaceSet,ensureSetShape:ensureSetShape,orderedVisibleSongs:orderedVisibleSongs});origin=normalizeSongOrigin(origin||state.lastSongOrigin||'library');ctx=ctx||state.songContext||null;var entries=[];if(origin==='setlist'){var set=findSongContextSet(ctx)||currentSet();ensureSetShape(set);(set.items||[]).forEach(function(item,idx){if(item&&item.type==='song'){var s=songs.find(function(x){return x.id===item.songId});if(s)entries.push({song:s,context:{scope:'personal',setId:set.id,index:idx,item:item}})}});return entries}if(origin==='workspace-set'){var ws=findSongContextSet(ctx)||activeWorkspaceSet();(ws&&ws.items||[]).forEach(function(item,idx){if(item&&item.type==='song'){var s=songs.find(function(x){return x.id===item.songId});if(s)entries.push({song:s,context:{scope:'workspace',setId:ws.id,index:idx,item:item}})}});return entries}return orderedVisibleSongs().map(function(song){return {song:song,context:null}})}
function currentSongEntryIndex(entries,ctx){return SongViewController.currentEntryIndex?SongViewController.currentEntryIndex(entries,ctx||state.songContext,state.selectedId):(entries||[]).findIndex(function(entry){return entry&&entry.song&&entry.song.id===state.selectedId})}
function songSwipeTargets(){var sv=qs('song-view');if(!sv)return [];return [sv.querySelector('.sv-hdr'),qs('sv-scroll')].filter(Boolean)}
function songSwipeDistance(){return Math.max(228,Math.round((window.innerWidth||390)*.62))}
function setSongSwipeOffset(x,opacity,transition){songSwipeTargets().forEach(function(el){el.style.transition=transition||'';el.style.transform=x?('translate3d('+Math.round(x)+'px,0,0)'):'translate3d(0,0,0)';if(opacity!=null)el.style.opacity=String(opacity);else el.style.opacity='1'})}
function clearSongSwipeOffset(){songSwipeTargets().forEach(function(el){el.style.transition='';el.style.transform='';el.style.opacity=''})}
function freezeSongMotionUI(on){document.body.classList.toggle('song-motion-freeze',!!on);var sv=qs('song-view');if(sv)sv.classList.toggle('song-switching',!!on)}
function cloneNodeForMotion(node){if(!node)return null;var clone=node.cloneNode(true);if(clone.removeAttribute)clone.removeAttribute('id');qsa('[id]',clone).forEach(function(el){el.removeAttribute('id')});return clone}
function clearSongTransitionLayer(){var layer=qs('song-transition-layer');if(layer){layer.innerHTML='';layer.classList.remove('active')}}
function createSongTransitionPane(role){var layer=qs('song-transition-layer');var sv=qs('song-view');if(!layer||!sv)return null;var pane=document.createElement('div');pane.className='song-transition-pane '+(role||'outgoing');var hdr=cloneNodeForMotion(sv.querySelector('.sv-hdr'));var sc=qs('sv-scroll');if(hdr)pane.appendChild(hdr);var scrollShell=document.createElement('div');scrollShell.className='song-transition-scroll';if(sc){scrollShell.innerHTML=sc.innerHTML;scrollShell.scrollTop=sc.scrollTop}pane.appendChild(scrollShell);if(role!=='incoming')layer.innerHTML='';layer.appendChild(pane);layer.classList.add('active');return pane}
function renderRecents(){if(window.WBLibraryController&&WBLibraryController.renderRecents)return WBLibraryController.renderRecents({qs:qs,songs:songs,recentIds:recentIds,esc:esc,songCode:function(song){return songCode(song)}})}
function renderAlpha(list){if(window.WBLibraryController&&WBLibraryController.renderAlpha)return WBLibraryController.renderAlpha(list,{qs:qs,esc:esc,firstLetter:firstLetter})}

var manageSelectedIds=[];
function isFirebaseSong(s){return LibrarySurfaceController.isFirebaseSong?LibrarySurfaceController.isFirebaseSong(s):!!(s&&(s.source==='firebase'||s.importSource==='firebase'))}
function isEditableLocalSong(s){return LibrarySurfaceController.isEditableLocalSong?LibrarySurfaceController.isEditableLocalSong(s):!!(s&&!isFirebaseSong(s))}
function syncManageToolbar(){var res=LibrarySurfaceController.syncManageToolbar?LibrarySurfaceController.syncManageToolbar({document:document,qs:qs,adminUnlocked:adminUnlocked,manageMode:manageMode,manageSelectedIds:manageSelectedIds}):null;if(res){manageMode=res.manageMode;manageSelectedIds=res.manageSelectedIds||[]}}
function toggleManageMode(on){var res=LibrarySurfaceController.setManageMode?LibrarySurfaceController.setManageMode(manageSelectedIds,manageMode,on):{manageMode:on==null?!manageMode:!!on,manageSelectedIds:manageSelectedIds};manageMode=res.manageMode;manageSelectedIds=res.manageSelectedIds||[];renderLibrary();syncManageToolbar();if(typeof renderSettings==='function')renderSettings()}
function toggleManageSelection(id){manageSelectedIds=LibrarySurfaceController.toggleSelection?LibrarySurfaceController.toggleSelection(manageSelectedIds,id):manageSelectedIds;renderLibrary();syncManageToolbar()}
function selectManageAll(){var rows=filteredSongRows?filteredSongRows():songs.map(function(s){return {song:s}});manageSelectedIds=LibrarySurfaceController.selectAllVisible?LibrarySurfaceController.selectAllVisible(manageSelectedIds,rows):manageSelectedIds;renderLibrary();syncManageToolbar()}
function duplicateGroupsForManage(){return LibrarySurfaceController.duplicateGroups?LibrarySurfaceController.duplicateGroups(songs,{normalizeSearchText:normalizeSearchText,normalizeSongCode:normalizeSongCode,songCode:function(s){return songCode(s)}}):[]}
function reviewManageDuplicates(){var review=LibrarySurfaceController.duplicateReviewSelection?LibrarySurfaceController.duplicateReviewSelection(songs,{normalizeSearchText:normalizeSearchText,normalizeSongCode:normalizeSongCode,songCode:function(s){return songCode(s)}}):{groups:duplicateGroupsForManage(),selectedIds:[]};if(!review.groups.length){showToast('No likely duplicates');return}manageSelectedIds=review.selectedIds||[];renderLibrary();syncManageToolbar();showToast(review.groups.length+' duplicate group'+(review.groups.length===1?'':'s')+' found')}
function removeSongEverywhere(id){var model=LibrarySurfaceController.removeSongEverywhere?LibrarySurfaceController.removeSongEverywhere(id,{localSongs:localSongs,firebaseSongs:firebaseSongs,songMemory:songMemory,personalSets:personalSets,workspaceState:workspaceState},{ensureSetShape:ensureSetShape,syncSetCounts:syncSetCounts,workspaceSetCounts:workspaceSetCounts}):null;if(model){localSongs=model.localSongs||[];firebaseSongs=model.firebaseSongs||[];songMemory=model.songMemory||{};personalSets=model.personalSets||[];workspaceState=model.workspaceState||workspaceState}}
function dataSafetySnapshot(label){
  return {label:label||'',localSongs:JSON.parse(JSON.stringify(localSongs||[])),firebaseSongs:JSON.parse(JSON.stringify(firebaseSongs||[])),songMemory:JSON.parse(JSON.stringify(songMemory||{})),personalSets:JSON.parse(JSON.stringify(personalSets||[])),recentIds:JSON.parse(JSON.stringify(recentIds||[])),activeSetId:activeSetId,workspaceState:JSON.parse(JSON.stringify(workspaceState||{})),settings:JSON.parse(JSON.stringify(settings||{})),selectedId:state&&state.selectedId||null,setlistEditorId:state&&state.setlistEditorId||null};
}
function restoreDataSafetySnapshot(snap){
  if(!snap)return;
  localSongs=JSON.parse(JSON.stringify(snap.localSongs||[]));
  firebaseSongs=JSON.parse(JSON.stringify(snap.firebaseSongs||[]));
  songMemory=JSON.parse(JSON.stringify(snap.songMemory||{}));
  personalSets=preserveSetArray?preserveSetArray(JSON.parse(JSON.stringify(snap.personalSets||[]))):JSON.parse(JSON.stringify(snap.personalSets||[]));
  recentIds=JSON.parse(JSON.stringify(snap.recentIds||[]));
  activeSetId=snap.activeSetId||((personalSets[0]&&personalSets[0].id)||null);
  workspaceState=Object.assign({},workspaceState||{},JSON.parse(JSON.stringify(snap.workspaceState||{})));
  settings=cloneSettings(JSON.parse(JSON.stringify(snap.settings||{})));
  if(state){state.selectedId=snap.selectedId||state.selectedId;state.setlistEditorId=snap.setlistEditorId||state.setlistEditorId;}
  rebuildSongsCache();
  persistSongs();persistSongMemory();persistSets();persistRecents();persistWorkspace();persistSettings();
  try{persistFirebaseSongsCache&&persistFirebaseSongsCache()}catch(e){}
  applySettings();renderLibrary();renderPersonalHome(!!state.setlistEditorId);renderWorkspaceSetLists();renderSettings();
  var set=currentSet&&currentSet();if(set&&qs('wb-set-editor')&&!qs('wb-set-editor').hidden)renderSetEditor();
  if(workspaceState&&workspaceState.panel==='detail'&&workspaceState.activeSetId){var ws=(workspaceState.sets||[]).find(function(x){return x.id===workspaceState.activeSetId});if(ws)renderWorkspaceSetDetail(ws)}
  if(state&&state.selectedId&&qs('song-view')&&qs('song-view').classList.contains('visible'))renderSongSheet();
}
var lastDataSafetyUndo=null;
function offerDataUndo(message,snapshot,afterUndo){
  lastDataSafetyUndo={snapshot:snapshot,afterUndo:afterUndo||null,createdAt:Date.now()};
  var t=qs('toast');if(!t){showToast(message);return;}
  clearTimeout(showToast._t);
  t.className='wb-undo-toast show';
  t.innerHTML='<span class="wb-undo-msg">'+esc(message||'Changed')+'</span><button class="wb-undo-btn" type="button" data-data-undo="1">Undo</button>';
  showToast._t=setTimeout(function(){if(t&&t.classList.contains('wb-undo-toast')){t.classList.remove('show','wb-undo-toast');t.textContent=''}lastDataSafetyUndo=null;},6200);
}
function handleDataUndoClick(e){var b=e.target&&e.target.closest&&e.target.closest('[data-data-undo]');if(!b||!lastDataSafetyUndo)return;var undo=lastDataSafetyUndo;lastDataSafetyUndo=null;clearTimeout(showToast._t);restoreDataSafetySnapshot(undo.snapshot);if(typeof undo.afterUndo==='function'){try{undo.afterUndo()}catch(err){}}showToast('Undone')}
try{document.addEventListener('click',handleDataUndoClick,{capture:true})}catch(e){}
function songUsageForDelete(id){return LibrarySurfaceController.songUsageForDelete?LibrarySurfaceController.songUsageForDelete(id,{personalSets:personalSets,workspaceState:workspaceState,ensureSetShape:ensureSetShape}):[]}
function songUsageImpactText(id){return LibrarySurfaceController.songUsageImpactText?LibrarySurfaceController.songUsageImpactText(id,{personalSets:personalSets,workspaceState:workspaceState,ensureSetShape:ensureSetShape}):'Not currently used in any personal or Workspace set.'}
function bulkSongUsageImpactText(ids){return LibrarySurfaceController.bulkSongUsageImpactText?LibrarySurfaceController.bulkSongUsageImpactText(ids,{songs:songs,personalSets:personalSets,workspaceState:workspaceState,ensureSetShape:ensureSetShape}):'No selected songs are currently used in personal or Workspace sets.'}
function firebaseSongPathKey(id){return encodeURIComponent(String(id||'').trim()).replace(/\./g,'%2E').replace(/#/g,'%23').replace(/\$/g,'%24').replace(/\[/g,'%5B').replace(/\]/g,'%5D').replace(/\//g,'%2F')}
function firebaseSongDbPath(id){var paths=cloudFirestorePaths();return (paths.songsPath||'songs')+'/'+firebaseSongPathKey(id)}
function cacheFirebaseSong(song){
  song=normalizeFirebaseSong(song,song&&song.id);
  var idx=firebaseSongs.findIndex(function(x){return x.id===song.id});
  if(idx>=0)firebaseSongs[idx]=Object.assign({},firebaseSongs[idx],song,{source:'firebase'});else firebaseSongs.push(Object.assign({},song,{source:'firebase'}));
  persistFirebaseSongsCache();rebuildSongsCache();renderLibrary();renderSettings();
  return songs.find(function(s){return s.id===song.id})||song;
}
function updateFirebaseSongRemote(id,payload){
  id=String(id||payload&&payload.id||'').trim();
  if(!id)return Promise.reject(new Error('Missing Firebase song id'));
  var out=normalizeFirebaseSong(Object.assign({},payload,{id:id,source:'firebase'}),id);
  return firebaseRealtimeDb().then(function(db){
    var path=firebaseSongDbPath(id);
    if(db&&db.ref)return db.ref(path).set(JSON.parse(JSON.stringify(out))).then(function(){return out});
    throw new Error('Realtime DB unavailable');
  }).then(function(saved){cacheFirebaseSong(saved);return saved}).catch(function(err){
    cacheFirebaseSong(out);
    showToast('Saved to Firebase cache');
    return out;
  });
}
function refreshFirebaseSongsNow(){
  try{detachFirebaseRuntime&&detachFirebaseRuntime()}catch(e){}
  firebaseRuntime.songsListening=false;
  firebaseRuntime.songsSettled=false;
  return loadFirebaseSongsRuntime().then(function(list){showToast('Firebase songs synced');renderAdminFirebaseTools();return list}).catch(function(){showToast('Sync unavailable — using cache');renderAdminFirebaseTools();return firebaseSongs});
}
function selectManageBySource(source){source=source==='firebase'?'firebase':'local';manageSelectedIds=LibrarySurfaceController.idsBySource?LibrarySurfaceController.idsBySource(songs,source):[];switchTab('songs');toggleManageMode(true);renderLibrary();syncManageToolbar();showToast(manageSelectedIds.length+' '+(source==='firebase'?'Firebase':'My Songs')+' selected')}
function renderAdminFirebaseTools(){
  var box=qs('admin-firebase-stats');if(!box)return;
  var f=(firebaseSongs||[]).length,l=(localSongs||[]).length,t=(songs||[]).length;
  box.innerHTML='<div class="admin-firebase-stat"><strong>'+f+'</strong><span>Firebase</span></div><div class="admin-firebase-stat"><strong>'+l+'</strong><span>My Songs</span></div><div class="admin-firebase-stat"><strong>'+t+'</strong><span>Total</span></div>';
}
function openAdminFirebaseTools(){renderAdminFirebaseTools();var m=qs('bs-admin-firebase-tools');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}}
function closeAdminFirebaseTools(){var m=qs('bs-admin-firebase-tools');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}}
function exportSourceSongs(source){
  var DS=window.WBDataSafetyController||null,arr=source==='firebase'?firebaseSongs:localSongs;
  if(DS&&DS.sourceSongsExportOperation)return DS.sourceSongsExportOperation(source,arr,{downloadTextFile:downloadTextFile,backupStamp:backupStamp},{version:VERSION});
  downloadTextFile('worshipbase-'+(source==='firebase'?'firebase-cache':'my-songs')+'-'+backupStamp()+'.json',JSON.stringify({format:'worshipbase-song-source-export',version:VERSION,source:source,exportedAt:new Date().toISOString(),songs:arr},null,2));
}
function handleAdminFirebaseAction(action){
  if(action==='sync'){refreshFirebaseSongsNow();return}
  if(action==='select-firebase'){closeAdminFirebaseTools();selectManageBySource('firebase');return}
  if(action==='select-local'){closeAdminFirebaseTools();selectManageBySource('local');return}
  if(action==='export-firebase'){exportSourceSongs('firebase');return}
  if(action==='export-local'){exportSourceSongs('local');return}
}
function deleteFirebaseSongRemote(id){
  id=String(id||'').trim();
  if(!id)return Promise.resolve();
  try{
    return firebaseRealtimeDb().then(function(db){
      var path=firebaseSongDbPath(id);
      if(db&&db.ref)return db.ref(path).remove();
    }).catch(function(){});
  }catch(e){return Promise.resolve()}
}
function deleteManageSelected(){
  if(!manageSelectedIds.length){showToast('Select songs first');return}
  var count=manageSelectedIds.length,idsPreview=manageSelectedIds.slice();
  return appConfirm('Delete '+count+' selected song'+(count===1?'':'s')+'?',{
    title:'Delete selected songs',
    detail:'This removes the selected songs from this device and removes them from set lists.\n\n'+bulkSongUsageImpactText(idsPreview)+(idsPreview.some(function(id){return isFirebaseSong(songs.find(function(x){return x.id===id}))})?'\n\nFirebase deletes will also be queued for cloud songs.':''),
    confirmText:'Delete',
    danger:true
  }).then(function(ok){
    if(!ok)return;
    var snap=dataSafetySnapshot('delete selected songs');
    var ids=manageSelectedIds.slice(),firebaseCount=0;
    ids.forEach(function(id){var s=songs.find(function(x){return x.id===id});if(isFirebaseSong(s)){firebaseCount++;deleteFirebaseSongRemote(id)}removeSongEverywhere(id)});
    manageSelectedIds=[];
    rebuildSongsCache();persistSongs();persistSongMemory();persistSets();persistWorkspace();
    try{persistFirebaseSongsCache()}catch(e){}
    renderLibrary();renderPersonalHome(false);renderWorkspaceSetLists();syncManageToolbar();
    offerDataUndo('Deleted '+ids.length+(firebaseCount?' · Firebase sync queued':''),snap);
  });
}
function row(s,match){return window.WBLibraryController&&WBLibraryController.songRowHtml?WBLibraryController.songRowHtml(s,match,{esc:esc,firstLetter:firstLetter,musicIcon:musicIcon,heartIcon:heartIcon,adminUnlocked:adminUnlocked,manageMode:manageMode,manageSelectedIds:manageSelectedIds,songCode:function(song){return songCode(song)}}):''}
function renderLibrary(){if(window.WBLibraryController&&WBLibraryController.renderLibrary)return WBLibraryController.renderLibrary({qs:qs,qsa:qsa,state:state,songs:songs,recentIds:recentIds,firebaseRuntime:firebaseRuntime,hasCloudConfig:function(){return !!cloudFirebaseConfig()},adminUnlocked:adminUnlocked,manageMode:manageMode,manageSelectedIds:manageSelectedIds,esc:esc,firstLetter:firstLetter,musicIcon:musicIcon,heartIcon:heartIcon,songCode:function(song){return songCode(song)},syncManageToolbar:syncManageToolbar})}

function countLabel(set){if(PersonalSetController&&PersonalSetController.countLabel)return PersonalSetController.countLabel(set);set=ensureSetShape(set);var songs=(set&&set.entries||[]).length,items=(set&&set.textItems||[]).length;return songs+' '+(songs===1?'song':'songs')+' · '+items+' '+(items===1?'item':'items')}
function renderPersonalHome(retainMemory){retainMemory=retainMemory===true;if(!retainMemory)state.setlistEditorId=null;persistRouteMemory();var sec=qs('setlist-section');if(sec){sec.classList.add('wb-list-mode');sec.classList.remove('wb-editor-mode')}qs('wb-personal-manager').style.display='flex';qs('wb-set-editor').hidden=true;personalSets.forEach(function(set){ensureSetShape(set);syncSetCounts(set)});qs('wb-personal-meta').textContent=personalSets.length+' sets · Local';if(window.WBSetEditor&&WBSetEditor.listCards){qs('wb-personal-list').innerHTML=WBSetEditor.listCards('personal',personalSets,{escape:esc,countLabel:countLabel,dateLabel:function(set){return set.updated||'Updated now'}});return}qs('wb-personal-list').innerHTML=personalSets.map(function(set){var notes=setHasNotes(set)?'<span class="wb-note-pill">Notes</span>':'';return '<button class="wb-personal-card" type="button" data-set-id="'+esc(set.id)+'"><span class="wb-personal-main"><span class="wb-personal-name">'+esc(set.name)+'</span><span class="wb-personal-card-meta"><span>'+esc(countLabel(set))+'</span>'+notes+'<span>'+esc(set.updated||'Updated now')+'</span></span></span><span class="wb-personal-actions"><span class="wb-card-btn danger" data-delete-set="'+esc(set.id)+'">×</span></span></button>'}).join('')||'<div class="wb-personal-empty"><strong>No set lists yet</strong><div>Create your first personal set list.</div></div>'}
function openSet(id){activeSetId=id;state.setlistEditorId=id;persistRouteMemory();var set=personalSets.find(function(x){return x.id===id})||personalSets[0];if(!set)return;ensureSetShape(set);var sec=qs('setlist-section');if(sec){sec.classList.add('wb-editor-mode');sec.classList.remove('wb-list-mode')}qs('wb-personal-manager').style.display='none';qs('wb-set-editor').hidden=false;qs('wb-editor-title').textContent=set.name;qs('wb-editor-sub').textContent=(set.source||'Personal')+' · Local';renderSetEditor()}
function renderSetEditor(){var set=currentSet();if(!set)return;ensureSetShape(set);syncSetCounts(set);qs('sl-count').textContent=countLabel(set);var keyBtn=qs('sl-set-key-info');if(keyBtn)keyBtn.textContent=setKeyLabel(set);qs('wb-editor-title').textContent=set.name||'Untitled set';var sub=qs('wb-editor-sub');if(sub)sub.textContent=(set.source||'Personal')+' · Local';var notes=qs('set-notes-editor');if(notes&&notes.value!==set.setNotes)notes.value=set.setNotes||'';if(window.WBSetEditor&&WBSetEditor.editorItemsHtml){qs('sl-items').innerHTML=WBSetEditor.editorItemsHtml('personal',set,songs,{escape:esc,songCode:songCode,resolveSetItemKey:resolveSetItemKey,itemHasExplicitKey:itemHasExplicitKey});renderSongNotePreview();syncSetNotesQuickIndicator();return}var html=(set.items||[]).map(function(item,idx){if(item.type==='song'){var s=songs.find(function(x){return x.id===item.songId});if(!s)return '';var lang=s.cat==='malayalam'?'ML':'EN',note=(set.songNotes||{})[s.id],cue=(set.songCues||{})[s.id],cardKey=resolveSetItemKey(set,item,s),hasItemKey=itemHasExplicitKey(item);return '<div class="set-card song-set-card" data-set-index="'+idx+'" data-song-id="'+esc(s.id)+'"><div class="drag-handle" role="button" tabindex="0" aria-label="Reorder '+esc(s.title)+'"><span></span><span></span><span></span></div><div class="set-info"><div class="set-title">'+esc(s.title)+'</div><div class="set-meta">'+esc(s.artist||'')+'</div><div class="set-code-row"><span class="set-song-code">'+esc(songCode(s))+'</span><span class="lang-badge">'+lang+'</span>'+(note?'<span class="set-note-chip">Note</span>':'')+(cue?'<span class="set-cue-chip">Cue</span>':'')+'</div></div><button class="set-key-btn '+(hasItemKey?'has-item-key':'')+'" data-key-index="'+idx+'" type="button" aria-label="Choose key for '+esc(s.title)+'">Key '+esc(cardKey)+'</button><button class="set-rm" data-remove-index="'+idx+'" type="button">×</button></div>'}if(item.type==='section')return '<div class="set-section-card set-section-item" data-set-index="'+idx+'"><div class="drag-handle" role="button" tabindex="0" aria-label="Reorder section"><span></span><span></span><span></span></div><div class="set-section-title">'+esc(item.label||'SECTION')+'</div><button class="set-rm" data-remove-index="'+idx+'" type="button">×</button></div>';return '<div class="set-card text-set-card" data-set-index="'+idx+'"><div class="drag-handle" role="button" tabindex="0" aria-label="Reorder service item"><span></span><span></span><span></span></div><div class="set-info"><div class="set-title">'+esc(item.title||'Service item')+'</div><div class="set-meta">'+esc(item.sub||'')+'</div></div><button class="set-rm" data-remove-index="'+idx+'" type="button">×</button></div>'}).join('');qs('sl-items').innerHTML=html||'<div class="sl-empty"><strong>No songs in this set list</strong><div>Use the add button or set options to build a service set.</div></div>';renderSongNotePreview();syncSetNotesQuickIndicator()}

function songLifecycleCtx(){return {
  document:document,qs:qs,qsa:qsa,state:state,settings:settings,songs:songs,recentIds:recentIds,setRecentIds:function(v){recentIds=v||[]},songMemory:songMemory,adminUnlocked:adminUnlocked,performanceState:performanceState,workspaceState:workspaceState,personalSets:personalSets,activeSetId:activeSetId,sectionRailJumpLock:sectionRailJumpLock,
  esc:esc,heartIcon:heartIcon,songCode:songCode,normalizeSongOrigin:normalizeSongOrigin,rememberCurrentSongView:rememberCurrentSongView,resolveSongOpenKey:resolveSongOpenKey,normalizeKeyName:normalizeKeyName,isMinorKey:isMinorKey,noteIndex:noteIndex,noteName:noteName,labelKey:labelKey,keyOptionList:keyOptionList,
  stopPerformanceTools:stopPerformanceTools,hideToast:hideToast,showToast:showToast,syncWakeLock:syncWakeLock,renderRecents:renderRecents,persistRecents:persistRecents,renderLibrary:renderLibrary,renderAlpha:renderAlpha,filteredSongRows:filteredSongRows,renderSongSheet:renderSongSheet,renderPerformanceRail:renderPerformanceRail,updatePerformanceUI:updatePerformanceUI,focusOwner:focusOwner,setActiveRail:setActiveRail,updateRailFromScroll:updateRailFromScroll,
  clearSongTransitionLayer:clearSongTransitionLayer,clearSongSwipeOffset:clearSongSwipeOffset,freezeSongMotionUI:freezeSongMotionUI,songSwipeDistance:songSwipeDistance,createSongTransitionPane:createSongTransitionPane,songEntriesForOrigin:songEntriesForOrigin,currentSongEntryIndex:currentSongEntryIndex,filteredSongs:filteredSongs,orderedVisibleSongs:orderedVisibleSongs,
  setStateAdapter:setStateAdapter,setStateEnv:setStateEnv,ensureSetShape:ensureSetShape,currentSet:currentSet,activeWorkspaceSet:activeWorkspaceSet,commitSetMutation:commitSetMutation,closeSheetElement:closeSheetElement,isEditableLocalSong:isEditableLocalSong,openAddSongModal:openAddSongModal,openAdminPinSheet:openAdminPinSheet,openChordDiagramsSheet:openChordDiagramsSheet,updateSetting:updateSetting,renderSettings:renderSettings,copyCurrentLyrics:copyCurrentLyrics,downloadCurrentSongJson:downloadCurrentSongJson,openExportView:openExportView
}}
function closeSongView(){return SongLifecycleController.closeSongView(songLifecycleCtx())} 
function prepareLibraryForSongReturn(){return SongLifecycleController.prepareLibraryForSongReturn(songLifecycleCtx())}
function finishSongReturn(sv){return SongLifecycleController.finishSongReturn(songLifecycleCtx(),sv)}
function closeSongViewSmooth(){return SongLifecycleController.closeSongViewSmooth(songLifecycleCtx())}
function showSong(s,origin,context){return SongLifecycleController.showSong(songLifecycleCtx(),s,origin,context)}
function chartOwner(){if(!WBChart)throw new Error('WBChartRenderer not loaded');return WBChart}
function isSectionTag(raw){return chartOwner().isSectionTag(raw)}
function sectionTextFromLine(line){return chartOwner().sectionTextFromLine(line)}
function getSectionMetaFromText(text,occurrenceMap){return chartOwner().getSectionMetaFromText(text,occurrenceMap)}
function lineLooksChord(line){return chartOwner().lineLooksChord(line)}
function chordPositionsFromLine(chordLine){return chartOwner().chordPositionsFromLine(chordLine)}
function renderChordTokenLineHtml(line){return chartOwner().renderChordTokenLineHtml(line)}
function renderScreenPairRows(rows){return chartOwner().renderScreenPairRows(rows)}
function renderScreenChordOnlyRows(rows){return chartOwner().renderScreenChordOnlyRows(rows)}
function renderAlignedChordPair(chordLine,lyricLine,mode,song){return chartOwner().renderAlignedChordPair(chordLine,lyricLine,mode,song)}
function renderInlineChordLine(line,mode,song){return chartOwner().renderInlineChordLine(line,mode,song)}
function isChordToken(token){return chartOwner().isChordToken(token)}
function cleanChordToken(token){return chartOwner().cleanChordToken(token)}
function extractChordNames(text){return chartOwner().extractChordNames(text)}
function chordRoot(chord){return chartOwner().chordRoot(chord)}
function noteIndex(n){return chartOwner().noteIndex(n)}
function noteName(i,flat){return chartOwner().noteName(i,flat)}
function parseChordForNns(chord){return chartOwner().parseChordForNns(chord)}
function transposeChord(chord,fromKey,toKey){return chartOwner().transposeChord(chord,fromKey,toKey)}
function nnsAccidentalPreference(note,fallback){return chartOwner().nnsAccidentalPreference(note,fallback)}
function nnsDegreeForNote(note,key,accidentalPref){return chartOwner().nnsDegreeForNote(note,key,accidentalPref)}
function nnsStyleChordExtension(s){return chartOwner().nnsStyleChordExtension(s)}
function nnsSuffixForChord(suffix){return chartOwner().nnsSuffixForChord(suffix)}
function chordToNns(chord,key){return chartOwner().chordToNns(chord,key)}
function displayChord(ch,song,mode){return chartOwner().displayChord(ch,song,mode)}
function renderChordOnlyLine(line,mode,song){return chartOwner().renderChordOnlyLine(line,mode,song)}
function splitTextPreserveSpaces(text){return chartOwner().splitTextPreserveSpaces(text)}
function renderChordLyricLine(line,mode,song){return chartOwner().renderChordLyricLine(line,mode,song)}
function formatChartHtml(text,mode,song){return chartOwner().formatChartHtml(text,mode,song)}
function renderSongSheet(){if(window.WBSongViewRenderController&&WBSongViewRenderController.renderSongSheet)return WBSongViewRenderController.renderSongSheet({qs:qs,qsa:qsa,state:state,songs:songs,esc:esc,extractChordNames:extractChordNames,displayChord:displayChord,formatChartHtml:formatChartHtml,applySongCueMarkersToSheet:applySongCueMarkersToSheet,currentSongNoteSet:currentSongNoteSet,renderPerformanceRail:renderPerformanceRail,syncKeySelect:syncKeySelect,updateLiveToolLabels:updateLiveToolLabels,updateSongMenuUI:updateSongMenuUI})}


function setBodyRouteClasses(tab,extra){
  if(window.WBAppShellController&&window.WBAppShellController.setBodyRouteClasses){window.WBAppShellController.setBodyRouteClasses(tab,extra);return}
  var keepDark=document.body.classList.contains('dark');
  var keepReady=document.body.classList.contains('wb-ui-ready');
  var bits=[];
  if(keepDark)bits.push('dark');
  if(keepReady)bits.push('wb-ui-ready');
  bits.push('wb-route-'+tab,'wb-tab-'+tab);
  if(extra)bits.push(extra);
  document.body.className=bits.join(' ');
}

function legacySwitchTabFallback(tab){
  tab=routes[tab]?tab:'songs';
  try{closeTransientsBeforeRouteChange&&closeTransientsBeforeRouteChange(tab)}catch(e){}
  var previous=state.tab;
  var editorOpen=!!(qs('wb-set-editor')&&!qs('wb-set-editor').hidden);
  if(tab==='setlist'&&previous==='setlist'&&editorOpen){
    state.setlistEditorId=null;state.tab=tab;qsa('.route').forEach(function(r){r.classList.remove('active')});qs(routes[tab]).classList.add('active');qsa('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});qs('srch-wrap').style.display='none';qs('hdr-add-btn').style.display='none';setBodyRouteClasses(tab);renderPersonalHome(false);return tab;
  }
  if(tab==='workspace'&&previous==='workspace'&&workspaceState.panel&&workspaceState.panel!=='home'){showWorkspacePanel('home');return tab;}
  if(tab==='tools'&&previous==='tools'&&state.toolsPanel&&state.toolsPanel!=='home'){openToolsHome();return tab;}
  state.tab=tab;
  qsa('.route').forEach(function(r){r.classList.remove('active')});
  qs(routes[tab]).classList.add('active');
  qsa('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab)});
  qs('srch-wrap').style.display=tab==='songs'?'block':'none';
  qs('hdr-add-btn').style.display=tab==='songs'?'flex':'none';
  setBodyRouteClasses(tab);
  if(tab==='setlist'){
    var remembered=state.setlistEditorId&&personalSets.some(function(x){return x.id===state.setlistEditorId});
    if(previous!=='setlist'&&remembered)openSet(state.setlistEditorId); else renderPersonalHome(false);
  }
  if(tab==='tools'){
    var remembered=state.toolsPanel||'home';
    if(remembered==='bible')openToolsBible(true); else showToolsPanel(remembered||'home');
  }
  if(tab==='workspace'){
    renderWorkspaceSetLists();
    showWorkspacePanel(workspaceState.panel||'home');
  }
  persistRouteMemory();
  return tab
}
function switchTab(tab){
  if(window.WBAppShellController&&window.WBAppShellController.showTab){return window.WBAppShellController.showTab(tab,{reason:'legacy-switchTab-api'})}
  return legacySwitchTabFallback(tab)
}


function openAddSongMenu(e){var m=qs('bs-add-song-menu');if(!m)return;if(e&&e.preventDefault)e.preventDefault();m.classList.add('open');m.setAttribute('aria-hidden','false')}
function closeAddSongMenu(){var m=qs('bs-add-song-menu');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}}
function songEditorCtx(){return {qs:qs,qsa:qsa,qv:qv,normalizeKeyName:normalizeKeyName,formatChartHtml:formatChartHtml,updateSongEditorPreview:updateSongEditorPreview,normalizeImportedSong:normalizeImportedSong}}
function clearSongForm(){return SongEditorImportController.clearSongForm?SongEditorImportController.clearSongForm(songEditorCtx()):null}
function fillSongForm(song){return SongEditorImportController.fillSongForm?SongEditorImportController.fillSongForm(song,songEditorCtx()):null}
function setSongCategory(cat){return SongEditorImportController.setSongCategory?SongEditorImportController.setSongCategory(cat,songEditorCtx()):null}
function openAddSongModal(song){state.editingSongId=song&&song.id?song.id:null;var m=qs('add-song-modal');if(!m)return;var title=qs('add-song-title'),save=qs('song-form-save'),del=qs('song-form-delete');if(title)title.textContent=state.editingSongId?'Edit song':'Add song';if(save)save.textContent='Save';if(del)del.style.display=state.editingSongId?'block':'none';if(song)fillSongForm(song);else clearSongForm();setSongEditorPane('edit');m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){focusIfPresent('song-form-title')},60)}
function closeAddSongModal(){var m=qs('add-song-modal');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}state.editingSongId=null}
function setSongEditorPane(mode){return SongEditorImportController.setSongEditorPane?SongEditorImportController.setSongEditorPane(mode,songEditorCtx()):null}
function updateSongEditorPreview(){return SongEditorImportController.updateSongEditorPreview?SongEditorImportController.updateSongEditorPreview(songEditorCtx()):null}
function resetEditorHistory(v){return SongEditorImportController.resetEditorHistory?SongEditorImportController.resetEditorHistory(v,songEditorCtx()):null}
function pushEditorHistory(){return SongEditorImportController.pushEditorHistory?SongEditorImportController.pushEditorHistory(songEditorCtx()):null}
function updateEditorUndoRedo(){return SongEditorImportController.updateEditorUndoRedo?SongEditorImportController.updateEditorUndoRedo(songEditorCtx()):null}
function editorUndo(){return SongEditorImportController.editorUndo?SongEditorImportController.editorUndo(songEditorCtx()):null}
function editorRedo(){return SongEditorImportController.editorRedo?SongEditorImportController.editorRedo(songEditorCtx()):null}
function chartTextarea(){return SongEditorImportController.chartTextarea?SongEditorImportController.chartTextarea(songEditorCtx()):qs('song-form-chart')}
function insertAtChart(text){return SongEditorImportController.insertAtChart?SongEditorImportController.insertAtChart(text,songEditorCtx()):null}
function getNextEditorSectionNumber(label){return SongEditorImportController.getNextEditorSectionNumber?SongEditorImportController.getNextEditorSectionNumber(label,songEditorCtx()):null}
function insertSectionLabel(label){return SongEditorImportController.insertSectionLabel?SongEditorImportController.insertSectionLabel(label,songEditorCtx()):null}
function insertChordLine(){return SongEditorImportController.insertChordLine?SongEditorImportController.insertChordLine(songEditorCtx()):null}
function sectionBoundsAtCursor(){return SongEditorImportController.sectionBoundsAtCursor?SongEditorImportController.sectionBoundsAtCursor(songEditorCtx()):{start:0,end:0,text:''}}
function duplicateCurrentSection(){return SongEditorImportController.duplicateCurrentSection?SongEditorImportController.duplicateCurrentSection(songEditorCtx()):null}
function normalizeEditorSpacing(){return SongEditorImportController.normalizeEditorSpacing?SongEditorImportController.normalizeEditorSpacing(songEditorCtx()):null}

async function pasteChordsFromClipboard(){try{var t=await navigator.clipboard.readText();if(t)insertAtChart(t)}catch(e){showToast('Clipboard unavailable in this viewer')}}
function normalizeImportTitle(v){return SongEditorImportController.normalizeImportTitle?SongEditorImportController.normalizeImportTitle(v):String(v||'').toLowerCase().trim()}
function normalizeImportArtist(v){return SongEditorImportController.normalizeImportArtist?SongEditorImportController.normalizeImportArtist(v):String(v||'').toLowerCase().trim()}
function normalizeSongCode(v){return SongEditorImportController.normalizeSongCode?SongEditorImportController.normalizeSongCode(v):String(v||'').trim().toUpperCase()}
function importCodeNext(){return SongEditorImportController.importCodeNext?SongEditorImportController.importCodeNext(songs):('L'+String((songs||[]).length+1).padStart(3,'0'))}
function safeTitleFromUrl(url){return SongEditorImportController.safeTitleFromUrl?SongEditorImportController.safeTitleFromUrl(url):'Imported song'}
function normalizeImportedSong(raw,kind){raw=raw||{};var chart=String(raw.chart||raw.lyrics||raw.body||raw.content||raw.text||'').replace(/\r\n?/g,'\n').trim();if(kind==='ug')chart=ugCleanChordSheetText(chart);var key=detectImportKey([raw.key,raw.originalKey,raw.scale,chart].filter(Boolean).join('\n'))||'C';var title=String(raw.title||raw.name||'').trim();var artist=String(raw.artist||raw.author||raw.writer||'').trim();if(!raw._parsed && chart && (!title||!artist)){var parsed=parseImportedText((title?title+'\n':'')+(artist?artist+'\n':'')+chart,kind||'file');title=title||parsed.title;artist=artist||parsed.artist;chart=chart||parsed.chart;key=raw.key||parsed.key||key}var cat=raw.cat||raw.category||(kind==='sop'?'malayalam':'english');return {title:title||'Imported song',artist:artist||'',author:artist||'',code:String(raw.code||'').trim(),key:key||'C',cat:cat==='malayalam'?'malayalam':'english',chart:chart||'',bpm:String(raw.bpm||'').trim(),timeSig:String(raw.timeSig||raw.timeSignature||raw.time||'').trim(),spotifyUrl:String(raw.spotifyUrl||raw.spotify||'').trim(),youtubeUrl:String(raw.youtubeUrl||raw.youtube||'').trim(),source:'local',importSource:kind||raw.importSource||'file',sourceUrl:String(raw.url||raw.sourceUrl||'').trim(),importId:String(raw.id||raw.importId||'').trim(),selected:raw.selected!==false}}
function songPayloadFromForm(){return SongEditorImportController.songPayloadFromForm?SongEditorImportController.songPayloadFromForm(songEditorCtx()):normalizeImportedSong({},'editor')}
function validateSongPayload(song){return SongEditorImportController.validateSongPayload?SongEditorImportController.validateSongPayload(song):''}
function songCommitModel(){return {localSongs:localSongs,songs:songs}}
function commitSongPayload(song,replaceId){return SongEditorImportController.commitSongPayload?SongEditorImportController.commitSongPayload(song,replaceId,songCommitModel(),{normalizeImportedSong:normalizeImportedSong,rebuildSongsCache:rebuildSongsCache,songsGetter:function(){return songs}}):null}
function songImportDestinationCtx(){return {document:document,qs:qs,qv:qv,esc:esc,state:state,adminUnlocked:function(){return !!adminUnlocked},getSongs:function(){return songs},getLocalSongs:function(){return localSongs},setLocalSongs:function(v){localSongs=v||[]},getFirebaseSongs:function(){return firebaseSongs},setFirebaseSongs:function(v){firebaseSongs=v||[]},getRecentIds:function(){return recentIds},setRecentIds:function(v){recentIds=v||[]},normalizeImportedSong:normalizeImportedSong,normalizeUgImportedSong:normalizeUgImportedSong,normalizeFirebaseSong:normalizeFirebaseSong,commitSongPayload:commitSongPayload,mergeSongSources:mergeSongSources,cloudFirestorePaths:cloudFirestorePaths,firebaseRealtimeDb:firebaseRealtimeDb,firebaseSongPathKey:firebaseSongPathKey,persistFirebaseSongsCache:persistFirebaseSongsCache,persistSongs:persistSongs,persistRecents:persistRecents,rebuildSongsCache:rebuildSongsCache,renderLibrary:renderLibrary,renderSettings:renderSettings,renderSongSheet:renderSongSheet,closeAddSongModal:closeAddSongModal,closeImportPages:closeImportPages,closeImportDuplicateReview:closeImportDuplicateReview,showToast:showToast,closeSheetElement:closeSheetElement,isFirebaseSong:isFirebaseSong,updateFirebaseSongRemote:updateFirebaseSongRemote,cacheFirebaseSong:cacheFirebaseSong,renderImportResults:renderImportResults,setImportedDraft:setImportedDraft}}
function saveManualSongToDestination(payload,dest){return SongImportDestinationController.saveManualSongToDestination?SongImportDestinationController.saveManualSongToDestination(payload,dest,songImportDestinationCtx()):Promise.resolve(null)}
function saveManualNewSong(payload){return SongImportDestinationController.saveManualNewSong?SongImportDestinationController.saveManualNewSong(payload,songImportDestinationCtx()):saveManualSongToDestination(payload,'local')}
function saveManualEditedSong(payload,existing){return SongImportDestinationController.saveManualEditedSong?SongImportDestinationController.saveManualEditedSong(payload,existing,songImportDestinationCtx()):Promise.resolve(null)}
var songFormSaveLock=false;
function saveSongFromForm(){
  if(songFormSaveLock)return;
  var payload=songPayloadFromForm();
  var err=validateSongPayload(payload);
  if(err){showToast(err);return}
  songFormSaveLock=true;
  function unlockSoon(){setTimeout(function(){songFormSaveLock=false},650)}
  try{
    if(state.editingSongId){
      var existing=songs.find(function(x){return x.id===state.editingSongId});
      if(!existing){songFormSaveLock=false;showToast('Song not found');return}
      var result=saveManualEditedSong(payload,existing);
      if(result&&typeof result.finally==='function')result.finally(unlockSoon);else unlockSoon();
      return;
    }
    var resultNew=saveManualNewSong(payload);
    if(resultNew&&typeof resultNew.finally==='function')resultNew.finally(unlockSoon);else unlockSoon();
  }catch(e){
    songFormSaveLock=false;
    throw e;
  }
}
function deleteSongFromEditor(){
  if(!state.editingSongId)return;
  var s=songs.find(function(x){return x.id===state.editingSongId});if(!s)return;
  if(!isEditableLocalSong(s)){showToast('Firebase songs are managed from Library admin tools');return}
  var id=state.editingSongId;
  return appConfirm('Delete this song?',{title:'Delete song',detail:'This removes the song from this device.\n\n'+songUsageImpactText(id),confirmText:'Delete',danger:true}).then(function(ok){
    if(!ok)return;
    var snap=dataSafetySnapshot('delete song');
    localSongs=localSongs.filter(function(x){return x.id!==id});delete songMemory[id];rebuildSongsCache();personalSets.forEach(function(set){set.items=(set.items||[]).filter(function(it){return it.type!=='song'||it.songId!==id});syncSetCounts(set)});workspaceState.sets.forEach(function(set){set.items=(set.items||[]).filter(function(it){return it.type!=='song'||it.songId!==id});workspaceSetCounts(set)});persistSongs();persistSongMemory();persistSets();persistWorkspace();renderLibrary();renderPersonalHome(false);renderWorkspaceSetLists();closeAddSongModal();closeSongView();offerDataUndo('Song deleted',snap)
  });
}
function exactImportUpdateMatch(draft){return SongEditorImportController.exactImportUpdateMatch?SongEditorImportController.exactImportUpdateMatch(draft,songs):null}
function importDraftReviewStatus(draft){return SongEditorImportController.importDraftReviewStatus?SongEditorImportController.importDraftReviewStatus(draft,songs):{kind:'new',label:'New',match:null}}
function importDraftStatusCounts(rows){return SongEditorImportController.importDraftStatusCounts?SongEditorImportController.importDraftStatusCounts(rows,songs):{new:0,duplicate:0,updated:0,skipped:0}}
function findImportDuplicates(draft){return SongEditorImportController.findImportDuplicates?SongEditorImportController.findImportDuplicates(draft,songs):[]}
var importDuplicateQueue=null;
function saveImportedSongBatch(drafts,opts){var plan=SongEditorImportController.prepareImportedSongBatch?SongEditorImportController.prepareImportedSongBatch(drafts,opts||{},{songs:songs,normalizeImportedSong:normalizeImportedSong}):{drafts:drafts||[],dupes:[],opts:opts||{}};if(plan.toast){showToast(plan.toast);return}if(plan.dupes&&plan.dupes.length){openImportDuplicateReview(plan.drafts,plan.dupes,plan.opts||{});return}commitImportedDrafts(plan.drafts,plan.opts||{})}
function commitImportedDrafts(drafts,opts){return SongImportDestinationController.commitImportedDrafts?SongImportDestinationController.commitImportedDrafts(drafts,opts||{},songImportDestinationCtx()):null}
function openImportDuplicateReview(allDrafts,dupes,opts){importDuplicateQueue={all:allDrafts,dupes:dupes,opts:opts||{}};var root=qs('import-duplicate-review'),list=qs('import-dup-list'),hint=qs('import-dup-hint');if(!root||!list)return;var DS=window.WBDataSafetyController||null,view=SongEditorImportController.duplicateReviewView?SongEditorImportController.duplicateReviewView(allDrafts,dupes,{songs:songs,esc:esc,importReviewCounts:DS&&DS.importReviewCounts,importReviewSummary:DS&&DS.importReviewSummary}):{hint:'Review duplicates',html:''};if(hint)hint.textContent=view.hint;list.innerHTML=view.html;root.classList.add('open');root.setAttribute('aria-hidden','false')}
function closeImportDuplicateReview(){var root=qs('import-duplicate-review');if(root){root.classList.remove('open');root.setAttribute('aria-hidden','true')}importDuplicateQueue=null}
function applyImportDuplicateChoices(){if(!importDuplicateQueue)return;importDuplicateQueue.dupes.forEach(function(item){item.draft._decision=item.decision||'skip'});commitImportedDrafts(importDuplicateQueue.all,importDuplicateQueue.opts||{})}
function openImportPage(id){['bs-ug-import','bs-sop-import','bs-file-import'].forEach(function(x){var el=qs(x);if(el){el.classList.toggle('open',x===id);el.setAttribute('aria-hidden',x===id?'false':'true')}})}
function closeImportPages(){['bs-ug-import','bs-sop-import','bs-file-import'].forEach(function(x){var el=qs(x);if(el){el.classList.remove('open');el.setAttribute('aria-hidden','true')}})}
function closeUgImportShell(){closeImportPages()}function closeFileImportShell(){closeImportPages()}
function openUgImportShell(kind){closeAddSongMenu();if(kind==='sop'){renderImportResults('sop',[],'Search Songs of Praise Malayalam and choose a result.');openImportPage('bs-sop-import');setTimeout(function(){focusIfPresent('sop-search-query')},80);return}renderImportResults('ug',[],'Search Ultimate Guitar and choose a result, or import by direct URL.');openImportPage('bs-ug-import');setTimeout(function(){focusIfPresent('ug-import-query')},80)}
function openFileImportShell(){closeAddSongMenu();openImportPage('bs-file-import')}
function detectImportKey(chart){var m=(chart||'').match(/(?:Key(?:\s+of)?|Original(?:ly)?(?:\s+in)?|Scale)\s*[:\-]?\s*([A-G](?:#|b)?)(?:\s*(m|min|minor))?/i);if(m)return normalizeKeyName(m[1]+(m[2]?'m':''));var lines=(chart||'').split('\n');for(var i=0;i<lines.length;i++){if(lineLooksChord(lines[i])){var tok=(lines[i].trim().split(/\s+/)[0]||'');var cm=tok.match(/^([A-G](?:#|b)?)(m|min|minor)?/i);if(cm)return normalizeKeyName(cm[1]+(cm[2]?'m':''))}}return 'C'}
function cleanMetadataLine(line){return /^(capo|key|tuning|difficulty|rating|strumming|artist|song|album|submitted|ultimate-guitar|songsofpraise|transpose)\b/i.test(String(line||'').trim())}
function normalizeSectionLine(line){var t=String(line||'').trim().replace(/^\[|\]$/g,'');if(isSectionTag(t))return '['+t.replace(/\s+/g,' ')+']';if(/^(intro|verse|chorus|bridge|tag|outro|interlude|pre[- ]?chorus|instrumental|ending)(\s*\d*)?/i.test(t))return '['+t.replace(/^([a-z])/i,function(x){return x.toUpperCase()}).replace(/pre chorus/i,'Pre-Chorus')+']';return line}
function cleanImportedChart(text){return String(text||'').replace(/\r\n?/g,'\n').split('\n').map(function(line){if(cleanMetadataLine(line))return '';return normalizeSectionLine(line).replace(/[ \t]+$/,'')}).join('\n').replace(/\n{4,}/g,'\n\n\n').trim()}
function decodeHtmlEntitiesPlain(text){var ta=document.createElement('textarea');ta.innerHTML=String(text||'');return ta.value}
function titleCaseImportSection(s){return String(s||'').trim().replace(/[-_]+/g,' ').replace(/\s+/g,' ').replace(/\b\w/g,function(ch){return ch.toUpperCase()}).replace(/Pre Chorus/i,'Pre-Chorus')}
function ugCleanChordSheetText(raw){
  var text=String(raw||'')
    .replace(/\r\n?/g,'\n')
    .replace(/\\r/g,'')
    .replace(/\\n/g,'\n')
    .replace(/\\t/g,'\t')
    .replace(/\u00a0/g,' ');
  text=decodeHtmlEntitiesPlain(text);
  text=text
    .replace(/<br\s*\/?\s*>/gi,'\n')
    .replace(/<\/(div|p|pre|section|article|li)>/gi,'\n')
    .replace(/<[^>]+>/g,'')
    .replace(/\[ch\]([\s\S]*?)\[\/ch\]/gi,'$1')
    .replace(/\[tab\]/gi,'')
    .replace(/\[\/tab\]/gi,'')
    .replace(/\[(?:b|i|u|s|url|\/b|\/i|\/u|\/s|\/url)[^\]]*\]/gi,'');
  text=text.replace(/^\s*\[\s*(intro|verse(?:\s*\d+)?|chorus(?:\s*\d+)?|bridge(?:\s*\d+)?|pre[-\s]?chorus|tag|outro|interlude|instrumental|solo|ending|refrain|turnaround|break)\s*\]\s*$/gim,function(m,a){return '['+titleCaseImportSection(a)+']'});
  var out=[];
  text.replace(/[ \t]+$/gm,'').replace(/^\s*\|\s*/gm,'').split('\n').forEach(function(line){
    var t=line.trim();
    if(/^(edit|add to playlist|favorite|share|download pdf|print|strumming|there is no strumming pattern|create and get|view official tab|we have an official|ultimate guitar pro|shots|shots?\s+watch|comments?|tabs?\s+shots|autoscroll|report bad tab)$/i.test(t))return;
    if(/^\d+\s+views?$/i.test(t)||/^\d+\s+contributors?$/i.test(t))return;
    if(/^\[?\/?(?:ch|tab)\]?$/i.test(t))return;
    out.push(line.replace(/\t/g,'    '));
  });
  return out.join('\n').replace(/\n{4,}/g,'\n\n\n').trim();
}
function normalizeUgImportedSong(raw){
  raw=raw||{};
  var chart=ugCleanChordSheetText(raw.chart||raw.content||raw.lyrics||raw.text||raw.body||'');
  var title=String(raw.title||raw.name||raw.song_name||'').trim()||'Imported song';
  var artist=String(raw.artist||raw.author||raw.artist_name||raw.writer||'').trim();
  var key=detectImportKey([raw.key,raw.originalKey,raw.scale,chart].filter(Boolean).join('\n'))||'C';
  var capo=String(raw.capo||'').trim();
  if(capo&&!/^capo\b/im.test(chart))chart=('Capo '+capo+'\n\n'+chart).trim();
  return normalizeImportedSong({id:raw.id||raw.importId,title:title,artist:artist,key:key,cat:'english',chart:chart,bpm:raw.bpm||raw.tempo,timeSig:raw.timeSig||raw.timeSignature,url:raw.url||raw.sourceUrl,code:raw.code,_parsed:true},'ug');
}
function screenPairCols(){
  try{
    var host=qs('sv-sheet')||qs('ug-import-preview')||qs('sop-preview-body')||qs('song-editor-preview-body');
    var w=(host&&host.clientWidth)||Math.max(260,(window.innerWidth||390)-44);
    var scale=parseFloat(settings&&settings.textSize)||1;
    var charW=9.8*scale;
    try{
      var c=document.createElement('canvas'),ctx=c&&c.getContext&&c.getContext('2d');
      if(ctx){ctx.font=(17*scale)+"px ui-monospace,'SF Mono','SFMono-Regular',Menlo,Monaco,monospace";charW=Math.max(8.8,ctx.measureText('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ').width/52);}
    }catch(_){}
    return Math.max(24,Math.min(44,Math.floor((w-10)/charW)));
  }catch(e){
    return Math.max(26,Math.min(38,Math.floor(((window.innerWidth||390)-54)/9.8)));
  }
}
function visiblePairLen(c,l){return Math.max(String(c||'').replace(/\s+$/,'').length,String(l||'').replace(/\s+$/,'').length)}
function trimPairLead(c,l){var n=0,m=Math.min(c.length,l.length);while(n<m&&/\s/.test(c.charAt(n))&&/\s/.test(l.charAt(n)))n++;return [c.slice(n),l.slice(n)]}
function pairBreakPos(c,l,cols){var len=Math.max(c.length,l.length);if(len<=cols)return len;var min=Math.max(16,Math.floor(cols*.52)),p;for(p=cols;p>=min;p--){if(/\s/.test(l.charAt(p))||/\s/.test(l.charAt(p-1)))return p}for(p=Math.min(len,cols+5);p>cols;p--){if(/\s/.test(l.charAt(p))||/\s/.test(l.charAt(p-1)))return p}for(p=cols;p>=min;p--){if(/\s/.test(c.charAt(p))||/\s/.test(c.charAt(p-1)))return p}return cols}
function wrapAlignedPairForScreen(chord,lyric,cols){
  chord=String(chord||'').replace(/\t/g,'    ');lyric=String(lyric||'').replace(/\t/g,'    ');cols=cols||screenPairCols();
  var rows=[],guard=0;
  while(visiblePairLen(chord,lyric)>cols&&guard++<80){var width=Math.max(chord.length,lyric.length);chord=chord+Array(Math.max(0,width-chord.length)+1).join(' ');lyric=lyric+Array(Math.max(0,width-lyric.length)+1).join(' ');var br=pairBreakPos(chord,lyric,cols);rows.push({c:chord.slice(0,br).replace(/[ \t]+$/,''),l:lyric.slice(0,br).replace(/[ \t]+$/,'')});var rest=trimPairLead(chord.slice(br),lyric.slice(br));chord=rest[0];lyric=rest[1]}
  rows.push({c:chord.replace(/[ \t]+$/,''),l:lyric.replace(/[ \t]+$/,'')});
  return rows.filter(function(r){return r.c.trim()||r.l.trim()});
}

function parseImportedText(raw,kind){raw=String(raw||'').replace(/\r\n?/g,'\n').trim();var lines=raw.split('\n');var title='',artist='',head=[];while(lines.length&&!lines[0].trim())lines.shift();while(lines.length&&head.length<2){var t=lines[0].trim();if(!t||/^\[/.test(t)||lineLooksChord(t)||cleanMetadataLine(t))break;head.push(lines.shift().trim())}title=head[0]||'Imported song';artist=head[1]||(kind==='sop'?'Songs of Praise':'');var chart=cleanImportedChart(lines.join('\n')||raw);return normalizeImportedSong({title:title,artist:artist,key:detectImportKey(raw),cat:kind==='sop'?'malayalam':'english',chart:chart,_parsed:true},kind||'file')}
function parseChordPro(text,name){var title='',artist='',key='',section='',out=[];String(text||'').replace(/\r\n?/g,'\n').split('\n').forEach(function(line){var t=line.trim();var m=t.match(/^\{\s*(title|t)\s*:\s*(.*?)\s*\}$/i);if(m){title=m[2];return}m=t.match(/^\{\s*(artist|subtitle|st)\s*:\s*(.*?)\s*\}$/i);if(m){artist=artist||m[2];return}m=t.match(/^\{\s*(key)\s*:\s*(.*?)\s*\}$/i);if(m){key=m[2];return}m=t.match(/^\{\s*(start_of_|so)?(verse|chorus|bridge|tag|intro|outro|pre[-_ ]?chorus).*?\}$/i);if(m){var label=m[2].replace(/_/g,' ').replace(/^pre/i,'Pre');out.push('['+label.charAt(0).toUpperCase()+label.slice(1)+']');return}if(/^\{\s*end_of_/i.test(t))return;if(/^\{.*\}$/.test(t))return;out.push(line)});var chart=cleanImportedChart(out.join('\n'));return normalizeImportedSong({title:title||String(name||'Imported song').replace(/\.[^.]+$/,''),artist:artist,key:key||detectImportKey(chart),chart:chart,cat:'english'},'file')}
function parseOpenSongXml(text,name){var title='',artist='',lyrics='';try{var doc=(new DOMParser()).parseFromString(text,'text/xml');title=textContentOf(doc,'title')||textContentOf(doc,'name')||'';artist=textContentOf(doc,'author')||textContentOf(doc,'copyright')||'';lyrics=textContentOf(doc,'lyrics')||textContentOf(doc,'song lyrics')||''}catch(e){}lyrics=(lyrics||text).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');return normalizeImportedSong({title:title||String(name||'OpenSong import').replace(/\.[^.]+$/,''),artist:artist,key:detectImportKey(lyrics),chart:cleanImportedChart(lyrics)},'file')}
function parseWorshipBaseJson(text){var data=JSON.parse(text);var arr=Array.isArray(data)?data:(data.songs||data.mySongs||data.library||data.localSongs||[]);if(!Array.isArray(arr)&&data.song)arr=[data.song];if(!Array.isArray(arr))arr=[];return arr.map(function(s){return normalizeImportedSong(s,'file')})}
function parseFileText(text,name){var ext=(name||'').split('.').pop().toLowerCase(),kind=unifiedImportKind;if(ext==='json'||kind==='json'){try{return parseWorshipBaseJson(text)}catch(e){return []}}if(ext==='xml'||kind==='opensong'||/^\s*</.test(text))return [parseOpenSongXml(text,name)];if(ext==='pro'||ext==='onsong'||kind==='onsong'||/\{\s*(title|t|artist|key)\s*:/i.test(text))return [parseChordPro(text,name)];return [parseImportedText((String(name||'').replace(/\.[^.]+$/,'')+'\n'+String(text||'')),'file')]}
function importResultMetaLine(r){r=r||{};var parts=[];var artist=String(r.artist||r.author||r.writer||'').trim();if(artist)parts.push(artist);var key=String(r.key||r.originalKey||r.scale||'').trim();if(key)parts.push(/^key\b/i.test(key)?key:('Key '+key));var bpm=String(r.bpm||r.tempo||'').trim();if(bpm)parts.push(bpm+' BPM');var timeSig=String(r.timeSig||r.timeSignature||'').trim();if(timeSig)parts.push(timeSig);if(r.sourceUrl||r.url)parts.push('URL');return parts.filter(Boolean).join(' · ')}
function renderImportResults(kind,results,emptyMessage){var box=qs(kind==='sop'?'sop-results':'ug-results');if(!box)return;if(!results||!results.length){box.innerHTML='<div class="preview-empty" style="padding:14px">'+esc(emptyMessage||'No results found.')+'</div>';return}box.innerHTML=results.map(function(r,i){var meta=importResultMetaLine(r);return '<button class="ug-result-item" data-import-result="'+i+'" type="button"><span class="pi-copy"><span class="pi-title">'+esc(r.title||'Untitled')+'</span>'+(meta?'<span class="pi-meta">'+esc(meta)+'</span>':'')+'</span><span class="pi-ck">→</span></button>'}).join('');window[kind==='sop'?'_sopResults':'_ugResults']=results}
function setImportedDraft(kind,draft){draft=(kind==='ug')?normalizeUgImportedSong(draft):normalizeImportedSong(draft,kind);draft._wbRawImportChart=draft.chart;window[kind==='sop'?'_sopImportedSong':'_ugImportedSong']=draft;var body=qs(kind==='sop'?'sop-preview-body':'ug-import-preview');var meta=qs(kind==='sop'?'sop-preview-meta':'ug-preview-meta');if(meta)meta.textContent=[draft.artist||draft.author,'Key of '+(draft.key||'C'),draft.timeSig,draft.bpm?draft.bpm+' BPM':''].filter(Boolean).join(' · ');if(body){body.classList.toggle('chords-highlight',!!settings.highlightChordsDefault);body.innerHTML='<div class="preview-empty" style="margin-bottom:8px"><strong>'+esc(draft.title)+'</strong>'+(draft.artist?' · '+esc(draft.artist):'')+'</div>'+formatChartHtml(draft._wbRawImportChart||draft.chart,'chords',draft)}}
function mapBackendSong(raw,kind){return SongImportDestinationController.mapBackendSong?SongImportDestinationController.mapBackendSong(raw,kind,songImportDestinationCtx()):normalizeImportedSong(raw,kind)}
function fetchJson(url){return SongImportDestinationController.fetchJson?SongImportDestinationController.fetchJson(url):fetch(url,{headers:{Accept:'application/json'}}).then(function(r){return r.json()})}
function ugBackendBase(){return SongImportDestinationController.ugBackendBase?SongImportDestinationController.ugBackendBase():'https://worshipbase-ug.worshipbase.workers.dev'}
function sopBackendBase(){return SongImportDestinationController.sopBackendBase?SongImportDestinationController.sopBackendBase():'https://wb-sop.jerinreji81.workers.dev'}
function searchImport(kind){return SongImportDestinationController.searchImport?SongImportDestinationController.searchImport(kind,songImportDestinationCtx()):null}
function importFromUrl(kind){return SongImportDestinationController.importFromUrl?SongImportDestinationController.importFromUrl(kind,songImportDestinationCtx()):null}
function editImported(kind){var draft=window[kind==='sop'?'_sopImportedSong':'_ugImportedSong'];if(!draft){showToast('Import or select a chart first');return}closeImportPages();openAddSongModal();fillSongForm(draft);var note=qs('song-editor-note');if(note)note.textContent='Imported chart loaded. Edit mode preserves the raw source; Preview wraps chord/lyric pairs without rewriting it.'}
function saveImported(kind){var draft=window[kind==='sop'?'_sopImportedSong':'_ugImportedSong'];if(!draft){showToast('Import or select a chart first');return}saveImportedSongBatch([draft],{source:kind})}
var unifiedImportedSongs=[],unifiedImportKind='auto';
function setFileKind(kind){unifiedImportKind=kind||'auto';qsa('[data-file-kind]').forEach(function(b){b.classList.toggle('active',b.dataset.fileKind===unifiedImportKind)})}
function renderFileImportReview(){var box=qs('file-import-review'),list=qs('file-import-song-list'),title=qs('file-import-review-title'),sel=qs('file-import-review-selected'),summary=qs('file-import-review-summary');if(!box||!list)return;box.hidden=!unifiedImportedSongs.length;if(title)title.textContent=unifiedImportedSongs.length+' song'+(unifiedImportedSongs.length===1?'':'s')+' found';var selected=unifiedImportedSongs.filter(function(s){return s.selected!==false}).length;if(sel)sel.textContent=selected+' selected';var counts=importDraftStatusCounts(unifiedImportedSongs);if(summary)summary.innerHTML=['new','duplicate','updated','skipped'].map(function(k){var label={new:'New',duplicate:'Duplicate',updated:'Updated',skipped:'Skipped'}[k];return '<span class="file-import-status-pill '+k+'">'+label+': '+(counts[k]||0)+'</span>'}).join('');list.innerHTML=unifiedImportedSongs.map(function(s,i){var st=importDraftReviewStatus(s),match=st.match?(' · matches '+(st.match.title||'existing song')):'';return '<label class="file-song-row '+esc(st.kind)+'"><input type="checkbox" data-file-song-check="'+i+'" '+(s.selected!==false?'checked':'')+'><span><span class="file-song-title">'+esc(s.title)+'</span><span class="file-song-meta">'+esc((s.artist||'Unknown')+' · Key '+(s.key||'C')+match)+'</span><span class="file-song-status '+esc(st.kind)+'">'+esc(st.label)+'</span></span></label>'}).join('');var body=qs('file-import-preview-body'),meta=qs('file-import-preview-meta');var first=unifiedImportedSongs.find(function(s){return s.selected!==false})||unifiedImportedSongs[0];if(first){var st=importDraftReviewStatus(first);if(meta)meta.textContent=first.title+' · '+st.label+' · Key of '+(first.key||'C');if(body)body.innerHTML=formatChartHtml(first.chart||'', 'chords', first)} }
function chooseUnifiedImportFile(){var input=qs('file-import-file');if(input)input.click()}
function parseZipFile(file){if(!window.JSZip){showToast('ZIP import needs JSZip in the deployed app');return Promise.resolve([])}return window.JSZip.loadAsync(file).then(function(zip){var jobs=[];zip.forEach(function(path,entry){if(!entry.dir&&/\.(txt|pro|onsong|xml|json)$/i.test(path))jobs.push(entry.async('string').then(function(text){return parseFileText(text,path)}))});return Promise.all(jobs).then(function(groups){return groups.flat()})})}
function handleUnifiedFile(file){if(!file)return;var status=qs('file-import-status');if(status)status.textContent=file.name;if(/\.zip$/i.test(file.name)){parseZipFile(file).then(function(songs){unifiedImportedSongs=songs.map(function(s){s.selected=true;return s});renderFileImportReview()});return}var reader=new FileReader();reader.onload=function(){unifiedImportedSongs=parseFileText(String(reader.result||''),file.name).map(function(s){s.selected=true;return s});renderFileImportReview()};reader.readAsText(file)}
function editUnifiedImportedSong(){var song=unifiedImportedSongs.find(function(s){return s.selected!==false})||unifiedImportedSongs[0];if(!song){showToast('Choose a file first');return}closeImportPages();openAddSongModal();fillSongForm(song)}
function saveUnifiedImportedSongs(){var chosen=unifiedImportedSongs.filter(function(s){return s.selected!==false});if(!chosen.length){showToast('Choose a file first');return}saveImportedSongBatch(chosen,{source:'file'})}
function installImportEditorControls(){var menu=qs('bs-add-song-menu');if(menu&&!menu.dataset.ready){menu.dataset.ready='1';menu.addEventListener('click',function(e){if(e.target===menu||e.target.id==='add-song-menu-cancel'){closeAddSongMenu();return}var entry=e.target.closest('[data-add-entry]');if(!entry)return;var k=entry.dataset.addEntry;if(k==='new'){closeAddSongMenu();openAddSongModal()}else if(k==='ug'||k==='sop')openUgImportShell(k);else if(k==='file')openFileImportShell()})}
var modal=qs('add-song-modal');if(modal&&!modal.dataset.editorReady){modal.dataset.editorReady='1';modal.addEventListener('click',function(e){if(e.target===modal||e.target.id==='add-song-close'||e.target.id==='song-form-cancel'){closeAddSongModal();return}if(e.target.id==='song-form-save'){saveSongFromForm();return}var cat=e.target.closest('[data-song-cat]');if(cat){setSongCategory(cat.dataset.songCat);return}var b=e.target.closest('[data-song-editor-mode]');if(b){setSongEditorPane(b.dataset.songEditorMode);return}var sec=e.target.closest('[data-section-insert]');if(sec){insertSectionLabel(sec.dataset.sectionInsert);return}if(e.target.id==='song-form-paste'){pasteChordsFromClipboard();return}if(e.target.id==='song-form-insert-chord-line'){insertChordLine();return}if(e.target.id==='song-form-duplicate-section'){duplicateCurrentSection();return}if(e.target.id==='song-form-clean-spacing'){normalizeEditorSpacing();return}if(e.target.id==='editor-undo-btn'){editorUndo();return}if(e.target.id==='editor-redo-btn'){editorRedo();return}if(e.target.id==='song-form-delete'){deleteSongFromEditor();return}});modal.addEventListener('input',function(e){if(e.target&&e.target.id==='song-form-chart'){pushEditorHistory()}if(e.target&&/^song-form-/.test(e.target.id||''))updateSongEditorPreview()})}
var ug=qs('bs-ug-import');if(ug&&!ug.dataset.ready){ug.dataset.ready='1';ug.addEventListener('click',function(e){if(e.target===ug||e.target.id==='ug-import-cancel'){closeImportPages();return}if(e.target.id==='ug-import-search'){searchImport('ug');return}if(e.target.id==='ug-import-url-btn'){importFromUrl('ug');return}if(e.target.id==='ug-import-edit-btn'){editImported('ug');return}if(e.target.id==='ug-import-save-btn'){saveImported('ug');return}var res=e.target.closest('[data-import-result]');if(res){var arr=window._ugResults||[],draft=arr[parseInt(res.dataset.importResult,10)];SongImportDestinationController.importResultByIdOrUrl?SongImportDestinationController.importResultByIdOrUrl('ug',draft,songImportDestinationCtx()):(draft&&draft.chart?setImportedDraft('ug',draft):null);return}});var ugQuery=qs('ug-import-query'),ugUrl=qs('ug-source-url');if(ugQuery)ugQuery.addEventListener('keydown',function(e){if(e.key==='Enter')searchImport('ug')});if(ugUrl)ugUrl.addEventListener('keydown',function(e){if(e.key==='Enter')importFromUrl('ug')})}
var sop=qs('bs-sop-import');if(sop&&!sop.dataset.ready){sop.dataset.ready='1';sop.addEventListener('click',function(e){if(e.target===sop||e.target.id==='sop-import-cancel'){closeImportPages();return}if(e.target.id==='sop-import-search'){searchImport('sop');return}if(e.target.id==='sop-import-url-btn'){importFromUrl('sop');return}if(e.target.id==='sop-import-edit-btn'){editImported('sop');return}if(e.target.id==='sop-import-save-btn'){saveImported('sop');return}var res=e.target.closest('[data-import-result]');if(res){var arr=window._sopResults||[],draft=arr[parseInt(res.dataset.importResult,10)];SongImportDestinationController.importResultByIdOrUrl?SongImportDestinationController.importResultByIdOrUrl('sop',draft,songImportDestinationCtx()):(draft&&draft.chart?setImportedDraft('sop',draft):null);return}});var sopQuery=qs('sop-search-query'),sopUrl=qs('sop-source-url');if(sopQuery)sopQuery.addEventListener('keydown',function(e){if(e.key==='Enter')searchImport('sop')});if(sopUrl)sopUrl.addEventListener('keydown',function(e){if(e.key==='Enter')importFromUrl('sop')})}
var file=qs('bs-file-import');if(file&&!file.dataset.ready){file.dataset.ready='1';file.addEventListener('click',function(e){if(e.target===file||e.target.id==='file-import-cancel'){closeImportPages();return}var kind=e.target.closest('[data-file-kind]');if(kind){setFileKind(kind.dataset.fileKind);return}if(e.target.id==='file-import-choose'){chooseUnifiedImportFile();return}if(e.target.id==='file-import-edit-btn'){editUnifiedImportedSong();return}if(e.target.id==='file-import-save-btn'){saveUnifiedImportedSongs();return}if(e.target.id==='file-import-select-all'){unifiedImportedSongs.forEach(function(s){s.selected=true});renderFileImportReview();return}if(e.target.id==='file-import-clear'){unifiedImportedSongs.forEach(function(s){s.selected=false});renderFileImportReview();return}});file.addEventListener('change',function(e){if(e.target&&e.target.id==='file-import-file')handleUnifiedFile(e.target.files&&e.target.files[0]);var chk=e.target.closest&&e.target.closest('[data-file-song-check]');if(chk){var i=parseInt(chk.dataset.fileSongCheck,10);if(unifiedImportedSongs[i])unifiedImportedSongs[i].selected=chk.checked;renderFileImportReview()}})}
var dup=qs('import-duplicate-review');if(dup&&!dup.dataset.ready){dup.dataset.ready='1';dup.addEventListener('click',function(e){var DSdom=window.WBDataSafetyDomController||null;if(DSdom&&DSdom.handleImportDuplicateReviewClick&&DSdom.handleImportDuplicateReviewClick(e,{root:dup,queue:importDuplicateQueue},{closeImportDuplicateReview:closeImportDuplicateReview,applyImportDuplicateChoices:applyImportDuplicateChoices}))return;if(e.target.id==='import-dup-cancel'||e.target===dup){closeImportDuplicateReview();return}if(e.target.id==='import-dup-continue'){applyImportDuplicateChoices();return}var choice=e.target.closest('[data-dup-choice]');if(choice&&importDuplicateQueue){var card=choice.closest('[data-dup-index]'),idx=parseInt(card.dataset.dupIndex,10),item=importDuplicateQueue.dupes[idx];if(item){item.decision=choice.dataset.dupChoice;card.querySelectorAll('.import-dup-choice').forEach(function(b){b.classList.toggle('active',b===choice)})}}})}}
function runRebuildInteractionAudit(){
  return {
    editor:{close:!!qs('add-song-close'),save:!!qs('song-form-save'),cancel:!!qs('song-form-cancel'),nowrap:!!(qs('song-form-chart')&&qs('song-form-chart').getAttribute('wrap')==='off'),undoSvg:!!document.querySelector('#editor-undo-btn svg'),redoSvg:!!document.querySelector('#editor-redo-btn svg'),lineLooksChord:typeof lineLooksChord==='function',formButtons:!!qs('add-song-close')&&!!qs('song-form-save')&&!!qs('song-form-cancel')},
    importPages:{ug:!!qs('bs-ug-import'),sop:!!qs('bs-sop-import'),file:!!qs('bs-file-import'),darkSurface:document.body.classList.contains('dark')?'active':'available'},
    routing:{tab:state.tab,setlistEditorId:state.setlistEditorId||null,workspacePanel:workspaceState.panel||null,toolsPanel:state.toolsPanel||'home'},
    activeStates:{theme:activeThemeKey(),darkMode:!!settings.darkMode,defaultSongView:settings.defaultSongView,defaultPdfPreset:settings.defaultPdfPreset}
  };
}
window.WBImportModule={openEditor:openAddSongModal,openUg:function(){openUgImportShell('ug')},openSop:function(){openUgImportShell('sop')},openFile:openFileImportShell,diagnostics:function(){return {addMenu:!!qs('bs-add-song-menu'),editor:!!qs('add-song-modal'),ug:!!qs('bs-ug-import'),sop:!!qs('bs-sop-import'),file:!!qs('bs-file-import'),undoSvg:!!document.querySelector('#editor-undo-btn svg'),redoSvg:!!document.querySelector('#editor-redo-btn svg'),lineLooksChord:typeof lineLooksChord==='function',formButtons:!!qs('add-song-close')&&!!qs('song-form-save')&&!!qs('song-form-cancel')}}};function settingsIcon(name){var r=window.WBSettingsAdminRenderController;return r&&r.settingsIcon?r.settingsIcon(name):'<span class="ss-ico"></span>'}
function settingLabel(key,val){return SettingsController.settingLabel?SettingsController.settingLabel(key,val):(function(){var labels={defaultDisplayKey:{original:'Original'},defaultSongView:{chords:'Chords',lyrics:'Lyrics',nns:'NNS'},defaultPdfPreset:{stage:'Stage chart',rehearsal:'Rehearsal',compact:'Compact print',lyrics:'Lyrics only'},addToSetBehavior:{ask:'Ask',active:'Active set'},defaultBibleVersion:{esv:'ESV'}};return labels[key]&&labels[key][val]||val})()}
function choiceSub(key){return SettingsController.choiceSub?SettingsController.choiceSub(key,settings):(function(){if(key==='defaultDisplayKey')return settings.defaultDisplayKey==='original'?'Show songs in their original key':'All songs open in key of '+settings.defaultDisplayKey;if(key==='defaultSongView')return 'Songs open in '+settingLabel('defaultSongView',settings.defaultSongView)+' view';if(key==='defaultPdfPreset')return 'Open export on '+settingLabel('defaultPdfPreset',settings.defaultPdfPreset)+' preset';if(key==='addToSetBehavior')return 'Ask every time which set to use';if(key==='defaultBibleVersion')return 'Bible opens in '+settingLabel('defaultBibleVersion',settings.defaultBibleVersion);return ''})()}
function settingsChoiceRow(icon,title,key,idbase){var r=window.WBSettingsAdminRenderController;if(r&&r.choiceRow)return r.choiceRow({settings:settings,controller:SettingsController,icon:icon,title:title,key:key,idbase:idbase});return ''}
function settingsToggleRow(icon,title,sub,key,id){var r=window.WBSettingsAdminRenderController;if(r&&r.toggleRow)return r.toggleRow({settings:settings,icon:icon,title:title,sub:sub,key:key,id:id});return ''}
function pickerTitle(key){return {defaultDisplayKey:'Default display key',defaultSongView:'Default song view',defaultPdfPreset:'Default PDF preset',addToSetBehavior:'Add to set list',defaultBibleVersion:'Default Bible version'}[key]||'Choose setting'}
function pickerHelp(key){return {defaultDisplayKey:'When you open a song, it will default to this key instead of its original key. You can always transpose individually.',defaultSongView:'Choose how songs open by default. You can still switch between Lyrics, Chords, and NNS on any song page.',defaultPdfPreset:'Choose which preset the PDF export page opens with by default.',addToSetBehavior:'Choose whether adding a song should ask you every time or use the current active set list automatically.',defaultBibleVersion:'Choose which Bible version opens by default.'}[key]||'Saved to this device'}
function renderSettingsPickerOptions(key){var ids=SettingsController.DEFAULT_PICKER_IDS||{defaultDisplayKey:'defkey-options',defaultSongView:'defsongview-options',defaultPdfPreset:'defpdf-options',addToSetBehavior:'addtoset-options',defaultBibleVersion:'defbible-options'},cid=ids[key];var opts=cid&&qs(cid);if(!opts)return;var r=window.WBSettingsAdminRenderController;if(r&&r.renderPickerOptionsHtml){opts.innerHTML=r.renderPickerOptionsHtml({controller:SettingsController,choices:SETTINGS_CHOICES,key:key,current:settings[key]});return}opts.innerHTML=''}
function renderAllSettingsPickerOptions(){Object.keys(SETTINGS_CHOICES).forEach(renderSettingsPickerOptions)}
function openSettingsPicker(key){var sid={defaultDisplayKey:'bs-defaultkey',defaultSongView:'bs-defaultsongview',defaultPdfPreset:'bs-defaultpdfpreset',addToSetBehavior:'bs-addtosetbehavior',defaultBibleVersion:'bs-defaultbibleversion'}[key];var modal=sid&&qs(sid);if(!modal)return;closeSettingsPicker();renderSettingsPickerOptions(key);modal.classList.add('open');modal.setAttribute('aria-hidden','false')}
function closeSettingsPicker(){qsa('.settings-picker-sheet').forEach(function(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')})}
function downloadTextFile(filename,text,mime){var blob=new Blob([text],{type:mime||'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1200)}
function backupStamp(){return new Date().toISOString().replace(/[:.]/g,'-')}
function backupHistoryKey(){return BackupRestoreController.backupHistoryKey?BackupRestoreController.backupHistoryKey(STORAGE_KEYS):((STORAGE_KEYS&&STORAGE_KEYS.backupHistory)||'wb_rebuild_52_backup_history')}
function readBackupHistory(){return BackupRestoreController.readBackupHistory?BackupRestoreController.readBackupHistory(backupRestoreEnv()):[]}
function recordBackupHistory(entry){return BackupRestoreController.recordBackupHistory?BackupRestoreController.recordBackupHistory(entry,backupRestoreEnv()):null}
function backupHistoryHtml(){return BackupRestoreController.backupHistoryHtml?BackupRestoreController.backupHistoryHtml(backupRestoreEnv()):'<div class="backup-history-empty">No backup history on this device yet.</div>'}
function buildLocalBackupPayload(){return BackupRestoreController.buildLocalBackupPayload?BackupRestoreController.buildLocalBackupPayload(backupRestoreState(),{version:VERSION}):{format:'worshipbase-rebuild-backup',version:VERSION,schema:3,exportedAt:new Date().toISOString(),songs:localSongs,songMemory:songMemory,personalSets:personalSets,recentIds:recentIds,activeSetId:activeSetId,settings:settings,workspaceSummary:{included:false,reason:'Workspace and Firebase library data are shared cloud data and are not part of local backup.'}}}
function backupStateForDataSafety(){return backupRestoreState()}
function backupEnvForDataSafety(){return backupRestoreEnv()}
function buildSongsBackupPayload(){return BackupRestoreController.buildBackupPayload?BackupRestoreController.buildBackupPayload('songs',backupRestoreState(),{version:VERSION}):{format:'worshipbase-rebuild-songs',version:VERSION,schema:3,exportedAt:new Date().toISOString(),songs:localSongs,songMemory:songMemory}}
function buildSetListsBackupPayload(){return BackupRestoreController.buildBackupPayload?BackupRestoreController.buildBackupPayload('sets',backupRestoreState(),{version:VERSION}):{format:'worshipbase-rebuild-setlists',version:VERSION,schema:2,exportedAt:new Date().toISOString(),personalSets:personalSets,activeSetId:activeSetId}}
function buildSettingsBackupPayload(){return BackupRestoreController.buildBackupPayload?BackupRestoreController.buildBackupPayload('settings',backupRestoreState(),{version:VERSION}):{format:'worshipbase-rebuild-settings',version:VERSION,schema:2,exportedAt:new Date().toISOString(),settings:settings,recentIds:recentIds,activeSetId:activeSetId}}
function exportLocalBackup(){return BackupRestoreController.performLocalBackup?BackupRestoreController.performLocalBackup('full',backupRestoreState(),backupRestoreEnv(),{version:VERSION},backupRestoreHelpers()):null}
function exportSongsBackup(){return BackupRestoreController.performLocalBackup?BackupRestoreController.performLocalBackup('songs',backupRestoreState(),backupRestoreEnv(),{version:VERSION},backupRestoreHelpers()):null}
function exportSetListsBackup(){return BackupRestoreController.performLocalBackup?BackupRestoreController.performLocalBackup('sets',backupRestoreState(),backupRestoreEnv(),{version:VERSION},backupRestoreHelpers()):null}
function exportSettingsBackup(){return BackupRestoreController.performLocalBackup?BackupRestoreController.performLocalBackup('settings',backupRestoreState(),backupRestoreEnv(),{version:VERSION},backupRestoreHelpers()):null}
function savePreRestoreSnapshot(){var snap=buildLocalBackupPayload();snap.format='worshipbase-rebuild-pre-restore-snapshot';snap.snapshotAt=new Date().toISOString();writeStoredJson('wb_rebuild_52_pre_restore_snapshot',snap);return snap}
function downloadPreRestoreSnapshot(){var raw=safeGet('wb_rebuild_52_pre_restore_snapshot');if(!raw){showToast('No pre-restore snapshot yet');return}downloadTextFile('worshipbase-pre-restore-snapshot-'+backupStamp()+'.json',raw)}
function backupRestoreState(){return {localSongs:localSongs,songMemory:songMemory,personalSets:personalSets,recentIds:recentIds,activeSetId:activeSetId,settings:settings,songs:songs,cloudState:cloudState,stats:typeof settingsStats==='function'?settingsStats():{}}}
function backupRestoreEnv(){return {storageKeys:STORAGE_KEYS,readStoredObject:readStoredObject,writeStoredJson:writeStoredJson,safeSet:safeSet,safeGet:safeGet,recordBackupHistory:recordBackupHistory,downloadTextFile:downloadTextFile,backupStamp:backupStamp,renderSettings:renderSettings,showToast:showToast,qs:qs,driveStatusValueHtml:driveStatusValueHtml,helpers:backupRestoreHelpers()}}
function backupRestoreHelpers(){return {normalizeImportedSong:normalizeImportedSong,normalizeSearchText:normalizeSearchText,normalizeSetArrayFromBackup:normalizeSetArrayFromBackup,ensureSetShape:ensureSetShape,cloneSettings:cloneSettings}}
function normalizeSetArrayFromBackup(v){return BackupRestoreController.normalizeSetArrayFromBackup?BackupRestoreController.normalizeSetArrayFromBackup(v):(Array.isArray(v)?v:(v&&typeof v==='object'?Object.keys(v).map(function(k){var set=v[k];if(set&&typeof set==='object'&&!set.id)set.id=k;return set}).filter(Boolean):[]))}
function songsFromBackupData(data){return BackupRestoreController.songsFromBackupData?BackupRestoreController.songsFromBackupData(data,backupRestoreHelpers()):[]}
function setsFromBackupData(data){return BackupRestoreController.setsFromBackupData?BackupRestoreController.setsFromBackupData(data,backupRestoreHelpers()):[]}
function settingsFromBackupData(data){return BackupRestoreController.settingsFromBackupData?BackupRestoreController.settingsFromBackupData(data,backupRestoreHelpers()):null}
function songMemoryFromBackupData(data){return BackupRestoreController.songMemoryFromBackupData?BackupRestoreController.songMemoryFromBackupData(data):{}}
function backupSongMemoryItemCount(memory){return BackupRestoreController.backupSongMemoryItemCount?BackupRestoreController.backupSongMemoryItemCount(memory):0}
function backupSetNotesCount(setList){return BackupRestoreController.backupSetNotesCount?BackupRestoreController.backupSetNotesCount(setList,backupRestoreHelpers()):0}
function backupNotesCountForPlan(sets,memory){return BackupRestoreController.backupNotesCountForPlan?BackupRestoreController.backupNotesCountForPlan(sets,memory,backupRestoreHelpers()):0}
function restoreCurrentSummary(){return {songs:localSongs.length,sets:personalSets.length,notes:backupNotesCount(),settings:!!settings,recents:recentIds.length}}
function restoreBackupSummary(plan){plan=plan||{};return {songs:plan.songCount||0,sets:plan.setCount||0,notes:plan.notesCount||0,settings:!!plan.settingsCount,recents:plan.recentCount||0}}
function restoreSummaryValue(value,kind){if(kind==='settings')return value?'Yes':'No';return String(value||0)}
function restoreComparisonRows(plan){var cur=restoreCurrentSummary(),bak=restoreBackupSummary(plan),rows=[['Songs','songs'],['Set lists','sets'],['Notes / cues','notes'],['Settings','settings'],['Recents','recents']];return rows.map(function(row){var label=row[0],key=row[1];return '<tr><th scope="row">'+esc(label)+'</th><td>'+esc(restoreSummaryValue(cur[key],key))+'</td><td>'+esc(restoreSummaryValue(bak[key],key))+'</td></tr>'}).join('')}
function restoreFewerMessages(plan,selection){var cur=restoreCurrentSummary(),bak=restoreBackupSummary(plan),sel=selection||{},msgs=[];if(sel.songs&&bak.songs<cur.songs)msgs.push('songs ('+bak.songs+' in backup vs '+cur.songs+' on this device)');if(sel.sets&&bak.sets<cur.sets)msgs.push('set lists ('+bak.sets+' in backup vs '+cur.sets+' on this device)');if(sel.sets&&bak.notes<cur.notes)msgs.push('notes/cues ('+bak.notes+' in backup vs '+cur.notes+' on this device)');if(sel.recents&&bak.recents<cur.recents)msgs.push('recents ('+bak.recents+' in backup vs '+cur.recents+' on this device)');return msgs}
function restoreFewerWarningContent(plan,selection){var msgs=restoreFewerMessages(plan,selection);return msgs.length?'<div class="backup-review-fewer-title">Selected backup has fewer items</div><div class="backup-review-fewer-copy">Restoring the selected sections may replace more data than the backup contains: '+esc(msgs.join('; '))+'. A safety snapshot will be saved first.</div>':''}
function makeBackupRestorePlan(data){return BackupRestoreController.makeBackupRestorePlan?BackupRestoreController.makeBackupRestorePlan(data,backupRestoreState(),backupRestoreHelpers()):{empty:true,songs:[],sets:[],settings:null,songMemory:{},recentIds:[],songCount:0,setCount:0,settingsCount:0,recentCount:0,notesCount:0,dupeCount:0}}
var backupReviewState=null;
function defaultRestoreSelectionForMode(mode,plan){return BackupRestoreController.defaultRestoreSelectionForMode?BackupRestoreController.defaultRestoreSelectionForMode(mode,plan):{songs:false,sets:false,settings:false,recents:false}}
function restoreSelectionSummary(sel){return BackupRestoreController.restoreSelectionSummary?BackupRestoreController.restoreSelectionSummary(sel):'nothing selected'}
function hasRestoreSelection(sel){return BackupRestoreController.hasRestoreSelection?BackupRestoreController.hasRestoreSelection(sel):!!(sel&&(sel.songs||sel.sets||sel.settings||sel.recents))}
function applyRestoreSelectionFromData(data,selection){var out=BackupRestoreController.applyRestoreSelection?BackupRestoreController.applyRestoreSelection(data,selection,backupRestoreState(),backupRestoreHelpers()):null;if(!out)throw new Error('Restore controller unavailable.');savePreRestoreSnapshot();localSongs=out.localSongs||[];songMemory=out.songMemory||{};personalSets=preserveSetArray?preserveSetArray(out.personalSets||[]):(out.personalSets||[]);activeSetId=out.activeSetId||activeSetId;settings=cloneSettings(out.settings||settings);recentIds=out.recentIds||recentIds;rebuildSongsCache();var sel=out.selection||selection||{};if(sel.recents&&out.plan&&!(out.plan.recentIds||[]).length&&sel.songs)recentIds=songs.slice(0,8).map(function(s){return s.id});if(sel.songs&&!sel.recents)recentIds=songs.slice(0,8).map(function(s){return s.id});persistSongs();persistSongMemory();persistSets();persistRecents();persistSettings();applySettings();renderLibrary();renderPersonalHome();renderSettings();closeBackupCentre();showToast('Restored '+restoreSelectionSummary(sel))}
function restoreEverythingFromData(data){var plan=makeBackupRestorePlan(data);return applyRestoreSelectionFromData(data,defaultRestoreSelectionForMode('full',plan))}

function renderBackupRestoreReview(){
  var st=backupReviewState;if(!st)return;
  var modal=qs('backup-centre-modal'),body=qs('backup-centre-body'),title=qs('backup-centre-title'),done=qs('backup-centre-done');if(!modal||!body)return;
  var p=st.plan||{},sel=st.selection||{},Review=window.WBRestoreReviewController||{};
  if(title)title.textContent='Restore Review';
  if(done)done.textContent='Cancel';
  modal.classList.add('restore-review','open');
  modal.classList.remove('backup-action-result');
  modal.setAttribute('aria-hidden','false');
  try{body.scrollTop=0}catch(e){}
  var counts=Review.counts?Review.counts(p):{songs:p.songCount||0,sets:p.setCount||0,settings:p.settingsCount||0,recents:p.recentCount||0,duplicates:p.dupeCount||0};
  var available=Review.availability?Review.availability(p):{songs:!!p.songCount,sets:!!p.setCount,settings:!!p.settingsCount,recents:!!p.recentCount};
  var fileName=Review.fileLabel?Review.fileLabel(st):(st.fileName||p.title||'Backup file');
  var source=Review.sourceLabel?Review.sourceLabel(st):(st.source==='drive'?'Google Drive':'Local file');
  function option(key,label,sub,count,enabled){var on=!!sel[key];return '<button class="backup-review-option '+(on?'active':'')+' '+(!enabled?'disabled':'')+'" aria-disabled="'+(enabled?'false':'true')+'" data-backup-review-toggle="'+key+'" type="button"><span class="backup-review-check">'+(on?'✓':'')+'</span><span class="backup-review-copy"><span class="backup-review-opt-title">'+esc(label)+'</span><span class="backup-review-opt-sub">'+esc(sub)+'</span></span><span class="backup-review-count">'+esc(count)+'</span></button>'}
  var warning=restoreFewerWarningContent(p,sel);
  body.innerHTML='<section class="backup-review-panel backup-review-source-panel"><div class="backup-review-panel-head"><div><div class="backup-review-panel-title">Backup source</div><div class="backup-review-panel-sub">'+esc(source)+' · '+esc(fileName)+'</div></div><span class="backup-review-source-pill">Review only</span></div><div class="backup-review-panel-sub">Nothing has been changed yet. Compare this device with the selected backup before continuing.</div></section>'+
    '<section class="backup-review-panel backup-review-compare-panel"><div class="backup-review-panel-title">Restore comparison</div><div class="backup-review-panel-sub">Current device vs backup being restored.</div><table class="backup-review-comparison-table"><thead><tr><th>Data</th><th>Current device</th><th>Backup being restored</th></tr></thead><tbody>'+restoreComparisonRows(p)+'</tbody></table></section>'+
    '<section class="backup-review-panel"><div class="backup-review-panel-title">Choose what to restore</div><div class="backup-review-option-stack">'+option('songs','Songs','Replace this device library with songs from this backup.',counts.songs,available.songs)+option('sets','Set lists','Replace personal set lists, service order, notes and cues.',counts.sets,available.sets)+option('settings','Settings','Restore app preferences, display defaults and theme choices.',counts.settings?'Available':'Not found',available.settings)+option('recents','Recents / active set','Restore recent-song and active-set pointers where available.',counts.recents||'None',available.recents)+'</div></section>'+
    '<section class="backup-review-fewer-warning" id="backup-review-fewer-warning"'+(warning?'':' hidden')+'>'+warning+'</section>'+
    '<section class="backup-review-safety"><div class="backup-review-safety-title">Safety snapshot</div><div class="backup-review-safety-copy">Before anything is restored, WorshipBase saves a pre-restore snapshot of the current device so you can download it if needed.</div></section>'+
    '<div class="backup-review-actions backup-review-actions-clean"><button class="backup-review-primary" data-backup-review-action="restore-selected" type="button">Restore selected</button><button class="backup-review-secondary" data-backup-review-action="import-songs" type="button">Import songs through duplicate review</button><button class="backup-review-secondary" data-backup-review-action="select-all" type="button">Select all available</button><button class="backup-review-danger" data-backup-review-action="cancel" type="button">Cancel</button></div><div class="backup-review-muted" id="backup-review-selected-summary">Selected: '+esc(restoreSelectionSummary(sel))+'</div>'
}
function refreshBackupReviewSelection(){if(!backupReviewState)return;var sel=backupReviewState.selection;qsa('[data-backup-review-toggle]').forEach(function(btn){var key=btn.dataset.backupReviewToggle;var on=!!sel[key];btn.classList.toggle('active',on);var check=btn.querySelector('.backup-review-check');if(check)check.textContent=on?'✓':''});var warn=qs('backup-review-fewer-warning');if(warn){var html=restoreFewerWarningContent(backupReviewState.plan,sel);warn.hidden=!html;warn.innerHTML=html}var sum=qs('backup-review-selected-summary');if(sum)sum.textContent='Selected: '+restoreSelectionSummary(sel)}
function openBackupRestoreReview(data,opts){opts=opts||{};var plan=makeBackupRestorePlan(data);if(plan.empty)throw new Error('No songs, set lists, settings, or recents were found in this backup.');backupReviewState={data:data,plan:plan,selection:defaultRestoreSelectionForMode(opts.mode||'full',plan),mode:opts.mode||'full',fileName:opts.fileName||'',source:opts.source||''};renderBackupRestoreReview()}
function handleBackupReviewToggle(key){if(!backupReviewState)return;var p=backupReviewState.plan;if(key==='songs'&&!p.songCount)return;if(key==='sets'&&!p.setCount)return;if(key==='settings'&&!p.settingsCount)return;if(key==='recents'&&!p.recentCount)return;backupReviewState.selection[key]=!backupReviewState.selection[key];refreshBackupReviewSelection()}

function backupNotesCount(){return personalSets.reduce(function(total,set){ensureSetShape(set);return total+Object.keys(set.songNotes||{}).length+Object.keys(set.songCues||{}).length+(set.setNotes?1:0)},0)+Object.keys(songMemory||{}).filter(function(id){var m=songMemory[id]||{};return !!(m.notes||m.cues||m.usualKey||m.practiceStatus)}).length}
function backupPayloadSummary(kind){return BackupRestoreController.buildBackupSummary?BackupRestoreController.buildBackupSummary(backupRestoreState(),kind,backupRestoreHelpers()):{songs:0,sets:0,notes:0,settings:false,recents:0}}
function backupSummaryCells(summary){return BackupRestoreController.backupSummaryCells?BackupRestoreController.backupSummaryCells(summary):''}
function backupActionMeta(action){return BackupRestoreController.actionMeta?BackupRestoreController.actionMeta(action):{title:'Review action',kind:'full',verb:'Continue',body:'Review this action before continuing.'}}
function renderBackupActionConfirm(action){if(BackupRestoreController.renderActionConfirm)return BackupRestoreController.renderActionConfirm(action,backupRestoreState(),backupRestoreEnv())}
function renderBackupActionResult(action,opts){if(BackupRestoreController.renderActionResult)return BackupRestoreController.renderActionResult(action,backupRestoreState(),backupRestoreEnv(),opts)}

function renderBackupLoadingState(titleText,subText){if(BackupRestoreController.renderLoadingState)return BackupRestoreController.renderLoadingState(titleText,subText,backupRestoreEnv())}
function runBackupActionConfirmed(action){ensureBackupInputs();function run(){if(action==='export-full')return exportLocalBackup();if(action==='export-songs')return exportSongsBackup();if(action==='export-sets')return exportSetListsBackup();if(action==='export-settings')return exportSettingsBackup();if(action==='restore-full'){var f=qs('backup-restore-file');if(f)f.click();return}if(action==='restore-songs'){var s=qs('backup-songs-file');if(s)s.click();return}if(action==='restore-sets'){var st=qs('backup-sets-file');if(st)st.click();return}if(action==='restore-settings'){var pref=qs('backup-settings-file');if(pref)pref.click();return}if(action==='snapshot')return downloadPreRestoreSnapshot();if(action==='drive-connect')return connectGoogleDriveInteractive();if(action==='drive-backup')return uploadLatestBackupToDrive();if(action==='drive-restore')return beginRestoreFromDrive();if(action==='drive-snapshot')return downloadDriveSnapshot();if(action==='drive-disconnect')return disconnectGoogleDriveLocal()}var BackupUi=window.WBBackupUiController||{},result=run();if(result&&typeof result.then==='function'){if(BackupUi.trackAction)result=BackupUi.trackAction(action,result,{toast:showToast,alert:window.alert.bind(window)});return result.then(function(v){if(action==='drive-backup')renderBackupActionResult(action,{where:'Google Drive',message:'Backup complete.'});else if(action==='drive-connect')renderBackupActionResult(action,{where:'Google Drive',message:'Connection ready.'});else if(action==='drive-disconnect')renderBackupActionResult(action,{where:'Google Drive',message:'Disconnected on this device.'});return v}).catch(function(err){throw err})}if(action.indexOf('restore-')!==0){renderBackupActionResult(action,{message:action==='snapshot'?'Snapshot downloaded if available.':'Backup file prepared.'})}return result}

function handleBackupReviewAction(action){if(!backupReviewState)return;if(action==='cancel'){backupReviewState=null;openBackupCentre();return}if(action==='select-all'){backupReviewState.selection=defaultRestoreSelectionForMode('full',backupReviewState.plan);refreshBackupReviewSelection();return}if(action==='import-songs'){var imported=backupReviewState.plan.songs;if(!imported.length){showToast('No songs found in this backup');return}saveImportedSongBatch(imported,{source:'file'});backupReviewState=null;closeBackupCentre();showToast(imported.length+' song'+(imported.length===1?'':'s')+' ready to import');return}if(action==='restore-selected'){try{var source=backupReviewState.source;applyRestoreSelectionFromData(backupReviewState.data,backupReviewState.selection);backupReviewState=null;if(source==='drive')setTimeout(function(){uploadLocalSnapshotToDrive()},40)}catch(err){appAlert(err.message||'Restore failed')}}}
function readBackupFile(file,mode){if(!file)return;file.text().then(function(text){var data=JSON.parse(text);if(mode==='songs'){var imported=songsFromBackupData(data);if(!imported.length){appAlert('No valid songs found in this JSON file.');return}saveImportedSongBatch(imported,{source:'file'});showToast(imported.length+' song'+(imported.length===1?'':'s')+' ready to import');return}openBackupRestoreReview(data,{mode:mode||'full',fileName:file.name||''})}).catch(function(err){appAlert(err.message||'Could not read backup JSON.')}).finally(function(){['backup-restore-file','backup-songs-file','backup-sets-file','backup-settings-file'].forEach(function(id){var inp=qs(id);if(inp)inp.value=''})})}
function ensureBackupInputs(){[['backup-restore-file','full'],['backup-songs-file','songs'],['backup-sets-file','sets'],['backup-settings-file','settings']].forEach(function(pair){if(qs(pair[0]))return;var a=document.createElement('input');a.type='file';a.accept='application/json,.json';a.id=pair[0];a.hidden=true;a.addEventListener('change',function(){readBackupFile(this.files&&this.files[0],pair[1])});document.body.appendChild(a)})}
function backupActionIcon(kind){return BackupRestoreController.backupActionIcon?BackupRestoreController.backupActionIcon(kind):''}
function handleBackupAction(action){
  renderBackupActionConfirm(action);
}
function openBackupCentre(){backupReviewState=null;var modal=qs('backup-centre-modal'),body=qs('backup-centre-body'),title=qs('backup-centre-title'),done=qs('backup-centre-done');if(modal)modal.classList.remove('restore-review','backup-action-result');if(!modal||!body)return;ensureBackupInputs();if(title)title.textContent='Backup Centre';if(done)done.textContent='Done';var st=backupRestoreState();st.stats=settingsStats();st.lastBackupAt=safeGet('wb_rebuild_52_last_backup_at');st.preRestoreSnapshot=safeGet('wb_rebuild_52_pre_restore_snapshot');body.innerHTML=BackupRestoreController.backupCentreHtml?BackupRestoreController.backupCentreHtml(st,backupRestoreEnv()):'';modal.classList.add('open');modal.setAttribute('aria-hidden','false')}
function closeBackupCentre(){var modal=qs('backup-centre-modal');if(modal){modal.classList.remove('open','restore-review','backup-action-result');modal.setAttribute('aria-hidden','true')}}
function settingsStats(){var localSongCount=localSongs.length;var noteCount=personalSets.reduce(function(total,set){ensureSetShape(set);return total+Object.keys(set.songNotes||{}).length+Object.keys(set.songCues||{}).length+(set.setNotes?1:0)},0)+Object.keys(songMemory||{}).filter(function(id){var m=songMemory[id]||{};return !!(m.notes||m.cues||m.usualKey||m.practiceStatus)}).length;var driveConnected=!!cloudState.googleDrive.connected,driveReady=driveConnected&&!!(cloudState.googleDrive.fileId||cloudState.googleDrive.lastBackupAt||cloudState.googleDrive.lastModifiedTime);var driveLabel=driveConnected?(driveReady?'Ready':'Connected'):'Not connected';return {localSongs:localSongCount,setLists:personalSets.length,notes:noteCount,drive:driveLabel,driveConnected:driveConnected,driveReady:driveReady,driveDotClass:driveConnected?'ready':'disconnected',driveBackupAt:cloudState.googleDrive.lastBackupAt||cloudState.googleDrive.lastModifiedTime||'',firebase:cloudState.firebase.connected?'Signed in':(cloudState.firebase.configured?'Ready':'Not configured')}}
function driveStatusValueHtml(stats){stats=stats||settingsStats();return '<span class="drive-status-value"><span class="wb-settings-drive-dot '+esc(stats.driveDotClass||'disconnected')+'"></span>'+esc(stats.drive||'Not connected')+'</span>'}
function renderSettings(){var list=qs('settings-list');if(!list)return;var scalePct=SettingsController.textSizePercent?SettingsController.textSizePercent(settings.textSize):Math.round(((parseFloat(settings.textSize)||1)-.85)/(.40)*100);scalePct=Math.max(0,Math.min(100,scalePct));var stats=settingsStats();var renderer=window.WBSettingsAdminRenderController;if(renderer&&renderer.renderSettingsHtml){list.innerHTML=renderer.renderSettingsHtml({settings:settings,controller:SettingsController,palette:THEME_PALETTE,activeThemeKey:activeThemeKey(),stats:stats,scalePct:scalePct,driveStatusHtml:driveStatusValueHtml(stats),adminToolsHtml:adminToolsHtml(),brandMarkHtml:aboutBrandMarkHtml(),version:VERSION,adminUnlocked:adminUnlocked});}else{list.innerHTML='';}
list.onclick=function(e){var ctrl=window.WBSettingsAdminDomController||null;if(ctrl&&ctrl.handleSettingsListClick&&ctrl.handleSettingsListClick(e,{settings:settings,cloudState:cloudState,adminUnlocked:adminUnlocked},{updateSetting:updateSetting,openSettingsPicker:openSettingsPicker,handleAdminAction:handleAdminAction,openBackupCentre:openBackupCentre,appConfirm:appConfirm,dataSafetySnapshot:dataSafetySnapshot,resetLocalData:resetLocalData,offerDataUndo:offerDataUndo,connectGoogleDriveInteractive:connectGoogleDriveInteractive,handleFirebaseSettingsAction:handleFirebaseSettingsAction,lockAdminMode:lockAdminMode,openAdminPinSheet:openAdminPinSheet}))return};
list.oninput=function(e){var ctrl=window.WBSettingsAdminDomController||null;if(ctrl&&ctrl.handleSettingsListInput&&ctrl.handleSettingsListInput(e,{settings:settings},{persistSettings:persistSettings,applySettings:applySettings}))return};
renderAllSettingsPickerOptions();
}

var alphaBubbleTimer=0;
function showAlphaBubble(letter){var b=qs('alpha-bubble');if(!b)return;b.textContent=letter;b.classList.add('show');clearTimeout(alphaBubbleTimer);alphaBubbleTimer=setTimeout(function(){b.classList.remove('show')},460)}

function globalSurfaceNavigationCtx(){return {
  qs:qs,qsa:qsa,routes:routes,
  getState:function(){return state},getWorkspaceState:function(){return workspaceState},getPersonalSets:function(){return personalSets},
  showToastFn:showToast,fastTabSelectFromEventFn:fastTabSelectFromEvent,
  clearLastDataSafetyUndo:function(){lastDataSafetyUndo=null},
  switchTab:switchTab,persistRouteMemory:persistRouteMemory,renderPersonalHome:renderPersonalHome,openSet:openSet,openToolsHome:openToolsHome,openToolsBible:openToolsBible,showToolsPanel:showToolsPanel,
  renderWorkspaceSetLists:renderWorkspaceSetLists,showWorkspacePanel:showWorkspacePanel,workspaceBack:workspaceBack,closeSongViewSmooth:closeSongViewSmooth,
  closers:{
    closeAdminPinSheet:closeAdminPinSheet,closeAdminFirebaseTools:closeAdminFirebaseTools,closeAdminDuplicateReview:closeAdminDuplicateReview,
    closeAddSongMenu:closeAddSongMenu,closeSongMenu:closeSongMenu,closePlaybackOptions:closePlaybackOptions,closePadSheet:closePadSheet,closeChordDiagramsSheet:closeChordDiagramsSheet,
    closeSetOptions:closeSetOptions,closeSetSongPicker:closeSetSongPicker,closeSetKeySheet:closeSetKeySheet,closePersonalNewSheet:closePersonalNewSheet,
    closeWorkspaceNewSheet:closeWorkspaceNewSheet,closeWorkspacePublishSheet:closeWorkspacePublishSheet,closeSettingsPicker:closeSettingsPicker,
    closeBiblePicker:closeBiblePicker,closeBibleVersionPicker:closeBibleVersionPicker,closeImportDuplicateReview:closeImportDuplicateReview,
    closeDuplicateReviewPage:closeDuplicateReviewPage,closeExportPreview:closeExportPreview,closeExportView:closeExportView,closeBackupCentre:closeBackupCentre,
    closeAddSongModal:closeAddSongModal,closeImportPages:closeImportPages,closeFileImportShell:closeFileImportShell,closeUgImportShell:closeUgImportShell,closeSongViewSmooth:closeSongViewSmooth
  }
}}
function showSync(msg,isError){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.showSync(globalSurfaceNavigationCtx(),msg,isError):null}
function showToast(msg){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.showToast(globalSurfaceNavigationCtx(),msg):(function(){var t=qs('toast');if(!t)return;lastDataSafetyUndo=null;t.className='';t.textContent=msg;t.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(function(){t.classList.remove('show');t.textContent=''},1550)})()}
function hideToast(){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.hideToast(globalSurfaceNavigationCtx()):(function(){var t=qs('toast');if(!t)return;clearTimeout(showToast._t);lastDataSafetyUndo=null;t.classList.remove('show','wb-undo-toast');t.textContent=''})()}


var adminUnlocked=false;
function adminPinStorageKey(){return 'wb_rebuild_admin_pin'}
function adminPinValue(){try{return safeGet(adminPinStorageKey())||safeGet('wb_admin_pin')||''}catch(e){return ''}}
function saveAdminPinValue(v){try{safeSet(adminPinStorageKey(),String(v||''))}catch(e){}}
function openAdminPinSheet(){var m=qs('bs-admin-pin'),input=qs('admin-pin-input'),err=qs('admin-pin-error'),hint=qs('admin-pin-hint'),title=qs('admin-pin-title');if(!m)return;if(err)err.style.display='none';if(input)input.value='';if(!adminPinValue()){if(title)title.textContent='Create admin PIN';if(hint)hint.textContent='Create a PIN to unlock admin mode. You will use this from the About logo like v85.'}else{if(title)title.textContent='Admin access';if(hint)hint.textContent='Enter the PIN to unlock song and library management tools.'}m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){if(input)input.focus({preventScroll:true})},80)}
function closeAdminPinSheet(){var m=qs('bs-admin-pin');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}}
function submitAdminPin(){var input=qs('admin-pin-input'),err=qs('admin-pin-error'),v=(input&&input.value||'').trim(),stored=adminPinValue();if(!v){if(err){err.textContent='Enter a PIN.';err.style.display='block'}return}if(!stored){if(v.length<4){if(err){err.textContent='PIN must be at least 4 digits.';err.style.display='block'}return}saveAdminPinValue(v);adminUnlocked=true;closeAdminPinSheet();showToast('Admin mode created and unlocked');renderSettings();return}if(v===stored){adminUnlocked=true;closeAdminPinSheet();showToast('Admin mode unlocked');renderSettings();return}if(err){err.textContent='Incorrect PIN. Try again.';err.style.display='block'}if(input){input.value='';setTimeout(function(){input.focus({preventScroll:true})},50)}}
function lockAdminMode(){
  adminUnlocked=false;
  manageMode=false;
  manageSelectedIds=[];
  document.body.classList.remove('manage-mode');
  closeAdminDuplicateReview&&closeAdminDuplicateReview();
  closeAdminFirebaseTools&&closeAdminFirebaseTools();
  closeDuplicateReviewPage&&closeDuplicateReviewPage();
  closeSheetElement&&closeSheetElement(qs('bs-admin-pin'));
  syncManageToolbar&&syncManageToolbar();
  renderLibrary&&renderLibrary();
  renderSettings&&renderSettings();
  showToast('Admin mode locked');
}



var launchStartedAt=Date.now(),launchHidden=true,launchFailSafeTimer=0;

function libraryHasVisibleSongs(){return !!(songs&&songs.length)}
function launchCanResolveEmpty(){return !!(firebaseRuntime.songsSettled||firebaseRuntime.songsFailed)}
function markUiReady(){unlockUiInteraction()}
function clearLaunchTheme(){try{document.documentElement.classList.remove('wb-launch-light','wb-launch-dark');document.documentElement.style.background='';document.body.style.background='';}catch(e){}}
function scheduleLaunchFailsafe(){unlockUiInteraction()}
function hideLoading(){unlockUiInteraction()}
function showLoading(){unlockUiInteraction()}
function maybeFinishLaunch(reason){unlockUiInteraction()}
window.WBHideLoadingNow=function(){unlockUiInteraction()};


function setSearchScope(scope){state.scope=scope||'smart';var sel=qs('search-scope-select');if(sel&&sel.value!==state.scope)sel.value=state.scope;var labels={smart:'Search songs…',title:'Search titles…',artist:'Search artists…',lyrics:'Search lyrics…'};var names={smart:'Smart search',title:'Search titles only',artist:'Search artists only',lyrics:'Search lyrics only'};var inp=qs('srch-inp');if(inp)inp.placeholder=labels[state.scope]||labels.smart;var wrap=document.querySelector('.search-scope-select-wrap');if(wrap){wrap.classList.toggle('active',state.scope!=='smart');wrap.setAttribute('aria-label',names[state.scope]||names.smart);wrap.setAttribute('title',names[state.scope]||names.smart)}renderLibrary()}
function setSongMode(mode){return SongLifecycleController.setSongMode(songLifecycleCtx(),mode)}
function transposeSong(delta){return SongLifecycleController.transposeSong(songLifecycleCtx(),delta)}
function syncKeySelect(song){return SongLifecycleController.syncKeySelect(songLifecycleCtx(),song)}
function transposeToKey(key){return SongLifecycleController.transposeToKey(songLifecycleCtx(),key)}
function copyChordTokenForLyrics(t){return /^[A-G](?:#|b)?(?:(?:maj|major|min|minor|dim|aug|sus2|sus4|sus|add2|add4|add9|add11|add13|add|no3|no5|no|ø|m|b5|#5|b9|#9|b11|#11|b13|#13|2|4|5|6|7|9|11|13))*(?:\/[A-G](?:#|b)?)?$/i.test(String(t||'').trim())}
function copyChordOnlyLineForLyrics(line){var t=String(line||'').trim();return !!t&&t.split(/\s+/).every(copyChordTokenForLyrics)}
function lyricsOnlyFromChart(chart){
  var out=[];
  String(chart||'').split(/\r?\n/).forEach(function(line){
    var raw=String(line||'');
    if(copyChordOnlyLineForLyrics(raw))return;
    var section=raw.trim().match(/^\[([^\]]+)\]$/);
    if(section&&!copyChordTokenForLyrics(section[1])){out.push(section[1].replace(/\s+/g,' ').trim());return;}
    out.push(raw.replace(/\[([^\]]+)\]/g,'').replace(/[ \t]+$/,''));
  });
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
function copyCurrentLyrics(){
  var s=songs.find(function(x){return x.id===state.selectedId});if(!s)return;
  var txt=lyricsOnlyFromChart(s.chart||'');
  function done(){showToast('Lyrics copied')}
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(done).catch(function(){fallbackCopyText(txt);done()});
      return;
    }
  }catch(e){}
  fallbackCopyText(txt);done();
}
function openSongMenu(){return SongLifecycleController.openSongMenu(songLifecycleCtx())}
function closeSongMenu(){return SongLifecycleController.closeSongMenu(songLifecycleCtx())}

function currentExportSubject(kind){if(kind==='workspace-set'){var ws=workspaceState.sets.find(function(x){return x.id===state.exportWorkspaceSetId})||activeWorkspaceSet();return {kind:'workspace-set',title:(ws&&ws.name)||'Workspace set',meta:ws?workspaceItemCountLabel(ws):'',set:ws}}if(kind==='set'){var set=currentSet();return {kind:'set',title:(set&&set.name)||'Untitled set',meta:set?countLabel(set):'',set:set}}var song=songs.find(function(x){return x.id===state.selectedId})||songs[0];return {kind:'song',title:(song&&song.title)||'Song',meta:(song&&song.artist? song.artist+' · ':'')+'PDF preview',song:song}}
function exportPreviewLines(subject){var owner=keyModel();if(owner&&owner.exportPreviewLines)return owner.exportPreviewLines(subject,keyModelEnv());if((subject.kind==='set'||subject.kind==='workspace-set')&&subject.set){var lines=[];(subject.set.items||[]).slice(0,16).forEach(function(it){if(it.type==='section')lines.push(String(it.label||'SECTION').toUpperCase());else if(it.type==='song'){var s=songs.find(function(x){return x.id===it.songId});if(s)lines.push('• '+s.title+' — '+(s.artist||'')+' ['+(it.setKey||subject.set.setKey||s.key||'')+']')}else lines.push('• '+(it.title||'Service item')+(it.sub||it.note?' — '+(it.sub||it.note):''))});return lines.join('\n')||'Empty set list'}if(subject.song)return stripChartText(subject.song.chart||'').slice(0,560)||'No chart text yet';return 'Nothing to export'}
var ExportPdfRuntimeController=window.WBExportPdfRuntimeController||{};
var exportPageState=ExportPdfRuntimeController.state||{context:'set',preset:'rehearsal',mode:'chords',flow:'continuous',columns:'single',size:'standard',flags:{author:true,key:true,songId:false,cover:false}};
var WBExportPlan=null;
function exportPdfRuntimeBridge(){return {qs:qs,qsa:qsa,esc:esc,settings:settings,state:state,songs:songs,currentExportSubject:currentExportSubject,keyModel:keyModel,keyModelEnv:keyModelEnv,resolveEffectiveKeyForSong:resolveEffectiveKeyForSong,songCode:songCode,transposeChord:transposeChord,chordToNns:chordToNns,activeThemeHex:activeThemeHex,showToast:showToast};}
function exportPdfRuntimeOwner(){var owner=window.WBExportPdfRuntimeController||ExportPdfRuntimeController||{};try{var bridge=exportPdfRuntimeBridge();window.WBExportPdfRuntimeBridge=bridge;if(owner.configure)owner.configure(bridge);}catch(e){}return owner}
function exportPdfSyncPlan(){var o=exportPdfRuntimeOwner();try{if(o.state)exportPageState=o.state;if(o.getPlan)WBExportPlan=o.getPlan()}catch(e){}return WBExportPlan}
function applyExportPresetState(){var o=exportPdfRuntimeOwner();var r=o.applyExportPresetState?o.applyExportPresetState.apply(o,arguments):null;exportPdfSyncPlan();return r}
function exportContextToKind(){var o=exportPdfRuntimeOwner();var r=o.exportContextToKind?o.exportContextToKind.apply(o,arguments):null;exportPdfSyncPlan();return r}
function openExportShell(){var o=exportPdfRuntimeOwner();var r=o.openExportShell?o.openExportShell.apply(o,arguments):null;exportPdfSyncPlan();return r}
function exportCurrentSetShell(){var o=exportPdfRuntimeOwner();var r=o.exportCurrentSetShell?o.exportCurrentSetShell.apply(o,arguments):null;exportPdfSyncPlan();return r}
function openExportView(){var o=exportPdfRuntimeOwner();var r=o.openExportView?o.openExportView.apply(o,arguments):null;exportPdfSyncPlan();return r}
function closeExportView(){var o=exportPdfRuntimeOwner();var r=o.closeExportView?o.closeExportView.apply(o,arguments):null;exportPdfSyncPlan();return r}
function exportSubject(){var o=exportPdfRuntimeOwner();var r=o.exportSubject?o.exportSubject.apply(o,arguments):null;exportPdfSyncPlan();return r}
function exportSetItems(){var o=exportPdfRuntimeOwner();var r=o.exportSetItems?o.exportSetItems.apply(o,arguments):null;exportPdfSyncPlan();return r}
function exportSongKey(){var o=exportPdfRuntimeOwner();var r=o.exportSongKey?o.exportSongKey.apply(o,arguments):null;exportPdfSyncPlan();return r}
function renderExportView(){var o=exportPdfRuntimeOwner();var r=o.renderExportView?o.renderExportView.apply(o,arguments):null;exportPdfSyncPlan();return r}
function syncExportControls(){var o=exportPdfRuntimeOwner();var r=o.syncExportControls?o.syncExportControls.apply(o,arguments):null;exportPdfSyncPlan();return r}
function renderExportMiniPreview(){var o=exportPdfRuntimeOwner();var r=o.renderExportMiniPreview?o.renderExportMiniPreview.apply(o,arguments):null;exportPdfSyncPlan();return r}
function exportDisplayChord(){var o=exportPdfRuntimeOwner();var r=o.exportDisplayChord?o.exportDisplayChord.apply(o,arguments):null;exportPdfSyncPlan();return r}
function escapeTextWithSpaces(){var o=exportPdfRuntimeOwner();var r=o.escapeTextWithSpaces?o.escapeTextWithSpaces.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbExportOptions(){var o=exportPdfRuntimeOwner();var r=o.wbExportOptions?o.wbExportOptions.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSafe(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSafe?o.wbPdfSafe.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfEsc(){var o=exportPdfRuntimeOwner();var r=o.wbPdfEsc?o.wbPdfEsc.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSongCode(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSongCode?o.wbPdfSongCode.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfThemeHex(){var o=exportPdfRuntimeOwner();var r=o.wbPdfThemeHex?o.wbPdfThemeHex.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfRgb(){var o=exportPdfRuntimeOwner();var r=o.wbPdfRgb?o.wbPdfRgb.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfIsChordToken(){var o=exportPdfRuntimeOwner();var r=o.wbPdfIsChordToken?o.wbPdfIsChordToken.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfIsSectionLine(){var o=exportPdfRuntimeOwner();var r=o.wbPdfIsSectionLine?o.wbPdfIsSectionLine.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSectionName(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSectionName?o.wbPdfSectionName.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfChordOnly(){var o=exportPdfRuntimeOwner();var r=o.wbPdfChordOnly?o.wbPdfChordOnly.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfChordTokenCandidatesAt(){var o=exportPdfRuntimeOwner();var r=o.wbPdfChordTokenCandidatesAt?o.wbPdfChordTokenCandidatesAt.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSplitChordCluster(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSplitChordCluster?o.wbPdfSplitChordCluster.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfNormalizeChordLineSpacing(){var o=exportPdfRuntimeOwner();var r=o.wbPdfNormalizeChordLineSpacing?o.wbPdfNormalizeChordLineSpacing.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfLastChordIndex(){var o=exportPdfRuntimeOwner();var r=o.wbPdfLastChordIndex?o.wbPdfLastChordIndex.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfChordSlotFree(){var o=exportPdfRuntimeOwner();var r=o.wbPdfChordSlotFree?o.wbPdfChordSlotFree.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfPlaceChord(){var o=exportPdfRuntimeOwner();var r=o.wbPdfPlaceChord?o.wbPdfPlaceChord.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfTransposeChord(){var o=exportPdfRuntimeOwner();var r=o.wbPdfTransposeChord?o.wbPdfTransposeChord.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfTransposeLine(){var o=exportPdfRuntimeOwner();var r=o.wbPdfTransposeLine?o.wbPdfTransposeLine.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfInlinePair(){var o=exportPdfRuntimeOwner();var r=o.wbPdfInlinePair?o.wbPdfInlinePair.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfChordLyricPair(){var o=exportPdfRuntimeOwner();var r=o.wbPdfChordLyricPair?o.wbPdfChordLyricPair.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfWrapText(){var o=exportPdfRuntimeOwner();var r=o.wbPdfWrapText?o.wbPdfWrapText.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfWrapPair(){var o=exportPdfRuntimeOwner();var r=o.wbPdfWrapPair?o.wbPdfWrapPair.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfProfile(){var o=exportPdfRuntimeOwner();var r=o.wbPdfProfile?o.wbPdfProfile.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfLineHeight(){var o=exportPdfRuntimeOwner();var r=o.wbPdfLineHeight?o.wbPdfLineHeight.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfBlockHeight(){var o=exportPdfRuntimeOwner();var r=o.wbPdfBlockHeight?o.wbPdfBlockHeight.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfAddPairBlocks(){var o=exportPdfRuntimeOwner();var r=o.wbPdfAddPairBlocks?o.wbPdfAddPairBlocks.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSongBlocks(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSongBlocks?o.wbPdfSongBlocks.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfBuildPlan(){var o=exportPdfRuntimeOwner();var r=o.wbPdfBuildPlan?o.wbPdfBuildPlan.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfInstallStyle(){var o=exportPdfRuntimeOwner();var r=o.wbPdfInstallStyle?o.wbPdfInstallStyle.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSvgText(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSvgText?o.wbPdfSvgText.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSvgRect(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSvgRect?o.wbPdfSvgRect.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSvgLine(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSvgLine?o.wbPdfSvgLine.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfRenderPlan(){var o=exportPdfRuntimeOwner();var r=o.wbPdfRenderPlan?o.wbPdfRenderPlan.apply(o,arguments):null;exportPdfSyncPlan();return r}
function openExportPreview(){var o=exportPdfRuntimeOwner();var r=o.openExportPreview?o.openExportPreview.apply(o,arguments):null;exportPdfSyncPlan();return r}
function closeExportPreview(){var o=exportPdfRuntimeOwner();var r=o.closeExportPreview?o.closeExportPreview.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfNum(){var o=exportPdfRuntimeOwner();var r=o.wbPdfNum?o.wbPdfNum.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfStr(){var o=exportPdfRuntimeOwner();var r=o.wbPdfStr?o.wbPdfStr.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfMake(){var o=exportPdfRuntimeOwner();var r=o.wbPdfMake?o.wbPdfMake.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfLine(){var o=exportPdfRuntimeOwner();var r=o.wbPdfLine?o.wbPdfLine.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfRect(){var o=exportPdfRuntimeOwner();var r=o.wbPdfRect?o.wbPdfRect.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfPlanToBlob(){var o=exportPdfRuntimeOwner();var r=o.wbPdfPlanToBlob?o.wbPdfPlanToBlob.apply(o,arguments):null;exportPdfSyncPlan();return r}
function wbPdfSafeFilename(){var o=exportPdfRuntimeOwner();var r=o.wbPdfSafeFilename?o.wbPdfSafeFilename.apply(o,arguments):null;exportPdfSyncPlan();return r}
async function saveCurrentPreviewPdf(){var o=exportPdfRuntimeOwner();var r=o.saveCurrentPreviewPdf?await o.saveCurrentPreviewPdf():null;exportPdfSyncPlan();return r}
function installExportControls(){var o=exportPdfRuntimeOwner();var r=o.installExportControls?o.installExportControls.apply(o,arguments):null;exportPdfSyncPlan();return r}
window.WBExportEngine={buildPlan:wbPdfBuildPlan,renderPlan:wbPdfRenderPlan,save:saveCurrentPreviewPdf};
function updateSongMenuUI(){return SongLifecycleController.updateSongMenuUI(songLifecycleCtx())}
function downloadCurrentSongJson(){
  var s=songs.find(function(x){return x.id===state.selectedId});if(!s)return;
  var data=JSON.stringify({type:'worshipbase-song',version:VERSION,song:s},null,2);
  var blob=new Blob([data],{type:'application/json'});var url=URL.createObjectURL(blob);var a=document.createElement('a');
  a.href=url;a.download=(songCode(s)||'song')+'-'+(s.title||'song').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.json';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove()},250);
}
function focusOwner(){return window.WBSongFocusController||null}
function toggleFocusMode(on){return SongLifecycleController.toggleFocusMode(songLifecycleCtx(),on)}
var sectionRailJumpLock=window.WBSongFocusController?window.WBSongFocusController.createRailLock():{until:0,section:''};
function shortSectionRailLabel(sec){var owner=focusOwner();return owner&&owner.shortSectionLabel?owner.shortSectionLabel(sec):(String(sec||'').replace(/[^A-Za-z0-9]/g,'').slice(0,4).toUpperCase()||'SEC')}
function renderPerformanceRail(){
  var rail=qs('pres-section-rail');if(!rail)return;
  var s=songs.find(function(x){return x.id===state.selectedId});
  var owner=focusOwner();
  var sections=owner&&owner.collectSections?owner.collectSections((s&&s.chart)||'',{isSectionTag:isSectionTag}):[];
  if(!sections.length){rail.classList.remove('show');rail.innerHTML='';return;}
  rail.innerHTML=owner&&owner.renderRailHtml?owner.renderRailHtml(sections,{esc:esc,limit:10}):sections.slice(0,10).map(function(sec,i){return '<button class="pres-section-chip '+(i===0?'active':'')+'" data-section-jump="'+esc(sec)+'" aria-label="Jump to '+esc(sec)+'" title="'+esc(sec)+'" type="button">'+esc(shortSectionRailLabel(sec))+'</button>'}).join('');
  rail.classList.toggle('show',!!state.focusMode);
}
function jumpToSongSection(sec){return SongLifecycleController.jumpToSongSection(songLifecycleCtx(),sec)}
function setActiveRail(sec){var owner=focusOwner();if(owner&&owner.setActiveRail)return owner.setActiveRail(document,sec);qsa('.pres-section-chip').forEach(function(b){b.classList.toggle('active',b.dataset.sectionJump===sec)})}
function updateRailFromScroll(){if(!state.focusMode)return;var owner=focusOwner();if(owner&&owner.lockedSection){var locked=owner.lockedSection(sectionRailJumpLock);if(locked){setActiveRail(locked);return}}else if(sectionRailJumpLock.section&&Date.now()<sectionRailJumpLock.until){setActiveRail(sectionRailJumpLock.section);return}var sc=qs('sv-scroll'),sheet=qs('sv-sheet');if(!sc||!sheet)return;var current=owner&&owner.resolveActiveSection?owner.resolveActiveSection(sc,sheet,{focusMin:54,focusMax:120,focusRatio:.2}):'';if(current)setActiveRail(current)}
function wakeLiveChrome(){return SongLifecycleController.wakeLiveChrome(songLifecycleCtx())}
function toggleLiveToolsExpanded(){return SongLifecycleController.toggleLiveToolsExpanded(songLifecycleCtx())}
function updateLiveToolLabels(){return SongLifecycleController.updateLiveToolLabels(songLifecycleCtx())}
function cycleLiveViewMode(){return SongLifecycleController.cycleLiveViewMode(songLifecycleCtx())}
function stepSongText(delta){return SongLifecycleController.stepSongText(songLifecycleCtx(),delta)}
function toggleFocusCues(){return SongLifecycleController.toggleFocusCues(songLifecycleCtx())}
var performanceState={autoscroll:false,metronome:false,bpm:90,autoRate:.8,autoRaf:0,metroTimer:0,audio:null,lastAutoTs:0,autoCarry:0,metronomePanel:false,autoscrollPanel:false,beat:0,tapTimes:[],wakeLock:null,wakePending:false};
function formatAutoRate(){return 'x'+(performanceState.autoRate||.8).toFixed(1)}
function setSongViewPanelClasses(){return SongLifecycleController.setSongViewPanelClasses(songLifecycleCtx())}
function updatePerformanceUI(){var auto=qs('live-tool-autoscroll'),metro=qs('live-tool-metronome'),play=qs('sv-play-btn'),autoBtn=qs('pres-auto-toggle'),speed=qs('pres-speed-label'),bpm=String(performanceState.bpm||90),metroBtn=qs('metro-toggle'),metroLabel=qs('metro-bpm-label'),liveBpm=qs('live-metro-bpm');if(auto){auto.classList.toggle('active',!!(performanceState.autoscroll||performanceState.autoscrollPanel));auto.classList.toggle('live-tool-autoscrolling',!!performanceState.autoscroll)}if(metro)metro.classList.toggle('active',!!(performanceState.metronome||performanceState.metronomePanel));if(play)play.classList.toggle('on',!!performanceState.autoscroll);if(autoBtn){autoBtn.textContent=performanceState.autoscroll?'❚❚':'▶';autoBtn.setAttribute('aria-label',performanceState.autoscroll?'Pause auto scroll':'Start auto scroll')}if(speed)speed.textContent=formatAutoRate();if(metroBtn){metroBtn.textContent=performanceState.metronome?'❚❚':'▶';metroBtn.setAttribute('aria-label',performanceState.metronome?'Stop metronome':'Start metronome')}if(metroLabel)metroLabel.textContent=bpm;if(liveBpm)liveBpm.textContent=bpm;setSongViewPanelClasses();}
var setPerformanceButtonStates=updatePerformanceUI;
function setAutoscrollPanel(on){performanceState.autoscrollPanel=!!on&&!!state.focusMode;if(performanceState.autoscrollPanel)performanceState.metronomePanel=false;updatePerformanceUI();wakeLiveChrome();}
function toggleAutoscrollPanel(){if(!state.focusMode){toggleAutoscroll();return}setAutoscrollPanel(!performanceState.autoscrollPanel);var live=qs('live-tools');if(live){live.classList.add('collapsed');live.classList.remove('expanded')}var sv=qs('song-view');if(sv)sv.classList.remove('live-tools-expanded')}
function setMetronomePanel(on){performanceState.metronomePanel=!!on&&!!state.focusMode;if(performanceState.metronomePanel)performanceState.autoscrollPanel=false;updatePerformanceUI();wakeLiveChrome();}
function toggleMetronomePanel(){if(!state.focusMode){toggleMetronome();return}setMetronomePanel(!performanceState.metronomePanel);var live=qs('live-tools');if(live){live.classList.add('collapsed');live.classList.remove('expanded')}var sv=qs('song-view');if(sv)sv.classList.remove('live-tools-expanded')}
function performanceAutoStep(ts){if(!performanceState.autoscroll){performanceState.autoRaf=0;return}var sc=qs('sv-scroll');if(sc){if(!performanceState.lastAutoTs)performanceState.lastAutoTs=ts;var dt=Math.min(40,ts-performanceState.lastAutoTs||16);performanceState.lastAutoTs=ts;var max=Math.max(0,sc.scrollHeight-sc.clientHeight);if(sc.scrollTop>=max-1){toggleAutoscroll(false);return}var pxPerSecond=24*(performanceState.autoRate||.8);performanceState.autoCarry+=(pxPerSecond*dt/1000);var whole=performanceState.autoCarry>=1?Math.floor(performanceState.autoCarry):0;if(whole>0){performanceState.autoCarry-=whole;sc.scrollTop=Math.min(max,sc.scrollTop+whole)}}performanceState.autoRaf=requestAnimationFrame(performanceAutoStep)}
function toggleAutoscroll(force){var next=force==null?!performanceState.autoscroll:!!force;performanceState.autoscroll=next;performanceState.lastAutoTs=0;performanceState.autoCarry=0;if(next){if(!performanceState.autoRaf)performanceState.autoRaf=requestAnimationFrame(performanceAutoStep)}else{if(performanceState.autoRaf)cancelAnimationFrame(performanceState.autoRaf);performanceState.autoRaf=0}updatePerformanceUI();wakeLiveChrome();syncWakeLock&&syncWakeLock()}
function adjustAutoscrollSpeed(delta){performanceState.autoRate=Math.max(.1,Math.min(3,Math.round(((performanceState.autoRate||.8)+delta)*10)/10));updatePerformanceUI();showToast('Auto scroll '+formatAutoRate());wakeLiveChrome()}
function metronomeClick(){try{var flash=qs('metro-flash');performanceState.beat=(performanceState.beat||0)+1;var downbeat=performanceState.beat%4===1;if(flash){flash.classList.toggle('downbeat',downbeat);flash.classList.add('on');setTimeout(function(){flash.classList.remove('on','downbeat')},downbeat?150:115)}var AC=window.AudioContext||window.webkitAudioContext;if(!performanceState.audio&&AC)performanceState.audio=new AC();var ctx=performanceState.audio;if(!ctx)return;if(ctx.state==='suspended')ctx.resume();var o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=downbeat?1320:920;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(downbeat ? .16 : .11,ctx.currentTime+.006);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.055);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.06)}catch(e){}}
function scheduleMetronome(){clearInterval(performanceState.metroTimer);if(!performanceState.metronome)return;metronomeClick();performanceState.metroTimer=setInterval(metronomeClick,Math.max(250,Math.round(60000/(performanceState.bpm||90))))}
function toggleMetronome(force){var next=force==null?!performanceState.metronome:!!force;performanceState.metronome=next;if(next){performanceState.beat=0;scheduleMetronome()}else{clearInterval(performanceState.metroTimer);performanceState.metroTimer=0}updatePerformanceUI();wakeLiveChrome();syncWakeLock&&syncWakeLock()}
function adjustMetronomeBpm(delta){performanceState.bpm=Math.max(30,Math.min(260,(performanceState.bpm||90)+delta));if(performanceState.metronome)scheduleMetronome();updatePerformanceUI();wakeLiveChrome()}
function tapMetronomeTempo(){var now=Date.now();performanceState.tapTimes=(performanceState.tapTimes||[]).filter(function(t){return now-t<2200});performanceState.tapTimes.push(now);if(performanceState.tapTimes.length>=2){var diffs=performanceState.tapTimes.slice(1).map(function(t,i){return t-performanceState.tapTimes[i]});var avg=diffs.reduce(function(a,b){return a+b},0)/diffs.length;var bpm=Math.round(60000/avg);if(bpm>=30&&bpm<=260){performanceState.bpm=bpm;if(performanceState.metronome)scheduleMetronome();updatePerformanceUI();}}var flash=qs('metro-flash');if(flash){flash.classList.add('on');setTimeout(function(){flash.classList.remove('on')},110)}wakeLiveChrome()}
function requestWakeLock(){if(performanceState.wakePending||performanceState.wakeLock||!navigator.wakeLock)return;performanceState.wakePending=true;navigator.wakeLock.request('screen').then(function(lock){performanceState.wakeLock=lock;lock.addEventListener&&lock.addEventListener('release',function(){performanceState.wakeLock=null})}).catch(function(){}).finally(function(){performanceState.wakePending=false})}
function releaseWakeLock(){try{if(performanceState.wakeLock){performanceState.wakeLock.release();performanceState.wakeLock=null}}catch(e){performanceState.wakeLock=null}}
function syncWakeLock(){var open=!!(qs('song-view')&&qs('song-view').classList.contains('visible'));var should=open&&((settings&&settings.keepScreenAwakeOnSongs)||state.focusMode||performanceState.autoscroll||performanceState.metronome);if(should)requestWakeLock();else releaseWakeLock()}
function stopPerformanceTools(){if(performanceState.autoscroll){if(performanceState.autoRaf)cancelAnimationFrame(performanceState.autoRaf);performanceState.autoRaf=0;performanceState.autoscroll=false}if(performanceState.metronome){clearInterval(performanceState.metroTimer);performanceState.metroTimer=0;performanceState.metronome=false}performanceState.autoscrollPanel=false;performanceState.metronomePanel=false;releaseWakeLock();updatePerformanceUI()}
window.WBPerformanceModule={toggleAutoscroll:toggleAutoscroll,toggleMetronome:toggleMetronome,adjustAutoscrollSpeed:adjustAutoscrollSpeed,adjustMetronomeBpm:adjustMetronomeBpm,tapTempo:tapMetronomeTempo,stopAll:stopPerformanceTools,diagnostics:function(){return {autoscroll:!!performanceState.autoscroll,autoscrollPanel:!!performanceState.autoscrollPanel,autoRate:performanceState.autoRate,metronome:!!performanceState.metronome,metronomePanel:!!performanceState.metronomePanel,bpm:performanceState.bpm,wakeLock:!!performanceState.wakeLock}}};
document.addEventListener('visibilitychange',function(){if(document.hidden)releaseWakeLock();else syncWakeLock&&syncWakeLock()});
function ensureSetShape(set){return PersonalSetController&&PersonalSetController.ensureSetShape?PersonalSetController.ensureSetShape(set):(function(){if(!set)return set;set.entries=Array.isArray(set.entries)?set.entries:[];set.textItems=Array.isArray(set.textItems)?set.textItems:[];if(!Array.isArray(set.items)){set.items=[];set.entries.forEach(function(id){set.items.push({type:'song',songId:id})});set.textItems.forEach(function(it){set.items.push(it)})}set.songNotes=set.songNotes||{};set.songCues=set.songCues||{};set.setNotes=set.setNotes||'';set.setKey=set.setKey||'';return set})()}
function setStateEnv(){return {personalSets:personalSets,workspaceSets:(workspaceState&&workspaceState.sets)||[],activePersonalSetId:activeSetId,activeWorkspaceSetId:workspaceState&&workspaceState.activeSetId}}
function setStateAdapter(){return window.WBSetStateAdapter||null}
function setEventPersistenceAdapter(){return window.WBSetEventPersistenceAdapter||null}
function commitSetMutation(scope,set,options){
  scope=scope==='workspace'?'workspace':'personal';options=Object.assign({action:'setMutation'},options||{});
  var callbacks={
    syncPersonal:syncSetCounts,
    syncWorkspace:workspaceSetCounts,
    persistPersonal:persistSets,
    persistWorkspace:persistWorkspace,
    renderPersonalEditor:renderSetEditor,
    renderPersonalHome:renderPersonalHome,
    renderSettings:renderSettings,
    renderLibrary:renderLibrary,
    renderSongNotePreview:renderSongNotePreview,
    renderWorkspaceDetail:renderWorkspaceSetDetail,
    renderWorkspaceLists:renderWorkspaceSetLists,
    updateSetOptionsState:updateSetOptionsState,
    refreshOpenSongKeyFromContext:refreshOpenSongKeyFromContext,
    closeSetKey:closeSetKeySheet,
    closeSetAdd:function(){closeSheetElement(qs('bs-set-add'))},
    closeSetNotes:function(){closeSheetElement(qs('bs-set-notes'))},
    closeSongNotes:function(){closeSheetElement(qs('bs-song-notes'))}
  };
  var owner=setEventPersistenceAdapter();
  if(owner&&owner.commit)return owner.commit(scope,set,Object.assign({},options,{callbacks:callbacks}));
  if(scope==='workspace'){workspaceSetCounts(set);persistWorkspace()}else{syncSetCounts(set);persistSets()}
  (options.close||[]).forEach(function(close){if(close==='setKey')closeSetKeySheet();else if(close==='setAdd')closeSheetElement(qs('bs-set-add'));else if(close==='setNotes')closeSheetElement(qs('bs-set-notes'));else if(close==='songNotes')closeSheetElement(qs('bs-song-notes'))});
  (options.refresh||[]).forEach(function(refresh){
    if(refresh==='workspaceDetail')renderWorkspaceSetDetail(set);else if(refresh==='workspaceLists')renderWorkspaceSetLists();
    else if(refresh==='personalEditor')renderSetEditor();else if(refresh==='personalHome')renderPersonalHome();
    else if(refresh==='settings')renderSettings();else if(refresh==='library')renderLibrary();
    else if(refresh==='songNotePreview')renderSongNotePreview();else if(refresh==='setOptions')updateSetOptionsState();
    else if(refresh==='songKey')refreshOpenSongKeyFromContext();
  });
  return {owner:'legacyFallbackCommit',scope:scope,setId:set&&set.id||'',action:options.action||'setMutation'};
}
function currentSet(){var owner=setStateAdapter();if(owner&&owner.activeSet)return owner.activeSet('personal',setStateEnv());return PersonalSetController&&PersonalSetController.currentSet?PersonalSetController.currentSet(personalSets,activeSetId):ensureSetShape(personalSets.find(function(x){return x.id===activeSetId})||personalSets[0])}
function keyModelEnv(){return {songs:songs,settings:settings,personalSets:personalSets,workspaceSets:(workspaceState&&workspaceState.sets)||[],activePersonalSet:currentSet(),activeWorkspaceSet:activeWorkspaceSet&&activeWorkspaceSet(),ensureSetShape:ensureSetShape}}
function keyModel(){return window.WBSetExportModel||null}
function dataSafetyModel(){return window.WBDataSafetyController||null}
function firstSongKey(set){var owner=keyModel();if(owner&&owner.firstSongKey)return owner.firstSongKey(set,keyModelEnv());set=ensureSetShape(set);var first=(set&&set.items||[]).find(function(it){return it&&it.type==='song'});if(first){var song=songs.find(function(x){return x.id===first.songId});if(song&&song.key)return song.key}return 'G'}
function normalizeKeyChoice(k){var owner=keyModel();if(owner&&owner.normalizeKeyChoice)return owner.normalizeKeyChoice(k);k=normalizeKeyName(k);if(!k)return 'original';if(k==='inherit'||k==='original'||k==='default')return k;return isValidMusicKey(k)?k:'original'}
function defaultKeyFor(song,set){var owner=keyModel();if(owner&&owner.defaultKeyFor)return owner.defaultKeyFor(song,set,keyModelEnv());return settings.defaultDisplayKey&&settings.defaultDisplayKey!=='original'?settings.defaultDisplayKey:((song&&song.key)||firstSongKey(set)||'G')}
function configuredAppDefaultKey(){var choice=normalizeKeyChoice(settings&&settings.defaultDisplayKey||'original');return choice&&choice!=='original'&&choice!=='inherit'&&choice!=='default'?choice:null}
function appDefaultKeySubtitle(){return configuredAppDefaultKey()||'Not set'}
function resolveChoiceKey(choice,song,set){var owner=keyModel();if(owner&&owner.resolveChoiceKey)return owner.resolveChoiceKey(choice,song,set,keyModelEnv());choice=normalizeKeyChoice(choice);if(choice==='inherit')return resolveSetKey(set,song);if(choice==='default')return defaultKeyFor(song,set);if(choice==='original')return (song&&song.key)||firstSongKey(set)||'G';return choice}
function resolveSetKey(set,song){var owner=keyModel();if(owner&&owner.resolveSetKey)return owner.resolveSetKey(set,song,keyModelEnv());if(!set)return defaultKeyFor(song,null);set=ensureSetShape(set);return resolveChoiceKey(set.setKey||'original',song,set)}
function itemHasExplicitKey(item){var owner=keyModel();if(owner&&owner.itemHasExplicitKey)return owner.itemHasExplicitKey(item);return !!(item&&item.keyOverride===true&&item.setKey&&item.setKey!=='inherit')}
function resolveSetItemChoice(set,item){var owner=keyModel();if(owner&&owner.resolveSetItemChoice)return owner.resolveSetItemChoice(set,item);if(itemHasExplicitKey(item))return normalizeKeyChoice(item.setKey);return normalizeKeyChoice((set&&set.setKey)||'original')}
function resolveSetItemKey(set,item,song){var owner=keyModel();if(owner&&owner.resolveSetItemKey)return owner.resolveSetItemKey(set,item,song,keyModelEnv());return resolveChoiceKey(resolveSetItemChoice(set,item),song,set)}
function resolveEffectiveKeyForSong(song,ctx){var owner=keyModel();if(owner&&owner.resolveEffectiveKeyForSong)return owner.resolveEffectiveKeyForSong(song,ctx,keyModelEnv());ctx=ctx||null;var set=null,item=null;if(ctx&&ctx.scope==='workspace'){set=(workspaceState.sets||[]).find(function(x){return x.id===ctx.setId})||activeWorkspaceSet()||null}else if(ctx&&ctx.scope==='personal'){set=personalSets.find(function(x){return x.id===ctx.setId})||currentSet()||null}else if(ctx&&ctx.setId){set=personalSets.find(function(x){return x.id===ctx.setId})||(workspaceState.sets||[]).find(function(x){return x.id===ctx.setId})||null}if(ctx&&ctx.item)item=ctx.item;if(!item&&set&&ctx&&typeof ctx.index==='number')item=(set.items||[])[ctx.index]||null;if(set)return resolveSetItemKey(set,item,song);return defaultKeyFor(song,null)}
function setKeyLabel(set){var owner=keyModel();if(owner&&owner.setKeyLabel)return owner.setKeyLabel(set,keyModelEnv());set=ensureSetShape(set);var k=normalizeKeyChoice(set&&set.setKey||'original');if(k==='default')return 'App key';if(k==='original')return 'Original';return 'Key '+resolveSetKey(set)}
function findSongContextSet(ctx){ctx=ctx||state.songContext;if(!ctx)return null;if(ctx.scope==='workspace')return workspaceState.sets.find(function(x){return x.id===ctx.setId})||null;return personalSets.find(function(x){return x.id===ctx.setId})||null}
function resolveSongOpenKey(song,ctx){var set=findSongContextSet(ctx),item=null;if(set&&ctx&&typeof ctx.index==='number')item=(set.items||[])[ctx.index];return set?resolveSetItemKey(set,item,song):defaultKeyFor(song,null)}
function refreshOpenSongKeyFromContext(){var s=songs.find(function(x){return x.id===state.selectedId});if(!s||!state.songContext)return;state.displayKey=resolveSongOpenKey(s,state.songContext);var meta=qs('sv-author');if(meta)meta.innerHTML='<span class="sv-meta-artist">'+esc(s.artist)+'</span><span class="sv-meta-sep"> · </span><span class="sv-meta-key">Originally in '+esc(s.key)+'</span><span class="sv-meta-sep"> · </span><span class="sv-song-code">Song ID: '+esc(songCode(s))+'</span>';renderSongSheet()}
function setHasNotes(set){return PersonalSetController&&PersonalSetController.setHasNotes?PersonalSetController.setHasNotes(set):(function(){set=ensureSetShape(set);return !!(set&&(set.setNotes||Object.keys(set.songNotes||{}).some(function(k){return String(set.songNotes[k]||'').trim()})||Object.keys(set.songCues||{}).some(function(k){return String(set.songCues[k]||'').trim()})))})()}
function syncSetCounts(set){if(PersonalSetController&&PersonalSetController.syncCounts){PersonalSetController.syncCounts(set);return;}set=ensureSetShape(set);if(!set)return;set.entries=(set.items||[]).filter(function(it){return it.type==='song'}).map(function(it){return it.songId});set.textItems=(set.items||[]).filter(function(it){return it.type!=='song'});set.songCount=set.entries.length;set.itemCount=set.textItems.length;set.notes=setHasNotes(set);if(!set.updated)set.updated='Updated now'}
function saveSetAndRefresh(){personalSets.forEach(syncSetCounts);persistSets();var editor=qs('wb-set-editor');var inEditor=editor&&!editor.hidden;if(inEditor){renderSetEditor()}else{renderPersonalHome()}renderSettings();renderLibrary();renderSongNotePreview()}
function handleUnifiedSetOption(act){
  var isWs=state.setOptionsContext==='workspace';
  if(isWs){
    handleWorkspaceSetOption(act);
    if(act!=='add-section'&&act!=='add-text')state.setOptionsContext='personal';
    return;
  }
  if(act==='rename')renameCurrentSet();
  else if(act==='delete')deleteCurrentSet();
  else if(act==='add-section')openSetAddSheet('section','personal');
  else if(act==='add-text')openSetAddSheet('text','personal');
  else if(act==='summary')openSetSummary();
  else if(act==='export')exportCurrentSetShell();
  else if(act==='notes')openSetNotes();
  else if(act==='set-key')openSetKeySheet();
}
function openSetOptions(context){state.setOptionsContext=context==='workspace'?'workspace':'personal';updateSetOptionsState();var m=qs('bs-set-options');if(m){m.dataset.setContext=state.setOptionsContext;m.classList.add('open');m.setAttribute('aria-hidden','false')}}
function closeSetOptions(){closeSheetElement(qs('bs-set-options'))}
function activeWorkspaceSet(){var owner=setStateAdapter();if(owner&&owner.activeSet)return owner.activeSet('workspace',setStateEnv());return WorkspaceSetController&&WorkspaceSetController.activeSet?WorkspaceSetController.activeSet(workspaceState.sets,workspaceState.activeSetId):workspaceState.sets.find(function(x){return x.id===workspaceState.activeSetId})}
function setKeyBadgeText(set,workspace){var label=workspace?workspaceSetKeyLabel(set):setKeyLabel(set);return String(label||'Set default: Original').replace(/^Set default:\s*/i,'DEFAULT: ').replace(/^Set key:\s*/i,'DEFAULT: ')}
function updateSetOptionsState(){var isWs=state.setOptionsContext==='workspace',set=isWs?activeWorkspaceSet():currentSet();var ns=qs('set-options-notes-state'),ks=qs('set-options-key-state'),copy=document.querySelector('#bs-set-options .workspace-only-set-option'),sheet=qs('bs-set-options');if(sheet)sheet.dataset.setContext=isWs?'workspace':'personal';if(copy){copy.hidden=!isWs;copy.style.display=isWs?'grid':'none'}if(ns)ns.textContent=isWs?((set&&set.setNotes)?'SAVED':''):((set&&setHasNotes(set))?'SAVED':'');if(ks)ks.textContent=set?setKeyBadgeText(set,isWs):''}
function keyChoiceButtons(active,includeOriginal,set,item,song){var opts=[],isSong=!!item; if(isSong)opts.push(['inherit','Follow set default',resolveSetKey(set,song)]);opts.push(['original','Original key',(song&&song.key)||firstSongKey(set)||'G']);opts.push(['default','App default key',appDefaultKeySubtitle()]);NOTES.forEach(function(n){opts.push([n,n,'']);});return opts.map(function(o){var wide=(o[0]==='inherit'||o[0]==='original'||o[0]==='default')?' wide':'';return '<button class="key-option-btn'+wide+' '+(String(o[0])===String(active||'original')?'active':'')+'" data-set-key="'+esc(o[0])+'" type="button">'+esc(o[1])+(o[2]?'<span class="key-option-sub">'+esc(o[2])+'</span>':'')+'</button>'}).join('')}
var pendingSetKeyIndex=null,pendingSetKeyScope='personal',pendingSetAddScope='personal';
function activeSetForKeyScope(){return pendingSetKeyScope==='workspace'?activeWorkspaceSet():currentSet()}
function openSetKeySheet(index,scope){pendingSetKeyScope=scope==='workspace'?'workspace':'personal';var set=activeSetForKeyScope();var m=qs('bs-set-key'),box=qs('set-key-options');if(!set||!m||!box)return;if(pendingSetKeyScope==='personal')ensureSetShape(set);else ensureSetShape(set);pendingSetKeyIndex=(typeof index==='number'&&!isNaN(index))?index:null;var item=pendingSetKeyIndex!==null?set.items[pendingSetKeyIndex]:null;var song=item&&item.type==='song'?songs.find(function(x){return x.id===item.songId}):null;var title=qs('set-key-title');if(title)title.textContent=pendingSetKeyIndex!==null?'Song key':'Set default key';var help=m.querySelector('.settings-picker-sub');if(help)help.textContent=pendingSetKeyIndex!==null?'Choose the performance key for this song. Follow set default uses this set’s default key; song choices override the set default.':'Choose the default key for this set. It applies to songs set to Follow set default; individual song keys still override it.';var active=pendingSetKeyIndex!==null?(itemHasExplicitKey(item)?normalizeKeyChoice(item.setKey):'inherit'):normalizeKeyChoice(set.setKey||'original');box.innerHTML=keyChoiceButtons(active,true,set,item,song);m.classList.add('open');m.setAttribute('aria-hidden','false')}
function openWorkspaceSetKeySheet(index){openSetKeySheet(index,'workspace')}
function closeSetKeySheet(){pendingSetKeyIndex=null;pendingSetKeyScope='personal';var m=qs('bs-set-key');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}}
function saveSetKey(k){var set=activeSetForKeyScope();if(!set)return;ensureSetShape(set);k=normalizeKeyChoice(k);var owner=setStateAdapter();if(owner&&owner.setKey){owner.setKey(pendingSetKeyScope,set,pendingSetKeyIndex,k==='inherit'?'inherit':(k||'original'));showToast(pendingSetKeyIndex!==null?(k==='inherit'?'Song follows set default':'Song key updated'):(pendingSetKeyScope==='workspace'?'Workspace set default updated':'Set default updated'));}else if(pendingSetKeyIndex!==null&&pendingSetKeyIndex>=0&&set.items&&set.items[pendingSetKeyIndex]){var item=set.items[pendingSetKeyIndex];if(k==='inherit'){delete item.setKey;delete item.keyOverride;showToast('Song follows set default')}else{item.setKey=k||'original';item.keyOverride=true;showToast('Song key updated')}}else{set.setKey=(k==='inherit'?'original':k)||'original';showToast(pendingSetKeyScope==='workspace'?'Workspace set default updated':'Set default updated')}if(pendingSetKeyScope==='workspace'){commitSetMutation('workspace',set,{action:'setKey',close:['setKey'],refresh:['workspaceDetail','workspaceLists','setOptions','songKey']});return}commitSetMutation('personal',set,{action:'setKey',close:['setKey'],refresh:['personalEditor','settings','library','songKey']})}

function renameCurrentSet(){var set=currentSet();if(!set)return;return appPrompt('Rename set list',set.name||'Untitled set',{title:'Rename set list',confirmText:'Rename'}).then(function(name){name=(name||'').trim();if(!name)return;var owner=setStateAdapter();if(owner&&owner.renameSet)owner.renameSet('personal',set,name);else if(PersonalSetController&&PersonalSetController.renameSet)PersonalSetController.renameSet(set,name);else set.name=name;saveSetAndRefresh();qs('wb-editor-title').textContent=name;showToast('Set renamed')})}
function deleteCurrentSet(){var set=currentSet();if(!set)return;return appConfirm('Delete this set list?',{title:'Delete set list',detail:'This set list has '+countLabel(set)+'. You can undo immediately after deleting.',confirmText:'Delete',danger:true}).then(function(ok){if(!ok)return;var snap=dataSafetySnapshot('delete set list');var next=PersonalSetController&&PersonalSetController.deleteSet?PersonalSetController.deleteSet(personalSets,set.id):{sets:personalSets.filter(function(x){return x.id!==set.id}),activeSetId:null};personalSets=next.sets;activeSetId=next.activeSetId||((personalSets[0]&&personalSets[0].id)||null);persistSets();renderPersonalHome();renderSettings();offerDataUndo('Set deleted',snap)})}
function clearCurrentSet(){var set=currentSet();if(!set)return;return appConfirm('Clear all songs and service items from this set?',{title:'Clear set list',detail:'The set will remain, but '+countLabel(set)+' will be removed. You can undo immediately after clearing.',confirmText:'Clear',danger:true}).then(function(ok){if(!ok)return;var snap=dataSafetySnapshot('clear set list');var owner=setStateAdapter();if(owner&&owner.clearSet)owner.clearSet('personal',set);else if(PersonalSetController&&PersonalSetController.clearSet)PersonalSetController.clearSet(set);else{set.items=[];set.entries=[];set.textItems=[];syncSetCounts(set)}commitSetMutation('personal',set,{action:'clearSet',refresh:['personalEditor','settings','library']});offerDataUndo('Set cleared',snap)})}
var pendingSetAddKind='text',pendingSetEditIndex=null;
function openSetAddSheet(kind,scope){pendingSetEditIndex=null;pendingSetAddScope=scope==='workspace'?'workspace':'personal';pendingSetAddKind=(kind==='section')?'section':'text';var m=qs('bs-set-add');if(!m)return;qsa('[data-set-add-kind]',m).forEach(function(b){b.classList.toggle('active',b.dataset.setAddKind===pendingSetAddKind)});qs('set-add-title').textContent=pendingSetAddKind==='section'?'Add section':'Add service item';var name=qs('set-add-name'),note=qs('set-add-note'),wrap=qs('set-add-note-wrap');if(wrap)wrap.style.display=pendingSetAddKind==='section'?'none':'';if(name){name.value='';name.placeholder=pendingSetAddKind==='section'?'e.g. Opening, Response, Communion':'e.g. Prayer, Scripture reading, Message'}if(note)note.value='';m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){if(name)name.focus({preventScroll:true})},80)}
function openSetItemEditor(index){pendingSetAddScope='personal';var set=currentSet();if(!set||!set.items||!set.items[index])return;var item=set.items[index];pendingSetEditIndex=index;pendingSetAddKind=item.type==='section'?'section':'text';var m=qs('bs-set-add');if(!m)return;qsa('[data-set-add-kind]',m).forEach(function(b){b.classList.toggle('active',b.dataset.setAddKind===pendingSetAddKind)});qs('set-add-title').textContent=pendingSetAddKind==='section'?'Edit section':'Edit service item';var name=qs('set-add-name'),note=qs('set-add-note'),wrap=qs('set-add-note-wrap');if(wrap)wrap.style.display=pendingSetAddKind==='section'?'none':'';if(name){name.value=pendingSetAddKind==='section'?(item.label||''):(item.title||'');name.placeholder=pendingSetAddKind==='section'?'e.g. Opening, Response, Communion':'e.g. Prayer, Scripture reading, Message'}if(note)note.value=item.note||item.sub||'';m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){if(name)name.focus({preventScroll:true})},80)}
function openWorkspaceSetItemEditor(index){
  pendingSetAddScope='workspace';
  var set=activeWorkspaceSet();if(!set||!set.items||!set.items[index])return;
  var item=set.items[index];pendingSetEditIndex=index;pendingSetAddKind=item.type==='section'?'section':'text';
  var m=qs('bs-set-add');if(!m)return;
  qsa('[data-set-add-kind]',m).forEach(function(b){b.classList.toggle('active',b.dataset.setAddKind===pendingSetAddKind)});
  qs('set-add-title').textContent=pendingSetAddKind==='section'?'Edit section':'Edit service item';
  var name=qs('set-add-name'),note=qs('set-add-note'),wrap=qs('set-add-note-wrap');
  if(wrap)wrap.style.display=pendingSetAddKind==='section'?'none':'';
  if(name){name.value=pendingSetAddKind==='section'?(item.label||''):(item.title||'');name.placeholder=pendingSetAddKind==='section'?'e.g. Opening, Response, Communion':'e.g. Prayer, Scripture reading, Message'}
  if(note)note.value=item.note||item.sub||'';
  m.classList.add('open');m.setAttribute('aria-hidden','false');
  setTimeout(function(){if(name)name.focus({preventScroll:true})},80);
}
function saveSetAddItem(){var isWs=pendingSetAddScope==='workspace',set=isWs?activeWorkspaceSet():currentSet();if(!set)return;var name=(qs('set-add-name').value||'').trim();var note=(qs('set-add-note').value||'').trim();if(!name){showToast('Add a title');return;}var owner=setStateAdapter();var edited=pendingSetEditIndex!==null&&set.items&&set.items[pendingSetEditIndex];if(owner&&owner.addOrUpdateSectionOrText){owner.addOrUpdateSectionOrText(isWs?'workspace':'personal',set,pendingSetEditIndex,pendingSetAddKind,name,note);}else if(!isWs&&PersonalSetController){if(edited)PersonalSetController.updateSectionOrText(set,pendingSetEditIndex,pendingSetAddKind,name,note);else PersonalSetController.addSectionOrText(set,pendingSetAddKind,name,note);}else if(isWs&&WorkspaceSetController){if(edited)WorkspaceSetController.updateSectionOrText(set,pendingSetEditIndex,pendingSetAddKind,name,note);else WorkspaceSetController.addSectionOrText(set,pendingSetAddKind,name,note);}else{set.items=set.items||[];if(edited){var item=set.items[pendingSetEditIndex];if(pendingSetAddKind==='section'){item.type='section';item.label=name.toUpperCase();delete item.title;delete item.note;delete item.sub}else{item.type='item';item.title=name;item.note=note;item.sub=note}}else{if(pendingSetAddKind==='section')set.items.push({type:'section',label:name.toUpperCase()});else set.items.push({type:'item',title:name,note:note,sub:note});}}showToast(edited?(pendingSetAddKind==='section'?'Section updated':'Service item updated'):(pendingSetAddKind==='section'?'Section added':'Service item added'));pendingSetEditIndex=null;if(isWs){commitSetMutation('workspace',set,{action:'addOrUpdateSectionOrText',close:['setAdd'],refresh:['workspaceDetail','workspaceLists','settings']});pendingSetAddScope='personal';return}commitSetMutation('personal',set,{action:'addOrUpdateSectionOrText',close:['setAdd'],refresh:['personalEditor','settings']})}
var pendingSetNotesScope='personal';
function activeSetForNotesScope(){return pendingSetNotesScope==='workspace'?activeWorkspaceSet():currentSet()}
function saveSetNotes(){var set=activeSetForNotesScope();if(!set)return;var notes=(qs('set-notes-editor').value||'').trim();var owner=setStateAdapter();if(owner&&owner.setSetNotes)owner.setSetNotes(pendingSetNotesScope,set,notes);else{set.setNotes=notes;set.updated='Updated now'}if(pendingSetNotesScope==='workspace'){commitSetMutation('workspace',set,{action:'setNotes',close:['setNotes'],refresh:['workspaceDetail','workspaceLists','settings']});showToast('Workspace set notes saved');pendingSetNotesScope='personal';return}commitSetMutation('personal',set,{action:'setNotes',close:['setNotes'],refresh:['personalEditor','settings','songNotePreview']});showToast('Set notes saved')}
function openSetNotes(scope){pendingSetNotesScope=scope==='workspace'?'workspace':'personal';var set=activeSetForNotesScope();var ed=qs('set-notes-editor'),m=qs('bs-set-notes');if(ed)ed.value=(set&&set.setNotes)||'';if(m){m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){if(ed)ed.focus({preventScroll:true})},80)}}
function openSongNotesSheet(){return SongLifecycleController.openSongNotesSheet(songLifecycleCtx())}
function saveSongNotes(){return SongLifecycleController.saveSongNotes(songLifecycleCtx())}
function currentSongNoteScope(){return SongLifecycleController.currentSongNoteScope(songLifecycleCtx())}
function currentSongNoteSet(){return SongLifecycleController.currentSongNoteSet(songLifecycleCtx())}
function selectedSongHasNotes(){return SongLifecycleController.selectedSongHasNotes(songLifecycleCtx())}
function normalizeCueText(v){return SongLifecycleController.normalizeCueText(v)}
function stripInlineChordsText(v){return SongLifecycleController.stripInlineChordsText(v)}
function parseSongCueMarkers(set,s){return SongLifecycleController.parseSongCueMarkers(set,s)}
function cueMatchesNode(cue,nodeText,lineIndex){return SongLifecycleController.cueMatchesNode(cue,nodeText,lineIndex)}
function applySongCueMarkersToSheet(sheet,set,s){return SongLifecycleController.applySongCueMarkersToSheet(songLifecycleCtx(),sheet,set,s)}
function renderSongNotePreview(){return SongLifecycleController.renderSongNotePreview(songLifecycleCtx())}
function syncSongNotesQuickIndicator(){return SongLifecycleController.syncSongNotesQuickIndicator(songLifecycleCtx())}
function syncSetNotesQuickIndicator(){return SongLifecycleController.syncSetNotesQuickIndicator(songLifecycleCtx())}
function openSetSongPicker(){var m=qs('bs-set-song-picker');if(!m)return;state.setSongPickerTarget='personal';state.setOptionsContext='personal';state.exportWorkspaceSetId=null;state.setSongPickerFilter='all';var title=qs('set-song-picker-title');if(title)title.textContent='Add song';var input=qs('set-song-search');if(input)input.value='';renderSetSongPickerList('');m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){if(input)input.focus({preventScroll:true})},80)}
function openWorkspaceSongPicker(){var m=qs('bs-set-song-picker'),set=workspaceState.sets.find(function(x){return x.id===workspaceState.activeSetId});if(!m||!set)return;state.setSongPickerTarget='workspace';state.setSongPickerFilter='all';var title=qs('set-song-picker-title');if(title)title.textContent='Add song to Workspace';var input=qs('set-song-search');if(input)input.value='';renderSetSongPickerList('');m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){if(input)input.focus({preventScroll:true})},80)}
function closeSetSongPicker(){closeSheetElement(qs('bs-set-song-picker'))}
function renderSetSongPickerList(query){
  var list=qs('set-song-picker-list'),target=state.setSongPickerTarget==='workspace'?'workspace':'personal',set=target==='workspace'?workspaceState.sets.find(function(x){return x.id===workspaceState.activeSetId}):currentSet();if(!list||!set)return;if(target==='personal')ensureSetShape(set);
  var q=normalizeSearchText(query||''),filter=state.setSongPickerFilter||'all';
  var currentIds=target==='workspace'?(set.items||[]).filter(function(it){return it&&it.type==='song'}).map(function(it){return it.songId}):(set.entries||[]);
  qsa('[data-set-song-filter]',qs('set-song-picker-filters')).forEach(function(chip){chip.classList.toggle('active',chip.dataset.setSongFilter===filter)});
  var filtered=songs.filter(function(s){
    if(filter==='english'&&s.cat!=='english')return false;
    if(filter==='malayalam'&&s.cat!=='malayalam')return false;
    if(!q)return true;
    return textMatchesQuery(s.title,q)||textMatchesQuery(s.artist,q)||textMatchesQuery(songCode(s),q)||textMatchesQuery(stripChartText(s.chart||''),q)
  }).slice(0,80);
  list.innerHTML=filtered.length?filtered.map(function(s){
    var added=currentIds.indexOf(s.id)>=0, lang=s.cat==='malayalam'?'Malayalam':'English', check=added?'<svg fill="none" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>':'';
    return '<button class="setpick-song '+(added?'added':'')+'" data-picker-song="'+esc(s.id)+'" type="button"><span class="setpick-main"><span class="setpick-title">'+esc(s.title)+'</span><span class="setpick-meta">'+esc(s.artist||'')+' · '+esc(lang)+' · '+esc(s.key||'')+' · '+esc((set&&set.name)||'Set list')+'</span></span><span class="setpick-state">'+check+'</span></button>'
  }).join(''):'<div class="sl-empty"><strong>No songs found</strong><div>Try another search.</div></div>'
}
function addSongToActiveSet(songId){
  if(state.setSongPickerTarget==='workspace')return addSongToWorkspaceSet(songId);
  var set=currentSet(),s=songs.find(function(x){return x.id===songId});if(!set||!s)return;ensureSetShape(set);
  var result=PersonalSetController&&PersonalSetController.toggleSong?PersonalSetController.toggleSong(set,songId):(function(){var idx=(set.items||[]).findIndex(function(it){return it&&it.type==='song'&&it.songId===songId});if(idx>=0){set.items.splice(idx,1);syncSetCounts(set);return {removed:true,added:false}}set.items=set.items||[];set.items.push({type:'song',songId: songId});syncSetCounts(set);return {added:true,removed:false}})();
  s.inSet=(personalSets.some(function(st){ensureSetShape(st);return (st.entries||[]).indexOf(songId)>=0}));
  persistSongs();persistSets();renderSetEditor();renderSettings();renderLibrary();showToast((result.added?'Added ':'Removed ')+s.title);
  renderSetSongPickerList((qs('set-song-search')&&qs('set-song-search').value)||'')
}
function addSongToWorkspaceSet(songId){
  var set=workspaceState.sets.find(function(x){return x.id===workspaceState.activeSetId}),s=songs.find(function(x){return x.id===songId});if(!set||!s)return;var result=WorkspaceSetController&&WorkspaceSetController.toggleSong?WorkspaceSetController.toggleSong(set,songId):(function(){set.items=set.items||[];var idx=set.items.findIndex(function(it){return it&&it.type==='song'&&it.songId===songId});if(idx>=0){set.items.splice(idx,1);workspaceSetCounts(set);set.updated='Updated now';return {removed:true}}set.items.push({type:'song',songId:songId});workspaceSetCounts(set);set.updated='Updated now';return {added:true}})();persistWorkspace();renderWorkspaceSetDetail(set);renderWorkspaceSetLists();renderSettings();showToast((result&&result.removed?'Removed ':'Added ')+s.title);renderSetSongPickerList((qs('set-song-search')&&qs('set-song-search').value)||'')
}
function addSongToWorkspaceSetId(songId,setId){var s=songs.find(function(x){return x.id===songId}),set=workspaceState.sets.find(function(x){return x.id===setId});if(!s||!set)return;var result=WorkspaceSetController&&WorkspaceSetController.addSong?WorkspaceSetController.addSong(set,songId):(function(){set.items=set.items||[];if(set.items.some(function(it){return it&&it.type==='song'&&it.songId===songId})){workspaceSetCounts(set);return {exists:true}}set.items.push({type:'song',songId:songId});workspaceSetCounts(set);set.updated='Updated now';return {added:true}})();if(result&&result.exists){showToast('Already in '+set.name);return}persistWorkspace();renderWorkspaceSetLists();renderSettings();showToast('Added to '+set.name)}
function addSongToDestination(songId,setId,scope){
  var s=songs.find(function(x){return x.id===songId});
  if(!s||!setId){showToast('Choose a set list first');return false}
  scope=scope==='workspace'?'workspace':'personal';
  if(scope==='workspace')addSongToWorkspaceSetId(songId,setId);else addSongToSetId(songId,setId);
  renderSetDestinationList(songId);
  try{closeSheetElement(qs('bs-set-destination'))}catch(e){}
  return true;
}
function setSetDestinationScope(scope){var owner=window.WBAddToSetController;state.setDestinationScope=scope==='workspace'?'workspace':'personal';if(owner&&owner.destinationDoneLabel&&qs('set-destination-done'))qs('set-destination-done').textContent=owner.destinationDoneLabel();var wrap=qs('set-destination-scope');if(wrap)qsa('[data-setdest-scope]',wrap).forEach(function(btn){btn.classList.toggle('active',btn.dataset.setdestScope===state.setDestinationScope)});renderSetDestinationList(state.selectedId)}
function createSetFromDestinationScope(){var kind=state.setDestinationScope==='workspace'?'workspace':'personal';var promptLabel=kind==='workspace'?'New Workspace set name':'New personal set name';var defaultName=kind==='workspace'?'New Workspace set':'New set list';return appPrompt(promptLabel,defaultName,{title:promptLabel,confirmText:'Create'}).then(function(name){if(!name||!String(name).trim())return false;var newId=kind==='workspace'?createWorkspaceSetDraft(name):createPersonalSetDraft(name);renderSetDestinationList(state.selectedId);addSongToDestination(state.selectedId,newId,kind);return true})}
function openSetDestination(){var s=songs.find(function(x){return x.id===state.selectedId});if(!s){showToast('Open a song first');return}var m=qs('bs-set-destination');if(!m){showToast('Set picker unavailable');return}var ctx=state.songContext||null,label='Choose where to add this song.';state.setDestinationScope=(window.WBAddToSetController&&window.WBAddToSetController.destinationScopeForContext)?window.WBAddToSetController.destinationScopeForContext(ctx):(ctx&&ctx.scope==='workspace')?'workspace':'personal';if(ctx&&ctx.scope==='personal'){var current=personalSets.find(function(x){return x.id===ctx.setId});label=current?(s.title+' · current set: '+current.name):(s.title+' · choose a set list')}else if(ctx&&ctx.scope==='workspace'){var currentWs=workspaceState.sets.find(function(x){return x.id===ctx.setId});label=currentWs?(s.title+' · current workspace set: '+currentWs.name):(s.title+' · choose a workspace set')}else label=s.title+' · choose a personal or workspace set list';qs('set-destination-song').textContent=label;setSetDestinationScope(state.setDestinationScope);m.classList.add('open');m.setAttribute('aria-hidden','false')}
function renderSetDestinationList(songId){
  var list=qs('set-destination-list');if(!list)return;
  var scope=state.setDestinationScope==='workspace'?'workspace':'personal';
  var currentSetId=state.songContext&&state.songContext.scope===scope?state.songContext.setId:null;
  var ordered=(scope==='workspace'?workspaceState.sets.slice():personalSets.slice()).sort(function(a,b){
    if(currentSetId){if(a.id===currentSetId&&b.id!==currentSetId)return -1;if(b.id===currentSetId&&a.id!==currentSetId)return 1}
    return String(a.name||'').localeCompare(String(b.name||''))
  });
  var rows=ordered.map(function(set){
    if(scope==='personal')set=ensureSetShape(set);
    var inside=scope==='workspace'?(set.items||[]).some(function(it){return it&&it.type==='song'&&it.songId===songId}):((set.entries||[]).indexOf(songId)>=0);
    var current=set.id===currentSetId;
    var meta=scope==='workspace'?workspaceCountLabel(set):countLabel(set);
    return '<button class="setdest-btn '+(current?'current':'')+'" data-dest-set="'+esc(set.id)+'" data-dest-scope="'+scope+'" type="button"><span class="setdest-copy"><span class="setdest-title">'+esc(set.name||'Untitled set')+'</span><span class="setdest-sub">'+esc(meta)+'</span>'+(current?'<span class="setdest-current-pill">Current</span>':'')+'</span><span class="setdest-state '+(inside?'added':'')+'">'+(inside?'Added':'Add')+'</span></button>'
  }).join('');
  list.innerHTML='<div class="setdest-group-label">'+(scope==='workspace'?'Workspace set lists':'Personal set lists')+'</div>'+(rows||'<div class="setdest-empty">No '+(scope==='workspace'?'Workspace ':'')+'set lists yet. Use the + button to create one.</div>');
}
function addSongToSetId(songId,setId){var s=songs.find(function(x){return x.id===songId}),set=personalSets.find(function(x){return x.id===setId});if(!s||!set)return false;ensureSetShape(set);var result=PersonalSetController&&PersonalSetController.addSong?PersonalSetController.addSong(set,songId):(function(){var exists=(set.items||[]).some(function(it){return it&&it.type==='song'&&it.songId===songId});if(exists){syncSetCounts(set);return {added:false,exists:true}}set.items=set.items||[];set.items.push({type:'song',songId:songId});syncSetCounts(set);return {added:true}})();if(result.added){s.inSet=true;persistSongs();saveSetAndRefresh();showToast('Added to '+set.name);return true}else{syncSetCounts(set);showToast('Already in '+set.name);return false}}
function setSummarySourceSet(){return state.setOptionsContext==='workspace'?activeWorkspaceSet():currentSet()}
function setSummaryItemKey(set,item,song,workspace){return resolveSetItemKey(set,item,song)}
function buildSetSummaryLines(set,workspace){
  set=ensureSetShape(set||{});
  var lines=[set.name||'Untitled set'],count=0;
  (set.items||[]).forEach(function(it){
    if(it.type==='section'){
      if(lines.length&&lines[lines.length-1]!=='')lines.push('');
      lines.push(String(it.label||'SECTION').toUpperCase());
      return;
    }
    if(it.type==='song'){
      var song=songs.find(function(x){return x.id===it.songId});
      if(!song)return;
      count++;
      var key=setSummaryItemKey(set,it,song,workspace)||song.key||'';
      lines.push(count+'. '+song.title+(key?' — '+key:''));
      return;
    }
    count++;
    lines.push(count+'. '+(it.title||'Service item')+(it.sub||it.note?' — '+(it.sub||it.note):''));
  });
  if(set.setNotes){lines.push('');lines.push('Set notes: '+set.setNotes)}
  return lines.join('\n');
}
function buildSetSummaryPreviewHtml(text){var lines=String(text||'').split('\n'),html=['<div class="set-summary-preview">'],firstTitle=true;lines.forEach(function(line){var t=line.trim();if(!t){return}var item=t.match(/^(\d+)\.\s+(.*)$/);if(firstTitle){html.push('<div class="set-summary-title">'+esc(t)+'</div>');firstTitle=false;return}if(item){var rest=item[2],parts=rest.split(/\s+—\s+/),title=parts.shift()||'',key=parts.length?parts.pop():'',sub=parts.join(' — ');html.push('<div class="set-summary-line"><span class="set-summary-num">'+esc(item[1])+'.</span><span class="set-summary-song">'+esc(title)+(sub?'<small>'+esc(sub)+'</small>':'')+'</span><span class="set-summary-key">'+esc(key||'')+'</span></div>');return}if(/^Set notes:/i.test(t)){html.push('<div class="set-summary-note">'+esc(t)+'</div>');return}html.push('<div class="set-summary-section">'+esc(t)+'</div>')});html.push('</div>');return html.join('')}
function copySetSummaryText(){
  var set=setSummarySourceSet?setSummarySourceSet():currentSet();if(!set)return;
  var text=buildSetSummaryLines(set,state.setOptionsContext==='workspace');
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){showToast('Summary copied')}).catch(function(){fallbackCopyText(text);showToast('Summary copied')});return}
  }catch(e){}
  fallbackCopyText(text);showToast('Summary copied');
}
function openSetSummary(){var set=setSummarySourceSet();if(!set)return;var text=buildSetSummaryLines(set,state.setOptionsContext==='workspace'),box=qs('set-summary-box');if(box){box.dataset.summaryText=text;box.innerHTML=buildSetSummaryPreviewHtml(text)}var m=qs('bs-set-summary');m.classList.add('open');m.setAttribute('aria-hidden','false')}
function copySetSummary(){var box=qs('set-summary-box'),txt=(box&&box.dataset.summaryText)||((box&&box.textContent)||'');function done(){showToast('Set summary copied')}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done).catch(function(){fallbackCopyText(txt);done()})}else{fallbackCopyText(txt);done()}}

function chooseImportDestination(count,label){return SongImportDestinationController.chooseImportDestination?SongImportDestinationController.chooseImportDestination(count,label,songImportDestinationCtx()):Promise.resolve('local')}
function resolveImportDestination(dest){return SongImportDestinationController.resolveImportDestination?SongImportDestinationController.resolveImportDestination(dest,songImportDestinationCtx()):null}
function firebaseAvailableForImports(){return SongImportDestinationController.firebaseAvailableForImports?SongImportDestinationController.firebaseAvailableForImports(songImportDestinationCtx()):false}
function putFirebaseSongsBulk(rows){return SongImportDestinationController.putFirebaseSongsBulk?SongImportDestinationController.putFirebaseSongsBulk(rows,songImportDestinationCtx()):Promise.resolve(rows||[])}
function saveImportedSongsToDestination(rows,dest){return SongImportDestinationController.saveImportedSongsToDestination?SongImportDestinationController.saveImportedSongsToDestination(rows,dest,songImportDestinationCtx()):Promise.resolve(rows||[])}
function fallbackCopyText(txt){try{var ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.focus();ta.select();document.execCommand('copy');ta.remove()}catch(e){appPrompt('Copy set summary',txt,{title:'Copy set summary',message:'Copy this text manually if needed.',confirmText:'Done',multiline:true})}}
function removeSetItem(idx){var set=currentSet();if(!set)return;ensureSetShape(set);var item=set.items&&set.items[idx];if(!item)return;var label=item.type==='song'?'this song from the set':(item.type==='section'?'this section':'this service item');return appConfirm('Remove '+label+'?',{title:'Remove from set',detail:'This only removes the item from this set list. You can undo immediately after removing.',confirmText:'Remove',danger:true}).then(function(ok){if(!ok)return;var snap=dataSafetySnapshot('remove set item');if(PersonalSetController&&PersonalSetController.removeItem)PersonalSetController.removeItem(set,idx);else{set.items.splice(idx,1);syncSetCounts(set)}commitSetMutation('personal',set,{action:'removeItem',refresh:['personalEditor','settings','library']});offerDataUndo('Removed from set',snap)})}
function moveSetItem(from,to){var set=currentSet();if(!set)return;ensureSetShape(set);var result=PersonalSetController&&PersonalSetController.moveItem?PersonalSetController.moveItem(set,from,to):(function(){if(from<0||from>=set.items.length)return {changed:false};to=Math.max(0,Math.min(set.items.length,to));if(from<to)to-=1;if(from===to)return {changed:false};var item=set.items.splice(from,1)[0];set.items.splice(to,0,item);syncSetCounts(set);return {changed:true}})();if(!result.changed)return;commitSetMutation('personal',set,{action:'moveItem',refresh:['personalEditor']});showToast('Set order updated')}
var setDrag={from:null,over:null};
function installSetDrag(){
  var host=qs('sl-items');if(!host||host.dataset.setDragReady==='1')return;host.dataset.setDragReady='1';
  var drag=null,autoRAF=0;
  function stopAuto(){if(autoRAF){cancelAnimationFrame(autoRAF);autoRAF=0}if(drag)drag.autoDelta=0}
  function applyAutoScroll(){if(!drag||!drag.autoDelta){autoRAF=0;return}var sc=drag.scroller;if(sc){sc.scrollTop+=drag.autoDelta;updatePlaceholder(drag.lastY)}autoRAF=requestAnimationFrame(applyAutoScroll)}
  function candidates(){return Array.prototype.slice.call(host.children).filter(function(el){return el!==drag.source&&el!==drag.placeholder&&el.hasAttribute&&el.hasAttribute('data-set-index')})}
  function updatePlaceholder(clientY){if(!drag)return;var cards=candidates(),placed=false;for(var i=0;i<cards.length;i++){var r=cards[i].getBoundingClientRect();if(clientY<r.top+r.height/2){if(drag.placeholder.nextSibling!==cards[i])host.insertBefore(drag.placeholder,cards[i]);placed=true;break}}if(!placed&&host.lastElementChild!==drag.placeholder)host.appendChild(drag.placeholder)}
  function finish(cancelled){if(!drag)return;stopAuto();document.removeEventListener('pointermove',onMove);document.removeEventListener('pointerup',onUp);document.removeEventListener('pointercancel',onUp);var kids=Array.prototype.slice.call(host.children).filter(function(el){return el!==drag.source});var newIndex=kids.indexOf(drag.placeholder);drag.placeholder.replaceWith(drag.source);drag.source.classList.remove('drag-source');drag.source.removeAttribute('aria-grabbed');drag.source.style.display='';drag.source.style.visibility='';if(drag.ghost)drag.ghost.remove();var from=drag.from;drag=null;host.dataset.dragSuppress='1';setTimeout(function(){host.dataset.dragSuppress='0'},160);if(!cancelled&&newIndex>=0&&newIndex!==from)moveSetItem(from,newIndex)}
  function onMove(e){if(!drag)return;drag.lastY=e.clientY;drag.ghost.style.top=(drag.ghostTop+(e.clientY-drag.startY))+'px';var rect=drag.scroller.getBoundingClientRect(),edge=96,delta=0;if(e.clientY<rect.top+edge)delta=-Math.max(6,Math.round((rect.top+edge-e.clientY)/10));else if(e.clientY>rect.bottom-edge)delta=Math.max(5,Math.round((e.clientY-(rect.bottom-edge))/10));drag.autoDelta=delta;if(delta&&!autoRAF)autoRAF=requestAnimationFrame(applyAutoScroll);if(!delta)stopAuto();updatePlaceholder(e.clientY);e.preventDefault()}
  function onUp(){finish(false)}
  host.addEventListener('pointerdown',function(e){var handle=e.target.closest('.drag-handle');if(!handle||!host.contains(handle))return;if(e.button!=null&&e.button!==0)return;var source=handle.closest('[data-set-index]');if(!source)return;e.preventDefault();e.stopPropagation();try{var sel=window.getSelection&&window.getSelection();if(sel&&sel.removeAllRanges)sel.removeAllRanges();if(document.activeElement&&document.activeElement.blur&&/^(INPUT|TEXTAREA|SELECT)$/i.test(document.activeElement.tagName||''))document.activeElement.blur()}catch(_e){}var r=source.getBoundingClientRect();var placeholder=document.createElement('div');placeholder.className='set-drag-placeholder';placeholder.style.height=r.height+'px';placeholder.style.margin=getComputedStyle(source).margin;host.insertBefore(placeholder,source);var ghost=source.cloneNode(true);ghost.className='drag-ghost '+Array.prototype.slice.call(source.classList).filter(Boolean).join(' ');ghost.style.left=r.left+'px';ghost.style.right='auto';ghost.style.top=r.top+'px';ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';ghost.style.margin='0';document.body.appendChild(ghost);source.classList.add('drag-source');source.setAttribute('aria-grabbed','true');source.style.display='none';drag={source:source,ghost:ghost,placeholder:placeholder,from:parseInt(source.dataset.setIndex,10),startY:e.clientY,ghostTop:r.top,lastY:e.clientY,scroller:source.closest('.sl-scroll')||source.closest('.workspace-scroll'),autoDelta:0};document.addEventListener('pointermove',onMove,{passive:false});document.addEventListener('pointerup',onUp,{passive:false});document.addEventListener('pointercancel',onUp,{passive:false})});host.addEventListener('keydown',function(e){var handle=e.target.closest&&e.target.closest('.drag-handle');if(!handle||!host.contains(handle))return;var source=handle.closest('[data-set-index]');if(!source)return;var from=parseInt(source.dataset.setIndex,10),to=null,total=qsa('[data-set-index]',host).length;if(e.key==='ArrowUp')to=from-1;else if(e.key==='ArrowDown')to=from+2;else if(e.key==='Home')to=0;else if(e.key==='End')to=total;else return;if(from===0&&e.key==='ArrowUp')return;if(from===total-1&&e.key==='ArrowDown')return;e.preventDefault();moveSetItem(from,to)})
}
function installSetListNotes(){personalSets.forEach(function(s){ensureSetShape(s);syncSetCounts(s)});persistSets();installSetDrag();var snSheet=qs('bs-set-notes');if(snSheet&&!snSheet.dataset.ready){snSheet.dataset.ready='1';snSheet.addEventListener('click',function(e){if(e.target===snSheet||e.target.id==='set-notes-cancel'||e.target.id==='set-notes-close')closeSheetElement(snSheet)});qs('set-notes-save').addEventListener('click',saveSetNotes)}var so=qs('bs-set-options');if(so&&!so.dataset.ready){so.dataset.ready='1';so.addEventListener('click',function(e){if(e.target===so){closeSetOptions();return}var a=e.target.closest('[data-set-action]');if(!a)return;var act=a.dataset.setAction;closeSetOptions();handleUnifiedSetOption(act)});qs('set-options-done').addEventListener('click',closeSetOptions)}var sk=qs('bs-set-key');if(sk&&!sk.dataset.ready){sk.dataset.ready='1';sk.addEventListener('click',function(e){if(e.target===sk||e.target.id==='set-key-close'||e.target.id==='set-key-done')closeSetKeySheet();var opt=e.target.closest('[data-set-key]');if(opt)saveSetKey(opt.dataset.setKey)});}
var sa=qs('bs-set-add');if(sa&&!sa.dataset.ready){sa.dataset.ready='1';sa.addEventListener('click',function(e){if(e.target===sa||e.target.id==='set-add-cancel'||e.target.id==='set-add-close'){pendingSetEditIndex=null;closeSheetElement(sa);return}var k=e.target.closest('[data-set-add-kind]');if(k){e.preventDefault();pendingSetAddKind=k.dataset.setAddKind==='section'?'section':'text';qsa('[data-set-add-kind]',sa).forEach(function(b){b.classList.toggle('active',b===k)});var wrap=qs('set-add-note-wrap'),name=qs('set-add-name');if(wrap)wrap.style.display=pendingSetAddKind==='section'?'none':'';if(name)name.placeholder=pendingSetAddKind==='section'?'e.g. Opening, Response, Communion':'e.g. Prayer, Scripture reading, Message';qs('set-add-title').textContent=pendingSetAddKind==='section'?'Add section':'Add service item'}});qs('set-add-save').addEventListener('click',saveSetAddItem)}var pn=qs('bs-personal-new');if(pn&&!pn.dataset.ready){pn.dataset.ready='1';pn.addEventListener('click',function(e){if(e.target===pn||e.target.id==='personal-new-cancel'||e.target.id==='personal-new-close'){closePersonalNewSheet();return}if(e.target.id==='personal-new-save')savePersonalNew()});var pni=qs('personal-new-name');if(pni&&!pni.dataset.ready){pni.dataset.ready='1';pni.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();savePersonalNew()}})}}var sp=qs('bs-set-song-picker');if(sp&&!sp.dataset.ready){sp.dataset.ready='1';var input=qs('set-song-search');if(input)input.addEventListener('input',function(){renderSetSongPickerList(this.value)});sp.addEventListener('click',function(e){if(e.target===sp||e.target.id==='set-song-picker-close'||e.target.id==='set-song-picker-done'){closeSetSongPicker();return}var chip=e.target.closest('[data-set-song-filter]');if(chip){state.setSongPickerFilter=chip.dataset.setSongFilter||'all';renderSetSongPickerList((qs('set-song-search')&&qs('set-song-search').value)||'');return}var b=e.target.closest('[data-picker-song]');if(b)addSongToActiveSet(b.dataset.pickerSong)})}var ns=qs('bs-song-notes');if(ns&&!ns.dataset.ready){ns.dataset.ready='1';ns.addEventListener('click',function(e){if(e.target===ns||e.target.id==='song-notes-cancel'||e.target.id==='song-notes-close')closeSheetElement(ns)});qs('song-notes-save').addEventListener('click',saveSongNotes)}var dest=qs('bs-set-destination');if(dest&&!dest.dataset.ready){dest.dataset.ready='1';dest.addEventListener('click',function(e){if(e.target===dest||e.target.id==='set-destination-close'||e.target.id==='set-destination-done'){closeSheetElement(dest);return}var scopeBtn=e.target.closest('[data-setdest-scope]');if(scopeBtn){setSetDestinationScope(scopeBtn.dataset.setdestScope);return}var createBtn=e.target.closest('[data-setdest-create]');if(createBtn){createSetFromDestinationScope();return}var b=e.target.closest('[data-dest-set]');if(b){e.preventDefault();e.stopPropagation();addSongToDestination(state.selectedId,b.dataset.destSet,b.dataset.destScope);return}})}var sum=qs('bs-set-summary');if(sum&&!sum.dataset.ready){sum.dataset.ready='1';sum.addEventListener('click',function(e){if(e.target===sum||e.target.id==='set-summary-close'||e.target.id==='set-summary-done')closeSheetElement(sum)});qs('set-summary-copy').addEventListener('click',copySetSummary)}}

var manageMode=false;
function adminToolsHtml(){
  if(!adminUnlocked)return '';
  return '<div class="ss-section" id="settings-tools-section"><div class="ss-title">Admin tools</div><div class="ss-card admin-tools-card">'
    +'<button class="ss-row" data-admin-action="manage-songs" type="button">'+settingsIcon('music')+'<div class="ss-body"><div class="ss-lbl">Manage songs</div><div class="ss-sub">Library export, import, duplicate review and editing tools.</div></div></button>'
    +'<button class="ss-row" data-admin-action="export-library" type="button">'+settingsIcon('backup')+'<div class="ss-body"><div class="ss-lbl">Full library backup</div><div class="ss-sub">Export Firebase/shared and local song data visible to this app.</div></div></button>'
    +'<button class="ss-row" data-admin-action="import-library" type="button">'+settingsIcon('backup')+'<div class="ss-body"><div class="ss-lbl">Restore library backup</div><div class="ss-sub">Import a WorshipBase song JSON file into local songs.</div></div></button>'
    +'<button class="ss-row" data-admin-action="firebase-tools" type="button">'+settingsIcon('cloud')+'<div class="ss-body"><div class="ss-lbl">Firebase song tools</div><div class="ss-sub">Sync, export and bulk-select Firebase or My Songs.</div></div></button>'
    +'<button class="ss-row" data-admin-action="export-notes-cues" type="button">'+settingsIcon('note')+'<div class="ss-body"><div class="ss-lbl">Export notes & cues</div><div class="ss-sub">Download Personal and Workspace song notes/cues JSON.</div></div></button>'
    +'<button class="ss-row" data-admin-action="import-notes-cues" type="button">'+settingsIcon('note')+'<div class="ss-body"><div class="ss-lbl">Import notes & cues</div><div class="ss-sub">Restore notes/cues from a WorshipBase JSON file.</div></div></button>'
    +'<button class="ss-row" data-admin-action="duplicates" type="button">'+settingsIcon('view')+'<div class="ss-body"><div class="ss-lbl">Review duplicates</div><div class="ss-sub">Scan by title and author for possible duplicate songs.</div></div></button>'
    +'<button class="ss-row" data-admin-action="change-pin" type="button">'+settingsIcon('set')+'<div class="ss-body"><div class="ss-lbl">Change admin PIN</div><div class="ss-sub">Reset the local admin PIN on this device.</div></div></button>'
    +'<button class="ss-row danger" data-admin-action="lock-admin" type="button">'+settingsIcon('phone')+'<div class="ss-body"><div class="ss-lbl">Lock admin mode</div><div class="ss-sub">Hide admin tools until the PIN is entered again.</div></div></button>'
    +'</div></div>';
}

function openAdminDuplicateReview(){
  var groups=duplicateGroupsForManage();
  var list=qs('dup-review-list')||qs('admin-duplicate-list');
  if(list){
    list.innerHTML=groups.length?groups.map(function(g,gi){
      var title=g[0]&&g[0].title||'Untitled';
      return '<div class="dup-card" data-dup-group="'+gi+'"><div class="dup-head"><div><div class="dup-title">'+esc(title)+'</div><div class="dup-sub">'+g.length+' possible duplicate copies</div></div><div class="dup-actions"><button class="dup-mini" type="button" data-dup-select-group="'+gi+'">Select extras</button><button class="dup-mini danger" type="button" data-dup-delete-group="'+gi+'">Delete extras</button></div></div>'+g.map(function(s,si){
        return '<div class="dup-song"><button class="dup-song-main" type="button" data-dup-open="'+esc(s.id)+'"><div class="dup-song-title">'+esc(s.title||'Untitled')+'</div><div class="dup-song-meta">'+esc((s.artist||'Unknown')+' · '+songCode(s)+' · '+(isFirebaseSong(s)?'Firebase':'My Songs'))+'</div></button><span class="dup-status '+(si===0?'keep':'extra')+'">'+(si===0?'Keep':'Extra')+'</span></div>'
      }).join('')+'</div>'
    }).join(''):'<div class="dupv-empty">No likely duplicates found.</div>';
  }
  var page=qs('dup-review-view');
  if(page){page.classList.add('visible');page.setAttribute('aria-hidden','false');document.body.classList.add('editor-open');return}
  installAdminDuplicateReviewHandlers&&installAdminDuplicateReviewHandlers();var m=qs('bs-admin-duplicates');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}
}
function closeDuplicateReviewPage(){var page=qs('dup-review-view');if(page){page.classList.remove('visible');page.setAttribute('aria-hidden','true');document.body.classList.remove('editor-open')}}
function selectDuplicateGroupExtras(groupIndex){var groups=duplicateGroupsForManage(),g=groups[parseInt(groupIndex,10)]||[];g.slice(1).forEach(function(s){if(s&&s.id&&!manageSelectedIds.includes(s.id))manageSelectedIds.push(s.id)});toggleManageMode(true);syncManageToolbar();renderLibrary();showToast(Math.max(0,g.length-1)+' duplicate extra'+(g.length-1===1?'':'s')+' selected')}
function deleteDuplicateGroupExtras(groupIndex){var groups=duplicateGroupsForManage(),g=groups[parseInt(groupIndex,10)]||[],ids=g.slice(1).map(function(s){return s.id}).filter(Boolean);if(!ids.length){showToast('No duplicate extras');return}return appConfirm('Delete '+ids.length+' duplicate extra'+(ids.length===1?'':'s')+'?',{title:'Delete duplicate extras',confirmText:'Delete',danger:true}).then(function(ok){if(!ok)return;manageSelectedIds=ids;deleteManageSelected();closeDuplicateReviewPage()})}
function selectDuplicateExtras(){var groups=duplicateGroupsForManage();manageSelectedIds=[];groups.forEach(function(g){g.slice(1).forEach(function(s){if(s&&s.id)manageSelectedIds.push(s.id)})});closeAdminDuplicateReview();switchTab('songs');toggleManageMode(true);renderLibrary();syncManageToolbar();showToast(manageSelectedIds.length?manageSelectedIds.length+' duplicate extras selected':'No duplicate extras')} function closeAdminDuplicateReview(){var m=qs('bs-admin-duplicates');if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true')}try{closeDuplicateReviewPage&&closeDuplicateReviewPage()}catch(e){}document.body.classList.remove('sheet-lock','modal-lock')}

function notesCuesExportPayload(){
  var DS=window.WBDataSafetyController||null;if(DS&&DS.notesCuesExportPayload)return DS.notesCuesExportPayload({version:VERSION,personalSets:personalSets,workspaceSets:workspaceState&&workspaceState.sets||[]});
  return {format:'worshipbase-notes-cues',version:VERSION,exportedAt:new Date().toISOString(),personalSets:(personalSets||[]).map(function(s){return {id:s.id,name:s.name,setNotes:s.setNotes||'',songNotes:s.songNotes||{},songCues:s.songCues||{}}}),workspaceSets:(workspaceState&&workspaceState.sets||[]).map(function(s){return {id:s.id,name:s.name,setNotes:s.setNotes||'',songNotes:s.songNotes||{},songCues:s.songCues||{}}})};
}
function exportNotesCuesJson(){var DS=window.WBDataSafetyController||null;if(DS&&DS.notesCuesExportOperation)return DS.notesCuesExportOperation({version:VERSION,personalSets:personalSets,workspaceSets:workspaceState&&workspaceState.sets||[]},{downloadTextFile:downloadTextFile,backupStamp:backupStamp});downloadTextFile('worshipbase-notes-cues-'+backupStamp()+'.json',JSON.stringify(notesCuesExportPayload(),null,2));}
function importNotesCuesJsonText(text){var DS=window.WBDataSafetyController||null;if(DS&&DS.importNotesCuesJsonOperation){var res=DS.importNotesCuesJsonOperation(text,{personalSets:personalSets,workspaceSets:workspaceState&&workspaceState.sets||[]},{persistSets:persistSets,persistWorkspace:persistWorkspace,renderPersonalHome:renderPersonalHome,renderWorkspaceSetLists:renderWorkspaceSetLists,renderSettings:renderSettings,showToast:showToast});return res.changed||0;}var data=JSON.parse(String(text||'{}')),changed=0;if(Array.isArray(data.personalSets)){data.personalSets.forEach(function(src){var set=(personalSets||[]).find(function(x){return x.id===src.id||x.name===src.name});if(set){set.setNotes=src.setNotes||set.setNotes||'';set.songNotes=Object.assign({},set.songNotes||{},src.songNotes||{});set.songCues=Object.assign({},set.songCues||{},src.songCues||{});changed++;}})}if(Array.isArray(data.workspaceSets)){data.workspaceSets.forEach(function(src){var set=(workspaceState.sets||[]).find(function(x){return x.id===src.id||x.name===src.name});if(set){set.setNotes=src.setNotes||set.setNotes||'';set.songNotes=Object.assign({},set.songNotes||{},src.songNotes||{});set.songCues=Object.assign({},set.songCues||{},src.songCues||{});changed++;}})}persistSets();persistWorkspace();renderPersonalHome();renderWorkspaceSetLists();renderSettings();showToast(changed?('Notes/cues restored for '+changed+' set'+(changed===1?'':'s')):'No matching sets found');return changed;}
function importNotesCuesJson(){var input=qs('notes-cues-import-file')||document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=function(){var f=input.files&&input.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{importNotesCuesJsonText(String(r.result||''))}catch(e){showToast('Could not import notes/cues')}};r.readAsText(f)};input.click();}
function handleAdminAction(action){
  if(!adminUnlocked){openAdminPinSheet();return}
  if(action==='manage-songs'){switchTab('songs');toggleManageMode(!manageMode);showToast(manageMode?'Manage songs on':'Manage songs off');return}
  if(action==='export-library'){downloadTextFile('worshipbase-library-'+backupStamp()+'.json',JSON.stringify({format:'worshipbase-library-admin-export',version:VERSION,exportedAt:new Date().toISOString(),firebaseSongs:firebaseSongs,localSongs:localSongs,songMemory:songMemory},null,2));return}
  if(action==='import-library'){var input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=function(){var f=input.files&&input.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var data=JSON.parse(String(r.result||'{}'));var imported=songsFromBackupData(data);if(!imported.length){showToast('No songs found');return}localSongs=mergeSongSources([],localSongs.concat(imported.map(function(s){s.source='local';return s})));persistSongs();rebuildSongsCache();renderLibrary();showToast(imported.length+' song'+(imported.length===1?'':'s')+' imported')}catch(e){showToast('Import failed')}};r.readAsText(f)};input.click();return}
  if(action==='firebase-tools'){openAdminFirebaseTools();return}
   if(action==='export-notes-cues'){exportNotesCuesJson();return}
   if(action==='import-notes-cues'){importNotesCuesJson();return}   if(action==='duplicates'){openAdminDuplicateReview();return}   if(action==='change-pin'){try{localStorage.removeItem(adminPinStorageKey())}catch(e){}adminUnlocked=false;openAdminPinSheet();showToast('Create a new admin PIN');return}
  if(action==='lock-admin'){lockAdminMode();return}
}
var GUITAR_CHORD_SHAPES={
  'C':{frets:['x',3,2,0,1,0],fingers:[0,3,2,0,1,0]},'Cm':{frets:['x',3,5,5,4,3],barre:{fret:3,from:1,to:5},fingers:[0,1,3,4,2,1]},
  'D':{frets:['x','x',0,2,3,2],fingers:[0,0,0,1,3,2]},'Dm':{frets:['x','x',0,2,3,1],fingers:[0,0,0,2,3,1]},'D7':{frets:['x','x',0,2,1,2],fingers:[0,0,0,2,1,3]},
  'E':{frets:[0,2,2,1,0,0],fingers:[0,2,3,1,0,0]},'Em':{frets:[0,2,2,0,0,0],fingers:[0,2,3,0,0,0]},'E7':{frets:[0,2,0,1,0,0],fingers:[0,2,0,1,0,0]},
  'F':{frets:[1,3,3,2,1,1],barre:{fret:1,from:0,to:5},fingers:[1,3,4,2,1,1]},'Fm':{frets:[1,3,3,1,1,1],barre:{fret:1,from:0,to:5},fingers:[1,3,4,1,1,1]},
  'G':{frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3]},'G7':{frets:[3,2,0,0,0,1],fingers:[3,2,0,0,0,1]},'Gm':{frets:[3,5,5,3,3,3],barre:{fret:3,from:0,to:5},fingers:[1,3,4,1,1,1]},
  'A':{frets:['x',0,2,2,2,0],fingers:[0,0,1,2,3,0]},'Am':{frets:['x',0,2,2,1,0],fingers:[0,0,2,3,1,0]},'A7':{frets:['x',0,2,0,2,0],fingers:[0,0,1,0,2,0]},
  'B':{frets:['x',2,4,4,4,2],barre:{fret:2,from:1,to:5},fingers:[0,1,3,3,3,1]},'Bm':{frets:['x',2,4,4,3,2],barre:{fret:2,from:1,to:5},fingers:[0,1,3,4,2,1]},'B7':{frets:['x',2,1,2,0,2],fingers:[0,2,1,3,0,4]},
  'Bb':{frets:['x',1,3,3,3,1],barre:{fret:1,from:1,to:5},fingers:[0,1,3,3,3,1]},'Bbm':{frets:['x',1,3,3,2,1],barre:{fret:1,from:1,to:5},fingers:[0,1,3,4,2,1]},
  'F#m':{frets:[2,4,4,2,2,2],barre:{fret:2,from:0,to:5},fingers:[1,3,4,1,1,1]},'C2':{frets:['x',3,2,0,3,0],fingers:[0,3,2,0,4,0]},'G/B':{frets:['x',2,0,0,3,3],fingers:[0,1,0,0,3,4]}
};
function chordRootKey(name){var m=String(name||'').trim().match(/^([A-G](?:#|b)?)(.*)$/);if(!m)return 'C';var root=m[1].replace('Db','C#').replace('D#','Eb').replace('Gb','F#').replace('G#','Ab').replace('A#','Bb');var rest=m[2]||'';if(/\/B/.test(String(name)))return 'G/B';if(/m(?!aj)/.test(rest)&&GUITAR_CHORD_SHAPES[root+'m'])return root+'m';if(/7/.test(rest)&&GUITAR_CHORD_SHAPES[root+'7'])return root+'7';if(/2|add9|sus2/.test(rest)&&GUITAR_CHORD_SHAPES[root+'2'])return root+'2';return GUITAR_CHORD_SHAPES[root]?root:(GUITAR_CHORD_SHAPES[root+'m']?root+'m':'C')}
function chordDiagramSvg(name){
  var label=esc(name||''),shape=GUITAR_CHORD_SHAPES[chordRootKey(name)]||GUITAR_CHORD_SHAPES.C,frets=shape.frets||[],fingers=shape.fingers||[],base=shape.base||1;
  var xs=[18,39,60,81,102,123],top=38,h=22,out=['<svg class="chord-diagram-svg guitar" viewBox="0 0 142 160" aria-label="'+label+' guitar diagram">'];
  out.push('<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">');
  out.push('<path d="M18 '+top+'H123" stroke-width="'+(base===1?4.2:2.2)+'"/>');
  for(var f=1;f<=4;f++)out.push('<path d="M18 '+(top+f*h)+'H123" stroke-width="1.8" opacity=".78"/>');
  xs.forEach(function(x){out.push('<path d="M'+x+' '+top+'V'+(top+4*h)+'" stroke-width="1.9" opacity=".86"/>')});out.push('</g>');
  frets.forEach(function(fr,i){var x=xs[i],mark=fr==='x'?'×':(fr===0?'○':'');if(mark)out.push('<text x="'+x+'" y="22" text-anchor="middle" fill="currentColor" font-size="16" font-weight="760">'+mark+'</text>')});
  if(shape.barre){var y=top+(shape.barre.fret-base+.5)*h;out.push('<rect x="'+(xs[shape.barre.from]-7)+'" y="'+(y-5.5)+'" width="'+((xs[shape.barre.to]-xs[shape.barre.from])+14)+'" height="11" rx="5.5" fill="currentColor"/><text x="132" y="'+(y+5)+'" fill="currentColor" font-size="11" font-weight="800">'+shape.barre.fret+'</text>')}
  frets.forEach(function(fr,i){if(typeof fr!=='number'||fr<=0)return;if(shape.barre&&fr===shape.barre.fret&&i>=shape.barre.from&&i<=shape.barre.to)return;var y=top+(fr-base+.5)*h,x=xs[i],finger=fingers[i]||'';out.push('<circle cx="'+x+'" cy="'+y+'" r="8" fill="currentColor"/>');if(finger)out.push('<text x="'+x+'" y="'+(y+4)+'" text-anchor="middle" fill="var(--bg1,#fff)" font-size="10" font-weight="850">'+finger+'</text>')});
  out.push('</svg>');return out.join('');
}
var PITCH_CLASS={'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11};
function chordFormula(name){var s=String(name||''),r=s.replace(/^([A-G](?:#|b)?)/,'');if(/dim/i.test(r))return [0,3,6];if(/aug|\+/i.test(r))return [0,4,8];if(/sus2|2|add9/i.test(r))return [0,2,7];if(/sus4|sus/i.test(r))return [0,5,7];if(/m(?!aj)/i.test(r)&&/7/.test(r))return [0,3,7,10];if(/maj7|M7|∆/i.test(r))return [0,4,7,11];if(/7/.test(r))return [0,4,7,10];if(/m(?!aj)/i.test(r))return [0,3,7];return [0,4,7]}
function pianoChordSvg(name){
  var label=esc(name||''),m=String(name||'').match(/^([A-G](?:#|b)?)/),root=PITCH_CLASS[m?m[1]:'C'];
  if(root==null)root=0;
  var formula=chordFormula(name),activeAbs={};
  // One voicing only: mark the chord formula from the named root, never repeat the same notes across both octaves.
  formula.forEach(function(n){activeAbs[root+n]=true});
  // Exactly two octaves: 14 white keys and 10 black keys. No extra right-side keyboard fragment.
  var whites=['C','D','E','F','G','A','B','C','D','E','F','G','A','B'];
  var whiteAbs=[0,2,4,5,7,9,11,12,14,16,17,19,21,23];
  var blackAfter={'C':1,'D':3,'F':6,'G':8,'A':10};
  var x0=7,w=13.2,h=58,g=0,bw=8.8,bh=36;
  var fullW=x0*2+(whites.length*w);
  var out=['<svg class="chord-diagram-svg piano" viewBox="0 0 '+fullW+' 86" aria-label="'+label+' piano chord">'];
  out.push('<g class="piano-white-keys">');
  whites.forEach(function(k,i){out.push('<rect class="piano-white" x="'+(x0+i*w).toFixed(2)+'" y="12" width="'+w+'" height="'+h+'" rx="1.9"/>')});
  out.push('</g><g class="piano-black-keys">');
  whites.forEach(function(k,i){
    if(i>=whites.length-1)return;
    var pc=blackAfter[k];if(pc==null)return;
    var octaveOffset=i>=7?12:0,abs=pc+octaveOffset,bx=x0+i*w+w-(bw/2);
    out.push('<rect class="piano-black" x="'+bx.toFixed(2)+'" y="12" width="'+bw+'" height="'+bh+'" rx="1.8"/>');
    if(activeAbs[abs])out.push('<circle class="piano-dot-black" cx="'+(bx+bw/2).toFixed(2)+'" cy="35.5" r="2.35"/>');
  });
  out.push('</g><g class="piano-white-dots">');
  whites.forEach(function(k,i){var abs=whiteAbs[i];if(activeAbs[abs])out.push('<circle class="piano-dot-white" cx="'+(x0+i*w+w/2).toFixed(2)+'" cy="61.5" r="2.9"/>')});
  out.push('</g></svg>');return out.join('');
}
var chordDiagramMode='guitar';
function renderChordDiagramCards(){
  var s=songs.find(function(x){return x.id===state.selectedId});if(!s)return;
  var found=extractChordNames(s.chart);
  var fallback=isMinorKey(s.key)?['Am','Dm','Em','G','C','F','E','A']:['C','G','D','Em','Am','F','C2','G/B','Bm'];
  var chords=(found.length?found:fallback).slice(0,16);
  if(chords.length%2===1&&fallback.length){var extra=fallback.find(function(x){return chords.indexOf(x)<0});if(extra)chords.push(extra)}
  var grid=qs('chord-diagram-grid'),sub=qs('chord-diagrams-sub');
  if(sub)sub.textContent=chordDiagramMode==='piano'?'Piano reference for the chords used in this song. Scroll for all detected chords.':'Common guitar shapes for the chords used in this song. Scroll for all detected chords.';
  if(grid)grid.innerHTML=chords.map(function(c){
    var shown=displayChord(c,s,'chords');
    var graphic=chordDiagramMode==='piano'?pianoChordSvg(shown):chordDiagramSvg(shown);
    return '<div class="chord-diagram-card"><div class="chord-diagram-title">'+esc(shown)+'</div>'+graphic+'</div>'
  }).join('');
  qsa('[data-chord-diagram-tab]').forEach(function(b){b.classList.toggle('active',b.dataset.chordDiagramTab===chordDiagramMode)})
}
function openChordDiagramsSheet(){
  chordDiagramMode='guitar';
  renderChordDiagramCards();
  var m=qs('bs-chord-diagrams');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}
}
function closeChordDiagramsSheet(){closeSheetElement(qs('bs-chord-diagrams'))}
function handleSongMenuAction(action){return SongLifecycleController.handleSongMenuAction(songLifecycleCtx(),action)}
function jumpToAlpha(letter){
  if(!letter)return;showAlphaBubble(letter);
  var sc=qs('vscroll');
  var group=document.querySelector('[data-group="'+letter+'"]')||document.querySelector('[data-alpha-row="'+letter+'"]');
  if(group&&sc){
    var y=group.getBoundingClientRect().top-sc.getBoundingClientRect().top+sc.scrollTop-2;
    sc.scrollTo({top:Math.max(0,y),behavior:'auto'});
  }
}

function closeSheetElement(bg){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.closeSheetElement(globalSurfaceNavigationCtx(),bg):(function(){if(!bg)return;bg.classList.remove('open');bg.setAttribute('aria-hidden','true')})()}
function installBottomSheetDrag(){
  qsa('.bs-bg .bs').forEach(function(sheet){
    if(sheet.dataset.dragInstalled==='1')return;sheet.dataset.dragInstalled='1';
    var startY=0,lastY=0,dragging=false,bg=sheet.closest('.bs-bg');
    function canStart(e){var t=e.target;if(t.closest('input,textarea,select,button')&&!t.classList.contains('bs-handle'))return false;var r=sheet.getBoundingClientRect();return (e.clientY-r.top)<62||t.classList.contains('bs-handle')}
    function start(e){if(!canStart(e))return;dragging=true;startY=e.clientY;lastY=0;sheet.classList.add('dragging');try{sheet.setPointerCapture(e.pointerId)}catch(_){}}
    function move(e){if(!dragging)return;var dy=Math.max(0,e.clientY-startY);lastY=dy;sheet.style.transform='translateY('+dy+'px)';if(bg)bg.style.background='rgba(0,0,0,'+(0.46*Math.max(0,1-dy/260)).toFixed(3)+')';e.preventDefault();}
    function end(){if(!dragging)return;dragging=false;sheet.classList.remove('dragging');var close=lastY>92;sheet.style.transform='';if(bg)bg.style.background='';if(close)closeSheetElement(bg);}
    sheet.addEventListener('pointerdown',start);
    sheet.addEventListener('pointermove',move);
    sheet.addEventListener('pointerup',end);
    sheet.addEventListener('pointercancel',end);
  });
}

function activeSong(){return SongLifecycleController.activeSong(songLifecycleCtx())}
function collectPlaybackLinks(song){return SongLifecycleController.collectPlaybackLinks(song)}
function updateSongTopActionStates(){return SongLifecycleController.updateSongTopActionStates(songLifecycleCtx())}
function openExternalPlaybackUrl(url){url=String(url||'').trim();if(!/^https?:\/\//i.test(url)){showToast('Link must start with https://');return}var a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.style.position='fixed';a.style.left='-9999px';document.body.appendChild(a);a.click();setTimeout(function(){try{a.remove()}catch(e){}},250)}
function openPlaybackOptions(){
  var s=activeSong(),links=collectPlaybackLinks(s),wrap=qs('playback-list'),m=qs('bs-playback');
  if(!links.length){showToast('Add a Spotify or YouTube / YouTube Music link in the song editor');return}
  if(wrap){
    wrap.innerHTML=links.map(function(l,i){
      return '<button class="mi" type="button" data-playback-index="'+i+'"><span class="mi-icon-wrap"><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M6.5 4.5v8l6-4-6-4z" fill="currentColor"/></svg></span><span class="wbsm-label">'+esc(l.label)+'</span></button>'
    }).join('');
  }
  if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}
}
function closePlaybackOptions(){closeSheetElement(qs('bs-playback'))}
function normalPadKey(k){k=String(k||'C').trim();var aliases={'Db':'C#','D#':'Eb','Gb':'F#','G#':'Ab','A#':'Bb','D♭':'C#','D♯':'Eb','E♭':'Eb','G♭':'F#','G♯':'Ab','A♭':'Ab','A♯':'Bb','B♭':'Bb'};if(aliases[k])return aliases[k];return NOTES.indexOf(k)>=0?k:'C'}
function renderPadSheet(){var s=activeSong(),wb=window.WorshipBasePad||{},st=wb.state||{on:false,key:(s&&s.key)||'C',mode:'peaceful',volume:.35},key=normalPadKey(st.key||(state.displayKey)||(s&&s.key)||'C'),mode=st.mode||'peaceful',box=qs('pad-sheet-body');if(!box)return;box.innerHTML='<div class="pad-status-card"><div class="pad-status-copy"><div class="pad-status-title">'+(st.on?'Pad playing':'Pad ready')+'</div><div class="pad-status-sub">'+esc(mode.charAt(0).toUpperCase()+mode.slice(1))+' · '+esc(key)+'</div></div><button class="pad-power '+(st.on?'stop':'')+'" data-pad-power type="button">'+(st.on?'Stop':'Start')+'</button></div><div class="pad-section-label">Sound</div><div class="pad-chip-row">'+['peaceful','analog','drones'].map(function(m){return '<button class="pad-chip '+(mode===m?'active':'')+'" data-pad-mode="'+m+'" type="button">'+esc(m.charAt(0).toUpperCase()+m.slice(1))+'</button>'}).join('')+'</div><div class="pad-section-label">Key</div><div class="pad-key-grid">'+NOTES.map(function(n){return '<button class="pad-key '+(key===n?'active':'')+'" data-pad-key="'+esc(n)+'" type="button">'+esc(n)+'</button>'}).join('')+'</div>'}
function openPadSheet(){var s=activeSong();if(window.WorshipBasePad&&window.WorshipBasePad.setKey&&s&&!window.WorshipBasePad.state.on)window.WorshipBasePad.setKey(state.displayKey||s.key||'C');renderPadSheet();var m=qs('bs-pad');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}}
function closePadSheet(){closeSheetElement(qs('bs-pad'))}
function handlePadSheetClick(e){var key=e.target.closest('[data-pad-key]'),mode=e.target.closest('[data-pad-mode]'),power=e.target.closest('[data-pad-power]');if(!window.WorshipBasePad)return;if(key){window.WorshipBasePad.setKey(key.dataset.padKey);renderPadSheet();updateSongTopActionStates();return}if(mode){window.WorshipBasePad.setMode(mode.dataset.padMode);renderPadSheet();updateSongTopActionStates();return}if(power){if(window.WorshipBasePad.state&&window.WorshipBasePad.state.on)window.WorshipBasePad.stop();else window.WorshipBasePad.start();renderPadSheet();updateSongTopActionStates();return}}
function orderedVisibleSongs(){return SongLifecycleController.orderedVisibleSongs(songLifecycleCtx())}
function showAdjacentSong(dir,opts){return SongLifecycleController.showAdjacentSong(songLifecycleCtx(),dir,opts)}
function installSongSwipeBack(){
  var sv=qs('song-view');if(!sv||sv.dataset.swipeBackInstalled==='1')return;sv.dataset.swipeBackInstalled='1';
  var sx=0,sy=0,dx=0,tracking=false,mode='',locked=false;
  function tune(){return window.WBSongInteractionController&&window.WBSongInteractionController.songTransitionTiming?window.WBSongInteractionController.songTransitionTiming():{swipeThreshold:54,maxDrag:196,dragFactor:.82,releaseFactor:.70,verticalCancelRatio:1.32,lockDistance:9,backThreshold:58}}
  function endSwipeClass(){document.body.classList.remove('song-view-swiping')}
  function resetAll(){tracking=false;locked=false;dx=0;mode='';sv.classList.remove('dragging-back','dragging-song');sv.style.transition='';sv.style.transform='';clearSongSwipeOffset();endSwipeClass()}
  sv.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(!t||!sv.classList.contains('visible')||document.body.classList.contains('song-motion-freeze'))return;sx=t.clientX;sy=t.clientY;dx=0;locked=false;mode=sx<96?'back':'song';tracking=true;},{passive:true});
  sv.addEventListener('touchmove',function(e){if(!tracking)return;var t=e.touches&&e.touches[0];if(!t)return;var cfg=tune(),x=t.clientX-sx,y=t.clientY-sy,ax=Math.abs(x),ay=Math.abs(y);if(!locked){if(ax<(cfg.lockDistance||9)&&ay<(cfg.lockDistance||9))return;if(ay>ax*(cfg.verticalCancelRatio||1.32)){tracking=false;endSwipeClass();clearSongSwipeOffset();return}locked=true;document.body.classList.add('song-view-swiping')}dx=x;if(mode==='back'&&x>0){sv.classList.add('dragging-back');sv.style.transition='none';var backX=Math.min(x*.60,(window.innerWidth||390)*.58);sv.style.transform='translate3d('+Math.round(backX)+'px,0,0)';sv.style.opacity=String(Math.max(.35,1-(backX/Math.max(1,(window.innerWidth||390)))*1.05));if(e.cancelable)e.preventDefault()}else if(mode==='song'&&ax>0){sv.classList.add('dragging-song');setSongSwipeOffset(Math.max(-(cfg.maxDrag||196),Math.min((cfg.maxDrag||196),x*(cfg.dragFactor||.82))),null,'none');if(e.cancelable)e.preventDefault()}},{passive:false});
  sv.addEventListener('touchend',function(){if(!tracking){endSwipeClass();return}var cfg=tune(),was=dx,m=mode,releaseOffset=Math.max(-Math.round((cfg.maxDrag||196)*.80),Math.min(Math.round((cfg.maxDrag||196)*.80),was*(cfg.releaseFactor||.70)));tracking=false;locked=false;dx=0;mode='';sv.classList.remove('dragging-back','dragging-song');if(m==='back'){endSwipeClass();if(was>(cfg.backThreshold||58)){prepareLibraryForSongReturn();sv.classList.add('closing-back');sv.style.transition='transform .16s cubic-bezier(.2,.75,.25,1), opacity .14s ease';sv.style.transform='translate3d(46%,0,0)';sv.style.opacity='0';setTimeout(function(){finishSongReturn(sv)},165);return}sv.style.transition='transform .18s cubic-bezier(.22,1,.32,1), opacity .16s ease';sv.style.transform='translate3d(0,0,0)';sv.style.opacity='1';setTimeout(function(){sv.style.transition='';sv.style.transform='';sv.style.opacity=''},190);return}sv.style.transition='';sv.style.transform='';if(m==='song'&&Math.abs(was)>(cfg.swipeThreshold||54)){endSwipeClass();showAdjacentSong(was<0?1:-1,{startOffset:releaseOffset});return}endSwipeClass();setSongSwipeOffset(0,null,'transform .16s cubic-bezier(.22,1,.32,1)');setTimeout(clearSongSwipeOffset,220)},{passive:true});
  sv.addEventListener('touchcancel',function(){resetAll()},{passive:true});
}


function copySongLyricsById(songId){var old=state.selectedId;state.selectedId=songId;copyCurrentLyrics();state.selectedId=old}
function openSetDestinationForSong(songId){state.selectedId=songId;openSetDestination()}
var openLibrarySwipeItem=null;
function resetLibrarySwipe(item,instant){if(!item)return;var wrap=item.closest&&item.closest('.song-row-wrap');if(wrap)wrap.classList.remove('reveal-l','reveal-r');item.style.transition=instant?'none':'transform .22s cubic-bezier(.22,.61,.36,1)';item.style.transform='translate3d(0,0,0)';item.classList.remove('swiped-r','swiped-l','swiped');if(openLibrarySwipeItem===item)openLibrarySwipeItem=null;document.body.classList.remove('library-row-swiping')}
function installLibraryRowSwipe(){var host=qs('vinner');if(!host||host.dataset.librarySwipeReady==='1')return;host.dataset.librarySwipeReady='1';var st={item:null,wrap:null,sx:0,sy:0,dx:0,lockedH:false,lockedV:false,base:0};function clear(){st.item=null;st.wrap=null;st.dx=0;st.lockedH=false;st.lockedV=false;document.body.classList.remove('library-row-swiping')}host.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(!t)return;var item=e.target.closest&&e.target.closest('.song-item[data-song-id]');if(!item||e.target.closest('.song-fav-btn'))return;st.item=item;st.wrap=item.closest('.song-row-wrap');st.sx=t.clientX;st.sy=t.clientY;st.dx=0;st.lockedH=false;st.lockedV=false;st.base=item.classList.contains('swiped-r')?74:(item.classList.contains('swiped-l')?-74:0);if(openLibrarySwipeItem&&openLibrarySwipeItem!==item)resetLibrarySwipe(openLibrarySwipeItem,true)},{passive:true});host.addEventListener('touchmove',function(e){if(!st.item)return;var t=e.touches&&e.touches[0];if(!t)return;var dx=t.clientX-st.sx,dy=t.clientY-st.sy;if(!st.lockedH&&!st.lockedV){if(Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)*1.45){st.lockedH=true;document.body.classList.add('library-row-swiping')}else if(Math.abs(dy)>8){st.lockedV=true;if(openLibrarySwipeItem)resetLibrarySwipe(openLibrarySwipeItem,true)}}if(!st.lockedH)return;st.dx=dx;var clamped=Math.max(-74,Math.min(74,st.base+dx));if(st.wrap){st.wrap.classList.toggle('reveal-l',clamped>6);st.wrap.classList.toggle('reveal-r',clamped<-6)}st.item.style.transition='none';st.item.style.transform='translate3d('+clamped+'px,0,0)';if(e.cancelable)e.preventDefault()},{passive:false});host.addEventListener('touchend',function(e){if(!st.item){clear();return}var item=st.item,wrap=st.wrap,dx=st.dx,locked=st.lockedH,wasR=item.classList.contains('swiped-r'),wasL=item.classList.contains('swiped-l');item.style.transition='transform .26s cubic-bezier(.22,.61,.36,1)';if(!locked){clear();return}item.classList.remove('swiped-r','swiped-l','swiped');if(wasR){if(dx<-20)resetLibrarySwipe(item);else{if(wrap){wrap.classList.add('reveal-l');wrap.classList.remove('reveal-r')}item.style.transform='translate3d(74px,0,0)';item.classList.add('swiped-r')}}else if(wasL){if(dx>20)resetLibrarySwipe(item);else{if(wrap){wrap.classList.add('reveal-r');wrap.classList.remove('reveal-l')}item.style.transform='translate3d(-74px,0,0)';item.classList.add('swiped-l')}}else if(dx<-40){if(wrap){wrap.classList.add('reveal-r');wrap.classList.remove('reveal-l')}item.style.transform='translate3d(-74px,0,0)';item.classList.add('swiped-l')}else if(dx>40){if(wrap){wrap.classList.add('reveal-l');wrap.classList.remove('reveal-r')}item.style.transform='translate3d(74px,0,0)';item.classList.add('swiped-r')}else resetLibrarySwipe(item);openLibrarySwipeItem=(item.classList.contains('swiped-r')||item.classList.contains('swiped-l'))?item:null;clear()},{passive:true});host.addEventListener('touchcancel',function(){if(st.item)resetLibrarySwipe(st.item,true);clear()},{passive:true});var sc=qs('vscroll');if(sc)sc.addEventListener('scroll',function(){if(openLibrarySwipeItem)resetLibrarySwipe(openLibrarySwipeItem,true)},{passive:true})}
function installAlphaStrip(){
  var strip=qs('alpha-strip');if(!strip)return;
  function pick(y){var items=qsa('.alpha-letter',strip);if(!items.length)return null;var rect=strip.getBoundingClientRect();var frac=Math.max(0,Math.min(1,(y-rect.top)/Math.max(rect.height,1)));return items[Math.min(items.length-1,Math.floor(frac*items.length))]}
  function move(y){var el=pick(y);if(!el)return;var b=qs('alpha-bubble');if(b)b.style.top=(y-21)+'px';jumpToAlpha(el.dataset.alpha)}
  strip.addEventListener('click',function(e){var a=e.target.closest('[data-alpha]');if(a)jumpToAlpha(a.dataset.alpha)});
  strip.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(!t)return;if(e.cancelable)e.preventDefault();move(t.clientY)},{passive:false});
  strip.addEventListener('touchmove',function(e){var t=e.touches&&e.touches[0];if(!t)return;if(e.cancelable)e.preventDefault();move(t.clientY)},{passive:false});
  strip.addEventListener('touchend',function(){setTimeout(function(){var b=qs('alpha-bubble');if(b)b.classList.remove('show')},400)},{passive:true});
  strip.addEventListener('pointerdown',function(e){if(e.pointerType==='touch')return;strip.setPointerCapture&&strip.setPointerCapture(e.pointerId);move(e.clientY)});
  strip.addEventListener('pointermove',function(e){if(e.buttons)move(e.clientY)});
}

function installPullToRefresh(){var sc=qs('vscroll'),ptr=qs('ptr-indicator');if(!sc||!ptr)return;var startY=0,tracking=false,refreshing=false,circ=75.4,threshold=92;function clamp(n,a,b){return Math.max(a,Math.min(b,n))}function setProgress(pull,spin){var progress=clamp(pull/threshold,0,1),eased=1-Math.pow(1-progress,2),y=Math.round(eased*16),alpha=progress<=0?0:Math.min(1,.18+progress*.82),scale=.82+progress*.18,dash=circ*progress;ptr.style.setProperty('--wb-ptr-y',y+'px');ptr.style.setProperty('--wb-ptr-alpha',spin?'.94':alpha.toFixed(4));ptr.style.setProperty('--wb-ptr-scale',scale.toFixed(4));ptr.style.setProperty('--wb-ptr-dash',dash.toFixed(3));ptr.classList.toggle('ready',progress>=1&&!spin);ptr.classList.toggle('spinning',!!spin)}function reset(){ptr.classList.remove('ready','spinning');ptr.style.setProperty('--wb-ptr-alpha','0');ptr.style.setProperty('--wb-ptr-y','0px');ptr.style.setProperty('--wb-ptr-scale','.82');ptr.style.setProperty('--wb-ptr-dash','0')}sc.addEventListener('touchstart',function(e){if(refreshing||sc.scrollTop>1)return;var t=e.touches&&e.touches[0];if(!t)return;startY=t.clientY;tracking=true},{passive:true});sc.addEventListener('touchmove',function(e){if(!tracking||refreshing)return;var t=e.touches&&e.touches[0];if(!t)return;var pull=Math.max(0,t.clientY-startY);if(pull>0)setProgress(pull,false)},{passive:true});sc.addEventListener('touchend',function(){if(!tracking)return;tracking=false;var dash=parseFloat(getComputedStyle(ptr).getPropertyValue('--wb-ptr-dash'))||0;if(dash>=circ*.98){refreshing=true;setProgress(threshold,true);setTimeout(function(){renderLibrary();refreshing=false;reset()},420)}else reset()},{passive:true});}
function showToolsPanel(name){
  var owner=window.WBToolsController;
  name=owner&&owner.normalizePanel?owner.normalizePanel(name):String(name||'home');
  if(owner&&owner.showPanel)owner.showPanel(document,state,name);else{state.toolsPanel=name==='home'?'home':name;qsa('#tools-section .tools-panel').forEach(function(p){p.classList.toggle('active',p.id==='tools-'+name+'-panel')})}
  var sc=qs('tools-section .tools-scroll')||qs('tools-section');
  if(sc){
    if(name==='home')setTimeout(function(){try{sc.scrollTop=0}catch(e){}},0);
    else setTimeout(function(){try{sc.scrollTop=0}catch(e){}},0);
  }
  if(name==='keycapo')initToolsKeyCapo();
  if(name==='pads')initToolsPads();
  if(name==='chordnns')initToolsChordNns();
}
function openToolsHome(){qsa('.route').forEach(function(r){r.classList.remove('active')});qs('tools-section').classList.add('active');qsa('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab==='tools')});qs('srch-wrap').style.display='none';qs('hdr-add-btn').style.display='none';setBodyRouteClasses('tools');state.tab='tools';showToolsPanel('home');persistRouteMemory()}
function openToolsBible(fromMemory){qsa('.route').forEach(function(r){r.classList.remove('active')});qs('bible-section').classList.add('active');qsa('.tab-btn').forEach(function(b){b.classList.toggle('active',b.dataset.tab==='tools')});qs('srch-wrap').style.display='none';qs('hdr-add-btn').style.display='none';setBodyRouteClasses('tools','wb-tools-bible');state.tab='tools';state.toolsPanel='bible';installBibleControls();loadBibleData();renderBibleShell();persistRouteMemory()}
function openToolsKeyCapo(){showToolsPanel('keycapo')}
function openToolsPads(){showToolsPanel('pads')}
function openToolsChordNns(){showToolsPanel('chordnns')}
var chordNnsState={key:'C',mode:'major',root:'C',quality:'major',instrument:'guitar',variation:0,transposeTarget:'G',lastCopy:''};
function setPickerButton(id,value,sub){var b=qs(id);if(!b)return;var strong=b.querySelector('strong'),em=b.querySelector('em');if(strong)strong.textContent=value;if(em)em.textContent=sub||'Change'}
function toolPickerOptions(kind){var owner=window.WBChordNnsController;var keyItems=TOOL_KEYS.map(function(k){return {value:k,label:k}}),rootItems=(owner?owner.ROOTS:TOOL_KEYS).map(function(k){return {value:k,label:k}});var map={
  'kc-original':{title:'Original key',sub:'Choose the key the song is currently in.',items:keyItems,value:qs('tools-kc-original')&&qs('tools-kc-original').value,layout:'key-grid',onPick:function(v){var o=qs('tools-kc-original');if(o)o.value=v;updateToolsKeyCapo()}},
  'kc-target':{title:'Target key',sub:'Choose the key you want to transpose to.',items:keyItems,value:qs('tools-kc-target')&&qs('tools-kc-target').value,layout:'key-grid',onPick:function(v){var t=qs('tools-kc-target');if(t)t.value=v;updateToolsKeyCapo()}},
  'nns-key':{title:'Number-system key',sub:'Choose the parent key for the chord family table.',items:rootItems,value:chordNnsState.key,layout:'key-grid',onPick:function(v){chordNnsState.key=v;renderToolsChordNns()}},
  'nns-mode':{title:'Scale',sub:'Switch between major and natural minor numbering.',items:[{value:'major',label:'Major'},{value:'minor',label:'Minor'}],value:chordNnsState.mode,layout:'stack',onPick:function(v){chordNnsState.mode=v;renderToolsChordNns()}},
  'nns-instrument':{title:'Instrument',sub:'Choose guitar shapes or piano chord tones.',items:[{value:'guitar',label:'Guitar'},{value:'piano',label:'Piano'}],value:chordNnsState.instrument,layout:'stack',onPick:function(v){chordNnsState.instrument=v;chordNnsState.variation=0;renderNnsDiagram();syncNnsPickerButtons()}},
  'nns-root':{title:'Chord root',sub:'Choose the chord root for the diagram.',items:rootItems,value:chordNnsState.root,layout:'key-grid',onPick:function(v){chordNnsState.root=v;chordNnsState.variation=0;renderNnsDiagram();syncNnsPickerButtons()}},
  'nns-quality':{title:'Chord quality',sub:'Choose the chord type for the diagram.',items:(owner?owner.QUALITIES:[]).map(function(q){return {value:q.id,label:q.label}}),value:chordNnsState.quality,layout:'quality-grid',onPick:function(v){chordNnsState.quality=v;chordNnsState.variation=0;renderNnsDiagram();syncNnsPickerButtons()}},
  'nns-transpose':{title:'Transpose progression to',sub:'Preview the converter result in another key.',items:rootItems,value:chordNnsState.transposeTarget,layout:'key-grid',onPick:function(v){chordNnsState.transposeTarget=v;updateNnsConversion();syncNnsPickerButtons()}}
};return map[kind]||null}
function openToolPicker(kind){
  var cfg=toolPickerOptions(kind);if(!cfg)return;
  var id='bs-tool-picker',wrap=qs(id);
  if(!wrap){
    wrap=document.createElement('div');wrap.id=id;wrap.className='bs-bg wb-tool-picker';wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML='<div class="bs tool-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="tool-picker-title"><div class="bs-handle"></div><div class="m-tr"><h2 class="m-h2" id="tool-picker-title">Choose</h2><button aria-label="Close" class="m-close" id="tool-picker-close" type="button">×</button></div><div class="m-body tool-picker-body"><p class="settings-picker-sub" id="tool-picker-sub"></p><div class="tool-picker-list" id="tool-picker-list"></div></div><button class="bs-cancel" id="tool-picker-cancel" type="button">Cancel</button></div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click',function(e){
      if(e.target===wrap||e.target.id==='tool-picker-cancel'||e.target.id==='tool-picker-close'){closeToolPicker();return}
      var b=e.target.closest&&e.target.closest('[data-tool-pick-value]');
      if(b&&wrap._picker){var v=b.dataset.toolPickValue;var fn=wrap._picker.onPick;closeToolPicker();if(fn)fn(v)}
    })
  }
  wrap._picker=cfg;
  var title=qs('tool-picker-title'),sub=qs('tool-picker-sub'),list=qs('tool-picker-list');
  if(title)title.textContent=cfg.title||'Choose';
  if(sub){sub.textContent=cfg.sub||'';sub.hidden=!cfg.sub;}
  if(list){
    list.className='tool-picker-list '+(cfg.layout||'stack');
    list.innerHTML=(cfg.items||[]).map(function(it){var active=String(it.value)===String(cfg.value);return '<button class="tool-picker-option '+(active?'on':'')+'" data-tool-pick-value="'+esc(it.value)+'" type="button"><span class="tool-picker-label">'+esc(it.label)+'</span><span class="tool-picker-check">✓</span></button>'}).join('');
  }
  wrap.classList.add('open');wrap.setAttribute('aria-hidden','false')
}
function closeToolPicker(){var w=qs('bs-tool-picker');if(w){w.classList.remove('open');w.setAttribute('aria-hidden','true');w._picker=null}}
function syncNnsPickerButtons(){var owner=window.WBChordNnsController;setPickerButton('nns-key-btn',chordNnsState.key);setPickerButton('nns-mode-btn',chordNnsState.mode==='minor'?'Minor':'Major');setPickerButton('nns-diagram-instrument-btn',chordNnsState.instrument==='piano'?'Piano':'Guitar');setPickerButton('nns-diagram-root-btn',chordNnsState.root);var q=owner&&owner.QUALITIES?owner.QUALITIES.filter(function(q){return q.id===chordNnsState.quality})[0]:null;setPickerButton('nns-diagram-quality-btn',q?q.label:chordNnsState.quality);setPickerButton('nns-transpose-target-btn',chordNnsState.transposeTarget)}
function initToolsChordNns(){
  var owner=window.WBChordNnsController;if(!owner)return;
  var keySel=qs('nns-key-select'),rootSel=qs('nns-diagram-root'),qualitySel=qs('nns-diagram-quality'),targetSel=qs('nns-transpose-target');
  if(keySel&&!keySel.dataset.ready){keySel.dataset.ready='1';keySel.innerHTML=owner.ROOTS.map(function(k){return '<option value="'+esc(k)+'">'+esc(k)+'</option>'}).join('')}
  if(rootSel&&!rootSel.dataset.ready){rootSel.dataset.ready='1';rootSel.innerHTML=owner.ROOTS.map(function(k){return '<option value="'+esc(k)+'">'+esc(k)+'</option>'}).join('')}
  if(targetSel&&!targetSel.dataset.ready){targetSel.dataset.ready='1';targetSel.innerHTML=owner.ROOTS.map(function(k){return '<option value="'+esc(k)+'">'+esc(k)+'</option>'}).join('')}
  if(qualitySel&&!qualitySel.dataset.ready){qualitySel.dataset.ready='1';qualitySel.innerHTML=owner.QUALITIES.map(function(q){return '<option value="'+esc(q.id)+'">'+esc(q.label)+'</option>'}).join('')}
  if(keySel)keySel.value=chordNnsState.key;if(rootSel)rootSel.value=chordNnsState.root;if(targetSel)targetSel.value=chordNnsState.transposeTarget;if(qualitySel)qualitySel.value=chordNnsState.quality;var modeSel=qs('nns-mode-select');if(modeSel)modeSel.value=chordNnsState.mode;
  renderToolsChordNns();syncNnsPickerButtons();
}
function renderToolsChordNns(){
  var surface=window.WBToolsSurfaceController,owner=window.WBChordNnsController;if(!owner)return;
  if(surface&&surface.renderChordNns){surface.renderChordNns({document:document,state:chordNnsState,owner:owner,setPickerButton:setPickerButton,syncPickerButtons:syncNnsPickerButtons});return}
  var rows=owner.scaleRows(chordNnsState.key,chordNnsState.mode),table=qs('nns-scale-table');
  if(table){table.innerHTML='<thead><tr><th class="nns-col-chord">Chord</th><th class="nns-col-quality">Quality</th><th class="nns-col-roman">Roman</th><th class="nns-col-number">NNS</th></tr></thead><tbody>'+rows.map(function(r){return '<tr><td class="nns-chord-cell"><strong>'+esc(r.chord)+'</strong></td><td class="nns-quality-cell">'+esc(r.quality)+'</td><td class="nns-roman-cell">'+esc(r.roman)+'</td><td class="nns-number-cell"><span>'+esc(r.nns)+'</span></td></tr>'}).join('')+'</tbody>'}
  renderNnsScaleSummary();renderNnsReference();renderNnsCommonProgressions();updateNnsConversion();renderNnsDiagram();syncNnsPickerButtons();
}
function renderNnsScaleSummary(){
  var surface=window.WBToolsSurfaceController,owner=window.WBChordNnsController;if(surface&&surface.renderScaleSummary&&surface.renderScaleSummary({document:document,state:chordNnsState,owner:owner}))return;
  var box=qs('nns-scale-summary');if(!owner||!box)return;
  var notes=owner.scaleNoteList?owner.scaleNoteList(chordNnsState.key,chordNnsState.mode):[];
  var rel=owner.relativeKey?owner.relativeKey(chordNnsState.key,chordNnsState.mode):null;
  box.innerHTML='<div class="nns-summary-pill"><strong>'+esc(chordNnsState.key+' '+(chordNnsState.mode==='minor'?'Minor':'Major'))+'</strong><span>'+esc(notes.join(' · '))+'</span></div>'+
    (rel?'<div class="nns-summary-mini"><span>'+esc(rel.label)+': '+esc(rel.key)+'</span></div>':'');
}
function renderNnsReference(){
  var surface=window.WBToolsSurfaceController,owner=window.WBChordNnsController;if(surface&&surface.renderReference&&surface.renderReference({document:document,state:chordNnsState,owner:owner}))return;
  var box=qs('nns-reference-grid');if(!owner||!box)return;
  var rows=owner.theoryRows?owner.theoryRows(chordNnsState.key,chordNnsState.mode):[];
  box.innerHTML=rows.map(function(item){return '<div class="nns-ref-item"><strong>'+esc(item.label)+'</strong><span>'+esc(item.value)+'</span></div>'}).join('')+
    '<div class="nns-ref-note">Tip: slash numbers follow the bass note, e.g. <strong>5/7</strong> in C = <strong>G/B</strong>. Borrowed numbers like <strong>b7</strong> are available in the converter.</div>';
}
function renderNnsCommonProgressions(){
  var surface=window.WBToolsSurfaceController,owner=window.WBChordNnsController;if(surface&&surface.renderCommonProgressions&&surface.renderCommonProgressions({document:document,state:chordNnsState,owner:owner}))return;
  var box=qs('nns-common-progressions');if(!owner||!box||!owner.commonProgressions)return;
  box.innerHTML=owner.commonProgressions(chordNnsState.key,chordNnsState.mode).map(function(p){return '<button class="nns-example-chip" type="button" data-nns-example="'+esc(p.nns)+'"><span>'+esc(p.nns)+'</span><small>'+esc(p.chords)+'</small></button>'}).join('');
}
function updateNnsConversion(){
  var surface=window.WBToolsSurfaceController,owner=window.WBChordNnsController;if(surface&&surface.updateConversion&&surface.updateConversion({document:document,state:chordNnsState,owner:owner,syncPickerButtons:syncNnsPickerButtons}))return;
  var inp=qs('nns-convert-input'),out=qs('nns-convert-result'),tr=qs('nns-transpose-result'),copy=qs('nns-copy-result');if(!owner||!out)return;
  var value=inp?inp.value.trim():'';if(!value){out.textContent='Enter a progression to convert chords to numbers, or numbers to chords.';if(tr)tr.textContent='Transpose preview will appear here.';chordNnsState.lastCopy='';if(copy)copy.disabled=true;syncNnsPickerButtons();return}
  var converted=owner.convertProgression?owner.convertProgression(value,chordNnsState.key,chordNnsState.mode):null;
  var line=converted&&converted.line?converted.line:'';
  var label=converted&&converted.direction==='numbers-to-chords'?'Numbers → chords':'Chords → numbers';
  out.innerHTML='<span class="nns-result-label">'+label+'</span><div class="nns-result-line">'+esc(line||'?')+'</div>';
  var trans=owner.transposeProgression?owner.transposeProgression(value,chordNnsState.key,chordNnsState.transposeTarget,chordNnsState.mode):null;
  var transLine=trans&&trans.line?trans.line:'';
  if(tr)tr.innerHTML='<span class="nns-result-label">Transposed to '+esc(chordNnsState.transposeTarget)+'</span><div class="nns-result-line">'+esc(transLine||'?')+'</div>';
  chordNnsState.lastCopy=(label+': '+(line||'?')+'\nTransposed to '+chordNnsState.transposeTarget+': '+(transLine||'?'));
  if(copy)copy.disabled=false;syncNnsPickerButtons();
}
function renderNnsDiagram(){
  var surface=window.WBToolsSurfaceController,owner=window.WBChordNnsController;if(surface&&surface.renderDiagram&&surface.renderDiagram({document:document,state:chordNnsState,owner:owner}))return;
  if(!owner)return;
  var isPiano=chordNnsState.instrument==='piano';
  var variations=isPiano&&owner.pianoDiagramVariations?owner.pianoDiagramVariations(chordNnsState.root,chordNnsState.quality):(owner.diagramVariations?owner.diagramVariations(chordNnsState.root,chordNnsState.quality):[]);
  if(chordNnsState.variation>=(variations.length||1))chordNnsState.variation=0;
  var model=owner.diagramFor(chordNnsState.root,chordNnsState.quality,chordNnsState.variation),title=qs('nns-diagram-title'),svg=qs('nns-diagram-svg'),hint=qs('nns-diagram-hint'),varBox=qs('nns-diagram-variations');
  if(title)title.textContent=isPiano?model.name:model.name;
  if(svg){svg.innerHTML=isPiano&&owner.pianoDiagramHtml?owner.pianoDiagramHtml(chordNnsState.root,chordNnsState.quality,chordNnsState.variation):owner.diagramSvg(model)}
  if(varBox){varBox.hidden=!variations||variations.length<2;varBox.innerHTML=varBox.hidden?'':variations.map(function(v,i){return '<button class="nns-variation-chip '+(i===chordNnsState.variation?'active':'')+'" data-nns-variation="'+i+'" type="button">'+esc(v.label||((isPiano?'Voicing ':'Shape ')+(i+1)))+'</button>'}).join('')}
  if(hint){
    if(isPiano){
      var notes=owner.pianoChordNotes?owner.pianoChordNotes(chordNnsState.root,chordNnsState.quality,chordNnsState.variation):[];
      var label=variations&&variations[chordNnsState.variation]&&variations[chordNnsState.variation].label?variations[chordNnsState.variation].label:'Root position';
      hint.textContent='Piano tones · '+notes.join(' · ')+' · '+label;
    }else{
      hint.textContent=model.hint+(model.diagram&&model.diagram.shape?' · '+model.diagram.shape:'')+(model.variationCount>1?' · '+(model.variationIndex+1)+' of '+model.variationCount:'');
    }
  }
}
var TOOL_KEYS=(window.WBToolsController&&window.WBToolsController.TOOL_KEYS)||['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
var PAD_TYPES=(window.WBToolsController&&window.WBToolsController.PAD_TYPES)||['Peaceful','Analog','Drones'];
var toolPadState=(window.WBToolsController&&window.WBToolsController.normalizePadState)?window.WBToolsController.normalizePadState({type:'Peaceful',key:'C',playing:false},TOOL_KEYS,PAD_TYPES):{type:'Peaceful',key:'C',playing:false};
function initToolsKeyCapo(){
  var o=qs('tools-kc-original'),t=qs('tools-kc-target');if(!o||!t)return;
  if(!o.children.length){o.innerHTML=TOOL_KEYS.map(function(k){return '<option value="'+k+'">'+k+'</option>'}).join('');t.innerHTML=o.innerHTML;o.value='G';t.value='C'}
  updateToolsKeyCapo();
}
function updateToolsKeyCapo(){
  var surface=window.WBToolsSurfaceController;if(surface&&surface.renderKeyCapo&&surface.renderKeyCapo({document:document,keys:TOOL_KEYS,setPickerButton:setPickerButton}))return;
  var o=qs('tools-kc-original'),t=qs('tools-kc-target'),res=qs('tools-kc-result'),sg=qs('tools-kc-suggestions');if(!o||!t||!res||!sg)return;
  var calc=(window.WBToolsController&&window.WBToolsController.keyCapo)?window.WBToolsController.keyCapo(o.value,t.value,TOOL_KEYS):(function(){var oi=TOOL_KEYS.indexOf(o.value),ti=TOOL_KEYS.indexOf(t.value),steps=(ti-oi+12)%12;return {original:o.value,target:t.value,steps:steps,suggestions:[0,1,2,3,4].map(function(capo){return {capo:capo,shape:TOOL_KEYS[(ti-capo+12)%12]}})}})();
  o.value=calc.original;t.value=calc.target;setPickerButton('tools-kc-original-btn',calc.original);setPickerButton('tools-kc-target-btn',calc.target);
  res.innerHTML='<strong>'+esc(calc.original)+' → '+esc(calc.target)+'</strong><br>Transpose '+calc.steps+' semitone'+(calc.steps===1?'':'s')+' up.';
  sg.innerHTML=calc.suggestions.map(function(x){return '<div class="tools-kc-suggestion"><strong>Capo '+x.capo+'</strong><span>Play '+esc(x.shape)+' shapes</span></div>'}).join('')
}
function initToolsPads(){
  var surface=window.WBToolsSurfaceController;if(surface&&surface.renderPads){var next=surface.renderPads({document:document,state:toolPadState,keys:TOOL_KEYS,types:PAD_TYPES});if(next){toolPadState=next;return}}
  var tr=qs('tools-pad-type-row'),kr=qs('tools-pad-key-row'),owner=window.WBToolsController;if(!tr||!kr)return;
  if(owner&&owner.normalizePadState)toolPadState=owner.normalizePadState(toolPadState,TOOL_KEYS,PAD_TYPES);
  var typeModels=owner&&owner.chipModels?owner.chipModels(PAD_TYPES,toolPadState.type):PAD_TYPES.map(function(p){return {value:p,active:toolPadState.type===p}});
  var keyModels=owner&&owner.chipModels?owner.chipModels(TOOL_KEYS,toolPadState.key):TOOL_KEYS.map(function(k){return {value:k,active:toolPadState.key===k}});
  tr.innerHTML=typeModels.map(function(p){return '<button class="tools-pad-chip '+(p.active?'active':'')+'" data-pad-type="'+esc(p.value)+'" type="button">'+esc(p.value)+'</button>'}).join('');
  kr.innerHTML=keyModels.map(function(k){return '<button class="tools-pad-key '+(k.active?'active':'')+'" data-pad-key="'+esc(k.value)+'" type="button">'+esc(k.value)+'</button>'}).join('');
  updateToolsPadStatus();
}
function updateToolsPadStatus(){var surface=window.WBToolsSurfaceController;if(surface&&surface.renderPadStatus&&surface.renderPadStatus({document:document,state:toolPadState}))return;var el=qs('tools-pad-status'),owner=window.WBToolsController;if(el)el.textContent=owner&&owner.padStatus?owner.padStatus(toolPadState):(toolPadState.playing?('Playing '+toolPadState.type+' pad in '+toolPadState.key):('Ready: '+toolPadState.type+' pad in '+toolPadState.key))}
function toolsActionAdapters(){
  var actions=window.WBToolsStateActionController;
  var base={
    chordState:chordNnsState,
    document:document,
    keys:TOOL_KEYS,
    types:PAD_TYPES,
    showToast:showToast,
    renderChordNns:renderToolsChordNns,
    renderNnsDiagram:renderNnsDiagram,
    updateNnsConversion:updateNnsConversion,
    initPads:initToolsPads,
    updatePadStatus:updateToolsPadStatus,
    getPadState:function(){return toolPadState},
    setPadState:function(next){toolPadState=next||toolPadState} 
  };
  return actions&&actions.makeToolsActionAdapters?actions.makeToolsActionAdapters(base):null;
}
window.openToolsHome=openToolsHome;window.openToolsBible=openToolsBible;window.openToolsKeyCapo=openToolsKeyCapo;window.openToolsPads=openToolsPads;window.openToolsChordNns=openToolsChordNns;

var BibleController=window.WBBibleController||{};
var bibleState=BibleController.defaultState?BibleController.defaultState(settings):{book:'John',chapter:3,version:String(settings.defaultBibleVersion||'esv').toLowerCase()};
var BIBLE_VERSIONS=BibleController.BIBLE_VERSIONS||[{id:'esv',abbr:'ESV',name:'English Standard Version',folder:'esv_chapter_package'}];
if(SETTINGS_CHOICES&&SETTINGS_CHOICES.defaultBibleVersion)SETTINGS_CHOICES.defaultBibleVersion=(BibleController.settingsChoices?BibleController.settingsChoices():BIBLE_VERSIONS.map(function(v){return [v.id,v.abbr]}));
var BIBLE_BOOKS=BibleController.BIBLE_BOOKS||['John'];
var BIBLE_CHAPTERS=BibleController.BIBLE_CHAPTERS||{John:21};
var bibleRuntime={loading:false,error:'',index:null,books:[],chapterCache:Object.create(null),loadPromise:null,basePath:'',source:'none'};
var bibleRenderSeq=0;
function getBibleVersionMeta(id){return BibleController.getVersionMeta?BibleController.getVersionMeta(id,settings):(BIBLE_VERSIONS.find(function(v){return v.id===String(id||bibleState.version||settings.defaultBibleVersion||'esv').toLowerCase()})||BIBLE_VERSIONS[0])}
function normalizeBibleState(){if(BibleController.normalizeState)return BibleController.normalizeState(bibleState,bibleRuntime,settings);var books=bibleRuntime.books&&bibleRuntime.books.length?bibleRuntime.books:BIBLE_BOOKS;if(books.indexOf(bibleState.book)<0)bibleState.book=books.indexOf('John')>=0?'John':books[0];var max=bibleChapterCount(bibleState.book);bibleState.chapter=Math.max(1,Math.min(max,parseInt(bibleState.chapter,10)||1));return bibleState}
function biblePackageReady(){return (bibleRuntime&&bibleRuntime.source==='package')&&(BibleController.packageReady?BibleController.packageReady(bibleRuntime):!!(bibleRuntime.index&&bibleRuntime.books&&bibleRuntime.books.length))}
function bibleChapterCount(book){return BibleController.chapterCount?BibleController.chapterCount(book,bibleRuntime):(BIBLE_CHAPTERS[book]||28)}
function getBibleBookMeta(book){if(!(bibleRuntime&&bibleRuntime.index&&bibleRuntime.books&&bibleRuntime.books.length))return null;return BibleController.getBookMeta?BibleController.getBookMeta(book,bibleRuntime):((bibleRuntime.index.books||[]).find(function(b){return b.name===book})||null)}
function bibleBookSlug(book){return BibleController.bookSlug?BibleController.bookSlug(book,bibleRuntime):(String(book||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''))}
function normalizeBibleChapterData(raw,book,chapter){return BibleController.normalizeChapterData?BibleController.normalizeChapterData(raw,book,chapter):(function(){raw=raw||{};return {book:raw.book||book,chapter:parseInt(raw.chapter,10)||parseInt(chapter,10)||1,verses:[]}})()}
function bibleCacheId(version,book,chapter){return BibleController.cacheId?BibleController.cacheId(version,book,chapter,bibleRuntime):(String(version||'esv')+'::'+bibleBookSlug(book)+'::'+String(chapter))}

function biblePackageRoots(versionMeta){
  var folder=String((versionMeta&&versionMeta.folder)||'esv_chapter_package').replace(/\/+$/,'');
  var roots=[];
  function add(root){root=String(root||'').replace(/\/+$/,'');if(root&&roots.indexOf(root)<0)roots.push(root)}
  if(bibleRuntime&&bibleRuntime.basePath)add(bibleRuntime.basePath);
  add(folder);
  add('./'+folder);
  try{
    var dir=(location&&location.pathname?location.pathname:'/').replace(/\/[^\/]*$/,'/');
    if(dir&&dir!=='/')add(dir+folder);
  }catch(e){}
  return roots;
}
async function fetchBiblePackageJson(parts){
  var versionMeta=getBibleVersionMeta();
  var roots=biblePackageRoots(versionMeta);
  var urls=[];
  function addUrl(u){if(u&&urls.indexOf(u)<0)urls.push(u)}
  roots.forEach(function(root){addUrl(root+'/'+parts.join('/'))});
  var lastErr=null;
  for(var i=0;i<urls.length;i++){
    try{
      var res=await fetch(urls[i],{cache:'no-cache'});
      if(res&&res.ok){
        bibleRuntime.basePath=urls[i].slice(0,urls[i].length-('/'+parts.join('/')).length).replace(/\/+$/,'');
        return await res.json();
      }
      lastErr=new Error('Bible package fetch failed: '+urls[i]+' ('+(res&&res.status)+')');
    }catch(e){lastErr=e}
  }
  /* Retry once with an explicit cache-buster. This clears old iOS/PWA or service-worker
     404 cache entries created before the package folder was uploaded. */
  for(var j=0;j<urls.length;j++){
    try{
      var bust=urls[j]+(urls[j].indexOf('?')>=0?'&':'?')+'wb_pkg='+Date.now();
      var fresh=await fetch(bust,{cache:'reload'});
      if(fresh&&fresh.ok){
        bibleRuntime.basePath=urls[j].slice(0,urls[j].length-('/'+parts.join('/')).length).replace(/\/+$/,'');
        return await fresh.json();
      }
      lastErr=new Error('Bible package reload failed: '+urls[j]+' ('+(fresh&&fresh.status)+')');
    }catch(e2){lastErr=e2}
  }
  throw lastErr||new Error('Bible package file not found');
}
async function loadBibleData(force){
  if(!force&&biblePackageReady())return Promise.resolve(bibleRuntime.index);
  if(bibleRuntime.loadPromise&&!force)return bibleRuntime.loadPromise;
  var versionMeta=getBibleVersionMeta();
  bibleRuntime.loading=true;
  bibleRuntime.error='';
  bibleRuntime.loadPromise=fetchBiblePackageJson(['bible-index.json']).then(function(data){
    var normalizedIndex=BibleController.normalizeIndex?BibleController.normalizeIndex(data):{index:data||{},books:(data&&data.books||[]).map(function(b){return b.name}).filter(Boolean)};
    bibleRuntime.index=normalizedIndex.index||{};
    bibleRuntime.books=normalizedIndex.books||[];
    if(!bibleRuntime.books.length)throw new Error('Bible index is empty');
    bibleRuntime.chapterCache=Object.create(null);
    bibleRuntime.source='package';
    normalizeBibleState();
    saveBibleCache();
    persistRouteMemory();
    return data;
  }).catch(function(){
    bibleRuntime.index=BibleController.fallbackIndex?BibleController.fallbackIndex(bibleRuntime,versionMeta):(bibleRuntime.index&&Object.keys(bibleRuntime.index).length?bibleRuntime.index:{books:BIBLE_BOOKS.map(function(name){return {name:name,slug:bibleBookSlug(name),chapters:BIBLE_CHAPTERS[name]||1}}),meta:{copyright:versionMeta.name}});
    bibleRuntime.books=bibleRuntime.books&&bibleRuntime.books.length?bibleRuntime.books:BIBLE_BOOKS.slice();
    bibleRuntime.source='missing-package';
    bibleRuntime.error='Unable to load Bible data. Keep the esv_chapter_package folder in the same published site path as this app file, with bible-index.json and bible/<book>/<chapter>.json files.';
    normalizeBibleState();
    saveBibleCache();
    return bibleRuntime.index;
  }).finally(function(){
    bibleRuntime.loading=false;
    bibleRuntime.loadPromise=null;
    renderBibleShell();
  });
  return bibleRuntime.loadPromise;
}
async function loadBibleChapterFromFirebase(book,chapter){
  var version=String(bibleState.version||'esv').toLowerCase();
  var slug=bibleBookSlug(book);
  var paths=cloudFirestorePaths();
  try{
    var db=await firebaseRealtimeDb();
    var base=paths.biblePath||paths.bibleCollection||'bibleChapters';
    var attempts=BibleController.firebasePathAttempts?BibleController.firebasePathAttempts(paths,version,book,chapter,bibleRuntime):[base+'/'+version+'/'+slug+'/'+chapter,base+'/'+slug+'/'+chapter,base+'/'+version+'/'+book+'/'+chapter];
    for(var i=0;i<attempts.length;i++){
      var snap=await db.ref(attempts[i]).once('value');
      var data=snap&&typeof snap.val==='function'?snap.val():null;
      if(data){
        var normalized=normalizeBibleChapterData(data,book,chapter);
        if(normalized.verses&&normalized.verses.length)return normalized;
      }
    }
  }catch(e){}
  try{
    var fdb=await firebaseFirestore();
    var coll=fdb.collection(paths.bibleCollection||'bibleChapters');
    var idCandidates=BibleController.firestoreDocCandidates?BibleController.firestoreDocCandidates(version,book,chapter,bibleRuntime):[version+'__'+slug+'__'+chapter,version+'_'+slug+'_'+chapter,slug+'_'+chapter+'_'+version,slug+'_'+chapter,book+'_'+chapter];
    for(var j=0;j<idCandidates.length;j++){
      var doc=await coll.doc(idCandidates[j]).get();
      if(doc&&doc.exists){
        var normalizedDoc=normalizeBibleChapterData(doc.data()||{},book,chapter);
        if(normalizedDoc.verses&&normalizedDoc.verses.length)return normalizedDoc;
      }
    }
    var queries=[
      coll.where('version','==',version).where('book','==',book).where('chapter','==',Number(chapter)),
      coll.where('version','==',version).where('bookKey','==',slug).where('chapter','==',Number(chapter)),
      coll.where('book','==',book).where('chapter','==',Number(chapter))
    ];
    for(var q=0;q<queries.length;q++){
      try{
        var snapQ=await queries[q].get();
        if(snapQ&&!snapQ.empty){
          var first=snapQ.docs[0];
          var normalizedQ=normalizeBibleChapterData(first.data()||{},book,chapter);
          if(normalizedQ.verses&&normalizedQ.verses.length)return normalizedQ;
        }
      }catch(e){}
    }
  }catch(e){}
  throw new Error('Bible chapter not found');
}
async function loadBibleChapter(book,chapter){
  var cacheId=bibleCacheId(bibleState.version,book,chapter);
  if(bibleRuntime.chapterCache[cacheId])return bibleRuntime.chapterCache[cacheId];
  var meta=getBibleBookMeta(book);
  if(meta&&biblePackageReady()){
    var pkgData=normalizeBibleChapterData(await fetchBiblePackageJson(['bible',meta.slug,String(chapter)+'.json']),book,chapter);
    if(pkgData.verses&&pkgData.verses.length){
      bibleRuntime.chapterCache[cacheId]=pkgData;
      saveBibleCache();
      return pkgData;
    }
    throw new Error('Chapter file not found in Bible package');
  }
  /* J4.2: do not silently stall Bible navigation through slow cloud fallback.
     v85's reference path is the deployed local chapter package. A cloud fallback
     may be explicitly enabled for future builds, but the default user path is
     package/cache-first and should fail quickly with a clear package message. */
  if(window.WB_ENABLE_BIBLE_CLOUD_FALLBACK===true){
    var firebaseData=await loadBibleChapterFromFirebase(book,chapter);
    bibleRuntime.chapterCache[cacheId]=firebaseData;
    saveBibleCache();
    return firebaseData;
  }
  throw new Error(bibleRuntime.error||'Bible package is not available');
}
function fallbackCopyText(text){try{var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';ta.style.top='0';document.body.appendChild(ta);ta.select();var ok=document.execCommand&&document.execCommand('copy');ta.remove();return !!ok}catch(e){return false}}
function copyBibleChapter(){var text=bibleRuntime&&bibleRuntime.currentCopyText;if(!text){showToast('No chapter text to copy');return}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){showToast('Chapter copied')}).catch(function(){if(fallbackCopyText(text))showToast('Chapter copied');else showToast('Copy unavailable')});return}if(fallbackCopyText(text))showToast('Chapter copied');else showToast('Copy unavailable')}
function copyBibleVerse(ref,text){text=String(text||'').trim();if(!text){showToast('No verse text to copy');return}var refText=String(ref||'Verse').trim();var out=(refText+' - '+text).trim();if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(out).then(function(){showToast((ref||'Verse')+' copied')}).catch(function(){if(fallbackCopyText(out))showToast((ref||'Verse')+' copied');else showToast('Copy unavailable')});return}if(fallbackCopyText(out))showToast((ref||'Verse')+' copied');else showToast('Copy unavailable')}
function renderBibleShell(){
  normalizeBibleState();
  var seq=++bibleRenderSeq;
  var requested={book:bibleState.book,chapter:bibleState.chapter,version:bibleState.version};
  var book=qs('bible-book-label'),chap=qs('bible-chapter-label'),ver=qs('bible-version-label'),card=qs('bible-card');
  if(book)book.textContent=requested.book;
  if(chap)chap.textContent=requested.chapter;
  var vmeta=getBibleVersionMeta(requested.version);
  if(ver)ver.textContent=vmeta.abbr;
  if(!card)return Promise.resolve();
  var cacheId=bibleCacheId(requested.version,requested.book,requested.chapter);
  var hasCached=!!(bibleRuntime.chapterCache&&bibleRuntime.chapterCache[cacheId]);
  bibleRuntime.currentCopyText='';
  var toolsRender=window.WBToolsRenderModel||{};
  if(bibleRuntime.loading&&!biblePackageReady()){
    if(window.WBToolsSurfaceController&&window.WBToolsSurfaceController.renderBibleChapterSurface)window.WBToolsSurfaceController.renderBibleChapterSurface({document:document,state:'loading',model:{heading:'Loading Bible…',copy:'Checking the local Bible package on this device.'}});else card.innerHTML=toolsRender.bibleLoadingHtml?toolsRender.bibleLoadingHtml({heading:'Loading Bible…',copy:'Checking the local Bible package on this device.'}):'<div class="bible-loading-state"><div class="bible-heading">Loading Bible…</div><div class="bible-copy">Checking the local Bible package on this device.</div></div>';
    return Promise.resolve();
  }
  if(!hasCached){
    if(window.WBToolsSurfaceController&&window.WBToolsSurfaceController.renderBibleChapterSurface)window.WBToolsSurfaceController.renderBibleChapterSurface({document:document,state:'loading',model:{heading:requested.book+' '+requested.chapter,copy:'Loading chapter…'}});else card.innerHTML=toolsRender.bibleLoadingHtml?toolsRender.bibleLoadingHtml({heading:requested.book+' '+requested.chapter,copy:'Loading chapter…'}):'<div class="bible-loading-state"><div class="bible-heading">'+esc(requested.book+' '+requested.chapter)+'</div><div class="bible-copy">Loading chapter…</div></div>';
  }
  return loadBibleChapter(requested.book,requested.chapter).then(function(chapterData){
    if(seq!==bibleRenderSeq)return;
    var stillCurrent=String(bibleState.book)===String(requested.book)&&String(bibleState.chapter)===String(requested.chapter)&&String(bibleState.version)===String(requested.version);
    if(!stillCurrent)return;
    var verseData=(chapterData&&chapterData.verses)||[];
    var heading=((chapterData&&chapterData.book)||requested.book)+' '+String((chapterData&&chapterData.chapter)||requested.chapter);
    var footer=(bibleRuntime.index&&bibleRuntime.index.meta&&bibleRuntime.index.meta.copyright)||vmeta.name;
    var model={heading:heading,book:(chapterData&&chapterData.book)||requested.book,chapter:(chapterData&&chapterData.chapter)||requested.chapter,versionAbbr:vmeta.abbr,verses:verseData,footer:footer};
    bibleRuntime.currentCopyText=toolsRender.bibleCopyText?toolsRender.bibleCopyText(model):(heading+' ('+vmeta.abbr+')\n\n'+verseData.map(function(v){return String(v.number||v.verse||'')+' '+String(v.text||'')}).join('\n')).trim();
    if(window.WBToolsSurfaceController&&window.WBToolsSurfaceController.renderBibleChapterSurface)window.WBToolsSurfaceController.renderBibleChapterSurface({document:document,state:'chapter',model:model});else card.innerHTML=toolsRender.bibleChapterHtml?toolsRender.bibleChapterHtml(model):('<div class="bible-heading">'+esc(heading)+'</div><div class="bible-heading-sub">'+esc(vmeta.abbr+' · '+verseData.length+' verse'+(verseData.length===1?'':'s'))+'</div>'+verseData.map(function(v){var n=String(v.number||v.verse||'');var t=String(v.text||'');return '<div class="bible-verse"><button class="bible-vnum" data-bible-copy-verse="'+esc(n)+'" data-bible-copy-text="'+esc(t)+'" type="button" aria-label="Copy '+esc(heading+':'+n)+'">'+esc(n)+'</button><span class="bible-vtext">'+esc(t)+'</span></div>'}).join('')+'<div class="bible-copy">'+esc(footer)+'</div>');
  }).catch(function(){
    if(seq!==bibleRenderSeq)return;
    var stillCurrent=String(bibleState.book)===String(requested.book)&&String(bibleState.chapter)===String(requested.chapter)&&String(bibleState.version)===String(requested.version);
    if(!stillCurrent)return;
    if(window.WBToolsSurfaceController&&window.WBToolsSurfaceController.renderBibleChapterSurface)window.WBToolsSurfaceController.renderBibleChapterSurface({document:document,state:'error',model:{heading:requested.book+' '+requested.chapter,title:'Unable to load Bible data',copy:bibleRuntime.error||'Keep the esv_chapter_package folder in the same published site path as this app file.'}});else card.innerHTML=toolsRender.bibleErrorHtml?toolsRender.bibleErrorHtml({heading:requested.book+' '+requested.chapter,title:'Unable to load Bible data',copy:bibleRuntime.error||'Keep the esv_chapter_package folder in the same published site path as this app file.'}):'<div class="bible-loading-state bible-error-state"><div class="bible-heading">'+esc(requested.book+' '+requested.chapter)+'</div><div class="bible-empty-title">Unable to load Bible data</div><div class="bible-copy">'+esc(bibleRuntime.error||'Keep the esv_chapter_package folder in the same published site path as this app file.')+'</div></div>';
  });
}
function renderBiblePicker(){normalizeBibleState();var books=qs('bible-book-picker-list'),chapters=qs('bible-chapter-picker-list');if(!books||!chapters)return;var bookModels=BibleController.bookModels?BibleController.bookModels(bibleState,bibleRuntime):(bibleRuntime.books&&bibleRuntime.books.length?bibleRuntime.books:BIBLE_BOOKS).map(function(b){return {book:b,active:b===bibleState.book}});var chapterModels=BibleController.chapterModels?BibleController.chapterModels(bibleState,bibleRuntime):Array.from({length:bibleChapterCount(bibleState.book)},function(_,i){var n=i+1;return {chapter:n,active:n===bibleState.chapter}});if(window.WBToolsSurfaceController&&window.WBToolsSurfaceController.renderBiblePickerSurface&&window.WBToolsSurfaceController.renderBiblePickerSurface({document:document,books:bookModels,chapters:chapterModels}))return;var toolsRender=window.WBToolsRenderModel||{};if(toolsRender.biblePickerHtml){var html=toolsRender.biblePickerHtml({books:bookModels,chapters:chapterModels});books.innerHTML=html.booksHtml||'';chapters.innerHTML=html.chaptersHtml||'';}else{books.innerHTML=bookModels.map(function(m){return '<button class="bible-picker-item '+(m.active?'active':'')+'" data-bible-book="'+esc(m.book)+'" type="button"><span class="truncate">'+esc(m.book)+'</span></button>'}).join('');chapters.innerHTML=chapterModels.map(function(m){return '<button class="bible-picker-item chapter-item '+(m.active?'active':'')+'" data-bible-chapter="'+m.chapter+'" type="button">'+m.chapter+'</button>'}).join('');}setTimeout(function(){var a=books.querySelector('.active');if(a)a.scrollIntoView({block:'center'});var c=chapters.querySelector('.active');if(c)c.scrollIntoView({block:'center'});},0)}
function openBiblePicker(){renderBiblePicker();var m=qs('bs-biblepicker');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}}
function closeBiblePicker(){var m=qs('bs-biblepicker');if(m)closeSheetElement(m)}
function renderBibleVersionPicker(){var el=qs('bible-version-list');if(!el)return;var models=(BibleController.versionModels?BibleController.versionModels(bibleState,bibleRuntime):BIBLE_VERSIONS.map(function(v){var active=v.id===bibleState.version;return {id:v.id,abbr:v.abbr,name:v.name,active:active,sourceLabel:active?(biblePackageReady()?'Package ready on this device':'Selected on this device'):('Local package: '+v.folder)}}));if(window.WBToolsSurfaceController&&window.WBToolsSurfaceController.renderBibleVersionPickerSurface&&window.WBToolsSurfaceController.renderBibleVersionPickerSurface({document:document,versions:models}))return;var toolsRender=window.WBToolsRenderModel||{};el.innerHTML=toolsRender.bibleVersionPickerHtml?toolsRender.bibleVersionPickerHtml(models):models.map(function(v){return '<button class="bible-version-item" data-bible-version="'+esc(v.id)+'" type="button"><span class="bible-version-copy"><span class="bible-version-title">'+esc(v.abbr+' - '+v.name)+'</span><span class="bible-version-sub">'+esc(v.sourceLabel)+'</span></span><span class="setdest-state">'+(v.active?'Selected':'Choose')+'</span></button>'}).join('')}
function openBibleVersionPicker(){renderBibleVersionPicker();var m=qs('bs-bibleversion');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false')}}
function closeBibleVersionPicker(){var m=qs('bs-bibleversion');if(m)closeSheetElement(m)}
window.openBiblePicker=openBiblePicker;window.closeBiblePicker=closeBiblePicker;window.openBibleVersionPicker=openBibleVersionPicker;window.closeBibleVersionPicker=closeBibleVersionPicker;
window.changeBibleChapter=changeBibleChapter;function changeBibleChapter(delta){var actions=window.WBToolsStateActionController;if(actions&&actions.changeBibleChapter){actions.changeBibleChapter({controller:BibleController,bibleState:bibleState,bibleRuntime:bibleRuntime,settings:settings,persistRouteMemory:persistRouteMemory,renderShell:renderBibleShell},delta);return}if(BibleController.changeChapter)BibleController.changeChapter(bibleState,bibleRuntime,delta,settings);else{normalizeBibleState();bibleState.chapter+=parseInt(delta,10)||0}persistRouteMemory();renderBibleShell()}
function installBibleControls(){var book=qs('bible-book-btn'),chapter=qs('bible-chapter-btn'),version=qs('bible-version-btn'),card=qs('bible-card');if(card&&!card.dataset.copyReady){card.dataset.copyReady='1';card.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-bible-copy-verse]');if(b){e.preventDefault();var ref=(bibleState.book||'')+' '+(bibleState.chapter||'')+':'+(b.dataset.bibleCopyVerse||'');copyBibleVerse(ref,b.dataset.bibleCopyText||'')}})}if(book&&!book.dataset.ready){book.dataset.ready='1';book.addEventListener('click',function(){openBiblePicker('book')})}if(chapter&&!chapter.dataset.ready){chapter.dataset.ready='1';chapter.addEventListener('click',function(){openBiblePicker('chapter')})}if(version&&!version.dataset.ready){version.dataset.ready='1';version.addEventListener('click',openBibleVersionPicker)}var picker=qs('bs-biblepicker');if(picker&&!picker.dataset.ready){picker.dataset.ready='1';picker.addEventListener('click',function(e){if(e.target===picker||e.target.id==='biblepicker-close'){closeBiblePicker();return}var b=e.target.closest('[data-bible-book],[data-bible-chapter]');if(!b)return;if(b.dataset.bibleBook){var actions=window.WBToolsStateActionController;if(actions&&actions.setBibleBook){actions.setBibleBook({controller:BibleController,bibleState:bibleState,bibleRuntime:bibleRuntime,settings:settings,persistRouteMemory:persistRouteMemory,renderPicker:renderBiblePicker,renderShell:renderBibleShell,chapterCount:bibleChapterCount},b.dataset.bibleBook);return}if(BibleController.setBook)BibleController.setBook(bibleState,bibleRuntime,b.dataset.bibleBook,settings);else{bibleState.book=b.dataset.bibleBook;bibleState.chapter=Math.min(bibleState.chapter,bibleChapterCount(bibleState.book));}persistRouteMemory();renderBiblePicker();renderBibleShell();return}if(b.dataset.bibleChapter){var actions=window.WBToolsStateActionController;if(actions&&actions.setBibleChapter){actions.setBibleChapter({controller:BibleController,bibleState:bibleState,bibleRuntime:bibleRuntime,settings:settings,persistRouteMemory:persistRouteMemory,renderShell:renderBibleShell,closePicker:closeBiblePicker},b.dataset.bibleChapter);return}if(BibleController.setChapter)BibleController.setChapter(bibleState,bibleRuntime,b.dataset.bibleChapter,settings);else bibleState.chapter=parseInt(b.dataset.bibleChapter,10)||1;persistRouteMemory();renderBibleShell();closeBiblePicker()}})}var versionSheet=qs('bs-bibleversion');if(versionSheet&&!versionSheet.dataset.ready){versionSheet.dataset.ready='1';versionSheet.addEventListener('click',function(e){if(e.target===versionSheet||e.target.id==='bibleversion-close'){closeBibleVersionPicker();return}var b=e.target.closest('[data-bible-version]');if(!b)return;var actions=window.WBToolsStateActionController;if(actions&&actions.setBibleVersion){actions.setBibleVersion({controller:BibleController,bibleState:bibleState,bibleRuntime:bibleRuntime,settings:settings,persistSettings:persistSettings,persistRouteMemory:persistRouteMemory,loadBibleData:loadBibleData,renderSettings:renderSettings,closeVersionPicker:closeBibleVersionPicker},b.dataset.bibleVersion);return}if(BibleController.setVersion)BibleController.setVersion(bibleState,b.dataset.bibleVersion,settings);else bibleState.version=String(b.dataset.bibleVersion||'esv').toLowerCase();settings.defaultBibleVersion=bibleState.version;persistSettings();persistRouteMemory();loadBibleData(true);renderSettings();closeBibleVersionPicker()})}var prev=qs('bible-prev-btn'),next=qs('bible-next-btn');if(prev&&!prev.dataset.ready){prev.dataset.ready='1';prev.addEventListener('click',function(){changeBibleChapter(-1)})}if(next&&!next.dataset.ready){next.dataset.ready='1';next.addEventListener('click',function(){changeBibleChapter(1)})}}
function installSetListSwipeBack(){var el=qs('setlist-section');if(!el||el.dataset.swipeBackReady==='1')return;el.dataset.swipeBackReady='1';var sx=0,sy=0,dx=0,tracking=false;el.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(!t)return;var editor=!!(qs('setlist-section')&&qs('setlist-section').classList.contains('wb-editor-mode'));if(!editor)return;sx=t.clientX;sy=t.clientY;dx=0;tracking=sx<96},{passive:true});el.addEventListener('touchmove',function(e){if(!tracking)return;var t=e.touches&&e.touches[0];if(!t)return;dx=t.clientX-sx;var dy=Math.abs(t.clientY-sy);if(dx>16&&dx>dy*1.35)e.preventDefault()},{passive:false});el.addEventListener('touchend',function(){if(!tracking)return;tracking=false;if(dx>82)renderPersonalHome(false)},{passive:true})}
function installToolsSwipeBack(){['tools-section','bible-section'].forEach(function(id){var el=qs(id);if(!el||el.dataset.swipeBackReady==='1')return;el.dataset.swipeBackReady='1';var sx=0,sy=0,dx=0,tracking=false;el.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(!t)return;var inToolPanel=id==='tools-section'&&state.tab==='tools'&&state.toolsPanel&&state.toolsPanel!=='home';var inBible=id==='bible-section'&&state.toolsPanel==='bible';if(!inToolPanel&&!inBible)return;sx=t.clientX;sy=t.clientY;dx=0;tracking=sx<96},{passive:true});el.addEventListener('touchmove',function(e){if(!tracking)return;var t=e.touches&&e.touches[0];if(!t)return;dx=t.clientX-sx;var dy=Math.abs(t.clientY-sy);if(dx>16&&dx>dy*1.35){e.preventDefault()}},{passive:false});el.addEventListener('touchend',function(){if(!tracking)return;tracking=false;if(dx>82)openToolsHome()},{passive:true})})}



var workspaceState={panel:'home',detailType:null,selectedPublishId:null,activeSetId:null,profile:{name:'Workspace',description:'Team planning and shared sets',inviteCode:'WB-TEAM-042'},sets:[]};
function persistWorkspace(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.persistWorkspace?window.WBWorkspaceActionController.persistWorkspace(workspaceActionCtx()):null}

function workspaceSurfaceCtx(){return {document:document,qs:qs,qsa:qsa,workspaceState:workspaceState,workspaceSetController:WorkspaceSetController,personalSets:personalSets,songs:songs,escape:esc,songCode:songCode,resolveSetItemKey:resolveSetItemKey,itemHasExplicitKey:itemHasExplicitKey,keyLabel:workspaceSetKeyLabel,cloudEnabled:cloudFirebaseConfig,syncSetNotesQuickIndicator:syncSetNotesQuickIndicator,persistRouteMemory:function(){persistRouteMemory()},ensureSetShape:ensureSetShape,setHasNotes:setHasNotes};}
function workspaceActionCtx(){var ctx=workspaceSurfaceCtx();return Object.assign(ctx,{state:state,activeSetId:activeSetId,cloudState:cloudState,STORAGE_KEYS:STORAGE_KEYS,writeStoredJson:writeStoredJson,preserveSetArray:preserveSetArray,cloudFirebaseConfig:cloudFirebaseConfig,syncWorkspaceSetToFirebase:syncWorkspaceSetToFirebase,syncWorkspaceProfileToFirebase:syncWorkspaceProfileToFirebase,closeSheetElement:closeSheetElement,showToast:showToast,appConfirm:appConfirm,appPrompt:appPrompt,appAlert:appAlert,dataSafetySnapshot:dataSafetySnapshot,offerDataUndo:offerDataUndo,syncSetCounts:syncSetCounts,persistSets:persistSets,renderPersonalHome:renderPersonalHome,renderSettings:renderSettings,openWorkspaceSetEditorShell:openWorkspaceSetEditorShell,renderWorkspaceSetLists:renderWorkspaceSetLists,showWorkspacePanel:showWorkspacePanel,renderWorkspaceSetDetail:renderWorkspaceSetDetail,renderWorkspacePublishList:renderWorkspacePublishList,renderWorkspaceMembers:renderWorkspaceMembers,renderWorkspaceSettings:renderWorkspaceSettings,openWorkspaceInfoShell:openWorkspaceInfoShell,workspaceCountLabel:workspaceCountLabel,workspaceSetCounts:workspaceSetCounts,uniqueWorkspacePublishName:uniqueWorkspacePublishName,openSetOptions:openSetOptions,commitSetMutation:commitSetMutation,openWorkspaceSongPicker:openWorkspaceSongPicker,openWorkspaceSetKeySheet:openWorkspaceSetKeySheet,openWorkspaceSetItemEditor:openWorkspaceSetItemEditor,showSong:showSong,openSetAddSheet:openSetAddSheet,buildSetSummaryLines:buildSetSummaryLines,buildSetSummaryPreviewHtml:buildSetSummaryPreviewHtml,openExportView:openExportView,openSetNotes:openSetNotes,activeWorkspaceSet:activeWorkspaceSet});}

function workspaceName(){var W=window.WBWorkspaceSurfaceController;return W&&W.workspaceName?W.workspaceName(workspaceSurfaceCtx()):((workspaceState.profile&&workspaceState.profile.name)||'Workspace')}
function workspaceDescription(){var W=window.WBWorkspaceSurfaceController;return W&&W.workspaceDescription?W.workspaceDescription(workspaceSurfaceCtx()):((workspaceState.profile&&workspaceState.profile.description)||'Team planning and shared sets')}
function workspaceSetCounts(set){if(WorkspaceSetController&&WorkspaceSetController.syncCounts){WorkspaceSetController.syncCounts(set);return {songs:(set&&set.songCount)||0,items:(set&&set.itemCount)||0}}var songsN=(set.items||[]).filter(function(i){return i.type==='song'}).length,itemsN=(set.items||[]).filter(function(i){return i.type!=='song'}).length;set.songCount=songsN;set.itemCount=itemsN;set.notes=!!(set.setNotes&&String(set.setNotes).trim());return {songs:songsN,items:itemsN}}
function workspaceCountLabel(set){return WorkspaceSetController&&WorkspaceSetController.countLabel?WorkspaceSetController.countLabel(set):(function(){var c=workspaceSetCounts(set);return c.songs+' '+(c.songs===1?'song':'songs')+(c.items?' · '+c.items+' '+(c.items===1?'item':'items'):'')})()}
function workspaceItemCountLabel(set){return WorkspaceSetController&&WorkspaceSetController.itemCountLabel?WorkspaceSetController.itemCountLabel(set):(function(){var c=workspaceSetCounts(set);return c.songs+' '+(c.songs===1?'song':'songs')+(c.items?' · '+c.items+' '+(c.items===1?'item':'items'):'')})()}
function workspaceDateLabel(set){return WorkspaceSetController&&WorkspaceSetController.dateLabel?WorkspaceSetController.dateLabel(set):(set.updated||'Updated now')}
function workspaceSetKeyLabel(set){return setKeyLabel(set)}
function openWorkspaceHome(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.openWorkspaceHome?window.WBWorkspaceActionController.openWorkspaceHome(workspaceActionCtx()):showWorkspacePanel('home')}
function openWorkspaceSetLists(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.openWorkspaceSetLists?window.WBWorkspaceActionController.openWorkspaceSetLists(workspaceActionCtx()):(renderWorkspaceSetLists(),showWorkspacePanel('setlists'))}

function createPersonalSetDraft(name){
  var created=PersonalSetController&&PersonalSetController.createSet?PersonalSetController.createSet(name,{idPrefix:'new'}):{id:'new-'+Date.now(),name:(name&&name.trim())||'New set list',songCount:0,itemCount:0,updated:'Updated now',notes:false,source:'Personal',entries:[],textItems:[],items:[],setKey:'original',setNotes:'',songNotes:{},songCues:{}};
  if(PersonalSetController&&PersonalSetController.addSet)PersonalSetController.addSet(personalSets,created);else personalSets.unshift(created);
  activeSetId=created.id;
  persistSets();renderPersonalHome();renderSettings();return created.id
}
function openPersonalNewSheet(){var input=qs('personal-new-name');if(input)input.value='';var m=qs('bs-personal-new');if(m){m.classList.add('open');m.setAttribute('aria-hidden','false');setTimeout(function(){if(input)input.focus({preventScroll:true})},60)}}
function closePersonalNewSheet(){var m=qs('bs-personal-new');if(m)closeSheetElement(m)}
function savePersonalNew(){var input=qs('personal-new-name');var name=(input&&input.value||'New set list').trim()||'New set list';var id=createPersonalSetDraft(name);closePersonalNewSheet();openSet(id);showToast('Set list created')}
function createWorkspaceSetDraft(name){
  var id='ws-'+Date.now();
  workspaceState.sets.unshift({id:id,name:(name&&name.trim())||'New Workspace set',updated:'Updated now',notes:false,setKey:'original',items:[],setNotes:''});
  persistWorkspace();renderWorkspaceSetLists();renderSettings();return id
}
function showWorkspacePanel(panel){var W=window.WBWorkspaceSurfaceController;if(W&&W.showWorkspacePanel)return W.showWorkspacePanel(workspaceSurfaceCtx(),panel);workspaceState.panel=panel||'home';qsa('#workspace-section .workspace-panel,#workspace-section .workspace-subview').forEach(function(p){p.classList.remove('active')});var id=panel==='home'?'workspace-home-panel':panel==='setlists'?'workspace-setlists-panel':'workspace-detail-panel';var el=qs(id);if(el)el.classList.add('active');persistRouteMemory()}
function renderWorkspaceSetLists(){var W=window.WBWorkspaceSurfaceController;if(W&&W.renderWorkspaceSetLists)return W.renderWorkspaceSetLists(workspaceSurfaceCtx());}
function workspaceEditorItemHtml(set,item,idx){var W=window.WBWorkspaceSurfaceController;if(W&&W.workspaceEditorItemHtml)return W.workspaceEditorItemHtml(workspaceSurfaceCtx(),set,item,idx);return ''}
function renderWorkspaceSetDetail(set){var W=window.WBWorkspaceSurfaceController;if(W&&W.renderWorkspaceSetDetail)return W.renderWorkspaceSetDetail(workspaceSurfaceCtx(),set);}
function openWorkspaceSetEditorShell(id){var set=workspaceState.sets.find(function(x){return x.id===id});if(!set)return;workspaceState.activeSetId=id;workspaceState.detailType='set';renderWorkspaceSetDetail(set);showWorkspacePanel('detail')}
function renderWorkspaceMembers(){var W=window.WBWorkspaceSurfaceController;if(W&&W.renderWorkspaceMembers)return W.renderWorkspaceMembers(workspaceSurfaceCtx());}
function renderWorkspaceSettings(){var W=window.WBWorkspaceSurfaceController;if(W&&W.renderWorkspaceSettings)return W.renderWorkspaceSettings(workspaceSurfaceCtx());}
function openWorkspaceInfoShell(kind){var W=window.WBWorkspaceSurfaceController;if(W&&W.openWorkspaceInfoShell)return W.openWorkspaceInfoShell(workspaceSurfaceCtx(),kind);if(kind==='Members & invites')renderWorkspaceMembers();else renderWorkspaceSettings()}
function workspacePublishCounts(set){var W=window.WBWorkspaceSurfaceController;return W&&W.workspacePublishCounts?W.workspacePublishCounts(workspaceSurfaceCtx(),set):(function(){set=ensureSetShape(set);var songs=(set.entries||[]).length,items=(set.textItems||[]).length,notes=setHasNotes(set);return {songs:songs,items:items,notes:notes}})()}
function workspacePublishCountText(c){var W=window.WBWorkspaceSurfaceController;return W&&W.workspacePublishCountText?W.workspacePublishCountText(c):(function(){var bits=[c.songs+' song'+(c.songs===1?'':'s')];if(c.items)bits.push(c.items+' item'+(c.items===1?'':'s'));return bits.join(' · ')})()}
function workspacePublishPills(set){var W=window.WBWorkspaceSurfaceController;return W&&W.workspacePublishPills?W.workspacePublishPills(workspaceSurfaceCtx(),set):(function(){var c=workspacePublishCounts(set),html='<span class="wb-transfer-pill good">'+esc(workspacePublishCountText(c))+'</span>';if(c.notes)html+='<span class="wb-transfer-pill">Notes/cues included</span>';return html})()}
function uniqueWorkspacePublishName(base){var W=window.WBWorkspaceSurfaceController;return W&&W.uniqueWorkspacePublishName?W.uniqueWorkspacePublishName(workspaceSurfaceCtx(),base):(WorkspaceSetController&&WorkspaceSetController.uniquePublishName?WorkspaceSetController.uniquePublishName(workspaceState.sets,base):String(base||'Published set'))}
function renderWorkspacePublishList(){var W=window.WBWorkspaceSurfaceController;if(W&&W.renderWorkspacePublishList)return W.renderWorkspacePublishList(workspaceSurfaceCtx());}
function openWorkspacePublishSheet(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.openWorkspacePublishSheet?window.WBWorkspaceActionController.openWorkspacePublishSheet(workspaceActionCtx()):null}
function closeWorkspacePublishSheet(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.closeWorkspacePublishSheet?window.WBWorkspaceActionController.closeWorkspacePublishSheet(workspaceActionCtx()):closeSheetElement(qs('bs-workspace-publish'))}
function saveWorkspacePublish(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.saveWorkspacePublish?window.WBWorkspaceActionController.saveWorkspacePublish(workspaceActionCtx()):null}
function copyWorkspaceSetToPersonal(id){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.copyWorkspaceSetToPersonal?window.WBWorkspaceActionController.copyWorkspaceSetToPersonal(workspaceActionCtx(),id):null}
function openWorkspaceNewSheet(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.openWorkspaceNewSheet?window.WBWorkspaceActionController.openWorkspaceNewSheet(workspaceActionCtx()):null}
function closeWorkspaceNewSheet(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.closeWorkspaceNewSheet?window.WBWorkspaceActionController.closeWorkspaceNewSheet(workspaceActionCtx()):closeSheetElement(qs('bs-workspace-new'))}
function saveWorkspaceNew(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.saveWorkspaceNew?window.WBWorkspaceActionController.saveWorkspaceNew(workspaceActionCtx()):null}
function deleteWorkspaceSet(id){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.deleteWorkspaceSet?window.WBWorkspaceActionController.deleteWorkspaceSet(workspaceActionCtx(),id):null}
function duplicateWorkspaceSet(id){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.duplicateWorkspaceSet?window.WBWorkspaceActionController.duplicateWorkspaceSet(workspaceActionCtx(),id):null}
function openWorkspaceRenameSheet(id){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.openWorkspaceRenameSheet?window.WBWorkspaceActionController.openWorkspaceRenameSheet(workspaceActionCtx(),id):null}
function regenerateWorkspaceInvite(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.regenerateWorkspaceInvite?window.WBWorkspaceActionController.regenerateWorkspaceInvite(workspaceActionCtx()):null}
function copyWorkspaceInvite(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.copyWorkspaceInvite?window.WBWorkspaceActionController.copyWorkspaceInvite(workspaceActionCtx()):null}
function saveWorkspaceProfile(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.saveWorkspaceProfile?window.WBWorkspaceActionController.saveWorkspaceProfile(workspaceActionCtx()):null}
function clearWorkspaceProfile(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.clearWorkspaceProfile?window.WBWorkspaceActionController.clearWorkspaceProfile(workspaceActionCtx()):null}
function editWorkspaceItem(idx){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.editWorkspaceItem?window.WBWorkspaceActionController.editWorkspaceItem(workspaceActionCtx(),idx):null}


function addWorkspaceServiceItem(kind){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.addWorkspaceServiceItem?window.WBWorkspaceActionController.addWorkspaceServiceItem(workspaceActionCtx(),kind):null}
function openWorkspaceSummary(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.openWorkspaceSummary?window.WBWorkspaceActionController.openWorkspaceSummary(workspaceActionCtx()):null}
function openWorkspaceSetKeyPrompt(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.openWorkspaceSetKeyPrompt?window.WBWorkspaceActionController.openWorkspaceSetKeyPrompt(workspaceActionCtx()):openWorkspaceSetKeySheet()}
function openWorkspaceNotesPrompt(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.openWorkspaceNotesPrompt?window.WBWorkspaceActionController.openWorkspaceNotesPrompt(workspaceActionCtx()):openSetNotes('workspace')}
function handleWorkspaceSetOption(act){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.handleWorkspaceSetOption?window.WBWorkspaceActionController.handleWorkspaceSetOption(workspaceActionCtx(),act):null}

function workspaceBack(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.workspaceBack?window.WBWorkspaceActionController.workspaceBack(workspaceActionCtx()):openWorkspaceHome()}
function installWorkspaceSwipeBack(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.installWorkspaceSwipeBack?window.WBWorkspaceActionController.installWorkspaceSwipeBack(workspaceActionCtx()):null}
function moveWorkspaceSetItem(from,to){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.moveWorkspaceSetItem?window.WBWorkspaceActionController.moveWorkspaceSetItem(workspaceActionCtx(),from,to):null}
function installWorkspaceSetDrag(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.installWorkspaceSetDrag?window.WBWorkspaceActionController.installWorkspaceSetDrag(workspaceActionCtx()):null}

function installWorkspaceControls(){return window.WBWorkspaceActionController&&window.WBWorkspaceActionController.installWorkspaceControls?window.WBWorkspaceActionController.installWorkspaceControls(workspaceActionCtx()):renderWorkspaceSetLists()}


function install(){unlockUiInteraction();loadPersisted();if(window.WBAddToSetController&&window.WBAddToSetController.normalizeSettings){settings=window.WBAddToSetController.normalizeSettings(settings);persistSettings()}registerPhaseGNavigationScaffold();rebuildSongsCache();renderLibrary();renderPersonalHome();renderSettings();applyBrandAssets();markUiReady();clearLaunchTheme();ensureOfflineFirstRuntime();scheduleLaunchFailsafe();if(songs&&songs.length){try{hideLoading('cache')}catch(e){}showSync('Loaded from cache')}migrateV85IndexedDBSongs();connectFirebaseRuntimeIfConfigured();qs('srch-inp').addEventListener('input',function(){state.query=this.value;qs('srch-clr').style.display=state.query?'block':'none';renderLibrary()});qs('srch-clr').addEventListener('click',function(){state.query='';qs('srch-inp').value='';this.style.display='none';renderLibrary()});qs('search-scope-select').addEventListener('change',function(){setSearchScope(this.value)});setSearchScope(state.scope||'smart');qs('library-filter-row').addEventListener('click',function(e){var b=e.target.closest('[data-filter]');if(!b)return;state.filter=b.dataset.filter;syncLibraryFilterChips();renderLibrary()});qs('vinner').addEventListener('click',function(e){var ms=e.target.closest('[data-manage-select]');if(ms){e.preventDefault();e.stopPropagation();toggleManageSelection(ms.dataset.manageSelect);return}if(adminUnlocked&&manageMode){var mi=e.target.closest('.song-item[data-song-id]');if(mi){e.preventDefault();e.stopPropagation();toggleManageSelection(mi.dataset.songId);return}}var action=e.target.closest('[data-song-swipe-action]');if(action){e.preventDefault();e.stopPropagation();var sid=action.dataset.songId;if(action.dataset.songSwipeAction==='copy')copySongLyricsById(sid);else openSetDestinationForSong(sid);resetLibrarySwipe(action.closest('.song-row-wrap')&&action.closest('.song-row-wrap').querySelector('.song-item'));return}var fav=e.target.closest('.song-fav-btn');if(fav){e.stopPropagation();var host=fav.closest('.song-item[data-song-id]');var fs=host&&songs.find(function(x){return x.id===host.dataset.songId});if(fs){setSongFavorite(fs.id,!fs.favorite)}return}var item=e.target.closest('.song-item[data-song-id]');if(item){if(item.classList.contains('swiped-r')||item.classList.contains('swiped-l')){resetLibrarySwipe(item);return}var ss=songs.find(function(x){return x.id===item.dataset.songId});if(ss)showSong(ss,'library')}});qs('vinner').addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var item=e.target.closest('.song-item[data-song-id]');if(!item)return;e.preventDefault();var s=songs.find(function(x){return x.id===item.dataset.songId});if(s)showSong(s)});qs('recent-songs-scroll').addEventListener('click',function(e){var item=e.target.closest('[data-song-id]');if(item){var s=songs.find(function(x){return x.id===item.dataset.songId});if(s)showSong(s,'library')}});qs('clear-recents').addEventListener('click',function(){if(!recentIds.length)return;var snap=dataSafetySnapshot('clear recents');recentIds=[];persistRecents();renderRecents();offerDataUndo('Recents cleared',snap)});installAlphaStrip();installLibraryRowSwipe();qs('vscroll').addEventListener('scroll',function(){qs('scroll-top-btn').classList.toggle('show',this.scrollTop>500)},{passive:true});qs('scroll-top-btn').addEventListener('click',function(){qs('vscroll').scrollTo({top:0,behavior:'smooth'})});var msa=qs('manage-select-all');if(msa)msa.addEventListener('click',selectManageAll);var md=qs('manage-duplicates');if(md)md.addEventListener('click',openAdminDuplicateReview);var mf=qs('manage-select-firebase');if(mf)mf.addEventListener('click',function(){selectManageBySource('firebase')});var ml=qs('manage-select-local');if(ml)ml.addEventListener('click',function(){selectManageBySource('local')});var mdel=qs('manage-delete');if(mdel)mdel.addEventListener('click',deleteManageSelected);var mdone=qs('manage-done');if(mdone)mdone.addEventListener('click',function(){toggleManageMode(false)});qsa('.tab-btn').forEach(function(b){b.addEventListener('click',function(){window.WBNavigationController?window.WBNavigationController.showTab(b.dataset.tab,'tab-click'):switchTab(b.dataset.tab)})});qs('wb-personal-list').addEventListener('click',function(e){var del=e.target.closest('[data-delete-set]');if(del){e.stopPropagation();var doomed=personalSets.find(function(x){return x.id===del.dataset.deleteSet});appConfirm('Delete this set list?',{title:'Delete set list',detail:doomed?('This set list has '+countLabel(doomed)+'. You can undo immediately after deleting.'):'You can undo immediately after deleting.',confirmText:'Delete',danger:true}).then(function(ok){if(!ok)return;var snap=dataSafetySnapshot('delete set list');personalSets=personalSets.filter(function(x){return x.id!==del.dataset.deleteSet});persistSets();renderPersonalHome();renderSettings();offerDataUndo('Set deleted',snap)});return}var card=e.target.closest('[data-set-id]');if(card)openSet(card.dataset.setId)});qs('wb-personal-new').addEventListener('click',openPersonalNewSheet);qs('wb-editor-back').addEventListener('click',renderPersonalHome);var setEditorHost=qs('wb-set-editor');if(setEditorHost&&!setEditorHost.dataset.qa1HeaderReady){setEditorHost.dataset.qa1HeaderReady='1';setEditorHost.addEventListener('click',function(e){var clear=e.target.closest('#clear-set');if(clear){e.preventDefault();e.stopPropagation();clearCurrentSet();return}var action=e.target.closest('[data-set-action]');if(!action)return;var act=action.dataset.setAction;if(act==='notes'){e.preventDefault();e.stopPropagation();openSetNotes();return}if(act==='more'){e.preventDefault();e.stopPropagation();openSetOptions();return}if(act==='set-key'){e.preventDefault();e.stopPropagation();openSetKeySheet();return}})}qs('sl-clear-btn').addEventListener('click',clearCurrentSet);qs('sl-add-btn').addEventListener('click',openSetSongPicker);qs('sl-options-btn').addEventListener('click',openSetOptions);qs('sl-set-key-info').addEventListener('click',openSetKeySheet);qs('wb-editor-publish').addEventListener('click',openWorkspacePublishSheet);qs('sl-items').addEventListener('click',function(e){if(qs('sl-items').dataset.dragSuppress==='1'){e.preventDefault();e.stopPropagation();return}var key=e.target.closest('.set-key-btn');if(key){e.stopPropagation();openSetKeySheet(parseInt(key.dataset.keyIndex,10));return}var rm=e.target.closest('[data-remove-index]');if(rm){e.stopPropagation();removeSetItem(parseInt(rm.dataset.removeIndex,10));return}var editable=e.target.closest('.set-section-card,.text-set-card');if(editable){e.stopPropagation();openSetItemEditor(parseInt(editable.dataset.setIndex,10));return}var item=e.target.closest('[data-song-id]');if(item){var s=songs.find(function(x){return x.id===item.dataset.songId});if(s)showSong(s,'setlist',{scope:'personal',setId:activeSetId,index:parseInt(item.dataset.setIndex,10)})}});qs('song-back-btn').addEventListener('click',closeSongViewSmooth);qsa('.seg-btn').forEach(function(b){b.addEventListener('click',function(){setSongMode(b.dataset.mode)})});qs('add-song-close').addEventListener('click',closeAddSongModal);qs('song-form-cancel').addEventListener('click',closeAddSongModal);qs('song-form-save').addEventListener('click',saveSongFromForm);qs('add-song-modal').addEventListener('click',function(e){if(e.target===this)closeAddSongModal()});qs('hdr-add-btn').addEventListener('click',openAddSongMenu);if(window.WBSettingsAdminDomController&&window.WBSettingsAdminDomController.bindSettingsPickerSheets){window.WBSettingsAdminDomController.bindSettingsPickerSheets(document,{closeSettingsPicker:closeSettingsPicker,updateSetting:updateSetting})}else{qsa('.settings-picker-close').forEach(function(b){b.addEventListener('click',closeSettingsPicker)});qsa('.settings-picker-sheet').forEach(function(m){m.addEventListener('click',function(e){if(e.target===this)closeSettingsPicker()})});qsa('.settings-picker-options').forEach(function(c){c.addEventListener('click',function(e){var opt=e.target.closest('[data-picker-key]');if(!opt)return;updateSetting(opt.dataset.pickerKey,opt.dataset.pickerValue);closeSettingsPicker()})})};qs('backup-centre-close').addEventListener('click',closeBackupCentre);qs('backup-centre-done').addEventListener('click',closeBackupCentre);qs('backup-centre-modal').addEventListener('click',function(e){if(e.target===this)closeBackupCentre()});qs('backup-centre-body').addEventListener('click',function(e){var DSdom=window.WBDataSafetyDomController||null;if(DSdom&&DSdom.handleBackupCentreClick&&DSdom.handleBackupCentreClick(e,{openBackupCentre:openBackupCentre,runBackupActionConfirmed:runBackupActionConfirmed,handleBackupReviewToggle:handleBackupReviewToggle,handleBackupReviewAction:handleBackupReviewAction,handleBackupAction:handleBackupAction}))return;var confirmCancel=e.target.closest('[data-backup-confirm-cancel]');if(confirmCancel){openBackupCentre();return}var confirmRun=e.target.closest('[data-backup-confirm-run]');if(confirmRun){runBackupActionConfirmed(confirmRun.dataset.backupConfirmRun);return}var toggle=e.target.closest('[data-backup-review-toggle]');if(toggle){handleBackupReviewToggle(toggle.dataset.backupReviewToggle);return}var reviewAction=e.target.closest('[data-backup-review-action]');if(reviewAction){handleBackupReviewAction(reviewAction.dataset.backupReviewAction);return}var action=e.target.closest('[data-backup-action]');if(action)handleBackupAction(action.dataset.backupAction);});qs('sv-fav-btn').addEventListener('click',function(){var s=songs.find(function(x){return x.id===state.selectedId});if(!s)return;setSongFavorite(s.id,!s.favorite);});var snq=qs('sl-notes-quick-btn');if(snq)snq.addEventListener('click',openSetNotes);var svNotes=qs('sv-notes-btn');if(svNotes)svNotes.addEventListener('click',openSongNotesSheet);var liveNotes=qs('live-tool-notes');if(liveNotes)liveNotes.addEventListener('click',openSongNotesSheet);qs('sv-add-set-btn').addEventListener('click',openSetDestination);var sds=qs('set-destination-scope');if(sds&&!sds.dataset.ready){sds.dataset.ready='1';sds.addEventListener('click',function(e){var b=e.target.closest('[data-setdest-scope]');if(b)setSetDestinationScope(b.dataset.setdestScope)})};qs('sv-pad-btn').addEventListener('click',openPadSheet);qs('sv-play-btn').addEventListener('click',openPlaybackOptions);qs('sv-menu-btn').addEventListener('click',openSongMenu);qs('sv-key-down').addEventListener('click',function(){transposeSong(-1)});qs('sv-key-up').addEventListener('click',function(){transposeSong(1)});qs('sv-key-select').addEventListener('change',function(){transposeToKey(this.value)});qs('sv-focus-btn').addEventListener('click',function(){toggleFocusMode()});qs('pres-exit-btn').addEventListener('click',function(){toggleFocusMode(false)});qs('live-tool-main').addEventListener('click',toggleLiveToolsExpanded);qs('live-tool-view').addEventListener('click',cycleLiveViewMode);qs('live-tool-smaller').addEventListener('click',function(){stepSongText(-1)});qs('live-tool-larger').addEventListener('click',function(){stepSongText(1)});qs('live-tool-cues').addEventListener('click',toggleFocusCues);qs('live-tool-autoscroll').addEventListener('click',toggleAutoscrollPanel);qs('live-tool-metronome').addEventListener('click',toggleMetronomePanel);qs('pres-auto-toggle').addEventListener('click',function(){toggleAutoscroll();});qs('pres-auto-slower').addEventListener('click',function(){adjustAutoscrollSpeed(-.1);});qs('pres-auto-faster').addEventListener('click',function(){adjustAutoscrollSpeed(.1);});qs('metro-toggle').addEventListener('click',function(){toggleMetronome();});qs('metro-bpm-down').addEventListener('click',function(){adjustMetronomeBpm(-1);});qs('metro-bpm-up').addEventListener('click',function(){adjustMetronomeBpm(1);});qs('metro-tap').addEventListener('click',tapMetronomeTempo);var smc=qs('song-menu-close');if(smc)smc.addEventListener('click',closeSongMenu);qs('song-menu-done').addEventListener('click',closeSongMenu);var tsm=qs('text-size-menu-slider');if(tsm)tsm.addEventListener('input',function(){updateSetting('textSize',String(Math.max(.85,Math.min(1.25,(parseInt(this.value,10)||100)/100))),true);this.style.setProperty('--pct',Math.max(0,Math.min(100,((parseInt(this.value,10)||100)-85)/40*100))+'%');var v=qs('text-size-menu-val');if(v)v.textContent=this.value+'%';renderSongSheet()});var rail=qs('pres-section-rail');if(rail)rail.addEventListener('click',function(e){var b=e.target.closest('[data-section-jump]');if(b)jumpToSongSection(b.dataset.sectionJump)});qs('bs-song-menu').addEventListener('click',function(e){if(e.target===this)closeSongMenu();var a=e.target.closest('[data-song-action]');if(a)handleSongMenuAction(a.dataset.songAction)});var cd=qs('bs-chord-diagrams');if(cd&&!cd.dataset.ready){cd.dataset.ready='1';cd.addEventListener('click',function(e){var tab=e.target.closest&&e.target.closest('[data-chord-diagram-tab]');if(tab){e.preventDefault();e.stopPropagation();chordDiagramMode=tab.dataset.chordDiagramTab||'guitar';renderChordDiagramCards();return}if(e.target===cd||e.target.id==='chord-diagrams-close'||e.target.id==='chord-diagrams-done')closeChordDiagramsSheet()})};var pb=qs('bs-playback');if(pb)pb.addEventListener('click',function(e){if(e.target===this||e.target.id==='playback-close'||e.target.id==='playback-cancel'){closePlaybackOptions();return}var btn=e.target.closest('[data-playback-index]');if(btn){var links=collectPlaybackLinks(activeSong()),link=links[parseInt(btn.dataset.playbackIndex,10)];closePlaybackOptions();if(link&&link.url)setTimeout(function(){openExternalPlaybackUrl(link.url)},60)}});var padSheet=qs('bs-pad');if(padSheet)padSheet.addEventListener('click',function(e){if(e.target===this||e.target.id==='pad-close'||e.target.id==='pad-cancel'){closePadSheet();return}handlePadSheetClick(e)});qs('sv-scroll').addEventListener('scroll',function(){updateRailFromScroll();wakeLiveChrome()},{passive:true});qs('song-view').addEventListener('pointerdown',function(){wakeLiveChrome()},{passive:true});installPullToRefresh();installBottomSheetDrag();installSongSwipeBack();installSetListNotes();installBibleControls();installToolsSwipeBack();installSetListSwipeBack();installWorkspaceSwipeBack();installWorkspaceControls();installUniversalEdgeSwipeBack();installExportControls();installImportEditorControls();
var toolsDom=window.WBToolsDomController;
if(toolsDom&&toolsDom.bindTools){
  var actionAdapters=toolsActionAdapters()||{};
  toolsDom.bindTools(document,Object.assign({
    openBible:openToolsBible,
    openHome:function(){showToolsPanel('home')},
    showPanel:showToolsPanel,
    openToolPicker:openToolPicker,
    updateKeyCapo:updateToolsKeyCapo
  },actionAdapters));
}
var ap=qs('bs-admin-pin');if(ap&&!ap.dataset.ready){ap.dataset.ready='1';ap.addEventListener('click',function(e){if(e.target===ap||e.target.id==='admin-pin-cancel'||e.target.id==='admin-pin-close')closeAdminPinSheet()});var api=qs('admin-pin-input');if(api)api.addEventListener('keydown',function(e){if(e.key==='Enter')submitAdminPin()});var aps=qs('admin-pin-submit');if(aps)aps.addEventListener('click',submitAdminPin)};
(window.WBNavigationController?window.WBNavigationController.showTab(state.tab||'songs','startup'):switchTab(state.tab||'songs'));try{StartupLifecycle&&StartupLifecycle.syncLibraryFilterChips&&StartupLifecycle.syncLibraryFilterChips(state)}catch(e){} }

try{document.addEventListener('pointerdown',function(e){var b=e.target&&e.target.closest&&e.target.closest('.tab-btn[data-tab]');if(!b)return;if(e.pointerType==='mouse')return;(window.WBNavigationController?window.WBNavigationController.showTab(b.dataset.tab,'tab-pointer'):switchTab(b.dataset.tab));}, {passive:true});}catch(e){}
try{document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-setdest-create]');if(!b)return;e.preventDefault();if(typeof createSetFromDestinationScope==='function')createSetFromDestinationScope();},{passive:false});}catch(e){}
function fastTabSelectFromEvent(e){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.fastTabSelectFromEvent(globalSurfaceNavigationCtx(),e):false}
try{document.addEventListener('touchstart',fastTabSelectFromEvent,{capture:true,passive:false});document.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')return;fastTabSelectFromEvent(e)},{capture:true,passive:false});}catch(e){}


function installAdminDuplicateReviewHandlers(){
  var adup=qs('bs-admin-duplicates');
  if(!adup||adup.dataset.ready==='1')return;
  adup.dataset.ready='1';
  adup.addEventListener('click',function(e){
    var sel=e.target.closest&&e.target.closest('[data-dup-select]');
    if(sel){e.preventDefault();toggleManageSelection(sel.dataset.dupSelect);return}
    if(e.target.id==='admin-duplicates-select-extras'){e.preventDefault();selectDuplicateExtras();return}
    if(e.target===adup||e.target.id==='admin-duplicates-close'||e.target.id==='admin-duplicates-done'){e.preventDefault();closeAdminDuplicateReview();return}
  });
}
try{document.addEventListener('DOMContentLoaded',installAdminDuplicateReviewHandlers);setTimeout(installAdminDuplicateReviewHandlers,0)}catch(e){}
var aft=qs('bs-admin-firebase-tools');if(aft&&!aft.dataset.ready){aft.dataset.ready='1';aft.addEventListener('click',function(e){var btn=e.target.closest&&e.target.closest('[data-admin-firebase-action]');if(btn){handleAdminFirebaseAction(btn.dataset.adminFirebaseAction);return}if(e.target===aft||e.target.id==='admin-firebase-close'||e.target.id==='admin-firebase-done')closeAdminFirebaseTools()})};
try{installAdminDuplicateReviewHandlers();setTimeout(installAdminDuplicateReviewHandlers,0)}catch(e){}
try{var dv=qs('dup-review-view');if(dv&&!dv.dataset.ready){dv.dataset.ready='1';dv.addEventListener('click',function(e){if(e.target.id==='dup-review-back'){closeDuplicateReviewPage();return}var open=e.target.closest&&e.target.closest('[data-dup-open]');if(open){var s=songs.find(function(x){return x.id===open.dataset.dupOpen});if(s){closeDuplicateReviewPage();showSong(s,'library')}return}var sel=e.target.closest&&e.target.closest('[data-dup-select-group]');if(sel){selectDuplicateGroupExtras(sel.dataset.dupSelectGroup);return}var del=e.target.closest&&e.target.closest('[data-dup-delete-group]');if(del){deleteDuplicateGroupExtras(del.dataset.dupDeleteGroup);return}})}}catch(e){}

/* 7.77 navigation/button behaviour audit helpers */
function closeOpenBottomSheets(reason){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.closeOpenBottomSheets(globalSurfaceNavigationCtx(),reason):0}
function closeOpenFullPagesForRoute(reason){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.closeOpenFullPagesForRoute(globalSurfaceNavigationCtx(),reason):null}
function closeTopTransientSurface(reason){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.closeTopTransientSurface(globalSurfaceNavigationCtx(),reason):false}
function closeTransientsBeforeRouteChange(tab){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.closeTransientsBeforeRouteChange(globalSurfaceNavigationCtx(),tab):null}
function registerPhaseGNavigationScaffold(){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.registerPhaseGNavigationScaffold(globalSurfaceNavigationCtx()):false}

function installGlobalNavigationBehaviour(){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.installGlobalNavigationBehaviour(globalSurfaceNavigationCtx()):false}
try{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installGlobalNavigationBehaviour);else installGlobalNavigationBehaviour()}catch(e){}






















function legacyRuntimeAdapterCtx(){return {
  window:window,document:document,navigator:navigator,VERSION:VERSION,REBUILD_PHASE:REBUILD_PHASE,REBUILD_REFERENCE:REBUILD_REFERENCE,state:state,songs:songs,filteredSongs:filteredSongs,qsa:qsa,qs:qs,
  switchTab:switchTab,personalSets:personalSets,activeSetId:activeSetId,renderLibrary:renderLibrary,renderPersonalHome:renderPersonalHome,openSet:openSet,renderSetEditor:renderSetEditor,
  openExportView:openExportView,openExportPreview:openExportPreview,closeExportView:closeExportView,exportPageState:exportPageState,renderSettings:renderSettings,applySettings:applySettings,cloneSettings:cloneSettings,settings:settings,
  cloudState:cloudState,openWorkspaceHome:openWorkspaceHome,openWorkspaceSetLists:openWorkspaceSetLists,openWorkspacePublishSheet:openWorkspacePublishSheet,workspaceState:workspaceState,
  openBackupCentre:openBackupCentre,exportLocalBackup:exportLocalBackup,exportSongsBackup:exportSongsBackup,exportSetListsBackup:exportSetListsBackup,exportSettingsBackup:exportSettingsBackup,restoreEverythingFromData:restoreEverythingFromData,applyRestoreSelectionFromData:applyRestoreSelectionFromData,openBackupRestoreReview:openBackupRestoreReview,safeGet:safeGet,
  showToast:showToast,firebaseSongs:firebaseSongs,bibleRuntime:bibleRuntime,firebaseRuntime:firebaseRuntime,cloudGoogleClientId:cloudGoogleClientId,biblePackageReady:biblePackageReady,cloudFirebaseConfig:cloudFirebaseConfig,install:install
}}
if(LegacyRuntimeAdapterController.installHostPublicContracts)LegacyRuntimeAdapterController.installHostPublicContracts(legacyRuntimeAdapterCtx());



/* 8.13 consolidated runtime navigation: one active back route owner, no Workspace rescue handler. */
function WB09BackForActiveRoute(reason){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.backForActiveRoute(globalSurfaceNavigationCtx(),reason):false}
function installUniversalEdgeSwipeBack(){return window.WBGlobalSurfaceNavigationController?WBGlobalSurfaceNavigationController.installUniversalEdgeSwipeBack(globalSurfaceNavigationCtx()):false}

if(LegacyRuntimeAdapterController.installRuntimeHost)LegacyRuntimeAdapterController.installRuntimeHost(legacyRuntimeAdapterCtx());else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
