const CACHE='rjh-site-app-v68'; const DRG='rjh-drawings';   // the drawings sit in their own cache so an app update never throws them away
const FILES=['./','./index.html','./manifest.json','./icon-180.png','./icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==DRG).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
const isShell=u=>{ const p=new URL(u).pathname; return p.endsWith('/')||p.endsWith('/index.html'); };
// cache first, so the app opens straight away on a bad signal; the network copy refreshes the cache in the background
// and, if the app itself has changed, every open page is told so it can offer the update
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin)) return;
  if(new URL(e.request.url).pathname.indexOf('/drawings/')>=0){ // sheet images: kept once fetched, never refetched (a new revision has a new file name)
    e.respondWith(caches.open(DRG).then(c=>c.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(r=>{ if(r&&r.ok) c.put(e.request,r.clone()); return r; })))); return; }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(cached=>{
    const net=fetch(e.request).then(r=>{ if(r&&r.ok){ const copy=r.clone(); caches.open(CACHE).then(async c=>{
        if(cached&&isShell(e.request.url)){ const tag=x=>x.headers.get('etag')||x.headers.get('last-modified')||''; if(tag(cached)&&tag(r)&&tag(cached)!==tag(r)){ (await self.clients.matchAll()).forEach(cl=>cl.postMessage({type:'rjh-updated'})); } }
        c.put(e.request,copy); }); } return r; }).catch(()=>null);
    if(cached){ e.waitUntil(net); return cached; }
    return net.then(r=>r||caches.match('./index.html')); })); });
