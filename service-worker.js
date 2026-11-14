// PWA El Dulce Sueño. Nunca intercepta ni almacena pedidos remotos.
const VERSION='dulce-sueno-v9-20261114';
const BASICOS=['./','./index.html','./css/styles.css','./js/app.js','./js/catalogo.js','./js/config.js','./js/integraciones.js','./js/storage.js','./data/productos.json','./manifest.webmanifest','./assets/local/portada-cafeteria.png','./assets/icons/icon-192.png','./assets/icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(BASICOS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dulce-sueno-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).then(response=>{
    if(response.ok){const copia=response.clone();caches.open(VERSION).then(cache=>cache.put(req,copia)).catch(()=>{});}
    return response;
  }).catch(()=>caches.match(req)));
});
