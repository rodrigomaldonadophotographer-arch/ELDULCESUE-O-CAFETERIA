/* El Dulce Sueño · PWA V16. Nunca almacena respuestas de Supabase. */
const VERSION = 'dulce-sueno-v17-datos-20261114';
const BASICOS = [
  './', './index.html', './css/styles.css', './js/app.js',
  './js/catalogo.js', './js/promociones.js', './js/config.js',
  './js/integraciones.js', './js/storage.js', './js/actualizador.js', './js/sincronizar-catalogo.js',
  './data/productos.json', './manifest.webmanifest',
  './assets/local/portada-cafeteria.png',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './admin/index.html', './admin/admin.js', './admin/admin.css'
];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Un recurso opcional ausente no debe impedir instalar la actualización.
    await Promise.allSettled(BASICOS.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('dulce-sueno-') && key !== VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // El administrador nunca se guarda en caché: contiene interfaz privada.
  if (url.pathname.includes('/admin/')) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic' && !url.pathname.endsWith('/service-worker.js')) {
        const cache = await caches.open(VERSION);
        await cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const home = await caches.match('./index.html');
        if (home) return home;
      }
      return Response.error();
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});


/* Barrio Digital · Notificaciones push */

self.addEventListener('push', event => {
  let datos = {};

  try {
    datos = event.data ? event.data.json() : {};
  } catch (error) {
    console.warn('Notificación sin datos JSON válidos', error);
  }

  const titulo = datos.title || 'El Dulce Sueño';

  const opciones = {
    body: datos.body || 'Tenemos novedades para ti.',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    tag: datos.tag || 'bd-promocion',
    data: {
      url: './'
    }
  };

  event.waitUntil(
    self.registration.showNotification(titulo, opciones)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil((async () => {
    const destino = new URL('./', self.registration.scope).href;

    const ventanas = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    for (const ventana of ventanas) {
      if (ventana.url.startsWith(self.registration.scope)) {
        await ventana.focus();
        return;
      }
    }

    await clients.openWindow(destino);
  })());
});

