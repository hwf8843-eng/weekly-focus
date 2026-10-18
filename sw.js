const CACHE = 'weekly-focus-github-v2';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icon192.png','./icon512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    for(const asset of SHELL){
      const request=new Request(new URL(asset,self.registration.scope),{cache:'reload'});
      const response=await fetch(request);
      if(!response.ok||response.redirected||new URL(response.url).origin!==self.location.origin)throw Error('App shell unavailable');
      if(asset==='./'||asset==='./index.html'){
        const html=await response.clone().text();
        if(!html.includes('id="plan-form"')||!html.includes('WEEKLY FOCUS'))throw Error('App shell needs sign-in');
      }
      await cache.put(request,response);
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('weekly-focus-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!SHELL.some(p=>new URL(p,self.registration.scope).pathname===url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(event.request.mode==='navigate'){
      try{
        const response=await fetch(event.request,{signal:AbortSignal.timeout(5000)});
        if(response.ok&&!response.redirected){const html=await response.clone().text();if(html.includes('id="plan-form"'))await cache.put(event.request,response.clone());}
        if(response.ok||response.redirected)return response;
      }catch{}
      const saved=await cache.match(event.request)||await cache.match(new URL('./',self.registration.scope));
      return saved||new Response('首次使用请联网打开一周有序。',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
    }
    const saved=await cache.match(event.request);
    return saved||fetch(event.request);
  })());
});
