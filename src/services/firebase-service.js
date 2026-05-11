/* WorshipBase Phase E.2 Firebase/offline service boundary.
   Source of truth for Firebase SDK loading, Firebase config/path defaults,
   Realtime Database listeners, Firestore reads/writes, and cloud-safe cloning.
   App modules still own normalization/rendering; this service owns the Firebase boundary only. */
(function(root){
'use strict';

var DEFAULT_FIREBASE_CONFIG={
  apiKey:'AIzaSyAWHTEOh1lXkzq3kB24g3An6Aad54OMlN8',
  authDomain:'worshipbase-17d1b.firebaseapp.com',
  databaseURL:'https://worshipbase-17d1b-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:'worshipbase-17d1b',
  storageBucket:'worshipbase-17d1b.firebasestorage.app',
  messagingSenderId:'137901259240',
  appId:'1:137901259240:web:a1b3e3eecf6d72e049cc5d'
};
var DEFAULT_PATHS={
  songsPath:'songs',
  sharedSetsPath:'setlists',
  workspaceSetsCollection:'workspaceSets',
  workspaceProfileCollection:'workspaceMeta',
  workspaceProfileDocId:'default',
  bibleCollection:'bibleChapters'
};
var SDK_SCRIPTS=[
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];
var scriptPromises=Object.create(null);
var initPromise=null;
var authObserverAttached=false;

function storage(){return root.WBStorage||{}}
function clone(value){try{return JSON.parse(JSON.stringify(value))}catch(e){return value}}
function storageConfig(){var s=storage();return s&&s.readJson?s.readJson('wb_firebase_config',null):null}
function config(){
  if(root.WB_CLOUD_CONFIG&&root.WB_CLOUD_CONFIG.firebase)return root.WB_CLOUD_CONFIG.firebase;
  return storageConfig()||clone(DEFAULT_FIREBASE_CONFIG);
}
function paths(){
  var custom=(root.WB_CLOUD_CONFIG&&root.WB_CLOUD_CONFIG.paths)||{};
  return Object.assign({},DEFAULT_PATHS,custom||{});
}
function loadScript(src){
  if(scriptPromises[src])return scriptPromises[src];
  scriptPromises[src]=new Promise(function(resolve,reject){
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
  return scriptPromises[src];
}
function loadSdkScripts(){
  return SDK_SCRIPTS.reduce(function(p,src){return p.then(function(){return loadScript(src)})},Promise.resolve());
}
function ensureSdk(options){
  options=options||{};
  var cfg=options.config||config();
  if(!cfg)return Promise.reject(new Error('Firebase config is required.'));
  if(initPromise){
    return initPromise.then(function(firebase){attachAuthObserver(firebase,options.onAuthStateChanged);return firebase});
  }
  initPromise=loadSdkScripts().then(function(){
    if(!root.firebase)throw new Error('Firebase SDK unavailable');
    if(!root.firebase.apps.length)root.firebase.initializeApp(cfg);
    attachAuthObserver(root.firebase,options.onAuthStateChanged);
    return root.firebase;
  });
  return initPromise;
}
function attachAuthObserver(firebase,onAuthStateChanged){
  if(!firebase||!firebase.auth||authObserverAttached||typeof onAuthStateChanged!=='function')return;
  authObserverAttached=true;
  firebase.auth().onAuthStateChanged(function(user){
    try{onAuthStateChanged(user)}catch(e){try{console.warn('Firebase auth observer failed',e)}catch(_){}}
  });
}
function realtimeDb(options){
  options=options||{};
  return ensureSdk(options).then(function(firebase){
    if(!firebase.database)throw new Error('Cloud database unavailable');
    return firebase.database();
  });
}
function firestore(options){
  options=options||{};
  return ensureSdk(options).then(function(firebase){
    if(!firebase.firestore)throw new Error('Cloud database unavailable');
    return firebase.firestore();
  });
}
function listenRealtimeValue(path,onValue,onError,options){
  return realtimeDb(options).then(function(db){
    var ref=db.ref(path);
    ref.on('value',onValue,onError);
    return function detach(){try{ref.off('value',onValue)}catch(e){}};
  });
}
function readFirestoreCollection(collectionName,options){
  return firestore(options).then(function(db){return db.collection(collectionName).get()});
}
function readFirestoreDoc(collectionName,docId,options){
  return firestore(options).then(function(db){return db.collection(collectionName).doc(docId).get()});
}
function writeRealtimeValue(path,value,options){
  return realtimeDb(options).then(function(db){return db.ref(path).set(clone(value))});
}
function writeFirestoreDoc(collectionName,docId,value,options){
  options=options||{};
  return firestore(options).then(function(db){return db.collection(collectionName).doc(docId).set(clone(value),{merge:options.merge!==false})});
}
function online(){return root.navigator?root.navigator.onLine!==false:true}
function degradedReason(err){
  if(!online())return 'offline';
  if(err&&err.message)return err.message;
  return 'unavailable';
}
function resetForTests(){initPromise=null;authObserverAttached=false;scriptPromises=Object.create(null)}

root.WBFirebaseService={
  DEFAULT_FIREBASE_CONFIG:DEFAULT_FIREBASE_CONFIG,
  DEFAULT_PATHS:DEFAULT_PATHS,
  SDK_SCRIPTS:SDK_SCRIPTS.slice(),
  config:config,
  paths:paths,
  loadScript:loadScript,
  ensureSdk:ensureSdk,
  realtimeDb:realtimeDb,
  firestore:firestore,
  listenRealtimeValue:listenRealtimeValue,
  readFirestoreCollection:readFirestoreCollection,
  readFirestoreDoc:readFirestoreDoc,
  writeRealtimeValue:writeRealtimeValue,
  writeFirestoreDoc:writeFirestoreDoc,
  cloudClone:clone,
  online:online,
  degradedReason:degradedReason,
  _resetForTests:resetForTests
};
})(window);
