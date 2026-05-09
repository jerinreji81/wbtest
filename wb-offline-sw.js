
const CACHE_NAME='worshipbase-offline-v7-29';
const CORE_ASSETS=[
  './',
  './manifest.webmanifest',
  './wb-offline-sw.js',
  './worshipbase_layered_fold_w_proper/app-icons/app-icon-180.png',
  './worshipbase_layered_fold_w_proper/app-icons/app-icon-192.png',
  './worshipbase_layered_fold_w_proper/app-icons/apple-touch-icon.png',
  './worshipbase_layered_fold_w_proper/png/worshipbase-mark-256.png',
  './worshipbase_layered_fold_w_proper/launch/launch-dark.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS.map(u=>new Request(u,{cache:'reload'}))).catch(()=>Promise.resolve())).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME&&k.startsWith('worshipbase-offline-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(resp=>{const clone=resp.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,clone)).catch(()=>{});return resp;}).catch(()=>caches.match(req).then(r=>r||caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(resp=>{const clone=resp.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,clone)).catch(()=>{});return resp;}).catch(()=>cached)));
});
