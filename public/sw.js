// Nombre del cache - cambiar versión para forzar actualizaciones
const CACHE_NAME = 'san-camilo-v22';
const urlsToCache = [
  '/',
  '/index.html', // precache html shell para evitar pantalla blanca cuando no hay red
  '/manifest.json',
  '/logo-hospice.png'
];

// Instalar el service worker y cachear recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  // Forzar activación inmediata
  self.skipWaiting();
});

// Interceptar requests y servir desde cache si está disponible
self.addEventListener('fetch', (event) => {
  // Excluir Firebase Storage para evitar errores CORS
  if (event.request.url.includes('firebasestorage.googleapis.com')) {
    return; // Dejar que el navegador maneje Firebase Storage directamente
  }
  
  // 1) Para assets estáticos construidos por Vite: usar estrategia cache-first
  if (event.request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          });
      })
    );
    return;
  }

  // 2) Para las rutas de aplicación (shell) usar network-first con fallback al cache
  if (event.request.url.includes('/index.html') ||
      event.request.url === self.location.origin + '/' ||
      event.request.url.startsWith(self.location.origin + '/huespedes') ||
      event.request.url.startsWith(self.location.origin + '/partes')) {
    
    // Agregar headers para evitar cache del navegador
    const request = new Request(event.request.url, {
      method: event.request.method,
      headers: event.request.headers,
      mode: event.request.mode,
      credentials: event.request.credentials,
      cache: 'no-cache' // Forzar no cache pero permitimos fallback al cache precargado
    });
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Crear una nueva respuesta sin cache
          const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
              ...Object.fromEntries(response.headers.entries()),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          return newResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para otros recursos, usar cache primero
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar desde cache si está disponible
        if (response) {
          return response;
        }
        
        // Si no está en cache, hacer fetch de la red
        return fetch(event.request)
          .then((response) => {
            // No cachear si no es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Solo cachear recursos estáticos
            if (event.request.url.includes('/manifest.json') || 
                event.request.url.includes('/logo-hospice.png')) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          });
      })
  );
});

// Limpiar caches antiguos y notificar actualización
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // eliminar cache antiguo
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Notificar a todas las páginas abiertas sobre la actualización
      return self.clients.claim();
    })
  );
});

// Escuchar mensajes de la página principal
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Eliminado intervalo de actualización automática para reducir tráfico. 