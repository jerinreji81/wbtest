/* WorshipBase Phase 2b - J3 Workspace cloud/runtime/backend owner.
   Owns Workspace Firebase listen/read/write fallback paths, Workspace profile cloud persistence,
   and cloud snapshot ingestion. The legacy shell remains a temporary host and supplies runtime
   callbacks through workspaceCloudCtx(). */
(function(root){
'use strict';

function arr(value){return Array.isArray(value)?value:[];}
function clone(value){try{return JSON.parse(JSON.stringify(value))}catch(e){return value;}}
function service(ctx){return ctx&&ctx.FirebaseService||root.WBFirebaseService||{};}
function setController(ctx){return ctx&&ctx.WorkspaceSetController||root.WBWorkspaceSetController||{};}
function config(ctx){return ctx&&typeof ctx.cloudFirebaseConfig==='function'?ctx.cloudFirebaseConfig():(service(ctx).config?service(ctx).config():null);}
function paths(ctx){return ctx&&typeof ctx.cloudFirestorePaths==='function'?ctx.cloudFirestorePaths():(service(ctx).paths?service(ctx).paths():{sharedSetsPath:'setlists',workspaceSetsCollection:'workspaceSets',workspaceProfileCollection:'workspaceMeta',workspaceProfileDocId:'default'});}
function call(ctx,name,args,fallback){if(ctx&&typeof ctx[name]==='function')return ctx[name].apply(null,args||[]);if(typeof fallback==='function')return fallback();}
function normalizeWorkspaceSet(ctx,raw,id){var c=setController(ctx);if(c&&c.normalizeSet)return c.normalizeSet(raw,id);if(ctx&&typeof ctx.normalizeWorkspaceSet==='function')return ctx.normalizeWorkspaceSet(raw,id);var set=Object.assign({id:id||String(Date.now())},raw||{});set.source='Workspace';return set;}
function recordsFromSnapshot(ctx,data){
  var c=setController(ctx);if(c&&c.recordsFromSnapshot)return c.recordsFromSnapshot(data);
  if(!data)return [];
  var out=[];
  if(Array.isArray(data)){data.forEach(function(v,idx){if(v&&typeof v==='object')out.push(normalizeWorkspaceSet(ctx,v,v.id||String(idx)));});return out;}
  if(typeof data==='object')Object.keys(data).forEach(function(key){var val=data[key];if(val&&typeof val==='object')out.push(normalizeWorkspaceSet(ctx,val,key));});
  return out;
}
function activeWorkspaceSet(ctx){var state=ctx&&ctx.workspaceState||{};return arr(state.sets).find(function(set){return set&&set.id===state.activeSetId;});}
function renderWorkspaceAfterSync(ctx){
  var state=ctx&&ctx.workspaceState||{},appState=ctx&&ctx.state||{};
  if(appState.tab==='workspace'){
    call(ctx,'renderWorkspaceSetLists',[]);
    if(state.panel==='detail'&&state.activeSetId){var set=activeWorkspaceSet(ctx);if(set)call(ctx,'renderWorkspaceSetDetail',[set]);}
  }
  call(ctx,'renderSettings',[]);
}
function applyWorkspaceCloudSnapshot(ctx,sets,profile){
  ctx=ctx||{};var state=ctx.workspaceState||{};
  state.sets=arr(sets).map(function(set){return normalizeWorkspaceSet(ctx,set,set&&set.id);});
  if(profile&&typeof profile==='object')state.profile=Object.assign({},state.profile||{},profile);
  if(ctx.firebaseRuntime)ctx.firebaseRuntime.lastWorkspaceSyncAt=new Date().toISOString();
  call(ctx,'persistWorkspace',[]);
  if(state.sets.length)call(ctx,'showSync',['Workspace synced']);
  renderWorkspaceAfterSync(ctx);
  return state.sets;
}
function setWorkspaceDetach(ctx,detach){
  if(ctx&&typeof ctx.setFirebaseSharedSetsDetach==='function')ctx.setFirebaseSharedSetsDetach(detach);
}
function hasWorkspaceDetach(ctx){return !!(ctx&&typeof ctx.getFirebaseSharedSetsDetach==='function'&&ctx.getFirebaseSharedSetsDetach());}
function loadWorkspaceRealtime(ctx){
  ctx=ctx||{};var svc=service(ctx),runtime=ctx.firebaseRuntime||{},p=paths(ctx);
  if(runtime.workspaceListening&&hasWorkspaceDetach(ctx))return Promise.resolve(ctx.workspaceState&&ctx.workspaceState.sets||[]);
  return new Promise(function(resolve,reject){
    var settled=false;
    var ok=function(snap){
      var data=snap&&typeof snap.val==='function'?snap.val():null;
      var sets=recordsFromSnapshot(ctx,data);
      runtime.workspaceListening=true;runtime.workspaceLoaded=true;runtime.lastWorkspaceSyncAt=new Date().toISOString();
      var out=applyWorkspaceCloudSnapshot(ctx,sets,null);
      if(!settled){settled=true;resolve(out);}
    };
    var fail=function(err){
      runtime.workspaceListening=false;
      var current=ctx.workspaceState&&ctx.workspaceState.sets||[];
      if(current.length){call(ctx,'renderSettings',[]);if(!settled){settled=true;resolve(current);}return;}
      if(!settled){settled=true;reject(err||new Error('Could not load workspace sets'));}
    };
    if(!svc.listenRealtimeValue){fail(new Error('Firebase service unavailable'));return;}
    svc.listenRealtimeValue(p.sharedSetsPath||'setlists',ok,fail,{config:config(ctx)}).then(function(detach){
      setWorkspaceDetach(ctx,function(){runtime.workspaceListening=false;try{detach&&detach();}catch(e){}});
    }).catch(fail);
  });
}
function firestoreSetRows(ctx,snapshot){
  var out=[];
  if(snapshot&&typeof snapshot.forEach==='function')snapshot.forEach(function(doc){out.push(normalizeWorkspaceSet(ctx,doc.data&&doc.data(),doc.id));});
  return out;
}
function firestoreProfile(ctx,doc){return doc&&doc.exists&&typeof doc.data==='function'?doc.data():null;}
function loadWorkspaceFirestoreFallback(ctx){
  ctx=ctx||{};var svc=service(ctx),p=paths(ctx),cfg=config(ctx);
  var collectionRead=svc.readFirestoreCollection?svc.readFirestoreCollection(p.workspaceSetsCollection,{config:cfg}):call(ctx,'firebaseFirestore',[],function(){return Promise.reject(new Error('Firestore unavailable'));}).then(function(db){return db.collection(p.workspaceSetsCollection).get();});
  var profileRead=svc.readFirestoreDoc?svc.readFirestoreDoc(p.workspaceProfileCollection,p.workspaceProfileDocId,{config:cfg}).catch(function(){return null;}):call(ctx,'firebaseFirestore',[],function(){return Promise.reject(new Error('Firestore unavailable'));}).then(function(db){return db.collection(p.workspaceProfileCollection).doc(p.workspaceProfileDocId).get().catch(function(){return null;});});
  return Promise.all([collectionRead,profileRead]).then(function(res){
    return applyWorkspaceCloudSnapshot(ctx,firestoreSetRows(ctx,res[0]),firestoreProfile(ctx,res[1]));
  }).catch(function(){return ctx.workspaceState&&ctx.workspaceState.sets||[];});
}
function loadFirebaseWorkspaceRuntime(ctx){return loadWorkspaceRealtime(ctx).catch(function(){return loadWorkspaceFirestoreFallback(ctx);});}
function syncWorkspaceSetToFirebase(ctx,set){
  ctx=ctx||{};if(!set||!set.id||!config(ctx))return Promise.resolve();
  var svc=service(ctx),p=paths(ctx),cfg=config(ctx),payload=svc.cloudClone?svc.cloudClone(set):clone(set);
  if(svc.writeRealtimeValue){
    return svc.writeRealtimeValue((p.sharedSetsPath||'setlists')+'/'+encodeURIComponent(set.id),payload,{config:cfg}).catch(function(){
      return svc.writeFirestoreDoc?svc.writeFirestoreDoc(p.workspaceSetsCollection,set.id,payload,{config:cfg,merge:true}).catch(function(){}):call(ctx,'firebaseFirestore',[],function(){return Promise.reject(new Error('Firestore unavailable'));}).then(function(db){return db.collection(p.workspaceSetsCollection).doc(set.id).set(payload,{merge:true});}).catch(function(){});
    });
  }
  return call(ctx,'firebaseRealtimeDb',[],function(){return Promise.reject(new Error('Realtime Database unavailable'));}).then(function(db){return db.ref((p.sharedSetsPath||'setlists')+'/'+encodeURIComponent(set.id)).set(payload);}).catch(function(){
    return call(ctx,'firebaseFirestore',[],function(){return Promise.reject(new Error('Firestore unavailable'));}).then(function(db){return db.collection(p.workspaceSetsCollection).doc(set.id).set(payload,{merge:true});}).catch(function(){});
  });
}
function syncWorkspaceProfileToFirebase(ctx,profile){
  ctx=ctx||{};if(!profile||!config(ctx))return Promise.resolve();
  var svc=service(ctx),p=paths(ctx),cfg=config(ctx),payload=svc.cloudClone?svc.cloudClone(profile):clone(profile);
  if(svc.writeFirestoreDoc)return svc.writeFirestoreDoc(p.workspaceProfileCollection,p.workspaceProfileDocId,payload,{config:cfg,merge:true}).catch(function(){});
  return call(ctx,'firebaseFirestore',[],function(){return Promise.reject(new Error('Firestore unavailable'));}).then(function(db){return db.collection(p.workspaceProfileCollection).doc(p.workspaceProfileDocId).set(payload,{merge:true});}).catch(function(){});
}
function detachWorkspaceRuntime(ctx){var detach=ctx&&typeof ctx.getFirebaseSharedSetsDetach==='function'?ctx.getFirebaseSharedSetsDetach():null;try{if(typeof detach==='function')detach();}catch(e){}setWorkspaceDetach(ctx,null);if(ctx&&ctx.firebaseRuntime)ctx.firebaseRuntime.workspaceListening=false;return true;}
function cloudContract(){return ['Workspace Firebase realtime listener ownership','Firestore fallback read ownership','Workspace profile cloud persistence','Workspace set cloud write fallback','cloud snapshot ingestion without render ownership'];}
function diagnostics(ctx){ctx=ctx||{};var state=ctx.workspaceState||{},runtime=ctx.firebaseRuntime||{};return {owner:'WBWorkspaceCloudController',sets:arr(state.sets).length,workspaceListening:!!runtime.workspaceListening,lastWorkspaceSyncAt:runtime.lastWorkspaceSyncAt||'',cloudContract:cloudContract()};}

root.WBWorkspaceCloudController={
  recordsFromSnapshot:recordsFromSnapshot,
  applyWorkspaceCloudSnapshot:applyWorkspaceCloudSnapshot,
  loadWorkspaceRealtime:loadWorkspaceRealtime,
  loadWorkspaceFirestoreFallback:loadWorkspaceFirestoreFallback,
  loadFirebaseWorkspaceRuntime:loadFirebaseWorkspaceRuntime,
  syncWorkspaceSetToFirebase:syncWorkspaceSetToFirebase,
  syncWorkspaceProfileToFirebase:syncWorkspaceProfileToFirebase,
  detachWorkspaceRuntime:detachWorkspaceRuntime,
  diagnostics:diagnostics,
  cloudContract:cloudContract
};
})(window);
