const CACHE='naegagyeokjang-v2.1';
const OFFLINE_URL='./?app=naegagyeokjang&v=2.1';
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const r=await fetch(OFFLINE_URL,{cache:'reload'});
      if(r.ok) await cache.put(OFFLINE_URL,r.clone());
    }catch(e){}
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('naegagyeokjang-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh.ok){
          const cache=await caches.open(CACHE);
          await cache.put(OFFLINE_URL,fresh.clone());
        }
        return fresh;
      }catch(e){
        return (await caches.match(OFFLINE_URL)) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    try{
      const fresh=await fetch(req,{cache:'no-store'});
      if(fresh.ok){
        const cache=await caches.open(CACHE);
        cache.put(req,fresh.clone());
      }
      return fresh;
    }catch(e){
      return (await caches.match(req)) || Response.error();
    }
  })());
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
