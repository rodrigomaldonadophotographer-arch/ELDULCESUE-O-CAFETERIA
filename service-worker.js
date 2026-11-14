
/*
 * EL DULCE SUEÑO
 * Actualización de PWA — V16
 *
 * Prioridad:
 * 1. Consultar internet.
 * 2. Usar caché únicamente si falla la conexión.
 * 3. Limpiar versiones antiguas.
 * 4. No almacenar respuestas de Supabase.
 */

const VERSION = 'dulce-sueno-v16-20261113';

const BASICOS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/catalogo.js',
  './js/promociones.js',
  './js/config.js',
  './js/integraciones.js',
  './js/storage.js',
  './data/productos.json',
  './manifest.webmanifest',
  './assets/local/portada-cafeteria.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './admin/',
  './admin/index.html',
  './admin/admin.js',
  './admin/admin.css'
];

// INSTALACIÓN
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(BASICOS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVACIÓN
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('dulce-sueno-') &&
            key !== VERSION
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// CONSULTA DE ARCHIVOS
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptar servicios externos.
  if (url.origin !== self.location.origin) return;

  // No almacenar datos privados ni peticiones API.
  if (
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/functions/v1/')
  ) {
    return;
  }

  // Siempre intentar obtener la versión nueva.
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(VERSION)
            .then(cache => cache.put(request, copy))
            .catch(() => {});
        }

        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);

        if (cached) return cached;

        // Solo el menú público tiene respaldo offline.
        if (
          request.mode === 'navigate' &&
          !url.pathname.includes('/admin')
        ) {
          const fallback = await caches.match(
            './index.html'
          );

          if (fallback) return fallback;
        }

        return Response.error();
      })
  );
});

// PERMITIR ACTIVAR UNA ACTUALIZACIÓN PENDIENTE
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
