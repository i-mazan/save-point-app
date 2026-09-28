const CACHE='save-point-v4';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png'];
const NETWORK_FIRST=/\.(html|js|css)$/;

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;

  const cacheAndReturn=response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  };

  if(url.pathname==='/'||NETWORK_FIRST.test(url.pathname)){
    // Always try the network first for the app shell so edits ship immediately; fall back to cache when offline.
    event.respondWith(fetch(event.request).then(cacheAndReturn).catch(()=>caches.match(event.request)));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(cacheAndReturn)));
});
